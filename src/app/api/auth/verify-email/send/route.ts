import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueOtp } from "@/lib/otp";
import { emailVerificationEmail, EMAIL_FROM } from "@/lib/email/templates";
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

  // Generic response - no account enumeration
  const genericOk = NextResponse.json({
    ok: true,
    message: "If this email needs verification, a code has been sent.",
  });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, password: true, emailVerified: true, disabled: true },
  });
  // Only credentials accounts that are still unverified get a code
  if (!user || user.disabled || !user.password || user.emailVerified) return genericOk;

  const issued = await issueOtp("verify", email);
  if ("error" in issued) {
    return NextResponse.json({ error: issued.error }, { status: issued.status });
  }

  try {
    const { subject, html } = emailVerificationEmail({ name: user.name, otp: issued.otp });
    await new Resend(process.env.RESEND_API_KEY!).emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html,
    });
  } catch (err) {
    console.error("Verification email failed:", err);
    return NextResponse.json(
      { error: "Could not send the verification email. Please try again." },
      { status: 500 }
    );
  }

  return genericOk;
}
