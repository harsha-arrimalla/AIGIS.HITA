"use client";

import { useEffect, useRef, useState } from "react";

const NUMBERS = [
  { value: 47, suffix: "", label: "Cities covered" },
  { value: 5200, suffix: "", label: "Travelers using right now" },
  { value: 12847, suffix: "", label: "Helped this month" },
  { value: 2.3, suffix: " Cr", label: "Saved from overcharges", prefix: "₹" },
  { value: 98.7, suffix: "%", label: "Reach destinations safely" },
  { value: 24, suffix: "/7", label: "Always here" },
];

function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  visible,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  visible: boolean;
}) {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!visible) return;

    const duration = 1400;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;

    const interval = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = value * eased;

      if (Number.isInteger(value)) {
        setDisplay(Math.round(val).toLocaleString("en-IN"));
      } else {
        setDisplay(val.toFixed(1));
      }

      if (current >= steps) clearInterval(interval);
    }, stepTime);

    return () => clearInterval(interval);
  }, [value, visible]);

  return (
    <span>
      {prefix}{display}{suffix}
    </span>
  );
}

export function NumbersThatMatter() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} aria-label="Key statistics" className="bg-surface py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight text-ink sm:text-[36px]">
            Travelers we&apos;ve stood with
          </h2>
          <p className="mt-2 text-[15px] text-text-secondary">
            The numbers update live. Every 30 seconds.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {NUMBERS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p aria-label={`${"prefix" in stat ? (stat as { prefix: string }).prefix : ""}${stat.value}${stat.suffix} ${stat.label}`} className="font-[family-name:var(--font-display)] text-[36px] font-medium tracking-tight text-ink sm:text-[48px]">
                <AnimatedNumber
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={"prefix" in stat ? (stat as { prefix: string }).prefix : ""}
                  visible={visible}
                />
              </p>
              <p className="mt-1 text-[13px] text-text-secondary sm:text-[14px]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[12px] text-tertiary">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
          All systems operational
        </p>
      </div>
    </section>
  );
}
