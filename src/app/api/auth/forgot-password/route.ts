import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueOtp } from "@/lib/otp";
import { passwordResetEmail, EMAIL_FROM } from "@/lib/email/templates";
import { Resend } from "resend";

const bodySchema = z.object({
  email: z.string().trim().pipe(z.email("Invalid email address")),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  // Generic response regardless of whether the account exists - no enumeration
  const genericOk = NextResponse.json({
    ok: true,
    message: "If an account exists for this email, a reset code has been sent.",
  });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, disabled: true },
  });
  if (!user || user.disabled) return genericOk;

  const issued = await issueOtp("pwreset", email);
  if ("error" in issued) {
    return NextResponse.json({ error: issued.error }, { status: issued.status });
  }

  try {
    const { subject, html } = passwordResetEmail({ name: user.name, otp: issued.otp });
    await new Resend(process.env.RESEND_API_KEY!).emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html,
    });
  } catch (err) {
    console.error("Password reset email failed:", err);
    return NextResponse.json(
      { error: "Could not send the reset email. Please try again." },
      { status: 500 }
    );
  }

  return genericOk;
}
