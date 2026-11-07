import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";

const CATEGORY_KEYS = COMMUNITY_CATEGORIES.map((c) => c.key) as [string, ...string[]];

/**
 * Creates one contact from the admin panel. Distinct from
 * POST /api/community/contacts, which is the resident-facing submission and
 * always lands as PENDING: an admin typing a record in *is* the vetting step,
 * so this defaults to ACTIVE and lets the status be chosen explicitly.
 */
const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  contactPerson: z.string().trim().max(80).optional().default(""),
  category: z.enum(CATEGORY_KEYS),
  service: z.string().trim().min(2).max(200),
  phones: z
    .array(z.string().trim().min(3).max(20).regex(/^[+\d\s\-()]+$/, "Invalid phone number"))
    .min(1, "At least one phone number is required")
    .max(5),
  whatsapp: z.boolean().default(false),
  locality: z
    .string()
    .refine((v) => (HIRANANDANI_LOCALITIES as readonly string[]).includes(v), {
      message: "Pick a valid locality",
    }),
  address: z.string().trim().max(200).optional().default(""),
  hours: z.string().trim().max(100).optional().default(""),
  verified: z.boolean().default(false),
  status: z.enum(["ACTIVE", "PENDING", "REJECTED"]).default("ACTIVE"),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { contactPerson, notes, ...rest } = parsed.data;
  const contact = await prisma.communityContact.create({
    data: {
      ...rest,
      contactPerson: contactPerson || null,
      notes: notes || null,
      submittedBy: session.user.email ?? null,
    },
    select: { id: true },
  });

  revalidatePath("/community");
  revalidatePath("/admin/community");
  return NextResponse.json({ id: contact.id }, { status: 201 });
}
