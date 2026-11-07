import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";

const CATEGORY_KEYS = COMMUNITY_CATEGORIES.map((c) => c.key) as [string, ...string[]];

const rowSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(20).regex(/^[+\d\s\-()]+$/),
  category: z.enum(CATEGORY_KEYS),
  service: z.string().min(5).max(200),
  locality: z.string().refine(
    (v) => (HIRANANDANI_LOCALITIES as readonly string[]).includes(v),
    { message: "Invalid locality" }
  ),
  contactPerson: z.string().max(80).optional(),
  address: z.string().max(200).optional().default(""),
  hours: z.string().max(100).optional().default(""),
  whatsapp: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  const valid: z.infer<typeof rowSchema>[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = rowSchema.safeParse(rows[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({
        row: i + 1,
        message: result.error.issues[0]?.message ?? "Invalid row",
      });
    }
  }

  let created = 0;
  if (valid.length > 0) {
    const result = await prisma.communityContact.createMany({
      data: valid.map(({ contactPerson, ...rest }) => ({
        ...rest,
        contactPerson: contactPerson || null,
        status: "ACTIVE",
        verified: false,
        tags: "[]",
      })),
    });
    created = result.count;
    revalidatePath("/community");
  }

  return NextResponse.json({ created, errors });
}
