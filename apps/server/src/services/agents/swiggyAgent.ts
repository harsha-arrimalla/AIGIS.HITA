/**
 * Swiggy Agent
 *
 * Handles food ordering (Swiggy Food) and table reservations (Swiggy Dineout)
 * through Swiggy's official MCP servers, using the Anthropic API's MCP
 * connector — the model calls Swiggy's tools (search restaurants, browse
 * menus, manage cart, place orders, book tables) server-side, authenticated
 * with the user's own linked Swiggy account.
 *
 * If the user hasn't linked Swiggy yet, returns needsAuth + a connect URL that
 * the brain surfaces to the user.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Agent, RequestContext } from "../../types/agent.js";
import {
  SWIGGY_SERVERS,
  getSwiggyToken,
  type SwiggyService,
} from "../integrations/swiggyMcp.js";

export interface SwiggyAgentInput {
  message: string;
  /** "order" (food delivery) or "book_table" (dineout). Defaults to food. */
  action?: string;
}

export interface SwiggyAgentOutput {
  reply?: string;
  needsAuth?: boolean;
  connectUrl?: string;
  service?: SwiggyService;
  error?: string;
}

const MAX_CONTINUATIONS = 5;

let anthropicClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic();
  return anthropicClient;
}

export const swiggyAgent: Agent<SwiggyAgentInput, SwiggyAgentOutput> = {
  name: "swiggyAgent",

  async run(input, context) {
    const service: SwiggyService = input.action === "book_table" ? "dineout" : "food";

    if (!context.userId) {
      return {
        needsAuth: true,
        service,
        error: "User must be signed in before linking a Swiggy account.",
      };
    }

    const token = await getSwiggyToken(context.userId, service);
    if (!token) {
      const base = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
      return {
        needsAuth: true,
        service,
        connectUrl: `${base}/integrations/swiggy/connect?userId=${encodeURIComponent(context.userId)}&service=${service}`,
      };
    }

    try {
      const reply = await runSwiggyConversation(input.message, service, token, context);
      return { reply, service };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Swiggy request failed";
      console.error("[swiggyAgent] Error:", message);
      return { service, error: message };
    }
  },
};

// -------------------------------------------------------------------------- //
//                        MCP CONNECTOR CONVERSATION                            //
// -------------------------------------------------------------------------- //

async function runSwiggyConversation(
  userMessage: string,
  service: SwiggyService,
  token: string,
  context: RequestContext
): Promise<string> {
  const client = getClient();
  const serverName = `swiggy-${service}`;

  const history: Anthropic.Beta.BetaMessageParam[] = context.conversationHistory
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

  let messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history,
    { role: "user", content: userMessage },
  ];

  let finalText = "";

  for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
    const response = await client.beta.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      betas: ["mcp-client-2025-11-20"],
      system: buildSwiggySystemPrompt(service, context),
      mcp_servers: [
        {
          type: "url",
          url: SWIGGY_SERVERS[service],
          name: serverName,
          authorization_token: token,
        },
      ],
      tools: [{ type: "mcp_toolset", mcp_server_name: serverName }],
      messages,
    });

    finalText = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    // Server-side MCP tool loop hit its iteration limit — resume where it left off
    if (response.stop_reason === "pause_turn") {
      messages = [...messages, { role: "assistant", content: response.content }];
      continue;
    }

    if (response.stop_reason === "refusal") {
      return "I couldn't complete that request through Swiggy. Could you rephrase what you'd like to order or book?";
    }

    break;
  }

  return finalText || "I checked Swiggy but didn't get a usable response — want me to try again?";
}

function buildSwiggySystemPrompt(service: SwiggyService, context: RequestContext): string {
  const city = context.location?.city;
  const coords =
    context.location && (context.location.lat || context.location.lng)
      ? `Lat/Lng: ${context.location.lat}, ${context.location.lng}`
      : "";

  const serviceLine =
    service === "food"
      ? "You are handling a food-delivery request via Swiggy Food. You can search restaurants, browse menus, manage the cart, and place orders using the connected Swiggy tools."
      : "You are handling a restaurant table reservation via Swiggy Dineout. You can search restaurants and book tables using the connected Swiggy tools.";

  return `You are Hita's food concierge, acting on behalf of a traveler through their linked Swiggy account.

${serviceLine}

Context:
${city ? `- User's city: ${city}` : "- User's city: unknown — ask if needed"}
${coords ? `- ${coords}` : ""}

Rules:
1. Use the Swiggy tools to take real action — search, add to cart, book. Don't just describe what you could do.
2. BEFORE placing an order or confirming a booking (anything that costs money), state the exact items/restaurant, total price, and delivery address or reservation time, and ask the user to confirm — unless the user has already explicitly confirmed those details in this conversation.
3. Use the user's saved Swiggy addresses when available; ask which one to use if there are several.
4. If a tool fails or an item is unavailable, say so plainly and offer the closest alternative.
5. Report prices in ₹. Be concise and concrete: restaurant names, dish names, prices, ETAs.`;
}
