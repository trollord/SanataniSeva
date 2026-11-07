import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await prisma.busException.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Override not found" }, { status: 404 });
  }
  revalidatePath("/community");
  return NextResponse.json({ ok: true });
}
