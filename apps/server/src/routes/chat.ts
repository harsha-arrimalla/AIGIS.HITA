/**
 * Chat Route — POST /chat
 *
 * The main conversation endpoint. Protected by auth + rate limiting.
 * Deducts 1 credit per message.
 */

import { FastifyInstance } from "fastify";
import { orchestrate } from "../services/orchestrator.js";
import type { ChatRequest, ChatResponse } from "../types/chat.js";
import { authMiddleware, getUser } from "../lib/auth.js";
import { rateLimitMiddleware } from "../lib/rateLimit.js";
import { getBalance, deductCredit } from "./credits.js";

// JSON Schema for Fastify validation
const chatRequestSchema = {
  type: "object" as const,
  required: ["message", "sessionId"],
  properties: {
    message: { type: "string" as const, minLength: 1, maxLength: 5000 },
    sessionId: { type: "string" as const, minLength: 1 },
    userId: { type: "string" as const },
    location: {
      type: "object" as const,
      properties: {
        lat: { type: "number" as const },
        lng: { type: "number" as const },
      },
    },
  },
};

const chatResponseSchema = {
  type: "object" as const,
  properties: {
    reply: { type: "string" as const },
    uiAction: { type: "object" as const, additionalProperties: true },
    suggestions: { type: "array" as const, items: { type: "string" as const } },
    creditsUsed: { type: "number" as const },
    creditsRemaining: { type: "number" as const },
    agentsUsed: { type: "array" as const, items: { type: "string" as const } },
    debug: {
      type: "object" as const,
      additionalProperties: true,
      properties: {
        intent: { type: "string" as const },
        confidence: { type: "number" as const },
        entities: { type: "object" as const, additionalProperties: true },
        agentTimings: { type: "object" as const, additionalProperties: true },
        totalLatencyMs: { type: "number" as const },
      },
    },
  },
};

export async function chatRoute(server: FastifyInstance) {
  server.post<{
    Body: ChatRequest;
    Reply: ChatResponse;
  }>(
    "/chat",
    {
      preHandler: [authMiddleware, rateLimitMiddleware],
      schema: {
        body: chatRequestSchema,
        response: {
          200: chatResponseSchema,
        },
      },
    },
    async (request, reply) => {
      // Authenticated user ID takes precedence — never trust body userId
      const user = getUser(request);
      const userId = user?.id || request.body.userId || "anonymous";
      const { message, sessionId } = request.body;

      // Check credits
      const balance = await getBalance(userId);
      if (balance <= 0) {
        return reply.code(402).send({
          reply: "You've used all your credits. Purchase more to continue chatting with Hita.",
          suggestions: ["Buy credits"],
          creditsUsed: 0,
          creditsRemaining: 0,
          agentsUsed: [],
        } as ChatResponse);
      }

      request.log.info({ sessionId, userId, credits: balance }, `Chat: "${message.slice(0, 80)}"`);

      try {
        const response = await orchestrate({ message, sessionId, userId });

        // Deduct 1 credit — check it succeeded
        const deducted = await deductCredit(userId);
        if (!deducted) {
          request.log.warn({ userId }, "Credit deduction failed after response");
        }
        const remaining = await getBalance(userId);

        request.log.info(
          {
            sessionId,
            userId,
            intent: response.debug?.intent,
            agents: response.agentsUsed,
            latency: response.debug?.totalLatencyMs,
            creditsRemaining: remaining,
          },
          "Chat completed"
        );

        return {
          ...response,
          creditsUsed: 1,
          creditsRemaining: remaining,
        };
      } catch (err) {
        request.log.error(err, "Chat orchestration failed");
        reply.code(500).send({
          reply: "I'm sorry, something went wrong on my end. Please try again in a moment.",
          suggestions: ["Try again"],
          agentsUsed: [],
        } as ChatResponse);
      }
    }
  );
}
