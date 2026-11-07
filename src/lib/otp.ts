import { randomInt, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Email OTPs stored bcrypt-hashed in the NextAuth VerificationToken table.
// identifier = "<purpose>:<email>"; failed attempts tracked as
// "<purpose>-fail:<email>" marker rows so no schema change is needed.

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "pwreset" | "verify";

type OtpError = { error: string; status: number };

export async function issueOtp(
  purpose: OtpPurpose,
  email: string
): Promise<{ otp: string } | OtpError> {
  const identifier = `${purpose}:${email}`;

  const existing = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { expires: "desc" },
  });
  if (existing) {
    const createdAt = existing.expires.getTime() - OTP_TTL_MS;
    if (Date.now() - createdAt < RESEND_COOLDOWN_MS) {
      return { error: "Please wait a minute before requesting another code.", status: 429 };
    }
  }

  const otp = String(randomInt(100000, 1000000));
  const tokenHash = await bcrypt.hash(otp, 10);

  await prisma.$transaction([
    // Also sweep expired OTP/fail rows so abandoned codes don't accumulate
    prisma.verificationToken.deleteMany({
      where: {
        OR: [
          { identifier: { in: [identifier, `${purpose}-fail:${email}`] } },
          { identifier: { startsWith: "pwreset" }, expires: { lt: new Date() } },
          { identifier: { startsWith: "verify" }, expires: { lt: new Date() } },
        ],
      },
    }),
    prisma.verificationToken.create({
      data: { identifier, token: tokenHash, expires: new Date(Date.now() + OTP_TTL_MS) },
    }),
  ]);

  return { otp };
}

/** Checks the code; burns it (and its attempt markers) on success. */
export async function verifyOtp(
  purpose: OtpPurpose,
  email: string,
  otp: string
): Promise<{ ok: true } | OtpError> {
  const identifier = `${purpose}:${email}`;
  const failIdentifier = `${purpose}-fail:${email}`;
  const invalid = { error: "Invalid or expired code", status: 400 };

  const token = await prisma.verificationToken.findFirst({
    where: { identifier, expires: { gt: new Date() } },
    orderBy: { expires: "desc" },
  });
  if (!token) return invalid;

  const failedAttempts = await prisma.verificationToken.count({
    where: { identifier: failIdentifier, expires: { gt: new Date() } },
  });
  if (failedAttempts >= MAX_ATTEMPTS) {
    return { error: "Too many incorrect attempts. Please request a new code.", status: 429 };
  }

  const matches = await bcrypt.compare(otp, token.token);
  if (!matches) {
    await prisma.verificationToken.create({
      data: {
        identifier: failIdentifier,
        token: randomUUID(),
        expires: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    return invalid;
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: { in: [identifier, failIdentifier] } },
  });

  return { ok: true };
}
