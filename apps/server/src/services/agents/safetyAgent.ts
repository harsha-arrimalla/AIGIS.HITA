/**
 * Safety Agent
 *
 * Assesses safety of areas, routes, and times using city JSON data
 * + LLM reasoning for nuanced assessment.
 */

import type { Agent, RequestContext, SafetyZone } from "../../types/agent.js";
import { callGemini, parseJsonResponse } from "../llm.js";
import { SAFETY_AGENT_PROMPT } from "../../prompts/safety.js";

// -------------------------------------------------------------------------- //
//                              TYPES                                          //
// -------------------------------------------------------------------------- //

export interface SafetyAgentInput {
  area?: string;
  fromArea?: string;
  toArea?: string;
  timeOfDay?: string;
}

export interface SafetyAgentOutput {
  overallRisk: "low" | "moderate" | "high" | "critical";
  safetyScore: number;
  assessment: string;
  risks: string[];
  recommendations: string[];
  shouldAlert: boolean;
  alternativeAreas: string[];
  matchedZones: SafetyZone[];
  error?: string;
}

// -------------------------------------------------------------------------- //
//                              AGENT                                          //
// -------------------------------------------------------------------------- //

export const safetyAgent: Agent<SafetyAgentInput, SafetyAgentOutput> = {
  name: "safetyAgent",

  async run(input, context) {
    const { area, fromArea, toArea, timeOfDay } = input;

    try {
      // Step 1: Look up matching safety zones from city data
      const matchedZones = findMatchingZones(area, fromArea, toArea, context);

      // Step 2: Build context for LLM assessment
      const currentTime = timeOfDay || getCurrentTimeOfDay();
      const isNight = ["night", "late night"].includes(currentTime);

      const zoneInfo = matchedZones.length > 0
        ? matchedZones.map((z) => `${z.area}: score ${isNight ? z.nightScore : z.dayScore}/10. ${z.notes}`).join("\n")
        : "No specific data available for this area.";

      const scamInfo = context.cityData?.scamAlerts
        ?.filter((s) => {
          const targetArea = area || fromArea || toArea || "";
          return s.area.toLowerCase() === targetArea.toLowerCase() || s.area === "City-wide";
        })
        .map((s) => `[${s.severity}] ${s.type}: ${s.description}`)
        .join("\n") || "No scam alerts for this area.";

      const prompt = `Assess safety for:
Area: ${area || `Route from ${fromArea} to ${toArea}`}
Time: ${currentTime}
City: ${context.location?.city || "unknown"}
User: ${context.userProfile?.gender || "unknown gender"}, ${context.userProfile?.travelStyle || "solo traveler"}

Safety zone data:
${zoneInfo}

Scam alerts:
${scamInfo}`;

      // Step 3: Get LLM assessment
      const raw = await callGemini({
        prompt,
        systemInstruction: SAFETY_AGENT_PROMPT,
        temperature: 0.2,
      });

      const assessment = parseJsonResponse<Omit<SafetyAgentOutput, "matchedZones">>(raw);

      return {
        ...assessment,
        matchedZones,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Safety assessment failed";
      console.error("[safetyAgent] Error:", message);

      // Return a cautious default
      return {
        overallRisk: "moderate",
        safetyScore: 5,
        assessment: "I couldn't fully assess this area. Exercise normal caution.",
        risks: ["Unable to complete full safety analysis"],
        recommendations: ["Stay alert and trust your instincts", "Keep your phone charged"],
        shouldAlert: false,
        alternativeAreas: [],
        matchedZones: [],
        error: message,
      };
    }
  },
};

// -------------------------------------------------------------------------- //
//                           HELPERS                                           //
// -------------------------------------------------------------------------- //

function findMatchingZones(
  area: string | undefined,
  fromArea: string | undefined,
  toArea: string | undefined,
  context: RequestContext
): SafetyZone[] {
  if (!context.cityData?.safetyZones) return [];

  const zones = context.cityData.safetyZones;
  const targets = [area, fromArea, toArea].filter(Boolean) as string[];

  if (targets.length === 0) return [];

  return zones.filter((zone) =>
    targets.some((t) =>
      zone.area.toLowerCase().includes(t.toLowerCase()) ||
      t.toLowerCase().includes(zone.area.toLowerCase())
    )
  );
}

function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  if (hour >= 21 || hour < 1) return "night";
  return "late night";
}
