import { useState } from "react";
import { CheckCircle2, Send, ShieldCheck, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { submitPortfolioRequest } from "@/lib/contact.functions";

export function PortfolioConsultationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [portfolioDetails, setPortfolioDetails] = useState("");
  const [investmentHorizon, setInvestmentHorizon] = useState("3-5 Years");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !portfolioDetails.trim()) {
      setErrorMsg("Please fill in your name, email, and portfolio details.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await submitPortfolioRequest({
        data: {
          name,
          email,
          phone,
          portfolioDetails,
          investmentHorizon,
        },
      });
      setSuccessMsg(res.message);
      setName("");
      setEmail("");
      setPhone("");
      setPortfolioDetails("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit request. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative my-8 overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/10 p-6 shadow-xl sm:p-8">
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Value Proposition */}
        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <ShieldCheck className="size-4" />
              Quantitative Portfolio Health Check
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Know Your Portfolio-Level{" "}
              <span className="text-primary underline decoration-primary/40 decoration-wavy">
                Sharpe, Sortino & Treynor
              </span>{" "}
              Ratios
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Are your mutual funds truly beating the index after adjusting for risk? Get a
              mathematical, data-backed portfolio audit across sideways phases, downside volatility,
              and category benchmark alpha.
            </p>

            {/* Ratio Cards Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background/80 p-3 shadow-sm backdrop-blur">
                <div className="flex items-center gap-1.5 text-xs font-bold text-positive">
                  <TrendingUp className="size-3.5" />
                  Sharpe Ratio
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                  Excess return generated per unit of total portfolio volatility.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background/80 p-3 shadow-sm backdrop-blur">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <BarChart3 className="size-3.5" />
                  Sortino Ratio
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                  Penalises only harmful downside swings, ignoring upside volatility.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background/80 p-3 shadow-sm backdrop-blur col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sideways">
                  <PieChart className="size-3.5" />
                  Treynor Ratio
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                  Risk-adjusted return per unit of systematic market beta.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-muted-foreground">
            🔒 Your data is stored securely in our private S3 data store and used strictly for mathematical analysis.
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="rounded-xl border border-border/80 bg-background/95 p-6 shadow-md backdrop-blur lg:col-span-6">
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="size-12 text-positive" />
              <h3 className="mt-3 text-lg font-bold text-foreground">Analysis Request Received</h3>
              <p className="mt-2 text-sm text-muted-foreground">{successMsg}</p>
              <button
                type="button"
                onClick={() => setSuccessMsg(null)}
                className="mt-6 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <h3 className="text-base font-bold text-foreground">Request Your Portfolio Audit</h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="req-name" className="block text-xs font-medium text-foreground">
                    Full Name *
                  </label>
                  <input
                    id="req-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="req-email" className="block text-xs font-medium text-foreground">
                    Email Address *
                  </label>
                  <input
                    id="req-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="req-phone" className="block text-xs font-medium text-foreground">
                    Phone / WhatsApp (Optional)
                  </label>
                  <input
                    id="req-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="req-horizon" className="block text-xs font-medium text-foreground">
                    Investment Horizon
                  </label>
                  <select
                    id="req-horizon"
                    value={investmentHorizon}
                    onChange={(e) => setInvestmentHorizon(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="1-3 Years">1–3 Years</option>
                    <option value="3-5 Years">3–5 Years</option>
                    <option value="5-10 Years">5–10 Years</option>
                    <option value="10+ Years">10+ Years (Retirement / Long Term)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="req-details" className="block text-xs font-medium text-foreground">
                  Current Mutual Funds & Allocation Details *
                </label>
                <textarea
                  id="req-details"
                  required
                  rows={3}
                  value={portfolioDetails}
                  onChange={(e) => setPortfolioDetails(e.target.value)}
                  placeholder="e.g. Parag Parikh Flexi Cap (30%), Quant Small Cap (20%), HDFC Mid-Cap (25%), ICICI Prudential Bluechip (25%). Monthly SIP: ₹25,000"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {errorMsg && (
                <div className="rounded bg-destructive/15 p-2 text-xs font-medium text-destructive">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? (
                  "Submitting to Data Lake..."
                ) : (
                  <>
                    <Send className="size-4" />
                    Request Comprehensive Portfolio Risk Report
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
