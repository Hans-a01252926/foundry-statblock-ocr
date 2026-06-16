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
      max_tokens: 4096,
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
Transcribe it into a valid Foundry VTT dnd5e actor JSON document, following these strict rules:

Rules:
- Preserve every field visible in the image. Do NOT invent values. If a field is unreadable, omit it.
- size must be one of: "tiny" | "sm" | "med" | "lg" | "huge" | "grg"
- Ability score saving throw proficiency: set system.abilities.[key].proficient to 1 if a save bonus is listed, else 0.
- Skill proficiency values: 0 = none, 1 = proficient, 2 = expertise.
- CR as a number: 1/8 → 0.125, 1/4 → 0.25, 1/2 → 0.5, otherwise use the integer.
- Traits (passive features), actions, bonus actions, reactions, and legendary actions each become
  an entry in the top-level "items" array with type "feat". Weapons may use type "weapon".
- Output ONLY the JSON object. No commentary, no markdown fences.

Example output for a Goblin:
{
  "name": "Goblin",
  "type": "npc",
  "system": {
    "abilities": {
      "str": { "value": 8,  "proficient": 0, "bonuses": {"check": "", "save": ""} },
      "dex": { "value": 14, "proficient": 0, "bonuses": {"check": "", "save": ""} },
      "con": { "value": 10, "proficient": 0, "bonuses": {"check": "", "save": ""} },
      "int": { "value": 10, "proficient": 0, "bonuses": {"check": "", "save": ""} },
      "wis": { "value": 8,  "proficient": 0, "bonuses": {"check": "", "save": ""} },
      "cha": { "value": 8,  "proficient": 0, "bonuses": {"check": "", "save": ""} }
    },
    "attributes": {
      "ac":    { "flat": 15, "calc": "flat", "formula": "" },
      "hp":    { "value": 7, "min": 0, "max": 7, "temp": 0, "tempmax": 0, "formula": "2d6" },
      "speed": { "value": 30, "burrow": 0, "climb": 0, "fly": 0, "swim": 0, "units": "ft" }
    },
    "details": {
      "alignment": "neutral evil",
      "type": { "value": "humanoid", "subtype": "goblinoid", "swarm": "", "custom": "" },
      "cr": 0.25,
      "xp": { "value": 50 },
      "biography": { "value": "" }
    },
    "traits": {
      "size": "sm",
      "languages": { "value": ["common", "goblin"], "custom": "" },
      "senses": { "darkvision": 60, "blindsight": 0, "tremorsense": 0, "truesight": 0, "units": "ft", "special": "" },
      "di": { "value": [], "custom": "" },
      "dr": { "value": [], "custom": "" },
      "dv": { "value": [], "custom": "" },
      "ci": { "value": [], "custom": "" }
    },
    "skills": {
      "ste": { "value": 1 }
    }
  },
  "items": [
    {
      "name": "Nimble Escape",
      "type": "feat",
      "system": {
        "description": { "value": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns." },
        "activation": { "type": "", "cost": null }
      }
    },
    {
      "name": "Scimitar",
      "type": "weapon",
      "system": {
        "description": { "value": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage." },
        "activation": { "type": "action", "cost": 1 },
        "actionType": "mwak",
        "attackBonus": "4",
        "damage": { "parts": [["1d6 + 2", "slashing"]] },
        "range": { "value": 5, "long": null, "units": "ft" }
      }
    },
    {
      "name": "Shortbow",
      "type": "weapon",
      "system": {
        "description": { "value": "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage." },
        "activation": { "type": "action", "cost": 1 },
        "actionType": "rwak",
        "attackBonus": "4",
        "damage": { "parts": [["1d6 + 2", "piercing"]] },
        "range": { "value": 80, "long": 320, "units": "ft" }
      }
    }
  ]
}`;