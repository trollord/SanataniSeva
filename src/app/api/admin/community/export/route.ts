import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await prisma.communityContact.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      phone: true,
      category: true,
      service: true,
      locality: true,
      contactPerson: true,
      address: true,
      hours: true,
      whatsapp: true,
      status: true,
      verified: true,
      createdAt: true,
      tags: true,
    },
  });

  const headers = [
    "name", "phone", "category", "service", "locality",
    "contactPerson", "address", "hours", "whatsapp", "status", "verified", "createdAt", "tags",
  ];

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const rows = contacts.map((c) => [
    escape(c.name),
    escape(c.phone),
    escape(c.category),
    escape(c.service),
    escape(c.locality),
    escape(c.contactPerson ?? ""),
    escape(c.address),
    escape(c.hours),
    c.whatsapp ? "Yes" : "No",
    escape(c.status),
    c.verified ? "Yes" : "No",
    escape(c.createdAt.toISOString()),
    escape(
      (() => {
        try { return (JSON.parse(c.tags) as string[]).join("|"); } catch { return ""; }
      })()
    ),
  ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="community-contacts.csv"`,
    },
  });
}
