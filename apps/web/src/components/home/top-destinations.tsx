"use client";

const DESTINATIONS = [
  { city: "Jaipur", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&h=600&fit=crop", description: "Pink city palaces & colorful bazaars", travelers: "12k+ helped" },
  { city: "Varanasi", image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=600&fit=crop", description: "Ancient ghats & spiritual experiences", travelers: "8k+ helped" },
  { city: "Munnar", image: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=800&h=600&fit=crop", description: "Misty tea plantations & wildlife", travelers: "6k+ helped" },
  { city: "Udaipur", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&h=600&fit=crop", description: "Lakeside romance & royal heritage", travelers: "9k+ helped" },
];

interface TopDestinationsProps {
  onSendPrompt: (text: string) => void;
}

export function TopDestinations({ onSendPrompt }: TopDestinationsProps) {
  return (
    <section aria-label="Top destinations" className="mx-auto max-w-[1200px] px-6 pb-14 pt-6">
      <h2 className="mb-1.5 text-[24px] font-bold text-ink">
        Top destinations for your next trip
      </h2>
      <p className="mb-5 text-[14px] text-text-secondary">
        47 Indian cities, mapped at street level
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {DESTINATIONS.map((dest) => (
          <button
            key={dest.city}
            onClick={() => onSendPrompt("Tell me about traveling to " + dest.city)}
            className="group text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink rounded-xl"
          >
            <div className="aspect-square w-full overflow-hidden rounded-xl">
              <img
                src={dest.image}
                alt={dest.city}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <h3 className="mt-2 text-[14px] font-bold text-ink">{dest.city}</h3>
            <p className="text-[13px] text-text-secondary">{dest.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
