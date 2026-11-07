import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const ALLOWED_STATUSES = ["PENDING", "ACTIVE", "SOLD", "CLOSED"] as const;
type Status = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: Status; notes?: string };
  const nextStatus = body.status;

  if (!nextStatus || !ALLOWED_STATUSES.includes(nextStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.item.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const updates: {
    status: Status;
    activatedAt?: Date | null;
    closedAt?: Date | null;
  } = { status: nextStatus };

  if (nextStatus === "ACTIVE" && existing.status !== "ACTIVE") {
    updates.activatedAt = new Date();
    updates.closedAt = null;
  }
  if (nextStatus === "SOLD" || nextStatus === "CLOSED") {
    updates.closedAt = new Date();
  }

  await prisma.item.update({ where: { id }, data: updates });

  await prisma.adminVerification.create({
    data: {
      itemId: id,
      adminId: session.user.id,
      action: nextStatus,
      notes: body.notes ?? null,
    },
  });

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${id}`);

  return NextResponse.json({ ok: true, status: nextStatus });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.item.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.item.delete({ where: { id } });
  revalidatePath("/marketplace");
  return NextResponse.json({ ok: true });
}
