"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <NextAuthSessionProvider
      session={session}
      // Re-check session when window regains focus (catches expired tokens silently)
      refetchOnWindowFocus={true}
      // Don't poll - rely on JWT expiry and window focus re-checks
      refetchInterval={0}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
