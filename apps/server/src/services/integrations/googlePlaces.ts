/**
 * Google Places API Client
 *
 * Resolves place names to coordinates and finds nearby places by type.
 * Free tier: $200/month credit (~$17/day).
 */

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";
const FETCH_TIMEOUT_MS = 10_000;

export interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  isOpen?: boolean;
  types: string[];
  placeId: string;
  photoUrl?: string;
}

export interface GeocodedLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
}

function getApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");
  return key;
}

/**
 * Search for a place by text query (e.g., "Trident Hotel Hyderabad")
 */
export async function searchPlace(query: string): Promise<PlaceResult[]> {
  const apiKey = getApiKey();
  const url = `${PLACES_BASE}/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Google Places error: ${response.status}`);

  const data = await response.json() as Record<string, unknown>;
  const results = data.results as Array<Record<string, unknown>>;

  return results.slice(0, 5).map(mapToPlaceResult);
}

/**
 * Find nearby places by type (e.g., "cafe", "atm", "hospital")
 */
export async function findNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  radius: number = 1500
): Promise<PlaceResult[]> {
  const apiKey = getApiKey();
  const url = `${PLACES_BASE}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Google Places nearby error: ${response.status}`);

  const data = await response.json() as Record<string, unknown>;
  const results = data.results as Array<Record<string, unknown>>;

  return results.slice(0, 5).map(mapToPlaceResult);
}

/**
 * Geocode an address or place name to coordinates
 */
export async function geocode(address: string): Promise<GeocodedLocation | null> {
  const apiKey = getApiKey();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Geocoding error: ${response.status}`);

  const data = await response.json() as Record<string, unknown>;
  const results = data.results as Array<Record<string, unknown>>;

  if (!results || results.length === 0) return null;

  const first = results[0];
  const geometry = first.geometry as Record<string, unknown>;
  const location = geometry.location as Record<string, number>;

  return {
    lat: location.lat,
    lng: location.lng,
    formattedAddress: first.formatted_address as string,
    placeId: first.place_id as string,
  };
}

export interface PlaceDetails {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  isOpen?: boolean;
  types: string[];
  placeId: string;
  phone?: string;
  website?: string;
  photoUrls: string[];
  weekdayHours?: string[];
  reviews?: { author: string; rating: number; text: string; time: number }[];
  editorialSummary?: string;
}

/**
 * Get detailed info for a single place
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = getApiKey();
  const fields = [
    "name", "formatted_address", "geometry", "rating", "user_ratings_total",
    "price_level", "opening_hours", "types", "place_id", "formatted_phone_number",
    "website", "photos", "reviews", "editorial_summary",
  ].join(",");
  const url = `${PLACES_BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Google Places details error: ${response.status}`);

  const data = await response.json() as Record<string, unknown>;
  const raw = data.result as Record<string, unknown> | undefined;
  if (!raw) return null;

  const geometry = raw.geometry as Record<string, unknown>;
  const location = geometry.location as Record<string, number>;
  const openingHours = raw.opening_hours as Record<string, unknown> | undefined;
  const photos = raw.photos as Array<Record<string, unknown>> | undefined;
  const reviews = raw.reviews as Array<Record<string, unknown>> | undefined;
  const editorialSummary = raw.editorial_summary as Record<string, string> | undefined;

  const photoUrls = (photos || []).slice(0, 6).map((p) => {
    const ref = p.photo_reference as string;
    return `${PLACES_BASE}/photo?maxwidth=800&photo_reference=${ref}&key=${apiKey}`;
  });

  return {
    name: raw.name as string,
    address: raw.formatted_address as string,
    lat: location.lat,
    lng: location.lng,
    rating: raw.rating as number | undefined,
    totalRatings: raw.user_ratings_total as number | undefined,
    priceLevel: raw.price_level as number | undefined,
    isOpen: (openingHours as Record<string, boolean> | undefined)?.open_now,
    types: (raw.types || []) as string[],
    placeId: raw.place_id as string,
    phone: raw.formatted_phone_number as string | undefined,
    website: raw.website as string | undefined,
    photoUrls,
    weekdayHours: openingHours?.weekday_text as string[] | undefined,
    reviews: reviews?.slice(0, 3).map((r) => ({
      author: r.author_name as string,
      rating: r.rating as number,
      text: r.text as string,
      time: r.time as number,
    })),
    editorialSummary: editorialSummary?.overview,
  };
}

function mapToPlaceResult(raw: Record<string, unknown>): PlaceResult {
  const geometry = raw.geometry as Record<string, unknown>;
  const location = geometry.location as Record<string, number>;
  const openingHours = raw.opening_hours as Record<string, boolean> | undefined;
  const photos = raw.photos as Array<Record<string, unknown>> | undefined;

  let photoUrl: string | undefined;
  if (photos && photos.length > 0) {
    const ref = photos[0].photo_reference as string;
    if (ref) {
      photoUrl = `${PLACES_BASE}/photo?maxwidth=400&photo_reference=${ref}&key=${getApiKey()}`;
    }
  }

  return {
    name: raw.name as string,
    address: (raw.formatted_address || raw.vicinity || "") as string,
    lat: location.lat,
    lng: location.lng,
    rating: raw.rating as number | undefined,
    totalRatings: raw.user_ratings_total as number | undefined,
    priceLevel: raw.price_level as number | undefined,
    isOpen: openingHours?.open_now,
    types: (raw.types || []) as string[],
    placeId: raw.place_id as string,
    photoUrl,
  };
}
