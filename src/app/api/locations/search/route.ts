import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Local-first address search over our own location index. Free and instant;
// the client only falls back to Google when this returns nothing.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ locations: [] });

  const locations = await prisma.location.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ hits: "desc" }, { name: "asc" }],
    take: 6,
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      placeId: true,
    },
  });

  return NextResponse.json({ locations });
}
