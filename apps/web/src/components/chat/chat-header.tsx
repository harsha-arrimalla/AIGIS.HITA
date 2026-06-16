"use client";

import { ArrowLeft, Plus, Menu, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { HitaLogo } from "@/components/hita-logo";

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
    <header
      className="sticky top-0 z-10 flex items-center justify-between"
      style={{
        height: 56,
        padding: "0 16px",
        backgroundColor: "var(--color-canvas)",
        borderBottom: "1px solid var(--color-border-hairline)",
      }}
    >
      <div className="flex items-center gap-1">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center transition-colors"
            style={{ width: 36, height: 36, borderRadius: "var(--radius-full)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            aria-label="Toggle sidebar"
          >
            <Menu style={{ width: 18, height: 18, color: "var(--color-ink)" }} strokeWidth={1.5} />
          </button>
        )}
        <Link
          href="/"
          className="flex items-center justify-center transition-colors"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-full)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          aria-label="Back"
        >
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--color-ink)" }} strokeWidth={1.5} />
        </Link>
      </div>

      <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center"
          >
            <HitaLogo size={22} color="var(--color-ink)" />
          </div>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--color-ink)",
          }}
        >
          hita
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {onToggleSOS && (
          <button
            onClick={onToggleSOS}
            className="relative flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ width: 36, height: 36, borderRadius: "var(--radius-full)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-coral-tint)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            aria-label="Emergency SOS"
          >
            <AlertTriangle style={{ width: 16, height: 16, color: "var(--color-danger)" }} strokeWidth={2} />
          </button>
        )}
        {creditsRemaining != null && (
          <Link
            href="/credits"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-hover)",
              padding: "3px 8px",
              borderRadius: "var(--radius-full)",
              textDecoration: "none",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-border-hairline)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-hover)")}
            aria-label={`${creditsRemaining} credits remaining — buy more`}
          >
            {creditsRemaining} credits
          </Link>
        )}
        <button
          onClick={onNewChat}
          className="flex items-center justify-center transition-colors"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-full)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          aria-label="New conversation"
        >
          <Plus style={{ width: 18, height: 18, color: "var(--color-ink)" }} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
