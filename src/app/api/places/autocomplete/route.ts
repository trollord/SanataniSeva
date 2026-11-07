import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;   // requests per window per IP
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

// Tight bounding box covering all of Hiranandani Estate, Thane
const LOCATION_RESTRICTION = {
  rectangle: {
    low:  { latitude: 19.253, longitude: 72.948 },
    high: { latitude: 19.286, longitude: 72.987 },
  },
};

export async function POST(req: NextRequest) {
  // Must be signed in
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to search addresses" }, { status: 401 });
  }

  // IP rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!isAllowed(ip)) {
    return NextResponse.json({ error: "Too many requests - please slow down" }, { status: 429 });
  }

  let input: string, sessionToken: string;
  try {
    ({ input, sessionToken } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!input || input.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Maps API not configured" }, { status: 500 });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({ input, sessionToken, locationRestriction: LOCATION_RESTRICTION }),
  });

  if (!res.ok) {
    console.error("[places/autocomplete] Google error:", await res.text());
    return NextResponse.json({ error: "Places API error" }, { status: 502 });
  }

  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suggestions = (data.suggestions ?? []).map((s: any) => {
    const p = s.placePrediction;
    return {
      placeId:       p.placeId,
      mainText:      p.structuredFormat?.mainText?.text      ?? p.text?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
      matches:       p.structuredFormat?.mainText?.matches   ?? p.text?.matches ?? [],
    };
  });

  return NextResponse.json({ suggestions });
}
