/**
 * Rate Limiter — Per-user request limiting via Redis
 *
 * Sliding window rate limiter. Gracefully degrades (allows all requests)
 * if Redis is not available.
 *
 * Default: 30 requests per minute per user.
 */

import { cacheGet, cacheSet } from "./redis.js";

export interface RateLimitConfig {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,   // 1 minute
  maxRequests: 30,     // 30 requests per minute
};

/**
 * Check if a request should be allowed.
 * Returns { allowed, remaining, resetAt }.
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const key = `ratelimit:${userId}`;
  const now = Date.now();

  try {
    // Get current window data
    const data = await cacheGet<{ count: number; windowStart: number }>(key);

    if (!data) {
      // First request — start a new window
      await cacheSet(
        key,
        { count: 1, windowStart: now },
        Math.ceil(config.windowMs / 1000)
      );
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now + config.windowMs),
      };
    }

    const { count, windowStart } = data;
    const windowEnd = windowStart + config.windowMs;

    // Check if we're still in the same window
    if (now < windowEnd) {
      if (count >= config.maxRequests) {
        // Rate limited
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(windowEnd),
          retryAfterMs: windowEnd - now,
        };
      }

      // Increment counter
      await cacheSet(
        key,
        { count: count + 1, windowStart },
        Math.ceil((windowEnd - now) / 1000)
      );
      return {
        allowed: true,
        remaining: config.maxRequests - count - 1,
        resetAt: new Date(windowEnd),
      };
    }

    // Window expired — start a new one
    await cacheSet(
      key,
      { count: 1, windowStart: now },
      Math.ceil(config.windowMs / 1000)
    );
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now + config.windowMs),
    };
  } catch (err) {
    // Redis unavailable — allow the request (graceful degradation)
    console.warn("[rateLimit] Redis unavailable, allowing request:", err);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now + config.windowMs),
    };
  }
}

/**
 * Fastify preHandler hook for rate limiting.
 */
export async function rateLimitMiddleware(
  request: import("fastify").FastifyRequest,
  reply: import("fastify").FastifyReply
): Promise<void> {
  // Extract user ID from auth or session
  const user = (request as unknown as Record<string, { id?: string }>).user;
  const userId = user?.id || request.ip;

  const result = await checkRateLimit(userId);

  // Set rate limit headers
  reply.header("X-RateLimit-Remaining", result.remaining.toString());
  reply.header("X-RateLimit-Reset", result.resetAt.toISOString());

  if (!result.allowed) {
    return reply.code(429).send({
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again in ${Math.ceil((result.retryAfterMs || 0) / 1000)} seconds.`,
      retryAfterMs: result.retryAfterMs,
    });
  }
}
