"use client";

const WEEKEND_GETAWAYS = [
  { city: "Pondicherry", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=400&fit=crop" },
  { city: "Coorg", image: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=400&h=400&fit=crop" },
  { city: "Goa", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=400&fit=crop" },
  { city: "Ooty", image: "https://images.unsplash.com/photo-1596587984079-84f1e5e9d800?w=400&h=400&fit=crop" },
];

interface WeekendGetawaysProps {
  onSendPrompt: (text: string) => void;
}

export function WeekendGetaways({ onSendPrompt }: WeekendGetawaysProps) {
  return (
    <section aria-label="Weekend getaways" className="mx-auto max-w-[1200px] px-6 pb-8">
      <h2 className="mb-1.5 text-[24px] font-bold text-ink">Weekend getaways</h2>
      <p className="mb-5 text-[14px] text-text-secondary">Quick escapes from where you are</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {WEEKEND_GETAWAYS.map((g) => (
          <button
            key={g.city}
            onClick={() => onSendPrompt("Weekend trip to " + g.city)}
            className="group text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink rounded-xl"
          >
            <div className="aspect-square w-full overflow-hidden rounded-xl">
              <img
                src={g.image}
                alt={g.city}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="mt-2 text-[14px] font-bold text-ink">{g.city}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
