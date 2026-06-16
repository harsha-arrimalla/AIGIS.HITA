/**
 * Weather Agent
 *
 * Fetches current weather + short forecast for the user's city.
 * Returns structured data for the Brain to compose into a natural reply.
 */

import type { Agent, RequestContext } from "../../types/agent.js";
import { getCurrentWeather, getForecast, type WeatherData, type ForecastItem } from "../integrations/openWeather.js";

// -------------------------------------------------------------------------- //
//                              TYPES                                          //
// -------------------------------------------------------------------------- //

export interface WeatherAgentInput {
  city: string;
}

export interface WeatherAgentOutput {
  current: WeatherData | null;
  forecast: ForecastItem[];
  advisory: string | null;
  error?: string;
}

// -------------------------------------------------------------------------- //
//                              AGENT                                          //
// -------------------------------------------------------------------------- //

export const weatherAgent: Agent<WeatherAgentInput, WeatherAgentOutput> = {
  name: "weatherAgent",

  async run(input, _context) {
    const { city } = input;

    try {
      // Fetch current + forecast in parallel
      const [current, forecast] = await Promise.all([
        getCurrentWeather(city),
        getForecast(city, 12),
      ]);

      // Generate advisory based on conditions
      const advisory = generateAdvisory(current, forecast);

      return { current, forecast, advisory };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown weather error";
      console.error(`[weatherAgent] Failed for ${city}:`, message);
      return {
        current: null,
        forecast: [],
        advisory: null,
        error: message,
      };
    }
  },
};

// -------------------------------------------------------------------------- //
//                           ADVISORY LOGIC                                    //
// -------------------------------------------------------------------------- //

function generateAdvisory(current: WeatherData, forecast: ForecastItem[]): string | null {
  const advisories: string[] = [];

  // Temperature warnings
  if (current.temperature >= 40) {
    advisories.push("Extreme heat — stay hydrated, avoid outdoor activity between 12-4 PM.");
  } else if (current.temperature >= 35) {
    advisories.push("It's quite hot — carry water and stay in shade when possible.");
  } else if (current.temperature <= 10) {
    advisories.push("It's cold — layer up if you're heading out.");
  }

  // Rain check
  const rainSoon = forecast.some((f) => f.rainProbability > 60);
  if (rainSoon) {
    advisories.push("Rain is likely in the next few hours — carry an umbrella.");
  }

  // Visibility
  if (current.visibility < 2) {
    advisories.push("Low visibility — be careful if driving or crossing roads.");
  }

  // Wind
  if (current.windSpeed > 40) {
    advisories.push("Strong winds — avoid open areas and two-wheelers if possible.");
  }

  // Humidity
  if (current.humidity > 85 && current.temperature > 30) {
    advisories.push("High humidity with heat — it'll feel hotter than the temperature suggests.");
  }

  return advisories.length > 0 ? advisories.join(" ") : null;
}
