"use client";

import { Heart, MapPin } from "lucide-react";

export interface PlaceData {
  name: string;
  type: "restaurant" | "activity" | "attraction" | "hotel" | "cafe";
  image?: string;
  rating?: number;
  reviewCount?: string;
  priceLevel?: string;
  cuisine?: string;
  location: string;
  distance?: string;
  hours?: string;
  tags?: string[];
  description?: string;
  price?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

export function PlaceCard({
  place,
  onAskAbout,
  onSelect,
}: {
  place: PlaceData;
  onAskAbout?: (name: string) => void;
  onSelect?: (place: PlaceData) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect ? onSelect(place) : onAskAbout?.(place.name)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect ? onSelect(place) : onAskAbout?.(place.name); } }}
      className="group w-[200px] shrink-0 cursor-pointer text-left transition-all duration-300 active:scale-[0.97] hover:-translate-y-1"
    >
      {/* Card body */}
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-hairline bg-canvas shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] group-hover:border-border-soft">
        {/* Image area */}
        <div className="relative m-2.5 mb-4 rounded-xl">
          <div className="overflow-hidden rounded-xl">
            {place.image ? (
              <img
                src={place.image}
                alt={place.name}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-hover text-[32px]">
                {place.type === "restaurant" ? "🍽️" : place.type === "hotel" ? "🏨" : place.type === "cafe" ? "☕" : "🏛️"}
              </div>
            )}
          </div>

          {/* Heart button */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-text-secondary shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-coral hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
            aria-label="Save"
          >
            <Heart className="h-4 w-4" strokeWidth={2} />
          </button>

          {/* Rating badge — overlapping bottom of image */}
          {place.rating && (
            <div className="absolute -bottom-3 left-2.5 flex items-center gap-1 rounded-full bg-amber px-2 py-0.5 shadow-sm">
              <svg className="h-3 w-3 text-ink" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="font-[family-name:var(--font-body)] text-[11px] font-bold text-ink">
                {place.rating}
              </span>
              {place.reviewCount && (
                <span className="font-[family-name:var(--font-body)] text-[10px] text-ink/70">
                  ({place.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col px-3 pt-3 pb-3">
          <h4 className="font-[family-name:var(--font-body)] text-[14px] font-semibold leading-tight text-ink">
            {place.name}
          </h4>
          <p className="mt-1 flex items-center gap-1 font-[family-name:var(--font-body)] text-[12px] text-text-secondary">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{place.distance || place.location}</span>
          </p>
          {(place.price || place.priceLevel) && (
            <p className="mt-1.5 font-[family-name:var(--font-body)] text-[12px] text-text-secondary">
              {place.price ? (
                <>from <span className="text-[16px] font-bold text-ink">{place.price}</span></>
              ) : (
                <span className="font-medium text-ink">{place.priceLevel}</span>
              )}
            </p>
          )}
          {place.hours && (
            <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 font-[family-name:var(--font-body)] text-[10px] font-semibold ${
              place.hours === "Open now" ? "bg-[#E4F5EC] text-success" : "bg-tint text-tertiary"
            }`}>
              {place.hours}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
