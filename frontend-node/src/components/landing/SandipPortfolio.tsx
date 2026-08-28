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
  FileCode,
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
          phone: subject.trim() || "Consulting & Project Inquiry",
          allocations: `Contact Message: ${message.trim() || "Enterprise Integration & AI Enablement"}`,
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ── STICKY TOP NAVIGATION (LIGHT GLASS) ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/80 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm shadow-emerald-600/20">
              SP
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                Sandip Prodhan
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  Available
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Integration Consultant &amp; AI Enabler
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs text-slate-600 font-medium">
            <a href="#expertise" className="hover:text-emerald-700 transition-colors">
              Core Tech Areas
            </a>
            <a href="#ai-enablement" className="hover:text-emerald-700 transition-colors">
              AI Enablement &amp; MCP
            </a>
            <a href="#research" className="hover:text-emerald-700 transition-colors text-emerald-700 font-semibold">
              Research (MF Lens)
            </a>
            <a href="#impact" className="hover:text-emerald-700 transition-colors">
              Impact &amp; Delivery
            </a>
            <a href="#contact" className="hover:text-emerald-700 transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
            >
              <Mail className="size-3.5 text-emerald-600" />
              <span>Contact</span>
            </a>

            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-700/20 transition-all"
            >
              <span>MF Lens App</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: HERO (LIGHT OFF-WHITE #ffffff) ── */}
      <section className="relative bg-white border-b border-slate-200/80 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
        
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
            <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
            <span>Integration Consultant &amp; AI Enabler</span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
              Enterprise Integration, Modern Data Pipelines &amp;{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700">
                AI Enablement.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-3xl">
              14+ years of enterprise technology leadership delivering robust <strong className="text-slate-900 font-semibold">Oracle Middleware Integration</strong> ecosystems, cloud data engineering on <strong className="text-slate-900 font-semibold">AWS &amp; Azure</strong> (dbt, Databricks, Medallion Architecture), and operationalizing <strong className="text-slate-900 font-semibold">AI Enablement</strong> to hook data pipelines into high-fidelity agentic AI systems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono text-slate-600 pt-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-lg shadow-sm">
              <MapPin className="size-4 text-emerald-600" />
              <span className="font-semibold text-slate-800">Cambridge, UK</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-lg shadow-sm">
              <ShieldCheck className="size-4 text-teal-600" />
              <span>10+ Oracle Integration Projects Delivered</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-lg shadow-sm">
              <Award className="size-4 text-cyan-600" />
              <span>5+ Medallion Data Engineering Projects</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: CORE TECH AREAS (LIGHT SOFT SLATE #f1f5f9) ── */}
      <section id="expertise" className="relative bg-[#f1f5f9] border-b border-slate-200/80 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-300/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
                Core Specializations
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Work &amp; Technology Areas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Simple, reliable, and enterprise-proven technical capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Card 1: Oracle Middleware */}
            <div className="rounded-2xl bg-white border border-slate-200 p-7 space-y-4 hover:border-emerald-500 hover:shadow-md transition-all shadow-sm">
              <div className="size-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Network className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-emerald-700 uppercase">10+ Projects Delivered</div>
                <h3 className="text-lg font-bold text-slate-900">
                  Oracle Middleware Integration Products
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Architecting and governing mission-critical enterprise integration pipelines connecting ERP (EBS R12, Fusion), Retail (RMS/MOM), Supply Chain, and legacy systems with zero data loss.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-700">
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Oracle Integration Cloud (OIC)</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">SOA Suite 12c</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">ODI 12c</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Oracle Service Bus (OSB)</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">PL/SQL Optimization</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">XML / XSLT</span>
              </div>
            </div>

            {/* Card 2: Data Engineering AWS & Azure */}
            <div className="rounded-2xl bg-white border border-slate-200 p-7 space-y-4 hover:border-cyan-500 hover:shadow-md transition-all shadow-sm">
              <div className="size-11 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                <Database className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-cyan-700 uppercase">5+ Projects Delivered</div>
                <h3 className="text-lg font-bold text-slate-900">
                  Data Engineering with AWS &amp; Azure (dbt, Databricks)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Implementing multi-tier Medallion Lakehouses, analytical data planes, and high-throughput transformation pipelines for enterprise data science and real-time BI.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-700">
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">dbt (Data Build Tool)</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Databricks</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Apache Spark</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">AWS (S3, Glue, Lambda, Athena)</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Azure Data Factory</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Delta Lake / Parquet</span>
              </div>
            </div>

            {/* Card 3: Python & SQL */}
            <div className="rounded-2xl bg-white border border-slate-200 p-7 space-y-4 hover:border-teal-500 hover:shadow-md transition-all shadow-sm">
              <div className="size-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                <Code2 className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-teal-700 uppercase">Core Development</div>
                <h3 className="text-lg font-bold text-slate-900">
                  Python &amp; Advanced SQL Proficiencies
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Developing high-performance asynchronous data services, financial statistical models, complex window functions, and sub-second SQL analytical queries.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-700">
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Python 3.11+ / FastAPI</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Pandas &amp; NumPy</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Complex Analytical SQL</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">PostgreSQL</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Execution Plan Optimization</span>
              </div>
            </div>

            {/* Card 4: CI/CD & YAML IaC */}
            <div className="rounded-2xl bg-white border border-slate-200 p-7 space-y-4 hover:border-amber-500 hover:shadow-md transition-all shadow-sm">
              <div className="size-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <FileCode className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-amber-700 uppercase">DevOps &amp; Automation</div>
                <h3 className="text-lg font-bold text-slate-900">
                  CI/CD Implementation &amp; YAML-based IaC
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Building automated release pipelines, multi-environment deployments, container orchestration, and configuration governance with YAML Infrastructure-as-Code.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-700">
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">GitHub Actions (YAML)</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Jenkins Pipelines</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">YAML-based IaC</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Docker &amp; Containers</span>
                <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200">Cloudflare Workers</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 3: AI ENABLEMENT & AGENTIC SYSTEMS (LIGHT OFF-WHITE #ffffff) ── */}
      <section id="ai-enablement" className="relative bg-white border-b border-slate-200/80 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
              Data Integration Hooked to AI
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              AI Enablement &amp; Agentic System Engineering
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Modern AI and Data Science initiatives succeed only when powered by disciplined, high-quality data integration. By hooking validated data pipelines directly into agentic architectures, AI models receive clean, source-grounded context without hallucinations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Skill 1: Prompt & Context Engineering */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:bg-white hover:border-emerald-400 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-bold text-xs">
                <Sparkles className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Prompt &amp; Context Engineering
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured system prompting, dynamic few-shot injection, schema constraints, and token optimization ensuring predictable, deterministic LLM outputs.
              </p>
            </div>

            {/* Skill 2: RAG */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:bg-white hover:border-teal-400 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center font-bold text-xs">
                <Database className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                RAG (Retrieval-Augmented Generation)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Semantic search over enterprise documents, vector embeddings, chunking strategies, and source-grounded fact retrieval with verifiable citations.
              </p>
            </div>

            {/* Skill 3: Model Context Protocol (MCP) */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:bg-white hover:border-cyan-400 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-cyan-100/70 text-cyan-700 flex items-center justify-center font-bold text-xs">
                <Workflow className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Model Context Protocol (MCP)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Building standardized MCP servers and clients to securely expose enterprise database tools, APIs, and file systems to AI agents.
              </p>
            </div>

            {/* Skill 4: Customized SKILL.md Agent Systems */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:bg-white hover:border-emerald-400 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-bold text-xs">
                <Bot className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Agentic Systems &amp; SKILL.md
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Designing modular, domain-specific AI agents using structured <code className="text-emerald-800 font-mono text-[11px] bg-emerald-50 px-1 py-0.5 rounded">SKILL.md</code> definitions, autonomous execution boundaries, and strict tool permissions.
              </p>
            </div>

            {/* Skill 5: AI Loop Engineering */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:bg-white hover:border-teal-400 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center font-bold text-xs">
                <Brain className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Loop Engineering &amp; ReAct Frameworks
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stateful Thought-Action-Observation loops, iterative reflection, exception recovery, and automated validation before returning final answers.
              </p>
            </div>

            {/* Skill 6: Data Pipeline Hooking */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:bg-white hover:border-cyan-400 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-cyan-100/70 text-cyan-700 flex items-center justify-center font-bold text-xs">
                <Zap className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Pipeline Quality for Data Science
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated schema validation, anomaly detection, and data enrichment at the integration boundary to deliver high-quality inputs for downstream ML models.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 4: RESEARCH PROJECT — MF LENS & MEDALLION DELTA LAKE (LIGHT SOFT SLATE #f1f5f9) ── */}
      <section id="research" className="relative bg-[#f1f5f9] border-b border-slate-200/80 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-300/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
                Independent Research Project
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                DevOps &amp; AI Enablement with Medallion Architecture
              </h2>
            </div>
            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Explore Live Platform</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-7 sm:p-9 space-y-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md">
                  <Activity className="size-3.5 text-emerald-600" />
                  <span>Case Study: MF Lens Platform &amp; MF Analyst</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Real-Time Quantitative Screener &amp; AI Agent Analyst
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  A high-throughput quantitative platform demonstrating how <strong>autonomous AI Analyst agents</strong> execute real-time statistical inference and market regime analysis directly on top of <strong>AWS S3 Delta Lake / Parquet columnar storage</strong> with &lt;50ms response times.
                </p>
              </div>

              <a
                href={fundLensAppUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-700/20 shrink-0"
              >
                <span>Launch Live Terminal</span>
                <ArrowUpRight className="size-4" />
              </a>
            </div>

            {/* Medallion Architecture Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Implemented 3-Tier Medallion Data Architecture (AWS S3)
              </h4>
              
              <div className="grid sm:grid-cols-3 gap-4">
                
                {/* Bronze */}
                <div className="p-5 rounded-xl bg-slate-50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-800 uppercase">Bronze Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">Raw Ingest</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">Daily Automated Ingest</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automated GitHub Actions CI/CD jobs pulling daily raw AMFI NAV feeds and official factsheets directly into raw S3 buckets.
                  </p>
                </div>

                {/* Silver */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-700 uppercase">Silver Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">Cleaned Parquet</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">Columnar Partitioning</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hyparquet transform pipeline validating schemas, scrubbing missing timestamps, and generating partitioned columnar parquet tables.
                  </p>
                </div>

                {/* Gold */}
                <div className="p-5 rounded-xl bg-slate-50 border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-emerald-800 uppercase">Gold Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">AI &amp; Predictions</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">MF Analyst Agent Engine</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Precomputed analytical snapshots combined with an autonomous ReAct AI Analyst agent using server tools to predict and evaluate risk metrics in real time.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 5: IMPACT & TRACK RECORD (LIGHT OFF-WHITE #ffffff) ── */}
      <section id="impact" className="relative bg-white border-b border-slate-200/80 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-8">
          
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
              Proven Track Record
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Enterprise Delivery &amp; Reliability
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-600">10+</div>
              <div className="text-xs font-semibold text-slate-800">Oracle Integration Projects</div>
              <p className="text-[11px] text-slate-500">OIC, SOA Suite, ODI, OSB &amp; ERP</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-teal-600">5+</div>
              <div className="text-xs font-semibold text-slate-800">Medallion Data Projects</div>
              <p className="text-[11px] text-slate-500">AWS, Azure, dbt &amp; Databricks</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-600">8+ Yrs</div>
              <div className="text-xs font-semibold text-slate-800">Selfridges Integration Lead</div>
              <p className="text-[11px] text-slate-500">Sole integration authority</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-600">98.4%</div>
              <div className="text-xs font-semibold text-slate-800">First-Time Go-Live Success</div>
              <p className="text-[11px] text-slate-500">Zero critical production rollbacks</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 6: CONTACT & COLLABORATION (LIGHT SOFT SLATE #f1f5f9) ── */}
      <section id="contact" className="relative bg-[#f1f5f9] py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-300/80 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
                Get in Touch
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Contact &amp; Collaboration
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Reach out for integration consulting, cloud data engineering, AI enablement, or project inquiries.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm max-w-3xl">
            {submitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm space-y-2">
                <p className="font-bold">✓ Message Received</p>
                <p className="text-xs text-emerald-800">
                  Thank you, {name}. Sandip has received your note and will follow up shortly at {email}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Subject / Area of Interest
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Oracle OIC Integration / AWS Lakehouse / AI Enablement & MCP"
                    className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell me about your integration landscape, data pipelines, or AI enablement objectives..."
                    className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-700/20 disabled:opacity-50"
                  >
                    <span>{submitting ? "Sending..." : "Send Message"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>

                  <a
                    href="mailto:sandipprodhan100@gmail.com"
                    className="text-xs text-slate-600 hover:text-emerald-700 transition-colors"
                  >
                    Direct email: <span className="font-mono font-semibold text-slate-800">sandipprodhan100@gmail.com</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white py-8 px-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">Sandip Prodhan</span> · Integration Consultant &amp; AI Enabler · Cambridge, UK
          </div>
          <div className="flex items-center gap-6">
            <a
              href="mailto:sandipprodhan100@gmail.com"
              className="hover:text-emerald-700 transition-colors"
            >
              sandipprodhan100@gmail.com
            </a>
            <a
              href="https://linkedin.com/in/sandip-prodhan-17790427"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-700 transition-colors flex items-center gap-1"
            >
              <span>LinkedIn</span>
              <ExternalLink className="size-3" />
            </a>
            <a
              href={fundLensAppUrl}
              className="hover:text-emerald-700 transition-colors text-emerald-700 font-semibold"
            >
              Fund Lens App
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
