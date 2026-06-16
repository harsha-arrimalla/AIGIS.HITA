/**
 * Streaming Orchestrator
 *
 * Same 7-step pipeline as orchestrate(), but yields SSE events:
 *  - { type: "status", data: "classifying..." }
 *  - { type: "status", data: "researching..." }
 *  - { type: "token", data: "word " }
 *  - { type: "done", data: { suggestions, agentsUsed, ... } }
 */

import type { RequestContext } from "../types/agent.js";
import type { ChatRequest } from "../types/chat.js";
import { classifyIntent, type Intent } from "./intentClassifier.js";
import { buildClassifierContext, loadCityData, detectCityFromCoords } from "./contextManager.js";
import { memoryAgent, addMessage, updateSessionContext } from "./agents/memoryAgent.js";
import { hitaBrainStream, generateSuggestions, generateUIAction } from "./agents/hitaBrain.js";
import { weatherAgent } from "./agents/weatherAgent.js";
import { geoAgent } from "./agents/geoAgent.js";
import { safetyAgent } from "./agents/safetyAgent.js";
import { transitAgent } from "./agents/transitAgent.js";
import { fareGuard } from "./agents/fareGuard.js";
import { heartAgent } from "./agents/heartAgent.js";
import { getOrCreateConversation, saveMessage as dbSaveMessage } from "../lib/supabase.js";

export interface SSEEvent {
  type: "status" | "token" | "done" | "error";
  data: unknown;
}

export async function* orchestrateStream(request: ChatRequest): AsyncGenerator<SSEEvent> {
  const startTime = Date.now();
  const { message, sessionId, userId, location: userCoords } = request;

  // STEP 1-3: CLASSIFY + CONTEXT
  yield { type: "status", data: "Understanding your message..." };

  const memoryOutput = await memoryAgent.run(
    { sessionId, userId, currentMessage: message },
    buildEmptyContext(sessionId)
  );

  // Detect city: session context → user coordinates → message text
  let city = memoryOutput.sessionContext.city as string | null;
  if (!city && userCoords) {
    city = await detectCityFromCoords(userCoords.lat, userCoords.lng);
  }
  if (!city) {
    city = detectCity(message);
  }

  // Load city data — works for any city worldwide
  const cityData = city ? await loadCityData(city) : undefined;

  if (city && !memoryOutput.sessionContext.city) {
    await updateSessionContext(sessionId, { city });
  }

  const context: RequestContext = {
    sessionId,
    userId,
    userProfile: { memorizedFacts: memoryOutput.userFacts },
    location: city || userCoords
      ? {
          lat: userCoords?.lat ?? 0,
          lng: userCoords?.lng ?? 0,
          city: city || undefined,
        }
      : undefined,
    conversationHistory: memoryOutput.conversationHistory,
    cityData: cityData || undefined,
    timestamp: new Date(),
  };

  const classifierContext = buildClassifierContext(context);
  const classification = await classifyIntent(message, classifierContext);
  const { intent, entities } = classification;

  // STEP 4-5: DISPATCH AGENTS
  yield { type: "status", data: getDispatchStatus(intent) };

  const agentOutputs: Record<string, unknown> = {};
  const agentsUsed: string[] = ["memoryAgent"];

  await dispatchAgents(intent, entities, context, agentOutputs, agentsUsed, message);

  // STEP 6: STREAM BRAIN REPLY
  yield { type: "status", data: "Composing response..." };

  let fullReply = "";
  try {
    for await (const chunk of hitaBrainStream(
      { userMessage: message, intent, entities, agentOutputs },
      context
    )) {
      fullReply += chunk;
      yield { type: "token", data: chunk };
    }
  } catch (err) {
    console.error("[orchestrateStream] Brain stream error:", err);
    const fallback = "I'm having a moment — could you try again?";
    fullReply = fallback;
    yield { type: "token", data: fallback };
  }

  agentsUsed.push("hitaBrain");

  // STEP 7: PERSIST + DONE
  await addMessage(sessionId, "user", message);
  await addMessage(sessionId, "assistant", fullReply);

  persistToDb(sessionId, userId || "anonymous", message, fullReply).catch((err) => {
    console.error("[orchestrateStream] DB persist failed:", err);
  });

  const suggestions = generateSuggestions(intent, agentOutputs);
  const uiAction = generateUIAction(intent, agentOutputs);
  const totalLatency = Date.now() - startTime;

  yield {
    type: "done",
    data: {
      suggestions,
      uiAction,
      agentsUsed,
      debug:
        process.env.NODE_ENV === "development"
          ? {
              intent,
              confidence: classification.confidence,
              entities,
              agentTimings: {},
              totalLatencyMs: totalLatency,
            }
          : undefined,
    },
  };
}

// -------------------------------------------------------------------------- //
//                          HELPERS (copied from orchestrator.ts)               //
// -------------------------------------------------------------------------- //

function getDispatchStatus(intent: Intent): string {
  const map: Record<string, string> = {
    TRANSIT: "Checking routes and fares...",
    SAFETY: "Assessing safety...",
    WEATHER: "Checking weather...",
    GEO: "Finding nearby places...",
    EMOTIONAL: "I'm here for you...",
    FARE: "Checking fair prices...",
    TRIP_PLAN: "Planning your trip...",
    GENERAL: "Thinking...",
  };
  return map[intent] || "Thinking...";
}

async function dispatchAgents(
  intent: Intent,
  entities: Record<string, string>,
  context: RequestContext,
  agentOutputs: Record<string, unknown>,
  agentsUsed: string[],
  userMessage: string
): Promise<void> {
  const city = context.location?.city || null;
  const userLat = context.location?.lat;
  const userLng = context.location?.lng;

  switch (intent) {
    case "TRANSIT": {
      const promises: Promise<void>[] = [];
      if (entities.from && entities.to) {
        promises.push(
          transitAgent.run({ from: entities.from, to: entities.to }, context).then((r) => { agentOutputs.transit = r; agentsUsed.push("transitAgent"); })
        );
        promises.push(
          safetyAgent.run({ fromArea: entities.from, toArea: entities.to }, context).then((r) => { agentOutputs.safety = r; agentsUsed.push("safetyAgent"); })
        );
        promises.push(
          fareGuard.run({ from: entities.from, to: entities.to, mode: entities.mode }, context).then((r) => { agentOutputs.fare = r; agentsUsed.push("fareGuard"); })
        );
      }
      if (city) {
        promises.push(
          weatherAgent.run({ city }, context).then((r) => { agentOutputs.weather = r; agentsUsed.push("weatherAgent"); })
        );
      }
      await runAgentsParallel(promises);
      break;
    }
    case "SAFETY": {
      const area = entities.area || entities.from;
      agentOutputs.safety = await safetyAgent.run({ area, timeOfDay: entities.timeOfDay }, context);
      agentsUsed.push("safetyAgent");
      break;
    }
    case "WEATHER": {
      const weatherCity = entities.city || city;
      if (weatherCity) {
        agentOutputs.weather = await weatherAgent.run({ city: weatherCity }, context);
        agentsUsed.push("weatherAgent");
      }
      break;
    }
    case "GEO": {
      agentOutputs.geo = await geoAgent.run({ query: userMessage, userLat, userLng, city: city || undefined }, context);
      agentsUsed.push("geoAgent");
      break;
    }
    case "EMOTIONAL": {
      const emotion = entities.emotion || "anxious";
      const intensity = (entities.intensity as "low" | "medium" | "high") || "medium";
      agentOutputs.heart = await heartAgent.run({ emotion, intensity, message: userMessage }, context);
      agentsUsed.push("heartAgent");
      if (emotion === "scared" || emotion === "afraid") {
        agentOutputs.safety = await safetyAgent.run({ area: entities.area }, context);
        agentsUsed.push("safetyAgent");
      }
      break;
    }
    case "FARE": {
      agentOutputs.fare = await fareGuard.run({
        quotedAmount: entities.amount ? parseFloat(entities.amount) : undefined,
        from: entities.from, to: entities.to, mode: entities.mode,
      }, context);
      agentsUsed.push("fareGuard");
      break;
    }
    case "TRIP_PLAN": {
      const promises: Promise<void>[] = [];
      if (city) {
        promises.push(weatherAgent.run({ city }, context).then((r) => { agentOutputs.weather = r; agentsUsed.push("weatherAgent"); }));
        promises.push(safetyAgent.run({ area: city }, context).then((r) => { agentOutputs.safety = r; agentsUsed.push("safetyAgent"); }));
      }
      promises.push(geoAgent.run({ query: userMessage, userLat, userLng, city: city || undefined }, context).then((r) => { agentOutputs.geo = r; agentsUsed.push("geoAgent"); }));
      await runAgentsParallel(promises);
      break;
    }
    default:
      break;
  }
}

async function runAgentsParallel(promises: Promise<void>[]): Promise<void> {
  const results = await Promise.allSettled(promises);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[orchestrateStream] Agent failed:", result.reason);
    }
  }
}

function detectCity(message: string): string | null {
  const cityKeywords: Record<string, string[]> = {
    // India
    hyderabad: ["hyderabad", "hyd", "hitech city", "banjara hills", "charminar", "secunderabad", "gachibowli", "madhapur", "shamshabad"],
    delhi: ["delhi", "new delhi", "noida", "gurgaon", "gurugram", "connaught place"],
    bangalore: ["bangalore", "bengaluru", "koramangala", "indiranagar", "whitefield", "electronic city"],
    mumbai: ["mumbai", "bombay", "bandra", "andheri", "juhu", "colaba", "dadar"],
    chennai: ["chennai", "madras", "t. nagar", "adyar", "anna nagar"],
    kolkata: ["kolkata", "calcutta", "salt lake", "park street", "howrah"],
    goa: ["goa", "panaji", "calangute", "baga", "anjuna", "palolem"],
    pune: ["pune", "hinjewadi", "koregaon park"],
    jaipur: ["jaipur", "pink city"],
    kochi: ["kochi", "cochin", "fort kochi"],
    varanasi: ["varanasi", "banaras"],
    agra: ["agra", "taj mahal"],
    udaipur: ["udaipur"],
    // Southeast Asia
    bangkok: ["bangkok", "sukhumvit", "khao san"],
    singapore: ["singapore", "marina bay", "sentosa"],
    bali: ["bali", "ubud", "kuta", "seminyak", "canggu"],
    "kuala lumpur": ["kuala lumpur", "kl", "bukit bintang"],
    // East Asia
    tokyo: ["tokyo", "shinjuku", "shibuya", "akihabara"],
    seoul: ["seoul", "gangnam", "myeongdong"],
    "hong kong": ["hong kong", "kowloon"],
    // Europe
    london: ["london", "heathrow", "soho", "covent garden"],
    paris: ["paris", "eiffel", "montmartre"],
    barcelona: ["barcelona", "la rambla"],
    amsterdam: ["amsterdam"],
    rome: ["rome", "colosseum"],
    istanbul: ["istanbul", "sultanahmet", "taksim"],
    // Middle East
    dubai: ["dubai", "jumeirah", "deira"],
    // Americas
    "new york": ["new york", "nyc", "manhattan", "brooklyn"],
    "san francisco": ["san francisco", "sf"],
    "los angeles": ["los angeles", "hollywood"],
    toronto: ["toronto"],
    "mexico city": ["mexico city", "cdmx"],
    // Africa & Oceania
    cairo: ["cairo", "giza", "pyramids"],
    cape_town: ["cape town"],
    sydney: ["sydney", "bondi"],
    melbourne: ["melbourne"],
  };
  const lower = message.toLowerCase();
  for (const [city, keywords] of Object.entries(cityKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) return city;
  }
  return null;
}

function buildEmptyContext(sessionId: string): RequestContext {
  return { sessionId, conversationHistory: [], timestamp: new Date() };
}

async function persistToDb(sessionId: string, userId: string, userMessage: string, assistantReply: string): Promise<void> {
  const uid = userId || "anonymous";
  const convId = await getOrCreateConversation(sessionId, uid);
  await dbSaveMessage(convId, uid, "user", userMessage);
  await dbSaveMessage(convId, uid, "assistant", assistantReply);
}
