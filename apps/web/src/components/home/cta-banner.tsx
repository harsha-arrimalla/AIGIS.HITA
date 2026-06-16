"use client";

import { useRouter } from "next/navigation";
import { HitaLogo } from "@/components/hita-logo";
import { useAuth } from "@/lib/auth-provider";

export function CtaBanner() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <section aria-label="Get started with Hita" className="bg-surface py-16">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <span className="mb-4 inline-flex items-center justify-center">
          <HitaLogo size={48} color="var(--color-ink)" />
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-[32px] font-medium leading-tight text-ink sm:text-[40px]">
          Your travel companion,<br />whenever you need one
        </h2>
        <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-relaxed text-text-secondary">
          Safety, fares, local tips — all in one chat. Free for what matters most.
        </p>
        <button
          onClick={() => router.push(user ? "/chat" : "/sign-in")}
          className="mt-6 rounded-full bg-ink px-8 py-3 text-[14px] font-semibold text-on-dark transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {user ? "Open chat" : "Get started — it's free"}
        </button>
      </div>
    </section>
  );
}
