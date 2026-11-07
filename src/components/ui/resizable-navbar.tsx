"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ─── Context ─────────────────────────────────────────────────────────────── */

interface NavbarCtx {
  scrolled: boolean;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  darkHero: boolean;
}

const NavbarContext = createContext<NavbarCtx>({
  scrolled: false,
  mobileOpen: false,
  setMobileOpen: () => {},
  darkHero: true,
});

export const useNavbar = () => useContext(NavbarContext);

/* ─── Navbar (root) ──────────────────────────────────────────────────────── */
// At top + closed   → fully transparent, no radius, no shadow
// At top + menu open → #F5F5F5 fill, rounded card, so menu items are readable
// Scrolled          → #FF5F15 floating capsule

export function Navbar({
  children,
  forceScrolled = false,
  mobileOpen: mobileOpenProp,
  onMobileOpenChange,
}: {
  children: React.ReactNode;
  forceScrolled?: boolean;
  mobileOpen?: boolean;
  onMobileOpenChange?: (v: boolean) => void;
}) {
  const [scrolled, setScrolled] = useState(forceScrolled);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const mobileOpen = mobileOpenProp ?? internalMobileOpen;
  const setMobileOpen = onMobileOpenChange ?? setInternalMobileOpen;
  const pathname = usePathname();

  // Landing page now has a light cream hero — no dark hero pages
  const darkHero = false;

  useEffect(() => {
    if (forceScrolled) { setScrolled(true); return; }
    const handler = () => {
      setScrolled(window.scrollY > 40);
      if (window.scrollY > 40) setMobileOpen(false);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [forceScrolled]);

  const active = scrolled || mobileOpen; // needs a background

  return (
    <NavbarContext.Provider value={{ scrolled, mobileOpen, setMobileOpen, darkHero }}>
      <div
        className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          padding: scrolled
            ? "clamp(8px,1.5vw,12px) clamp(12px,3vw,20px) 0"
            : mobileOpen
            ? "8px 12px 0"
            : "0",
        }}
      >
        <div
          className="w-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            maxWidth: scrolled ? "min(900px, calc(100vw - 32px))" : mobileOpen ? "calc(100vw - 24px)" : "100%",
            borderRadius: scrolled ? "2rem" : mobileOpen ? "1.25rem" : "0",
            background: scrolled
              ? "#1A1A1A"
              : mobileOpen
              ? "#F5F5F5"
              : "transparent",
            border: scrolled ? "1px solid rgba(255,255,255,0.10)" : "none",
            boxShadow: active
              ? "0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)"
              : "none",
            backdropFilter: scrolled ? "blur(12px)" : "none",
            overflow: "hidden", // clips the menu inside the rounded corners
          }}
        >
          {children}
        </div>
      </div>
    </NavbarContext.Provider>
  );
}

/* ─── NavBody (desktop) ───────────────────────────────────────────────────── */

export function NavBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden md:flex items-center justify-between px-6 lg:px-8 h-[60px]">
      {children}
    </div>
  );
}

/* ─── NavbarLogo ──────────────────────────────────────────────────────────── */

export function NavbarLogo() {
  const { scrolled, mobileOpen, darkHero } = useNavbar();

  // scrolled → white (dark pill bg), mobileOpen → dark, at top on dark hero → white, at top on light page → dark
  const subtleColor = scrolled ? "rgba(255,255,255,0.6)" : mobileOpen ? "#555555" : darkHero ? "rgba(255,255,255,0.6)" : "#555555";
  const dotColor = scrolled ? "#ffffff" : mobileOpen ? "#1A1A1A" : darkHero ? "#ffffff" : "#1A1A1A";

  return (
    <Link href="/" className="flex items-center gap-1.5 group shrink-0">
      <span className="font-bold text-xl tracking-tight">
        <span style={{ color: "#C8541A" }}>Sanatani</span>
        <span className="transition-colors duration-300" style={{ color: subtleColor }}> Community</span>
      </span>
      <span
        className="h-1.5 w-1.5 rounded-full mt-1 group-hover:scale-125 transition-transform duration-300"
        style={{ background: dotColor }}
      />
    </Link>
  );
}

/* ─── NavItems ────────────────────────────────────────────────────────────── */

interface NavItem {
  name: string;
  link: string;
}

export function NavItems({ items }: { items: NavItem[] }) {
  const { scrolled, mobileOpen, darkHero } = useNavbar();
  const pathname = usePathname();

  const inactiveColor = scrolled ? "rgba(255,255,255,0.85)" : mobileOpen ? "rgba(26,26,26,0.75)" : darkHero ? "rgba(255,255,255,0.85)" : "rgba(26,26,26,0.65)";
  const activeColor   = scrolled ? "#ffffff" : darkHero ? "#ffffff" : "#0B0B0C";

  return (
    <nav className="flex items-center gap-6 lg:gap-8">
      {items.map((item) => {
        const active = pathname === item.link || pathname.startsWith(item.link + "/");
        return (
          <Link
            key={item.link}
            href={item.link}
            className="text-base font-medium relative group transition-colors duration-200"
            style={{ color: active ? activeColor : inactiveColor }}
          >
            {item.name}
            <span
              className={`absolute -bottom-0.5 left-0 h-px transition-all duration-300 ${
                active ? "w-full" : "w-0 group-hover:w-full"
              }`}
              style={{ background: active ? "#C8541A" : scrolled ? "#ffffff" : "#1A1A1A" }}
            />
          </Link>
        );
      })}
    </nav>
  );
}

/* ─── NavbarButton ────────────────────────────────────────────────────────── */

interface NavbarButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function NavbarButton({
  children,
  variant = "primary",
  className = "",
  onClick,
  href,
}: NavbarButtonProps) {
  const { scrolled, mobileOpen, darkHero } = useNavbar();

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 20px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 600,
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    cursor: "pointer",
    width: className.includes("w-full") ? "100%" : undefined,
  };

  // On light pages (no dark hero), at-top state uses dark colors like mobileOpen
  const atTopLight = !scrolled && !mobileOpen && !darkHero;

  const variant_style: React.CSSProperties =
    variant === "primary"
      ? scrolled
        ? { background: "#ffffff", color: "#1A1A1A" }
        : mobileOpen || atTopLight
        ? { background: "#1A1A1A", color: "#ffffff" }
        : { background: "#ffffff", color: "#1A1A1A" }
      : scrolled
      ? { background: "transparent", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.2)" }
      : mobileOpen || atTopLight
      ? { background: "transparent", color: "#1A1A1A", border: "1px solid rgba(26,26,26,0.2)" }
      : { background: "transparent", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.3)" };

  const combined = { ...base, ...variant_style };
  // strip w-full from className since we handle it in style
  const cls = className.replace("w-full", "").trim();

  return href ? (
    <Link href={href} style={combined} className={cls} onClick={onClick}>
      {children}
    </Link>
  ) : (
    <button style={combined} className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

/* ─── MobileNav ───────────────────────────────────────────────────────────── */

export function MobileNav({ children }: { children: React.ReactNode }) {
  return <div className="md:hidden">{children}</div>;
}

/* ─── MobileNavHeader ─────────────────────────────────────────────────────── */

export function MobileNavHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 h-[60px]">
      {children}
    </div>
  );
}

/* ─── MobileNavToggle ─────────────────────────────────────────────────────── */

export function MobileNavToggle({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  const { scrolled, darkHero } = useNavbar();
  const lineColor = scrolled ? "#ffffff" : isOpen ? "#1A1A1A" : darkHero ? "#ffffff" : "#1A1A1A";

  const buttonBg = isOpen && !scrolled ? "#F5F5F5" : "transparent";

  return (
    <button
      onClick={onClick}
      aria-label="Toggle menu"
      className="p-1.5 rounded-md transition-colors duration-200 focus:outline-none"
      style={{ background: buttonBg, transition: "background 0s" }}
    >
      <div className="w-5 h-4 flex flex-col justify-between">
        <span
          className="block h-0.5 w-full rounded-full transition-all duration-300 origin-center"
          style={{
            background: lineColor,
            transform: isOpen ? "rotate(45deg) translateY(7px)" : "none",
          }}
        />
        <span
          className="block h-0.5 w-full rounded-full transition-all duration-300"
          style={{
            background: lineColor,
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? "scaleX(0)" : "scaleX(1)",
          }}
        />
        <span
          className="block h-0.5 w-full rounded-full transition-all duration-300 origin-center"
          style={{
            background: lineColor,
            transform: isOpen ? "rotate(-45deg) translateY(-7px)" : "none",
          }}
        />
      </div>
    </button>
  );
}

/* ─── MobileNavMenu ───────────────────────────────────────────────────────── */

export function MobileNavMenu({
  isOpen,
  children,
}: {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const { scrolled } = useNavbar();
  return (
    <div
      className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden"
      style={{ maxHeight: isOpen ? "480px" : "0", opacity: isOpen ? 1 : 0 }}
    >
      <div
        className="flex flex-col gap-0.5 px-5 pb-4 pt-2"
        style={{
          borderTop: `1px solid ${
            scrolled ? "rgba(255,255,255,0.08)" : "rgba(26,26,26,0.08)"
          }`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
