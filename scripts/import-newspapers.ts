/**
 * Publishes a newspaper PDF: uploads it to S3 and creates the Newsletter row.
 *
 *   npx tsx scripts/import-newspapers.ts <file.pdf> <title> <YYYY-MM-DD> [--draft]
 *
 * Why this exists rather than the admin form: the form POSTs the whole file to
 * /api/admin/newsletter, and a Vercel serverless function caps its request body
 * at 4.5 MB. A real edition of this paper is 20-30 MB, so that route can only
 * ever work locally. Until it uploads straight to S3 the way the image dropzone
 * does, editions are loaded from here.
 *
 * Page count is read from the PDF itself, so it cannot drift from the file.
 */
import { PDFDocument } from "pdf-lib";
import { readFile } from "fs/promises";
import { basename } from "path";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { uploadBufferToS3 } from "../src/lib/s3";

const prisma = new PrismaClient();

async function main() {
  const [file, title, date] = process.argv.slice(2);
  const draft = process.argv.includes("--draft");

  if (!file || !title || !date) {
    console.error("Usage: tsx scripts/import-newspapers.ts <file.pdf> <title> <YYYY-MM-DD> [--draft]");
    process.exit(1);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error(`Date must be YYYY-MM-DD, got "${date}"`);
    process.exit(1);
  }

  const buffer = await readFile(file);
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pageCount = pdf.getPageCount();

  // Re-running with the same title and date would otherwise stack duplicate
  // editions, each with its own orphaned object in the bucket.
  const existing = await prisma.newsletter.findFirst({
    where: { title, date: new Date(date) },
    select: { id: true },
  });
  if (existing) {
    console.log(`  skipped  ${title} - already present (${existing.id})`);
    return;
  }

  // The IAM user is scoped to sanatani-seva-folder/*, so anything written
  // outside that prefix is refused with a 403 at PutObject.
  const key = `sanatani-seva-folder/newspapers/${randomUUID()}.pdf`;
  const pdfUrl = await uploadBufferToS3(key, buffer, "application/pdf");

  const row = await prisma.newsletter.create({
    data: {
      title,
      date: new Date(date),
      pdfUrl,
      publicId: key,
      pageCount,
      status: draft ? "DRAFT" : "PUBLISHED",
    },
    select: { id: true, status: true },
  });

  console.log(
    `  ${row.status === "DRAFT" ? "draft  " : "live   "}  ${title.padEnd(32)} ` +
      `${date}  ${String(pageCount).padStart(2)}pp  ` +
      `${(buffer.length / 1048576).toFixed(1)}MB  ${basename(file)}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
