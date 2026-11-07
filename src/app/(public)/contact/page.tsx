import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, MessageCircle, Phone, Clock } from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { whatsAppContactUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us - Get in touch with Sanatani Community",
  description:
    "Have a question about a listing, want to list your property or add a vendor to the community directory? Reach the Sanatani Community team by form, phone, email or WhatsApp.",
  alternates: { canonical: "/contact" },
};

// Placeholder contact details - swap for real ones before launch
const CONTACT_PHONE = "+91 90000 00000";
const CONTACT_EMAIL = "hello@sanatanicommunity.example";
const WHATSAPP_NUMBER = "+91 90000 00000";

const FAQS: { q: string; a: string }[] = [
  {
    q: "I'm a buyer or tenant - how do I reach an owner?",
    a: "Open the listing you're interested in and tap the Call or WhatsApp button on the price card. We put you in direct contact with the owner, no brokers in between.",
  },
  {
    q: "I want to list my property - do I pay anything?",
    a: "No. Listing is completely free. Create an account and head to Dashboard → List Property. Our team verifies the listing and publishes it.",
  },
  {
    q: "I run a local business - can I be added to the directory?",
    a: "Yes. Pick 'Add a vendor to the directory' as the subject and share your business details. We'll verify and list you so residents can reach you directly.",
  },
  {
    q: "How quickly do you respond?",
    a: "Within 24 hours on working days - usually faster. For urgent listing questions, WhatsApp is the fastest route.",
  },
];

export default function ContactPage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── FORM + QUICK REACH ────────────────────────────────────────────── */}
      <section className="px-5 sm:px-8 pt-28 sm:pt-36 pb-14 sm:pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">

          {/* Form */}
          <div className="lg:col-span-3">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase mb-3">
              Send a message
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-[#0B0B0C] mb-6">
              We&apos;d love to hear from you
            </h2>
            <ContactForm />
          </div>

          {/* Quick reach */}
          <aside className="lg:col-span-2 space-y-4">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase mb-3">
              Quick reach
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-[#0B0B0C] mb-6">
              Prefer talking directly?
            </h2>

            <QuickCard
              href={whatsAppContactUrl(WHATSAPP_NUMBER)}
              icon={<WhatsAppIcon className="w-5 h-5" />}
              label="WhatsApp"
              value={WHATSAPP_NUMBER}
              hint="Fastest - usually under an hour"
              external
            />

            <QuickCard
              href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
              icon={<Phone className="w-5 h-5" />}
              label="Call us"
              value={CONTACT_PHONE}
              hint="Mon–Sat · 10:00 AM – 7:00 PM"
            />

            <QuickCard
              href={`mailto:${CONTACT_EMAIL}`}
              icon={<Mail className="w-5 h-5" />}
              label="Email"
              value={CONTACT_EMAIL}
              hint="Replies within 24 hours"
            />

            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#0B0B0C]">
                  Office hours
                </p>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  Monday to Saturday
                  <br />
                  10:00 AM – 7:00 PM IST
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#F5F5F5] px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#EBEBEB] text-[10px] uppercase tracking-[0.12em] font-bold text-gray-500 mb-5">
              Common questions
            </span>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-[#0B0B0C]">
              Before you write to us
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6"
              >
                <h3 className="text-sm sm:text-base font-semibold text-[#0B0B0C] mb-2">
                  {f.q}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-5 sm:px-8 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#1C0A00] rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 mb-3">
                New here?
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-3xl font-bold text-white mb-2">
                See how Sanatani Community works
              </h2>
              <p className="text-white/45 text-xs sm:text-sm leading-relaxed max-w-md">
                Zero brokerage, direct owner connect, verified listings - in
                under three steps.
              </p>
            </div>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 bg-white text-[#0B0B0C] px-6 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shrink-0 self-start sm:self-auto"
            >
              How it works
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Chat bubble ──────────────────────────────────────────────────── */}
      <Link
        href={whatsAppContactUrl(WHATSAPP_NUMBER)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-[#1C0A00] text-white px-4 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">
          Chat
        </span>
      </Link>
    </div>
  );
}

/* ─── Quick reach card ────────────────────────────────────────────────────── */
function QuickCard({
  href,
  icon,
  label,
  value,
  hint,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#EBEBEB] flex items-center justify-center shrink-0 text-[#0B0B0C]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            {label}
          </p>
          <p className="text-sm sm:text-base font-semibold text-[#0B0B0C] mt-0.5 truncate">
            {value}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">{hint}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
      </div>
    </a>
  );
}
