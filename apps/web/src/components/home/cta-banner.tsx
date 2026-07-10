"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";

export function CtaBanner() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <section aria-label="Get started with Hita" className="px-6 py-16">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[40px] bg-gradient-to-br from-coral via-[#FF7A55] to-amber px-6 py-16 text-center shadow-3 sm:py-20">
        {/* ambient shapes */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="animate-blob absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="animate-blob absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-white/10" style={{ animationDelay: "5s" }} />
        </div>

        <div className="relative">
          <h2 className="font-[family-name:var(--font-display)] text-[36px] font-bold leading-tight text-on-coral sm:text-[52px]">
            Never travel like a<br />stranger again
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[16px] leading-relaxed text-on-coral/90">
            Safety, fares, dinner, and someone to talk to — all in one chat.
            Free for what matters most.
          </p>
          <button
            onClick={() => router.push(user ? "/chat" : "/sign-in")}
            className="mt-8 rounded-full bg-raised px-9 py-4 text-[15.5px] font-bold text-coral shadow-elevated transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(43,27,44,0.28)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {user ? "Open chat" : "Get started — it's free"}
          </button>
          <p className="mt-4 text-[13px] text-on-coral/75">No app download · No card required</p>
        </div>
      </div>
    </section>
  );
}
