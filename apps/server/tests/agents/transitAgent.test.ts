/**
 * Transit Agent Tests
 *
 * Mocks TomTom + Google geocoding.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/integrations/tomtom.js", () => ({
  calculateRoute: vi.fn(),
}));

vi.mock("../../src/services/integrations/googlePlaces.js", () => ({
  searchPlace: vi.fn(),
  findNearbyPlaces: vi.fn(),
  geocode: vi.fn(),
}));

import { transitAgent } from "../../src/services/agents/transitAgent.js";
import { calculateRoute } from "../../src/services/integrations/tomtom.js";
import { geocode } from "../../src/services/integrations/googlePlaces.js";
import type { RequestContext, CityData } from "../../src/types/agent.js";
import type { RouteOption } from "../../src/services/integrations/tomtom.js";

const mockRoute: RouteOption = {
  mode: "car",
  distanceKm: 22.5,
  durationMinutes: 35,
  durationInTrafficMinutes: 45,
  summary: "22 km, ~35 min",
  departureTime: new Date().toISOString(),
  arrivalTime: new Date(Date.now() + 45 * 60000).toISOString(),
};

const cityData: CityData = {
  name: "Hyderabad",
  safetyZones: [],
  fareBenchmarks: [
    { from: "Airport", to: "Hitech City", mode: "cab", expectedFareMin: 800, expectedFareMax: 1200, currency: "INR" },
  ],
  scamAlerts: [],
  emergencyNumbers: {},
};

const mockContext: RequestContext = {
  sessionId: "test",
  conversationHistory: [],
  timestamp: new Date(),
  location: { lat: 17.24, lng: 78.43, city: "Hyderabad" },
  cityData,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("transitAgent", () => {
  it("has correct name", () => {
    expect(transitAgent.name).toBe("transitAgent");
  });

  it("returns route with resolved locations", async () => {
    vi.mocked(geocode).mockResolvedValueOnce({
      lat: 17.24, lng: 78.43, formattedAddress: "Shamshabad Airport", placeId: "a",
    });
    vi.mocked(geocode).mockResolvedValueOnce({
      lat: 17.44, lng: 78.38, formattedAddress: "Hitech City", placeId: "b",
    });
    vi.mocked(calculateRoute).mockResolvedValue([mockRoute]);

    const result = await transitAgent.run(
      { from: "Airport", to: "Hitech City" },
      mockContext
    );

    expect(result.routes).toHaveLength(1);
    expect(result.routes[0].distanceKm).toBe(22.5);
    expect(result.fromResolved).toBeDefined();
    expect(result.toResolved).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it("returns fare estimate when benchmark matches", async () => {
    vi.mocked(geocode).mockResolvedValueOnce({
      lat: 17.24, lng: 78.43, formattedAddress: "Airport", placeId: "a",
    });
    vi.mocked(geocode).mockResolvedValueOnce({
      lat: 17.44, lng: 78.38, formattedAddress: "Hitech City", placeId: "b",
    });
    vi.mocked(calculateRoute).mockResolvedValue([mockRoute]);

    const result = await transitAgent.run(
      { from: "Airport", to: "Hitech City" },
      mockContext
    );

    expect(result.estimatedFare).toBeDefined();
    expect(result.estimatedFare?.min).toBe(800);
    expect(result.estimatedFare?.max).toBe(1200);
  });

  it("returns error when geocoding fails", async () => {
    vi.mocked(geocode).mockResolvedValue(null);

    const result = await transitAgent.run(
      { from: "Nowhere", to: "Hitech City" },
      mockContext
    );

    expect(result.routes).toHaveLength(0);
    expect(result.error).toContain("Could not resolve");
  });

  it("handles TomTom API failure gracefully", async () => {
    vi.mocked(geocode).mockResolvedValueOnce({
      lat: 17.24, lng: 78.43, formattedAddress: "A", placeId: "a",
    });
    vi.mocked(geocode).mockResolvedValueOnce({
      lat: 17.44, lng: 78.38, formattedAddress: "B", placeId: "b",
    });
    vi.mocked(calculateRoute).mockRejectedValue(new Error("TomTom timeout"));

    const result = await transitAgent.run(
      { from: "A", to: "B" },
      mockContext
    );

    expect(result.routes).toHaveLength(0);
    expect(result.error).toBe("TomTom timeout");
  });
});
