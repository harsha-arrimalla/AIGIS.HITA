/**
 * Hita Brain Tests
 *
 * Tests composition of agent outputs into final replies.
 * Mocks Claude LLM + contextManager.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/llm.js", () => ({
  callClaude: vi.fn(),
  callGemini: vi.fn(),
  parseJsonResponse: vi.fn(),
}));

vi.mock("../../src/services/contextManager.js", () => ({
  buildSystemPrompt: vi.fn().mockReturnValue("You are Hita..."),
  loadCityData: vi.fn(),
  buildClassifierContext: vi.fn(),
}));

import { hitaBrain } from "../../src/services/agents/hitaBrain.js";
import { callGemini } from "../../src/services/llm.js";
import type { RequestContext } from "../../src/types/agent.js";

const mockContext: RequestContext = {
  sessionId: "test",
  conversationHistory: [],
  timestamp: new Date(),
  location: { lat: 17.38, lng: 78.48, city: "Hyderabad" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hitaBrain", () => {
  it("has correct name", () => {
    expect(hitaBrain.name).toBe("hitaBrain");
  });

  it("composes reply from weather agent output", async () => {
    vi.mocked(callGemini).mockResolvedValue("It's 34°C and partly cloudy. Carry water and an umbrella!");

    const result = await hitaBrain.run(
      {
        userMessage: "What's the weather like?",
        intent: "WEATHER",
        entities: { city: "Hyderabad" },
        agentOutputs: {
          weather: {
            current: { temperature: 34, feelsLike: 38, description: "partly cloudy", humidity: 55 },
            forecast: [],
            advisory: "Carry water.",
          },
        },
      },
      mockContext
    );

    expect(result.reply).toContain("34°C");
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("generates transit UI action", async () => {
    vi.mocked(callGemini).mockResolvedValue("The route is about 22 km, taking ~45 min.");

    const result = await hitaBrain.run(
      {
        userMessage: "How to get to Hitech City from Airport?",
        intent: "TRANSIT",
        entities: { from: "Airport", to: "Hitech City" },
        agentOutputs: {
          transit: {
            routes: [{ mode: "car", distanceKm: 22.5, durationInTrafficMinutes: 45 }],
            fromResolved: { lat: 17.24, lng: 78.43, name: "Airport" },
            toResolved: { lat: 17.44, lng: 78.38, name: "Hitech City" },
            estimatedFare: { min: 800, max: 1200, currency: "INR" },
          },
        },
      },
      mockContext
    );

    expect(result.uiAction).toBeDefined();
    expect(result.uiAction?.type).toBe("TransitCard");
  });

  it("generates fare UI action", async () => {
    vi.mocked(callGemini).mockResolvedValue("That's overcharged!");

    const result = await hitaBrain.run(
      {
        userMessage: "Is 2000 too much for airport to city?",
        intent: "FARE",
        entities: { amount: "2000", from: "Airport", to: "City" },
        agentOutputs: {
          fare: {
            verdict: "overcharged",
            expectedRange: { min: 800, max: 1200 },
            quotedAmount: 2000,
          },
        },
      },
      mockContext
    );

    expect(result.uiAction?.type).toBe("FareCard");
  });

  it("adds safety-based suggestion when risk is high", async () => {
    vi.mocked(callGemini).mockResolvedValue("This area has some concerns.");

    const result = await hitaBrain.run(
      {
        userMessage: "Is Old City safe?",
        intent: "SAFETY",
        entities: { area: "Old City" },
        agentOutputs: {
          safety: {
            overallRisk: "high",
            safetyScore: 3,
            assessment: "Not safe at night.",
            risks: ["Petty crime"],
            recommendations: ["Avoid at night"],
          },
        },
      },
      mockContext
    );

    expect(result.suggestions).toContain("Find a safer alternative");
  });

  it("returns fallback on Claude failure", async () => {
    vi.mocked(callGemini).mockRejectedValue(new Error("Claude timeout"));

    const result = await hitaBrain.run(
      {
        userMessage: "hello",
        intent: "GENERAL",
        entities: {},
        agentOutputs: {},
      },
      mockContext
    );

    expect(result.reply).toContain("try again");
    expect(result.suggestions).toBeDefined();
  });

  it("generates PlaceList UI action for GEO intent", async () => {
    vi.mocked(callGemini).mockResolvedValue("Here are some cafes nearby.");

    const result = await hitaBrain.run(
      {
        userMessage: "Find cafes nearby",
        intent: "GEO",
        entities: {},
        agentOutputs: {
          geo: {
            places: [
              { name: "Roastery", address: "Banjara Hills", lat: 17.43, lng: 78.44 },
              { name: "Blue Fox", address: "Jubilee Hills", lat: 17.44, lng: 78.43 },
            ],
          },
        },
      },
      mockContext
    );

    expect(result.uiAction?.type).toBe("PlaceList");
  });
});
