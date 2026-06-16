"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Star,
  Clock,
  Phone,
  Globe,
  MapPin,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import type { PlaceData } from "./place-card";

interface PlaceInsights {
  history: string;
  thingsToDo: string[];
  timeSuggestion: string;
  vibe: string;
}

interface NearbyPlace {
  name: string;
  placeId: string;
  rating?: number;
  types: string[];
  photoUrl?: string;
  address: string;
}

interface PlaceDetailsResponse {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  isOpen?: boolean;
  phone?: string;
  website?: string;
  photoUrls: string[];
  weekdayHours?: string[];
  reviews?: { author: string; rating: number; text: string; time: number }[];
  editorialSummary?: string;
  insights: PlaceInsights;
  nearby: NearbyPlace[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/* ── Snap points (% of viewport height from bottom) ── */
const SNAP_PEEK = 0.55; // 55% of viewport
const SNAP_FULL = 0.92; // 92% of viewport
const DISMISS_THRESHOLD = 0.25; // drag below 25% to dismiss

export function PlaceDetailPanel({
  place,
  onClose,
}: {
  place: PlaceData;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<PlaceDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(SNAP_PEEK);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  useEffect(() => {
    if (!place.placeId) return;
    setLoading(true);
    setPhotoIndex(0);

    fetch(`${API_URL}/places/${encodeURIComponent(place.placeId)}`)
      .then((r) => r.json())
      .then((data) => setDetails(data as PlaceDetailsResponse))
      .catch(() => setDetails(null))
      .finally(() => setLoading(false));
  }, [place.placeId]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Animate in on mount
  useEffect(() => {
    setSheetHeight(SNAP_PEEK);
  }, [place]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  /* ── Drag handling ── */
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeight;
  }, [sheetHeight]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const vh = window.innerHeight;
    const deltaY = dragStartY.current - clientY;
    const deltaPercent = deltaY / vh;
    const newHeight = Math.max(0.1, Math.min(SNAP_FULL, dragStartHeight.current + deltaPercent));
    setSheetHeight(newHeight);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    // Snap to closest point or dismiss
    if (sheetHeight < DISMISS_THRESHOLD) {
      handleClose();
    } else if (sheetHeight > (SNAP_PEEK + SNAP_FULL) / 2) {
      setSheetHeight(SNAP_FULL);
    } else {
      setSheetHeight(SNAP_PEEK);
    }
  }, [sheetHeight, handleClose]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events (for desktop testing)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  }, [handleDragStart]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onUp = () => handleDragEnd();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const photos = details?.photoUrls || (place.image ? [place.image] : []);

  const priceLabel = details?.priceLevel
    ? "₹".repeat(details.priceLevel)
    : place.priceLevel;

  const todayHours = details?.weekdayHours
    ? details.weekdayHours[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] ${isClosing ? "animate-backdrop-out" : "animate-backdrop-in"}`}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-canvas shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
        style={{
          height: `${sheetHeight * 100}vh`,
          borderRadius: "20px 20px 0 0",
          transition: isDragging ? "none" : "height 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isClosing ? "translateY(100%)" : "translateY(0)",
          transitionProperty: isDragging ? "none" : "height, transform",
          transitionDuration: isDragging ? "0s" : "0.35s",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing shrink-0"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="h-[5px] w-10 rounded-full bg-border-medium" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2 shrink-0">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-normal text-ink truncate pr-4">
            {place.name}
          </h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-hover transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo carousel */}
          {photos.length > 0 && (
            <div className="relative">
              <img
                src={photos[photoIndex]}
                alt={place.name}
                className="h-[260px] w-full object-cover transition-opacity duration-300"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-ink" />
                  </button>
                  <button
                    onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-ink" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === photoIndex ? "bg-white w-4" : "bg-white/60 w-1.5"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {/* Vibe badge */}
              {details?.insights.vibe && (
                <div className="absolute top-3 left-3 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1">
                  <span className="font-[family-name:var(--font-body)] text-[12px] font-medium text-on-dark">
                    {details.insights.vibe}
                  </span>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="px-5 py-4 space-y-4 animate-fade-in">
              {/* Skeleton: rating */}
              <div className="flex items-center gap-3">
                <div className="skeleton h-5 w-12 rounded-full" />
                <div className="skeleton h-4 w-20 rounded-full" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              {/* Skeleton: info lines */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-4 w-4 rounded" />
                  <div className="skeleton h-3.5 w-52" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="skeleton h-4 w-4 rounded" />
                  <div className="skeleton h-3.5 w-36" />
                </div>
              </div>
              {/* Skeleton: button */}
              <div className="skeleton h-12 w-full rounded-xl" />
              {/* Skeleton: card */}
              <div className="skeleton h-28 w-full rounded-xl" />
              {/* Skeleton: text */}
              <div className="space-y-2">
                <div className="skeleton h-5 w-36" />
                <div className="skeleton h-3.5 w-full" />
                <div className="skeleton h-3.5 w-4/5" />
                <div className="skeleton h-3.5 w-2/3" />
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-5">
              {/* Rating + meta row */}
              <div className="flex flex-wrap items-center gap-3">
                {details?.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-ink text-ink" />
                    <span className="font-[family-name:var(--font-body)] text-[15px] font-bold text-ink">
                      {details.rating}
                    </span>
                    {details.totalRatings && (
                      <span className="font-[family-name:var(--font-body)] text-[13px] text-text-secondary">
                        ({details.totalRatings.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                )}
                {priceLabel && (
                  <span className="font-[family-name:var(--font-body)] text-[13px] font-medium text-ink">
                    {priceLabel}
                  </span>
                )}
                {details?.isOpen != null && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-[family-name:var(--font-body)] text-[11px] font-semibold ${
                      details.isOpen
                        ? "bg-tint text-ink"
                        : "bg-tint text-tertiary"
                    }`}
                  >
                    {details.isOpen ? "Open now" : "Closed"}
                  </span>
                )}
              </div>

              {/* Address + contact */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-text-secondary" />
                  <span className="font-[family-name:var(--font-body)] text-[13px] text-text-secondary">
                    {details?.address || place.location}
                  </span>
                </div>
                {todayHours && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0 text-text-secondary" />
                    <span className="font-[family-name:var(--font-body)] text-[13px] text-text-secondary">
                      {todayHours}
                    </span>
                  </div>
                )}
                {details?.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0 text-text-secondary" />
                    <a
                      href={`tel:${details.phone}`}
                      className="font-[family-name:var(--font-body)] text-[13px] text-ink hover:underline"
                    >
                      {details.phone}
                    </a>
                  </div>
                )}
                {details?.website && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 mt-0.5 shrink-0 text-text-secondary" />
                    <a
                      href={details.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-[family-name:var(--font-body)] text-[13px] text-ink hover:underline truncate"
                    >
                      {new URL(details.website).hostname}
                    </a>
                  </div>
                )}
              </div>

              {/* Directions button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${details?.lat},${details?.lng}&destination_place_id=${place.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 font-[family-name:var(--font-body)] text-[14px] font-semibold text-on-dark transition-colors hover:bg-black"
              >
                <Navigation className="h-4 w-4" />
                Get directions
              </a>

              {/* ── Time-aware suggestion ── */}
              {details?.insights.timeSuggestion && (
                <div className="rounded-xl bg-tint border border-border-soft p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-ink" />
                    <span className="font-[family-name:var(--font-body)] text-[13px] font-semibold text-ink">
                      Right now
                    </span>
                  </div>
                  <p className="font-[family-name:var(--font-body)] text-[13px] leading-relaxed text-text-secondary">
                    {details.insights.timeSuggestion}
                  </p>
                </div>
              )}

              {/* ── History ── */}
              {details?.insights.history && (
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-[17px] text-ink mb-2">
                    About this place
                  </h3>
                  <p className="font-[family-name:var(--font-body)] text-[13px] leading-relaxed text-text-secondary">
                    {details.insights.history}
                  </p>
                </div>
              )}

              {/* ── Things to do ── */}
              {details?.insights.thingsToDo && details.insights.thingsToDo.length > 0 && (
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-[17px] text-ink mb-2">
                    Things to do
                  </h3>
                  <div className="space-y-2">
                    {details.insights.thingsToDo.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-lg bg-hover px-3 py-2.5"
                      >
                        <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ink" />
                        <span className="font-[family-name:var(--font-body)] text-[13px] text-ink">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Map ── */}
              {details?.lat && details?.lng && (
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-[17px] text-ink mb-2">
                    Map
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-border-hairline">
                    <iframe
                      title={`Map of ${place.name}`}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(place.name)}&ll=${details.lat},${details.lng}&z=16&output=embed`}
                    />
                  </div>
                </div>
              )}

              {/* ── Reviews ── */}
              {details?.reviews && details.reviews.length > 0 && (
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-[17px] text-ink mb-2">
                    Reviews
                  </h3>
                  <div className="space-y-3">
                    {details.reviews.map((review, i) => (
                      <div key={i} className="rounded-xl border border-border-hairline p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-hover font-[family-name:var(--font-body)] text-[12px] font-bold text-text-secondary">
                            {review.author.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-[family-name:var(--font-body)] text-[13px] font-medium text-ink">
                            {review.author}
                          </span>
                          <div className="flex items-center gap-0.5 ml-auto">
                            <Star className="h-3 w-3 fill-ink text-ink" />
                            <span className="font-[family-name:var(--font-body)] text-[12px] font-medium text-ink">
                              {review.rating}
                            </span>
                          </div>
                        </div>
                        <p className="font-[family-name:var(--font-body)] text-[12px] leading-relaxed text-text-secondary line-clamp-3">
                          {review.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Nearby places ── */}
              {details?.nearby && details.nearby.length > 0 && (
                <div className="pb-4">
                  <h3 className="font-[family-name:var(--font-display)] text-[17px] text-ink mb-2">
                    Nearby to explore
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {details.nearby.map((np, i) => (
                      <div
                        key={i}
                        className="overflow-hidden rounded-xl border border-border-hairline transition-shadow hover:shadow-md"
                      >
                        {np.photoUrl ? (
                          <img
                            src={np.photoUrl}
                            alt={np.name}
                            className="h-[80px] w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-[80px] w-full items-center justify-center bg-hover text-[20px]">
                            📍
                          </div>
                        )}
                        <div className="px-2.5 py-2">
                          <p className="font-[family-name:var(--font-body)] text-[12px] font-semibold text-ink leading-tight line-clamp-1">
                            {np.name}
                          </p>
                          {np.rating && (
                            <div className="mt-0.5 flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-ink text-ink" />
                              <span className="font-[family-name:var(--font-body)] text-[10px] text-text-secondary">
                                {np.rating}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
