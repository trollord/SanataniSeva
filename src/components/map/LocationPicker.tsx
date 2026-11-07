"use client";

import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";

const DEFAULT_CENTER = { lat: 19.2700, lng: 72.9675 };

interface Props {
  value?: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ value, onChange }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef         = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef      = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AMERef         = useRef<any>(null);
  const readyRef       = useRef(false);
  const initializedRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function placeOrMoveMarker(map: any, lat: number, lng: number) {
    if (markerRef.current) {
      markerRef.current.position = { lat, lng };
    } else if (AMERef.current) {
      markerRef.current = new AMERef.current({
        map,
        position: { lat, lng },
        title: "Property location",
      });
    }
  }

  /* ── Init map once ── */
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current || readyRef.current) return;
    readyRef.current = true;

    (async () => {
      setOptions({ key: apiKey, v: "weekly" });
      const mapsLib   = await importLibrary("maps");
      const markerLib = await importLibrary("marker");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AMERef.current = (markerLib as any).AdvancedMarkerElement;

      const center = value ?? DEFAULT_CENTER;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = new (mapsLib as any).Map(containerRef.current!, {
        center,
        zoom: 15,
        mapId: "f3bb37f586d3587c4600c0c2",
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      mapRef.current = map;
      if (value) placeOrMoveMarker(map, value.lat, value.lng);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addListener("click", (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        placeOrMoveMarker(map, lat, lng);
        onChange(lat, lng);
      });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Re-center when value changes externally ── */
  useEffect(() => {
    if (!initializedRef.current) { initializedRef.current = true; return; }
    if (!value || !mapRef.current) return;
    mapRef.current.setCenter({ lat: value.lat, lng: value.lng });
    mapRef.current.setZoom(17);
    placeOrMoveMarker(mapRef.current, value.lat, value.lng);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-52 bg-gray-50 rounded-xl border text-sm text-gray-400 gap-2">
        <MapPin className="h-4 w-4" />
        Map not available - add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="h-52 w-full rounded-xl overflow-hidden border border-gray-200 cursor-crosshair"
      />
      {value ? (
        <p className="text-xs text-gray-500">Location set - click the map to adjust if needed</p>
      ) : (
        <p className="text-xs text-gray-400">Click the map to pin the location manually</p>
      )}
    </div>
  );
}
