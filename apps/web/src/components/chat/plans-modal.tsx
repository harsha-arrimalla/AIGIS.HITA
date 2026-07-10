"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Check, X } from "lucide-react";

/**
 * Plans overlay shown in chat:
 *  - mode "welcome": first message from a new user — offer free starter credits + paid packs
 *  - mode "out":     user has 0 credits — paid packs only
 * Packs mirror the server's CREDIT_PACKS (routes/credits.ts).
 */

const PACKS = [
  { id: "starter", name: "Starter", credits: 25, priceINR: 49, tagline: "A weekend trip" },
  { id: "explorer", name: "Explorer", credits: 75, priceINR: 129, tagline: "A full vacation", popular: true },
  { id: "guardian", name: "Guardian", credits: 200, priceINR: 299, tagline: "Always by your side" },
];

interface PlansModalProps {
  mode: "welcome" | "out";
  onStartFree: () => void;
  onClose?: () => void;
}

export function PlansModal({ mode, onStartFree, onClose }: PlansModalProps) {
  const router = useRouter();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plans-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
    >
      <div className="animate-fade-up relative w-full max-w-[520px] rounded-3xl bg-raised p-7 shadow-elevated sm:p-9">
        {mode === "out" && onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-hover hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}

        <p className="inline-flex items-center gap-1.5 rounded-full border border-coral-medium bg-coral-light px-3.5 py-1 text-[12.5px] font-semibold text-coral">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {mode === "welcome" ? "Welcome to Hita" : "You're out of credits"}
        </p>

        <h2 id="plans-title" className="mt-4 font-[family-name:var(--font-display)] text-[26px] font-bold leading-tight text-ink sm:text-[30px]">
          {mode === "welcome" ? (
            <>Pick how you want to <span className="bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">travel</span></>
          ) : (
            <>Keep Hita by your side</>
          )}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
          Every message to Hita uses one credit — safety checks, fare guards, food orders, all of it.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {PACKS.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push("/credits")}
              className={`relative rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-2 ${
                p.popular ? "border-coral bg-coral-light" : "border-border-hairline bg-canvas hover:border-coral"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-3 rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-coral">
                  Popular
                </span>
              )}
              <span className="block text-[13.5px] font-bold text-ink">{p.name}</span>
              <span className="mt-1 block font-[family-name:var(--font-display)] text-[22px] font-bold text-ink">₹{p.priceINR}</span>
              <span className="block text-[12px] font-medium text-text-secondary">{p.credits} messages</span>
              <span className="mt-1.5 block text-[11px] text-tertiary">{p.tagline}</span>
            </button>
          ))}
        </div>

        {mode === "welcome" ? (
          <button
            onClick={onStartFree}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-coral to-[#FF8A5C] py-3.5 text-[15px] font-bold text-on-coral shadow-[0_8px_20px_rgba(255,90,95,0.35)] transition-all hover:shadow-[0_10px_26px_rgba(255,90,95,0.45)] hover:brightness-105 active:scale-[0.99]"
          >
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            Start free — 12 messages on us
          </button>
        ) : (
          <button
            onClick={() => router.push("/credits")}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-coral to-[#FF8A5C] py-3.5 text-[15px] font-bold text-on-coral shadow-[0_8px_20px_rgba(255,90,95,0.35)] transition-all hover:shadow-[0_10px_26px_rgba(255,90,95,0.45)] hover:brightness-105 active:scale-[0.99]"
          >
            View plans & top up
          </button>
        )}

        <p className="mt-3 text-center text-[11.5px] text-tertiary">
          Emergency SOS and safety alerts are always free.
        </p>
      </div>
    </div>
  );
}
