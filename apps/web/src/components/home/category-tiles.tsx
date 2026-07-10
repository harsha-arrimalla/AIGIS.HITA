"use client";

import { MapPin, UtensilsCrossed, ShieldCheck, IndianRupee, HeartHandshake } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-gsap";

const TILES = [
  {
    icon: MapPin,
    title: "Things to do",
    sub: "Curated by locals",
    prompt: "What are the best things to do near me today?",
    bg: "from-[#FFE8E0] to-[#FFD6CC]",
  },
  {
    icon: UtensilsCrossed,
    title: "Food & dining",
    sub: "Order via Swiggy in chat",
    prompt: "Find me a great dinner spot nearby",
    bg: "from-[#FFF1D6] to-[#FFE3AD]",
  },
  {
    icon: ShieldCheck,
    title: "Safety check",
    sub: "Street-level, day & night",
    prompt: "How safe is my area right now?",
    bg: "from-[#E4F5EC] to-[#CBEBDA]",
  },
  {
    icon: IndianRupee,
    title: "Fare guard",
    sub: "Never get overcharged",
    prompt: "Check if this fare is fair: ",
    bg: "from-[#EDE9FF] to-[#DCD4FF]",
  },
  {
    icon: HeartHandshake,
    title: "Talk to Hita",
    sub: "24/7, judgment-free",
    prompt: "Hey Hita, I could use some company",
    bg: "from-[#FFE4EE] to-[#FFD0E2]",
  },
];

interface CategoryTilesProps {
  onSendPrompt: (text: string) => void;
}

export function CategoryTiles({ onSendPrompt }: CategoryTilesProps) {
  const sectionRef = useScrollReveal();

  return (
    <section ref={sectionRef} aria-label="What do you need?" className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.title}
              data-animate
              onClick={() => onSendPrompt(t.prompt)}
              className={`group rounded-3xl bg-gradient-to-br ${t.bg} p-5 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-raised/80 shadow-1 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Icon className="h-5 w-5 text-ink" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[15px] font-bold text-ink">{t.title}</h3>
              <p className="mt-0.5 text-[12.5px] font-medium text-ink/60">{t.sub}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
