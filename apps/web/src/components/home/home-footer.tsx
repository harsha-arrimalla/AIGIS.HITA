import { HitaLogo } from "@/components/hita-logo";

const FOOTER_COLUMNS = [
  { title: "Product", links: ["Features", "Cities", "Status", "Roadmap"] },
  { title: "Company", links: ["About", "Press", "Careers", "Privacy", "Terms"] },
  { title: "Support", links: ["Help center", "Contact us", "WhatsApp us", "API status"] },
];

export function HomeFooter() {
  return (
    <footer className="border-t border-border-hairline bg-canvas" role="contentinfo">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center">
                <HitaLogo size={22} color="var(--color-ink)" />
              </span>
              <span className="text-[15px] font-semibold text-ink">hita</span>
            </div>
            <p className="text-[13px] leading-relaxed text-text-secondary">
              Made in Hyderabad<br />with care for India.
            </p>
            <a
              href="mailto:arrimallaharshavardhan@gmail.com"
              className="mt-2 inline-block text-[12px] text-tertiary transition-colors hover:text-text-secondary"
            >
              arrimallaharshavardhan@gmail.com
            </a>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-2.5 text-[13px] font-bold text-ink">{col.title}</h4>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[13px] text-text-secondary transition-colors hover:underline">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-border-hairline pt-5">
          <p className="text-[12px] text-tertiary">
            © 2026 Hita. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-tertiary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
