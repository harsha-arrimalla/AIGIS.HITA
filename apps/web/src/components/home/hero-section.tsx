"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, UtensilsCrossed, ShieldCheck, IndianRupee, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";

/* ── Search tabs (TripAdvisor-style) ─────────────────────────── */

const TABS = [
  { id: "all", label: "Search all", icon: Search, placeholder: "Ask Hita anything — places, fares, safety, food..." },
  { id: "todo", label: "Things to do", icon: MapPin, placeholder: "Sunset spots, heritage walks, hidden markets...", prefix: "Things to do: " },
  { id: "food", label: "Restaurants", icon: UtensilsCrossed, placeholder: "Best biryani near me, rooftop dinner for two...", prefix: "Food: " },
  { id: "safety", label: "Safety", icon: ShieldCheck, placeholder: "Is Banjara Hills safe at 11pm?", prefix: "Safety check: " },
  { id: "fare", label: "Fares", icon: IndianRupee, placeholder: "Auto is asking ₹450 to Charminar — fair?", prefix: "Fare check: " },
] as const;

const TRENDING = [
  "Best biryani in Hyderabad",
  "Is ₹500 fair from HYD airport?",
  "Charminar at night — safe?",
  "Plan my Sunday in Jaipur",
];

const POLAROIDS = [
  { src: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=480&fit=crop", label: "Amer Fort, Jaipur", rating: "4.8", pos: "left-[2%] top-24", rot: "-6deg", delay: "0s" },
  { src: "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?w=400&h=480&fit=crop", label: "Charminar, Hyderabad", rating: "4.7", pos: "left-[6%] bottom-10", rot: "4deg", delay: "1.2s" },
  { src: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=480&fit=crop", label: "Pondicherry", rating: "4.6", pos: "right-[2%] top-28", rot: "5deg", delay: "0.6s" },
  { src: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=480&fit=crop", label: "Udaipur", rating: "4.9", pos: "right-[6%] bottom-8", rot: "-4deg", delay: "1.8s" },
];

export function HeroSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const userName = user?.email?.split("@")[0] ?? null;

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sendText = useCallback(
    (text: string) => {
      sessionStorage.setItem("hita-initial-message", text);
      router.push("/chat");
    },
    [router],
  );

  const send = useCallback(() => {
    const q = value.trim();
    if (!q) return;
    const prefix = "prefix" in activeTab ? activeTab.prefix : "";
    sendText(`${prefix ?? ""}${q}`);
  }, [value, activeTab, sendText]);

  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* ambient gradient blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-blob absolute -top-24 left-[12%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,90,95,0.16),transparent_65%)]" />
        <div className="animate-blob absolute -right-20 top-10 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(255,180,0,0.14),transparent_65%)]" style={{ animationDelay: "3s" }} />
        <div className="animate-blob absolute bottom-0 left-[38%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,90,95,0.09),transparent_60%)]" style={{ animationDelay: "7s" }} />
      </div>

      {/* floating polaroids — desktop only */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
        {POLAROIDS.map((p) => (
          <div
            key={p.label}
            className={`animate-float-slow absolute ${p.pos} w-[150px] rounded-2xl bg-raised p-2 pb-3 shadow-[0_18px_44px_rgba(255,90,95,0.18)]`}
            style={{ "--float-rot": p.rot, animationDelay: p.delay } as React.CSSProperties}
          >
            <div className="overflow-hidden rounded-xl">
              <img src={p.src} alt="" className="aspect-[4/5] w-full object-cover" loading="lazy" />
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[10.5px] font-semibold text-ink">{p.label}</span>
              <span className="flex items-center gap-0.5 text-[10.5px] font-bold text-ink">
                <Star className="h-3 w-3 fill-amber text-amber" /> {p.rating}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mx-auto max-w-[840px] px-6 pb-20 pt-16 text-center sm:pt-24">
        <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-coral-medium bg-coral-light px-4 py-1.5 text-[13px] font-semibold text-coral">
          {userName ? `Welcome back, ${userName}` : "Your AI travel guardian · India & beyond"}
        </p>

        <h1
          id="hero-heading"
          className="animate-fade-up mt-6 font-[family-name:var(--font-display)] text-[46px] font-bold leading-[1.04] tracking-tight text-ink sm:text-[72px]"
          style={{ animationDelay: "60ms" }}
        >
          Where to<span className="text-coral">?</span>
          <br />
          <span className="bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">
            Hita&apos;s got you.
          </span>
        </h1>

        <p className="animate-fade-up mx-auto mt-5 max-w-[520px] text-[17px] leading-relaxed text-text-secondary" style={{ animationDelay: "120ms" }}>
          Plans your days, checks your fares, watches your streets, orders your
          dinner — one chat that treats every city like home turf.
        </p>

        {/* ── Tabbed search ── */}
        <div className="animate-fade-up mx-auto mt-10 max-w-[680px]" style={{ animationDelay: "180ms" }}>
          <div role="tablist" aria-label="Search categories" className="flex items-center justify-center gap-1 overflow-x-auto pb-3 sm:gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(t.id);
                    inputRef.current?.focus();
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all sm:px-4 ${
                    active
                      ? "bg-ink text-on-dark shadow-2"
                      : "text-text-secondary hover:bg-tint hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border-2 bg-raised py-2 pl-6 pr-2 transition-all duration-200 ${
              focused ? "border-coral shadow-[0_0_0_4px_rgba(255,90,95,0.14),0_18px_44px_rgba(255,90,95,0.16)]" : "border-transparent shadow-2"
            }`}
          >
            <Search className="h-5 w-5 shrink-0 text-coral" strokeWidth={2.5} aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              aria-label={activeTab.placeholder}
              placeholder={activeTab.placeholder}
              className="h-12 flex-1 bg-transparent text-[15.5px] text-ink placeholder:text-tertiary focus:outline-none"
            />
            <button
              onClick={send}
              disabled={!value.trim()}
              className="h-12 shrink-0 rounded-full bg-gradient-to-r from-coral to-[#FF8A5C] px-7 text-[14.5px] font-bold text-on-coral shadow-[0_8px_20px_rgba(255,90,95,0.35)] transition-all hover:shadow-[0_10px_26px_rgba(255,90,95,0.45)] hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              Ask Hita
            </button>
          </div>

          {/* trending chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[12.5px] font-semibold uppercase tracking-wider text-tertiary">Trending</span>
            {TRENDING.map((t) => (
              <button
                key={t}
                onClick={() => sendText(t)}
                className="rounded-full border border-border-soft bg-raised px-3.5 py-1.5 text-[12.5px] font-medium text-body transition-all hover:border-coral hover:text-coral hover:shadow-1"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
