"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: "12,847", label: "travelers helped this week", live: true },
  { value: "3", label: "people getting safety check-ins right now", live: true },
  { value: "₹2.3 Cr", label: "in scam-overcharges prevented", live: false },
  { value: "98.7%", label: "reach destinations safely", live: false },
  { value: "47", label: "Indian cities covered", live: false },
];

function useCountUp(target: string, visible: boolean) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!visible) return;

    const numericMatch = target.match(/[\d,]+/);
    if (!numericMatch) {
      setDisplay(target);
      return;
    }

    const raw = parseInt(numericMatch[0].replace(/,/g, ""), 10);
    if (isNaN(raw) || raw === 0) {
      setDisplay(target);
      return;
    }

    const prefix = target.slice(0, target.indexOf(numericMatch[0]));
    const suffix = target.slice(target.indexOf(numericMatch[0]) + numericMatch[0].length);
    const duration = 1200;
    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;

    const interval = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(raw * eased);
      setDisplay(prefix + val.toLocaleString("en-IN") + suffix);
      if (current >= steps) clearInterval(interval);
    }, stepTime);

    return () => clearInterval(interval);
  }, [target, visible]);

  return display;
}

function StatItem({ stat }: { stat: (typeof STATS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const display = useCountUp(stat.value, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex items-center gap-2 px-4 py-2 sm:px-6">
      {stat.live && (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink/30 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
        </span>
      )}
      <p className="text-[13px] text-text-secondary sm:text-[14px]">
        {stat.live && <span className="sr-only">Live: </span>}
        <span className="font-semibold text-ink">{display}</span>{" "}
        {stat.label}
      </p>
    </div>
  );
}

export function LiveTrustStrip() {
  return (
    <section aria-label="Live trust statistics" className="border-y border-border-hairline bg-tint">
      <div className="mx-auto max-w-[1200px] overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-center gap-0 divide-x divide-border-hairline py-1 sm:gap-0">
          {STATS.map((stat, i) => (
            <StatItem key={i} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
