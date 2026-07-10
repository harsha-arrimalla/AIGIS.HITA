"use client";

import { Star } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-gsap";

const STORIES = [
  {
    quote:
      "Landed in Hyderabad at midnight, auto wanted ₹600. Hita told me the fair price and the exact Hindi line to say. Paid ₹280.",
    name: "Ananya",
    detail: "Bangalore → Hyderabad",
    initial: "A",
    bg: "bg-coral",
  },
  {
    quote:
      "I asked if the lane behind my hostel was okay at 10pm. It knew the street. The actual street. That's when I stopped using maps for this.",
    name: "Rahul",
    detail: "First solo trip, Jaipur",
    initial: "R",
    bg: "bg-amber",
  },
  {
    quote:
      "Was overwhelmed and homesick on day two. Hita talked me down, then ordered me comfort biryani without leaving the chat. Unreal.",
    name: "Meera",
    detail: "Work relocation, Pune",
    initial: "M",
    bg: "bg-[#7C5CFF]",
  },
];

export function TravelerStories() {
  const sectionRef = useScrollReveal();

  return (
    <section ref={sectionRef} aria-labelledby="stories-heading" className="mx-auto max-w-[1200px] px-6 py-16">
      <div className="mb-10 text-center" data-animate>
        <h2 id="stories-heading" className="font-[family-name:var(--font-display)] text-[32px] font-bold tracking-tight text-ink sm:text-[42px]">
          Travelers <em className="not-italic text-coral">♥</em> Hita
        </h2>
        <p className="mt-3 text-[15px] text-text-secondary">From our early travelers across India.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {STORIES.map((s) => (
          <figure
            key={s.name}
            data-animate
            className="flex flex-col justify-between rounded-3xl bg-raised p-7 shadow-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-3"
          >
            <div>
              <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber text-amber" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-4 text-[15px] leading-relaxed text-body">
                &ldquo;{s.quote}&rdquo;
              </blockquote>
            </div>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${s.bg} text-[15px] font-bold text-on-coral`}>
                {s.initial}
              </span>
              <span>
                <span className="block text-[14px] font-bold text-ink">{s.name}</span>
                <span className="block text-[12.5px] text-text-secondary">{s.detail}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
