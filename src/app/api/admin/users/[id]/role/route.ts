import { NextRequest, NextResponse } from "next/server";
import { auth, invalidateUserAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { role } = body as { role: string };

  if (!role || !["USER", "OWNER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role. Must be USER, OWNER or ADMIN." }, { status: 400 });
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, role: true, name: true, email: true },
  });

  invalidateUserAccess(id);

  return NextResponse.json({ user: updated });
}
