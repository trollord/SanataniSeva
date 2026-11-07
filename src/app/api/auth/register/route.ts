import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/user";
import { issueOtp } from "@/lib/otp";
import { emailVerificationEmail, EMAIL_FROM } from "@/lib/email/templates";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues ?? [];
      return NextResponse.json(
        { error: issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone: phone || null,
        role: "USER",
      },
    });

    // Credentials accounts must verify their email before signing in
    try {
      const issued = await issueOtp("verify", email.toLowerCase());
      if ("otp" in issued) {
        const { subject, html } = emailVerificationEmail({ name, otp: issued.otp });
        await new Resend(process.env.RESEND_API_KEY!).emails.send({
          from: EMAIL_FROM,
          to: email,
          subject,
          html,
        });
      }
    } catch (err) {
      // User can request a fresh code from the verify screen
      console.error("Verification email failed:", err);
    }

    return NextResponse.json({ ok: true, needsVerification: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
