import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      seeker: { select: { id: true, name: true, email: true, phone: true } },
      property: {
        select: {
          id: true,
          title: true,
          locality: true,
          building: true,
          owner: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

  return NextResponse.json({ inquiries });
}
