/**
 * Heart Agent Tests
 *
 * Tests emotional support responses and grounding techniques.
 */

import { describe, it, expect } from "vitest";
import { heartAgent } from "../../src/services/agents/heartAgent.js";
import type { RequestContext, CityData } from "../../src/types/agent.js";

const contextWithCity: RequestContext = {
  sessionId: "test",
  conversationHistory: [],
  timestamp: new Date(),
  cityData: {
    name: "Hyderabad",
    safetyZones: [],
    fareBenchmarks: [],
    scamAlerts: [],
    emergencyNumbers: { police: "100", women_helpline: "181" },
  } as unknown as CityData,
};

const basicContext: RequestContext = {
  sessionId: "test",
  conversationHistory: [],
  timestamp: new Date(),
};

describe("heartAgent", () => {
  it("has correct name", () => {
    expect(heartAgent.name).toBe("heartAgent");
  });

  it("responds to high-intensity fear with empathy and grounding", async () => {
    const result = await heartAgent.run(
      { emotion: "scared", intensity: "high", message: "I feel scared walking alone" },
      basicContext
    );

    expect(result.emotionalResponse).toContain("not alone");
    expect(result.groundingTechnique).toBeDefined();
    expect(result.groundingTechnique).toContain("5-4-3-2-1");
    expect(result.shouldEscalate).toBe(true);
  });

  it("responds to medium anxiety without grounding technique", async () => {
    const result = await heartAgent.run(
      { emotion: "anxious", intensity: "medium", message: "I'm feeling nervous" },
      basicContext
    );

    expect(result.emotionalResponse).toBeDefined();
    expect(result.groundingTechnique).toBeUndefined();
    expect(result.shouldEscalate).toBe(false);
  });

  it("maps 'afraid' to scared", async () => {
    const result = await heartAgent.run(
      { emotion: "afraid", intensity: "high", message: "I'm afraid" },
      basicContext
    );

    expect(result.emotionalResponse).toContain("not alone");
    expect(result.shouldEscalate).toBe(true);
  });

  it("maps 'homesick' to sad", async () => {
    const result = await heartAgent.run(
      { emotion: "homesick", intensity: "high", message: "I miss home" },
      basicContext
    );

    expect(result.emotionalResponse).toContain("home");
    expect(result.shouldEscalate).toBe(true);
  });

  it("provides emergency numbers when cityData is available", async () => {
    const result = await heartAgent.run(
      { emotion: "scared", intensity: "high", message: "Help" },
      contextWithCity
    );

    expect(result.actionableSuggestions.some((s) => s.includes("100") || s.includes("181"))).toBe(true);
  });

  it("suggests sharing location for scared/high intensity", async () => {
    const result = await heartAgent.run(
      { emotion: "scared", intensity: "high", message: "I'm being followed" },
      basicContext
    );

    expect(result.actionableSuggestions.some((s) => s.includes("location"))).toBe(true);
  });

  it("handles frustrated emotion", async () => {
    const result = await heartAgent.run(
      { emotion: "frustrated", intensity: "medium", message: "This driver is ripping me off" },
      basicContext
    );

    expect(result.emotionalResponse).toBeDefined();
    expect(result.shouldEscalate).toBe(false);
  });

  it("suggests documenting for angry emotion", async () => {
    const result = await heartAgent.run(
      { emotion: "angry", intensity: "high", message: "The hotel scammed me" },
      basicContext
    );

    expect(result.actionableSuggestions.some((s) => s.includes("Document"))).toBe(true);
  });

  it("defaults to anxious for unknown emotion", async () => {
    const result = await heartAgent.run(
      { emotion: "confused", intensity: "medium", message: "I don't know what to do" },
      basicContext
    );

    expect(result.emotionalResponse).toBeDefined();
    // Should use anxious defaults
    expect(result.shouldEscalate).toBe(false);
  });
});
