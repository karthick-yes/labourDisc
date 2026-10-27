// OpenAI prices used to estimate spend before and after each call. Update
// when OpenAI changes prices; unknown models fall back to the most expensive
// listed rate so estimates err high.
// Source: https://developers.openai.com/api/docs/pricing (checked 2026-10-26)

export type ModelPrice = {
  perMinuteUsd?: number; // transcription
  inputPer1MUsd?: number;
  outputPer1MUsd?: number;
};

export const AI_PRICING: Record<string, ModelPrice> = {
  // Transcription
  "gpt-4o-mini-transcribe": { perMinuteUsd: 0.003, inputPer1MUsd: 1.25, outputPer1MUsd: 5 },
  "gpt-transcribe": { perMinuteUsd: 0.0045 },
  "gpt-4o-transcribe": { perMinuteUsd: 0.006, inputPer1MUsd: 2.5, outputPer1MUsd: 10 },
  "whisper-1": { perMinuteUsd: 0.006 },
  // Text (structured extraction)
  "gpt-5-nano": { inputPer1MUsd: 0.05, outputPer1MUsd: 0.4 },
  "gpt-4.1-nano": { inputPer1MUsd: 0.1, outputPer1MUsd: 0.4 },
  "gpt-4o-mini": { inputPer1MUsd: 0.15, outputPer1MUsd: 0.6 },
  "gpt-5-mini": { inputPer1MUsd: 0.25, outputPer1MUsd: 2 },
};

export const DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
export const DEFAULT_EXTRACT_MODEL = "gpt-5-nano";

// Pessimistic token budget for one extraction, used for the pre-call check.
export const EXTRACT_ESTIMATE_TOKENS = { input: 2500, output: 1500 };

const FALLBACK: Required<ModelPrice> = { perMinuteUsd: 0.006, inputPer1MUsd: 2.5, outputPer1MUsd: 10 };

export function priceFor(model: string): Required<ModelPrice> {
  return { ...FALLBACK, ...(AI_PRICING[model] ?? {}) };
}

export function transcriptionCost(model: string, seconds: number): number {
  return (priceFor(model).perMinuteUsd * Math.max(seconds, 1)) / 60;
}

export function tokenCost(model: string, input: number, output: number): number {
  const p = priceFor(model);
  return (input * p.inputPer1MUsd + output * p.outputPer1MUsd) / 1_000_000;
}
