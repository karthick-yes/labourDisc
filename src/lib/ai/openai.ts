import "server-only";

// Thin OpenAI client over fetch (server-side only; the key never reaches the
// browser). Two calls: speech-to-text and structured JSON extraction.

const API = "https://api.openai.com/v1";
const TIMEOUT_MS = 45_000;

function key() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("OPENAI_API_KEY is not set");
  return k;
}

export type Usage = { inputTokens?: number; outputTokens?: number };

/** transcribe(audio, languageHint) -> text (brief §5). */
export async function transcribe(
  audio: Blob,
  opts: { model: string; languageHint?: string; filename?: string },
): Promise<{ text: string; usage: Usage }> {
  const form = new FormData();
  form.append("file", audio, opts.filename ?? "voice.webm");
  form.append("model", opts.model);
  form.append("response_format", "json");
  if (opts.languageHint) form.append("language", opts.languageHint);
  const res = await fetch(`${API}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}` },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI transcription failed: ${res.status} ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as { text?: string; usage?: { input_tokens?: number; output_tokens?: number } };
  return {
    text: (json.text ?? "").trim(),
    usage: { inputTokens: json.usage?.input_tokens, outputTokens: json.usage?.output_tokens },
  };
}

/** Structured output via the Responses API with a strict JSON schema. */
export async function extractJson(opts: {
  model: string;
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<{ data: unknown; usage: Usage }> {
  const res = await fetch(`${API}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      input: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      text: { format: { type: "json_schema", name: opts.schemaName, schema: opts.schema, strict: true } },
      // Reasoning models: keep thinking (billed as output) to a minimum.
      ...(opts.model.startsWith("gpt-5") ? { reasoning: { effort: "minimal" } } : {}),
      max_output_tokens: 1500,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI extraction failed: ${res.status} ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as {
    output_text?: string;
    output?: { type: string; content?: { type: string; text?: string }[] }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text =
    json.output_text ??
    json.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text ??
    "";
  return {
    data: JSON.parse(text),
    usage: { inputTokens: json.usage?.input_tokens, outputTokens: json.usage?.output_tokens },
  };
}
