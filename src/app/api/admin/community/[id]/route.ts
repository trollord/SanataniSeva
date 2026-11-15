import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkCategoryChoice } from "@/lib/directory-categories";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";
import { parsePhone } from "@/lib/phone";

/**
 * Every field is optional so the status dropdown can keep sending just
 * `{ status }` while the edit dialog sends the whole record. `.strict()` makes a
 * typo in a field name a 400 rather than a silent no-op write.
 */
const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    contactPerson: z.string().trim().max(80).nullable(),
    // Checked against the DirectoryCategory table after parsing
    category: z.string().trim().min(1),
    subcategoryId: z.string().min(1).nullable(),
    service: z.string().trim().min(2).max(200),
    phones: z
      .array(
        z
          .string()
          .trim()
          .transform((v, ctx) => {
          const parsed = parsePhone(v);
          if (!parsed.valid) {
            // Surfaces the specific reason ("…has 9 digits") rather than a
            // generic rejection, so an admin can see what to fix.
            ctx.addIssue({ code: "custom", message: parsed.reason ?? "Invalid phone number" });
            return z.NEVER;
          }
          return parsed.display;
        })
      )
      .max(5),
    whatsapp: z.boolean(),
    locality: z
      .string()
      .refine((v) => (HIRANANDANI_LOCALITIES as readonly string[]).includes(v)),
    address: z.string().trim().max(200),
    hours: z.string().trim().max(100),
    verified: z.boolean(),
    status: z.enum(["ACTIVE", "REJECTED", "PENDING"]),
    notes: z.string().trim().max(2000).nullable(),
  })
  .partial()
  .strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Category and subcategory are checked as a pair. The edit dialog sends
  // both; if only one arrives, the other comes from the saved row.
  if (data.category !== undefined || data.subcategoryId !== undefined) {
    const current = await prisma.communityContact.findUnique({
      where: { id },
      select: { category: true, subcategoryId: true },
    });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // A subcategory belongs to one category, so moving the contact without
    // naming a new one drops the old one rather than failing the check.
    if (
      data.subcategoryId === undefined &&
      data.category !== undefined &&
      data.category !== current.category
    ) {
      data.subcategoryId = null;
    }
    const categoryError = await checkCategoryChoice(
      data.category ?? current.category,
      data.subcategoryId !== undefined ? data.subcategoryId : current.subcategoryId
    );
    if (categoryError) {
      return NextResponse.json({ error: categoryError }, { status: 400 });
    }
  }

  // Publishing a contact nobody can call would render a dead card, and the
  // public page filters those out anyway - so say why instead of silently
  // accepting it.
  if (data.status === "ACTIVE" && data.phones && data.phones.length === 0) {
    return NextResponse.json(
      { error: "Add at least one phone number before marking this active." },
      { status: 400 }
    );
  }
  if (data.status === "ACTIVE" && !data.phones) {
    const current = await prisma.communityContact.findUnique({
      where: { id },
      select: { phones: true },
    });
    if (current && current.phones.length === 0) {
      return NextResponse.json(
        { error: "Add at least one phone number before marking this active." },
        { status: 400 }
      );
    }
  }

  try {
    await prisma.communityContact.update({ where: { id }, data });
    revalidatePath("/community");
    revalidatePath("/admin/community");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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

  try {
    await prisma.communityContact.delete({ where: { id } });
    revalidatePath("/community");
    revalidatePath("/admin/community");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
