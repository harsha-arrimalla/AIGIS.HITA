"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNearbyPlaces } from "@/hooks/use-nearby-places";

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

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

export function ThingsToDo({ onSendPrompt }: ThingsToDoProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearby = useNearbyPlaces();

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });

  const hasNearby = nearby.status === "ready";
  const heading = hasNearby
    ? `Things to do near you${nearby.city ? ` in ${nearby.city}` : ""}`
    : "Things to do right now";

  const cards = hasNearby
    ? nearby.places.map((p) => ({
        id: p.placeId,
        image: p.photoUrl!,
        title: p.name,
        location: p.address.split(",").slice(0, 2).join(","),
        rating: p.rating,
        asks: p.totalRatings ? formatCount(p.totalRatings) : null,
        prompt: `Tell me about ${p.name}${nearby.city ? ` in ${nearby.city}` : ""}`,
      }))
    : THINGS_TO_DO.map((item) => ({
        ...item,
        rating: item.rating as number | undefined,
        asks: item.asks as string | null,
        prompt: item.title + " in " + item.location,
      }));

  return (
    <section aria-label="Things to do right now" className="mx-auto max-w-[1200px] px-6 pb-14">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[24px] font-bold text-ink">{heading}</h2>
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
        {cards.map((item) => (
          <button
            key={item.id}
            onClick={() => onSendPrompt(item.prompt)}
            className="group w-[230px] shrink-0 snap-start overflow-hidden rounded-3xl bg-raised text-left shadow-1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-3 sm:w-[250px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              {item.rating != null && (
                <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-raised/95 px-2.5 py-1 text-[12px] font-bold text-ink shadow-1 backdrop-blur-sm">
                  <svg className="h-3 w-3 fill-amber text-amber" viewBox="0 0 24 24" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {item.rating}
                </span>
              )}
            </div>
            <div className="px-4 pb-4 pt-3">
              <h3 className="text-[14.5px] font-bold leading-snug text-ink">
                {item.title}
              </h3>
              {item.asks && (
                <p className="mt-1 text-[12.5px] text-text-secondary">
                  {item.asks} {hasNearby ? "reviews" : "asked"}
                </p>
              )}
              <p className="mt-0.5 text-[12.5px] text-text-secondary">{item.location}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
