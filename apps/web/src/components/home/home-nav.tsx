"use client";

import { useRouter } from "next/navigation";
import { HitaLogo } from "@/components/hita-logo";
import { useAuth } from "@/lib/auth-provider";

const CTA_CLASSES =
  "rounded-full bg-gradient-to-r from-coral to-[#FF8A5C] px-5 py-2.5 text-[13.5px] font-bold text-on-coral shadow-[0_6px_16px_rgba(255,90,95,0.3)] transition-all hover:shadow-[0_8px_20px_rgba(255,90,95,0.4)] hover:brightness-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral";

export function HomeNav() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border-hairline bg-canvas/85 backdrop-blur-md">
      <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2 select-none">
          <span className="flex items-center justify-center">
            <HitaLogo size={26} color="var(--color-coral)" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[19px] font-bold tracking-tight text-ink">hita</span>
        </a>
        <div className="flex items-center gap-5">
          {user ? (
            <button onClick={() => router.push("/chat")} className={CTA_CLASSES}>
              Open chat
            </button>
          ) : (
            <button onClick={() => router.push("/sign-in")} className={CTA_CLASSES}>
              Sign in
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
