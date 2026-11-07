import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json() as { action: "APPROVE" | "REJECT" };

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (property.status !== "DELETE_REQUESTED") {
    return NextResponse.json({ error: "Property has no pending delete request" }, { status: 409 });
  }

  if (action === "APPROVE") {
    // Hard delete - clean up relations without cascade first
    await prisma.inquiry.deleteMany({ where: { propertyId: id } });
    await prisma.adminVerification.deleteMany({ where: { propertyId: id } });
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  }

  // REJECT - revert to INACTIVE
  await prisma.property.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  return NextResponse.json({ rejected: true });
}
