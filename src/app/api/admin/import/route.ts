import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { csv } = body as { csv: string };

  if (!csv?.trim()) {
    return NextResponse.json({ error: "No CSV data provided" }, { status: 400 });
  }

  const rows = parseCSV(csv);
  let imported = 0;

  for (const row of rows) {
    const { propertyId, price, recordedAt, source } = row;

    if (!propertyId || !price || !recordedAt) continue;
    if (!["LISTING", "ADMIN_IMPORT"].includes(source)) continue;

    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) continue;

    const recordedDate = new Date(recordedAt);
    if (isNaN(recordedDate.getTime())) continue;

    // Check property exists
    const exists = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!exists) continue;

    await prisma.priceHistory.create({
      data: {
        propertyId,
        price: priceNum,
        recordedAt: recordedDate,
        source: source as "LISTING" | "ADMIN_IMPORT",
      },
    });

    imported++;
  }

  return NextResponse.json({ imported });
}
