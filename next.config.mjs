/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig = {
  // Lets a second Next process (a production build, or a throwaway dev server on
  // another port) use its own output directory instead of overwriting the one a
  // running `npm run dev` is serving from, which leaves the dev server throwing
  // "Cannot find module './NNNN.js'" until it is restarted.
  //   NEXT_DIST_DIR=.next-scratch npx next dev -p 3137
  distDir: process.env.NEXT_DIST_DIR || ".next",

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google OAuth avatars
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // placeholder images
      },
    ],
  },
  experimental: {
    serverActions: {
      // Production host plus local dev. Add the Vercel preview host for this
      // project if server actions are ever used from a preview deployment.
      allowedOrigins: ["localhost:3000", "sanataniseva.com", "www.sanataniseva.com"],
    },
  },
  outputFileTracingExcludes: {
    "/api/admin/import": ["**/@prisma/engines/**"],
  },
};

export default nextConfig;
