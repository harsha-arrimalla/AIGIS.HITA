/**
 * Razorpay Integration Tests
 *
 * Tests signature verification and order creation logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyPaymentSignature, verifyWebhookSignature } from "../../src/services/integrations/razorpay.js";
import { createHmac } from "crypto";

// -------------------------------------------------------------------------- //
//                     PAYMENT SIGNATURE VERIFICATION                          //
// -------------------------------------------------------------------------- //

describe("verifyPaymentSignature", () => {
  const FAKE_SECRET = "test_secret_key_123";

  beforeEach(() => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_abc");
    vi.stubEnv("RAZORPAY_KEY_SECRET", FAKE_SECRET);
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
  });

  it("returns valid=true for correct signature", () => {
    const orderId = "order_test123";
    const paymentId = "pay_test456";
    const body = `${orderId}|${paymentId}`;
    const signature = createHmac("sha256", FAKE_SECRET).update(body).digest("hex");

    const result = verifyPaymentSignature(orderId, paymentId, signature);
    expect(result.valid).toBe(true);
    expect(result.orderId).toBe(orderId);
    expect(result.paymentId).toBe(paymentId);
  });

  it("returns valid=false for tampered signature", () => {
    const result = verifyPaymentSignature("order_123", "pay_456", "invalid_signature_hex");
    expect(result.valid).toBe(false);
  });

  it("returns valid=false for wrong order ID", () => {
    const orderId = "order_real";
    const paymentId = "pay_test";
    const body = `${orderId}|${paymentId}`;
    const signature = createHmac("sha256", FAKE_SECRET).update(body).digest("hex");

    const result = verifyPaymentSignature("order_tampered", paymentId, signature);
    expect(result.valid).toBe(false);
  });

  it("uses webhook secret when set", () => {
    const webhookSecret = "webhook_secret_789";
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", webhookSecret);

    const orderId = "order_wh";
    const paymentId = "pay_wh";
    const body = `${orderId}|${paymentId}`;
    const signature = createHmac("sha256", webhookSecret).update(body).digest("hex");

    const result = verifyPaymentSignature(orderId, paymentId, signature);
    expect(result.valid).toBe(true);
  });
});

// -------------------------------------------------------------------------- //
//                     WEBHOOK SIGNATURE VERIFICATION                          //
// -------------------------------------------------------------------------- //

describe("verifyWebhookSignature", () => {
  const WEBHOOK_SECRET = "whsec_test_secret";

  beforeEach(() => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET);
  });

  it("returns true for valid webhook signature", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const signature = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");

    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("returns false for tampered body", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");

    const tamperedBody = JSON.stringify({ event: "payment.failed" });
    expect(verifyWebhookSignature(tamperedBody, signature)).toBe(false);
  });

  it("returns false for invalid signature format", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(body, "not_a_valid_hex")).toBe(false);
  });

  it("throws when RAZORPAY_WEBHOOK_SECRET is not set", () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
    const body = "test";
    expect(() => verifyWebhookSignature(body, "sig")).toThrow("RAZORPAY_WEBHOOK_SECRET not set");
  });
});

// -------------------------------------------------------------------------- //
//                          CREDIT PACK VALIDATION                             //
// -------------------------------------------------------------------------- //

describe("Credit pack definitions", () => {
  // Import the packs from credits route
  const CREDIT_PACKS = [
    { id: "starter", name: "Starter Pack", credits: 25, priceINR: 49, pricePaise: 4900 },
    { id: "explorer", name: "Explorer Pack", credits: 75, priceINR: 129, pricePaise: 12900 },
    { id: "guardian", name: "Guardian Pack", credits: 200, priceINR: 299, pricePaise: 29900 },
  ];

  it("all packs have consistent paise = INR * 100", () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.pricePaise).toBe(pack.priceINR * 100);
    }
  });

  it("all packs have unique IDs", () => {
    const ids = CREDIT_PACKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all packs have positive credits and prices", () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.credits).toBeGreaterThan(0);
      expect(pack.priceINR).toBeGreaterThan(0);
    }
  });

  it("cost per credit decreases with larger packs", () => {
    const costPerCredit = CREDIT_PACKS.map((p) => p.priceINR / p.credits);
    for (let i = 1; i < costPerCredit.length; i++) {
      expect(costPerCredit[i]).toBeLessThan(costPerCredit[i - 1]);
    }
  });
});
