import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { str } from "@/lib/bus-validate";

async function guard() {
  const session = await auth();
  return session && session.user.role === "ADMIN" ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guard();
  if (denied) return denied;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.routeNumber !== undefined) data.routeNumber = str(body.routeNumber, 32);
  if (body.name !== undefined) data.name = str(body.name, 200);
  if (body.origin !== undefined) data.origin = str(body.origin, 120);
  if (body.destination !== undefined) data.destination = str(body.destination, 120);
  if (body.via !== undefined) data.via = str(body.via, 200) || null;
  if (body.operator !== undefined) data.operator = str(body.operator, 80) || null;
  if (body.note !== undefined) data.note = str(body.note, 400) || null;
  if (typeof body.active === "boolean") data.active = body.active;
  if (Number.isInteger(body.sortOrder)) data.sortOrder = body.sortOrder;

  try {
    await prisma.busRoute.update({ where: { id: params.id }, data });
  } catch {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  revalidatePath("/community");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guard();
  if (denied) return denied;

  try {
    // Schedules and exceptions cascade from the schema.
    await prisma.busRoute.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  revalidatePath("/community");
  return NextResponse.json({ ok: true });
}
