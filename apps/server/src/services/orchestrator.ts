/**
 * Orchestrator — The Master Router
 *
 * Every user message flows through 7 steps:
 * 1. RECEIVE    — message arrives
 * 2. CLASSIFY   — intent classifier identifies what the user wants
 * 3. CONTEXT    — memory agent loads user facts + conversation history
 * 4. DISPATCH   — call 1-N specialist agents in parallel
 * 5. ENRICH     — each agent returns structured data
 * 6. COMPOSE    — Hita Brain takes all outputs → final reply
 * 7. RETURN     — response sent to client
 */

import type { RequestContext } from "../types/agent.js";
import type { ChatRequest, ChatResponse } from "../types/chat.js";
import { classifyIntent, type Intent } from "./intentClassifier.js";
import { buildClassifierContext, loadCityData, detectCityFromCoords } from "./contextManager.js";
import { memoryAgent, addMessage, updateSessionContext } from "./agents/memoryAgent.js";
import { hitaBrain } from "./agents/hitaBrain.js";
import { weatherAgent } from "./agents/weatherAgent.js";
import { geoAgent } from "./agents/geoAgent.js";
import { safetyAgent } from "./agents/safetyAgent.js";
import { transitAgent } from "./agents/transitAgent.js";
import { fareGuard } from "./agents/fareGuard.js";
import { heartAgent } from "./agents/heartAgent.js";
import { getOrCreateConversation, saveMessage as dbSaveMessage, loadMessages as dbLoadMessages } from "../lib/supabase.js";

export async function orchestrate(request: ChatRequest): Promise<ChatResponse> {
  const startTime = Date.now();
  const { message, sessionId, userId, location: userCoords } = request;

  // ---------------------------------------------------------------------- //
  //                        STEP 1–3: CLASSIFY + CONTEXT                     //
  // ---------------------------------------------------------------------- //

  // Load memory first — we need conversation history for classification context
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

  // Load city data — works for any city worldwide (static JSON or LLM-generated)
  const cityData = city ? await loadCityData(city) : undefined;

  // Persist city to session context for future messages
  if (city && !memoryOutput.sessionContext.city) {
    await updateSessionContext(sessionId, { city });
  }

  // Build the full request context
  const context: RequestContext = {
    sessionId,
    userId,
    userProfile: {
      memorizedFacts: memoryOutput.userFacts,
    },
    location: city
      ? { lat: userCoords?.lat || 0, lng: userCoords?.lng || 0, city }
      : userCoords
        ? { lat: userCoords.lat, lng: userCoords.lng }
        : undefined,
    conversationHistory: memoryOutput.conversationHistory,
    cityData: cityData || undefined,
    timestamp: new Date(),
  };

  // Classify intent with conversation context
  const classifierContext = buildClassifierContext(context);
  const classification = await classifyIntent(message, classifierContext);

  const { intent, entities } = classification;

  // ---------------------------------------------------------------------- //
  //                      STEP 4–5: DISPATCH AGENTS                          //
  // ---------------------------------------------------------------------- //

  const agentOutputs: Record<string, unknown> = {};
  const agentsUsed: string[] = ["memoryAgent"];

  // Dispatch specialist agents based on intent
  // (For now, only Memory + Brain are wired. Agents get added in Phase 3.)
  await dispatchAgents(intent, entities, context, agentOutputs, agentsUsed, message);

  // ---------------------------------------------------------------------- //
  //                      STEP 6: COMPOSE FINAL REPLY                        //
  // ---------------------------------------------------------------------- //

  const brainOutput = await hitaBrain.run(
    {
      userMessage: message,
      intent,
      entities,
      agentOutputs,
    },
    context
  );
  agentsUsed.push("hitaBrain");

  // ---------------------------------------------------------------------- //
  //                       STEP 7: PERSIST + RETURN                          //
  // ---------------------------------------------------------------------- //

  // Save messages to in-memory history
  await addMessage(sessionId, "user", message);
  await addMessage(sessionId, "assistant", brainOutput.reply);

  // Persist to Supabase (fire-and-forget, don't block response)
  persistToDb(sessionId, userId || "anonymous", message, brainOutput.reply).catch((err) => {
    console.error("[orchestrator] DB persist failed:", err);
  });

  const totalLatency = Date.now() - startTime;

  return {
    reply: brainOutput.reply,
    uiAction: brainOutput.uiAction,
    suggestions: brainOutput.suggestions,
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
  };
}

// -------------------------------------------------------------------------- //
//                          AGENT DISPATCH                                     //
// -------------------------------------------------------------------------- //

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
      // Parallel: geo resolve, safety, fare, weather
      const promises: Promise<void>[] = [];

      if (entities.from && entities.to) {
        promises.push(
          transitAgent.run({ from: entities.from, to: entities.to }, context).then((r) => {
            agentOutputs.transit = r;
            agentsUsed.push("transitAgent");
          })
        );
        promises.push(
          safetyAgent.run({ fromArea: entities.from, toArea: entities.to }, context).then((r) => {
            agentOutputs.safety = r;
            agentsUsed.push("safetyAgent");
          })
        );
        promises.push(
          fareGuard.run({ from: entities.from, to: entities.to, mode: entities.mode }, context).then((r) => {
            agentOutputs.fare = r;
            agentsUsed.push("fareGuard");
          })
        );
      }
      if (city) {
        promises.push(
          weatherAgent.run({ city }, context).then((r) => {
            agentOutputs.weather = r;
            agentsUsed.push("weatherAgent");
          })
        );
      }

      await runAgentsParallel(promises);
      break;
    }

    case "SAFETY": {
      const area = entities.area || entities.from;
      agentOutputs.safety = await safetyAgent.run(
        { area, timeOfDay: entities.timeOfDay },
        context
      );
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
      agentOutputs.geo = await geoAgent.run(
        { query: userMessage, userLat, userLng, city: city || undefined },
        context
      );
      agentsUsed.push("geoAgent");
      break;
    }

    case "EMOTIONAL": {
      const emotion = entities.emotion || "anxious";
      const intensity = (entities.intensity as "low" | "medium" | "high") || "medium";
      agentOutputs.heart = await heartAgent.run(
        { emotion, intensity, message: userMessage },
        context
      );
      agentsUsed.push("heartAgent");

      // Also check safety if they sound scared
      if (emotion === "scared" || emotion === "afraid") {
        agentOutputs.safety = await safetyAgent.run(
          { area: entities.area },
          context
        );
        agentsUsed.push("safetyAgent");
      }
      break;
    }

    case "FARE": {
      agentOutputs.fare = await fareGuard.run(
        {
          quotedAmount: entities.amount ? parseFloat(entities.amount) : undefined,
          from: entities.from,
          to: entities.to,
          mode: entities.mode,
        },
        context
      );
      agentsUsed.push("fareGuard");
      break;
    }

    case "TRIP_PLAN": {
      const promises: Promise<void>[] = [];

      if (city) {
        promises.push(
          weatherAgent.run({ city }, context).then((r) => {
            agentOutputs.weather = r;
            agentsUsed.push("weatherAgent");
          })
        );
        promises.push(
          safetyAgent.run({ area: city }, context).then((r) => {
            agentOutputs.safety = r;
            agentsUsed.push("safetyAgent");
          })
        );
      }

      promises.push(
        geoAgent.run({ query: userMessage, userLat, userLng, city: city || undefined }, context).then((r) => {
          agentOutputs.geo = r;
          agentsUsed.push("geoAgent");
        })
      );

      await runAgentsParallel(promises);
      break;
    }

    case "GENERAL":
    default:
      break;
  }
}

// -------------------------------------------------------------------------- //
//                           HELPERS                                           //
// -------------------------------------------------------------------------- //

/**
 * Run promises in parallel, logging any failures.
 */
async function runAgentsParallel(promises: Promise<void>[]): Promise<void> {
  const results = await Promise.allSettled(promises);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[orchestrator] Agent dispatch failed:", result.reason);
    }
  }
}

/**
 * Fast keyword-based city detection from message text.
 * Covers major cities worldwide. For unlisted cities, the system
 * falls back to reverse geocoding from user coordinates.
 */
function detectCity(message: string): string | null {
  const cityKeywords: Record<string, string[]> = {
    // India
    hyderabad: ["hyderabad", "hyd", "hitech city", "banjara hills", "charminar", "secunderabad", "gachibowli", "madhapur", "shamshabad", "hitec city"],
    delhi: ["delhi", "new delhi", "noida", "gurgaon", "gurugram", "connaught place", "chandni chowk"],
    bangalore: ["bangalore", "bengaluru", "koramangala", "indiranagar", "whitefield", "electronic city", "hsr layout", "jayanagar"],
    mumbai: ["mumbai", "bombay", "bandra", "andheri", "juhu", "colaba", "dadar", "worli", "powai", "goregaon"],
    chennai: ["chennai", "madras", "t. nagar", "adyar", "anna nagar", "velachery", "mylapore"],
    kolkata: ["kolkata", "calcutta", "salt lake", "park street", "howrah", "new town"],
    goa: ["goa", "panaji", "panjim", "calangute", "baga", "anjuna", "vagator", "palolem", "arambol"],
    pune: ["pune", "hinjewadi", "kothrud", "viman nagar", "koregaon park", "shivaji nagar"],
    jaipur: ["jaipur", "pink city", "amber fort", "hawa mahal"],
    ahmedabad: ["ahmedabad", "gandhinagar"],
    kochi: ["kochi", "cochin", "fort kochi", "ernakulam"],
    varanasi: ["varanasi", "banaras", "benares", "kashi"],
    agra: ["agra", "taj mahal"],
    lucknow: ["lucknow", "hazratganj"],
    chandigarh: ["chandigarh"],
    udaipur: ["udaipur", "city of lakes"],
    mysore: ["mysore", "mysuru"],
    rishikesh: ["rishikesh"],
    shimla: ["shimla"],
    manali: ["manali"],
    darjeeling: ["darjeeling"],
    amritsar: ["amritsar", "golden temple"],
    // Southeast Asia
    bangkok: ["bangkok", "sukhumvit", "khao san", "silom", "siam"],
    singapore: ["singapore", "orchard road", "marina bay", "sentosa", "changi"],
    bali: ["bali", "ubud", "kuta", "seminyak", "canggu", "denpasar"],
    "kuala lumpur": ["kuala lumpur", "kl", "bukit bintang", "petronas"],
    "ho chi minh city": ["ho chi minh", "saigon", "hcmc"],
    hanoi: ["hanoi"],
    manila: ["manila", "makati", "bgc", "taguig"],
    jakarta: ["jakarta"],
    // East Asia
    tokyo: ["tokyo", "shinjuku", "shibuya", "akihabara", "ginza", "roppongi", "asakusa"],
    osaka: ["osaka", "dotonbori", "namba", "umeda"],
    kyoto: ["kyoto", "gion", "fushimi"],
    seoul: ["seoul", "gangnam", "myeongdong", "hongdae", "itaewon"],
    beijing: ["beijing", "peking", "tiananmen"],
    shanghai: ["shanghai", "pudong", "the bund"],
    "hong kong": ["hong kong", "kowloon", "tsim sha tsui", "central hk"],
    taipei: ["taipei", "ximending"],
    // Europe
    london: ["london", "heathrow", "gatwick", "soho", "covent garden", "westminster", "camden"],
    paris: ["paris", "eiffel", "montmartre", "champs", "le marais", "cdg"],
    barcelona: ["barcelona", "la rambla", "sagrada", "gothic quarter"],
    amsterdam: ["amsterdam", "schiphol"],
    rome: ["rome", "colosseum", "trastevere", "vatican"],
    berlin: ["berlin", "kreuzberg", "mitte"],
    prague: ["prague"],
    lisbon: ["lisbon", "alfama"],
    istanbul: ["istanbul", "sultanahmet", "taksim", "kadikoy", "besiktas"],
    athens: ["athens", "plaka", "monastiraki"],
    vienna: ["vienna", "wien"],
    zurich: ["zurich", "zürich"],
    munich: ["munich", "münchen"],
    dublin: ["dublin"],
    edinburgh: ["edinburgh"],
    // Middle East
    dubai: ["dubai", "dxb", "jumeirah", "deira", "marina"],
    "abu dhabi": ["abu dhabi"],
    doha: ["doha"],
    // Americas
    "new york": ["new york", "nyc", "manhattan", "brooklyn", "queens", "jfk", "laguardia"],
    "los angeles": ["los angeles", "la", "hollywood", "santa monica", "lax"],
    "san francisco": ["san francisco", "sf", "sfo", "fisherman"],
    chicago: ["chicago", "o'hare"],
    miami: ["miami", "south beach"],
    toronto: ["toronto", "yyz"],
    vancouver: ["vancouver"],
    "mexico city": ["mexico city", "cdmx"],
    "buenos aires": ["buenos aires"],
    "são paulo": ["são paulo", "sao paulo"],
    rio: ["rio de janeiro", "copacabana", "ipanema"],
    lima: ["lima", "miraflores"],
    bogota: ["bogota", "bogotá"],
    // Africa
    cairo: ["cairo", "giza", "pyramids"],
    cape_town: ["cape town"],
    nairobi: ["nairobi"],
    marrakech: ["marrakech", "marrakesh"],
    // Oceania
    sydney: ["sydney", "bondi", "darling harbour"],
    melbourne: ["melbourne", "fitzroy", "st kilda"],
    auckland: ["auckland"],
  };

  const lower = message.toLowerCase();
  for (const [city, keywords] of Object.entries(cityKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return city;
    }
  }

  return null;
}

function buildEmptyContext(sessionId: string): RequestContext {
  return {
    sessionId,
    conversationHistory: [],
    timestamp: new Date(),
  };
}

/**
 * Persist user + assistant messages to Supabase.
 */
async function persistToDb(
  sessionId: string,
  userId: string,
  userMessage: string,
  assistantReply: string
): Promise<void> {
  const uid = userId || "anonymous";
  const convId = await getOrCreateConversation(sessionId, uid);
  await dbSaveMessage(convId, uid, "user", userMessage);
  await dbSaveMessage(convId, uid, "assistant", assistantReply);
}
