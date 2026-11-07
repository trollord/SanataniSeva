import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { parseDate, parseDaysInput, parseTimesInput, str } from "@/lib/bus-validate";

async function guard() {
  const session = await auth();
  return session && session.user.role === "ADMIN" ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guard();
  if (denied) return denied;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.label !== undefined) data.label = str(body.label, 80);
  if (typeof body.active === "boolean") data.active = body.active;

  if (body.daysOfWeek !== undefined) {
    const days = parseDaysInput(body.daysOfWeek);
    if (days.length === 0) return NextResponse.json({ error: "Pick at least one day." }, { status: 400 });
    data.daysOfWeek = JSON.stringify(days);
  }
  if (body.times !== undefined) {
    const times = parseTimesInput(body.times);
    if (times.length === 0) return NextResponse.json({ error: "Add at least one valid time (HH:MM)." }, { status: 400 });
    data.times = JSON.stringify(times);
  }
  if (body.validFrom !== undefined) data.validFrom = parseDate(body.validFrom);
  if (body.validUntil !== undefined) data.validUntil = parseDate(body.validUntil);

  try {
    await prisma.busSchedule.update({ where: { id: params.id }, data });
  } catch {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  revalidatePath("/community");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guard();
  if (denied) return denied;
  try {
    await prisma.busSchedule.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }
  revalidatePath("/community");
  return NextResponse.json({ ok: true });
}
