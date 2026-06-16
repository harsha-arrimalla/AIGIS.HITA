"use client";

import { useState, useCallback } from "react";
import {
  X,
  Phone,
  MapPin,
  Shield,
  Building2,
  Flame,
  Heart,
  ChevronDown,
  ChevronUp,
  Share2,
  AlertTriangle,
} from "lucide-react";

interface EmergencyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  city?: string;
  onFindNearby?: (type: string) => void;
}

const emergencyNumbers = [
  { label: "Police", number: "100", icon: Shield },
  { label: "Ambulance", number: "108", icon: Heart },
  { label: "Fire", number: "101", icon: Flame },
  { label: "Women Helpline", number: "1091", icon: Phone },
  { label: "Tourist Helpline", number: "1800-11-1363", icon: Building2 },
];

const safetyTips = [
  {
    title: "If you feel unsafe",
    content:
      "Move to a crowded, well-lit area immediately. Contact local police by calling 100. Share your live location with a trusted contact. If possible, enter a nearby hotel, restaurant, or shop and ask staff for help. Avoid isolated areas, especially after dark.",
  },
  {
    title: "Lost documents",
    content:
      "File an FIR at the nearest police station — you'll need this for replacements. Contact your country's embassy or consulate for emergency travel documents. Keep digital copies of your passport, visa, and ID in your email or cloud storage. Call the tourist helpline at 1800-11-1363 for guidance.",
  },
  {
    title: "Medical emergency",
    content:
      "Call 108 for an ambulance immediately. If someone is unconscious, check for breathing and begin CPR if trained. Do not move a person with a suspected spinal injury. Visit the nearest government hospital for free emergency treatment. Keep a note of any allergies or medications you take.",
  },
];

export default function EmergencyOverlay({
  isOpen,
  onClose,
  city,
  onFindNearby,
}: EmergencyOverlayProps) {
  const [openTip, setOpenTip] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleShareLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setSharing(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
        const text = `I need help. My location: ${mapsUrl}`;

        if (navigator.share) {
          try {
            await navigator.share({ title: "My Location", text });
          } catch {
            /* user cancelled */
          }
        } else {
          try {
            await navigator.clipboard.writeText(text);
            alert("Location copied to clipboard");
          } catch {
            /* clipboard failed */
          }
        }
        setSharing(false);
      },
      () => {
        alert("Unable to get your location. Please enable location access.");
        setSharing(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-canvas flex flex-col font-[family-name:var(--font-body)] overflow-y-auto animate-fade-in">
      {/* Red top bar */}
      <div className="bg-danger text-on-dark px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </span>
          <h1 className="text-lg font-bold tracking-tight">Emergency</h1>
          {city && (
            <span className="text-sm opacity-80">— {city}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close emergency overlay"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-4 py-5 space-y-8 max-w-lg mx-auto w-full">
        {/* Emergency Numbers */}
        <section>
          <h2 className="text-ink text-base font-semibold mb-3">
            Emergency Numbers
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {emergencyNumbers.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.number}
                  href={`tel:${item.number}`}
                  className="flex items-center gap-3 min-h-[56px] px-4 py-3 rounded-xl border-2 border-danger text-danger hover:bg-danger hover:text-on-dark transition-colors active:scale-[0.97]"
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight truncate">
                      {item.label}
                    </div>
                    <div className="text-xs opacity-80">{item.number}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-ink text-base font-semibold mb-3">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleShareLocation}
              disabled={sharing}
              className="w-full flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-xl bg-ink text-on-dark font-semibold hover:bg-black transition-colors disabled:opacity-60 active:scale-[0.98]"
            >
              <Share2 className="w-5 h-5" />
              {sharing ? "Getting location…" : "Share my location"}
            </button>
            <button
              onClick={() => onFindNearby?.("hospital")}
              className="w-full flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-xl bg-ink text-on-dark font-semibold hover:bg-black transition-colors active:scale-[0.98]"
            >
              <MapPin className="w-5 h-5" />
              Nearest hospital
            </button>
            <button
              onClick={() => onFindNearby?.("police")}
              className="w-full flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-xl bg-ink text-on-dark font-semibold hover:bg-black transition-colors active:scale-[0.98]"
            >
              <Shield className="w-5 h-5" />
              Nearest police station
            </button>
          </div>
        </section>

        {/* Safety Tips */}
        <section>
          <h2 className="text-ink text-base font-semibold mb-3">
            Safety Tips
          </h2>
          <div className="rounded-xl border border-border-hairline divide-y divide-border-hairline overflow-hidden">
            {safetyTips.map((tip, index) => {
              const isOpen = openTip === index;
              return (
                <div key={index}>
                  <button
                    onClick={() => setOpenTip(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-hover transition-colors"
                  >
                    <span className="text-sm font-medium text-ink">
                      {tip.title}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-text-secondary shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed">
                      {tip.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
