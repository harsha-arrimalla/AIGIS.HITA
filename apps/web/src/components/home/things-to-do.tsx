"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const THINGS_TO_DO = [
  { id: "1", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop", title: "Hidden street food spots", location: "Koramangala, Bangalore", rating: 4.9, asks: "2.3k" },
  { id: "2", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=400&fit=crop", title: "Sunrise at India Gate", location: "New Delhi", rating: 4.8, asks: "5.1k" },
  { id: "3", image: "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?w=600&h=400&fit=crop", title: "Night walk through old city", location: "Charminar, Hyderabad", rating: 4.7, asks: "1.8k" },
  { id: "4", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop", title: "Backwater houseboat stay", location: "Alleppey, Kerala", rating: 4.9, asks: "3.4k" },
  { id: "5", image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=600&h=400&fit=crop", title: "Café hopping in the hills", location: "Mall Road, Shimla", rating: 4.6, asks: "1.2k" },
  { id: "6", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&h=400&fit=crop", title: "Beach sunset & seafood", location: "Palolem, Goa", rating: 4.8, asks: "4.7k" },
];

interface ThingsToDoProps {
  onSendPrompt: (text: string) => void;
}

export function ThingsToDo({ onSendPrompt }: ThingsToDoProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });

  return (
    <section aria-label="Things to do right now" className="mx-auto max-w-[1200px] px-6 pb-14">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[24px] font-bold text-ink">Things to do right now</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border-soft text-ink transition-colors hover:bg-hover"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border-soft text-ink transition-colors hover:bg-hover"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
      >
        {THINGS_TO_DO.map((item) => (
          <button
            key={item.id}
            onClick={() => onSendPrompt(item.title + " in " + item.location)}
            className="group w-[220px] shrink-0 snap-start text-left sm:w-[240px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink rounded-xl"
          >
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="mt-2.5">
              <h3 className="text-[14px] font-bold leading-snug text-ink">
                {item.title}
              </h3>
              <div className="mt-0.5 flex items-center gap-1">
                <span className="flex items-center gap-0.5 text-[13px] font-medium text-ink">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {item.rating}
                </span>
                <span className="text-[13px] text-text-secondary">· {item.asks} asked</span>
              </div>
              <p className="mt-0.5 text-[13px] text-text-secondary">{item.location}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
