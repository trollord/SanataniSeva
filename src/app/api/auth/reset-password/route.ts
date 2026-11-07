import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { resetPasswordSchema } from "@/lib/validations/user";

export async function POST(req: NextRequest) {
  const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const issues = parsed.error.issues ?? [];
    return NextResponse.json({ error: issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const { otp, password } = parsed.data;

  const result = await verifyOtp("pwreset", email, otp);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    // Proving OTP ownership also verifies the email
    data: { password: passwordHash, emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true });
}
