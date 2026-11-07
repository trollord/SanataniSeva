import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Require login for dashboard and admin
  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) &&
    !session
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Dashboard: any logged-in user (USER sees interests, OWNER+ sees listings)
  // No role gate here - role-based content is handled inside the dashboard itself

  // Admin role is NOT checked here: the edge token can hold a stale role
  // (e.g. right after a promotion). The admin layout and every /api/admin
  // route verify role === "ADMIN" against a fresh DB read via auth().

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
