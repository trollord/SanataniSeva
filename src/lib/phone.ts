/**
 * Indian phone numbers: parse, validate, format.
 *
 * The numbering plan (DoT / TRAI):
 * - Country code is +91.
 * - Every geographic or mobile number is exactly 10 digits once the country
 *   code and the domestic trunk prefix "0" are removed.
 * - Mobile: 10 digits beginning 6, 7, 8 or 9.
 * - Landline: STD code + subscriber number = 10 digits. Metro STD codes are two
 *   digits (Delhi 11, Mumbai 22, Pune 20, Kolkata 33, Hyderabad 40, Chennai 44,
 *   Ahmedabad 79, Bengaluru 80); smaller towns use three or four. Dialled
 *   domestically with a leading 0, so Mumbai reads 022 XXXX XXXX.
 * - Toll-free numbers begin 1800.
 * - Emergency and helpline short codes (100 police, 101 fire, 102 ambulance,
 *   108, 112, 14567 senior citizens) are 3-5 digits and carry no prefix at all -
 *   they are not dialled with +91 and must not be rewritten into it.
 *
 * `extension` here is the dialling prefix: "+91" for mobiles, "022" for a
 * Mumbai landline, "1800" for toll-free, and empty for a short code.
 */

export type PhoneKind = "mobile" | "landline" | "tollfree" | "shortcode" | "invalid";

export interface ParsedPhone {
  /** Dialling prefix: "+91", "022", "1800", or "" for short codes. */
  extension: string;
  /** Local part, digits only. */
  number: string;
  kind: PhoneKind;
  /** Human-readable, e.g. "+91 98765 43210" or "022 2597 2040". */
  display: string;
  /** E.164 where one exists; short codes have none. */
  e164: string | null;
  valid: boolean;
  /** Why it failed, for admin-facing messages. */
  reason?: string;
}

/** STD codes that are two digits; everything else is treated as three. */
const METRO_STD = new Set(["11", "20", "22", "33", "40", "44", "79", "80"]);

const INVALID = (raw: string, reason: string): ParsedPhone => ({
  extension: "",
  number: raw.replace(/\D/g, ""),
  kind: "invalid",
  display: raw.trim(),
  e164: null,
  valid: false,
  reason,
});

/** Groups a landline subscriber number: 8 digits as 4+4, 7 as 3+4. */
function groupSubscriber(n: string): string {
  if (n.length === 8) return `${n.slice(0, 4)} ${n.slice(4)}`;
  if (n.length === 7) return `${n.slice(0, 3)} ${n.slice(3)}`;
  if (n.length === 6) return `${n.slice(0, 3)} ${n.slice(3)}`;
  return n;
}

/**
 * Parses anything an admin or the spreadsheet might contain: "98678 56939",
 * "+91 9867856939", "022-2597-2040", "0222597 2040", "100".
 */
export function parsePhone(raw: string): ParsedPhone {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return INVALID("", "Empty");

  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return INVALID(trimmed, "No digits");

  // Strip the country code however it was written (+91, 0091, 91…), but only
  // when what remains is still a plausible 10-digit national number - "9198…"
  // could legitimately be a mobile starting 91.
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 13 && digits.startsWith("091")) digits = digits.slice(3);
  else if (digits.length === 14 && digits.startsWith("0091")) digits = digits.slice(4);

  // Toll-free: 1800 then 6 or 7 digits.
  if (digits.startsWith("1800")) {
    const rest = digits.slice(4);
    if (rest.length < 6 || rest.length > 7) {
      return INVALID(trimmed, `Toll-free numbers are 1800 plus 6 or 7 digits (got ${rest.length})`);
    }
    const grouped =
      rest.length === 7 ? `${rest.slice(0, 3)} ${rest.slice(3)}` : `${rest.slice(0, 3)} ${rest.slice(3)}`;
    return {
      extension: "1800",
      number: rest,
      kind: "tollfree",
      display: `1800 ${grouped}`,
      e164: null,
      valid: true,
    };
  }

  // Short codes - checked before the 10-digit rules, and never given a +91.
  if (digits.length >= 3 && digits.length <= 5) {
    return {
      extension: "",
      number: digits,
      kind: "shortcode",
      display: digits,
      e164: null,
      valid: true,
    };
  }

  // Domestic trunk prefix.
  const hadTrunk = digits.startsWith("0");
  if (hadTrunk) digits = digits.replace(/^0+/, "");

  if (digits.length !== 10) {
    return INVALID(
      trimmed,
      `Indian numbers are 10 digits after the code; this has ${digits.length}`
    );
  }

  // Mobile.
  if (/^[6-9]/.test(digits)) {
    return {
      extension: "+91",
      number: digits,
      kind: "mobile",
      display: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
      e164: `+91${digits}`,
      valid: true,
    };
  }

  // Landline: split 10 digits into STD + subscriber.
  const stdLen = METRO_STD.has(digits.slice(0, 2)) ? 2 : 3;
  const std = digits.slice(0, stdLen);
  const subscriber = digits.slice(stdLen);
  return {
    extension: `0${std}`,
    number: subscriber,
    kind: "landline",
    display: `0${std} ${groupSubscriber(subscriber)}`,
    e164: `+91${std}${subscriber}`,
    valid: true,
  };
}

/**
 * Builds a display string from the two fields the admin form and the CSV use.
 * Round-trips with parsePhone, so `format(p.extension, p.number)` === p.display.
 */
export function formatPhone(extension: string, number: string): string {
  const ext = (extension ?? "").trim();
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (!ext) return digits; // short code
  return parsePhone(`${ext}${digits}`).display || `${ext} ${digits}`;
}

/** Convenience for list fields: normalises and drops anything unusable. */
export function normalisePhones(raw: string[]): {
  phones: string[];
  rejected: { raw: string; reason: string }[];
} {
  const phones: string[] = [];
  const rejected: { raw: string; reason: string }[] = [];
  for (const r of raw) {
    const p = parsePhone(r);
    if (p.valid) phones.push(p.display);
    else rejected.push({ raw: r, reason: p.reason ?? "Invalid" });
  }
  return { phones, rejected };
}

/** Dialling codes offered in the admin form. */
export const PHONE_EXTENSIONS = [
  { value: "+91", label: "+91 — mobile" },
  { value: "022", label: "022 — Mumbai / Thane landline" },
  { value: "020", label: "020 — Pune landline" },
  { value: "1800", label: "1800 — toll-free" },
  { value: "", label: "None — emergency / helpline short code" },
] as const;
