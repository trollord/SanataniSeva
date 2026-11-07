import { z } from "zod";

// Country codes offered in phone inputs. India first (default market),
// followed by common NRI locations.
export const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
] as const;

// National-number length per country code (min, max digits)
const NATIONAL_LENGTHS: Record<string, [number, number]> = {
  "+91": [10, 10],
  "+971": [8, 9],
  "+65": [8, 8],
  "+44": [10, 10],
  "+1": [10, 10],
  "+61": [9, 9],
};

/** Split a full number ("+919876543210") into country code and national part. */
export function splitPhone(full: string): { code: string; national: string } {
  const codes = COUNTRY_CODES.map((c) => c.code).sort((a, b) => b.length - a.length);
  for (const code of codes) {
    if (full.startsWith(code)) return { code, national: full.slice(code.length) };
  }
  return { code: "+91", national: full.replace(/\D/g, "") };
}

/**
 * Validate a full phone number in E.164 form ("+<code><number>").
 * Returns an error message, or null when valid.
 */
export function validatePhone(full: string): string | null {
  const v = full.trim();
  if (!v) return "Phone number is required";
  if (!/^\+[1-9]\d{6,14}$/.test(v)) {
    return "Enter the number with country code, e.g. +91 98765 43210";
  }
  const { code, national } = splitPhone(v);
  if (code === "+91" && !/^[6-9]\d{9}$/.test(national)) {
    return "Enter a valid 10-digit Indian mobile number";
  }
  const range = NATIONAL_LENGTHS[code];
  if (range && (national.length < range[0] || national.length > range[1])) {
    const country = COUNTRY_CODES.find((c) => c.code === code)?.country ?? code;
    return `Enter a valid ${country} phone number`;
  }
  return null;
}

export const phoneSchema = z
  .string()
  .trim()
  .superRefine((v, ctx) => {
    const err = validatePhone(v);
    if (err) ctx.addIssue({ code: "custom", message: err });
  });

/** Accepts empty string / undefined, otherwise applies full phone validation. */
export const optionalPhoneSchema = z.union([z.literal(""), phoneSchema]).optional();
