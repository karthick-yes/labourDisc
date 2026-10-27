import { z } from "zod";

// Shared Zod schemas for form input.

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : (v ?? undefined);

/** Number from a form field. Empty/missing is rejected, not coerced to 0. */
const formNumber = () => z.preprocess(emptyToUndefined, z.coerce.number());

/** Optional number from a form field: empty -> null. */
export const optionalNumber = (min: number, max: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().min(min).max(max).optional()).transform((v) => v ?? null);

/** Optional trimmed text: empty -> null. */
export const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() || undefined : undefined),
    z.string().max(max).optional(),
  ).transform((v) => v ?? null);

export const locationSchema = z.object({
  lat: formNumber().pipe(z.number().min(-90).max(90)),
  lng: formNumber().pipe(z.number().min(-180).max(180)),
  areaName: z
    .string()
    .trim()
    .max(80)
    .transform((v) => v || null)
    .nullable()
    .catch(null),
});

/** Location where coordinates may be missing (e.g. an enterprise added by phone). */
export const optionalLocationSchema = z.object({
  lat: optionalNumber(-90, 90),
  lng: optionalNumber(-180, 180),
  areaName: optionalText(80),
});

export const DAILY_WAGE = { min: 100, max: 10000 } as const;
