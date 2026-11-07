import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#1C0A00] text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-20">

        {/* Mobile: brand top, then 2-col links. Desktop: 4-col grid */}
        <div className="flex flex-col md:grid md:grid-cols-4 md:gap-12">

          {/* Brand */}
          <div className="md:col-span-2 mb-6 sm:mb-10 md:mb-0">
            <Link href="/" className="inline-flex items-center gap-1.5 group mb-3 sm:mb-5">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white">
                Blue<span className="text-white/60">Bricks</span>
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/40 mt-1 group-hover:scale-125 transition-transform duration-300" />
            </Link>
            <p className="text-white/40 text-xs sm:text-sm leading-relaxed max-w-xs">
              Exclusively serving Hiranandani Estate, Thane. Completely free.
              Zero brokerage, direct owner connect.
            </p>
          </div>

          {/* Links - 2 columns side by side on mobile */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:contents">

            {/* Explore */}
            <div>
              <h4 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 mb-3 sm:mb-5">
                Explore
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {[
                  { href: "/listings?listingType=RENT", label: "For Rent" },
                  { href: "/listings?listingType=SALE", label: "For Sale" },
                  { href: "/listings?type=FLAT",        label: "Flats" },
                  { href: "/listings?type=VILLA",       label: "Villas" },
                  { href: "/listings?type=OFFICE",      label: "Office Spaces" },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs sm:text-sm text-white/45 hover:text-white transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 mb-3 sm:mb-5">
                Company
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {[
                  { href: "/how-it-works",    label: "How It Works" },
                  { href: "/community",       label: "Community Directory" },
                  { href: "/marketplace",     label: "Marketplace" },
                  { href: "/blog",            label: "Blog" },
                  { href: "/dashboard/new",   label: "List Property" },
                  { href: "/listings",        label: "All Listings" },
                  { href: "/contact",         label: "Contact Us" },
                  { href: "/terms",           label: "Terms & Conditions" },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs sm:text-sm text-white/45 hover:text-white transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Independent-platform disclaimer */}
        <p className="text-[10px] sm:text-xs text-white/25 leading-relaxed mt-8 sm:mt-14 max-w-3xl">
          Disclaimer: Sanatani Community (hiranandaniproperties.in) is an independent property
          listing platform and is not affiliated with, endorsed by, or
          connected to the Hiranandani Group or any of its companies. The name
          &ldquo;Hiranandani&rdquo; refers solely to the Hiranandani Estate
          locality in Thane where the listed properties are situated.
        </p>

        {/* Bottom bar */}
        <div className="border-t border-white/8 mt-4 sm:mt-6 pt-5 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-3">
          <p className="text-[10px] sm:text-xs text-white/25">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <p className="text-[10px] sm:text-xs text-white/25">
            Zero Brokerage
          </p>
        </div>

      </div>
    </footer>
  );
}
