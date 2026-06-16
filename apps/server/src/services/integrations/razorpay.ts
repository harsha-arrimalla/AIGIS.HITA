/**
 * Razorpay Integration
 *
 * Handles order creation and payment verification for credit purchases.
 * Test mode is free — use test keys for development.
 */

import { createHmac, timingSafeEqual } from "crypto";

const BASE_URL = "https://api.razorpay.com/v1";
const FETCH_TIMEOUT_MS = 15_000;

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
}

export interface PaymentVerification {
  valid: boolean;
  orderId: string;
  paymentId: string;
}

function getCredentials(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set");
  return { keyId, keySecret };
}

/**
 * Create a Razorpay order for a credit pack purchase.
 * Amount is in paise (₹99 = 9900 paise).
 */
export async function createOrder(
  amountPaise: number,
  receipt: string,
  notes?: Record<string, string>
): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: notes || {},
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Razorpay order creation failed: ${response.status} ${error}`);
  }

  const data = await response.json() as Record<string, unknown>;

  return {
    id: data.id as string,
    amount: data.amount as number,
    currency: data.currency as string,
    status: data.status as string,
    receipt: data.receipt as string,
  };
}

/**
 * Verify a Razorpay payment signature.
 * This ensures the payment callback is genuinely from Razorpay.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): PaymentVerification {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const { keySecret } = getCredentials();

  const secret = webhookSecret || keySecret;
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = createHmac("sha256", secret).update(body).digest("hex");

  let valid = false;
  try {
    valid = timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch {
    valid = false;
  }

  return {
    valid,
    orderId,
    paymentId,
  };
}

/**
 * Verify a Razorpay webhook signature.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("RAZORPAY_WEBHOOK_SECRET not set");

  const expectedSignature = createHmac("sha256", webhookSecret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch {
    return false; // length mismatch
  }
}
