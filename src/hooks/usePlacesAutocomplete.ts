"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export interface PlacePrediction {
  source: "local" | "google";
  /** Google place id for google results; our Location row id for local ones */
  placeId: string;
  mainText: string;
  secondaryText: string;
  matches: Array<{ startOffset: number; endOffset: number }>;
  /** Present on local results - selecting them needs no Google call at all */
  lat?: number;
  lng?: number;
}

export interface SelectedPlace {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

/* ── Module-level LRU cache ── */
const MAX_CACHE = 30;
const queryCache = new Map<string, PlacePrediction[]>();

function cacheGet(key: string) {
  return queryCache.get(key.toLowerCase().trim());
}

function cacheSet(key: string, value: PlacePrediction[]) {
  if (queryCache.size >= MAX_CACHE) queryCache.delete(queryCache.keys().next().value!);
  queryCache.set(key.toLowerCase().trim(), value);
}

// Bounding box: Hiranandani Estate, Thane
const BOUNDS = { west: 72.948, south: 19.253, east: 72.987, north: 19.286 };

export function usePlacesAutocomplete() {
  const [query, setQuery]             = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionTokenRef = useRef<any>(null);
  const reqIdRef        = useRef(0);
  const debounceRef     = useRef<ReturnType<typeof setTimeout>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placesLibRef    = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) setOptions({ key: apiKey, v: "weekly" });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function getPlacesLib(): Promise<any> {
    if (placesLibRef.current) return placesLibRef.current;
    const lib = await importLibrary("places");
    placesLibRef.current = lib;
    return lib;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function ensureToken(lib: any) {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new lib.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }

  const fetchPredictions = useCallback(async (input: string) => {
    const cached = cacheGet(input);
    if (cached) { setPredictions(cached); return; }

    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);

    // Local-first: our own location index answers most searches for free.
    // Google is only consulted when the index has no match.
    try {
      const res = await fetch(`/api/locations/search?q=${encodeURIComponent(input)}`);
      if (res.ok) {
        const { locations } = (await res.json()) as {
          locations: Array<{ id: string; name: string; address: string; latitude: number; longitude: number; placeId: string | null }>;
        };
        if (reqId !== reqIdRef.current) return;
        if (locations.length > 0) {
          const lower = input.toLowerCase();
          const preds: PlacePrediction[] = locations.map((l) => {
            const at = l.name.toLowerCase().indexOf(lower);
            return {
              source: "local",
              placeId: l.id,
              mainText: l.name,
              secondaryText: l.address,
              matches: at >= 0 ? [{ startOffset: at, endOffset: at + input.length }] : [],
              lat: l.latitude,
              lng: l.longitude,
            };
          });
          cacheSet(input, preds);
          setPredictions(preds);
          setLoading(false);
          return;
        }
      }
    } catch {
      // index unavailable - fall through to Google
    }
    if (reqId !== reqIdRef.current) return;

    try {
      const lib   = await getPlacesLib();
      const token = ensureToken(lib);

      const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken:        token,
        locationRestriction: BOUNDS,
      });

      if (reqId !== reqIdRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const preds: PlacePrediction[] = suggestions.map((s: any) => {
        const p = s.placePrediction;
        return {
          source:        "google" as const,
          placeId:       p.placeId,
          mainText:      p.mainText?.text       ?? "",
          secondaryText: p.secondaryText?.text  ?? "",
          matches:       p.mainText?.matches    ?? [],
        };
      });

      cacheSet(input, preds);
      setPredictions(preds);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      console.error("[usePlacesAutocomplete]", err);
      setError("Couldn't fetch suggestions");
      setPredictions([]);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      clearTimeout(debounceRef.current);
      if (value.length < 3) { setPredictions([]); setLoading(false); return; }
      debounceRef.current = setTimeout(() => fetchPredictions(value), 350);
    },
    [fetchPredictions]
  );

  const selectPrediction = useCallback(
    async (prediction: PlacePrediction): Promise<SelectedPlace | null> => {
      // Local result: coordinates are already known - zero Google calls.
      // Bump its popularity in the background.
      if (prediction.source === "local" && prediction.lat != null && prediction.lng != null) {
        setQuery(prediction.mainText);
        setPredictions([]);
        fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: prediction.placeId }),
        }).catch(() => {});
        return {
          address: prediction.secondaryText || prediction.mainText,
          lat: prediction.lat,
          lng: prediction.lng,
          placeId: prediction.placeId,
        };
      }

      try {
        const lib   = await getPlacesLib();
        const place = new lib.Place({ id: prediction.placeId });
        await place.fetchFields({ fields: ["formattedAddress", "location"] });

        // Reset session token to start a new billing session
        sessionTokenRef.current = new lib.AutocompleteSessionToken();

        setQuery(prediction.mainText);
        setPredictions([]);

        const lat = place.location?.lat();
        const lng = place.location?.lng();
        if (lat == null || lng == null) return null;

        // Save into our index so the next search resolves locally
        fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: prediction.mainText,
            address: place.formattedAddress ?? prediction.secondaryText,
            lat,
            lng,
            placeId: prediction.placeId,
          }),
        }).catch(() => {});

        return { address: place.formattedAddress ?? "", lat, lng, placeId: prediction.placeId };
      } catch {
        return null;
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const clearPredictions = useCallback(() => { setPredictions([]); setError(null); }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return { query, predictions, loading, error, handleQueryChange, selectPrediction, clearPredictions, setQuery };
}
