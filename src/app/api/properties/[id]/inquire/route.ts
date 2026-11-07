import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePhone } from "@/lib/validations/phone";
import { newInquiryEmail, EMAIL_FROM } from "@/lib/email/templates";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY!);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: propertyId } = await params;
  const seekerId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const phone: string = typeof body?.phone === "string" ? body.phone.trim() : "";
  const message: string = typeof body?.message === "string" ? body.message.trim() : "";
  const callbackTime: string = typeof body?.callbackTime === "string" ? body.callbackTime.trim() : "";
  const phoneError = validatePhone(phone);
  if (phoneError) {
    return NextResponse.json({ error: phoneError }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId, status: "ACTIVE" },
    select: {
      id: true,
      ownerId: true,
      title: true,
      owner: { select: { name: true, email: true } },
    },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (property.ownerId === seekerId) {
    return NextResponse.json({ error: "Cannot inquire on your own property" }, { status: 400 });
  }

  const existing = await prisma.inquiry.findUnique({
    where: { propertyId_seekerId: { propertyId, seekerId } },
  });

  if (existing) {
    return NextResponse.json({ success: true, inquiryId: existing.id });
  }

  const [inquiry] = await prisma.$transaction([
    prisma.inquiry.create({
      data: { propertyId, seekerId, status: "PENDING", phone },
    }),
    // backfill user phone if not set
    ...(phone
      ? [
          prisma.user.updateMany({
            where: { id: seekerId, phone: null },
            data: { phone },
          }),
        ]
      : []),
  ]);

  // Notify the owner about the new lead (never fail the inquiry on email issues)
  if (property.owner.email) {
    try {
      const { subject, html } = newInquiryEmail({
        ownerName: property.owner.name,
        seekerName: session.user.name ?? null,
        seekerPhone: phone,
        propertyTitle: property.title,
        baseUrl: process.env.NEXTAUTH_URL ?? "https://www.hiranandaniproperties.in",
        message: message || undefined,
        callbackTime: callbackTime || undefined,
      });
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: property.owner.email,
        subject,
        html,
      });
    } catch (emailErr) {
      console.error("Lead notification email failed:", emailErr);
    }
  }

  return NextResponse.json({ success: true, inquiryId: inquiry.id });
}
