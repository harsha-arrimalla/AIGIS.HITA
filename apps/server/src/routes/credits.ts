/**
 * Credits Routes
 *
 * GET  /credits/:userId    — Get credit balance + recent transactions
 * POST /credits/purchase   — Initiate Razorpay checkout for a credit pack
 * POST /webhooks/razorpay  — Payment confirmation webhook
 */

import { FastifyInstance } from "fastify";
import { authMiddleware, getUser } from "../lib/auth.js";
import { createOrder, verifyPaymentSignature, verifyWebhookSignature } from "../services/integrations/razorpay.js";
import { cacheGet, cacheSet, cacheDel } from "../lib/redis.js";
import { getCredits as getSupabaseCredits, deductCredits as deductSupabaseCredits, addCredits as addSupabaseCredits, getSupabase } from "../lib/supabase.js";

// -------------------------------------------------------------------------- //
//                          CREDIT PACKS                                       //
// -------------------------------------------------------------------------- //

const CREDIT_PACKS = [
  { id: "starter", name: "Starter Pack", credits: 25, priceINR: 49, pricePaise: 4900 },
  { id: "explorer", name: "Explorer Pack", credits: 75, priceINR: 129, pricePaise: 12900 },
  { id: "guardian", name: "Guardian Pack", credits: 200, priceINR: 299, pricePaise: 29900 },
] as const;

// -------------------------------------------------------------------------- //
//                          CREDIT STORE                                       //
// -------------------------------------------------------------------------- //

// In-memory fallback when Supabase is unavailable
const creditBalances = new Map<string, number>();

async function getBalance(userId: string): Promise<number> {
  try {
    return await getSupabaseCredits(userId);
  } catch {
    // Fallback to in-memory
    return creditBalances.get(userId) ?? 999;
  }
}

async function deductCredit(userId: string): Promise<boolean> {
  try {
    const remaining = await deductSupabaseCredits(userId, 1);
    creditBalances.set(userId, remaining);
    return remaining >= 0;
  } catch {
    // Fallback to in-memory
    const current = creditBalances.get(userId) ?? 999;
    if (current <= 0) return false;
    creditBalances.set(userId, current - 1);
    return true;
  }
}

// -------------------------------------------------------------------------- //
//                              ROUTES                                         //
// -------------------------------------------------------------------------- //

export async function creditsRoute(server: FastifyInstance) {
  // GET /credits/:userId — balance + transactions
  server.get<{ Params: { userId: string } }>(
    "/credits/:userId",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { userId } = request.params;
      const user = getUser(request);

      // Users can only check their own balance (or skip in dev)
      if (user && user.id !== userId && process.env.SKIP_AUTH !== "true") {
        return reply.code(403).send({
          statusCode: 403,
          error: "Forbidden",
          message: "You can only view your own credits",
        });
      }

      const balance = await getBalance(userId);

      // Load recent transactions from Supabase
      let transactions: unknown[] = [];
      try {
        const sb = getSupabase();
        const { data } = await sb
          .from("credit_transactions")
          .select("action, credits_used, metadata, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
        transactions = data || [];
      } catch {
        // Supabase unavailable — return empty
      }

      return {
        userId,
        balance,
        transactions,
        packs: CREDIT_PACKS,
      };
    }
  );

  // POST /credits/purchase — initiate Razorpay order
  server.post<{
    Body: { userId: string; packId: string };
  }>(
    "/credits/purchase",
    {
      preHandler: authMiddleware,
      schema: {
        body: {
          type: "object" as const,
          required: ["userId", "packId"],
          properties: {
            userId: { type: "string" as const },
            packId: { type: "string" as const },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId, packId } = request.body;

      const pack = CREDIT_PACKS.find((p) => p.id === packId);
      if (!pack) {
        return reply.code(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: `Invalid pack ID. Available: ${CREDIT_PACKS.map((p) => p.id).join(", ")}`,
        });
      }

      try {
        // Razorpay receipt max 40 chars — use short hash
        const receiptId = `hita_${packId}_${Date.now().toString(36)}`;
        const order = await createOrder(pack.pricePaise, receiptId, {
          userId,
          packId,
          credits: pack.credits.toString(),
        });

        // Store order → pack mapping for webhook processing
        await cacheSet(`order:${order.id}`, { userId, packId, credits: pack.credits }, 86400);

        return {
          orderId: order.id,
          amount: pack.priceINR,
          currency: "INR",
          razorpayOrderId: order.id,
          packName: pack.name,
          credits: pack.credits,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment initiation failed";
        request.log.error({ err: message }, "Razorpay order creation failed");
        return reply.code(500).send({
          statusCode: 500,
          error: "Payment Error",
          message: "Could not initiate payment. Please try again.",
        });
      }
    }
  );

  // POST /webhooks/razorpay — payment confirmation
  server.post(
    "/webhooks/razorpay",
    { config: { rawBody: true } },
    async (request, reply) => {
      const signature = request.headers["x-razorpay-signature"] as string;

      if (!signature) {
        return reply.code(400).send({ error: "Missing signature" });
      }

      try {
        // Use rawBody for accurate signature verification
        const rawBody = (request as unknown as { rawBody?: string }).rawBody;
        if (!rawBody) {
          request.log.error("rawBody not available — fastify-raw-body plugin may not be registered");
          return reply.code(500).send({ error: "Server configuration error" });
        }

        const valid = verifyWebhookSignature(rawBody, signature);
        if (!valid) {
          request.log.warn("Invalid Razorpay webhook signature");
          return reply.code(400).send({ error: "Invalid signature" });
        }

        const payload = typeof request.body === "string"
          ? JSON.parse(request.body) as Record<string, unknown>
          : request.body as Record<string, unknown>;

        const event = payload.event as string;

        if (event === "payment.captured") {
          const paymentEntity = (payload.payload as Record<string, Record<string, unknown>>)?.payment?.entity as Record<string, unknown>;
          const orderId = paymentEntity?.order_id as string;
          const paymentId = paymentEntity?.id as string;

          if (orderId) {
            // Idempotency: check if already processed
            const processed = await cacheGet<boolean>(`payment:${orderId}`);
            if (processed) {
              request.log.info({ orderId }, "Duplicate webhook — already processed");
              return { status: "ok" };
            }

            // Look up the order details
            const orderData = await cacheGet<{ userId: string; packId: string; credits: number }>(`order:${orderId}`);

            if (orderData) {
              await addSupabaseCredits(orderData.userId, orderData.credits, "purchase", `Purchased ${orderData.packId} pack`);

              // Record the Razorpay payment in credit_transactions
              try {
                const sb = getSupabase();
                await sb.from("CreditTransaction").insert({
                  id: crypto.randomUUID(),
                  userId: orderData.userId,
                  amount: orderData.credits,
                  type: "PURCHASE",
                  description: `Purchased ${orderData.packId} pack`,
                  razorpayId: paymentId || null,
                });
              } catch {
                // Already logged in addSupabaseCredits
              }

              // Mark as processed (7 days TTL)
              await cacheSet(`payment:${orderId}`, true, 604800);
              // Clean up order cache
              await cacheDel(`order:${orderId}`);

              request.log.info({ userId: orderData.userId, credits: orderData.credits, paymentId }, "Credits added via Razorpay webhook");
            }
          }
        }

        return { status: "ok" };
      } catch (err) {
        request.log.error(err, "Razorpay webhook processing failed");
        return reply.code(500).send({ error: "Webhook processing failed" });
      }
    }
  );

  // POST /credits/verify — client-side payment verification (Razorpay checkout callback)
  server.post<{
    Body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };
  }>(
    "/credits/verify",
    {
      preHandler: authMiddleware,
      schema: {
        body: {
          type: "object" as const,
          required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
          properties: {
            razorpay_order_id: { type: "string" as const },
            razorpay_payment_id: { type: "string" as const },
            razorpay_signature: { type: "string" as const },
          },
        },
      },
    },
    async (request, reply) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body;

      try {
        const verification = verifyPaymentSignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        );

        if (!verification.valid) {
          return reply.code(400).send({
            statusCode: 400,
            error: "Payment Verification Failed",
            message: "Invalid payment signature. Do not retry — contact support.",
          });
        }

        // Check if already processed by webhook
        const processed = await cacheGet<boolean>(`payment:${razorpay_order_id}`);
        if (processed) {
          // Already credited by webhook — just confirm success
          const user = getUser(request);
          const balance = user ? await getBalance(user.id) : null;
          return { success: true, balance, message: "Payment already processed" };
        }

        // Webhook hasn't fired yet — credit now (with idempotency guard)
        const orderData = await cacheGet<{ userId: string; packId: string; credits: number }>(`order:${razorpay_order_id}`);
        if (!orderData) {
          return reply.code(404).send({
            statusCode: 404,
            error: "Order Not Found",
            message: "Order expired or not found. Contact support with payment ID.",
          });
        }

        await addSupabaseCredits(orderData.userId, orderData.credits, "purchase", `Purchased ${orderData.packId} pack`);

        try {
          const sb = getSupabase();
          await sb.from("CreditTransaction").insert({
            id: crypto.randomUUID(),
            userId: orderData.userId,
            amount: orderData.credits,
            type: "PURCHASE",
            description: `Purchased ${orderData.packId} pack`,
            razorpayId: razorpay_payment_id,
          });
        } catch {
          // Non-critical
        }

        await cacheSet(`payment:${razorpay_order_id}`, true, 604800);
        await cacheDel(`order:${razorpay_order_id}`);

        const newBalance = await getBalance(orderData.userId);
        request.log.info({ userId: orderData.userId, credits: orderData.credits }, "Credits added via client verify");

        return {
          success: true,
          balance: newBalance,
          creditsAdded: orderData.credits,
          message: `${orderData.credits} credits added to your account`,
        };
      } catch (err) {
        request.log.error(err, "Payment verification failed");
        return reply.code(500).send({
          statusCode: 500,
          error: "Verification Error",
          message: "Payment verification failed. Your payment is safe — credits will be added automatically.",
        });
      }
    }
  );

  // GET /credits/packs — public endpoint for credit pack info
  server.get("/credits/packs", async () => {
    return { packs: CREDIT_PACKS };
  });
}

// Export credit helpers for use in chat route
export { getBalance, deductCredit };
