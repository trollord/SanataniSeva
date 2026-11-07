import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { escapeHtml, EMAIL_FROM } from "@/lib/email/templates";

const getResend = () => new Resend(process.env.RESEND_API_KEY!);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: propertyId } = await params;
  const body = await req.json();
  const { status } = body as { status: string };

  // Only ACTIVE <-> INACTIVE transitions are allowed
  if (status !== "ACTIVE" && status !== "INACTIVE") {
    return NextResponse.json(
      { error: "Only ACTIVE or INACTIVE status is allowed" },
      { status: 400 }
    );
  }

  // Fetch property and check ownership
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true, status: true, title: true, activatedAt: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (property.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate transition
  if (
    (status === "INACTIVE" && property.status !== "ACTIVE") ||
    (status === "ACTIVE" && property.status !== "INACTIVE")
  ) {
    return NextResponse.json(
      { error: `Cannot transition from ${property.status} to ${status}` },
      { status: 400 }
    );
  }

  // When going INACTIVE: notify pending seekers and complete their inquiries
  if (status === "INACTIVE") {
    const pendingInquiries = await prisma.inquiry.findMany({
      where: { propertyId, status: "PENDING" },
      select: {
        id: true,
        seeker: { select: { name: true, email: true } },
      },
    });

    // Send emails to each seeker (non-blocking)
    for (const inquiry of pendingInquiries) {
      try {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: inquiry.seeker.email,
          subject: "Property no longer available - Sanatani Community",
          html: `<p>Hi ${escapeHtml(inquiry.seeker.name ?? "there")},</p><p>The property "<b>${escapeHtml(property.title)}</b>" you expressed interest in has been marked as rented/sold and is no longer available.</p><p>Browse other properties at ${process.env.NEXTAUTH_URL}/listings</p>`,
        });
      } catch {
        // Don't fail the request if email fails
      }
    }

    // Update all pending inquiries to COMPLETED
    if (pendingInquiries.length > 0) {
      await prisma.inquiry.updateMany({
        where: {
          propertyId,
          status: "PENDING",
        },
        data: { status: "COMPLETED" },
      });
    }
  }

  // Update property status
  await prisma.property.update({
    where: { id: propertyId },
    data:
      status === "INACTIVE"
        ? { status, closedAt: new Date() }
        : { status, closedAt: null, activatedAt: property.activatedAt ?? new Date() },
  });

  return NextResponse.json({ success: true, status });
}
