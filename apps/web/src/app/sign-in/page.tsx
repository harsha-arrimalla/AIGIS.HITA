"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";
import { HitaLogo } from "@/components/hita-logo";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only allow internal paths as redirect targets
  const rawNext = searchParams.get("next") || "/";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const { signInWithEmail, signInWithPassword, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password" | "signup">("magic");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      if (mode === "magic") {
        const { error } = await signInWithEmail(email);
        if (error) setError(error);
        else setStatus("Check your email for a sign-in link.");
      } else if (mode === "password") {
        const { error } = await signInWithPassword(email, password);
        if (error) setError(error);
        else router.push(nextPath);
      } else {
        const { error } = await signUp(email, password);
        if (error) setError(error);
        else setStatus("Check your email to confirm your account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontFamily: "var(--font-body)",
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.55,
    color: "var(--color-ink)",
    backgroundColor: "var(--color-paper)",
    border: "1.5px solid var(--color-border-medium)",
    borderRadius: "var(--radius-md)",
    outline: "none",
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--color-canvas)", padding: 24 }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 400,
          padding: "40px 36px",
          borderRadius: "var(--radius-lg)",
           border: "1px solid var(--color-border-hairline)",
          backgroundColor: "var(--color-paper)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-center gap-2" style={{ marginBottom: 32 }}>
          <div
            className="flex items-center justify-center"
          >
            <HitaLogo size={32} color="var(--color-ink)" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 26,
              fontWeight: 600,
              color: "var(--color-ink)",
            }}
          >
            hita
          </span>
        </div>

        <h1
          className="text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 400,
            color: "var(--color-ink)",
            marginBottom: 4,
          }}
        >
          {mode === "signup" ? "Create an account" : "Welcome back"}
        </h1>
        <p
          className="text-center"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--color-text-secondary)",
            marginBottom: 28,
          }}
        >
          {mode === "magic"
            ? "Sign in with a magic link"
            : mode === "signup"
              ? "Get started with Hita"
              : "Sign in with your password"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-ink)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border-medium)")}
          />

          {(mode === "password" || mode === "signup") && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-ink)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border-medium)")}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{
              width: "100%",
              height: 46,
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--color-on-dark)",
              backgroundColor: "var(--color-ink)",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            {isSubmitting
              ? "..."
              : mode === "magic"
                ? "Send magic link"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
          </button>
        </form>

        {error && (
          <p className="text-center" style={{ marginTop: 14, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-danger)" }}>
            {error}
          </p>
        )}
        {status && (
          <p className="text-center" style={{ marginTop: 14, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-success)" }}>
            {status}
          </p>
        )}

        <div
          className="flex flex-col items-center"
          style={{ marginTop: 20, gap: 6, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-text-secondary)" }}
        >
          {mode === "magic" && (
            <>
              <button onClick={() => setMode("password")} className="underline" style={{ color: "var(--color-text-secondary)" }}>Use password instead</button>
              <button onClick={() => setMode("signup")} className="underline" style={{ color: "var(--color-text-secondary)" }}>Create an account</button>
            </>
          )}
          {mode === "password" && (
            <>
              <button onClick={() => setMode("magic")} className="underline" style={{ color: "var(--color-text-secondary)" }}>Use magic link instead</button>
              <button onClick={() => setMode("signup")} className="underline" style={{ color: "var(--color-text-secondary)" }}>Create an account</button>
            </>
          )}
          {mode === "signup" && (
            <button onClick={() => setMode("magic")} className="underline" style={{ color: "var(--color-text-secondary)" }}>Already have an account? Sign in</button>
          )}
        </div>

        <div className="text-center" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border-hairline)" }}>
          <button
            onClick={() => router.push("/")}
            className="underline"
            style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-ghost)" }}
          >
            Continue without signing in
          </button>
        </div>
      </div>
    </div>
  );
}
