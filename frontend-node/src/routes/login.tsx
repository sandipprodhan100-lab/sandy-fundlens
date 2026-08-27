import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { PENDING_NEXT_KEY, safeNextPath } from "@/lib/auth";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/otp.functions";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNextPath(s["next"]) }),
  head: () => ({
    meta: [
      { title: "Sign in — MF Lens" },
      {
        name: "description",
        content:
          "Sign in to MF Lens with Google or an Indian mobile OTP to unlock the full sideways-market fund analysis and the AI analyst.",
      },
      { property: "og:title", content: "Sign in — MF Lens" },
      {
        property: "og:description",
        content:
          "Sign in to MF Lens to unlock every sideways window, holdings, manager profiles, PDF reports and the AI analyst.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, follow" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://mutualfundlens.lovable.app/login" }],
  }),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace(next);
    });
  }, [next]);

  async function google() {
    setError(null);
    try {
      window.sessionStorage.setItem(PENDING_NEXT_KEY, next);
    } catch {
      /* storage unavailable — fall back to landing on "/" */
    }
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) return setError(oauthError.message);
    if (data.url) window.location.assign(data.url);
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setBusy(true);
    const res = await requestPhoneOtp({ data: { phone } });
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Could not send the code.");
    setSent(true);
    setMsg(`We sent a 6-digit code to ${res.phone}. It expires in 10 minutes.`);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await verifyPhoneOtp({ data: { phone, code: otp } });
    if (!res.ok || !res.password || !res.phone) {
      setBusy(false);
      return setError(res.error ?? "Could not verify that code.");
    }
    const { error: err } = await supabase.auth.signInWithPassword({
      phone: res.phone,
      password: res.password,
    });
    setBusy(false);
    if (err) return setError(err.message);
    window.location.replace(next);
  }

  const inputClass =
    "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-foreground">Sign in to MF Lens</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Signing in unlocks the Pro features — every sideways window, holdings, manager profiles,
        PDF reports and the full AI analyst.
      </p>

      <button
        type="button"
        onClick={google}
        className="mt-6 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
      >
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or mobile OTP
        <span className="h-px flex-1 bg-border" />
      </div>

      {!sent ? (
        <form onSubmit={sendCode} className="space-y-3">
          <input
            type="tel"
            inputMode="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile number (e.g. 9876543210)"
            maxLength={16}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            className={`${inputClass} tracking-[0.2em]`}
          />
          <button
            type="submit"
            disabled={busy || otp.length < 6}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setOtp("");
              setMsg(null);
              setError(null);
            }}
            className="w-full text-xs text-muted-foreground underline"
          >
            Use a different number
          </button>
        </form>
      )}

      {msg ? <p className="mt-4 text-sm text-muted-foreground">{msg}</p> : null}
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <p className="mt-8 text-xs text-muted-foreground">
        MF Lens is an analysis tool, not investment advice. Mutual fund investments are subject to
        market risks. By signing in you agree to our{" "}
        <a href="/terms" className="underline hover:text-foreground">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </a>
        . Mobile numbers are used only to deliver your one-time passcode.
      </p>

    </main>
  );
}
