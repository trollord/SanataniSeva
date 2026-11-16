import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { SITE_URL } from "@/lib/constants";
import { parsePhone } from "@/lib/phone";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";
import {
  type DirectoryCategoryContact,
  getDirectoryCategories,
  getDirectoryCategoryContacts,
  getDirectoryCategoryCounts,
} from "@/lib/directory-categories";

/**
 * One plain, fully server-rendered page per service-provider category.
 *
 * /community is the resident-facing tool: it pages its table on the client, so
 * most contacts reach the browser only inside the script payload, which search
 * and AI crawlers do not reliably read. These pages list every published
 * contact of a category as ordinary HTML, and /community links to them.
 *
 * They live in the (public) group for the navbar and footer; the URLs do not
 * collide with (fullscreen)/community, which only owns /community itself.
 */

interface Group {
  /** Null when the category has no subcategories in use: one flat list. */
  label: string | null;
  contacts: DirectoryCategoryContact[];
}

async function loadCategory(key: string) {
  const categories = await getDirectoryCategories();
  const category = categories.find((c) => c.key === key);
  // Checked before querying, so a made-up key never gets a cache entry.
  if (!category) return null;
  const contacts = await getDirectoryCategoryContacts(key);
  if (contacts.length === 0) return null;

  // Subcategories in display order, then everyone without one as "Other".
  const own = new Set(category.subcategories.map((s) => s.id));
  const groups: Group[] = category.subcategories
    .map((s) => ({ label: s.label, contacts: contacts.filter((c) => c.subcategoryId === s.id) }))
    .filter((g) => g.contacts.length > 0);
  const rest = contacts.filter((c) => !c.subcategoryId || !own.has(c.subcategoryId));
  if (groups.length === 0) groups.push({ label: null, contacts: rest });
  else if (rest.length > 0) groups.push({ label: "Other", contacts: rest });

  return { category, categories, contacts, groups };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: key } = await params;
  const data = await loadCategory(key);
  if (!data) return { title: "Category Not Found" };
  const { category, contacts, groups } = data;

  const title = `${category.label} in Hiranandani Estate, Thane`;
  const subs = groups
    .filter((g) => g.label && g.label !== "Other")
    .map((g) => `${g.label} (${g.contacts.length})`);
  const description =
    `${title}: phone numbers, addresses and hours for ` +
    `${plural(contacts.length, "local provider", "local providers")}, contributed by residents` +
    (subs.length > 0 ? `. Includes ${subs.slice(0, 4).join(", ")}${subs.length > 4 ? " and more" : ""}.` : ".");

  return {
    title,
    description,
    alternates: { canonical: `/community/${category.key}` },
    openGraph: { title, description },
  };
}

export default async function DirectoryCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: key } = await params;
  const [data, counts] = await Promise.all([loadCategory(key), getDirectoryCategoryCounts()]);
  if (!data) notFound();
  const { category, categories, contacts, groups } = data;

  const heading = `${category.label} in Hiranandani Estate, Thane`;
  const pageUrl = `${SITE_URL}/community/${category.key}`;
  const others = categories.filter((c) => c.key !== category.key && (counts[c.key] ?? 0) > 0);
  // Contact names are h2 in a flat list, h3 under the subcategory headings.
  const grouped = groups[0].label !== null;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: heading,
      url: pageUrl,
      numberOfItems: contacts.length,
      itemListElement: contacts.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          "@id": `${pageUrl}#${c.id}`,
          name: c.name,
          description: c.service,
          telephone: c.phones.length === 1 ? c.phones[0] : c.phones,
          address: {
            "@type": "PostalAddress",
            streetAddress: [c.address, c.locality].filter(Boolean).join(", "),
            addressLocality: "Thane",
            addressRegion: "Maharashtra",
            addressCountry: "IN",
          },
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Service Providers", item: `${SITE_URL}/community` },
        { "@type": "ListItem", position: 3, name: category.label, item: pageUrl },
      ],
    },
  ];

  return (
    <div className="bg-[#FAF8F5] pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8">
      <script
        type="application/ld+json"
        // Contact fields are free text; escaping "<" keeps a stray "</script>" inert.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="max-w-3xl mx-auto">
        <nav aria-label="Breadcrumb" className="text-[11px] text-gray-400 mb-3">
          <Link href="/" className="hover:text-[#C8541A] transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/community" className="hover:text-[#C8541A] transition-colors">Service Providers</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-500">{category.label}</span>
        </nav>

        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-[#0B0B0C] leading-tight mb-3">
          {heading}
        </h1>
        <p className="text-sm sm:text-[15px] text-gray-500 leading-relaxed mb-4">
          Phone numbers, addresses and hours for{" "}
          {plural(contacts.length, "local provider", "local providers")} serving Hiranandani
          Estate, contributed by residents.
        </p>
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C8541A] hover:underline underline-offset-2 mb-8 sm:mb-10"
        >
          Search all service providers
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="space-y-8 sm:space-y-10">
          {groups.map((g) => (
            <section key={g.label ?? "all"}>
              {g.label && (
                <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-[#0B0B0C] mb-3">
                  {g.label}
                  <span className="ml-2 align-middle font-sans text-xs font-medium text-gray-400">
                    {g.contacts.length}
                  </span>
                </h2>
              )}
              <ul className="rounded-2xl border border-[#EDE5D8] bg-white divide-y divide-[#EDE5D8]">
                {g.contacts.map((c) => (
                  <ContactItem key={c.id} contact={c} headingLevel={grouped ? "h3" : "h2"} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        {others.length > 0 && (
          <nav aria-labelledby="more-categories" className="mt-12 sm:mt-14 border-t border-[#EDE5D8] pt-6">
            <h2
              id="more-categories"
              className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-bold text-[#0B0B0C] mb-3"
            >
              More service providers in Hiranandani Estate
            </h2>
            <ul className="flex flex-wrap gap-2">
              {others.map((c) => (
                <li key={c.key}>
                  <Link
                    href={`/community/${c.key}`}
                    className="inline-block rounded-full border border-[#EDE5D8] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#C8541A]/40 hover:text-[#C8541A] transition-colors"
                  >
                    {c.label} <span className="text-gray-400">({counts[c.key]})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <p className="mt-8 text-[11px] text-gray-400 leading-relaxed">
          Listings are contributed by residents and are not vetted by us. Sanatani Seva does not
          employ or endorse the vendors listed here; please verify credentials and agree charges
          before hiring.
        </p>
      </div>
    </div>
  );
}

function ContactItem({
  contact: c,
  headingLevel: Heading,
}: {
  contact: DirectoryCategoryContact;
  headingLevel: "h2" | "h3";
}) {
  const primary = c.phones[0];
  // As in the directory: WhatsApp only exists on mobile numbers.
  const canWhatsApp = c.whatsapp && parsePhone(primary).kind === "mobile";
  const details: [string, string][] = [
    ["Contact person", c.contactPerson ?? ""],
    ["Locality", c.locality],
    ["Address", c.address],
    ["Hours", c.hours],
  ];

  return (
    <li id={c.id} className="p-4 sm:p-5">
      <article>
        <Heading className="font-semibold tracking-tight text-[#0B0B0C]">{c.name}</Heading>
        <p className="text-sm text-gray-500 leading-snug mb-2.5">{c.service}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          {details
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <Fragment key={label}>
                <dt className="text-gray-400">{label}</dt>
                <dd className="text-gray-700">{value}</dd>
              </Fragment>
            ))}
          <dt className="text-gray-400">{c.phones.length === 1 ? "Phone" : "Phones"}</dt>
          <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {c.phones.map((p) => (
              <a
                key={p}
                href={`tel:${p.replace(/\s/g, "")}`}
                className="font-medium text-gray-700 hover:text-[#C8541A] whitespace-nowrap transition-colors"
              >
                {p}
              </a>
            ))}
            {canWhatsApp && (
              <a
                href={whatsAppContactUrl(
                  primary,
                  `Hi ${c.contactPerson ?? c.name}, I found you on the Sanatani Seva community directory for Hiranandani Estate.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#C8541A] hover:underline underline-offset-2"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            )}
          </dd>
        </dl>
      </article>
    </li>
  );
}
