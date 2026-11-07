import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;   // details calls are more expensive - tighter limit
const WINDOW_MS  = 60_000;

function isAllowed(ip: string): boolean {
  const now   = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!isAllowed(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let placeId: string, sessionToken: string;
  try {
    ({ placeId, sessionToken } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Maps API not configured" }, { status: 500 });
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

  const res = await fetch(url.toString(), {
    headers: {
      "X-Goog-Api-Key":   apiKey,
      "X-Goog-FieldMask": "location,formattedAddress",
    },
  });

  if (!res.ok) {
    console.error("[places/details] Google error:", await res.text());
    return NextResponse.json({ error: "Places API error" }, { status: 502 });
  }

  const data = await res.json();

  if (!data.location) {
    return NextResponse.json({ error: "No location found" }, { status: 404 });
  }

  return NextResponse.json({
    address: data.formattedAddress ?? "",
    lat:     data.location.latitude,
    lng:     data.location.longitude,
  });
}
