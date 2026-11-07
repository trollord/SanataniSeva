import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { parseDate, parseDaysInput, parseTimesInput, str } from "@/lib/bus-validate";

async function guard() {
  const session = await auth();
  return session && session.user.role === "ADMIN" ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const body = await req.json();
  const routeId = str(body.routeId, 40);
  const days = parseDaysInput(body.daysOfWeek);
  const times = parseTimesInput(body.times);

  if (!routeId) return NextResponse.json({ error: "Route is required." }, { status: 400 });
  if (days.length === 0) return NextResponse.json({ error: "Pick at least one day." }, { status: 400 });
  if (times.length === 0) return NextResponse.json({ error: "Add at least one valid time (HH:MM)." }, { status: 400 });

  const validFrom = parseDate(body.validFrom);
  const validUntil = parseDate(body.validUntil);
  if (validFrom && validUntil && validUntil < validFrom) {
    return NextResponse.json({ error: "“Valid until” cannot be before “valid from”." }, { status: 400 });
  }

  await prisma.busSchedule.create({
    data: {
      routeId,
      label: str(body.label, 80),
      daysOfWeek: JSON.stringify(days),
      times: JSON.stringify(times),
      validFrom,
      validUntil,
    },
  });

  revalidatePath("/community");
  return NextResponse.json({ ok: true });
}
