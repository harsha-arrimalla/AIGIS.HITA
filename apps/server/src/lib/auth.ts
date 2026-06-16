/**
 * Auth Middleware — Supabase JWT Verification
 *
 * Verifies the JWT from the Authorization header against Supabase.
 * Respects SKIP_AUTH=true for local development.
 *
 * Usage: register as a Fastify preHandler hook on protected routes.
 */

import { FastifyRequest, FastifyReply } from "fastify";

interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  exp: number;
  iat: number;
}

// Dev user returned when SKIP_AUTH=true
const DEV_USER: AuthenticatedUser = {
  id: "dev-user-001",
  email: "dev@hita.in",
};

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Fastify preHandler hook for JWT authentication.
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip auth in development if flag is set — NEVER in production
  if (process.env.SKIP_AUTH === "true" && process.env.NODE_ENV !== "production") {
    (request as unknown as Record<string, unknown>).user = DEV_USER;
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.code(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Missing or invalid Authorization header. Expected: Bearer <token>",
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const user = await verifySupabaseToken(token);
    (request as unknown as Record<string, unknown>).user = user;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token verification failed";
    request.log.warn({ err: message }, "Auth failed");
    return reply.code(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message,
    });
  }
}

/**
 * Verify a Supabase JWT token by calling the Supabase auth API.
 */
async function verifySupabaseToken(token: string): Promise<AuthenticatedUser> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: serviceRoleKey,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid or expired token");
    }
    throw new Error(`Supabase auth error: ${response.status}`);
  }

  const data = await response.json() as Record<string, unknown>;

  return {
    id: data.id as string,
    email: data.email as string | undefined,
  };
}

/**
 * Helper to extract the authenticated user from a request.
 */
export function getUser(request: FastifyRequest): AuthenticatedUser | null {
  return (request as unknown as Record<string, AuthenticatedUser | null>).user || null;
}
