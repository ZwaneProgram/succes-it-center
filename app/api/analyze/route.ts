import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

import { buildAnalyzePrompt, placementProfile } from "@/lib/ai-placement";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Security Device Placement AI",
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    // Category slug (= Product.type) decides where this device actually mounts.
    const category = (formData.get("category") as string) || null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const profile = placementProfile(category);

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const response = await client.chat.completions.create({
      model: "google/gemini-3.5-flash",
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: "text", text: buildAnalyzePrompt(profile) },
        ],
      }],
      // Headroom: this model spends part of the budget on reasoning tokens
      // before emitting the JSON, and 1500 truncated it mid-object.
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const raw = (response.choices[0]?.message?.content ?? "").trim();

    // Robust extraction: take the substring between the first { and last }
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const slice = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw;

    let parsed: { placements?: unknown };
    try {
      parsed = JSON.parse(slice);
    } catch {
      console.error("analyze: failed to parse JSON. Raw response:", raw.slice(0, 1000));
      return NextResponse.json(
        { error: `Could not parse analysis. Model returned: ${raw.slice(0, 200)}` },
        { status: 500 }
      );
    }

    if (!parsed.placements || !Array.isArray(parsed.placements)) {
      console.error("analyze: no placements array. Raw:", raw.slice(0, 1000));
      return NextResponse.json(
        { error: `No placements in response: ${raw.slice(0, 200)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ placements: parsed.placements });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
