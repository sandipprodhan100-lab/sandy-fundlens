import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Bot, Database, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "MF Lens Pro — Institutional Analytics Suite" },
      {
        name: "description",
        content:
          "Explore MF Lens Pro: advanced sideways regime tracking, multi-category alpha attribution, longitudinal manager analytics, and S3 delta lake APIs.",
      },
      { property: "og:title", content: "MF Lens Pro — Institutional Analytics Suite" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://fundlens.sandipprodhan.in/pricing" }],
  }),
  component: ProShowcasePage,
});

function ProShowcasePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans py-16 px-4">
      <div className="mx-auto max-w-5xl space-y-12">
        
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold shadow-xs">
            <Sparkles className="size-3.5 text-amber-400" /> MF Lens Pro & Enterprise
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Institutional Quantitative Analytics & Conversational AI
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Engineered on top of an AWS S3 Delta Lake data plane, MF Lens isolates market regimes, stress-tests mutual fund alpha, and delivers verified quantitative intelligence for wealth managers and quant teams.
          </p>
        </div>

        {/* Feature Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Standard Free Tier */}
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Standard Access</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">Active</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Research Terminal</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Core quantitative ranking and interactive calculators across all Indian equity mutual fund categories.
              </p>
              <ul className="space-y-2.5 pt-2 text-xs text-slate-700">
                {[
                  "Active sideways phase screening",
                  "Sharpe, Sortino, Treynor & Max Drawdown",
                  "Category leaderboard & fund comparison",
                  "5 Free AI Analyst queries per month",
                  "SIP / Lump-sum return calculators",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full bg-white text-slate-900 border-slate-300 font-bold cursor-pointer">
              <Link to="/analysis">Open Free Terminal</Link>
            </Button>
          </div>

          {/* Pro / Enterprise Tier */}
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-7 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg tracking-widest">
              Pro Suite
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Enterprise & Institutional</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Institutional Pro</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deep longitudinal history, automated rebalancing stress testing, and real-time S3 Delta Lake API feeds.
              </p>
              <ul className="space-y-2.5 pt-2 text-xs text-slate-700">
                {[
                  "Unlimited AI Analyst queries with direct Delta Lake grounding",
                  "Multi-category historical sideways radar & regime shift alerts",
                  "Top-10 stock holdings & sector concentration drift",
                  "10-year fund manager track record & alpha attribution",
                  "Automated PDF quantitative reports with institutional branding",
                  "REST & Model Context Protocol (MCP) data APIs",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 font-medium">
                    <CheckCircle2 className="size-4 text-indigo-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer">
              <a href="https://sandipprodhan.in/#consultation" target="_blank" rel="noopener noreferrer">
                Request Pro / Enterprise Access <ArrowRight className="size-4 ml-1.5" />
              </a>
            </Button>
          </div>

        </div>

        {/* Enterprise Architecture Notice */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-sm font-bold text-slate-900">Looking for Custom Data Pipelines or AI Integration?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We design custom enterprise integration pipelines, AWS S3 / Azure Databricks lakes, and agentic AI architectures tailored to your fund mandate.
            </p>
          </div>
          <Button asChild variant="outline" className="bg-slate-50 border-slate-300 font-bold cursor-pointer">
            <a href="https://sandipprodhan.in/#consultation" target="_blank" rel="noopener noreferrer">
              Schedule Architecture Consultation
            </a>
          </Button>
        </div>

      </div>
    </div>
  );
}
