/**
 * Upstash Redis client wrapper.
 * Used for: session cache, rate limiting, agent response cache.
 *
 * Gracefully degrades if Redis is not configured — logs a warning
 * and returns null/defaults instead of crashing.
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[redis] UPSTASH_REDIS_REST_URL or TOKEN not set — running without cache");
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const value = await client.get<T>(key);
    return value;
  } catch (err) {
    console.error("[redis] cache get error:", err);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.error("[redis] cache set error:", err);
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch (err) {
    console.error("[redis] cache del error:", err);
  }
}

export { getRedis };
