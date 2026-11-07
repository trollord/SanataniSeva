import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog - Homes, Renting & Buying in Hiranandani Estate, Thane",
  description:
    "Guides and insights on renting, buying and saving on brokerage for houses and flats in Hiranandani Estate, Thane - from the Sanatani Community team.",
  alternates: { canonical: "/blog" },
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase mb-3">
          Insights
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl font-bold text-[#FF5F15] mb-4">
          The Sanatani Community Blog
        </h1>
        <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl mb-10 sm:mb-14">
          Practical guides on renting, buying and saving on brokerage in
          Hiranandani Estate, Thane - written by the team that verifies every
          listing on the platform.
        </p>

        <div className="space-y-4 sm:space-y-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] hover:border-gray-300 transition-all"
            >
              <p className="text-[11px] text-gray-400 mb-2">
                {formatDate(post.date)} · {post.readTime}
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:underline underline-offset-4">
                {post.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                {post.excerpt}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FF5F15]">
                Read article
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
