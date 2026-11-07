import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/** URL for a single page of a PDF stored on Cloudinary (1-indexed). */
export function pageImageUrl(publicId: string, page: number, width = 1200): string {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/pg_${page},w_${width},q_auto,f_jpg/${publicId}.jpg`;
}
