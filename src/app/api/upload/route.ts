import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { randomUUID } from "crypto";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;   // 2 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;  // 50 MB
const MAX_UPLOADS_PER_DAY = 20;

// In-memory rate limiter - resets on server restart (fine for single-server)
const uploadCounts = new Map<string, { count: number; date: string }>();

function todayUTC() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function checkRateLimit(userId: string): boolean {
  const today = todayUTC();
  const entry = uploadCounts.get(userId);

  if (!entry || entry.date !== today) {
    uploadCounts.set(userId, { count: 1, date: today });
    return true;
  }

  if (entry.count >= MAX_UPLOADS_PER_DAY) return false;

  entry.count += 1;
  return true;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "Upload limit reached. You can upload up to 20 files per day." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename") ?? "";
  const contentType = searchParams.get("contentType") ?? "";
  const fileSize = Number(searchParams.get("fileSize") ?? "0");

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType are required" },
      { status: 400 }
    );
  }

  const isVideo = VIDEO_TYPES.includes(contentType);
  if (!IMAGE_TYPES.includes(contentType) && !isVideo) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, HEIC images or MP4, WebM, MOV videos are allowed" },
      { status: 400 }
    );
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!fileSize || fileSize > maxBytes) {
    return NextResponse.json(
      { error: isVideo ? "Videos must be under 50 MB" : "Images must be under 2 MB" },
      { status: 400 }
    );
  }

  // Sanitise extension - only allow safe media extensions
  const rawExt = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "mp4", "webm", "mov"].includes(rawExt)
    ? rawExt
    : isVideo ? "mp4" : "jpg";
  const s3Key = `properties/${session.user.id}/${randomUUID()}.${safeExt}`;

  const presignedUrl = await getPresignedUploadUrl(s3Key, contentType);
  const base = (process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL ?? "").replace(/\/$/, "");
  const publicUrl = `${base}/${s3Key}`;

  return NextResponse.json({ presignedUrl, s3Key, publicUrl });
}
