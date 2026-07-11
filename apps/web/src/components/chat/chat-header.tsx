"use client";

import { ArrowLeft, Plus, Menu, AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";
import { HitaLogo } from "@/components/hita-logo";

const ICON_BTN =
  "flex h-9 w-9 items-center justify-center rounded-full text-ink transition-all duration-150 hover:bg-tint active:scale-95";

export function ChatHeader({
  creditsRemaining,
  onToggleSidebar,
  onNewChat,
  onToggleSOS,
}: {
  creditsRemaining: number | null;
  onToggleSidebar?: () => void;
  onNewChat?: () => void;
  onToggleSOS?: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border-hairline bg-canvas/85 px-3 backdrop-blur-md">
      <div className="flex items-center gap-0.5">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className={ICON_BTN} aria-label="Toggle sidebar">
            <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        )}
        <Link href="/" className={ICON_BTN} aria-label="Back to home">
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <HitaLogo size={22} color="var(--color-coral)" />
        <span className="font-[family-name:var(--font-display)] text-[17px] font-bold tracking-tight text-ink">
          hita
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {onToggleSOS && (
          <button
            onClick={onToggleSOS}
            className="flex h-9 w-9 items-center justify-center rounded-full text-danger transition-all duration-150 hover:bg-coral-tint hover:scale-110 active:scale-95"
            aria-label="Emergency SOS"
          >
            <AlertTriangle className="h-4 w-4" strokeWidth={2.2} />
          </button>
        )}
        {creditsRemaining != null && (
          <Link
            href="/credits"
            className="flex items-center gap-1 rounded-full border border-coral-medium bg-coral-light px-3 py-1.5 text-[12px] font-bold text-coral transition-all duration-150 hover:shadow-1 hover:brightness-95"
            aria-label={`${creditsRemaining} credits remaining — buy more`}
          >
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {creditsRemaining}
          </Link>
        )}
        <button onClick={onNewChat} className={ICON_BTN} aria-label="New conversation">
          <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
