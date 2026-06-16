"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import Link from "next/link";
import { ArrowLeft, Coins, TrendingUp, MessageSquare, Zap, Check, Sparkles, Shield } from "lucide-react";
import { useAPI } from "@/lib/api-provider";
import { useAuth } from "@/lib/auth-provider";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceINR: number;
}

interface Transaction {
  action: string;
  credits_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

const PACK_FEATURES: Record<string, string[]> = {
  starter: ["25 AI conversations", "All 7 agents", "Basic support"],
  explorer: ["75 AI conversations", "All 7 agents", "Priority support", "Save ₹18"],
  guardian: ["200 AI conversations", "All 7 agents", "Priority support", "Save ₹99", "Best value"],
};

export default function CreditsPage() {
  const api = useAPI();
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const userId = user?.id || "dev-user";

  // Fetch credits + packs on mount
  useEffect(() => {
    api
      .getCredits(userId)
      .then((data) => {
        setBalance(data.balance);
        setPacks(data.packs);
        setTransactions(data.transactions);
      })
      .catch(() => setBalance(null));
  }, [api, userId]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handlePurchase = useCallback(
    async (pack: CreditPack) => {
      if (!razorpayLoaded) {
        showToast("Payment system is loading. Please try again in a moment.", "error");
        return;
      }
      setPurchasing(pack.id);

      try {
        const order = await api.purchaseCredits(userId, pack.id);

        const razorpay = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: order.amount * 100,
          currency: order.currency,
          name: "Hita",
          description: `${pack.name} — ${pack.credits} credits`,
          order_id: order.razorpayOrderId,
          handler: async (response: RazorpayResponse) => {
            try {
              const result = await api.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (result.success) {
                setBalance(result.balance);
                showToast(`${result.creditsAdded || pack.credits} credits added!`, "success");
                // Refresh transactions
                api.getCredits(userId).then((data) => setTransactions(data.transactions)).catch(() => {});
              }
            } catch {
              showToast("Payment received — credits will be added shortly.", "success");
            }
            setPurchasing(null);
          },
          prefill: { email: user?.email },
          theme: { color: "#222222" },
          modal: {
            ondismiss: () => setPurchasing(null),
          },
        });

        razorpay.open();
      } catch {
        showToast("Could not start payment. Please try again.", "error");
        setPurchasing(null);
      }
    },
    [api, userId, user?.email, razorpayLoaded, showToast]
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-canvas)", fontFamily: "var(--font-body)" }}
    >
      {/* Razorpay checkout script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        strategy="afterInteractive"
      />

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 animate-[slide-down_0.3s_ease-out]"
          style={{
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-ink)",
            color: "var(--color-on-dark)",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center"
        style={{
          height: 56,
          padding: "0 16px",
          backgroundColor: "var(--color-canvas)",
          borderBottom: "1px solid var(--color-border-hairline)",
          gap: 12,
        }}
      >
        <Link
          href="/chat"
          className="flex items-center justify-center transition-colors"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-full)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          aria-label="Back to chat"
        >
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--color-ink)" }} strokeWidth={1.5} />
        </Link>
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>Credits</span>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 64px" }}>
        {/* Balance card */}
        <div
          style={{
            padding: "28px 24px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border-hairline)",
            backgroundColor: "var(--color-paper)",
            boxShadow: "var(--shadow-card)",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-coral-light)",
              margin: "0 auto 16px",
            }}
          >
            <Coins style={{ width: 24, height: 24, color: "var(--color-ink)" }} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>
            Available credits
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 48,
              fontWeight: 600,
              color: "var(--color-ink)",
              lineHeight: 1.1,
            }}
          >
            {balance ?? "—"}
          </p>
        </div>

        {/* Credit packs */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 500,
            color: "var(--color-ink)",
            marginBottom: 16,
          }}
        >
          Buy credits
        </h2>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 32 }}
        >
          {packs.map((pack) => {
            const isPopular = pack.id === "guardian";
            const features = PACK_FEATURES[pack.id] || [];
            return (
              <div
                key={pack.id}
                style={{
                  padding: "24px 20px",
                  borderRadius: "var(--radius-lg)",
                  border: isPopular ? "2px solid var(--color-ink)" : "1px solid var(--color-border-hairline)",
                  backgroundColor: "var(--color-paper)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {isPopular && (
                  <span
                    style={{
                      position: "absolute",
                      top: -11,
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "2px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-on-dark)",
                      backgroundColor: "var(--color-ink)",
                      borderRadius: "var(--radius-full)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Most popular
                  </span>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {pack.id === "starter" && <Sparkles style={{ width: 16, height: 16, color: "var(--color-ink)" }} />}
                  {pack.id === "explorer" && <TrendingUp style={{ width: 16, height: 16, color: "var(--color-ink)" }} />}
                  {pack.id === "guardian" && <Shield style={{ width: 16, height: 16, color: "var(--color-ink)" }} />}
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)" }}>{pack.name}</span>
                </div>

                <p style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--color-ink)", marginBottom: 4 }}>
                  ₹{pack.priceINR}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>
                  {pack.credits} credits · ₹{(pack.priceINR / pack.credits).toFixed(1)}/credit
                </p>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", flex: 1 }}>
                  {features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                      <Check style={{ width: 14, height: 14, color: "var(--color-ink)", flexShrink: 0 }} strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(pack)}
                  disabled={!!purchasing || !razorpayLoaded}
                  className="transition-all duration-150 active:scale-[0.98]"
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    color: isPopular ? "var(--color-on-dark)" : "var(--color-ink)",
                    backgroundColor: isPopular ? "var(--color-ink)" : "transparent",
                    border: isPopular ? "none" : "1.5px solid var(--color-border-medium)",
                    borderRadius: "var(--radius-md)",
                    cursor: purchasing ? "wait" : "pointer",
                    opacity: purchasing && purchasing !== pack.id ? 0.5 : 1,
                  }}
                >
                  {purchasing === pack.id ? "Processing..." : `Buy ${pack.credits} credits`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[
            { icon: Zap, label: "Credits used today", value: transactions.filter((t) => {
              const today = new Date().toISOString().split("T")[0];
              return t.created_at?.startsWith(today) && t.credits_used > 0;
            }).reduce((sum, t) => sum + t.credits_used, 0).toString() || "0" },
            { icon: MessageSquare, label: "Total conversations", value: transactions.filter((t) => t.action === "chat_message").length.toString() },
            { icon: TrendingUp, label: "Purchases", value: transactions.filter((t) => t.action === "purchase").length.toString() },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              style={{
                padding: "20px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-hairline)",
                backgroundColor: "var(--color-paper)",
                textAlign: "center",
              }}
            >
              <Icon
                style={{ width: 18, height: 18, color: "var(--color-text-secondary)", margin: "0 auto 8px" }}
                strokeWidth={1.5}
              />
              <p style={{ fontSize: 24, fontWeight: 600, color: "var(--color-ink)", lineHeight: 1.2 }}>{value}</p>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Transaction history */}
        {transactions.length > 0 && (
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 500,
                color: "var(--color-ink)",
                marginBottom: 16,
              }}
            >
              Transaction history
            </h2>
            <div
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-hairline)",
                overflow: "hidden",
              }}
            >
              {transactions.slice(0, 20).map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between"
                  style={{
                    padding: "14px 16px",
                    borderBottom: i < Math.min(transactions.length, 20) - 1 ? "1px solid var(--color-border-hairline)" : "none",
                    backgroundColor: "var(--color-paper)",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--color-ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {tx.action === "purchase"
                        ? (tx.metadata?.description as string) || "Credit purchase"
                        : tx.action === "chat_message"
                          ? "Chat message"
                          : tx.action}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                      {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: tx.credits_used < 0 ? "var(--color-ink)" : "var(--color-ink)",
                      whiteSpace: "nowrap",
                      marginLeft: 16,
                    }}
                  >
                    {tx.credits_used > 0 ? `−${tx.credits_used}` : `+${Math.abs(tx.credits_used)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for no transactions */}
        {transactions.length === 0 && balance !== null && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              No transactions yet. Start chatting to use credits!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
