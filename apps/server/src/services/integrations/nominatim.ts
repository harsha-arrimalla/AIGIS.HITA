/**
 * Nominatim (OpenStreetMap) Geocoding Client
 *
 * Free, no API key required. Used as fallback when Google Places isn't available
 * or for reverse geocoding (coords → address).
 * Rate limit: 1 request/second (we respect this).
 */

const BASE_URL = "https://nominatim.openstreetmap.org";
const FETCH_TIMEOUT_MS = 10_000;

export interface NominatimResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  type: string;
}

const headers = {
  "User-Agent": "HitaApp/1.0 (arrimallaharshavardhan@gmail.com)",
  Accept: "application/json",
};

/**
 * Forward geocode: place name → coordinates
 */
export async function nominatimGeocode(query: string): Promise<NominatimResult[]> {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=3`;

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);

  const data = await response.json() as Array<Record<string, unknown>>;

  return data.map((item) => {
    const address = item.address as Record<string, string> | undefined;
    return {
      lat: parseFloat(item.lat as string),
      lng: parseFloat(item.lon as string),
      displayName: item.display_name as string,
      city: address?.city || address?.town || address?.village,
      state: address?.state,
      country: address?.country,
      type: item.type as string,
    };
  });
}

/**
 * Reverse geocode: coordinates → place name
 */
export async function reverseGeocode(lat: number, lng: number): Promise<NominatimResult | null> {
  const url = `${BASE_URL}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Nominatim reverse error: ${response.status}`);

  const item = await response.json() as Record<string, unknown>;

  if (item.error) return null;

  const address = item.address as Record<string, string> | undefined;
  return {
    lat: parseFloat(item.lat as string),
    lng: parseFloat(item.lon as string),
    displayName: item.display_name as string,
    city: address?.city || address?.town || address?.village,
    state: address?.state,
    country: address?.country,
    type: item.type as string,
  };
}
