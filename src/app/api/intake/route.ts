import { randomBytes } from "node:crypto";
import { z } from "zod";
import { DEFAULT_EXTRACT_MODEL, DEFAULT_TRANSCRIBE_MODEL, EXTRACT_ESTIMATE_TOKENS, tokenCost, transcriptionCost } from "@/config/ai-pricing";
import { VOICE_MAX_BYTES, VOICE_MAX_SECONDS } from "@/config/limits";
import { SKILLS } from "@/config/skills";
import { extractJson, transcribe } from "@/lib/ai/openai";
import { needPrompt, needResult, needSchema, workerPrompt, workerResult, workerSchema } from "@/lib/ai/extract";
import { releaseAiCall, reserveAiCall, settleAiCall } from "@/lib/ai/usage";
import { getContractor } from "@/lib/auth/session";
import { mediaUrl, storage } from "@/lib/storage";

// Voice intake: audio -> transcript -> structured profile (or need).
// Every OpenAI call is checked against the caps first and recorded.

const LANG_HINTS = ["ml", "hi", "bn", "as"] as const;
const fields = z.object({
  kind: z.enum(["worker", "need"]),
  lang: z.enum(LANG_HINTS).optional().catch(undefined),
  seconds: z.coerce.number().min(0).max(VOICE_MAX_SECONDS + 5),
});

const fail = (reason: string, status = 200) => Response.json({ ok: false, reason }, { status });

export async function POST(req: Request) {
  const contractor = await getContractor();
  if (!contractor) return fail("unauthorized", 401);

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  const parsed = fields.safeParse({ kind: form?.get("kind"), lang: form?.get("lang") || undefined, seconds: form?.get("seconds") });
  if (!(audio instanceof File) || !parsed.success) return fail("bad_request", 400);
  if (audio.size > VOICE_MAX_BYTES) return fail("too_long", 413);
  // iOS Safari records AAC in MP4 and may label it video/mp4.
  const mime = audio.type.split(";")[0];
  if (!mime.startsWith("audio/") && mime !== "video/mp4") return fail("bad_request", 400);
  const { kind, lang } = parsed.data;

  const transcribeModel = process.env.OPENAI_TRANSCRIBE_MODEL || DEFAULT_TRANSCRIBE_MODEL;
  const extractModel = process.env.OPENAI_EXTRACT_MODEL || DEFAULT_EXTRACT_MODEL;
  // Reserve for the worst case (a full-length note); settle to actual usage after.
  const seconds = Math.min(parsed.data.seconds, VOICE_MAX_SECONDS);

  const r1 = await reserveAiCall({
    contractorId: contractor.id,
    kind: "transcribe",
    model: transcribeModel,
    estimateUsd: transcriptionCost(transcribeModel, VOICE_MAX_SECONDS),
    newIntake: true,
  });
  if (!r1.ok) return fail(r1.reason);

  let transcript: string;
  try {
    // OpenAI infers the format from the file name, so make sure it matches.
    const filename = mime.includes("mp4") || mime.includes("m4a") ? "voice.m4a" : mime.includes("ogg") ? "voice.ogg" : "voice.webm";
    const t = await transcribe(audio, { model: transcribeModel, languageHint: lang, filename });
    transcript = t.text;
    const tokenBased = t.usage.inputTokens != null ? tokenCost(transcribeModel, t.usage.inputTokens, t.usage.outputTokens ?? 0) : null;
    await settleAiCall(r1.id, {
      costUsd: tokenBased ?? transcriptionCost(transcribeModel, seconds),
      audioSeconds: seconds,
      inputTokens: t.usage.inputTokens,
      outputTokens: t.usage.outputTokens,
    });
  } catch (err) {
    console.error(err);
    await releaseAiCall(r1.id);
    return fail("ai_error");
  }
  if (!transcript) return fail("empty_transcript");

  const r2 = await reserveAiCall({
    contractorId: contractor.id,
    kind: "extract",
    model: extractModel,
    estimateUsd: tokenCost(extractModel, EXTRACT_ESTIMATE_TOKENS.input, EXTRACT_ESTIMATE_TOKENS.output),
    newIntake: false,
  });
  if (!r2.ok) return Response.json({ ok: false, reason: r2.reason, transcript });

  let settled = false;
  try {
    const skillIds = SKILLS.map((s) => s.id);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const out = await extractJson({
      model: extractModel,
      system: kind === "worker" ? workerPrompt(SKILLS) : needPrompt(SKILLS, today),
      user: `Transcript:\n${transcript}`,
      schemaName: kind === "worker" ? "worker_profile" : "enterprise_need",
      schema: kind === "worker" ? workerSchema(skillIds) : needSchema(skillIds),
    });
    await settleAiCall(r2.id, {
      costUsd: tokenCost(extractModel, out.usage.inputTokens ?? EXTRACT_ESTIMATE_TOKENS.input, out.usage.outputTokens ?? EXTRACT_ESTIMATE_TOKENS.output),
      inputTokens: out.usage.inputTokens,
      outputTokens: out.usage.outputTokens,
    });
    settled = true;

    const result = kind === "worker" ? workerResult.safeParse(out.data) : needResult.safeParse(out.data);
    if (!result.success) return Response.json({ ok: false, reason: "bad_extraction", transcript });

    // Keep the voice note with the worker record (brief §6 voice_note_url).
    const ext = mime.includes("ogg") ? ".ogg" : mime.includes("mp4") || mime.includes("m4a") ? ".m4a" : ".webm";
    const key = `${contractor.id}/voice/${randomBytes(8).toString("hex")}${ext}`;
    await storage.put(key, Buffer.from(await audio.arrayBuffer()), ext === ".m4a" ? "audio/mp4" : mime);

    return Response.json({ ok: true, transcript, result: result.data, voiceUrl: mediaUrl(key) });
  } catch (err) {
    console.error(err);
    if (!settled) await releaseAiCall(r2.id);
    return Response.json({ ok: false, reason: "ai_error", transcript });
  }
}
