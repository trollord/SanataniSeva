"use client";

import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { MapPin } from "lucide-react";

interface PropertyPin {
  id: string;
  title: string;
  price: number;
  listingType: string;
  latitude: number | null;
  longitude: number | null;
}

// Hiranandani Estate, Thane - default centre
const DEFAULT_CENTER = { lat: 19.2700, lng: 72.9675 };

function formatPrice(price: number, listingType: string): string {
  if (listingType === "RENT") return `₹${Math.round(price / 1000)}k`;
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(1)}Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)}L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

function makePricePill(price: number, listingType: string): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = [
    "background:#FF5F15",
    "color:white",
    "font-size:11px",
    "font-weight:700",
    "padding:4px 9px",
    "border-radius:20px",
    "white-space:nowrap",
    "cursor:pointer",
    "box-shadow:0 2px 6px rgba(0,0,0,0.30)",
    "border:2px solid white",
    "transition:transform 0.1s,background 0.1s",
    "user-select:none",
  ].join(";");
  el.textContent = formatPrice(price, listingType);
  el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.08)"; el.style.background = "#3b3b3b"; });
  el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)";    el.style.background = "#FF5F15"; });
  return el;
}

export default function MapView({ properties }: { properties: PropertyPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── persistent refs (never cause re-renders) ──────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef        = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AMERef        = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const infoWindowRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef    = useRef<Map<string, any>>(new Map());
  const clustererRef  = useRef<MarkerClusterer | null>(null);
  const readyRef      = useRef(false);
  const prevIdsRef    = useRef<string>("");
  const pendingRef    = useRef<PropertyPin[]>([]);

  // ── helpers ───────────────────────────────────────────────────────────────

  function syncMarkers(listings: PropertyPin[]) {
    const map        = mapRef.current;
    const AME        = AMERef.current;
    const clusterer  = clustererRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !AME || !clusterer || !infoWindow) return;

    const newIds = new Set(listings.map((l) => l.id));

    // ── remove stale markers ─────────────────────────────────────────────
    const toRemove: string[] = [];
    markersRef.current.forEach((_, id) => {
      if (!newIds.has(id)) toRemove.push(id);
    });
    if (toRemove.length) {
      const stale = toRemove.map((id) => markersRef.current.get(id)!);
      clusterer.removeMarkers(stale, true /* no redraw yet */);
      toRemove.forEach((id) => {
        markersRef.current.get(id)!.map = null;
        markersRef.current.delete(id);
      });
    }

    // ── add new markers ──────────────────────────────────────────────────
    const added: unknown[] = [];
    listings.forEach((listing) => {
      if (markersRef.current.has(listing.id)) return;      // already exists

      const position = { lat: listing.latitude!, lng: listing.longitude! };
      const marker = new AME({
        position,
        content: makePricePill(listing.price, listing.listingType),
        title:   listing.title,
      });

      marker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="padding:8px 4px;max-width:200px;font-family:inherit">
            <p style="font-weight:700;font-size:13px;margin:0 0 6px;color:#FF5F15">${listing.title}</p>
            <p style="font-size:12px;color:#555;margin:0 0 8px">${formatPrice(listing.price, listing.listingType)}${listing.listingType === "RENT" ? "/mo" : ""}</p>
            <a href="/listings/${listing.id}" style="color:#FF5F15;font-size:12px;font-weight:600;text-decoration:underline">View details →</a>
          </div>
        `);
        infoWindow.open(map, marker);
      });

      markersRef.current.set(listing.id, marker);
      added.push(marker);
    });

    if (added.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clusterer.addMarkers(added as any[]);
    }

    // ── fit bounds on first load ─────────────────────────────────────────
    if (prevIdsRef.current === "" && listings.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      if (google?.maps?.LatLngBounds) {
        const bounds = new google.maps.LatLngBounds();
        listings.forEach((l) => bounds.extend({ lat: l.latitude!, lng: l.longitude! }));
        map.fitBounds(bounds, 60);
      }
    }
  }

  // ── Effect 1: init map once ───────────────────────────────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current || readyRef.current) return;
    readyRef.current = true;

    (async () => {
      setOptions({ key: apiKey, v: "weekly" });

      const [mapsLib, markerLib] = await Promise.all([
        importLibrary("maps"),
        importLibrary("marker"),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AMERef.current = (markerLib as any).AdvancedMarkerElement;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = new (mapsLib as any).Map(containerRef.current!, {
        center:            DEFAULT_CENTER,
        zoom:              14,
        mapId:             "f3bb37f586d3587c4600c0c2",
        zoomControl:       true,
        streetViewControl: false,
        mapTypeControl:    false,
        fullscreenControl: true,
      });

      mapRef.current        = map;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      infoWindowRef.current = new (mapsLib as any).InfoWindow();

      // Close info window when clicking blank map
      map.addListener("click", () => infoWindowRef.current?.close());

      // ── MarkerClusterer ────────────────────────────────────────────────
      clustererRef.current = new MarkerClusterer({
        map,
        markers:   [],
        algorithm: new SuperClusterAlgorithm({ radius: 80, maxZoom: 15 }),
        renderer:  {
          render({ count, position }) {
            const el = document.createElement("div");
            el.style.cssText = [
              "background:#FF5F15",
              "color:white",
              "border-radius:50%",
              "border:3px solid white",
              "box-shadow:0 2px 8px rgba(0,0,0,0.35)",
              "display:flex",
              "align-items:center",
              "justify-content:center",
              "font-size:12px",
              "font-weight:700",
              "cursor:pointer",
              "user-select:none",
            ].join(";");

            // Scale cluster size by count
            const size = count < 10 ? 36 : count < 50 ? 42 : 50;
            el.style.width  = `${size}px`;
            el.style.height = `${size}px`;
            el.textContent  = String(count);

            return new AMERef.current({ position, content: el });
          },
        },
      });

      // Sync any listings that arrived before the map was ready
      if (pendingRef.current.length > 0) {
        syncMarkers(pendingRef.current);
        pendingRef.current = [];
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect 2: sync markers when listings change ───────────────────────────
  useEffect(() => {
    const withCoords = properties.filter(
      (p) => p.latitude !== null && p.longitude !== null
    );

    // Cheap change detection - skip if the set of ids hasn't changed
    const ids = withCoords.map((p) => p.id).sort().join(",");
    if (ids === prevIdsRef.current) return;
    prevIdsRef.current = ids;

    if (!readyRef.current || !mapRef.current) {
      // Map not ready yet - store for after init
      pendingRef.current = withCoords;
      return;
    }

    syncMarkers(withCoords);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  // ── render ────────────────────────────────────────────────────────────────

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-[65dvh] sm:h-[600px] bg-gray-50 rounded-xl border text-sm text-gray-400 gap-2">
        <MapPin className="h-4 w-4" />
        Map not available - add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[65dvh] sm:h-[600px] w-full rounded-xl overflow-hidden border border-gray-200"
    />
  );
}
