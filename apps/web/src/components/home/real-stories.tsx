"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const STORIES = [
  {
    quote: "Late at night I felt unsafe walking back to my hotel. Hita stayed with me the whole 12 minutes home. That kind of presence — I didn't know I needed it until I had it.",
    name: "Priya",
    age: 26,
    city: "Bangalore",
    feature: "Late-night safety mode",
  },
  {
    quote: "Driver was charging ₹650 for what Hita said should be ₹250. Showed him the screen. He didn't argue. Saved me ₹400 in 30 seconds.",
    name: "Karthik",
    age: 31,
    city: "Hyderabad",
    feature: "Fare Guard",
  },
  {
    quote: "I'm a 24-year-old woman traveling alone for work. Hita's late-night mode gave my parents peace of mind. They could see I was safe without me having to text constantly.",
    name: "Ananya",
    age: 24,
    city: "Delhi",
    feature: "Family Share + Late-night mode",
  },
  {
    quote: "Driver dropped me at the wrong place at midnight. Hita guided me to a 24-hour cafe nearby and stayed in chat until I found another ride. Felt like having a friend on the phone.",
    name: "Mohammed",
    age: 29,
    city: "Chennai",
    feature: "Emergency mode",
  },
  {
    quote: "My first time in Mumbai. The crowds overwhelmed me. Hita didn't just give directions — it asked if I was okay. We did a 30-second breathing exercise. Then I was ready to move.",
    name: "Tejasri",
    age: 22,
    city: "Mumbai",
    feature: "Heart Agent",
  },
];

export function RealStories() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -380 : 380, behavior: "smooth" });

  return (
    <section aria-label="Real traveler stories" className="mx-auto max-w-[1200px] px-6 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[28px] font-medium tracking-tight text-ink sm:text-[36px]">
            When Hita made the difference
          </h2>
          <p className="mt-2 text-[15px] text-text-secondary">
            Real moments from travelers across India
          </p>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            onClick={() => scroll("left")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink transition-colors hover:bg-hover"
            aria-label="Previous story"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-ink transition-colors hover:bg-hover"
            aria-label="Next story"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-2"
      >
        {STORIES.map((story) => (
          <div
            key={story.name}
            className="w-[340px] shrink-0 snap-start rounded-2xl border border-border-hairline bg-canvas p-6 sm:w-[360px]"
          >
            <Quote className="mb-4 h-5 w-5 text-ink" strokeWidth={2} aria-hidden="true" />
            <p className="text-[15px] leading-relaxed text-ink">
              &ldquo;{story.quote}&rdquo;
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-border-hairline pt-4">
              <div>
                <p className="text-[14px] font-semibold text-ink">
                  {story.name}, {story.age}
                </p>
                <p className="text-[13px] text-text-secondary">{story.city}</p>
              </div>
              <span className="rounded-full bg-tint px-3 py-1 text-[11px] font-medium text-ink">
                {story.feature}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
