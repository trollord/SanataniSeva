import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BLOG_POSTS, getPost } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  };
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Sanatani Community" },
    publisher: { "@type": "Organization", name: "Sanatani Community", url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FF5F15] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All articles
        </Link>

        <p className="text-[11px] text-gray-400 mb-3">
          {formatDate(post.date)} · {post.readTime}
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl font-bold text-gray-900 leading-tight mb-8 sm:mb-10">
          {post.title}
        </h1>

        <div className="space-y-5">
          {post.blocks.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2
                  key={i}
                  className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-gray-900 pt-4"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={i} className="space-y-2.5 pl-1">
                  {(block.items ?? []).map((item, j) => (
                    <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF5F15]/60 mt-2.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-[15px] sm:text-base leading-[1.9] text-gray-600">
                {block.text}
              </p>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 sm:mt-16 bg-[#FF5F15] rounded-2xl p-7 sm:p-10 text-center">
          <h3 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-white mb-2">
            Find your home in Hiranandani Estate
          </h3>
          <p className="text-white/50 text-sm mb-6">
            Verified listings, direct owner contact, zero brokerage.
          </p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 bg-white text-[#FF5F15] text-sm font-semibold px-7 py-3 rounded-full hover:bg-white/90 transition-colors"
          >
            Browse Listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
