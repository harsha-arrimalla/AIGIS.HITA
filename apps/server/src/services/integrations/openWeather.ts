/**
 * OpenWeather API Client
 *
 * Fetches current weather and basic forecast for a city or coordinates.
 * Free tier: 1,000 calls/day.
 */

const BASE_URL = "https://api.openweathermap.org/data/2.5";
const FETCH_TIMEOUT_MS = 10_000;

export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  updatedAt: string;
}

export interface ForecastItem {
  time: string;
  temperature: number;
  description: string;
  rainProbability: number;
}

function getApiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error("OPENWEATHER_API_KEY is not set");
  return key;
}

export async function getCurrentWeather(city: string): Promise<WeatherData> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`OpenWeather API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as Record<string, unknown>;

  const sys = data.sys as Record<string, number>;
  const main = data.main as Record<string, number>;
  const wind = data.wind as Record<string, number>;
  const weatherArr = data.weather as Array<Record<string, string>>;

  return {
    city: data.name as string,
    country: sys.country as unknown as string,
    temperature: Math.round(main.temp),
    feelsLike: Math.round(main.feels_like),
    humidity: main.humidity,
    description: weatherArr[0].description,
    icon: weatherArr[0].icon,
    windSpeed: Math.round(wind.speed * 3.6), // m/s to km/h
    visibility: Math.round((data.visibility as number) / 1000), // m to km
    sunrise: new Date(sys.sunrise * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    sunset: new Date(sys.sunset * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    updatedAt: new Date().toISOString(),
  };
}

export async function getForecast(city: string, hours: number = 12): Promise<ForecastItem[]> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&cnt=${Math.ceil(hours / 3)}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`OpenWeather forecast error: ${response.status}`);
  }

  const data = await response.json() as Record<string, unknown>;
  const list = data.list as Array<Record<string, unknown>>;

  return list.map((item) => {
    const main = item.main as Record<string, number>;
    const weatherArr = item.weather as Array<Record<string, string>>;
    return {
      time: new Date((item.dt as number) * 1000).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temperature: Math.round(main.temp),
      description: weatherArr[0].description,
      rainProbability: Math.round(((item.pop as number) || 0) * 100),
    };
  });
}
