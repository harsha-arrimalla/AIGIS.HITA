/**
 * Safety Agent Tests
 *
 * Tests safety assessment with various city/time/area combinations.
 * Mocks LLM calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/llm.js", () => ({
  callGemini: vi.fn(),
  parseJsonResponse: vi.fn(),
}));

import { safetyAgent } from "../../src/services/agents/safetyAgent.js";
import { parseJsonResponse } from "../../src/services/llm.js";
import type { RequestContext, CityData } from "../../src/types/agent.js";

const hyderabadData: CityData = {
  name: "Hyderabad",
  safetyZones: [
    { area: "Banjara Hills", safetyScore: 9, dayScore: 9, nightScore: 8, notes: "Upscale area, well-lit" },
    { area: "Old City", safetyScore: 5, dayScore: 6, nightScore: 3, notes: "Crowded, petty crime at night" },
    { area: "Hitech City", safetyScore: 8, dayScore: 9, nightScore: 7, notes: "Corporate area, safe during work hours" },
  ],
  fareBenchmarks: [],
  scamAlerts: [
    { type: "Auto overcharge", area: "City-wide", description: "Autos refuse meter, quote 2-3x fare", severity: "medium" },
    { type: "Gem scam", area: "Old City", description: "Shops sell fake gems as precious stones", severity: "high" },
  ],
  emergencyNumbers: { police: "100", ambulance: "108", women_helpline: "181" },
};

function makeContext(overrides?: Partial<RequestContext>): RequestContext {
  return {
    sessionId: "test",
    conversationHistory: [],
    timestamp: new Date(),
    location: { lat: 17.38, lng: 78.48, city: "Hyderabad" },
    cityData: hyderabadData,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("safetyAgent", () => {
  it("has correct name", () => {
    expect(safetyAgent.name).toBe("safetyAgent");
  });

  it("finds matching safety zones for known area", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      overallRisk: "low",
      safetyScore: 9,
      assessment: "Banjara Hills is a safe, upscale area.",
      risks: [],
      recommendations: ["Normal precautions"],
      shouldAlert: false,
      alternativeAreas: [],
    });

    const result = await safetyAgent.run(
      { area: "Banjara Hills" },
      makeContext()
    );

    expect(result.matchedZones).toHaveLength(1);
    expect(result.matchedZones[0].area).toBe("Banjara Hills");
    expect(result.overallRisk).toBe("low");
  });

  it("returns cautious default when LLM fails", async () => {
    vi.mocked(parseJsonResponse).mockImplementation(() => {
      throw new Error("LLM parse error");
    });

    const result = await safetyAgent.run(
      { area: "Unknown Area" },
      makeContext()
    );

    expect(result.overallRisk).toBe("moderate");
    expect(result.safetyScore).toBe(5);
    expect(result.error).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("returns empty zones for unknown area", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      overallRisk: "moderate",
      safetyScore: 5,
      assessment: "No specific data.",
      risks: [],
      recommendations: [],
      shouldAlert: false,
      alternativeAreas: [],
    });

    const result = await safetyAgent.run(
      { area: "Random Village" },
      makeContext()
    );

    expect(result.matchedZones).toHaveLength(0);
  });

  it("handles route assessment (from + to)", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      overallRisk: "moderate",
      safetyScore: 6,
      assessment: "Mixed safety along route.",
      risks: ["Old City section can be crowded"],
      recommendations: ["Use main roads"],
      shouldAlert: false,
      alternativeAreas: [],
    });

    const result = await safetyAgent.run(
      { fromArea: "Hitech City", toArea: "Old City" },
      makeContext()
    );

    expect(result.matchedZones).toHaveLength(2);
  });

  it("handles missing cityData gracefully", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      overallRisk: "moderate",
      safetyScore: 5,
      assessment: "Limited data.",
      risks: [],
      recommendations: [],
      shouldAlert: false,
      alternativeAreas: [],
    });

    const result = await safetyAgent.run(
      { area: "Somewhere" },
      makeContext({ cityData: undefined })
    );

    expect(result.matchedZones).toHaveLength(0);
  });
});
