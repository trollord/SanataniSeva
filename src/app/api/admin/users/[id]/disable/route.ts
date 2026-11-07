import { NextRequest, NextResponse } from "next/server";
import { auth, invalidateUserAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { disabled } = await req.json();

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot disable your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (["ADMIN"].includes(target.role)) {
    return NextResponse.json({ error: "Cannot disable admin or manager accounts" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { disabled: Boolean(disabled) },
    select: { id: true, disabled: true, name: true },
  });

  invalidateUserAccess(id);

  return NextResponse.json({ user });
}
