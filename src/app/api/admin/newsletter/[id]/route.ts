import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteS3Object } from "@/lib/s3";
import { revalidatePath } from "next/cache";

/**
 * Flip an edition between DRAFT and PUBLISHED.
 *
 * Both public views are cached for an hour, so the edition page and the index
 * are revalidated here - otherwise an unpublished edition stays readable to
 * anyone holding the link until the window lapses.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== "DRAFT" && status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "status must be DRAFT or PUBLISHED" },
      { status: 400 }
    );
  }

  const existing = await prisma.newsletter.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.newsletter.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });

  revalidatePath("/newspaper");
  revalidatePath(`/newspaper/${id}`);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newsletter = await prisma.newsletter.findUnique({
    where: { id },
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

  await prisma.newsletter.delete({ where: { id } });
  revalidatePath("/newspaper");
  revalidatePath(`/newspaper/${id}`);
  return NextResponse.json({ ok: true });
}
