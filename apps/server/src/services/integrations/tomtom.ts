/**
 * TomTom Routing API Client
 *
 * Finds routes between two points with traffic-aware ETAs.
 * Free tier: 2,500 requests/day.
 */

const BASE_URL = "https://api.tomtom.com/routing/1";
const FETCH_TIMEOUT_MS = 10_000;

export interface RouteOption {
  mode: string;
  distanceKm: number;
  durationMinutes: number;
  durationInTrafficMinutes: number;
  summary: string;
  departureTime: string;
  arrivalTime: string;
}

function getApiKey(): string {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY is not set");
  return key;
}

/**
 * Calculate route between two coordinate pairs.
 */
export async function calculateRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  travelMode: "car" | "taxi" | "pedestrian" = "car"
): Promise<RouteOption[]> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/calculateRoute/${fromLat},${fromLng}:${toLat},${toLng}/json?key=${apiKey}&traffic=true&travelMode=${travelMode}&computeTravelTimeFor=all`;

  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`TomTom routing error: ${response.status}`);

  const data = await response.json() as Record<string, unknown>;
  const routes = data.routes as Array<Record<string, unknown>>;

  return routes.map((route) => {
    const summary = route.summary as Record<string, unknown>;
    const legs = route.legs as Array<Record<string, unknown>>;

    const distanceMeters = summary.lengthInMeters as number;
    const durationSeconds = summary.travelTimeInSeconds as number;
    const trafficSeconds = (summary.trafficDelayInSeconds as number) || 0;

    return {
      mode: travelMode,
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationMinutes: Math.round(durationSeconds / 60),
      durationInTrafficMinutes: Math.round((durationSeconds + trafficSeconds) / 60),
      summary: `${Math.round(distanceMeters / 1000)} km, ~${Math.round(durationSeconds / 60)} min`,
      departureTime: (summary.departureTime as string) || new Date().toISOString(),
      arrivalTime: (summary.arrivalTime as string) || new Date(Date.now() + durationSeconds * 1000).toISOString(),
    };
  });
}
