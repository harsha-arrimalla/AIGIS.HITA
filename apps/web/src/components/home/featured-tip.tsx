"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";

const LOCAL_TIPS = [
  { line: "Try the biryani at Paradise, Secunderabad", prompt: "Tell me about Paradise biryani in Secunderabad", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop" },
  { line: "Go for a walk at Cubbon Park, Bangalore", prompt: "Best walking trails in Cubbon Park Bangalore", image: "https://images.unsplash.com/photo-1596587984079-84f1e5e9d800?w=600&h=400&fit=crop" },
  { line: "Try street food at Chandni Chowk, Delhi", prompt: "Best street food at Chandni Chowk Delhi", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop" },
  { line: "Watch the sunset at Hussain Sagar, Hyderabad", prompt: "Sunset at Hussain Sagar lake Hyderabad", image: "https://images.unsplash.com/photo-1572638319789-5a3d407b5540?w=600&h=400&fit=crop" },
  { line: "Grab a filter coffee at Mavalli Tiffin Room", prompt: "MTR filter coffee and breakfast Bangalore", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop" },
  { line: "Take a heritage walk through Amer Fort, Jaipur", prompt: "Heritage walk at Amer Fort Jaipur", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&h=400&fit=crop" },
];

function useRotatingTip() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % LOCAL_TIPS.length);
        setFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [paused]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  return { tip: LOCAL_TIPS[index], fade, index, paused, togglePause };
}

interface FeaturedTipProps {
  onSendPrompt: (text: string) => void;
}

export function FeaturedTip({ onSendPrompt }: FeaturedTipProps) {
  const { tip, fade, index: tipIndex, paused, togglePause } = useRotatingTip();

  return (
    <section aria-label="Featured travel tips" className="mx-auto max-w-[1200px] px-6 pb-12">
      <div aria-live="polite" aria-atomic="true">
        <button
          onClick={() => onSendPrompt(tip.prompt)}
          aria-label={`Ask Hita: ${tip.line}`}
          className={`group relative w-full overflow-hidden rounded-2xl bg-ink transition-all duration-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0">
            <img
              src={tip.image}
              alt=""
              className="h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="relative flex items-center justify-between gap-6 p-8 sm:p-10">
            <div className="text-left">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-on-dark/60">
                Powered by AI
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-[24px] font-medium leading-tight text-on-dark sm:text-[30px]">
                {tip.line}
              </h2>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-canvas px-4 py-2 text-[13px] font-semibold text-ink transition-transform group-hover:scale-[1.03]">
                Ask Hita
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
              </p>
            </div>
          </div>
        </button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="flex gap-1.5" role="tablist" aria-label="Travel tip indicators">
          {LOCAL_TIPS.map((t, i) => (
            <span
              key={i}
              role="tab"
              aria-selected={i === tipIndex}
              aria-label={`Tip ${i + 1}: ${t.line}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === tipIndex ? "w-4 bg-ink" : "w-1.5 bg-border-soft"
              }`}
            />
          ))}
        </div>
        <button
          onClick={togglePause}
          aria-label={paused ? "Play carousel" : "Pause carousel"}
          className="flex h-6 w-6 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        </button>
      </div>
    </section>
  );
}
