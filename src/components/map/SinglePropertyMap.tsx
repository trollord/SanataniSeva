"use client";

import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
  title: string;
}

export default function SinglePropertyMap({ lat, lng, title }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) return;

    (async () => {
      setOptions({ key: apiKey, v: "weekly" });

      const { Map } = await importLibrary("maps");
      const { AdvancedMarkerElement } = await importLibrary("marker");

      const map = new Map(mapRef.current!, {
        center: { lat, lng },
        zoom: 16,
        mapId: "hiranandani-map",
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      new AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title,
      });
    })();
  }, [lat, lng, title]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border text-sm text-gray-400 gap-2">
        <MapPin className="h-4 w-4" />
        Map not available - add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env
      </div>
    );
  }

  return (
    <div ref={mapRef} className="h-64 w-full rounded-xl overflow-hidden border border-gray-200" />
  );
}
