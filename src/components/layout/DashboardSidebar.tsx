"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  MessageSquare,
  Heart,
  ArrowLeft,
  Package,
} from "lucide-react";
import ListPropertyButton from "@/components/dashboard/ListPropertyButton";

const ownerNavItems = [
  { href: "/dashboard",           label: "My Listings", icon: LayoutDashboard },
  { href: "/dashboard/new",       label: "Add Listing",  icon: PlusCircle },
  { href: "/dashboard/items",     label: "My Items",    icon: Package },
  { href: "/dashboard/inquiries", label: "Inquiries",    icon: MessageSquare },
];

const userNavItems = [
  { href: "/dashboard/interests", label: "My Interests", icon: Heart },
];

const ROLE_LABEL: Record<string, string> = {
  USER:  "Member",
  OWNER: "Owner",
  ADMIN: "Admin",
};

interface Props {
  name: string | null | undefined;
  email: string | null | undefined;
  role: string;
  isOwnerPlus: boolean;
}

export default function DashboardSidebar({ name, email, role, isOwnerPlus }: Props) {
  const pathname = usePathname();
  const navItems = isOwnerPlus ? ownerNavItems : userNavItems;
  const initial  = (name ?? email ?? "U").charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-gray-100 flex-col fixed top-0 left-0 h-screen overflow-y-auto">

      {/* User section */}
      <div className="px-6 py-7 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#FF5F15] flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-white">{initial}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {name ?? email ?? "User"}
            </p>
            <p className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mt-0.5">
              {ROLE_LABEL[role] ?? role}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[9px] font-semibold tracking-[0.25em] uppercase text-gray-400 px-3 mb-3">
          Navigation
        </p>

        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#FF5F15] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {!isOwnerPlus && (
          <div className="pt-2">
            <ListPropertyButton />
          </div>
        )}

        {/* Back to site - inside nav, above footer */}
        <div className="pt-4 mt-2 border-t border-gray-100">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-150"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to site
          </Link>
        </div>
      </nav>
    </aside>
  );
}
