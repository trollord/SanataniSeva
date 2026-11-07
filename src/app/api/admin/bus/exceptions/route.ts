import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isExceptionType, parseDate, parseTimesInput, str } from "@/lib/bus-validate";

async function guard() {
  const session = await auth();
  return session && session.user.role === "ADMIN" ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const body = await req.json();
  const routeId = str(body.routeId, 40);
  const type = body.type;
  const startDate = parseDate(body.startDate);
  // A single-day override just repeats the start date.
  const endDate = parseDate(body.endDate) ?? startDate;

  if (!routeId) return NextResponse.json({ error: "Route is required." }, { status: 400 });
  if (!isExceptionType(type)) return NextResponse.json({ error: "Invalid override type." }, { status: 400 });
  if (!startDate || !endDate) return NextResponse.json({ error: "A valid date is required (YYYY-MM-DD)." }, { status: 400 });
  if (endDate < startDate) return NextResponse.json({ error: "End date cannot be before start date." }, { status: 400 });

  const times = parseTimesInput(body.times);
  if (type !== "CANCELLED" && times.length === 0) {
    return NextResponse.json(
      { error: "Replaced and extra services need at least one time." },
      { status: 400 },
    );
  }

  await prisma.busException.create({
    data: {
      routeId,
      type,
      startDate,
      endDate,
      times: JSON.stringify(type === "CANCELLED" ? [] : times),
      reason: str(body.reason, 200) || null,
    },
  });

  revalidatePath("/community");
  return NextResponse.json({ ok: true });
}
