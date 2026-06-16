import { FastifyInstance } from "fastify";
import { cacheGet } from "../lib/redis.js";

export async function healthRoute(server: FastifyInstance) {
  // Shallow health — for load balancer liveness probe
  server.get("/health", async () => {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    };
  });

  // Deep health — checks dependencies, for readiness probe
  server.get("/health/ready", async (_request, reply) => {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    // Check Redis
    const redisStart = Date.now();
    try {
      await cacheGet("health:ping");
      checks.redis = { status: "ok", latencyMs: Date.now() - redisStart };
    } catch (err) {
      checks.redis = {
        status: "degraded",
        latencyMs: Date.now() - redisStart,
        error: err instanceof Error ? err.message : "Unknown",
      };
    }

    // Check Supabase
    const sbStart = Date.now();
    try {
      const { getSupabase } = await import("../lib/supabase.js");
      const sb = getSupabase();
      const { error } = await sb.from("credits").select("id").limit(1);
      if (error) throw new Error(error.message);
      checks.supabase = { status: "ok", latencyMs: Date.now() - sbStart };
    } catch (err) {
      checks.supabase = {
        status: "degraded",
        latencyMs: Date.now() - sbStart,
        error: err instanceof Error ? err.message : "Unknown",
      };
    }

    // Check Gemini API key configured
    checks.gemini = {
      status: process.env.GEMINI_API_KEY ? "ok" : "missing",
    };

    const allOk = Object.values(checks).every((c) => c.status === "ok");

    return reply.code(allOk ? 200 : 503).send({
      status: allOk ? "ready" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      checks,
    });
  });
}
