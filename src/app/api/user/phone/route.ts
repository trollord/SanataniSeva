import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The session carries no phone, so listing forms read it here to pre-fill
// their contact number field.
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  return NextResponse.json({ phone: user?.phone ?? null });
}
