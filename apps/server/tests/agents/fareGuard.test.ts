/**
 * Fare Guard Tests
 *
 * Tests overcharge detection with various price scenarios.
 */

import { describe, it, expect } from "vitest";
import { fareGuard } from "../../src/services/agents/fareGuard.js";
import type { RequestContext, CityData } from "../../src/types/agent.js";

const cityData: CityData = {
  name: "Hyderabad",
  safetyZones: [],
  fareBenchmarks: [
    { from: "Airport", to: "Hitech City", mode: "cab", expectedFareMin: 800, expectedFareMax: 1200, currency: "INR" },
    { from: "Banjara Hills", to: "Charminar", mode: "auto", expectedFareMin: 150, expectedFareMax: 250, currency: "INR" },
  ],
  scamAlerts: [
    { type: "Auto overcharge", area: "City-wide", description: "Autos refuse meter", severity: "medium" },
    { type: "Airport taxi", area: "Airport", description: "Prepaid taxi counters charge extra for luggage", severity: "low" },
  ],
  emergencyNumbers: {},
};

const mockContext: RequestContext = {
  sessionId: "test",
  conversationHistory: [],
  timestamp: new Date(),
  location: { lat: 17.24, lng: 78.43, city: "Hyderabad" },
  cityData,
};

describe("fareGuard", () => {
  it("has correct name", () => {
    expect(fareGuard.name).toBe("fareGuard");
  });

  it("returns 'fair' when quoted amount is within range", async () => {
    const result = await fareGuard.run(
      { quotedAmount: 1000, from: "Airport", to: "Hitech City", mode: "cab" },
      mockContext
    );

    expect(result.verdict).toBe("fair");
    expect(result.expectedRange?.min).toBe(800);
    expect(result.expectedRange?.max).toBe(1200);
  });

  it("returns 'slightly_high' when 1-20% over", async () => {
    const result = await fareGuard.run(
      { quotedAmount: 1400, from: "Airport", to: "Hitech City", mode: "cab" },
      mockContext
    );

    expect(result.verdict).toBe("slightly_high");
    expect(result.overchargePercent).toBeGreaterThan(0);
    expect(result.overchargePercent).toBeLessThanOrEqual(20);
  });

  it("returns 'overcharged' when 21-80% over", async () => {
    const result = await fareGuard.run(
      { quotedAmount: 1800, from: "Airport", to: "Hitech City", mode: "cab" },
      mockContext
    );

    expect(result.verdict).toBe("overcharged");
    expect(result.overchargePercent).toBeGreaterThan(20);
  });

  it("returns 'scam_likely' when >80% over", async () => {
    const result = await fareGuard.run(
      { quotedAmount: 3000, from: "Airport", to: "Hitech City", mode: "cab" },
      mockContext
    );

    expect(result.verdict).toBe("scam_likely");
    expect(result.overchargePercent).toBeGreaterThan(80);
  });

  it("returns expected range without verdict when no amount given", async () => {
    const result = await fareGuard.run(
      { from: "Airport", to: "Hitech City", mode: "cab" },
      mockContext
    );

    expect(result.verdict).toBe("fair");
    expect(result.expectedRange).toBeDefined();
    expect(result.advice).toContain("Expected fare");
  });

  it("returns 'unknown' when no benchmark matches", async () => {
    const result = await fareGuard.run(
      { quotedAmount: 500, from: "Random A", to: "Random B" },
      mockContext
    );

    expect(result.verdict).toBe("unknown");
  });

  it("includes city-wide scam alerts", async () => {
    const result = await fareGuard.run(
      { from: "Airport", to: "Hitech City" },
      mockContext
    );

    expect(result.scamAlerts.length).toBeGreaterThan(0);
    expect(result.scamAlerts.some((a) => a.includes("meter"))).toBe(true);
  });

  it("includes area-specific scam alerts for Airport", async () => {
    const result = await fareGuard.run(
      { from: "Airport", to: "Hitech City" },
      mockContext
    );

    expect(result.scamAlerts.some((a) => a.includes("luggage"))).toBe(true);
  });

  it("handles missing cityData", async () => {
    const noDataCtx: RequestContext = {
      sessionId: "test",
      conversationHistory: [],
      timestamp: new Date(),
    };

    const result = await fareGuard.run(
      { quotedAmount: 500, from: "A", to: "B" },
      noDataCtx
    );

    expect(result.verdict).toBe("unknown");
    expect(result.scamAlerts).toHaveLength(0);
  });
});
