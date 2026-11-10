import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: id, status: "PUBLISHED" },
    select: { publicId: true, title: true },
  });
  if (!newsletter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isDownload = new URL(req.url).searchParams.get("download") === "1";

  // Content-Disposition is a ByteString, so any character above U+00FF throws
  // when the header is constructed - an em dash in a title is enough, and a
  // Devanagari one would never work at all. Send an ASCII-safe filename for
  // old clients plus the RFC 5987 form that every current browser prefers.
  const asciiName =
    newsletter.title.replace(/[^\x20-\x7E]/g, "-").replace(/["\\]/g, "").trim() || "edition";
  const disposition =
    `${isDownload ? "attachment" : "inline"}; filename="${asciiName}.pdf"; ` +
    `filename*=UTF-8''${encodeURIComponent(newsletter.title + ".pdf")}`;

  try {
    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: newsletter.publicId,
      })
    );

    const body = obj.Body;
    if (!body) return NextResponse.json({ error: "Empty file" }, { status: 500 });

    // The SDK hands back a Node Readable here, which is not valid BodyInit -
    // constructing the response with it throws. transformToWebStream() gives
    // the web stream the Response constructor actually accepts, and keeps the
    // PDF streaming rather than buffering 20-30 MB into memory.
    const stream = body.transformToWebStream();
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    // Swallowing this made a broken edition indistinguishable from a missing
    // one, which is how it went unnoticed until the first upload.
    console.error("[newspaper] failed to stream", newsletter.publicId, err);
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
  }
}
