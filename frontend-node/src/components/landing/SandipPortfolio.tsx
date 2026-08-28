import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bot,
  Brain,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  GitBranch,
  Globe,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { submitPortfolioRequest } from "@/lib/contact.functions";

export function SandipPortfolio() {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("192.168."));
  const fundLensAppUrl = isLocal ? "/?app=fundlens" : "https://fundlens.sandipprodhan.in";

  // Contact Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please provide your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      await submitPortfolioRequest({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: subject.trim() || "General Inquiry",
          allocations: `Contact Message: ${message.trim() || "Consulting & Collaboration Inquiry"}`,
          horizon: "Direct Inquiry",
        },
      });
      setSubmitted(true);
      toast.success("Thank you! Your message has been received. Sandip will get back to you shortly.");
    } catch {
      toast.error("Could not send request right now. Please email directly to sandipprodhan100@gmail.com");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* ── STICKY TOP NAVIGATION ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/85 border-b border-slate-800/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/35 text-emerald-400 font-bold text-sm shadow-sm shadow-emerald-950/40">
              SP
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                Sandip Prodhan
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/25">
                  Available
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Integration Consultant &amp; AI Enabler
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs text-slate-300 font-medium">
            <a href="#expertise" className="hover:text-emerald-400 transition-colors">
              Core Tech Areas
            </a>
            <a href="#research" className="hover:text-emerald-400 transition-colors text-emerald-300 font-semibold">
              Research (MF Lens)
            </a>
            <a href="#impact" className="hover:text-emerald-400 transition-colors">
              Impact &amp; ROI
            </a>
            <a href="#contact" className="hover:text-emerald-400 transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all shadow-sm"
            >
              <Mail className="size-3.5 text-emerald-400" />
              <span>Contact</span>
            </a>

            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-950/50 transition-all"
            >
              <span>MF Lens App</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: HERO (THEME 1 - DEEP OBSIDIAN #07090e) ── */}
      <section className="relative bg-[#07090e] border-b border-slate-800/60 py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_0%,rgba(16,185,129,0.08),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 shadow-inner">
            <Sparkles className="size-3.5 animate-pulse" />
            <span>Integration Consultant &amp; AI Enabler</span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.14]">
              Reliable Enterprise Integration, Modern Data Engineering &amp;{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                AI Enablement.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-3xl">
              14+ years of hands-on expertise delivering mission-critical <strong className="text-white font-semibold">Oracle Middleware Integrations</strong>, building scalable data pipelines across <strong className="text-white font-semibold">AWS &amp; Azure</strong> (dbt, Databricks), automating release governance with <strong className="text-white font-semibold">CI/CD &amp; DevOps</strong>, and enabling agentic AI workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono text-slate-400 pt-2">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-lg shadow-sm">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Former Sole Integration Authority for Selfridges (8+ Years)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-lg shadow-sm">
              <Award className="size-4 text-teal-400" />
              <span>Oracle Certified OIC &amp; SOA Specialist</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-lg shadow-sm">
              <MapPin className="size-4 text-cyan-400" />
              <span>Leicester, UK</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CORE TECH & WORK AREAS (THEME 2 - MIDNIGHT NAVY #0b111e) ── */}
      <section id="expertise" className="relative bg-[#0b111e] border-b border-slate-800/80 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Core Specializations
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Work &amp; Technology Areas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Focused, reliable, and enterprise-proven technical capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Card 1: Oracle Middleware */}
            <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-7 space-y-4 hover:border-emerald-500/40 transition-all shadow-xl">
              <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Network className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Oracle Middleware Integration Products
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Deep expertise architecting, developing, and governing high-volume enterprise integration workflows across Oracle Cloud and on-prem landscapes.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Oracle Integration Cloud (OIC)</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">SOA Suite 12c</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">ODI 12c</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Oracle Service Bus (OSB)</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">PL/SQL Optimization</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">XML / XSLT</span>
              </div>
            </div>

            {/* Card 2: Data Engineering AWS & Azure */}
            <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-7 space-y-4 hover:border-cyan-500/40 transition-all shadow-xl">
              <div className="size-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <Database className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Data Engineering with AWS &amp; Azure (dbt, Databricks)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Building scalable, governed analytical data planes, columnar lakehouses, and real-time streaming ingestion pipelines across multi-cloud environments.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">dbt (Data Build Tool)</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Databricks</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Apache Spark</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">AWS (S3, Glue, Lambda, Athena)</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Azure Data Factory</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Parquet Lakehouse</span>
              </div>
            </div>

            {/* Card 3: Python & SQL */}
            <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-7 space-y-4 hover:border-teal-500/40 transition-all shadow-xl">
              <div className="size-11 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
                <Code2 className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Python &amp; Advanced SQL Proficiencies
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Production-grade backend services, asynchronous workers, mathematical risk models, and complex analytical SQL for sub-second query performance.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Python 3.11+ / FastAPI</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Pandas &amp; NumPy</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Complex Analytical SQL</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">TimescaleDB / PostgreSQL</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Query Plan Tuning</span>
              </div>
            </div>

            {/* Card 4: CI/CD & DevOps */}
            <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-7 space-y-4 hover:border-amber-500/40 transition-all shadow-xl">
              <div className="size-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <GitBranch className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                CI/CD Implementation &amp; DevOps Practice
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Automating end-to-end integration deployments, test automation, infrastructure-as-code provisioning, and zero-downtime release pipelines.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">GitHub Actions</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Jenkins Pipelines</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Docker &amp; Containers</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Terraform (IaC)</span>
                <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">Cloudflare Workers</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 3: RESEARCH PROJECT — MF LENS & MEDALLION ARCHITECTURE (THEME 1 - DEEP OBSIDIAN #07090e) ── */}
      <section id="research" className="relative bg-[#07090e] border-b border-slate-800/60 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Independent Research Project
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                DevOps &amp; AI Enablement with Medallion Architecture
              </h2>
            </div>
            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Explore Live Research Platform</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>

          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#090e17] border-2 border-emerald-500/35 p-7 sm:p-9 space-y-8 shadow-2xl shadow-emerald-950/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-md">
                  <Activity className="size-3.5" />
                  <span>Featured Case Study: Mutual Fund Lens Platform</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  Quantitative Screener &amp; AI Analyst Engine
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  A high-throughput quantitative platform that detects sideways market regimes and ranks funds on risk-adjusted alpha (Sharpe, Sortino, Treynor, Drawdown) with sub-50ms query latency over AWS S3.
                </p>
              </div>

              <a
                href={fundLensAppUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3.5 text-sm font-bold text-slate-950 hover:brightness-110 transition-all shadow-xl shadow-emerald-500/20 shrink-0"
              >
                <span>Launch Live Terminal</span>
                <ArrowUpRight className="size-4" />
              </a>
            </div>

            {/* Medallion Architecture Steps */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Implemented Medallion Data Lake Pipeline
              </h4>
              
              <div className="grid sm:grid-cols-3 gap-4">
                
                {/* Bronze */}
                <div className="p-5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-400 uppercase">Bronze Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">Raw Ingestion</span>
                  </div>
                  <div className="text-sm font-semibold text-white">Daily Automated Ingest</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Automated GitHub Actions cron jobs pulling daily raw AMFI NAV feeds and official factsheets directly into raw S3 buckets.
                  </p>
                </div>

                {/* Silver */}
                <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-400/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-300 uppercase">Silver Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">Cleaned Parquet</span>
                  </div>
                  <div className="text-sm font-semibold text-white">Columnar Partitioning</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hyparquet transform pipeline standardizing scheme history, cleansing missing dates, and building partitioned columnar parquet tables.
                  </p>
                </div>

                {/* Gold */}
                <div className="p-5 rounded-xl bg-slate-950/80 border border-emerald-500/35 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-emerald-400 uppercase">Gold Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">AI &amp; Analytics</span>
                  </div>
                  <div className="text-sm font-semibold text-white">Precomputed Snapshots &amp; AI</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Precomputed multi-window metrics (&lt;50ms) paired with autonomous ReAct Gemini AI analyst agents for verifiable quantitative insights.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 4: IMPACT & ROI (THEME 2 - MIDNIGHT NAVY #0b111e) ── */}
      <section id="impact" className="relative bg-[#0b111e] border-b border-slate-800/80 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-8">
          
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Proven Track Record
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Measurable Enterprise Delivery &amp; Reliability
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400">250+</div>
              <div className="text-xs font-semibold text-slate-200">Integration Pipelines</div>
              <p className="text-[11px] text-slate-400">Governed across Oracle, AWS &amp; Azure</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-teal-400">98.4%</div>
              <div className="text-xs font-semibold text-slate-200">First-Time Go-Live Success</div>
              <p className="text-[11px] text-slate-400">Zero critical production rollbacks</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-400">8+ Yrs</div>
              <div className="text-xs font-semibold text-slate-200">Selfridges Integration Lead</div>
              <p className="text-[11px] text-slate-400">Sole integration authority</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400">53%</div>
              <div className="text-xs font-semibold text-slate-200">Component Reuse</div>
              <p className="text-[11px] text-slate-400">Reduced enterprise interface costs</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 5: CONTACT & COLLABORATION (THEME 1 - DEEP OBSIDIAN #07090e) ── */}
      <section id="contact" className="relative bg-[#07090e] py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Get in Touch
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Contact &amp; Collaboration
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Reach out for integration consulting, data engineering projects, or technical inquiries.
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-b from-slate-900/95 to-[#0b0f17] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl max-w-3xl">
            {submitted ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm space-y-2">
                <p className="font-bold">✓ Message Received</p>
                <p className="text-xs text-emerald-400/90">
                  Thank you, {name}. Sandip has received your note and will follow up shortly at {email}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Subject / Area of Interest
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Oracle OIC Integration / Cloud Data Lake / DevOps CI/CD"
                    className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell me about your project, integration landscape, or inquiry..."
                    className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-950/60 disabled:opacity-50"
                  >
                    <span>{submitting ? "Sending..." : "Send Message"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>

                  <a
                    href="mailto:sandipprodhan100@gmail.com"
                    className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    Direct email: <span className="font-mono text-slate-300">sandipprodhan100@gmail.com</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/80 bg-[#05070a] py-8 px-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-200">Sandip Prodhan</span> · Integration Consultant &amp; AI Enabler
          </div>
          <div className="flex items-center gap-6">
            <a
              href="mailto:sandipprodhan100@gmail.com"
              className="hover:text-emerald-400 transition-colors"
            >
              sandipprodhan100@gmail.com
            </a>
            <a
              href="https://linkedin.com/in/sandip-prodhan-17790427"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <span>LinkedIn</span>
              <ExternalLink className="size-3" />
            </a>
            <a
              href={fundLensAppUrl}
              className="hover:text-emerald-400 transition-colors text-emerald-400 font-semibold"
            >
              Fund Lens App
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
