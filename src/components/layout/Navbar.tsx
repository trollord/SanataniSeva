"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PlusSquare, LayoutDashboard, Shield, LogOut, X, ArrowRight } from "lucide-react";
import BecomeOwnerModal from "@/components/property/BecomeOwnerModal";
import FloatingActionMenu from "@/components/ui/floating-action-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Navbar,
  NavBody,
  NavItems,
  NavbarLogo,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  useNavbar,
} from "@/components/ui/resizable-navbar";

const navItems = [
  { name: "Real Estate", link: "/listings" },
  { name: "Resell & Donate", link: "/marketplace" },
  { name: "Service Providers", link: "/community" },
  // { name: "How It Works", link: "/how-it-works" },
  // { name: "Blog", link: "/blog" },
  { name: "Latest News", link: "/newspaper" },
  { name: "Connect", link: "/contact" },
];

/* ─── Avatar menu (FloatingActionMenu) ────────────────────────────────────── */
function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const { scrolled, darkHero } = useNavbar();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (!session) return null;

  const isAdmin = ["ADMIN"].includes(session.user?.role ?? "");

  const options = [
    {
      label: "My Dashboard",
      onClick: () => { router.push("/dashboard"); setMenuOpen(false); },
      Icon: <LayoutDashboard className="h-4 w-4" />,
    },
    ...(isAdmin
      ? [
          {
            label: "Admin Panel",
            onClick: () => { router.push("/admin"); setMenuOpen(false); },
            Icon: <Shield className="h-4 w-4" />,
          },
        ]
      : []),
    {
      label: "Sign Out",
      onClick: () => { signOut({ callbackUrl: "/" }); setMenuOpen(false); },
      Icon: <LogOut className="h-4 w-4" />,
    },
  ];

  return (
    <div ref={wrapperRef}>
      <FloatingActionMenu
        options={options}
        isOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        direction="down"
        trigger={
          <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF5F15]/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user?.image ?? undefined} />
              <AvatarFallback
                className="text-xs font-semibold"
                style={{
                  background: scrolled ? "rgba(255,255,255,0.12)" : darkHero ? "rgba(255,255,255,0.15)" : "rgba(255,95,21,0.08)",
                  color: scrolled ? "#ffffff" : darkHero ? "#ffffff" : "#FF5F15",
                }}
              >
                {session.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />
    </div>
  );
}

/* ─── Main Navbar export ──────────────────────────────────────────────────── */

export default function SiteNavbar({ forceScrolled = false }: { forceScrolled?: boolean }) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  const isOwnerPlus = ["OWNER", "ADMIN"].includes(
    session?.user?.role ?? ""
  );

  // If logged in as OWNER+ → go straight to /dashboard/new
  // If logged in as USER   → open the become-owner modal
  // If not logged in       → go to /register
  function handleListProperty() {
    if (!session) {
      window.location.href = "/register";
      return;
    }
    if (isOwnerPlus) {
      window.location.href = "/dashboard/new";
    } else {
      setOwnerModalOpen(true);
    }
  }

  return (
    <>
      <BecomeOwnerModal
        open={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
      />

      <Navbar
        forceScrolled={forceScrolled}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      >
        {/* ── Desktop ── */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-3">
            {session ? (
              <>
                {false && (
                  <NavbarButton variant="primary" onClick={handleListProperty}>
                    <PlusSquare className="h-4 w-4 mr-1.5" />
                    List Property
                  </NavbarButton>
                )}
                <UserMenu />
              </>
            ) : (
              <>
                <NavbarButton variant="secondary" href="/login">
                  Sign In
                </NavbarButton>
                {false && (
                  <NavbarButton variant="primary" href="/register">
                    List Property
                  </NavbarButton>
                )}
              </>
            )}
          </div>
        </NavBody>

        {/* ── Mobile header strip (hamburger button only) ── */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            />
          </MobileNavHeader>
        </MobileNav>
      </Navbar>

      {/* ── Side drawer overlay ── */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Side drawer panel ── */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] sm:w-[300px] z-[70] md:hidden flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#FAF8F5" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 h-[64px] border-b border-[#EDE5D8] shrink-0">
          <span className="font-bold text-base text-[#1C1C1C]">
            Sanatani <span className="text-[#6B6B6B] font-medium">Community</span>
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#F0E9DF] transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-[#1C1C1C]" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-6 py-3">
          {navItems.map((item) => (
            <Link
              key={item.link}
              href={item.link}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-4 border-b border-[#EDE5D8] text-sm font-medium text-[#1C1C1C]/75 hover:text-[#C8541A] transition-colors group"
            >
              {item.name}
              <ArrowRight className="h-3.5 w-3.5 text-[#C8541A]/30 group-hover:text-[#C8541A] transition-colors" />
            </Link>
          ))}

          {session && (
            <>
              {/* Section divider */}
              <div className="flex items-center gap-3 mt-5 mb-1">
                <div className="h-px flex-1 bg-[#EDE5D8]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9E6B3F]">My Account</span>
                <div className="h-px flex-1 bg-[#EDE5D8]" />
              </div>

              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between py-4 border-b border-[#EDE5D8] text-sm font-medium text-[#1C1C1C]/75 hover:text-[#C8541A] transition-colors group"
              >
                My Dashboard
                <ArrowRight className="h-3.5 w-3.5 text-[#C8541A]/30 group-hover:text-[#C8541A] transition-colors" />
              </Link>
              {session.user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-4 border-b border-[#EDE5D8] text-sm font-medium text-[#1C1C1C]/75 hover:text-[#C8541A] transition-colors group"
                >
                  Admin Panel
                  <ArrowRight className="h-3.5 w-3.5 text-[#C8541A]/30 group-hover:text-[#C8541A] transition-colors" />
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Bottom auth */}
        <div className="px-6 py-6 border-t border-[#EDE5D8] shrink-0">
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[#F0E9DF] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#C8541A]">
                    {session.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
                <span className="text-sm font-medium text-[#1C1C1C] truncate">
                  {session.user?.name}
                </span>
              </div>
              <button
                onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                className="flex items-center gap-2 w-full text-sm font-medium text-red-500 hover:text-red-600 transition-colors py-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-[#C8541A] text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

    </>
  );
}

/* ─── MobileNavLink helper ────────────────────────────────────────────────── */
function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { scrolled } = useNavbar();
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-1 py-3 text-sm font-medium transition-colors duration-200 border-b"
      style={{
        color: scrolled ? "rgba(255,255,255,0.8)" : "rgba(26,26,26,0.75)",
        borderColor: scrolled
          ? "rgba(255,255,255,0.08)"
          : "rgba(26,26,26,0.07)",
      }}
    >
      {children}
    </Link>
  );
}

/* ─── MobileActionButton helper ───────────────────────────────────────────── */
function MobileActionButton({
  onClick,
  icon,
  children,
  bordered,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  bordered?: boolean;
  danger?: boolean;
}) {
  const { scrolled } = useNavbar();
  const color = danger
    ? scrolled ? "rgba(255,120,120,1)" : "rgb(239,68,68)"
    : scrolled ? "rgba(255,255,255,0.85)" : "rgba(26,26,26,0.75)";
  const borderColor = scrolled ? "rgba(255,255,255,0.08)" : "rgba(26,26,26,0.07)";
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-1 py-2.5 text-sm font-medium w-full text-left"
      style={{
        color,
        borderBottom: bordered ? `1px solid ${borderColor}` : undefined,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
