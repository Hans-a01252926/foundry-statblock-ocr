import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Media types Claude's vision accepts
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type Media = (typeof ALLOWED)[number];

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No image uploaded" }, { status: 400 });

    const mediaType = file.type as Media;
    if (!ALLOWED.includes(mediaType)) {
      return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 400 });
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",          // cheap + good; switch to claude-sonnet-4-6 if accuracy slips
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const text = msg.content.find((b) => b.type === "text")?.text ?? "";
    return NextResponse.json({ result: text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to parse statblock" }, { status: 500 });
  }
}

const PROMPT = `You are reading an image of a Dungeons & Dragons 5th Edition monster/NPC statblock.
Transcribe it into clean, standard JSON text in the format used by the Foundry VTT statblock importer, following these strict rules:

Rules:
- Preserve every field: name, size/type/alignment, AC, HP (with dice), speed, the six ability scores
  with modifiers, saving throws, skills, senses, languages, challenge rating, traits, actions,
  bonus actions, reactions, and legendary actions if present.
- Use the canonical heading words ("Armor Class", "Hit Points", "Speed", "Challenge", etc.)
  so a downstream parser can read it.
- Do NOT invent values you cannot see. If a field is unreadable, omit it.
- Output ONLY the statblock text. No commentary, no markdown fences.`;