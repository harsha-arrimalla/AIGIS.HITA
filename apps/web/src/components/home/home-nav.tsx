"use client";

import { useRouter } from "next/navigation";
import { HitaLogo } from "@/components/hita-logo";
import { useAuth } from "@/lib/auth-provider";

export function HomeNav() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border-hairline bg-canvas">
      <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2 select-none">
          <span className="flex items-center justify-center">
            <HitaLogo size={24} color="var(--color-ink)" />
          </span>
          <span className="text-[17px] font-bold tracking-tight text-ink">hita</span>
        </a>
        <div className="flex items-center gap-5">
          {user ? (
            <button
              onClick={() => router.push("/chat")}
              className="rounded-full bg-ink px-5 py-2 text-[13px] font-semibold text-on-dark transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Open chat
            </button>
          ) : (
            <button
              onClick={() => router.push("/sign-in")}
              className="rounded-full bg-ink px-5 py-2 text-[13px] font-semibold text-on-dark transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
