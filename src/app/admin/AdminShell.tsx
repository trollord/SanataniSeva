"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Upload,
  Building2,
  MessageSquare,
  Menu,
  X,
  BarChart3,
  Package,
  BookUser,
  Newspaper,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/listings", label: "Listings Queue", icon: ListChecks },
  { href: "/admin/items", label: "Marketplace", icon: Package },
  { href: "/admin/community", label: "Community", icon: BookUser },
  { href: "/admin/newsletter", label: "Newspaper", icon: Newspaper },
  { href: "/admin/news",       label: "Today's News", icon: Newspaper },
  { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/import", label: "Import Prices", icon: Upload },
];

interface Props {
  userName: string;
  userRole: string;
  children: React.ReactNode;
}

export default function AdminShell({ userName, userRole, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <>
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-5 w-5 text-white/80" />
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <p className="text-xs text-white/50 truncate">{userName}</p>
        <Badge className="mt-1 text-xs bg-white/10 text-white/80 border-white/20">
          {userRole}
        </Badge>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(href)
                ? "bg-white/15 text-white font-medium"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <Link href="/" className="text-xs text-white/40 hover:text-white/70">
          ← Back to site
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-[#1C0A00] text-white flex-col">
        {sidebar}
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1C0A00] text-white flex flex-col transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebar}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="font-bold text-sm text-gray-900">Admin</span>
          </div>
        </header>

        <main className="flex-1 bg-[#FAF8F5] overflow-auto">{children}</main>
      </div>
    </div>
  );
}
