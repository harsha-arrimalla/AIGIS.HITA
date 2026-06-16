"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";

function useGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HeroSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const greeting = useGreeting();
  const userName = user?.email?.split("@")[0] ?? null;

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

  const send = useCallback(() => {
    const q = value.trim();
    if (!q) return;
    sessionStorage.setItem("hita-initial-message", q);
    router.push("/chat");
  }, [value, router]);

  return (
    <section aria-labelledby="hero-heading" className="mx-auto max-w-[1200px] px-6 pt-12 pb-10 text-center sm:pt-16 sm:pb-12">
      {userName ? (
        <>
          <h1 id="hero-heading" className="animate-fade-up font-[family-name:var(--font-display)] text-[42px] font-medium leading-[1.08] tracking-tight text-ink sm:text-[56px]">
            {greeting}, {userName}
          </h1>
          <p className="animate-fade-up mt-3 text-[15px] text-text-secondary" style={{ animationDelay: "40ms" }}>
            Hita helped 12,847 travelers this week
          </p>
        </>
      ) : (
        <>
          <h1 id="hero-heading" className="animate-fade-up font-[family-name:var(--font-display)] text-[42px] font-medium leading-[1.08] tracking-tight text-ink sm:text-[56px]">
            Your AI guardian for<br className="hidden sm:block" /> unfamiliar places
          </h1>
          <p className="animate-fade-up mx-auto mt-4 max-w-[520px] text-[17px] leading-relaxed text-text-secondary" style={{ animationDelay: "40ms" }}>
            Hita walks with you through unfamiliar cities — 24/7 safety, fair fares, and someone who listens.
          </p>
        </>
      )}

      {/* Search */}
      <div className="animate-fade-up mx-auto mt-8 max-w-[600px]" style={{ animationDelay: "80ms" }}>
        <div
          className={`flex items-center gap-2 rounded-full border bg-canvas px-5 transition-shadow duration-200 ${
            focused
              ? "border-ink shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              : "border-border-soft shadow-[0_2px_6px_rgba(0,0,0,0.04)]"
          }`}
        >
          <Search className="h-4 w-4 shrink-0 text-ink" strokeWidth={2.5} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label="Ask Hita about places, things to do, or travel help"
            placeholder="Places to go, things to do, hotels..."
            className="h-12 flex-1 bg-transparent text-[15px] text-ink placeholder:text-tertiary focus:outline-none focus-visible:outline-none sm:h-[52px]"
          />
          <button
            onClick={send}
            disabled={!value.trim()}
            className="shrink-0 rounded-full bg-ink px-5 py-2 text-[13px] font-semibold text-on-dark transition-colors hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Search
          </button>
        </div>
        {!userName && (
          <p className="animate-fade-up mt-3 text-[13px] text-tertiary" style={{ animationDelay: "160ms" }}>
            Free to try. No app download. Just type or speak.
          </p>
        )}
      </div>
    </section>
  );
}
