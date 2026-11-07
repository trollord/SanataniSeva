import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/user";
import { authConfig } from "@/lib/auth.config";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

// Augment NextAuth types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    role?: string;
  }
}

// Short-lived in-memory cache for role/disabled lookups. auth() runs on every
// request (root layout, pages, API routes), so hitting the DB each time adds a
// round-trip per render. 60s staleness is acceptable: role changes still apply
// without re-login, and admin mutations invalidate the entry immediately.
const ROLE_TTL_MS = 60_000;
const roleCache = new Map<string, { role: string; disabled: boolean; at: number }>();

async function getUserAccess(id: string) {
  const hit = roleCache.get(id);
  if (hit && Date.now() - hit.at < ROLE_TTL_MS) return hit;
  const fresh = await prisma.user.findUnique({
    where: { id },
    select: { role: true, disabled: true },
  });
  if (!fresh) {
    roleCache.delete(id);
    return null;
  }
  const entry = { role: fresh.role, disabled: fresh.disabled, at: Date.now() };
  roleCache.set(id, entry);
  return entry;
}

/** Call after changing a user's role or disabled flag so it applies instantly. */
export function invalidateUserAccess(id: string) {
  roleCache.delete(id);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Safe here: credentials sign-in requires emailVerified (see authorize()),
      // and Google only returns verified emails.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        if (user.disabled) return null;

        // Credentials accounts must have a verified email
        if (!user.emailVerified) throw new EmailNotVerifiedError();

        return user;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user: any; trigger?: string }) {
      if (user) {
        token.id = user.id as string;
      }
      // Refresh role from DB (via short TTL cache) so role changes (promotion
      // to ADMIN, demotion, disable) take effect without re-login
      if (token.id) {
        const access = await getUserAccess(token.id as string);
        if (!access || access.disabled) return null; // block deleted/disabled users
        token.role = access.role;
      }
      return token;
    },
  },
});
