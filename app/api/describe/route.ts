import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

import { buildDescribePrompt, placementProfile } from "@/lib/ai-placement";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Security Device Placement AI",
  },
});

/**
 * Re-reads ONE point the user dragged the marker to.
 *
 * The three analyze suggestions are only suggestions — once the marker moves,
 * their wording no longer matches the spot, and generating from the stale label
 * put the device back where the AI first proposed it. This route looks at the
 * user's actual coordinates and returns a fresh description to prompt with.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const category = (formData.get("category") as string) || null;
    const x = Number(formData.get("x"));
    const y = Number(formData.get("y"));

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return NextResponse.json({ error: "No point provided" }, { status: 400 });
    }

    const profile = placementProfile(category);

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const response = await client.chat.completions.create({
      model: "google/gemini-3.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            { type: "text", text: buildDescribePrompt(profile, x, y) },
          ],
        },
      ],
      // Same headroom as /api/analyze: this model spends part of the budget on
      // reasoning tokens before emitting the JSON.
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const raw = (response.choices[0]?.message?.content ?? "").trim();

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const slice = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw;

    let parsed: {
      position?: unknown;
      positionTh?: unknown;
      reason?: unknown;
      reasonTh?: unknown;
      warning?: unknown;
      warningTh?: unknown;
    };
    try {
      parsed = JSON.parse(slice);
    } catch {
      console.error("describe: failed to parse JSON. Raw:", raw.slice(0, 1000));
      return NextResponse.json(
        { error: `Could not read that spot. Model returned: ${raw.slice(0, 200)}` },
        { status: 500 }
      );
    }

    // The English label is the one thing the generate step cannot do without.
    if (typeof parsed.position !== "string" || !parsed.position.trim()) {
      console.error("describe: no position in response. Raw:", raw.slice(0, 1000));
      return NextResponse.json(
        { error: `No position in response: ${raw.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    return NextResponse.json({
      position: parsed.position.trim(),
      positionTh: str(parsed.positionTh),
      reason: str(parsed.reason),
      reasonTh: str(parsed.reasonTh),
      warning: str(parsed.warning),
      warningTh: str(parsed.warningTh),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
