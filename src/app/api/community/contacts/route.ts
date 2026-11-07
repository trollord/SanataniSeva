import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { COMMUNITY_CATEGORIES } from "@/lib/community";
import { HIRANANDANI_LOCALITIES } from "@/lib/constants";

const CATEGORY_KEYS = COMMUNITY_CATEGORIES.map((c) => c.key) as [string, ...string[]];

const submitSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d\s\-()]+$/, "Enter a valid phone number"),
  category: z.enum(CATEGORY_KEYS),
  service: z.string().min(5, "Describe the service (min 5 chars)").max(200),
  locality: z.string().refine((v) => (HIRANANDANI_LOCALITIES as readonly string[]).includes(v), {
    message: "Pick a valid locality",
  }),
  address: z.string().max(200).optional().default(""),
  contactPerson: z.string().max(80).optional(),
  hours: z.string().max(100).optional().default(""),
  whatsapp: z.boolean().default(false),
  submittedBy: z.string().email().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { submittedBy, contactPerson, ...rest } = parsed.data;
    const contact = await prisma.communityContact.create({
      data: {
        ...rest,
        contactPerson: contactPerson || null,
        submittedBy: submittedBy || null,
        status: "PENDING",
      },
      select: { id: true },
    });

    return NextResponse.json({ id: contact.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET() {
  const contacts = await prisma.communityContact.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      contactPerson: true,
      category: true,
      service: true,
      phone: true,
      whatsapp: true,
      locality: true,
      address: true,
      hours: true,
      tags: true,
      verified: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ contacts });
}
