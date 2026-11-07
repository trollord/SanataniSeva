import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: params.id, status: "PUBLISHED" },
    select: { publicId: true, title: true },
  });
  if (!newsletter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isDownload = new URL(req.url).searchParams.get("download") === "1";

  try {
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: newsletter.publicId,
      })
    );

    const body = obj.Body;
    if (!body) return NextResponse.json({ error: "Empty file" }, { status: 500 });

    const stream = body as unknown as ReadableStream;
    const disposition = isDownload
      ? `attachment; filename="${newsletter.title}.pdf"`
      : `inline; filename="${newsletter.title}.pdf"`;

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
  }
}
