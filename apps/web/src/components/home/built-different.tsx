"use client";

import { useScrollReveal } from "@/hooks/use-gsap";

const PILLARS = [
  {
    mark: "—",
    headline: "Built for India",
    body: "47 Indian cities mapped at neighborhood level. Hita knows local scams, festival traffic, prepaid taxi counters — the things only a local would know.",
  },
  {
    mark: "—",
    headline: "Watches in real time",
    body: "Every fare, every route, every area — checked against current conditions. Not generic answers from training data. Live data, every time.",
  },
  {
    mark: "—",
    headline: "Free where it matters",
    body: "Emergency mode, family share, safety alerts — always free. We never charge to keep you safe. Premium is for convenience, not protection.",
  },
  {
    mark: "—",
    headline: "Privacy by design",
    body: "Your location data is yours. Voice recordings deleted after transcription. Trusted contacts only see what you allow. We never sell your data.",
  },
];

export function BuiltDifferent() {
  const sectionRef = useScrollReveal();

  return (
    <section ref={sectionRef} aria-label="Why Hita is different" className="mx-auto max-w-[1200px] px-6 py-16">
      <div className="mb-10 text-center" data-animate>
        <h2 className="font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight text-ink sm:text-[36px]">
          Why Hita, not just any AI
        </h2>
        <p className="mt-2 text-[15px] text-text-secondary">
          What we built differently — on purpose
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.headline}
            data-animate
            className="rounded-2xl border border-border-hairline bg-canvas p-6 transition-all duration-200 hover:border-border-soft hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          >
            <h3 className="text-[16px] font-bold text-ink">{pillar.headline}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              {pillar.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
