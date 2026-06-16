/**
 * Context Manager
 *
 * Builds the dynamic system prompt for each request by combining:
 * - Base Hita personality prompt
 * - User profile and memorized facts
 * - City-specific data (safety, fares, scams)
 * - Conversation history
 * - Time of day
 *
 * City data is loaded from static JSON for curated cities, or generated
 * dynamically via Gemini for any city worldwide (cached in memory).
 */

import { buildHitaSystemPrompt } from "../prompts/hita.system.js";
import type { RequestContext, CityData } from "../types/agent.js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { callGemini } from "./llm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache loaded city data in memory (static + LLM-generated)
const cityDataCache = new Map<string, CityData>();

// Track in-flight LLM generation to avoid duplicate calls
const cityGenInFlight = new Map<string, Promise<CityData | null>>();

export async function loadCityData(city: string): Promise<CityData | null> {
  const normalised = city.toLowerCase().trim();

  if (cityDataCache.has(normalised)) {
    return cityDataCache.get(normalised)!;
  }

  // Try static JSON first
  try {
    const filePath = join(__dirname, "..", "data", "cities", `${normalised}.json`);
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as CityData;
    cityDataCache.set(normalised, data);
    return data;
  } catch {
    // No static file — generate via LLM
  }

  // Deduplicate concurrent calls for the same city
  if (cityGenInFlight.has(normalised)) {
    return cityGenInFlight.get(normalised)!;
  }

  const promise = generateCityData(city).then((data) => {
    cityGenInFlight.delete(normalised);
    if (data) cityDataCache.set(normalised, data);
    return data;
  }).catch((err) => {
    cityGenInFlight.delete(normalised);
    console.error(`[contextManager] Failed to generate city data for ${city}:`, err);
    return null;
  });

  cityGenInFlight.set(normalised, promise);
  return promise;
}

/**
 * Generate city-specific safety, fare, and scam data via Gemini.
 * This enables worldwide coverage without pre-built JSON files.
 */
async function generateCityData(city: string): Promise<CityData | null> {
  console.log(`[contextManager] Generating city data for: ${city}`);

  const prompt = `Generate travel safety and practical data for ${city}. Return ONLY valid JSON, no markdown.

{
  "name": "${city}",
  "safetyZones": [
    {
      "area": "area name",
      "safetyScore": 7,
      "dayScore": 8,
      "nightScore": 5,
      "notes": "Brief safety notes for travelers"
    }
  ],
  "fareBenchmarks": [
    {
      "from": "Airport",
      "to": "City Center",
      "mode": "cab",
      "expectedFareMin": 300,
      "expectedFareMax": 500,
      "currency": "local currency code"
    }
  ],
  "scamAlerts": [
    {
      "type": "scam type",
      "area": "where it happens",
      "description": "what to watch for",
      "severity": "medium"
    }
  ],
  "emergencyNumbers": {
    "police": "number",
    "ambulance": "number",
    "fire": "number",
    "tourist_helpline": "number if exists"
  }
}

Rules:
- Include 6-10 major areas/neighborhoods for safetyZones
- Include 3-5 common routes for fareBenchmarks (airport→center, station→center, etc.)
- Include 3-5 real, well-known scams for that city/country
- Use LOCAL currency for fares (INR for India, USD for US, EUR for Europe, etc.)
- Use REAL emergency numbers for that country
- Safety scores: 1=dangerous, 10=very safe. Be honest about night safety.
- Keep notes brief (1 sentence)
- This must be factually accurate — travelers depend on this`;

  try {
    const raw = await callGemini({
      prompt,
      temperature: 0.2,
      maxTokens: 2048,
    });

    // Strip markdown fences, trailing commas, and other common LLM JSON issues
    let cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    // Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
    // Remove any text after the final closing brace
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace !== -1) cleaned = cleaned.slice(0, lastBrace + 1);

    const data = JSON.parse(cleaned) as CityData;

    // Validate minimum structure
    if (!data.safetyZones?.length || !data.emergencyNumbers) {
      console.warn(`[contextManager] Generated data for ${city} missing required fields`);
      return null;
    }

    // Ensure name is set
    data.name = data.name || city;

    console.log(`[contextManager] Generated city data for ${city}: ${data.safetyZones.length} zones, ${data.fareBenchmarks?.length || 0} fares, ${data.scamAlerts?.length || 0} scams`);
    return data;
  } catch (err) {
    console.error(`[contextManager] Failed to parse generated city data for ${city}:`, err);
    return null;
  }
}

/**
 * Detect city from coordinates using Nominatim reverse geocoding (free, no API key).
 */
export async function detectCityFromCoords(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { "User-Agent": "Hita-Travel-App/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { address?: { city?: string; town?: string; state_district?: string; state?: string; county?: string; country?: string } };
    const addr = data.address;
    return addr?.city || addr?.town || addr?.state_district || addr?.county || null;
  } catch {
    return null;
  }
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function buildSystemPrompt(context: RequestContext): string {
  const basePrompt = buildHitaSystemPrompt({
    userName: context.userProfile?.name,
    city: context.location?.city,
    timeOfDay: getTimeOfDay(),
    userFacts: context.userProfile?.memorizedFacts,
  });

  // Append city-specific context if available
  let cityContext = "";
  if (context.cityData) {
    const { safetyZones, fareBenchmarks, scamAlerts } = context.cityData;

    cityContext = `\n\n## City-Specific Knowledge (${context.cityData.name})

### Safety Zones
${safetyZones.map((z) => `- ${z.area}: ${z.safetyScore}/10 overall (day: ${z.dayScore}, night: ${z.nightScore}). ${z.notes}`).join("\n")}

### Fare Benchmarks
${fareBenchmarks.map((f) => `- ${f.from} → ${f.to} by ${f.mode}: ₹${f.expectedFareMin}–${f.expectedFareMax}`).join("\n")}

### Active Scam Alerts
${scamAlerts.map((s) => `- [${s.severity.toUpperCase()}] ${s.area}: ${s.description}`).join("\n")}`;
  }

  // Append recent conversation for continuity
  let conversationContext = "";
  if (context.conversationHistory.length > 0) {
    const recent = context.conversationHistory.slice(-6); // Last 3 exchanges
    conversationContext = `\n\n## Recent Conversation
${recent.map((m) => `${m.role}: ${m.content}`).join("\n")}`;
  }

  return basePrompt + cityContext + conversationContext;
}

/**
 * Build a short context summary for the intent classifier.
 * Keeps it brief so Gemini Flash isn't overwhelmed.
 */
export function buildClassifierContext(context: RequestContext): string {
  const parts: string[] = [];

  if (context.userProfile?.name) {
    parts.push(`User: ${context.userProfile.name}`);
  }
  if (context.location?.city) {
    parts.push(`City: ${context.location.city}`);
  }
  if (context.conversationHistory.length > 0) {
    const lastTwo = context.conversationHistory.slice(-2);
    parts.push(`Recent:\n${lastTwo.map((m) => `${m.role}: ${m.content}`).join("\n")}`);
  }

  return parts.join("\n");
}
