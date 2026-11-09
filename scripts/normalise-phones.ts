/**
 * Rewrites stored phone numbers into the canonical display format.
 *
 *   npx tsx scripts/normalise-phones.ts [--dry-run]
 *
 * Invalid entries are left exactly as they are rather than guessed at - a
 * directory that shows a confidently-formatted wrong number is worse than one
 * that shows the original. They are listed at the end for manual repair.
 */
import { PrismaClient } from "@prisma/client";
import { parsePhone } from "../src/lib/phone";

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const contacts = await prisma.communityContact.findMany({
    select: { id: true, name: true, phones: true },
  });

  const changes: { id: string; name: string; before: string[]; after: string[] }[] = [];
  const problems: { name: string; raw: string; reason: string }[] = [];

  for (const c of contacts) {
    const after = c.phones.map((raw) => {
      const p = parsePhone(raw);
      if (p.valid) return p.display;
      problems.push({ name: c.name, raw, reason: p.reason ?? "Invalid" });
      return raw; // keep as-is
    });
    if (JSON.stringify(after) !== JSON.stringify(c.phones)) {
      changes.push({ id: c.id, name: c.name, before: c.phones, after });
    }
  }

  const kinds = new Map<string, number>();
  contacts.flatMap((c) => c.phones).forEach((raw) => {
    const k = parsePhone(raw).kind;
    kinds.set(k, (kinds.get(k) ?? 0) + 1);
  });
  console.log("Phone kinds across", contacts.length, "contacts:");
  [...kinds].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${String(n).padStart(4)}  ${k}`));

  console.log(`\n${changes.length} contacts need reformatting. Samples:`);
  changes.slice(0, 8).forEach((c) =>
    console.log(`  ${c.name.slice(0, 26).padEnd(26)} ${JSON.stringify(c.before)} -> ${JSON.stringify(c.after)}`)
  );

  if (problems.length) {
    console.log(`\n${problems.length} numbers left untouched (cannot be formatted safely):`);
    problems.forEach((p) => console.log(`  ${p.name.slice(0, 26).padEnd(26)} ${JSON.stringify(p.raw)}  ${p.reason}`));
  }

  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
    return;
  }

  for (const c of changes) {
    await prisma.communityContact.update({ where: { id: c.id }, data: { phones: c.after } });
  }
  console.log(`\nUpdated ${changes.length} contacts.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
