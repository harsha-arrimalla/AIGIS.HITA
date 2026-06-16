"use client";

import { useRouter } from "next/navigation";
import { useScrollReveal } from "@/hooks/use-gsap";

const STEPS = [
  {
    number: "1",
    headline: "Tell Hita where you are",
    description: "Type or speak. Hita understands you naturally — even mixed Hindi-English.",
    chat: "I just landed at Hyderabad airport",
  },
  {
    number: "2",
    headline: "Get instant guidance",
    description: "Routes, fare ranges, safety scores. All from one chat.",
    chat: null,
  },
  {
    number: "3",
    headline: "Stay safe, all the way home",
    description: "Hita can share your trip with family. Stays with you until you're safely home.",
    chat: null,
  },
];

export function HowItWorks() {
  const router = useRouter();
  const sectionRef = useScrollReveal();

  return (
    <section ref={sectionRef} aria-label="How Hita works" className="bg-surface py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-10 text-center" data-animate>
          <h2 className="font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight text-ink sm:text-[36px]">
            How Hita works
          </h2>
          <p className="mt-2 text-[15px] text-text-secondary">
            Three steps. No app needed. Free to try.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center" data-animate>
              <span className="mx-auto mb-3 block font-[family-name:var(--font-display)] text-[48px] font-light leading-none text-ink">
                {step.number}
              </span>
              <h3 className="text-[17px] font-bold text-ink">{step.headline}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                {step.description}
              </p>
              {step.chat && (
                <div className="mx-auto mt-4 max-w-[280px] rounded-xl border border-border-hairline bg-canvas px-4 py-3 text-left text-[13px] text-text-secondary">
                  <span className="text-tertiary">You:</span> {step.chat}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => router.push("/chat")}
            className="rounded-full bg-ink px-8 py-3 text-[14px] font-semibold text-on-dark transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Start chatting — it&apos;s free
          </button>
          <p className="mt-2 text-[12px] text-tertiary">
            No app download. No payment for safety features. Ever.
          </p>
        </div>
      </div>
    </section>
  );
}
