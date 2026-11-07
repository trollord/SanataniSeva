/**
 * Imports the "Customer Master List" spreadsheet into CommunityContact.
 *
 *   npx tsx scripts/import-community-contacts.ts <path-to.xlsx> [--dry-run]
 *
 * The spreadsheet is deliberately NOT vendored into this repo: it is a few
 * hundred real phone numbers, and committing it (or a JSON copy) would put that
 * in git history forever. Pass the path; the database is the only store.
 *
 * Re-running is safe. Rows are matched on (name, phone) - or (name, category)
 * when the row has no number - and updated in place, so a corrected sheet can
 * simply be re-imported without duplicating or touching admin-added listings.
 *
 * Caveat: the match key includes the name, so changing a naming rule in this
 * script (not the sheet) makes the old row unmatchable and inserts a second
 * copy. Phone alone cannot be the key - some vendors genuinely share a number.
 * If you edit SERVICE_OVERRIDES or the name fallbacks, re-run and then delete
 * the rows still carrying the previous name.
 *
 * Expected columns: Sr. No | Category | Sub Category | Customer | Plot No. |
 * Area | Contact Person | Phone No.
 */

import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { COMMUNITY_CATEGORIES } from "../src/lib/community";

const prisma = new PrismaClient();

/* ── Category mapping ───────────────────────────────────────────────────────
 * The sheet carries 51 category strings with typos and overlaps. These collapse
 * onto the app taxonomy. Sub-category overrides come first, because a handful of
 * rows are filed under the wrong heading (a pest-control vendor under Health,
 * carpenters under Furniture).
 */
const SUB_OVERRIDES: Record<string, string> = {
  "health|pest control": "cleaning",
  "health|fitness": "classes",
  "health|physical exercise": "classes",
  "school|marshal art": "classes",
  "school|poilet training": "classes",
  "furniture|carpentar": "carpenter",
  "service|garden": "pets",
  "service|tempo local": "movers",
  "service|water proofing": "painter",
};

const CATEGORY_MAP: Record<string, string> = {
  // Health
  health: "health", hospital: "health", hopspital: "health",
  chemist: "health", medical: "health",
  // Schools & tuitions
  education: "tuition", school: "tuition",
  // Food & hospitality
  food: "food", returent: "food", hotel: "food", club: "food",
  // Property
  property: "property",
  // Emergency
  "emegency contact no": "emergency", "help line": "emergency",
  "blood bank": "emergency",
  // Carpenters & interiors
  furniture: "carpenter", interior: "carpenter", art: "carpenter",
  // Automobile
  automobile: "automobile",
  // Salon
  beauty: "salon", spa: "salon",
  // Classes & hobbies
  music: "classes", dance: "classes", yoga: "classes", liabrary: "classes",
  // Cleaning
  "pest control": "cleaning", cleaning: "cleaning",
  // Religious
  "religious trust": "religious", temple: "religious", shop: "religious",
  // Finance
  bank: "finance", finance: "finance", financial: "finance",
  // Appliances & building equipment
  ac: "appliance", "home appliances": "appliance", lift: "appliance",
  "genrator maintainance": "appliance", solar: "appliance",
  // Professional services
  liasioning: "professional", it: "professional", marketing: "professional",
  industry: "professional",
  // Trades
  electrician: "electrician", "electrical shop": "electrician",
  plumber: "plumber", "civil work repairing": "painter",
  // Pets, movers, retail
  pet: "pets", courrier: "movers",
  jewelers: "shopping", sports: "shopping",
};

/* ── Locality mapping ───────────────────────────────────────────────────────
 * `locality` is constrained to HIRANANDANI_LOCALITIES, which is shared with the
 * property listing forms, so it is not widened here. The sheet's Area column is
 * mostly building names inside the estate; three of them are genuine locality
 * values. The raw Area always lands in `address`, so bucketing loses nothing.
 */
const AREA_TO_LOCALITY: Record<string, string> = {
  meadows: "Hiranandani Meadows",
  rodas: "Rodas Enclave",
  "contract at rodas": "Rodas Enclave",
  "one hiranandani park": "One Hiranandani Park",
};

/** Areas that are genuinely outside the estate. */
const OUTSIDE = [
  "mulund", "andheri", "powai", "boriwali", "vartak nagar", "patlipada",
  "manpada", "brahamand", "waghbill", "baghwill", "wagle estate",
  "waghle estate", "kasar vadavali", "kolshet", "ovala", "thane",
  "pokhran road", "eastern highway", "vasant vihar", "anywhere",
  "gokul nagar", "palasia",
];

/** Typos worth fixing in the human-visible service line. */
const TYPOS: [RegExp, string][] = [
  [/\bReturent\b|\bResturent\b/gi, "Restaurant"],
  [/\bGenrator\b/gi, "Generator"],
  [/\bCourrier\b/gi, "Courier"],
  [/\bHopspital\b/gi, "Hospital"],
  [/\bLiabrary\b/gi, "Library"],
  [/\bCarpentar\b/gi, "Carpenter"],
  [/\bTutions\b/gi, "Tuitions"],
  [/\bInvesment\b/gi, "Investment"],
  [/\bAsthetics\b/gi, "Aesthetic"],
  [/\bMedician\b/gi, "Medicine"],
  [/\bVacsination\b/gi, "Vaccination"],
  [/\bGynology\b/gi, "Gynaecology"],
  [/\bPathlab\b/gi, "Path Lab"],
  [/\bMarshal Art\b/gi, "Martial Arts"],
  [/\bPoilet\b/gi, "Pilot"],
  [/\bWelnees\b/gi, "Wellness"],
  [/\bMaintainance\b|\bMaintainence\b/gi, "Maintenance"],
  [/\bEmegency\b/gi, "Emergency"],
  [/\bSpirtual\b/gi, "Spiritual"],
  [/\bPreschool\b/gi, "Pre-school"],
];

/* ── Service line ───────────────────────────────────────────────────────────
 * `service` is the description rendered under the name, so a bare sub-category
 * often reads wrong there - "Blum / New", "Decotham / Articles". These rewrite
 * the weak ones into something a resident can actually read.
 */
const SERVICE_OVERRIDES: Record<string, string> = {
  "furniture|new": "Furniture",
  "furniture|": "Furniture",
  "interior|": "Interior Design",
  "sports|articles": "Sports Goods",
  "courrier|local": "Local Courier",
  "help line|for ladies": "Women's Helpline",
  "help line|for senior citizen": "Senior Citizen Helpline",
  "health|children": "Child Specialist",
  "health|fatloss": "Fat Loss",
  "health|weight loss": "Weight Loss",
  "health|speech": "Speech Therapy",
  "pet|hostel": "Pet Boarding",
  "pet|clinic": "Pet Clinic",
  "pet|clinin": "Pet Clinic",
  "pet|grooming": "Pet Grooming",
  "shop|spirtual": "Spiritual Store",
  "service|garden": "Garden Maintenance",
  "service|tempo local": "Tempo Hire",
  "service|water proofing": "Waterproofing",
  "education|coaching": "Coaching Classes",
  "education|coaching class": "Coaching Classes",
  "financial|kapil jain": "Financial Services",
  "music|studio": "Music Studio",
  "dance|classes": "Dance Classes",
  "yoga|yoga class": "Yoga Classes",
  "jewelers|": "Jewellery",
  "cleaning|house/ office": "House & Office Cleaning",
  "property|broker": "Property Broker",
  "automobile|car": "Car Dealership",
  "it|computer/laptop": "Computer & Laptop Repair",
  "marketing|digital": "Digital Marketing",
};

/** Used when the row has no business name, so the sub-category became the name. */
const CATEGORY_SERVICE: Record<string, string> = {
  "emegency contact no": "Emergency Contact",
  "help line": "Helpline",
  automobile: "Automobile Service",
  marketing: "Marketing",
};

// Widened to string: the taxonomy is `as const`, so the inferred Set would be
// of literal keys and reject the arbitrary strings coming out of the sheet.
const VALID_KEYS: Set<string> = new Set(COMMUNITY_CATEGORIES.map((c) => c.key));

const clean = (v: unknown): string =>
  String(v ?? "").replace(/\s+/g, " ").trim();

const fixTypos = (s: string): string =>
  TYPOS.reduce((acc, [re, to]) => acc.replace(re, to), s);

function mapCategory(rawCat: string, rawSub: string): string {
  const key = SUB_OVERRIDES[`${rawCat.toLowerCase()}|${rawSub.toLowerCase()}`];
  if (key) return key;
  return CATEGORY_MAP[rawCat.toLowerCase()] ?? "";
}

function mapLocality(rawArea: string): string {
  const a = rawArea.toLowerCase();
  if (!a) return "Others";
  for (const [needle, loc] of Object.entries(AREA_TO_LOCALITY)) {
    if (a === needle || a.endsWith(` ${needle}`)) return loc;
  }
  if (OUTSIDE.some((o) => a.includes(o))) return "Others";
  return "Hiranandani Estate";
}

/** Splits "9876 54321/ 90000 11111" into a primary number and any alternates. */
function splitPhones(raw: string): { primary: string; alts: string[] } {
  const parts = raw
    .split("/")
    .map((p) => clean(p))
    .filter((p) => /\d/.test(p));
  return { primary: parts[0] ?? "", alts: parts.slice(1) };
}

/** Digit count that could plausibly be dialled in India. */
function isDialable(phone: string): boolean {
  const d = phone.replace(/\D/g, "");
  if (d.length >= 10 && d.length <= 13) return true;
  // Short codes: 100, 101, 108, 1800-series, 14567.
  if (d.length === 3 || d.length === 5 || d.length === 4) return true;
  if (d.startsWith("1800")) return true;
  return false;
}

type Row = Record<string, unknown>;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const file =
    args.find((a) => !a.startsWith("--")) ??
    `${process.env.HOME}/Downloads/Supplier Contact Nos..xlsx`;

  const wb = XLSX.readFile(file);
  const sheetName = wb.SheetNames[0];
  const rows: Row[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    defval: "",
    raw: false,
  });
  console.log(`Read ${rows.length} rows from "${sheetName}" in ${file}\n`);

  const prepared: {
    srNo: string;
    data: {
      name: string; contactPerson: string | null; category: string;
      service: string; phone: string; whatsapp: boolean; locality: string;
      address: string; hours: string; tags: string; verified: boolean;
      status: string; notes: string | null;
    };
    reason?: string;
  }[] = [];

  const unmapped: string[] = [];

  for (const r of rows) {
    const srNo = clean(r["Sr. No"]);
    const rawCat = clean(r["Category"]);
    const rawSub = clean(r["Sub Category"]);
    const customer = clean(r["Customer"]);
    const plot = clean(r["Plot No."]);
    const area = clean(r["Area"]);
    const person = clean(r["Contact Person"]);
    const rawPhone = clean(r["Phone No."]);

    if (!rawCat && !customer && !rawPhone) continue;

    const category = mapCategory(rawCat, rawSub);
    if (!category || !VALID_KEYS.has(category)) {
      unmapped.push(`Sr.${srNo} category="${rawCat}" sub="${rawSub}"`);
      continue;
    }

    // Name: the business, else the sub-category (true for the emergency rows,
    // where "Police" / "Ambulance" IS the name), else the person.
    const lc = `${rawCat.toLowerCase()}|${rawSub.toLowerCase()}`;
    const catService = CATEGORY_SERVICE[rawCat.toLowerCase()] ?? fixTypos(rawCat);

    // With no business name the sub-category has to serve as the name, so it
    // gets the readable rewrite ("for Ladies" -> "Women's Helpline") and the
    // category describes it. Naming and describing a row with the same word is
    // noise, so that case falls back to the category too.
    const name =
      customer || SERVICE_OVERRIDES[lc] || fixTypos(rawSub) || person || fixTypos(rawCat);

    let service = customer
      ? SERVICE_OVERRIDES[lc] ?? fixTypos(rawSub || rawCat)
      : catService;
    if (service.toLowerCase() === name.toLowerCase()) service = catService;
    const { primary, alts } = splitPhones(rawPhone);
    const address = [plot, area].filter(Boolean).join(", ");

    const tags = Array.from(
      new Set([rawCat, rawSub].filter(Boolean).map((t) => fixTypos(t)))
    );

    // Anything that cannot be safely dialled goes in as PENDING: invisible on
    // the public page, editable in /admin/community. Nothing is discarded.
    let status = "ACTIVE";
    let reason: string | undefined;
    if (!primary) {
      status = "PENDING";
      reason = "no phone number in the sheet";
    } else if (!isDialable(primary)) {
      status = "PENDING";
      reason = `phone has ${primary.replace(/\D/g, "").length} digits`;
    }

    const noteParts = [`Imported from "${sheetName}" (Sr. No ${srNo}).`];
    if (alts.length) noteParts.push(`Alt: ${alts.join(", ")}.`);
    if (reason) noteParts.push(`Needs review: ${reason}.`);

    prepared.push({
      srNo,
      reason,
      data: {
        name,
        contactPerson: person || null,
        category,
        service,
        phone: primary,
        whatsapp: false,
        locality: mapLocality(area),
        address,
        hours: "",
        tags: JSON.stringify(tags),
        verified: false,
        status,
        notes: noteParts.join(" "),
      },
    });
  }

  /* ── Report ───────────────────────────────────────────────────────────── */
  const byCat = new Map<string, number>();
  for (const p of prepared)
    byCat.set(p.data.category, (byCat.get(p.data.category) ?? 0) + 1);

  console.log("Category distribution:");
  for (const c of COMMUNITY_CATEGORIES) {
    const n = byCat.get(c.key) ?? 0;
    if (n) console.log(`  ${String(n).padStart(3)}  ${c.key.padEnd(13)} ${c.label}`);
  }
  const byLoc = new Map<string, number>();
  for (const p of prepared)
    byLoc.set(p.data.locality, (byLoc.get(p.data.locality) ?? 0) + 1);
  console.log("\nLocality distribution:");
  for (const [l, n] of [...byLoc].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(n).padStart(3)}  ${l}`);

  const pending = prepared.filter((p) => p.data.status === "PENDING");
  console.log(`\nPrepared ${prepared.length} rows — ${prepared.length - pending.length} ACTIVE, ${pending.length} PENDING:`);
  for (const p of pending)
    console.log(`  Sr.${p.srNo.padStart(3)}  ${p.data.name.slice(0, 34).padEnd(34)} ${p.reason}`);

  if (unmapped.length) {
    console.log(`\n!! ${unmapped.length} rows could not be mapped to a category:`);
    unmapped.forEach((u) => console.log("   " + u));
  }

  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
    return;
  }

  /* ── Write ────────────────────────────────────────────────────────────── */
  let created = 0;
  let updated = 0;
  for (const p of prepared) {
    const where = p.data.phone
      ? { name: p.data.name, phone: p.data.phone }
      : { name: p.data.name, category: p.data.category };
    const existing = await prisma.communityContact.findFirst({
      where,
      select: { id: true },
    });
    if (existing) {
      await prisma.communityContact.update({ where: { id: existing.id }, data: p.data });
      updated++;
    } else {
      await prisma.communityContact.create({ data: p.data });
      created++;
    }
  }

  const total = await prisma.communityContact.count();
  const active = await prisma.communityContact.count({ where: { status: "ACTIVE" } });
  console.log(`\nWrote ${created} new, updated ${updated}.`);
  console.log(`CommunityContact now holds ${total} rows (${active} ACTIVE).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
