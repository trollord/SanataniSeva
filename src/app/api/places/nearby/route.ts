import { NextRequest, NextResponse } from "next/server";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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

const ALLOWED_TYPES = new Set(["hospital", "pharmacy", "drugstore", "school"]);

// Bounding box covering all of Hiranandani Estate, Thane
const BOUNDS = { latMin: 19.253, latMax: 19.286, lngMin: 72.948, lngMax: 72.987 };

export async function GET(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!isAllowed(ip)) {
    return NextResponse.json({ error: "Too many requests - please slow down" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const lat  = parseFloat(searchParams.get("lat") ?? "");
  const lng  = parseFloat(searchParams.get("lng") ?? "");
  const type = searchParams.get("type") ?? "";

  if (!lat || !lng || !type) {
    return NextResponse.json({ error: "Missing lat, lng or type" }, { status: 400 });
  }

  // Only allow the place types the app actually uses
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid place type" }, { status: 400 });
  }

  // Reject coordinates outside Hiranandani Estate
  if (lat < BOUNDS.latMin || lat > BOUNDS.latMax || lng < BOUNDS.lngMin || lng > BOUNDS.lngMax) {
    return NextResponse.json({ error: "Location out of range" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Maps API key not configured" }, { status: 500 });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.displayName,places.location",
    },
    body: JSON.stringify({
      includedTypes: [type],
      maxResultCount: 5,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 5000.0,
        },
      },
    }),
  });

  if (!res.ok) {
    console.error("[places/nearby] Google API error:", await res.text());
    return NextResponse.json({ error: "Places API error" }, { status: 502 });
  }

  const data = await res.json();

  const places = (data.places ?? []).map((p: {
    displayName?: { text?: string };
    location?: { latitude?: number; longitude?: number };
  }) => ({
    name: p.displayName?.text ?? type,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
  })).filter((p: { lat?: number; lng?: number }) => p.lat != null && p.lng != null);

  return NextResponse.json({ places });
}
