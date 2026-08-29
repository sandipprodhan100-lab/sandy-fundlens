import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeNextPath } from "@/lib/auth";
import { Bot, CheckCircle2, Lock, Mail, Sparkles, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-2xs";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> MF Lens
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/analysis" className="text-xs text-muted-foreground hover:text-foreground">
              Analysis
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-7 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="space-y-1.5 text-center">
            <div className="mx-auto grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm mb-3">
              <Bot className="size-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {mode === "signup"
                ? "Create MF Lens Account"
                : mode === "magiclink"
                ? "MF Lens Magic Link Login"
                : "MF Lens Login"}
            </h1>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto font-medium">
              Mutual Fund AI Data-Backed Analysis
            </p>
            <p className="text-[11px] text-muted-foreground/80 max-w-xs mx-auto">
              Conversational analytics grounded in verified AWS S3 Delta Lake NAV data.
            </p>
          </div>

          {/* Tab Switcher: Sign In / Sign Up */}
          <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-xs font-semibold text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setMsg(null);
              }}
              className={`rounded-md py-1.5 transition-all cursor-pointer ${
                mode === "signin" || mode === "magiclink"
                  ? "bg-card text-foreground font-bold shadow-2xs"
                  : "hover:text-foreground"
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
                mode === "signup" ? "bg-card text-foreground font-bold shadow-2xs" : "hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-foreground/90 mb-1 block">
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
                <Mail className="size-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {mode !== "magiclink" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground/90 block">
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
                      className="text-[11px] text-muted-foreground underline hover:text-foreground cursor-pointer"
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
                  <Lock className="size-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
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
                  className="text-[11px] text-muted-foreground underline hover:text-foreground cursor-pointer"
                >
                  Back to Sign In with Password
                </button>
              </div>
            )}
          </form>

          {/* Success message */}
          {msg && (
            <div className="p-4 rounded-xl bg-muted border border-border text-center space-y-2">
              <CheckCircle2 className="size-6 text-positive mx-auto" />
              <p className="text-xs text-foreground font-bold">Email Sent</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{msg}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg text-center font-medium">
              {error}
            </p>
          )}

          {/* Admin notice hint */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border text-[11px] text-muted-foreground">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <span>Admin accounts (e.g. <strong>sandipprodhan100@gmail.com</strong>) have unlimited prompts.</span>
          </div>

          {/* Footer legal */}
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        © {new Date().getFullYear()} MF Lens · Quantitative Mutual Fund Research
      </footer>
    </div>
  );
}
