import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      seeker: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      property: {
        select: {
          id: true,
          title: true,
          locality: true,
          building: true,
          listingType: true,
          type: true,
          owner: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ inquiry });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!["PENDING", "SEEN"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.inquiry.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ inquiry: updated });
}
