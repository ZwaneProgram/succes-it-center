import { NextRequest, NextResponse } from "next/server";

import {
  buildGeneratePrompt,
  placementProfile,
  snapAspectRatio,
} from "@/lib/ai-placement";

const OR_KEY = process.env.OPENROUTER_API_KEY!;
// Which image-edit model composites the device into the room photo.
// Override with IMAGE_MODEL to A/B without a redeploy. Known-good options:
//
// Prices below are OpenRouter's IMAGE OUTPUT rate, which dominates the cost of
// a generation. Do not compare models on their prompt/input rate — that reads
// backwards (gemini-3-pro-image is $2/M in but $120/M out).
//
//   google/gemini-3-pro-image      CURRENT DEFAULT. The only model tested that
//                                  edits the photo instead of re-shooting it —
//                                  holds the crop, geometry, lighting, artwork
//                                  and the dooDeco watermark. $120/M out
//                                  (~$0.13 an image), the priciest, worth it.
//   google/gemini-3.1-flash-image  Flash tier, $60/M out. Newer gen than Pro.
//
//   Tested and rejected — every OpenAI image model RE-SHOOTS the room rather
//   than editing it (new canvas shape, re-zoomed, artwork redrawn, watermark
//   lost). They have no aspect_ratio knob to anchor the canvas, so the prompt
//   alone cannot hold the frame. Do not use these for the placement simulator:
//   openai/gpt-5-image             OpenAI flagship, $40/M out.
//   openai/gpt-5.4-image-2         Newer OpenAI gen, $30/M out.
//   openai/gpt-5-image-mini        OpenAI cheap tier, $8/M out.
//   google/gemini-2.5-flash-image  The original default. Re-synthesised the whole
//                                  frame instead of editing it — do not use.
const IMAGE_MODEL = process.env.IMAGE_MODEL || "google/gemini-3-pro-image";

// aspect_ratio lives under Gemini's own image_config knob. OpenAI's image models
// reject unknown body params, so this must only go out to Google's models.
const SUPPORTS_IMAGE_CONFIG = IMAGE_MODEL.startsWith("google/");
const OR_HEADERS = {
  Authorization: `Bearer ${OR_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "http://localhost:3000",
  "X-Title": "Security Device Placement AI",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const selectedPosition = formData.get("selectedPosition") as string;
    // Optional: a clean product reference shot (2nd product image, plain bg) so
    // the AI composites the exact model instead of a generic stand-in.
    const productImageUrl = (formData.get("productImageUrl") as string) || null;
    // Category slug (= Product.type) decides where this device actually mounts.
    const category = (formData.get("category") as string) || null;
    // Where the marker actually sits, as image percentages. Backs up the words
    // in selectedPosition when the user has dragged the marker themselves.
    const px = Number(formData.get("x"));
    const py = Number(formData.get("y"));
    const point =
      Number.isFinite(px) && Number.isFinite(py) ? { x: px, y: py } : null;
    // The uploaded photo's own width/height, measured in the browser. Without
    // it the model invents a canvas and re-shoots the room to fill it.
    const aspectRatio = snapAspectRatio(Number(formData.get("aspect")));
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const profile = placementProfile(category);
    const imagePrompt = buildGeneratePrompt(
      profile,
      selectedPosition,
      Boolean(productImageUrl),
      point
    );

    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      { type: "text", text: imagePrompt },
      { type: "image_url", image_url: { url: dataUrl } }, // room photo (first)
    ];
    // The product reference goes second so the prompt's "SECOND image" lines up.
    if (productImageUrl) {
      content.push({ type: "image_url", image_url: { url: productImageUrl } });
    }

    // Gemini's image models return images via the CHAT endpoint in
    // message.images[], NOT the /images endpoint. Request the modality explicitly.
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: OR_HEADERS,
      body: JSON.stringify({
        model: IMAGE_MODEL,
        modalities: ["image", "text"],
        messages: [{ role: "user", content }],
        // Gemini's own image knob. OpenRouter does not list it under these
        // models' supported_parameters, but passes it through to the provider.
        // Without it the model invents a canvas and re-shoots the room to fill
        // it. OpenAI models get no equivalent — the prompt has to carry it.
        ...(aspectRatio && SUPPORTS_IMAGE_CONFIG
          ? { image_config: { aspect_ratio: aspectRatio } }
          : {}),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Image generation failed for ${IMAGE_MODEL} (${res.status}): ${text.slice(0, 400)}`,
        },
        { status: 500 }
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: `API returned non-JSON (${text.length} chars): ${text.slice(0, 300)}` },
        { status: 500 }
      );
    }

    // Extract generated image from message.images[].image_url.url (Gemini's format)
    const j = json as {
      choices?: Array<{
        message?: {
          images?: Array<{ image_url?: { url?: string }; type?: string }>;
          content?: string;
        };
      }>;
    };
    const msg = j?.choices?.[0]?.message;
    let generatedImage = msg?.images?.[0]?.image_url?.url;

    // Fallback: some responses embed a data URL inside the text content
    if (!generatedImage && msg?.content) {
      const m = msg.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (m) generatedImage = m[0];
    }

    if (!generatedImage) {
      console.error(`No image in ${IMAGE_MODEL} response:`, text.slice(0, 800));
      return NextResponse.json(
        { error: `No image returned. Response preview: ${text.slice(0, 300)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ generatedImage, model: IMAGE_MODEL });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
