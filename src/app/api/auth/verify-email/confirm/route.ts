import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

const bodySchema = z.object({
  email: z.string().trim().pipe(z.email("Invalid email address")),
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const issues = parsed.error.issues ?? [];
    return NextResponse.json({ error: issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const result = await verifyOtp("verify", email, parsed.data.otp);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await prisma.user.updateMany({
    where: { email, emailVerified: null },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true });
}
