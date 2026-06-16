/**
 * Transit Agent
 *
 * Finds the best route from A to B using TomTom routing + local knowledge.
 * Returns structured route options for the Brain to compose.
 */

import type { Agent, RequestContext } from "../../types/agent.js";
import { calculateRoute, type RouteOption } from "../integrations/tomtom.js";
import { geocode } from "../integrations/googlePlaces.js";

// -------------------------------------------------------------------------- //
//                              TYPES                                          //
// -------------------------------------------------------------------------- //

export interface TransitAgentInput {
  from: string;
  to: string;
  preferredMode?: string;
}

export interface TransitAgentOutput {
  routes: RouteOption[];
  fromResolved?: { lat: number; lng: number; name: string };
  toResolved?: { lat: number; lng: number; name: string };
  recommendation?: string;
  estimatedFare?: {
    min: number;
    max: number;
    currency: string;
  };
  error?: string;
}

// -------------------------------------------------------------------------- //
//                              AGENT                                          //
// -------------------------------------------------------------------------- //

export const transitAgent: Agent<TransitAgentInput, TransitAgentOutput> = {
  name: "transitAgent",

  async run(input, context) {
    const { from, to } = input;
    const city = context.location?.city || "";

    try {
      // Step 1: Resolve both locations to coordinates
      const fromQuery = city ? `${from} ${city}` : from;
      const toQuery = city ? `${to} ${city}` : to;

      const [fromGeo, toGeo] = await Promise.all([
        geocode(fromQuery),
        geocode(toQuery),
      ]);

      if (!fromGeo || !toGeo) {
        return {
          routes: [],
          error: `Could not resolve ${!fromGeo ? `"${from}"` : `"${to}"`}. Try being more specific.`,
        };
      }

      // Step 2: Calculate route
      const routes = await calculateRoute(fromGeo.lat, fromGeo.lng, toGeo.lat, toGeo.lng, "car");

      // Step 3: Estimate fare from city data
      const estimatedFare = lookupFare(from, to, context);

      // Step 4: Generate recommendation
      const recommendation = generateRecommendation(routes, estimatedFare, context);

      return {
        routes,
        fromResolved: { lat: fromGeo.lat, lng: fromGeo.lng, name: fromGeo.formattedAddress },
        toResolved: { lat: toGeo.lat, lng: toGeo.lng, name: toGeo.formattedAddress },
        recommendation,
        estimatedFare,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Route calculation failed";
      console.error("[transitAgent] Error:", message);
      return { routes: [], error: message };
    }
  },
};

// -------------------------------------------------------------------------- //
//                           HELPERS                                           //
// -------------------------------------------------------------------------- //

function lookupFare(
  from: string,
  to: string,
  context: RequestContext
): { min: number; max: number; currency: string } | undefined {
  if (!context.cityData?.fareBenchmarks) return undefined;

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  const match = context.cityData.fareBenchmarks.find((f) => {
    const fFrom = f.from.toLowerCase();
    const fTo = f.to.toLowerCase();
    return (
      (fromLower.includes(fFrom) || fFrom.includes(fromLower)) &&
      (toLower.includes(fTo) || fTo.includes(toLower))
    );
  });

  if (match) {
    return {
      min: match.expectedFareMin,
      max: match.expectedFareMax,
      currency: match.currency,
    };
  }

  return undefined;
}

function generateRecommendation(
  routes: RouteOption[],
  fare: { min: number; max: number; currency: string } | undefined,
  context: RequestContext
): string {
  const parts: string[] = [];

  if (routes.length > 0) {
    const route = routes[0];
    parts.push(`Estimated travel: ${route.durationInTrafficMinutes} min (${route.distanceKm} km) by cab.`);
  }

  if (fare) {
    parts.push(`Expected fare: ₹${fare.min}–₹${fare.max}.`);
  }

  // Time-based advice
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 5) {
    parts.push("It's late — use Ola/Uber with ride tracking enabled.");
  } else if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    parts.push("Rush hour — expect heavier traffic and possible surge pricing.");
  }

  return parts.join(" ");
}
