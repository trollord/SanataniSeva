import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { itemInterestEmail, EMAIL_FROM } from "@/lib/email/templates";

const getResend = () => new Resend(process.env.RESEND_API_KEY!);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itemId } = await params;
  const body = await req.json().catch(() => ({}));
  const message: string = typeof body?.message === "string" ? body.message.trim() : "";
  const callbackTime: string = typeof body?.callbackTime === "string" ? body.callbackTime.trim() : "Anytime";

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId, status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      sellerId: true,
      seller: { select: { name: true, email: true } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.sellerId === session.user.id) {
    return NextResponse.json({ error: "Cannot express interest in your own item" }, { status: 400 });
  }

  if (item.seller.email) {
    try {
      const { subject, html } = itemInterestEmail({
        sellerName: item.seller.name,
        buyerName: session.user.name ?? null,
        buyerEmail: session.user.email ?? "",
        itemTitle: item.title,
        message,
        callbackTime,
        baseUrl: process.env.NEXTAUTH_URL ?? "https://www.bluebrics.com",
      });
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: item.seller.email,
        subject,
        html,
      });
    } catch (err) {
      console.error("Item interest email failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}
