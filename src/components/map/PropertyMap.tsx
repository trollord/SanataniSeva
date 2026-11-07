"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin, Loader2 } from "lucide-react";

type AmenityType = "hospital" | "pharmacy" | "school";

interface Props {
  lat: number;
  lng: number;
  propertyId: string;
  activeAmenity: AmenityType | null;
}

const AMENITY_COLOR: Record<AmenityType, string> = {
  hospital: "#ef4444",
  pharmacy: "#22c55e",
  school:   "#3b82f6",
};

// SVG icon paths (viewBox 0 0 24 24, stroke-based)
const AMENITY_ICON: Record<AmenityType, string> = {
  hospital: `<path stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/>`,
  pharmacy: `<path stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 3h6v2.5a3 3 0 0 1-3 3 3 3 0 0 1-3-3V3zM6 8.5h12l-1.5 9.5H7.5L6 8.5z"/><path stroke="white" stroke-width="2" stroke-linecap="round" d="M10 13h4"/>`,
  school:   `<path stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3L2 9l10 6 10-6-10-6zM2 9v6M22 9v6M6 11.5V17c0 1.657 2.686 3 6 3s6-1.343 6-3v-5.5"/>`,
};

const HOME_ICON = `<path stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 12L12 3l9 9M5 10v9a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-9"/>`;

function makeIconPin(
  label: string,
  color: string,
  iconSvgInner: string,
  size: number
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;";

  const pin = document.createElement("div");
  pin.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    `background:${color}`,
    "border-radius:8px",
    "border:2.5px solid white",
    "box-shadow:0 2px 8px rgba(0,0,0,0.40)",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "flex-shrink:0",
  ].join(";");

  const iconSize = Math.round(size * 0.6);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(iconSize));
  svg.setAttribute("height", String(iconSize));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  const parsed = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${iconSvgInner}</svg>`,
    "image/svg+xml"
  );
  parsed.documentElement.childNodes.forEach((n) => svg.appendChild(n.cloneNode(true)));
  pin.appendChild(svg);

  const tooltip = document.createElement("span");
  tooltip.textContent = label;
  tooltip.style.cssText = [
    "position:absolute",
    `bottom:${size + 6}px`,
    "left:50%",
    "transform:translateX(-50%)",
    `background:${color}`,
    "color:white",
    "font-size:11px",
    "font-weight:600",
    "padding:3px 8px",
    "border-radius:4px",
    "white-space:nowrap",
    "max-width:180px",
    "overflow:hidden",
    "text-overflow:ellipsis",
    "opacity:0",
    "pointer-events:none",
    "transition:opacity 0.15s",
    "box-shadow:0 2px 6px rgba(0,0,0,0.25)",
    "z-index:10",
  ].join(";");

  wrapper.addEventListener("mouseenter", () => { tooltip.style.opacity = "1"; });
  wrapper.addEventListener("mouseleave", () => { tooltip.style.opacity = "0"; });

  wrapper.appendChild(pin);
  wrapper.appendChild(tooltip);
  return wrapper;
}

export default function PropertyMap({ lat, lng, propertyId, activeAmenity }: Props) {
  const containerRef      = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef            = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const amenityMarkersRef = useRef<any[]>([]);
  const cacheRef          = useRef<Record<string, { name: string; lat: number; lng: number }[]>>({});
  const debounceRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AdvancedMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LatLngBoundsRef   = useRef<any>(null);
  const readyRef          = useRef(false);
  const [loading, setLoading]   = useState(false);
  const [noResults, setNoResults] = useState(false);

  /* ── Effect 1: init map once ─────────────────────────────────────────── */
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current || readyRef.current) return;
    readyRef.current = true;

    (async () => {
      setOptions({ key: apiKey, v: "weekly" });

      const mapsLib   = await importLibrary("maps");
      const markerLib = await importLibrary("marker");
      const coreLib   = await importLibrary("core");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      LatLngBoundsRef.current   = (coreLib as any).LatLngBounds;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AdvancedMarkerRef.current = (markerLib as any).AdvancedMarkerElement;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = new (mapsLib as any).Map(containerRef.current!, {
        center:            { lat, lng },
        zoom:              15,
        mapId:             "f3bb37f586d3587c4600c0c2",
        zoomControl:       true,
        streetViewControl: false,
        mapTypeControl:    false,
        fullscreenControl: false,
      });

      mapRef.current = map;

      // Styled persistent property marker - black, house icon
      new AdvancedMarkerRef.current({
        map,
        position: { lat, lng },
        content:  makeIconPin("This Property", "#FF5F15", HOME_ICON, 38),
        title:    "Property",
        zIndex:   1,
      });
    })();
  }, [lat, lng]);

  /* ── Effect 2: fetch & render amenities ──────────────────────────────── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setNoResults(false);

    debounceRef.current = setTimeout(async () => {
      const map = mapRef.current;
      const AME = AdvancedMarkerRef.current;
      const LLB = LatLngBoundsRef.current;
      if (!map) return;

      // Clear old amenity markers
      amenityMarkersRef.current.forEach((m) => { m.map = null; });
      amenityMarkersRef.current = [];

      if (!activeAmenity) {
        map.setCenter({ lat, lng });
        map.setZoom(15);
        return;
      }

      const cacheKey = `${propertyId}_${activeAmenity}`;
      let places: { name: string; lat: number; lng: number }[];

      if (cacheRef.current[cacheKey]) {
        places = cacheRef.current[cacheKey];
      } else {
        setLoading(true);
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
          const res = await fetch(
            "https://places.googleapis.com/v1/places:searchNearby",
            {
              method: "POST",
              headers: {
                "Content-Type":      "application/json",
                "X-Goog-Api-Key":    apiKey,
                "X-Goog-FieldMask":  "places.displayName,places.location",
              },
              body: JSON.stringify({
                includedTypes:       activeAmenity === "pharmacy" ? ["pharmacy", "drugstore"] : [activeAmenity],
                maxResultCount:      5,
                locationRestriction: {
                  circle: {
                    center: { latitude: lat, longitude: lng },
                    radius: 2000.0,
                  },
                },
              }),
            }
          );
          const data = await res.json();
          if (!res.ok) {
            places = [];
          } else {
            places = (data.places ?? []).map((p: {
              displayName?: { text?: string };
              location?: { latitude?: number; longitude?: number };
            }) => ({
              name: p.displayName?.text ?? activeAmenity,
              lat:  p.location?.latitude ?? 0,
              lng:  p.location?.longitude ?? 0,
            })).filter((p: { lat: number; lng: number }) => p.lat && p.lng);
          }
        } catch {
          places = [];
        } finally {
          setLoading(false);
        }

        if (places.length) cacheRef.current[cacheKey] = places;
      }

      if (!places.length) {
        setNoResults(true);
        return;
      }

      if (!AME || !LLB) return;

      const bounds = new LLB();
      bounds.extend({ lat, lng });

      const color = AMENITY_COLOR[activeAmenity];

      places.forEach(({ name, lat: pLat, lng: pLng }) => {
        const position = { lat: pLat, lng: pLng };
        bounds.extend(position);

        amenityMarkersRef.current.push(
          new AME({ map, position, content: makeIconPin(name, color, AMENITY_ICON[activeAmenity], 30), title: name, zIndex: 2 })
        );
      });

      map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeAmenity, lat, lng, propertyId]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-72 bg-gray-50 rounded-xl border text-sm text-gray-400 gap-2">
        <MapPin className="h-4 w-4" />
        Map not available - add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div
          ref={containerRef}
          className="h-72 w-full rounded-xl overflow-hidden border border-gray-200"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching nearby…
            </div>
          </div>
        )}
      </div>
      {noResults && activeAmenity && (
        <p className="text-xs text-gray-400">
          No {activeAmenity}s found within 5km.
        </p>
      )}
    </div>
  );
}
