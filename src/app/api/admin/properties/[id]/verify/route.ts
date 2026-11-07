import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { escapeHtml, EMAIL_FROM } from "@/lib/email/templates";

const getResend = () => new Resend(process.env.RESEND_API_KEY!);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, notes } = body as { action: "APPROVE" | "REJECT"; notes?: string };

  if (!action || !["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      activatedAt: true,
      owner: { select: { email: true, name: true } },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const newStatus = action === "APPROVE" ? "ACTIVE" : "REJECTED";

  await prisma.$transaction([
    prisma.property.update({
      where: { id },
      data:
        newStatus === "ACTIVE"
          ? { status: newStatus, activatedAt: property.activatedAt ?? new Date(), closedAt: null }
          : { status: newStatus },
    }),
    prisma.adminVerification.create({
      data: {
        propertyId: id,
        adminId: session.user.id,
        action: action === "APPROVE" ? "APPROVED" : "REJECTED",
        notes: notes ?? null,
      },
    }),
  ]);

  // Revalidate listing pages
  revalidatePath("/listings");
  revalidatePath(`/listings/${id}`);

  // Send email notification
  try {
    if (action === "APPROVE") {
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: property.owner.email!,
        subject: "Your listing has been approved!",
        html: `<p>Your listing "<b>${escapeHtml(property.title)}</b>" is now live on Sanatani Community.</p><p><a href="${process.env.NEXTAUTH_URL}/listings/${property.id}">View listing</a></p>`,
      });
    } else {
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: property.owner.email!,
        subject: "Update on your listing submission",
        html: `<p>Your listing "<b>${escapeHtml(property.title)}</b>" was not approved.</p><p>Reason: ${escapeHtml(notes ?? "No reason provided")}</p>`,
      });
    }
  } catch (emailErr) {
    // Don't fail the request if email fails
    console.error("Email send failed:", emailErr);
  }

  return NextResponse.json({ success: true, status: newStatus });
}
