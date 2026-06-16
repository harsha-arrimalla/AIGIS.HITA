/**
 * Geo Agent
 *
 * Resolves locations, finds nearby places, geocodes addresses.
 * Uses Google Places as primary, Nominatim as fallback.
 */

import type { Agent, RequestContext } from "../../types/agent.js";
import { searchPlace, findNearbyPlaces, geocode, type PlaceResult } from "../integrations/googlePlaces.js";
import { nominatimGeocode } from "../integrations/nominatim.js";
import { callGemini, parseJsonResponse } from "../llm.js";
import { GEO_AGENT_PROMPT } from "../../prompts/geo.js";

// -------------------------------------------------------------------------- //
//                              TYPES                                          //
// -------------------------------------------------------------------------- //

export interface GeoAgentInput {
  query: string;
  userLat?: number;
  userLng?: number;
  city?: string;
}

export interface GeoAgentOutput {
  places: PlaceResult[];
  resolvedLocation?: {
    lat: number;
    lng: number;
    name: string;
    address: string;
  };
  category?: string;
  error?: string;
}

interface GeoClassification {
  resolvedName: string;
  category: string;
  searchQuery: string;
  isNearbySearch: boolean;
}

// -------------------------------------------------------------------------- //
//                              AGENT                                          //
// -------------------------------------------------------------------------- //

export const geoAgent: Agent<GeoAgentInput, GeoAgentOutput> = {
  name: "geoAgent",

  async run(input, context) {
    const { query, userLat, userLng, city } = input;
    // Use city from input or fall back to context location
    const effectiveCity = city || context.location?.city;

    try {
      // Step 1: Classify the geo query using Gemini
      const classification = await classifyGeoQuery(query);

      // Step 2: Search for places
      let places: PlaceResult[] = [];

      if (classification.isNearbySearch && userLat && userLng) {
        // Nearby search using coordinates
        const placeType = mapCategoryToGoogleType(classification.category);
        places = await findNearbyPlaces(userLat, userLng, placeType);
      } else {
        // Text search — append city for better results
        const searchQuery = effectiveCity
          ? `${classification.searchQuery} ${effectiveCity}`
          : classification.searchQuery;

        try {
          places = await searchPlace(searchQuery);
        } catch {
          // Fallback to Nominatim — also include city for geo-biasing
          const nominatimQuery = effectiveCity
            ? `${classification.searchQuery} ${effectiveCity}`
            : classification.searchQuery;
          const nominatimResults = await nominatimGeocode(nominatimQuery);
          places = nominatimResults.map((r) => ({
            name: r.displayName.split(",")[0],
            address: r.displayName,
            lat: r.lat,
            lng: r.lng,
            types: [r.type],
            placeId: "",
          }));
        }
      }

      // Step 3: If looking for a specific place, resolve its exact location
      let resolvedLocation;
      if (!classification.isNearbySearch && places.length > 0) {
        const top = places[0];
        resolvedLocation = {
          lat: top.lat,
          lng: top.lng,
          name: top.name,
          address: top.address,
        };
      }

      return {
        places,
        resolvedLocation,
        category: classification.category,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Geo lookup failed";
      console.error(`[geoAgent] Error:`, message);
      return { places: [], error: message };
    }
  },
};

// -------------------------------------------------------------------------- //
//                           HELPERS                                           //
// -------------------------------------------------------------------------- //

async function classifyGeoQuery(query: string): Promise<GeoClassification> {
  try {
    const raw = await callGemini({
      prompt: `User query: "${query}"`,
      systemInstruction: GEO_AGENT_PROMPT,
      temperature: 0.1,
    });
    return parseJsonResponse<GeoClassification>(raw);
  } catch {
    // Fallback: treat as direct text search
    return {
      resolvedName: query,
      category: "other",
      searchQuery: query,
      isNearbySearch: query.toLowerCase().includes("nearby") || query.toLowerCase().includes("near me"),
    };
  }
}

function mapCategoryToGoogleType(category: string): string {
  const mapping: Record<string, string> = {
    restaurant: "restaurant",
    cafe: "cafe",
    hotel: "lodging",
    hospital: "hospital",
    atm: "atm",
    pharmacy: "pharmacy",
    transport: "transit_station",
    landmark: "tourist_attraction",
    shopping: "shopping_mall",
    entertainment: "movie_theater",
  };
  return mapping[category] || "point_of_interest";
}
