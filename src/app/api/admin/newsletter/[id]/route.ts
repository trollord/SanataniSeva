import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteS3Object } from "@/lib/s3";
import { revalidatePath } from "next/cache";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newsletter = await prisma.newsletter.findUnique({
    where: { id: params.id },
    select: { publicId: true },
  });
  if (!newsletter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await deleteS3Object(newsletter.publicId);
  } catch {
    // continue even if S3 delete fails
  }

  await prisma.newsletter.delete({ where: { id: params.id } });
  revalidatePath("/newspaper");
  return NextResponse.json({ ok: true });
}
