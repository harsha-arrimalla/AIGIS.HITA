/**
 * Chat Flow E2E Tests
 *
 * Tests the full message → orchestrate → response flow.
 * Mocks all external services (LLM, APIs, Redis).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies
vi.mock("../../src/services/llm.js", () => ({
  callClaude: vi.fn().mockResolvedValue("Here's what I found for you."),
  callGemini: vi.fn().mockResolvedValue('{"intent":"GENERAL","confidence":0.9,"entities":{},"emotionalTone":"neutral"}'),
  parseJsonResponse: vi.fn().mockReturnValue({
    intent: "GENERAL",
    confidence: 0.9,
    entities: {},
    emotionalTone: "neutral",
  }),
}));

vi.mock("../../src/lib/redis.js", () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDel: vi.fn().mockResolvedValue(undefined),
  getRedis: vi.fn().mockReturnValue(null),
}));

vi.mock("../../src/services/integrations/openWeather.js", () => ({
  getCurrentWeather: vi.fn().mockRejectedValue(new Error("No API key")),
  getForecast: vi.fn().mockRejectedValue(new Error("No API key")),
}));

vi.mock("../../src/services/integrations/googlePlaces.js", () => ({
  searchPlace: vi.fn().mockRejectedValue(new Error("No API key")),
  findNearbyPlaces: vi.fn().mockRejectedValue(new Error("No API key")),
  geocode: vi.fn().mockRejectedValue(new Error("No API key")),
}));

vi.mock("../../src/services/integrations/nominatim.js", () => ({
  nominatimGeocode: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../src/services/integrations/tomtom.js", () => ({
  calculateRoute: vi.fn().mockRejectedValue(new Error("No API key")),
}));

import { orchestrate } from "../../src/services/orchestrator.js";
import { parseJsonResponse, callGemini } from "../../src/services/llm.js";

beforeEach(() => {
  vi.clearAllMocks();
  // Default: classify as GENERAL
  vi.mocked(parseJsonResponse).mockReturnValue({
    intent: "GENERAL",
    confidence: 0.9,
    entities: {},
    emotionalTone: "neutral",
  });
  vi.mocked(callGemini).mockResolvedValue("Hello! How can I help you today?");
});

describe("Chat Flow E2E", () => {
  it("handles a simple greeting", async () => {
    const response = await orchestrate({
      message: "Hello",
      sessionId: "e2e-test-1",
    });

    expect(response.reply).toBeDefined();
    expect(response.reply.length).toBeGreaterThan(0);
    expect(response.agentsUsed).toContain("memoryAgent");
    expect(response.agentsUsed).toContain("hitaBrain");
  });

  it("includes suggestions in response", async () => {
    const response = await orchestrate({
      message: "Hi there",
      sessionId: "e2e-test-2",
    });

    expect(response.suggestions).toBeDefined();
    expect(Array.isArray(response.suggestions)).toBe(true);
  });

  it("detects Hyderabad from message and loads city data", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      intent: "WEATHER",
      confidence: 0.95,
      entities: { city: "Hyderabad" },
      emotionalTone: "neutral",
    });

    const response = await orchestrate({
      message: "What's the weather in Hyderabad?",
      sessionId: "e2e-test-3",
    });

    expect(response.reply).toBeDefined();
    expect(response.agentsUsed).toContain("hitaBrain");
  });

  it("dispatches safety agent for SAFETY intent", async () => {
    vi.mocked(parseJsonResponse)
      .mockReturnValueOnce({
        intent: "SAFETY",
        confidence: 0.9,
        entities: { area: "Old City" },
        emotionalTone: "concerned",
      })
      // Safety agent also calls parseJsonResponse
      .mockReturnValueOnce({
        overallRisk: "moderate",
        safetyScore: 5,
        assessment: "Exercise caution",
        risks: ["Crowded area"],
        recommendations: ["Stay alert"],
        shouldAlert: false,
        alternativeAreas: [],
      });

    const response = await orchestrate({
      message: "Is Old City safe?",
      sessionId: "e2e-test-4",
    });

    expect(response.agentsUsed).toContain("safetyAgent");
    expect(response.agentsUsed).toContain("hitaBrain");
  });

  it("dispatches heart agent for EMOTIONAL intent", async () => {
    vi.mocked(parseJsonResponse).mockReturnValue({
      intent: "EMOTIONAL",
      confidence: 0.95,
      entities: { emotion: "scared", intensity: "high" },
      emotionalTone: "distressed",
    });

    const response = await orchestrate({
      message: "I feel scared walking alone at night",
      sessionId: "e2e-test-5",
    });

    expect(response.agentsUsed).toContain("heartAgent");
  });

  it("returns debug info in development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const response = await orchestrate({
      message: "Hello",
      sessionId: "e2e-test-6",
    });

    expect(response.debug).toBeDefined();
    expect(response.debug?.intent).toBe("GENERAL");
    expect(response.debug?.totalLatencyMs).toBeGreaterThanOrEqual(0);

    process.env.NODE_ENV = originalEnv;
  });

  it("handles Claude failure gracefully", async () => {
    vi.mocked(callGemini).mockRejectedValue(new Error("Claude is down"));

    const response = await orchestrate({
      message: "Hello",
      sessionId: "e2e-test-7",
    });

    expect(response.reply).toBeDefined();
    expect(response.reply).toContain("try again");
  });
});
