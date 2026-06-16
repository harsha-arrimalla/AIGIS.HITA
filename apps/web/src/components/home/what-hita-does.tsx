"use client";

import { useScrollReveal } from "@/hooks/use-gsap";

const PILLARS = [
  {
    number: "01",
    headline: "From airport pickup to late-night walks",
    body: "Hita is the friend who's been there before you arrive. Routes, safety, fares — all in one chat.",
    signal: "Used by 5,200 travelers today",
  },
  {
    number: "02",
    headline: "We notice what you can't",
    body: "Real-time safety scores, fare protection, scam alerts. Hita's watching the road so you don't have to.",
    signal: "₹47,000 saved from overcharges this week",
  },
  {
    number: "03",
    headline: "Built with locals, for travelers",
    body: "Hyderabad, Delhi, Bangalore, and 44 more cities — mapped down to neighborhood-level safety, fares, and tips.",
    signal: "12 cities added this month",
  },
];

export function WhatHitaDoes() {
  const sectionRef = useScrollReveal();

  return (
    <section ref={sectionRef} aria-label="What Hita does" className="mx-auto max-w-[1200px] px-6 py-16">
      <div className="mb-10 text-center" data-animate>
        <h2 className="font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight text-ink sm:text-[36px]">
          What Hita does
        </h2>
        <p className="mt-2 text-[15px] text-text-secondary">
          Your AI guardian — always present, never intrusive
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.headline}
            data-animate
            className="group rounded-2xl border border-border-hairline bg-canvas p-7 transition-all duration-200 hover:border-border-soft hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          >
            <span className="mb-4 block font-[family-name:var(--font-display)] text-[32px] font-light text-border-soft" aria-hidden="true">
              {pillar.number}
            </span>
            <h3 className="text-[17px] font-bold leading-snug text-ink">
              {pillar.headline}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              {pillar.body}
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ink" />
              </span>
              {pillar.signal}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
