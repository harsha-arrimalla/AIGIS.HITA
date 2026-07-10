"use client";

/**
 * Auto-scrolling destination photo strip under the hero.
 * Pure CSS marquee (pauses on hover, disabled for reduced motion).
 */

const PHOTOS = [
  { src: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=500&h=360&fit=crop", label: "Delhi" },
  { src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=500&h=360&fit=crop", label: "Varanasi" },
  { src: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&h=360&fit=crop", label: "Goa" },
  { src: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=500&h=360&fit=crop", label: "Munnar" },
  { src: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=500&h=360&fit=crop", label: "Jaipur" },
  { src: "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?w=500&h=360&fit=crop", label: "Hyderabad" },
  { src: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=500&h=360&fit=crop", label: "Udaipur" },
  { src: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=500&h=360&fit=crop", label: "Pondicherry" },
];

export function PhotoMarquee() {
  const strip = [...PHOTOS, ...PHOTOS]; // duplicated for a seamless loop

  return (
    <section aria-label="Destinations Hita knows" className="overflow-hidden py-6">
      <div className="animate-marquee flex w-max gap-4">
        {strip.map((p, i) => (
          <figure
            key={`${p.label}-${i}`}
            className="group relative h-[150px] w-[220px] shrink-0 overflow-hidden rounded-2xl sm:h-[170px] sm:w-[250px]"
          >
            <img
              src={p.src}
              alt={i < PHOTOS.length ? p.label : ""}
              aria-hidden={i >= PHOTOS.length}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <figcaption className="absolute bottom-2.5 left-2.5 rounded-full bg-ink/70 px-3 py-1 text-[12px] font-semibold text-on-dark backdrop-blur-sm">
              {p.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
