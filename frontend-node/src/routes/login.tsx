import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeNextPath } from "@/lib/auth";
import { Bot, CheckCircle2, Lock, Mail, Sparkles, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ next: safeNextPath(s["next"]) }),
  head: () => ({
    meta: [
      { title: "Sign in — MF Lens" },
      {
        name: "description",
        content:
          "Sign in or register with your email to access the conversational AI Analyst with 5 free analyses per month.",
      },
      { property: "og:title", content: "Sign in — MF Lens" },
      {
        property: "og:description",
        content: "Sign in or register with your email to access the conversational AI Analyst.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://fundlens.sandipprodhan.in/login" }],
  }),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const targetDestination = next && next !== "/" && next !== "/login" ? next : "/analyst";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "magiclink">("signin");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Handle PKCE code in query if present
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code) {
        setBusy(true);
        void supabase.auth.exchangeCodeForSession(code).then(({ data, error: codeErr }) => {
          setBusy(false);
          if (!codeErr && data.session) {
            window.location.replace(targetDestination);
          }
        });
      }
    }

    // 2. Check existing active session
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.replace(targetDestination);
      }
    });

    // 3. Listen for auth state changes (Magic link, signup confirmation, login)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED")) {
        window.location.replace(targetDestination);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [targetDestination]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setBusy(true);

    try {
      const redirectUrl = `${window.location.origin}/login?next=${encodeURIComponent(targetDestination)}`;

      if (mode === "magiclink") {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (otpErr) throw otpErr;
        setMsg(`We have sent a sign-in link to ${cleanEmail}. Click the link in your email to open the Fund Analyst.`);
      } else if (mode === "signup") {
        if (!password || password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password.trim(),
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (signUpErr) throw signUpErr;

        if (data.session) {
          window.location.replace(targetDestination);
        } else {
          setMsg(
            `Verification email sent to ${cleanEmail}. Please click the confirmation link in your email to activate your account and access the Fund Analyst.`,
          );
        }
      } else {
        // Sign in with password
        if (!password) {
          throw new Error("Please enter your password.");
        }
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password.trim(),
        });
        if (signInErr) throw signInErr;

        if (data.session) {
          window.location.replace(targetDestination);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors shadow-2xs";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 font-sans">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-xl bg-slate-900 text-white font-bold text-sm shadow-sm mb-3">
            <Bot className="size-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {mode === "signup"
              ? "Create MF Lens Account"
              : mode === "magiclink"
              ? "MF Lens Magic Link Login"
              : "MF Lens Login"}
          </h1>
          <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
            Mutual Fund AI Data-Backed Analysis
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Conversational analytics grounded in verified AWS S3 Delta Lake NAV data.
          </p>
        </div>

        {/* Tab Switcher: Sign In / Sign Up */}
        <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setMsg(null);
            }}
            className={`rounded-md py-1.5 transition-all cursor-pointer ${
              mode === "signin" || mode === "magiclink"
                ? "bg-white text-slate-950 font-bold shadow-2xs"
                : "hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setMsg(null);
            }}
            className={`rounded-md py-1.5 transition-all cursor-pointer ${
              mode === "signup" ? "bg-white text-slate-950 font-bold shadow-2xs" : "hover:text-slate-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
              <Mail className="size-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {mode !== "magiclink" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("magiclink");
                      setError(null);
                      setMsg(null);
                    }}
                    className="text-[11px] text-slate-500 underline hover:text-slate-900 cursor-pointer"
                  >
                    Forgot / Use Magic Link
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className={inputClass}
                />
                <Lock className="size-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {busy
              ? "Please wait…"
              : mode === "signup"
              ? "Send Verification Email & Sign Up"
              : mode === "magiclink"
              ? "Send Magic Link"
              : "Sign In"}
          </button>

          {mode === "magiclink" && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setMsg(null);
                }}
                className="text-[11px] text-slate-500 underline hover:text-slate-900 cursor-pointer"
              >
                Back to Sign In with Password
              </button>
            </div>
          )}
        </form>

        {/* Success message */}
        {msg && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
            <p className="text-xs text-slate-900 font-bold">Email Sent</p>
            <p className="text-xs text-slate-600 leading-relaxed">{msg}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg text-center font-medium">
            {error}
          </p>
        )}

        {/* Admin notice hint */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <ShieldCheck className="size-4 text-slate-700 shrink-0" />
          <span>Admin accounts (e.g. <strong>sandipprodhan100@gmail.com</strong>) have unlimited prompts.</span>
        </div>

        {/* Footer legal */}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          By continuing, you agree to our{" "}
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
