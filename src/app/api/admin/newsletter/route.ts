import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadBufferToS3 } from "@/lib/s3";
import { PDFDocument } from "pdf-lib";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = (form.get("title") as string)?.trim();
  const date = form.get("date") as string;

  if (!file || !title || !date) {
    return NextResponse.json({ error: "file, title and date are required" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF must be under 50 MB" }, { status: 400 });
  }

  let step = "buffer";
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("[newsletter] buffer read, size:", buffer.length);

    step = "pdf-lib";
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    console.log("[newsletter] pageCount:", pageCount);

    step = "s3-upload";
    const s3Key = `newspapers/${randomUUID()}.pdf`;
    const pdfUrl = await uploadBufferToS3(s3Key, buffer, "application/pdf");
    console.log("[newsletter] S3 upload ok:", pdfUrl);

    step = "db";
    const newsletter = await prisma.newsletter.create({
      data: {
        title,
        date: new Date(date),
        pdfUrl,
        publicId: s3Key,
        pageCount,
        status: "PUBLISHED",
      },
      select: { id: true },
    });

    revalidatePath("/newspaper");
    return NextResponse.json({ id: newsletter.id, pageCount }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[newsletter] FAILED at step="${step}":`, msg);
    return NextResponse.json({ error: `Upload failed at ${step}: ${msg}` }, { status: 500 });
  }
}
