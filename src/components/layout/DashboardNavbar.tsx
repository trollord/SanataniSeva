"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Shield, LogOut } from "lucide-react";
import FloatingActionMenu from "@/components/ui/floating-action-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const isAdmin = ["ADMIN"].includes(session?.user?.role ?? "");

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-[60px] flex items-center justify-between px-6 lg:px-8">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1.5 group shrink-0">
        <span className="font-bold text-xl tracking-tight text-[#FF5F15]">
          Blue<span className="text-[#FF5F15]">Bricks</span>
        </span>
        <span className="h-1.5 w-1.5 rounded-full mt-1 bg-[#FF5F15] group-hover:scale-125 transition-transform duration-300" />
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-6">
        <Link
          href="/listings"
          className="text-sm font-medium text-gray-500 hover:text-[#FF5F15] transition-colors"
        >
          Listings
        </Link>
        <Link
          href="/how-it-works"
          className="text-sm font-medium text-gray-500 hover:text-[#FF5F15] transition-colors"
        >
          How It Works
        </Link>
      </nav>

      {/* User menu */}
      {session && (
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
                  <AvatarFallback className="text-xs font-semibold bg-gray-100 text-[#FF5F15]">
                    {session.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
        </div>
      )}
    </header>
  );
}
