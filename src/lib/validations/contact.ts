import { z } from "zod";

// Shared by the /contact form and POST /api/contact, so both accept the same input.

export const SUBJECTS = [
  { value: "general",     label: "General enquiry" },
  { value: "listing",     label: "About a listing" },
  { value: "list",        label: "List my property" },
  { value: "vendor",      label: "Add a vendor to the directory" },
  { value: "partnership", label: "Partnership / business" },
  { value: "feedback",    label: "Feedback or suggestion" },
] as const;

function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
}

/** 10 digits for an Indian mobile, up to 13 once a country code is included. */
function looksLikePhone(v: string) {
  if (!/^[+\d\s\-()]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 10 && digits <= 13;
}

export const contactSchema = z.object({
  subject: z.string().min(1, "Pick a subject"),
  message: z.string().min(10, "Please write at least 10 characters"),
  name: z.string().min(2, "Please enter your full name"),
  // One field for either, so nobody is turned away for not having an email.
  contact: z
    .string()
    .trim()
    .min(1, "Leave a contact number or an email so we can reply")
    .refine(
      (v) => looksLikeEmail(v) || looksLikePhone(v),
      "Enter a valid phone number or email address"
    ),
});

export type ContactFormData = z.infer<typeof contactSchema>;
