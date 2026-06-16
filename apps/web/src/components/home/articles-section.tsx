"use client";

const ARTICLES = [
  { image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=500&fit=crop", title: "Where the best chefs eat in Hyderabad", subtitle: "7 hand-picked spots, from 6 AM chai stalls to midnight biryani counters.", cta: "Read now" },
  { image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&h=500&fit=crop", title: "A first-timer's 3-day guide to Delhi", subtitle: "Heritage walks, street food trails, and everything in between.", cta: "Read now" },
];

interface ArticlesSectionProps {
  onSendPrompt: (text: string) => void;
}

export function ArticlesSection({ onSendPrompt }: ArticlesSectionProps) {
  return (
    <section aria-label="Featured articles" className="mx-auto max-w-[1200px] px-6 pb-14">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {ARTICLES.map((article, i) => (
          <button
            key={i}
            onClick={() => onSendPrompt(article.title)}
            className="group overflow-hidden rounded-2xl border border-border-hairline bg-canvas text-left transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img
                src={article.image}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="p-5">
              <h3 className="text-[17px] font-bold text-ink">{article.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary">{article.subtitle}</p>
              <span className="mt-3 inline-block rounded-full border border-ink px-4 py-1.5 text-[12px] font-semibold text-ink transition-colors group-hover:bg-ink group-hover:text-on-dark">
                {article.cta}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
