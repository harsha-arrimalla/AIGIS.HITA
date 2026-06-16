/**
 * Geo Agent Tests
 *
 * Mocks Google Places + Nominatim + Gemini LLM and verifies output shape.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/integrations/googlePlaces.js", () => ({
  searchPlace: vi.fn(),
  findNearbyPlaces: vi.fn(),
  geocode: vi.fn(),
}));

vi.mock("../../src/services/integrations/nominatim.js", () => ({
  nominatimGeocode: vi.fn(),
}));

vi.mock("../../src/services/llm.js", () => ({
  callGemini: vi.fn(),
  parseJsonResponse: vi.fn(),
}));

import { geoAgent } from "../../src/services/agents/geoAgent.js";
import { searchPlace, findNearbyPlaces } from "../../src/services/integrations/googlePlaces.js";
import { nominatimGeocode } from "../../src/services/integrations/nominatim.js";
import { callGemini, parseJsonResponse } from "../../src/services/llm.js";
import type { RequestContext } from "../../src/types/agent.js";
import type { PlaceResult } from "../../src/services/integrations/googlePlaces.js";

const mockContext: RequestContext = {
  sessionId: "test-session",
  conversationHistory: [],
  timestamp: new Date(),
};

const mockPlaces: PlaceResult[] = [
  {
    name: "Trident Hotel",
    address: "Hitech City, Hyderabad",
    lat: 17.4434,
    lng: 78.3772,
    rating: 4.5,
    types: ["lodging"],
    placeId: "ChIJ123",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("geoAgent", () => {
  it("has correct name", () => {
    expect(geoAgent.name).toBe("geoAgent");
  });

  it("returns places from text search", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      resolvedName: "Trident Hotel",
      category: "hotel",
      searchQuery: "Trident Hotel",
      isNearbySearch: false,
    });
    vi.mocked(searchPlace).mockResolvedValue(mockPlaces);

    const result = await geoAgent.run(
      { query: "Trident Hotel", city: "Hyderabad" },
      mockContext
    );

    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe("Trident Hotel");
    expect(result.resolvedLocation).toBeDefined();
    expect(result.resolvedLocation?.lat).toBe(17.4434);
    expect(result.error).toBeUndefined();
  });

  it("returns nearby places when query contains 'nearby'", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      resolvedName: "cafe",
      category: "cafe",
      searchQuery: "cafe",
      isNearbySearch: true,
    });
    vi.mocked(findNearbyPlaces).mockResolvedValue(mockPlaces);

    const result = await geoAgent.run(
      { query: "Find a cafe nearby", userLat: 17.44, userLng: 78.37 },
      mockContext
    );

    expect(result.places).toHaveLength(1);
    expect(findNearbyPlaces).toHaveBeenCalled();
  });

  it("falls back to Nominatim when Google Places fails", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      resolvedName: "Charminar",
      category: "landmark",
      searchQuery: "Charminar",
      isNearbySearch: false,
    });
    vi.mocked(searchPlace).mockRejectedValue(new Error("Google API error"));
    vi.mocked(nominatimGeocode).mockResolvedValue([
      {
        lat: 17.3616,
        lng: 78.4747,
        displayName: "Charminar, Old City, Hyderabad",
        type: "monument",
      },
    ]);

    const result = await geoAgent.run(
      { query: "Charminar", city: "Hyderabad" },
      mockContext
    );

    expect(result.places).toHaveLength(1);
    expect(nominatimGeocode).toHaveBeenCalled();
  });

  it("handles total failure gracefully", async () => {
    vi.mocked(callGemini).mockRejectedValue(new Error("LLM down"));
    vi.mocked(parseJsonResponse).mockImplementation(() => {
      throw new Error("parse error");
    });
    vi.mocked(searchPlace).mockRejectedValue(new Error("API down"));
    vi.mocked(nominatimGeocode).mockRejectedValue(new Error("Nominatim down"));

    const result = await geoAgent.run(
      { query: "random place" },
      mockContext
    );

    // The agent catches classifyGeoQuery failure and falls back to text search
    // Then text search fails, then nominatim fails — but the outer try/catch handles it
    expect(result.places).toBeDefined();
  });

  it("does not set resolvedLocation for nearby search", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      resolvedName: "restaurant",
      category: "restaurant",
      searchQuery: "restaurant",
      isNearbySearch: true,
    });
    vi.mocked(findNearbyPlaces).mockResolvedValue(mockPlaces);

    const result = await geoAgent.run(
      { query: "restaurants nearby", userLat: 17.44, userLng: 78.37 },
      mockContext
    );

    expect(result.resolvedLocation).toBeUndefined();
  });
});
