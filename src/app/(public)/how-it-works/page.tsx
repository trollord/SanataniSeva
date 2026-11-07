import Link from "next/link";
import { CheckCircle, User, ArrowRight, IndianRupee, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "A simple, transparent process - completely free, with direct owner access and zero commissions.",
};

/* ─── tiny reusable pill ───────────────────────────────────────────────────── */
function StepBadge({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <span
      className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
      style={{
        background: dark ? "rgba(255,255,255,0.10)" : "#EBEBEB",
        color: dark ? "rgba(255,255,255,0.70)" : "rgba(26,26,26,0.55)",
      }}
    >
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function HowItWorksPage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#F5F5F5] px-6 sm:px-8 py-28 md:py-40">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#EBEBEB] text-[10px] uppercase tracking-[0.12em] font-bold text-gray-500 mb-8">
            Process Redefined
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-extrabold tracking-tighter text-[#FF5F15] max-w-4xl leading-[0.92] mb-8">
            How Sanatani Community Works
          </h1>

          <p className="text-gray-500 text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-12">
            A simple, transparent process - direct owner access, zero commissions.
            Completely free. Direct access. Zero commissions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/listings" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-[#FF5F15] text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity">
                Browse Listings
              </button>
            </Link>
            <Link href="#steps" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-[#FF5F15] border border-[#FF5F15]/18 hover:bg-[#EBEBEB] transition-colors">
                Learn More
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STEP 01 - Browse ──────────────────────────────────────────────── */}
      <section id="steps" className="bg-white py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 lg:gap-24 items-center">

          {/* Text */}
          <div className="space-y-7">
            <StepBadge label="Step 01" />
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-[0.95] text-[#FF5F15]">
              Browse Verified Listings
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Every property listed on Sanatani Community undergoes a rigorous
              internal verification. High-resolution imagery, accurate square
              footage, and verified legal status come standard.
            </p>
            <div className="flex items-center gap-3 text-[#FF5F15] font-semibold">
              <div className="bg-[#F5F5F5] p-2 rounded-full shrink-0">
                <CheckCircle className="w-5 h-5 text-[#FF5F15]" />
              </div>
              <span>100% Curated Inventory</span>
            </div>
          </div>

          {/* Image + floating card */}
          <div className="relative mt-6 md:mt-0">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80"
                alt="Luxury property exterior"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating card - hidden on xs, shown sm+ */}
            <div
              className="hidden sm:block absolute -bottom-8 -left-8 lg:-bottom-10 lg:-left-10 bg-white p-5 rounded-xl max-w-[220px] lg:max-w-[240px]"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Featured Listing
              </p>
              <p className="text-base lg:text-lg font-extrabold tracking-tight text-[#FF5F15]">
                Hiranandani Estate, Zen
              </p>
              <p className="text-gray-400 text-sm mt-0.5">3 BHK • 1,450 Sq.Ft.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STEP 02 - Register Interest ───────────────────────────────────── */}
      <section className="bg-[#1C0A00] py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 lg:gap-24 items-center">

          {/* Glass mockup - left on desktop, bottom on mobile */}
          <div className="relative order-2 md:order-1">
            <div
              className="p-8 sm:p-10 rounded-2xl space-y-5 border border-white/10"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="h-11 w-full bg-white/8 rounded-xl animate-pulse" />
              <div className="h-11 w-3/4 bg-white/8 rounded-xl animate-pulse" />
              <div className="flex gap-3 pt-1">
                <div className="h-10 w-24 bg-white/10 rounded-full" />
                <div className="h-10 w-24 bg-white/10 rounded-full" />
              </div>
              <div className="pt-4 border-t border-white/8 flex items-center justify-between">
                <span className="text-white/35 text-xs uppercase tracking-widest font-medium">
                  Verification Status
                </span>
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wide">
                  Ready to Connect
                </span>
              </div>
            </div>
            {/* Glow */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
              style={{ background: "rgba(201,169,110,0.12)", filter: "blur(80px)" }} />
          </div>

          {/* Text */}
          <div className="order-1 md:order-2 space-y-7">
            <StepBadge label="Step 02" dark />
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-[0.95] text-white">
              Register Interest - Free
            </h2>
            <p className="text-white/55 text-lg leading-relaxed">
              Found your dream home? Simply register your interest with a single
              click. No hidden registration fees or &ldquo;platform charges.&rdquo; We keep
              it simple because buying a home is hard enough.
            </p>
            <ul className="space-y-4">
              {["No payment required", "Instant notification to owner"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/75 font-medium">
                  <CheckCircle className="w-5 h-5 text-white shrink-0" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── STEPS 03 & 04 ─────────────────────────────────────────────────── */}
      <section className="bg-[#F5F5F5] py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-14 lg:gap-20">

          {/* Step 03 */}
          <div className="space-y-7">
            <StepBadge label="Step 03" />
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-[0.95] text-[#FF5F15]">
              Connect Directly with the Owner
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              We provide you with the owner&apos;s direct contact details. Honest,
              direct conversations with absolutely no commission pressure.
              Negotiate at your own pace.
            </p>
            {/* Owner card */}
            <div
              className="flex items-center gap-4 bg-white p-5 rounded-xl border border-[#FF5F15]/6 max-w-xs"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              <div className="w-12 h-12 rounded-full bg-[#EBEBEB] flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                  Direct Access
                </p>
                <p className="text-base font-extrabold text-[#FF5F15]">
                  Verified Owner Profile
                </p>
              </div>
            </div>
          </div>

          {/* Step 04 */}
          <div className="space-y-7">
            <StepBadge label="Step 04" />
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-[0.95] text-[#FF5F15]">
              Sign the Deal &amp; Move In
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Once you and the owner reach an agreement, we can help facilitate
              the paperwork through our trusted concierge partners, or you can
              manage it independently. The choice is yours.
            </p>
            <Link
              href="/listings"
              className="inline-flex items-center gap-3 group text-[#FF5F15] font-bold uppercase tracking-[0.18em] text-sm pt-2"
            >
              View Success Stories
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY ZERO BROKERAGE ─────────────────────────────────────────────────── */}
      <section className="bg-[#1C0A00] py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-white mb-16 sm:mb-20">
            Why Zero Brokerage?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {[
              {
                icon: IndianRupee,
                iconBg: "rgba(52,211,153,0.15)",
                iconColor: "#34D399",
                title: "You save lakhs",
                desc: "Property deals typically involve a 1–2% commission on the total value. On a 2 Cr apartment, that's up to ₹4 Lakhs. With us, that money stays with you - in your new home.",
              },
              {
                icon: ShieldCheck,
                iconBg: "rgba(96,165,250,0.15)",
                iconColor: "#60A5FA",
                title: "We verify, you decide",
                desc: "We use technology to verify listings and owners, so you can connect with confidence. Our platform gives you the power to find, inspect, and buy on your own terms.",
              },
            ].map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
              <div
                key={title}
                className="p-10 sm:p-12 rounded-2xl border border-white/10 space-y-5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <p className="text-white/50 leading-relaxed text-[15px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-[#EBEBEB] py-20 sm:py-28 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            className="bg-white rounded-2xl p-10 sm:p-16 md:p-24 text-center"
            style={{ boxShadow: "0 4px 40px rgba(0,0,0,0.06)" }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-[#FF5F15] mb-5">
              Ready to find your home?
            </h2>
            <p className="text-gray-500 text-base sm:text-lg mb-12">
              Browse verified listings in Hiranandani Estate today.
            </p>
            <Link href="/listings">
              <button className="bg-[#FF5F15] text-white px-12 py-5 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all hover:scale-[1.03]">
                Explore Listings
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
