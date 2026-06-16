/**
 * Auth Routes
 *
 * Simple auth-related endpoints. The heavy lifting is done by Supabase
 * on the client side — we just verify tokens server-side.
 */

import { FastifyInstance } from "fastify";
import { authMiddleware, getUser } from "../lib/auth.js";

export async function authRoute(server: FastifyInstance) {
  /**
   * GET /auth/me — Returns the authenticated user's info.
   * Used by clients to verify their token is valid.
   */
  server.get(
    "/auth/me",
    { preHandler: authMiddleware },
    async (request) => {
      const user = getUser(request);
      return {
        authenticated: true,
        user,
      };
    }
  );
}
