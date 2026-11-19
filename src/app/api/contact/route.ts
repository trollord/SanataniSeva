import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema, SUBJECTS } from "@/lib/validations/contact";
import { contactMessageEmail, EMAIL_FROM } from "@/lib/email/templates";
import { CONTACT_EMAIL } from "@/lib/constants";

const getResend = () => new Resend(process.env.RESEND_API_KEY!);

/** The /contact form. Nothing is stored: the message goes straight to the team inbox. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }

  const { subject, message, name, contact } = parsed.data;
  const subjectLabel = SUBJECTS.find((s) => s.value === subject)?.label ?? subject;
  const { subject: emailSubject, html } = contactMessageEmail({ subjectLabel, message, name, contact });

  // Unlike lead notifications, the email IS the submission: if it fails the
  // visitor must be told, or their message is silently lost.
  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: CONTACT_EMAIL,
    // Hitting Reply in the inbox answers the visitor when they left an email
    ...(contact.includes("@") ? { replyTo: contact } : {}),
    subject: emailSubject,
    html,
  });
  if (error) {
    console.error("Contact form email failed:", error);
    return NextResponse.json({ error: "Could not send message" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
