/**
 * Weather Agent Tests
 *
 * Mocks OpenWeather API calls and verifies output shape + advisory logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the integration before importing the agent
vi.mock("../../src/services/integrations/openWeather.js", () => ({
  getCurrentWeather: vi.fn(),
  getForecast: vi.fn(),
}));

import { weatherAgent } from "../../src/services/agents/weatherAgent.js";
import { getCurrentWeather, getForecast } from "../../src/services/integrations/openWeather.js";
import type { RequestContext } from "../../src/types/agent.js";
import type { WeatherData, ForecastItem } from "../../src/services/integrations/openWeather.js";

const mockContext: RequestContext = {
  sessionId: "test-session",
  conversationHistory: [],
  timestamp: new Date(),
};

const mockWeather: WeatherData = {
  city: "Hyderabad",
  country: "IN",
  temperature: 34,
  feelsLike: 38,
  humidity: 55,
  description: "partly cloudy",
  icon: "02d",
  windSpeed: 12,
  visibility: 8,
  sunrise: "06:15 AM",
  sunset: "06:30 PM",
  updatedAt: new Date().toISOString(),
};

const mockForecast: ForecastItem[] = [
  { time: "03:00 PM", temperature: 36, description: "scattered clouds", rainProbability: 20 },
  { time: "06:00 PM", temperature: 32, description: "light rain", rainProbability: 70 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("weatherAgent", () => {
  it("has correct name", () => {
    expect(weatherAgent.name).toBe("weatherAgent");
  });

  it("returns current weather and forecast on success", async () => {
    vi.mocked(getCurrentWeather).mockResolvedValue(mockWeather);
    vi.mocked(getForecast).mockResolvedValue(mockForecast);

    const result = await weatherAgent.run({ city: "Hyderabad" }, mockContext);

    expect(result.current).toEqual(mockWeather);
    expect(result.forecast).toEqual(mockForecast);
    expect(result.error).toBeUndefined();
    expect(getCurrentWeather).toHaveBeenCalledWith("Hyderabad");
    expect(getForecast).toHaveBeenCalledWith("Hyderabad", 12);
  });

  it("generates rain advisory when forecast has high rain probability", async () => {
    vi.mocked(getCurrentWeather).mockResolvedValue(mockWeather);
    vi.mocked(getForecast).mockResolvedValue(mockForecast);

    const result = await weatherAgent.run({ city: "Hyderabad" }, mockContext);

    expect(result.advisory).toContain("umbrella");
  });

  it("generates heat advisory when temperature >= 40", async () => {
    const hotWeather = { ...mockWeather, temperature: 42 };
    vi.mocked(getCurrentWeather).mockResolvedValue(hotWeather);
    vi.mocked(getForecast).mockResolvedValue([]);

    const result = await weatherAgent.run({ city: "Delhi" }, mockContext);

    expect(result.advisory).toContain("heat");
  });

  it("generates cold advisory when temperature <= 10", async () => {
    const coldWeather = { ...mockWeather, temperature: 8 };
    vi.mocked(getCurrentWeather).mockResolvedValue(coldWeather);
    vi.mocked(getForecast).mockResolvedValue([]);

    const result = await weatherAgent.run({ city: "Shimla" }, mockContext);

    expect(result.advisory).toContain("cold");
  });

  it("returns null advisory when conditions are normal", async () => {
    const niceWeather = { ...mockWeather, temperature: 25, humidity: 50, visibility: 10, windSpeed: 10 };
    vi.mocked(getCurrentWeather).mockResolvedValue(niceWeather);
    vi.mocked(getForecast).mockResolvedValue([
      { time: "03:00 PM", temperature: 26, description: "clear", rainProbability: 10 },
    ]);

    const result = await weatherAgent.run({ city: "Hyderabad" }, mockContext);

    expect(result.advisory).toBeNull();
  });

  it("returns graceful error on API failure", async () => {
    vi.mocked(getCurrentWeather).mockRejectedValue(new Error("API key invalid"));
    vi.mocked(getForecast).mockRejectedValue(new Error("API key invalid"));

    const result = await weatherAgent.run({ city: "Hyderabad" }, mockContext);

    expect(result.current).toBeNull();
    expect(result.forecast).toEqual([]);
    expect(result.advisory).toBeNull();
    expect(result.error).toBe("API key invalid");
  });

  it("generates low visibility advisory", async () => {
    const foggy = { ...mockWeather, temperature: 25, visibility: 1 };
    vi.mocked(getCurrentWeather).mockResolvedValue(foggy);
    vi.mocked(getForecast).mockResolvedValue([]);

    const result = await weatherAgent.run({ city: "Delhi" }, mockContext);

    expect(result.advisory).toContain("visibility");
  });

  it("generates wind advisory when windSpeed > 40", async () => {
    const windy = { ...mockWeather, temperature: 25, windSpeed: 50 };
    vi.mocked(getCurrentWeather).mockResolvedValue(windy);
    vi.mocked(getForecast).mockResolvedValue([]);

    const result = await weatherAgent.run({ city: "Mumbai" }, mockContext);

    expect(result.advisory).toContain("wind");
  });
});
