"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, IndianRupee, UtensilsCrossed, HeartHandshake, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-gsap";

/* ── Scripted demo conversation ──────────────────────────────── */

interface DemoMessage {
  role: "user" | "hita";
  text: string;
  chip?: string;
}

const DEMO_SCRIPT: DemoMessage[] = [
  { role: "user", text: "Auto driver's asking ₹450 from HITEC City to Charminar. Fair?" },
  {
    role: "hita",
    chip: "Fare check",
    text: "That's ₹160–200 too much 😤 Fair range is ₹250–₹290 on the meter. Say \"meter se chalo\" — if he refuses, the next auto is 2 minutes away.",
  },
  { role: "user", text: "Done ✌️ Also — order me a biryani for when I'm back?" },
  {
    role: "hita",
    chip: "Swiggy · connected",
    text: "Chicken biryani from Paradise, ₹389, at your hotel ~9:45pm. Confirm and it's on its way 🍛",
  },
];

function useDemoConversation() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisibleCount(DEMO_SCRIPT.length);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const step = (i: number) => {
      if (cancelled || i >= DEMO_SCRIPT.length) return;
      if (DEMO_SCRIPT[i].role === "hita") {
        setTyping(true);
        timers.push(
          setTimeout(() => {
            setTyping(false);
            setVisibleCount(i + 1);
            timers.push(setTimeout(() => step(i + 1), 1500));
          }, 1200)
        );
      } else {
        setVisibleCount(i + 1);
        timers.push(setTimeout(() => step(i + 1), 1000));
      }
    };

    timers.push(setTimeout(() => step(0), 600));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return { messages: DEMO_SCRIPT.slice(0, visibleCount), typing };
}

/* ── Feature cards ────────────────────────────────────────────── */

const POWERS = [
  {
    icon: IndianRupee,
    title: "Fare Guard",
    text: "Quote any price and get the honest local range back — plus the exact line to say to the driver.",
    bg: "from-[#FFE8E0] to-[#FFD6CC]",
  },
  {
    icon: ShieldCheck,
    title: "Street-level safety",
    text: "Neighbourhood scores that change between noon and midnight — not one number for a whole city.",
    bg: "from-[#E4F5EC] to-[#CBEBDA]",
  },
  {
    icon: UtensilsCrossed,
    title: "Orders your dinner",
    text: "Link Swiggy once, then order food or book tables straight from the conversation.",
    bg: "from-[#FFF1D6] to-[#FFE3AD]",
  },
  {
    icon: HeartHandshake,
    title: "Someone who listens",
    text: "Lonely at 2am in a new city is real. Hita acknowledges it first, then helps — calm and practical.",
    bg: "from-[#FFE4EE] to-[#FFD0E2]",
  },
];

export function AiPowers() {
  const sectionRef = useScrollReveal();
  const { messages, typing } = useDemoConversation();

  return (
    <section ref={sectionRef} aria-labelledby="powers-heading" className="relative overflow-hidden bg-gradient-to-b from-canvas via-surface to-canvas py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center" data-animate>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-coral-medium bg-coral-light px-4 py-1.5 text-[13px] font-semibold text-coral">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Only Hita can do this
          </p>
          <h2 id="powers-heading" className="mt-5 font-[family-name:var(--font-display)] text-[34px] font-bold tracking-tight text-ink sm:text-[48px]">
            Not a search box. <span className="bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">A guardian.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[540px] text-[16px] leading-relaxed text-text-secondary">
            Twelve specialised AI agents behind one chat — watching fares, checking
            streets, handling dinner, and staying with you until you&apos;re home.
          </p>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* phone-framed live demo */}
          <div data-animate className="mx-auto w-full max-w-[400px]">
            <div className="rounded-[36px] border border-border-soft bg-ink p-2.5 shadow-3">
              <div className="overflow-hidden rounded-[28px] bg-canvas">
                <div className="flex items-center justify-between bg-gradient-to-r from-coral to-[#FF8A5C] px-5 py-3.5">
                  <span className="text-[14px] font-bold text-on-coral">hita</span>
                  <span className="text-[11px] font-medium text-on-coral/80">Hyderabad · 9:04 pm</span>
                </div>
                <div className="flex min-h-[380px] flex-col justify-end gap-3 px-4 py-5">
                  {messages.map((m, i) =>
                    m.role === "user" ? (
                      <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[13px] leading-relaxed text-on-dark">
                        {m.text}
                      </div>
                    ) : (
                      <div key={i} className="mr-auto max-w-[90%]">
                        {m.chip && (
                          <span className="mb-1.5 inline-block rounded-full bg-amber-tint px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9A6B00]">
                            {m.chip}
                          </span>
                        )}
                        <div className="rounded-2xl rounded-bl-md bg-raised px-4 py-2.5 text-[13px] leading-relaxed text-ink shadow-1">
                          {m.text}
                        </div>
                      </div>
                    )
                  )}
                  {typing && (
                    <div className="mr-auto flex items-center gap-1 rounded-2xl rounded-bl-md bg-raised px-4 py-3 shadow-1">
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-coral" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-coral" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-coral" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* feature cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {POWERS.map((p) => {
              const Icon = p.icon;
              return (
                <article
                  key={p.title}
                  data-animate
                  className={`group rounded-3xl bg-gradient-to-br ${p.bg} p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-3`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-raised/85 shadow-1 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <Icon className="h-5 w-5 text-ink" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-[16.5px] font-bold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/70">{p.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
