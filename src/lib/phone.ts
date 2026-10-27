import { DEFAULT_COUNTRY_CODE } from "@/config/app";

/**
 * Normalises an Indian phone number to digits with country code
 * (e.g. "098765 43210" -> "919876543210"), the format wa.me expects.
 * Returns null if it doesn't look like a valid 10-digit mobile/landline.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = DEFAULT_COUNTRY_CODE + digits;
  if (digits.length !== 12 || !digits.startsWith(DEFAULT_COUNTRY_CODE)) return null;
  return digits;
}

/** "919876543210" -> "+91 98765 43210" */
export function formatPhone(phone: string): string {
  const local = phone.slice(-10);
  return `+${phone.slice(0, -10)} ${local.slice(0, 5)} ${local.slice(5)}`;
}
