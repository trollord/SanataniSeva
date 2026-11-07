import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });
  // Presigned URL expires in 5 minutes - short window reduces abuse
  return getSignedUrl(s3, command, { expiresIn: 300 });
}

export async function uploadBufferToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  const base = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL!.replace(/\/$/, "");
  return `${base}/${key}`;
}

export async function deleteS3Object(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    })
  );
}

export function getS3Url(key: string): string {
  return `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL}/${key}`;
}
