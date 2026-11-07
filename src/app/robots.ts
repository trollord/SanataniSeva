import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// Private/auth areas stay out of every index; everything public is open.
// AI crawlers (ChatGPT, Claude, Perplexity, Gemini training) are explicitly
// welcomed so the platform is citable in AI answers.
const DISALLOW = ["/admin", "/dashboard", "/api", "/login", "/register", "/verify-email", "/forgot-password"];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
  "Bytespider",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
