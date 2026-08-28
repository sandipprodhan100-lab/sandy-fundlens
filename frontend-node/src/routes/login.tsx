import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PENDING_NEXT_KEY, safeNextPath } from "@/lib/auth";
import { ArrowRight, Bot, CheckCircle2, Lock, Mail, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNextPath(s["next"]) }),
  head: () => ({
    meta: [
      { title: "Sign in — MF Lens" },
      {
        name: "description",
        content:
          "Sign in to MF Lens with Google or email to access the conversational AI Analyst.",
      },
      { property: "og:title", content: "Sign in — MF Lens" },
      {
        property: "og:description",
        content: "Sign in to MF Lens to chat with the AI Analyst.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace(next);
    });
  }, [next]);

  async function handleGoogleSignIn() {
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

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setMsg(null);
    setBusy(true);

    try {
      window.sessionStorage.setItem(PENDING_NEXT_KEY, next);
    } catch {}

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(next)}`,
      },
    });

    setBusy(false);
    if (otpError) {
      return setError(otpError.message);
    }
    setMagicLinkSent(true);
    setMsg(`We've sent a sign-in link to ${email}. Click the link in your email to sign in.`);
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setMsg(null);
    setBusy(true);

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });
      setBusy(false);
      if (signUpError) return setError(signUpError.message);
      if (data.session) {
        window.location.replace(next);
      } else {
        setMsg("Account created! Check your email to confirm your sign up.");
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      setBusy(false);
      if (signInError) return setError(signInError.message);
      if (data.session) {
        window.location.replace(next);
      }
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors shadow-2xs";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 font-sans">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-xl bg-slate-900 text-white font-bold text-sm shadow-sm mb-3">
            <Bot className="size-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isSignUp ? "Create an account" : "Sign in to MF Lens"}
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Access the conversational AI Analyst with verified mutual fund analytics.
          </p>
        </div>

        {/* 1. Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs"
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>or email</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {/* 2. Email Magic Link or Password */}
        {magicLinkSent ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-900">Sign-in Link Sent</p>
            <p className="text-xs text-slate-600">{msg}</p>
            <button
              type="button"
              onClick={() => {
                setMagicLinkSent(false);
                setMsg(null);
              }}
              className="text-xs text-slate-700 underline font-medium hover:text-slate-900 pt-1 block mx-auto"
            >
              Use a different email
            </button>
          </div>
        ) : usePassword ? (
          <form onSubmit={handlePasswordAuth} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm disabled:opacity-60"
            >
              {busy ? "Signing in…" : isSignUp ? "Sign Up" : "Sign In"}
            </button>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => setIsSignUp((v) => !v)}
                className="underline hover:text-slate-800"
              >
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </button>
              <button
                type="button"
                onClick={() => setUsePassword(false)}
                className="underline hover:text-slate-800"
              >
                Use Magic Link
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm disabled:opacity-60"
            >
              {busy ? "Sending link…" : "Send Sign-in Link"}
            </button>
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setUsePassword(true)}
                className="text-[11px] text-slate-500 underline hover:text-slate-800"
              >
                Or sign in with password
              </button>
            </div>
          </form>
        )}

        {msg && !magicLinkSent && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-center font-medium">
            {msg}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg text-center font-medium">
            {error}
          </p>
        )}

        {/* Footer info */}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          By signing in, you agree to our{" "}
          <a href="/terms" className="underline hover:text-slate-800">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-slate-800">
            Privacy Policy
          </a>
          .
        </p>

      </div>
    </main>
  );
}
