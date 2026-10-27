import { z } from "zod";
import type { SkillSeed } from "@/config/skills";

// Prompts, JSON schemas and Zod validation for turning a voice-note
// transcript into a worker profile or an enterprise need.

const nullable = (type: string) => ({ type: [type, "null"] });

export function workerSchema(skillIds: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["name", "skills", "expected_wage", "home_state", "languages", "availability", "notes", "notes_ml"],
    properties: {
      name: nullable("string"),
      skills: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["skill_id", "years"],
          properties: { skill_id: { type: "string", enum: skillIds }, years: nullable("number") },
        },
      },
      expected_wage: nullable("integer"),
      home_state: nullable("string"),
      languages: { type: "array", items: { type: "string" } },
      availability: nullable("string"),
      notes: nullable("string"),
      notes_ml: nullable("string"),
    },
  };
}

export const workerResult = z.object({
  name: z.string().trim().max(80).nullable(),
  skills: z.array(z.object({ skill_id: z.string(), years: z.number().min(0).max(60).nullable() })).max(8),
  expected_wage: z.number().int().min(0).max(100000).nullable(),
  home_state: z.string().max(40).nullable(),
  languages: z.array(z.string().max(30)).max(8),
  availability: z.string().max(200).nullable(),
  notes: z.string().max(1000).nullable(),
  notes_ml: z.string().max(1000).nullable(),
});
export type WorkerExtraction = z.infer<typeof workerResult>;

export function needSchema(skillIds: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["skill_id", "count", "wage_offered", "start_date", "enterprise_name", "notes"],
    properties: {
      skill_id: { type: ["string", "null"], enum: [...skillIds, null] },
      count: nullable("integer"),
      wage_offered: nullable("integer"),
      start_date: nullable("string"),
      enterprise_name: nullable("string"),
      notes: nullable("string"),
    },
  };
}

export const needResult = z.object({
  skill_id: z.string().nullable(),
  count: z.number().int().min(1).max(100).nullable(),
  wage_offered: z.number().int().min(0).max(100000).nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().catch(null),
  enterprise_name: z.string().max(100).nullable(),
  notes: z.string().max(1000).nullable(),
});
export type NeedExtraction = z.infer<typeof needResult>;

function skillList(skills: SkillSeed[]) {
  return skills.map((s) => `- ${s.id}: ${s.en}; also called ${s.synonyms.join(", ")}`).join("\n");
}

export function workerPrompt(skills: SkillSeed[]) {
  return `You fill a worker profile for a labour contractor in Kerala, India, from a voice-note transcript.
The speaker is either the worker (Hindi, Bengali or Assamese) or the contractor summarising in Malayalam.
Map every skill the worker can do to one of these skill ids:
${skillList(skills)}
Rules:
- Use only facts stated in the transcript. Use null or [] when something is not said. Never guess a name.
- expected_wage is rupees per day as an integer (e.g. "बारह सौ" = 1200).
- years is experience in that skill; null if not said.
- home_state in English (e.g. "Assam", "West Bengal").
- languages in English names (e.g. "Hindi", "Bengali").
- notes: one short English sentence of anything else useful. notes_ml: the same in simple Malayalam.`;
}

export function needPrompt(skills: SkillSeed[], todayIso: string) {
  return `You fill an enterprise's staffing need for a labour contractor in Kerala, India, from a voice note (usually Malayalam).
Today is ${todayIso}. Map the worker type to one of these skill ids:
${skillList(skills)}
Rules:
- Use only facts stated. Use null when something is not said.
- count is how many workers; wage_offered is rupees per day as an integer.
- start_date as YYYY-MM-DD (resolve words like "naale"/tomorrow from today).
- enterprise_name: the shop or business name if said.
- notes: short English note of anything else (timings, food, stay).`;
}
