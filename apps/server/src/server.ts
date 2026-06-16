import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rawBody from "fastify-raw-body";
import { healthRoute } from "./routes/health.js";
import { chatRoute } from "./routes/chat.js";
import { chatStreamRoute } from "./routes/chatStream.js";
import { authRoute } from "./routes/auth.js";
import { creditsRoute } from "./routes/credits.js";
import { placesRoute } from "./routes/places.js";
import { conversationsRoute } from "./routes/conversations.js";

// -------------------------------------------------------------------------- //
//                          ALLOWED ORIGINS                                     //
// -------------------------------------------------------------------------- //

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
  bodyLimit: 1_048_576, // 1MB
  requestTimeout: 60_000, // 60s — agents can be slow
});

async function start() {
  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: false, // API-only, no HTML served
  });

  // Raw body for webhook signature verification
  await server.register(rawBody, {
    field: "rawBody",
    global: false,
    runFirst: true,
    encoding: "utf8",
  });

  // CORS
  await server.register(cors, {
    origin: process.env.NODE_ENV === "production" ? ALLOWED_ORIGINS : true,
    credentials: true,
  });

  // Request ID + user context in logs
  server.addHook("onRequest", async (request) => {
    request.log = request.log.child({
      requestId: request.id,
    });
  });

  // Routes
  await server.register(healthRoute);
  await server.register(chatRoute);
  await server.register(chatStreamRoute);
  await server.register(authRoute);
  await server.register(creditsRoute);
  await server.register(placesRoute);
  await server.register(conversationsRoute);

  // Start
  const port = Number(process.env.PORT) || 3000;
  const host = "0.0.0.0";

  try {
    await server.listen({ port, host });
    server.log.info(`Hita backend running on http://localhost:${port}`);
    server.log.info(`Auth: ${process.env.SKIP_AUTH === "true" ? "SKIPPED (dev mode)" : "enabled"}`);
    server.log.info(`CORS: ${process.env.NODE_ENV === "production" ? ALLOWED_ORIGINS.join(", ") : "all origins (dev)"}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// -------------------------------------------------------------------------- //
//                          GRACEFUL SHUTDOWN                                   //
// -------------------------------------------------------------------------- //

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  server.log.info(`Received ${signal}, shutting down gracefully...`);

  // Stop accepting new connections, wait for in-flight to drain
  const timeout = setTimeout(() => {
    server.log.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 15_000);

  try {
    await server.close();
    clearTimeout(timeout);
    process.exit(0);
  } catch (err) {
    server.log.error(err, "Error during shutdown");
    clearTimeout(timeout);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  server.log.error({ err: reason }, "Unhandled rejection");
});

process.on("uncaughtException", (err) => {
  server.log.fatal({ err }, "Uncaught exception — shutting down");
  shutdown("uncaughtException");
});

start();
