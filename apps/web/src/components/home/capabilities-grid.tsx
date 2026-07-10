"use client";

import { useScrollReveal } from "@/hooks/use-gsap";

/**
 * What Hita actually does — six real capabilities, each with a small
 * monochrome UI vignette instead of stock photos or invented stats.
 */
export function CapabilitiesGrid() {
  const sectionRef = useScrollReveal();

  return (
    <section ref={sectionRef} aria-labelledby="capabilities-heading" className="mx-auto max-w-[1200px] px-6 py-16">
      <div className="mb-10 max-w-[560px]" data-animate>
        <h2 id="capabilities-heading" className="font-[family-name:var(--font-display)] text-[30px] font-medium tracking-tight text-ink sm:text-[38px]">
          A local friend, <em className="font-normal italic">on call</em>
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
          Twelve specialised agents behind one conversation — watching fares,
          checking streets, and handling the small emergencies of being somewhere new.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Fare Guard — feature tile */}
        <article data-animate className="flex flex-col justify-between rounded-2xl border border-border-hairline bg-surface p-6 lg:row-span-2">
          <div>
            <h3 className="text-[16px] font-bold text-ink">Fare Guard</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
              Quote a price, get the honest range. Hita knows what locals pay — and says so.
            </p>
          </div>
          <div className="mt-6 space-y-2.5" aria-hidden="true">
            <div className="ml-auto w-fit rounded-xl rounded-br-sm bg-ink px-3.5 py-2 text-[12.5px] text-on-dark">
              He&apos;s asking ₹450 to Charminar
            </div>
            <div className="rounded-xl rounded-bl-sm border border-border-hairline bg-canvas px-3.5 py-2.5 text-[12.5px] text-ink">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Overcharge flagged</span>
              Fair range is <strong>₹250–₹290</strong>. Ask for the meter — or the metro gets you there for ₹40.
            </div>
          </div>
        </article>

        {/* Safety scores */}
        <article data-animate className="rounded-2xl border border-border-hairline bg-surface p-6">
          <h3 className="text-[16px] font-bold text-ink">Street-level safety</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
            Neighbourhood scores that change between noon and midnight, not one number for a whole city.
          </p>
          <div className="mt-5 space-y-2.5" aria-hidden="true">
            {[
              { label: "Banjara Hills · day", value: 88 },
              { label: "Banjara Hills · 11pm", value: 64 },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-[11.5px] font-medium text-text-secondary">
                  <span>{row.label}</span>
                  <span className="text-ink">{(row.value / 10).toFixed(1)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-pressed">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${row.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Transit */}
        <article data-animate className="rounded-2xl border border-border-hairline bg-surface p-6">
          <h3 className="text-[16px] font-bold text-ink">Routes that make sense</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
            Metro, auto, cab — compared by time, cost, and how safe they are right now.
          </p>
          <div className="mt-5 space-y-1.5 font-[family-name:var(--font-mono)] text-[11.5px] text-text-secondary" aria-hidden="true">
            <div className="flex justify-between rounded-lg border border-border-hairline bg-canvas px-3 py-2">
              <span className="text-ink">Metro → Ameerpet</span><span>28 min · ₹40</span>
            </div>
            <div className="flex justify-between rounded-lg border border-border-hairline bg-canvas px-3 py-2">
              <span className="text-ink">Auto (meter)</span><span>35 min · ₹260</span>
            </div>
          </div>
        </article>

        {/* Food via Swiggy */}
        <article data-animate className="rounded-2xl border border-border-hairline bg-surface p-6">
          <h3 className="text-[16px] font-bold text-ink">Dinner, handled</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
            Link your Swiggy account and Hita orders food or books your table — right from the chat.
          </p>
          <div className="mt-5 rounded-xl border border-border-hairline bg-canvas px-3.5 py-2.5 text-[12.5px] text-ink" aria-hidden="true">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Swiggy · connected</span>
            Chicken biryani from Paradise — <strong>₹389</strong>, at your hotel in ~35 min. Confirm?
          </div>
        </article>

        {/* Someone who listens */}
        <article data-animate className="rounded-2xl border border-border-hairline bg-surface p-6">
          <h3 className="text-[16px] font-bold text-ink">Someone who listens</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
            Lonely at 2am in a new city is real. Hita acknowledges it first, then helps —
            calm, practical, never dismissive.
          </p>
          <p className="mt-5 border-l-2 border-ink pl-3 font-[family-name:var(--font-display)] text-[15px] italic leading-relaxed text-ink" aria-hidden="true">
            &ldquo;That sounds rough. You&apos;re safe where you are — let&apos;s sort this out together.&rdquo;
          </p>
        </article>

        {/* Local knowledge */}
        <article data-animate className="rounded-2xl border border-border-hairline bg-surface p-6">
          <h3 className="text-[16px] font-bold text-ink">Speaks like a local</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
            47 Indian cities mapped to neighbourhood level — landmarks, local names,
            and the things only residents tell you.
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5" aria-hidden="true">
            {["Hyderabad", "Delhi", "Bangalore", "Mumbai", "Jaipur", "+42 more"].map((c) => (
              <span key={c} className="rounded-full border border-border-soft px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                {c}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
