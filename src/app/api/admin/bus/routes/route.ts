import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { str } from "@/lib/bus-validate";

async function guard() {
  const session = await auth();
  return session && session.user.role === "ADMIN" ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const body = await req.json();
  const routeNumber = str(body.routeNumber, 32);
  const origin = str(body.origin, 120);
  const destination = str(body.destination, 120);

  if (!routeNumber || !origin || !destination) {
    return NextResponse.json(
      { error: "Route number, origin and destination are required." },
      { status: 400 },
    );
  }

  const route = await prisma.busRoute.create({
    data: {
      routeNumber,
      origin,
      destination,
      name: str(body.name, 200) || `${origin} → ${destination}`,
      via: str(body.via, 200) || null,
      operator: str(body.operator, 80) || null,
      note: str(body.note, 400) || null,
      sortOrder: Number.isInteger(body.sortOrder) ? body.sortOrder : 0,
    },
  });

  revalidatePath("/community");
  return NextResponse.json({ ok: true, id: route.id });
}
