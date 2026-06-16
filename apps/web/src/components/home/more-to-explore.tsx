"use client";

const MORE_TO_EXPLORE = [
  { image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop", title: "5 beach towns worth visiting this monsoon" },
  { image: "https://images.unsplash.com/photo-1596587984079-84f1e5e9d800?w=400&h=300&fit=crop", title: "Family-friendly hill stations near Bangalore" },
  { image: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?w=400&h=300&fit=crop", title: "A first timer's guide to Kerala backwaters" },
];

interface MoreToExploreProps {
  onSendPrompt: (text: string) => void;
}

export function MoreToExplore({ onSendPrompt }: MoreToExploreProps) {
  return (
    <section aria-label="More to explore" className="mx-auto max-w-[1200px] px-6 pb-14">
      <h2 className="mb-5 text-[24px] font-bold text-ink">More to explore</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {MORE_TO_EXPLORE.map((item, i) => (
          <button
            key={i}
            onClick={() => onSendPrompt(item.title)}
            className="group overflow-hidden rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <div className="aspect-[3/2] w-full overflow-hidden rounded-xl">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="mt-2.5 text-[14px] font-bold leading-snug text-ink">
              {item.title}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
