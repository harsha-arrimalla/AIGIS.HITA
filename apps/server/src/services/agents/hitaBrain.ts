/**
 * Hita Brain — FULL VERSION
 *
 * The composition engine. Takes all agent outputs + system prompt and
 * crafts the final natural-language reply via Claude.
 *
 * This is the last agent called in every request. It sees everything
 * the other agents produced and weaves it into a coherent, warm response.
 */

import type { Agent, RequestContext } from "../../types/agent.js";
import { callGemini, callGeminiStream } from "../llm.js";
import { buildSystemPrompt } from "../contextManager.js";

// -------------------------------------------------------------------------- //
//                              TYPES                                          //
// -------------------------------------------------------------------------- //

export interface BrainInput {
  userMessage: string;
  intent: string;
  entities: Record<string, string>;
  agentOutputs: Record<string, unknown>;
}

export interface BrainOutput {
  reply: string;
  suggestions: string[];
  uiAction?: {
    type: string;
    data: Record<string, unknown>;
  };
}

// -------------------------------------------------------------------------- //
//                              AGENT                                          //
// -------------------------------------------------------------------------- //

export const hitaBrain: Agent<BrainInput, BrainOutput> = {
  name: "hitaBrain",

  async run(input, context) {
    const { userMessage, intent, entities, agentOutputs } = input;

    const systemPrompt = buildSystemPrompt(context);

    // Build structured agent context — formatted for clarity, not raw JSON dumps
    const agentContext = formatAgentOutputs(intent, agentOutputs);

    const fullUserMessage = `[Intent: ${intent}]
[Entities: ${JSON.stringify(entities)}]
${agentContext}

User message: "${userMessage}"

## Composition Instructions
You have structured data from specialist agents above. Use it to craft your reply:
- Lead with the most important information for this intent
- For TRANSIT: mention route, time, fare, and safety in that order
- For SAFETY: lead with the assessment, then specific risks, then recommendations
- For EMOTIONAL: lead with empathy, include the grounding technique if provided, then practical suggestions
- For FARE: give the verdict clearly, then the fair price range, then advice
- For GEO: describe the top 2-3 places with practical details (distance, rating, open status)
- For WEATHER: weave weather into practical advice, don't just state the temperature
- Integrate data naturally — don't say "according to the safety agent" or reference agents by name
- If an agent returned an error, work around it gracefully
- CRITICAL: Reply in 2-3 short sentences MAX. Think WhatsApp text, not email. No paragraphs.
- If the user just said "hi" or "hello", reply in under 10 words. Don't over-explain.
- Don't repeat the user's question. Don't use filler like "Great question!"
- End with a short follow-up only when natural — not every time`;

    try {
      const reply = await callGemini({
        prompt: fullUserMessage,
        systemInstruction: systemPrompt,
        temperature: 0.7,
      });

      // Generate contextual suggestions based on intent + agent results
      const suggestions = generateSuggestions(intent, agentOutputs);

      // Generate UI action if applicable
      const uiAction = generateUIAction(intent, agentOutputs);

      return {
        reply,
        suggestions,
        uiAction,
      };
    } catch (err) {
      console.error("[hitaBrain] Failed to compose reply:", err);
      return {
        reply: "I'm having a moment — could you try again? I want to make sure I give you good advice.",
        suggestions: ["Try again", "Ask something else"],
      };
    }
  },
};

// -------------------------------------------------------------------------- //
//                         STREAMING BRAIN                                      //
// -------------------------------------------------------------------------- //

function buildBrainPrompt(input: BrainInput): string {
  const { userMessage, intent, entities, agentOutputs } = input;
  const agentContext = formatAgentOutputs(intent, agentOutputs);

  return `[Intent: ${intent}]
[Entities: ${JSON.stringify(entities)}]
${agentContext}

User message: "${userMessage}"

## Composition Instructions
You have structured data from specialist agents above. Use it to craft your reply:
- Lead with the most important information for this intent
- For TRANSIT: mention route, time, fare, and safety in that order
- For SAFETY: lead with the assessment, then specific risks, then recommendations
- For EMOTIONAL: lead with empathy, include the grounding technique if provided, then practical suggestions
- For FARE: give the verdict clearly, then the fair price range, then advice
- For GEO: describe the top 2-3 places with practical details (distance, rating, open status)
- For WEATHER: weave weather into practical advice, don't just state the temperature
- Integrate data naturally — don't say "according to the safety agent" or reference agents by name
- If an agent returned an error, work around it gracefully
- CRITICAL: Reply in 2-3 short sentences MAX. Think WhatsApp text, not email. No paragraphs.
- If the user just said "hi" or "hello", reply in under 10 words. Don't over-explain.
- Don't repeat the user's question. Don't use filler like "Great question!"
- End with a short follow-up only when natural — not every time`;
}

/**
 * Streams the brain reply token-by-token via async generator.
 * Yields text chunks. The caller collects them for persistence.
 */
export async function* hitaBrainStream(
  input: BrainInput,
  context: RequestContext
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(context);
  const prompt = buildBrainPrompt(input);

  try {
    yield* callGeminiStream({
      prompt,
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxTokens: 512,
    });
  } catch (err) {
    console.error("[hitaBrain] Stream failed:", err);
    yield "I'm having a moment — could you try again? I want to make sure I give you good advice.";
  }
}

/**
 * Non-streaming helpers exported for use by streaming orchestrator.
 */
export { generateSuggestions, generateUIAction };

function formatAgentOutputs(intent: string, outputs: Record<string, unknown>): string {
  if (Object.keys(outputs).length === 0) return "";

  const sections: string[] = ["\n## Data from Specialist Agents"];

  for (const [agent, data] of Object.entries(outputs)) {
    const formatted = formatSingleOutput(agent, data);
    if (formatted) sections.push(formatted);
  }

  return sections.join("\n\n");
}

function formatSingleOutput(agent: string, data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const d = data as Record<string, unknown>;

  // Skip if agent returned an error with no useful data
  if (d.error && Object.keys(d).length <= 2) {
    return `### ${agent}\nError: ${d.error}`;
  }

  switch (agent) {
    case "weather": {
      const current = d.current as Record<string, unknown> | null;
      if (!current) return null;
      return `### Weather
- Temperature: ${current.temperature}°C (feels like ${current.feelsLike}°C)
- Conditions: ${current.description}
- Humidity: ${current.humidity}%, Wind: ${current.windSpeed} km/h
- Visibility: ${current.visibility} km
- Sunrise: ${current.sunrise}, Sunset: ${current.sunset}
${d.advisory ? `- Advisory: ${d.advisory}` : ""}`;
    }

    case "safety": {
      return `### Safety Assessment
- Overall risk: ${d.overallRisk} (score: ${d.safetyScore}/10)
- Assessment: ${d.assessment}
- Risks: ${(d.risks as string[])?.join("; ") || "none identified"}
- Recommendations: ${(d.recommendations as string[])?.join("; ") || "none"}
${(d.alternativeAreas as string[])?.length ? `- Safer alternatives: ${(d.alternativeAreas as string[]).join(", ")}` : ""}`;
    }

    case "transit": {
      const routes = d.routes as Array<Record<string, unknown>>;
      const resolved = [
        d.fromResolved ? `From: ${(d.fromResolved as Record<string, unknown>).name}` : "",
        d.toResolved ? `To: ${(d.toResolved as Record<string, unknown>).name}` : "",
      ].filter(Boolean).join("\n");

      const routeInfo = routes?.length
        ? routes.map((r) => `- ${r.mode}: ${r.distanceKm} km, ~${r.durationInTrafficMinutes} min (with traffic)`).join("\n")
        : "No routes found";

      const fare = d.estimatedFare as Record<string, unknown> | undefined;
      const fareInfo = fare ? `\n- Expected fare: ₹${fare.min}–₹${fare.max}` : "";

      return `### Transit
${resolved}
${routeInfo}${fareInfo}
${d.recommendation ? `- Tip: ${d.recommendation}` : ""}`;
    }

    case "fare": {
      const range = d.expectedRange as Record<string, unknown> | undefined;
      return `### Fare Check
- Verdict: ${d.verdict}
${d.quotedAmount ? `- Quoted: ₹${d.quotedAmount}` : ""}
${range ? `- Fair range: ₹${range.min}–₹${range.max}` : ""}
${d.overchargePercent ? `- Overcharge: ${d.overchargePercent}%` : ""}
- Advice: ${d.advice}
${(d.scamAlerts as string[])?.length ? `- Scam alerts: ${(d.scamAlerts as string[]).join("; ")}` : ""}`;
    }

    case "geo": {
      const places = d.places as Array<Record<string, unknown>>;
      if (!places?.length) return `### Places\nNo places found.`;

      const placeList = places.slice(0, 3).map((p) => {
        const rating = p.rating ? ` (${p.rating}★)` : "";
        const open = p.isOpen !== undefined ? (p.isOpen ? " — Open now" : " — Closed") : "";
        return `- ${p.name}${rating}${open}: ${p.address}`;
      }).join("\n");

      return `### Nearby Places\n${placeList}`;
    }

    case "heart": {
      return `### Emotional Support
- Response: ${d.emotionalResponse}
${d.groundingTechnique ? `- Grounding technique: ${d.groundingTechnique}` : ""}
- Suggestions: ${(d.actionableSuggestions as string[])?.join("; ")}
${d.shouldEscalate ? `- IMPORTANT: ${d.escalationReason}` : ""}`;
    }

    default:
      return `### ${agent}\n${JSON.stringify(data, null, 2)}`;
  }
}

// -------------------------------------------------------------------------- //
//                           SUGGESTIONS                                       //
// -------------------------------------------------------------------------- //

function generateSuggestions(intent: string, agentOutputs: Record<string, unknown>): string[] {
  const base: Record<string, string[]> = {
    TRANSIT: ["Check safety of route", "Share trip with family", "Find nearby food"],
    SAFETY: ["Find a safe route", "Call emergency", "Share location"],
    WEATHER: ["Plan my day", "Find indoor activities", "Check tomorrow"],
    GEO: ["Check safety", "Get directions", "Save this place"],
    EMOTIONAL: ["Talk more", "Find a safe place nearby", "Call someone I trust"],
    FARE: ["Find cheaper options", "Report overcharging", "Book a ride"],
    TRIP_PLAN: ["Check weather", "Find restaurants", "Safety tips"],
    GENERAL: ["Help me get around", "Check safety", "Find nearby places"],
  };

  const suggestions = base[intent] || base["GENERAL"];

  // Add contextual suggestions based on agent outputs
  if (agentOutputs.safety) {
    const safety = agentOutputs.safety as Record<string, unknown>;
    if (safety.overallRisk === "high" || safety.overallRisk === "critical") {
      suggestions.unshift("Find a safer alternative");
    }
  }

  if (agentOutputs.heart) {
    const heart = agentOutputs.heart as Record<string, unknown>;
    if (heart.shouldEscalate) {
      suggestions.unshift("Call a trusted contact");
    }
  }

  return suggestions.slice(0, 3);
}

// -------------------------------------------------------------------------- //
//                            UI ACTIONS                                        //
// -------------------------------------------------------------------------- //

function generateUIAction(
  intent: string,
  agentOutputs: Record<string, unknown>
): { type: string; data: Record<string, unknown> } | undefined {
  switch (intent) {
    case "TRANSIT": {
      const transit = agentOutputs.transit as Record<string, unknown> | undefined;
      if (!transit?.fromResolved || !transit?.toResolved) return undefined;
      return {
        type: "TransitCard",
        data: {
          from: transit.fromResolved,
          to: transit.toResolved,
          routes: transit.routes,
          estimatedFare: transit.estimatedFare,
        },
      };
    }

    case "GEO": {
      const geo = agentOutputs.geo as Record<string, unknown> | undefined;
      if (!geo?.places) return undefined;
      return {
        type: "PlaceList",
        data: { places: (geo.places as unknown[]).slice(0, 3) },
      };
    }

    case "FARE": {
      const fare = agentOutputs.fare as Record<string, unknown> | undefined;
      if (!fare) return undefined;
      return {
        type: "FareCard",
        data: {
          verdict: fare.verdict,
          expectedRange: fare.expectedRange,
          quotedAmount: fare.quotedAmount,
        },
      };
    }

    case "EMOTIONAL": {
      const heart = agentOutputs.heart as Record<string, unknown> | undefined;
      if (!heart?.shouldEscalate) return undefined;
      return {
        type: "EmergencyCard",
        data: { suggestions: heart.actionableSuggestions },
      };
    }

    default:
      return undefined;
  }
}
