import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#1C0A00] text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">

        {/* Mobile: brand top, then 2-col links. Desktop: 5-col grid, with the
            longer Company list set in two columns to keep the footer short. */}
        <div className="flex flex-col md:grid md:grid-cols-5 md:gap-10">

          {/* Brand */}
          <div className="md:col-span-2 mb-6 sm:mb-8 md:mb-0">
            <Link href="/" className="inline-flex items-center gap-1.5 group mb-3">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white">
                Sanatani<span className="text-white/60"> Seva</span>
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/40 mt-1 group-hover:scale-125 transition-transform duration-300" />
            </Link>
            <p className="text-white/40 text-xs sm:text-sm leading-relaxed max-w-xs">
              Serving the community of Hiranandani Estate and nearby areas:
              service numbers, emergency contacts, bus timings and everyday
              needs, at your fingertips.
            </p>
            <p className="text-white/40 text-xs sm:text-sm mt-3">
              Convener: <span className="text-white/70 font-medium">Narendra Sahu</span>
            </p>
          </div>

          {/* Links - 2 columns side by side on mobile */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:contents">

            {/* Explore */}
            <div>
              <h4 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 mb-3">
                Explore
              </h4>
              <ul className="space-y-2">
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
            <div className="md:col-span-2">
              <h4 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 mb-3">
                Company
              </h4>
              <ul className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-2">
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

        {/* Bottom bar */}
        <div className="border-t border-white/8 mt-6 sm:mt-8 pt-4 sm:pt-5 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-3">
          <p className="text-[10px] sm:text-xs text-white/25">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <p className="text-[10px] sm:text-xs text-white/25 flex items-center gap-1.5">
            <span>Hiranandani Estate, Thane</span>
            <span aria-hidden className="text-white/15">·</span>
            <span>
              Made by{" "}
              <a
                href="https://www.bytelights.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/45 hover:text-[#FF5F15] transition-colors"
              >
                ByteLights
              </a>
            </span>
          </p>
        </div>

      </div>
    </footer>
  );
}
