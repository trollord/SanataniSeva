import { compressImage, MAX_IMAGE_BYTES } from "@/lib/compress-image";

/**
 * Uploads one photo or video straight to S3 and returns where it landed.
 *
 * Photos are shrunk first, so the size check, the presign request and the PUT
 * all see the compressed file - a phone photo over 2 MB is resized rather than
 * refused. Videos pass through untouched. Throws with a message fit for the
 * tile, so callers only decide how to show the failure.
 */
export async function uploadMedia(original: File): Promise<{ url: string; s3Key: string }> {
  const file = await compressImage(original);
  if (file.type.startsWith("image/") && file.size > MAX_IMAGE_BYTES) {
    throw new Error("Over 2 MB even after resizing");
  }

  const res = await fetch(
    `/api/upload?filename=${encodeURIComponent(file.name)}` +
      `&contentType=${encodeURIComponent(file.type)}&fileSize=${file.size}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to get upload URL");
  }
  const { presignedUrl, s3Key, publicUrl } = await res.json();

  // A rejected PUT still resolves, so without this check the listing would
  // save a URL that points at nothing.
  const put = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) {
    const body = await put.text().catch(() => "");
    throw new Error(body.match(/<Message>(.*?)<\/Message>/)?.[1] ?? `S3 error ${put.status}`);
  }

  return { url: publicUrl as string, s3Key: s3Key as string };
}
