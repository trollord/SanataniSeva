/**
 * Copies every row from one Supabase project to another.
 *
 *   SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... npx tsx scripts/copy-database.ts [--dry-run]
 *
 * Used to move the database between regions, which Supabase cannot do in place -
 * a region change means a new project.
 *
 * The target must already have the schema: run `prisma migrate deploy` against
 * it first. This only moves data.
 *
 * Tables are copied parents-first so foreign keys hold at every step. Ids are
 * preserved, so BusSchedule.routeId, Account.userId and the rest keep pointing
 * at the right rows.
 */
import { PrismaClient } from "@prisma/client";

/** Parents before children. */
const ORDER = [
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "Location",
  "Property",
  "PropertyImage",
  "PriceHistory",
  "Inquiry",
  "Item",
  "ItemImage",
  "ItemInquiry",
  "AdminVerification",
  "CommunityContact",
  "NewsItem",
  "Newsletter",
  "BusRoute",
  "BusSchedule",
  "BusException",
] as const;

/**
 * Columns the database computes itself. Passing them to createMany is an error,
 * and they rebuild on insert anyway.
 */
const GENERATED: Record<string, string[]> = {
  CommunityContact: ["searchText"],
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL;

  if (!sourceUrl || !targetUrl) {
    console.error("Set both SOURCE_DATABASE_URL and TARGET_DATABASE_URL.");
    process.exit(1);
  }
  if (sourceUrl === targetUrl) {
    console.error("Source and target are the same database. Refusing.");
    process.exit(1);
  }

  const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = source as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = target as any;

  const model = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

  console.log(dryRun ? "DRY RUN - nothing will be written\n" : "Copying\n");
  let copied = 0;
  const report: { table: string; source: number; written: number; targetAfter: number }[] = [];

  for (const table of ORDER) {
    const m = model(table);
    const rows = await s[m].findMany();
    if (rows.length === 0) {
      report.push({ table, source: 0, written: 0, targetAfter: await t[m].count() });
      continue;
    }

    const drop = GENERATED[table] ?? [];
    const payload = rows.map((r: Record<string, unknown>) => {
      const copy = { ...r };
      drop.forEach((c) => delete copy[c]);
      return copy;
    });

    let written = 0;
    if (!dryRun) {
      // skipDuplicates makes the whole script safe to re-run after a failure.
      const res = await t[m].createMany({ data: payload, skipDuplicates: true });
      written = res.count;
    }
    copied += written;
    report.push({ table, source: rows.length, written, targetAfter: await t[m].count() });
  }

  console.log("  table                 source   written   target");
  for (const r of report) {
    if (r.source === 0 && r.targetAfter === 0) continue;
    console.log(
      `  ${r.table.padEnd(20)} ${String(r.source).padStart(6)} ${String(r.written).padStart(9)} ${String(r.targetAfter).padStart(8)}`
    );
  }

  const mismatched = report.filter((r) => r.source !== r.targetAfter);
  if (!dryRun) {
    console.log(`\nCopied ${copied} rows.`);
    if (mismatched.length) {
      console.log("\n!! Row counts differ - investigate before switching over:");
      mismatched.forEach((r) => console.log(`   ${r.table}: source ${r.source}, target ${r.targetAfter}`));
      process.exitCode = 1;
    } else {
      console.log("Every table matches the source.");
    }
  }

  await source.$disconnect();
  await target.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
