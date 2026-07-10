"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface NearbyPlace {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
  photoUrl?: string;
  isOpen?: boolean;
}

interface NearbyPlacesState {
  status: "loading" | "ready" | "unavailable";
  city: string | null;
  places: NearbyPlace[];
}

/**
 * Asks for browser geolocation and fetches places near the user.
 * Resolves to "unavailable" on permission denial, timeout, or API failure —
 * callers should fall back to static content.
 */
export function useNearbyPlaces(): NearbyPlacesState {
  const [state, setState] = useState<NearbyPlacesState>({
    status: "loading",
    city: null,
    places: [],
  });

  useEffect(() => {
    let cancelled = false;
    const unavailable = () =>
      !cancelled && setState({ status: "unavailable", city: null, places: [] });

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      unavailable();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`${API_URL}/places/nearby?lat=${latitude}&lng=${longitude}`);
          if (!res.ok) throw new Error(`nearby failed: ${res.status}`);
          const data: { city: string | null; places: NearbyPlace[] } = await res.json();
          if (cancelled) return;
          if (data.places?.length) {
            setState({ status: "ready", city: data.city, places: data.places });
          } else {
            unavailable();
          }
        } catch {
          unavailable();
        }
      },
      unavailable,
      { maximumAge: 10 * 60 * 1000, timeout: 10_000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
