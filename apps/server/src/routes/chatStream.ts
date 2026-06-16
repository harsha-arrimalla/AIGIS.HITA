/**
 * Chat Stream Route — POST /chat/stream
 *
 * SSE endpoint. Same auth + credits as /chat, but streams the response.
 *
 * Events:
 *   data: {"type":"status","data":"Understanding your message..."}
 *   data: {"type":"token","data":"Hello "}
 *   data: {"type":"token","data":"there! "}
 *   data: {"type":"done","data":{"suggestions":[...],"agentsUsed":[...],...}}
 */

import { FastifyInstance } from "fastify";
import { orchestrateStream } from "../services/orchestratorStream.js";
import type { ChatRequest } from "../types/chat.js";
import { authMiddleware, getUser } from "../lib/auth.js";
import { rateLimitMiddleware } from "../lib/rateLimit.js";
import { getBalance, deductCredit } from "./credits.js";

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

export async function chatStreamRoute(server: FastifyInstance) {
  server.post<{ Body: ChatRequest }>(
    "/chat/stream",
    {
      preHandler: [authMiddleware, rateLimitMiddleware],
      schema: { body: chatRequestSchema },
    },
    async (request, reply) => {
      const user = getUser(request);
      const userId = user?.id || request.body.userId || "anonymous";
      const { message, sessionId } = request.body;

      // Check credits
      const balance = await getBalance(userId);
      if (balance <= 0) {
        reply.raw.writeHead(402, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        reply.raw.write(
          `data: ${JSON.stringify({ type: "error", data: "No credits remaining. Purchase more to continue." })}\n\n`
        );
        reply.raw.end();
        return;
      }

      request.log.info({ sessionId, userId, credits: balance }, `Stream: "${message.slice(0, 80)}"`);

      // Set SSE headers
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": request.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true",
      });

      try {
        for await (const event of orchestrateStream({ message, sessionId, userId, location: request.body.location })) {
          reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        }

        // Deduct credit after successful stream
        const deducted = await deductCredit(userId);
        if (!deducted) {
          request.log.warn({ userId }, "Credit deduction failed after stream");
        }
        const remaining = await getBalance(userId);

        // Send final credits event
        reply.raw.write(
          `data: ${JSON.stringify({ type: "credits", data: { creditsUsed: 1, creditsRemaining: remaining } })}\n\n`
        );
      } catch (err) {
        request.log.error(err, "Stream orchestration failed");
        reply.raw.write(
          `data: ${JSON.stringify({ type: "error", data: "Something went wrong. Please try again." })}\n\n`
        );
      } finally {
        reply.raw.end();
      }
    }
  );
}
