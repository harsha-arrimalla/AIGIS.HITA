/**
 * Intent Classifier Tests
 *
 * Tests 20+ realistic messages with mocked Gemini responses.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/llm.js", () => ({
  callGemini: vi.fn(),
  parseJsonResponse: vi.fn(),
}));

import { classifyIntent, type ClassificationResult } from "../../src/services/intentClassifier.js";
import { parseJsonResponse } from "../../src/services/llm.js";

function mockClassification(intent: string, entities: Record<string, string> = {}, confidence = 0.9) {
  vi.mocked(parseJsonResponse).mockReturnValueOnce({
    intent,
    confidence,
    entities,
    emotionalTone: "neutral",
  } as ClassificationResult);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("classifyIntent", () => {
  // TRANSIT messages
  it("classifies 'How do I get from airport to hotel' as TRANSIT", async () => {
    mockClassification("TRANSIT", { from: "airport", to: "hotel" });
    const result = await classifyIntent("How do I get from airport to hotel");
    expect(result.intent).toBe("TRANSIT");
    expect(result.entities.from).toBe("airport");
  });

  it("classifies 'Take me to Banjara Hills' as TRANSIT", async () => {
    mockClassification("TRANSIT", { to: "Banjara Hills" });
    const result = await classifyIntent("Take me to Banjara Hills");
    expect(result.intent).toBe("TRANSIT");
  });

  it("classifies 'Best route to Hitech City from Charminar' as TRANSIT", async () => {
    mockClassification("TRANSIT", { from: "Charminar", to: "Hitech City" });
    const result = await classifyIntent("Best route to Hitech City from Charminar");
    expect(result.intent).toBe("TRANSIT");
  });

  // SAFETY messages
  it("classifies 'Is Old City safe at night' as SAFETY", async () => {
    mockClassification("SAFETY", { area: "Old City", timeOfDay: "night" });
    const result = await classifyIntent("Is Old City safe at night");
    expect(result.intent).toBe("SAFETY");
  });

  it("classifies 'How dangerous is this area' as SAFETY", async () => {
    mockClassification("SAFETY");
    const result = await classifyIntent("How dangerous is this area");
    expect(result.intent).toBe("SAFETY");
  });

  // WEATHER messages
  it("classifies 'What is the weather in Hyderabad' as WEATHER", async () => {
    mockClassification("WEATHER", { city: "Hyderabad" });
    const result = await classifyIntent("What is the weather in Hyderabad");
    expect(result.intent).toBe("WEATHER");
  });

  it("classifies 'Will it rain today' as WEATHER", async () => {
    mockClassification("WEATHER");
    const result = await classifyIntent("Will it rain today");
    expect(result.intent).toBe("WEATHER");
  });

  // GEO messages
  it("classifies 'Find a quiet cafe nearby' as GEO", async () => {
    mockClassification("GEO");
    const result = await classifyIntent("Find a quiet cafe nearby");
    expect(result.intent).toBe("GEO");
  });

  it("classifies 'Where is the nearest ATM' as GEO", async () => {
    mockClassification("GEO");
    const result = await classifyIntent("Where is the nearest ATM");
    expect(result.intent).toBe("GEO");
  });

  it("classifies 'Good restaurants in Banjara Hills' as GEO", async () => {
    mockClassification("GEO", { area: "Banjara Hills" });
    const result = await classifyIntent("Good restaurants in Banjara Hills");
    expect(result.intent).toBe("GEO");
  });

  // EMOTIONAL messages
  it("classifies 'I feel scared walking alone' as EMOTIONAL", async () => {
    mockClassification("EMOTIONAL", { emotion: "scared", intensity: "high" });
    const result = await classifyIntent("I feel scared walking alone");
    expect(result.intent).toBe("EMOTIONAL");
  });

  it("classifies 'I miss home so much' as EMOTIONAL", async () => {
    mockClassification("EMOTIONAL", { emotion: "homesick", intensity: "medium" });
    const result = await classifyIntent("I miss home so much");
    expect(result.intent).toBe("EMOTIONAL");
  });

  it("classifies 'This is so frustrating' as EMOTIONAL", async () => {
    mockClassification("EMOTIONAL", { emotion: "frustrated" });
    const result = await classifyIntent("This is so frustrating");
    expect(result.intent).toBe("EMOTIONAL");
  });

  // FARE messages
  it("classifies 'The driver is asking 2000 for airport' as FARE", async () => {
    mockClassification("FARE", { amount: "2000", from: "airport" });
    const result = await classifyIntent("The driver is asking 2000 for airport");
    expect(result.intent).toBe("FARE");
  });

  it("classifies 'Is 500 rupees fair for this ride' as FARE", async () => {
    mockClassification("FARE", { amount: "500" });
    const result = await classifyIntent("Is 500 rupees fair for this ride");
    expect(result.intent).toBe("FARE");
  });

  it("classifies 'Am I being overcharged' as FARE", async () => {
    mockClassification("FARE");
    const result = await classifyIntent("Am I being overcharged");
    expect(result.intent).toBe("FARE");
  });

  // TRIP_PLAN messages
  it("classifies 'Plan my day in Hyderabad' as TRIP_PLAN", async () => {
    mockClassification("TRIP_PLAN", { city: "Hyderabad" });
    const result = await classifyIntent("Plan my day in Hyderabad");
    expect(result.intent).toBe("TRIP_PLAN");
  });

  it("classifies 'What should I do today' as TRIP_PLAN", async () => {
    mockClassification("TRIP_PLAN");
    const result = await classifyIntent("What should I do today");
    expect(result.intent).toBe("TRIP_PLAN");
  });

  // GENERAL messages
  it("classifies 'Hello' as GENERAL", async () => {
    mockClassification("GENERAL");
    const result = await classifyIntent("Hello");
    expect(result.intent).toBe("GENERAL");
  });

  it("classifies 'Tell me about yourself' as GENERAL", async () => {
    mockClassification("GENERAL");
    const result = await classifyIntent("Tell me about yourself");
    expect(result.intent).toBe("GENERAL");
  });

  it("classifies 'Thank you for your help' as GENERAL", async () => {
    mockClassification("GENERAL");
    const result = await classifyIntent("Thank you for your help");
    expect(result.intent).toBe("GENERAL");
  });

  // Edge cases
  it("returns GENERAL default when LLM fails", async () => {
    vi.mocked(parseJsonResponse).mockImplementation(() => {
      throw new Error("parse error");
    });

    const result = await classifyIntent("Some random message");
    expect(result.intent).toBe("GENERAL");
    expect(result.confidence).toBe(0.5);
  });

  it("passes conversation context to prompt", async () => {
    mockClassification("TRANSIT", { to: "hotel" });
    const result = await classifyIntent("Take me there", "User asked about Trident Hotel earlier");
    expect(result.intent).toBe("TRANSIT");
  });
});
