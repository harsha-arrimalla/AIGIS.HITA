/**
 * Integrations Routes — Swiggy account linking (OAuth 2.1 + PKCE)
 *
 * GET    /integrations/swiggy/connect?userId=&service=food|dineout → redirect to Swiggy
 * GET    /integrations/swiggy/callback?code=&state=                → completes linking
 * GET    /integrations/swiggy/status?userId=                       → { food, dineout }
 * DELETE /integrations/swiggy?userId=                              → unlink both
 */

import { FastifyInstance } from "fastify";
import {
  beginSwiggyAuth,
  completeSwiggyAuth,
  getSwiggyStatus,
  disconnectSwiggy,
  type SwiggyService,
} from "../services/integrations/swiggyMcp.js";

function publicBaseUrl(): string {
  return process.env.PUBLIC_URL || `http://localhost:${Number(process.env.PORT) || 3000}`;
}

export async function integrationsRoute(server: FastifyInstance) {
  server.get<{ Querystring: { userId: string; service?: string } }>(
    "/integrations/swiggy/connect",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
            service: { type: "string", enum: ["food", "dineout"] },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.query;
      const service = (request.query.service || "food") as SwiggyService;
      try {
        const redirectUri = `${publicBaseUrl()}/integrations/swiggy/callback`;
        const authorizeUrl = await beginSwiggyAuth(userId, service, redirectUri);
        return reply.redirect(authorizeUrl);
      } catch (err) {
        request.log.error(err, "Swiggy connect failed");
        const message = err instanceof Error ? err.message : "Failed to start Swiggy linking";
        return reply.code(502).send({ error: message });
      }
    }
  );

  server.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    "/integrations/swiggy/callback",
    async (request, reply) => {
      const { code, state, error } = request.query;

      if (error || !code || !state) {
        return reply
          .code(400)
          .type("text/html")
          .send(resultPage(false, error || "Missing authorization code."));
      }

      try {
        const { service } = await completeSwiggyAuth(state, code);
        return reply
          .type("text/html")
          .send(resultPage(true, `Swiggy ${service === "food" ? "Food" : "Dineout"} is now connected.`));
      } catch (err) {
        request.log.error(err, "Swiggy callback failed");
        return reply.code(400).type("text/html").send(resultPage(false, "Linking failed — please try again."));
      }
    }
  );

  server.get<{ Querystring: { userId: string } }>(
    "/integrations/swiggy/status",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["userId"],
          properties: { userId: { type: "string" } },
        },
      },
    },
    async (request) => {
      return getSwiggyStatus(request.query.userId);
    }
  );

  server.delete<{ Querystring: { userId: string } }>(
    "/integrations/swiggy",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["userId"],
          properties: { userId: { type: "string" } },
        },
      },
    },
    async (request) => {
      await disconnectSwiggy(request.query.userId);
      return { disconnected: true };
    }
  );
}

function resultPage(ok: boolean, message: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hita — Swiggy</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#faf9f7;color:#1a1a1a}main{text-align:center;padding:2rem}h1{font-size:2.5rem;margin:0 0 .5rem}p{color:#555}</style>
</head><body><main>
<h1>${ok ? "✅" : "⚠️"}</h1>
<p><strong>${message}</strong></p>
<p>You can close this tab and return to Hita.</p>
</main></body></html>`;
}
