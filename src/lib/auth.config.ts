import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config - no Prisma, no Node.js-only modules.
// Used by middleware (Edge Runtime) and extended by auth.ts (Node.js).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // providers added in auth.ts (Node.js only)
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user }: { user: any }) {
      if (user?.disabled) return false;
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user: any; trigger?: string; session?: any }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
