import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
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

  // Quick Consultation State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleConsultationSubmit(e: React.FormEvent) {
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
          phone: company.trim() || "Consulting Inquiry",
          allocations: `Enterprise Consulting Inquiry: ${message.trim() || "General Architecture Advisory"}`,
          horizon: "Consulting Engagement",
        },
      });
      setSubmitted(true);
      toast.success("Thank you! Your consultation request has been received. Sandip will contact you shortly.");
    } catch {
      toast.error("Could not send request right now. Please email directly to sandipprodhan100@gmail.com");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Dynamic Ambient Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[140px]" />
        <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-teal-600/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Floating Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/85 border-b border-slate-800/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/35 text-emerald-400 font-bold text-sm shadow-sm shadow-emerald-950/40">
              SP
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                Sandip Prodhan
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/25">
                  Available for Advisory
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Enterprise Integration &amp; AI Solutions Advisory
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-xs text-slate-300 font-medium">
            <a href="#offerings" className="hover:text-emerald-400 transition-colors">
              Consulting Offerings
            </a>
            <a href="#impact" className="hover:text-emerald-400 transition-colors">
              Measurable ROI
            </a>
            <a href="#flagship" className="hover:text-emerald-400 transition-colors text-emerald-300 font-semibold">
              Live Flagship App
            </a>
            <a href="#landscape" className="hover:text-emerald-400 transition-colors">
              Tech Landscape
            </a>
            <a href="#consultation" className="hover:text-emerald-400 transition-colors">
              Engage Advisory
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#consultation"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all shadow-sm"
            >
              <MessageSquare className="size-3.5 text-emerald-400" />
              <span>Book Advisory</span>
            </a>

            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-950/50 transition-all"
            >
              <span>MF Lens Platform</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 space-y-24">
        
        {/* 1. HERO — STRATEGIC CONSULTING PROPOSITION */}
        <section className="relative space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 shadow-inner">
            <Sparkles className="size-3.5 animate-pulse" />
            <span>Strategic Architecture Consulting &amp; AI Enablement Practice</span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
              Architecting Resilient, High-Throughput{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Enterprise Integration &amp; Agentic AI
              </span>{" "}
              Ecosystems.
            </h1>
            <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-normal">
              Empowering enterprise leaders to modernize legacy middleware, unify hybrid multi-cloud landscapes (Oracle OIC/SOA, AWS, Azure), and operationalize autonomous GenAI agentic workflows with guaranteed uptime and institutional governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/90 px-3.5 py-2 rounded-lg shadow-sm">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Former Sole Integration Authority for Selfridges (8+ Years)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/90 px-3.5 py-2 rounded-lg shadow-sm">
              <Award className="size-4 text-teal-400" />
              <span>250+ Enterprise Pipelines Delivered (98%+ Go-Live Success)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/90 px-3.5 py-2 rounded-lg shadow-sm">
              <MapPin className="size-4 text-cyan-400" />
              <span>UK Based · Global Consulting Reach</span>
            </div>
          </div>
        </section>

        {/* 2. CORE CONSULTING SERVICE OFFERINGS (FLOATING CARDS) */}
        <section id="offerings" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Advisory &amp; Execution
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Strategic Consulting Offerings
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Specialized advisory designed to eliminate architectural debt, accelerate delivery velocity, and unlock GenAI automation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Offering 1 */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/90 p-7 hover:border-emerald-500/40 transition-all duration-300 shadow-xl hover:shadow-emerald-950/20 space-y-4">
              <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Network className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Enterprise Integration Strategy &amp; Cloud Modernization
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Complete architectural overhaul and modernization of fragmented enterprise systems. Seamless orchestration across <strong>Oracle Integration Cloud (OIC)</strong>, <strong>SOA Suite</strong>, <strong>ODI</strong>, <strong>AWS</strong>, and <strong>Azure</strong>.
              </p>
              <ul className="space-y-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Legacy middleware decoupling &amp; cloud migration roadmaps</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Canonical data models &amp; reusable API interface frameworks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Zero-downtime cutovers for mission-critical trading &amp; retail hubs</span>
                </li>
              </ul>
            </div>

            {/* Offering 2 */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/90 p-7 hover:border-cyan-500/40 transition-all duration-300 shadow-xl hover:shadow-cyan-950/20 space-y-4">
              <div className="size-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Brain className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                AI-Native Integration &amp; Agentic System Orchestration
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Transforming traditional static pipelines into intelligent, autonomous event networks using <strong>Model Context Protocol (MCP)</strong>, <strong>ReAct loops</strong>, and <strong>LangGraph multi-agent systems</strong>.
              </p>
              <ul className="space-y-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-cyan-400 shrink-0" />
                  <span>Autonomous exception triage &amp; self-healing integration pipelines</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-cyan-400 shrink-0" />
                  <span>Enterprise RAG &amp; LLM tool orchestration with strict compliance guardrails</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-cyan-400 shrink-0" />
                  <span>Agentic message dispatchers with real-time auditability</span>
                </li>
              </ul>
            </div>

            {/* Offering 3 */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/90 p-7 hover:border-teal-500/40 transition-all duration-300 shadow-xl hover:shadow-teal-950/20 space-y-4">
              <div className="size-12 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <Database className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                High-Velocity Streaming &amp; Data Lake Architectures
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Architecting sub-second analytical and operational data planes. High-throughput ingestion pipelines converting raw feeds into columnar <strong>Parquet Lakehouses</strong> and <strong>TimescaleDB</strong> time-series engines.
              </p>
              <ul className="space-y-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-teal-400 shrink-0" />
                  <span>Sub-50ms query latency over terabyte-scale financial and order logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-teal-400 shrink-0" />
                  <span>Event-driven streaming with Kafka, SQS, and Cloudflare edge workers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-teal-400 shrink-0" />
                  <span>Data lake schema enforcement and automated snapshot lifecycle</span>
                </li>
              </ul>
            </div>

            {/* Offering 4 */}
            <div className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/90 p-7 hover:border-amber-500/40 transition-all duration-300 shadow-xl hover:shadow-amber-950/20 space-y-4">
              <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Architecture Health Audits &amp; Critical Project Rescue
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Objective evaluation of enterprise middleware health, throughput bottlenecks, payload vulnerabilities, and delivery risk. Fast turnaround stabilization for distressed IT transformations.
              </p>
              <ul className="space-y-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400 shrink-0" />
                  <span>Thorough latency, concurrency, and security vulnerability analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400 shrink-0" />
                  <span>Actionable remediation roadmap with prioritized high-ROI milestones</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400 shrink-0" />
                  <span>Architecture review board (ARB) governance standards setup</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. MEASURABLE CLIENT IMPACT & PROVEN ROI */}
        <section id="impact" className="space-y-6">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900/95 via-[#0b1019] to-slate-900/95 border border-slate-800/90 shadow-2xl space-y-8">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Track Record
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Measurable Enterprise ROI &amp; Outcomes
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400">250+</div>
                <div className="text-xs font-semibold text-slate-200">Pipelines Governed</div>
                <p className="text-[11px] text-slate-400">Across Oracle Cloud, AWS, &amp; Azure</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-teal-400">98.4%</div>
                <div className="text-xs font-semibold text-slate-200">First-Time Go-Live Success</div>
                <p className="text-[11px] text-slate-400">Zero critical production rollbacks</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-400">53%</div>
                <div className="text-xs font-semibold text-slate-200">Component Reuse</div>
                <p className="text-[11px] text-slate-400">Halved new interface build time</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400">&lt;50ms</div>
                <div className="text-xs font-semibold text-slate-200">Edge Analytics Latency</div>
                <p className="text-[11px] text-slate-400">Optimized S3 Lakehouse query engine</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FEATURED LIVE FLAGSHIP PLATFORM (LIVE PROOF OF WORK) */}
        <section id="flagship" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Live Flagship Proof of Work
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                MF Lens Intelligence Platform
              </h2>
            </div>
            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Explore Live Platform</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#090d14] border-2 border-emerald-500/35 p-7 sm:p-9 space-y-6 shadow-2xl shadow-emerald-950/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-md">
                  <Activity className="size-3.5" />
                  <span>Production Quantitative Engine</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  Institutional Mutual Fund Analytics &amp; AI Screening
                </h3>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  A high-throughput quantitative intelligence tool tracking flat market regimes across all 24 AMFI fund categories &amp; benchmark combinations with sub-50ms retrieval via AWS S3 data lake.
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

            <div className="grid sm:grid-cols-3 gap-5 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/70 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Bot className="size-4 text-emerald-400" />
                  <span>GenAI Analyst Agent</span>
                </div>
                <p className="text-slate-400 text-[11.5px] leading-snug">
                  Autonomous ReAct synthesis loop generating structured markdown analysis from AMFI NAV data points.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/70 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Database className="size-4 text-teal-400" />
                  <span>S3 Columnar Lakehouse</span>
                </div>
                <p className="text-slate-400 text-[11.5px] leading-snug">
                  Direct Parquet readers and precomputed snapshot caches for instantaneous multi-window evaluations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/70 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Zap className="size-4 text-cyan-400" />
                  <span>Institutional Risk Models</span>
                </div>
                <p className="text-slate-400 text-[11.5px] leading-snug">
                  Sharpe, Sortino, Treynor ratios, maximum drawdown, and portfolio-level risk allocation modules.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. TECHNOLOGY LANDSCAPE & ADVISORY COMPETENCIES */}
        <section id="landscape" className="space-y-6">
          <div className="space-y-1 border-b border-slate-800/80 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Technology Stack
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Enterprise Technology Landscape
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Tech 1 */}
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase font-mono">
                Oracle Ecosystem
              </div>
              <div className="text-sm font-semibold text-white">
                Oracle Integration Cloud (OIC) · SOA Suite 12c · ODI 12c
              </div>
              <p className="text-xs text-slate-400">
                EBS R12, Fusion ERP, WMS, Retail (MOM/RMS), PL/SQL optimization, XML/XSLT transformations.
              </p>
            </div>

            {/* Tech 2 */}
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-teal-400 uppercase font-mono">
                Cloud &amp; Messaging
              </div>
              <div className="text-sm font-semibold text-white">
                AWS (S3, Lambda, SQS, Glue) · Azure · Kafka · IBM MQ
              </div>
              <p className="text-xs text-slate-400">
                High-concurrency pub/sub event hubs, dead-letter routing, and multi-region failover.
              </p>
            </div>

            {/* Tech 3 */}
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-cyan-400 uppercase font-mono">
                AI &amp; Agentic Stack
              </div>
              <div className="text-sm font-semibold text-white">
                Model Context Protocol (MCP) · LangGraph · ReAct · Gemini
              </div>
              <p className="text-xs text-slate-400">
                Enterprise agent tools, schema validation, structured function calling, and RAG pipelines.
              </p>
            </div>

            {/* Tech 4 */}
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase font-mono">
                Data Lakehouse &amp; DBs
              </div>
              <div className="text-sm font-semibold text-white">
                Apache Parquet · TimescaleDB · PostgreSQL · Hyparquet
              </div>
              <p className="text-xs text-slate-400">
                Columnar storage design, partitioning, compression algorithms, and streaming sync.
              </p>
            </div>

            {/* Tech 5 */}
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-teal-400 uppercase font-mono">
                Modern Full-Stack
              </div>
              <div className="text-sm font-semibold text-white">
                TypeScript · Python (FastAPI) · React · Cloudflare Workers
              </div>
              <p className="text-xs text-slate-400">
                High-performance edge APIs, micro-frontends, Nitro SSR, and serverless compute.
              </p>
            </div>

            {/* Tech 6 */}
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-cyan-400 uppercase font-mono">
                Governance &amp; CI/CD
              </div>
              <div className="text-sm font-semibold text-white">
                Enterprise ARB · GitHub Actions · Docker · Terraform
              </div>
              <p className="text-xs text-slate-400">
                Automated release pipelines, regression test suites, and compliance documentation.
              </p>
            </div>
          </div>
        </section>

        {/* 6. ENGAGEMENT MODELS & CONSULTATION BOOKING */}
        <section id="consultation" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Initiate Advisory
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Consulting Engagement Options
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Flexible engagement models tailored for strategic leadership, enterprise project delivery, and architecture audits.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Engagement Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3">
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                Phase 1 Advisory
              </div>
              <h3 className="text-base font-bold text-white">
                Architecture &amp; Health Audit
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                2 to 4 week comprehensive review of existing integration topology, throughput bottlenecks, security posture, and modernization roadmap.
              </p>
            </div>

            {/* Engagement Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/40 space-y-3 relative shadow-lg shadow-emerald-950/20">
              <div className="inline-flex rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 uppercase">
                Most Requested
              </div>
              <h3 className="text-base font-bold text-white">
                Fractional Integration Authority
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Strategic technical leadership for ongoing major transformation programs, vendor evaluation, design approvals, and team governance.
              </p>
            </div>

            {/* Engagement Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3">
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase">
                Targeted Delivery
              </div>
              <h3 className="text-base font-bold text-white">
                GenAI &amp; Event Pipeline Build
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hands-on delivery of production-grade agentic AI workflows, MCP server integrations, or streaming data lake implementations.
              </p>
            </div>
          </div>

          {/* Interactive Consultation Form */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/95 to-[#0b0f17] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="size-5 text-emerald-400" />
                <span>Book an Initial Strategic Discussion</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Direct inquiry with Sandip Prodhan. Response within 24 hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm space-y-2">
                <p className="font-bold">✓ Consultation Request Received</p>
                <p className="text-xs text-emerald-400/90">
                  Thank you, {name}. Sandip will review your project requirements and follow up shortly at {email}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. David Sterling"
                    className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. david@enterprise.com"
                    className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Global Retail Group / FinTech Corp"
                    className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                    Key Challenges or Integration Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Briefly describe your integration landscape, migration goals, or AI initiatives..."
                    className="w-full rounded-lg bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-950/60 disabled:opacity-50"
                  >
                    <span>{submitting ? "Sending..." : "Submit Consultation Request"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>

                  <a
                    href="mailto:sandipprodhan100@gmail.com"
                    className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    Or direct email: <span className="font-mono text-slate-300">sandipprodhan100@gmail.com</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </section>

      </main>

      {/* Modern Footer */}
      <footer className="mt-20 border-t border-slate-800/80 bg-[#05070a] py-10 px-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-200">Sandip Prodhan</span> · Enterprise Integration &amp; AI Advisory
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
