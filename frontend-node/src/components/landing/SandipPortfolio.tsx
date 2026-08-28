import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Factory,
  FileCode,
  GitBranch,
  Globe,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Package,
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* ── STICKY TOP NAVIGATION (BLUE & WHITE CONTRAST) ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm shadow-blue-600/30">
              SP
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Sandip Prodhan
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  Available
                </span>
              </h1>
              <p className="text-[11px] text-slate-600 font-medium">
                Integration Consultant &amp; AI Enabler
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs text-slate-700 font-semibold">
            <a href="#expertise" className="hover:text-blue-600 transition-colors">
              Core Tech Areas
            </a>
            <a href="#domains" className="hover:text-blue-600 transition-colors">
              Domain Expertise
            </a>
            <a href="#ai-enablement" className="hover:text-blue-600 transition-colors">
              AI Enablement &amp; MCP
            </a>
            <a href="#research" className="hover:text-blue-600 transition-colors text-blue-700">
              Research (MF Lens)
            </a>
            <a href="#impact" className="hover:text-blue-600 transition-colors">
              Delivery Track Record
            </a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Mail className="size-3.5 text-blue-600" />
              <span>Contact</span>
            </a>

            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-700/25 transition-all"
            >
              <span>MF Lens App</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: HERO (HIGH CONTRAST WHITE) ── */}
      <section className="relative bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
        
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-800 shadow-sm">
            <Sparkles className="size-3.5 text-blue-600 animate-pulse" />
            <span>15+ Years Enterprise Integration &amp; Large-Scale Delivery</span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
              Enterprise Integration, Cloud Data Pipelines &amp;{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600">
                AI Enablement.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal max-w-3xl">
              15+ years of proven expertise delivering complex enterprise-scale integration programs. Specialized in <strong className="text-slate-950 font-bold">Oracle Middleware Integrations (OIC, SOA, ODI)</strong>, modern data engineering on <strong className="text-slate-950 font-bold">AWS &amp; Azure (dbt, Databricks, Medallion Architecture)</strong>, and hooking data pipelines into production <strong className="text-slate-950 font-bold">AI Enablement &amp; Agentic Systems</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono text-slate-700 pt-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-lg shadow-sm">
              <MapPin className="size-4 text-blue-600" />
              <span className="font-bold text-slate-900">Cambridge, UK</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-lg shadow-sm">
              <ShieldCheck className="size-4 text-indigo-600" />
              <span>10+ Oracle Integration Projects Delivered</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-lg shadow-sm">
              <Award className="size-4 text-cyan-600" />
              <span>5+ Medallion Data Engineering Projects</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: DOMAIN & BUSINESS PROCESS EXPERTISE (LIGHT BLUE-SLATE #f1f5f9) ── */}
      <section id="domains" className="relative bg-[#f1f5f9] border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-300 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                Industry &amp; Functional Scope
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
                Domain &amp; Enterprise Process Expertise
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              10+ years Retail leadership with deep cross-industry delivery across Manufacturing, Insurance, and Financial Services.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Functional Area 1: SCM & Logistics */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
              <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                <Workflow className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                SCM &amp; Supply Chain Integration
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamless orchestration across warehouse management systems (WMS), carrier logistics, real-time shipment track &amp; trace, and automated ASN dispatch.
              </p>
            </div>

            {/* Functional Area 2: ERP & Finance */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
              <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                <Building2 className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                ERP, Financials &amp; Core Systems
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bi-directional synchronizations with Oracle EBS R12, Fusion ERP, general ledgers, accounts payable/receivable, and automated invoice matching.
              </p>
            </div>

            {/* Functional Area 3: Inventory & Order Management */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
              <div className="size-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 font-bold">
                <Package className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Inventory &amp; Omnichannel OMS
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time store/warehouse stock availability, automated order capture, reservations, returns processing, and POS event streaming.
              </p>
            </div>

            {/* Functional Area 4: HCM & Payroll */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
              <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                HCM &amp; Enterprise Payroll
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Secure HR data interfaces, employee lifecycle synchronization, automated payroll batch dispatch, benefits ingestion, and compliance auditing.
              </p>
            </div>

            {/* Functional Area 5: Retail Domain */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
              <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                <Activity className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                10+ Years Retail &amp; E-Commerce
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extensive retail background across merchandising (RMS/MOM), price &amp; promotion broadcast, loyalty programs, and high-concurrency peak trading events.
              </p>
            </div>

            {/* Functional Area 6: Manufacturing & Insurance */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
              <div className="size-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 font-bold">
                <Factory className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Manufacturing, Insurance &amp; More
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Delivered integration programs across manufacturing plant floors, policy administration, claims processing, and multi-enterprise B2B/EDI exchanges.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 3: CORE WORK & TECH AREAS (HIGH CONTRAST WHITE) ── */}
      <section id="expertise" className="relative bg-white border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                Core Specializations
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
                Work &amp; Technology Areas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Simple, reliable, and enterprise-proven technical capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Card 1: Oracle Middleware */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-7 space-y-4 hover:border-blue-500 hover:shadow-md transition-all shadow-sm">
              <div className="size-11 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-700">
                <Network className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-blue-700 uppercase">10+ Projects Delivered</div>
                <h3 className="text-lg font-bold text-slate-900">
                  Oracle Middleware Integration Products
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Architecting, deploying, and governing mission-critical enterprise integration pipelines across cloud and on-premises Oracle landscapes with guaranteed high availability.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-800">
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Oracle Integration Cloud (OIC)</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">SOA Suite 12c</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">ODI 12c</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Oracle Service Bus (OSB)</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">PL/SQL Optimization</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">XML / XSLT</span>
              </div>
            </div>

            {/* Card 2: Data Engineering AWS & Azure */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-7 space-y-4 hover:border-indigo-500 hover:shadow-md transition-all shadow-sm">
              <div className="size-11 rounded-xl bg-indigo-100/70 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Database className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-indigo-700 uppercase">5+ Projects Delivered</div>
                <h3 className="text-lg font-bold text-slate-900">
                  Data Engineering with AWS &amp; Azure (dbt, Databricks)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Implementing multi-tier Medallion Lakehouses, analytical data planes, and high-throughput transformation pipelines for enterprise data science and real-time BI.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-800">
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">dbt (Data Build Tool)</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Databricks</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Apache Spark</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">AWS (S3, Glue, Lambda, Athena)</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Azure Data Factory</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Delta Lake / Parquet</span>
              </div>
            </div>

            {/* Card 3: Python & SQL */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-7 space-y-4 hover:border-cyan-500 hover:shadow-md transition-all shadow-sm">
              <div className="size-11 rounded-xl bg-cyan-100/70 border border-cyan-200 flex items-center justify-center text-cyan-700">
                <Code2 className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-cyan-700 uppercase">Core Development</div>
                <h3 className="text-lg font-bold text-slate-900">
                  Python &amp; Advanced SQL Proficiencies
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Developing high-performance asynchronous data services, financial statistical models, complex window functions, and sub-second SQL analytical queries.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-800">
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Python 3.11+ / FastAPI</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Pandas &amp; NumPy</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Complex Analytical SQL</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">PostgreSQL</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Execution Plan Optimization</span>
              </div>
            </div>

            {/* Card 4: CI/CD & YAML IaC */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-7 space-y-4 hover:border-blue-500 hover:shadow-md transition-all shadow-sm">
              <div className="size-11 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-700">
                <FileCode className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-blue-700 uppercase">DevOps &amp; Automation</div>
                <h3 className="text-lg font-bold text-slate-900">
                  CI/CD Implementation &amp; YAML-based IaC
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Building automated release pipelines, multi-environment deployments, container orchestration, and configuration governance with YAML Infrastructure-as-Code.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-slate-800">
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">GitHub Actions (YAML)</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Jenkins Pipelines</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">YAML-based IaC</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Docker &amp; Containers</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-200 shadow-2xs">Cloudflare Workers</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 4: AI ENABLEMENT & AGENTIC SYSTEMS (LIGHT BLUE-SLATE #f1f5f9) ── */}
      <section id="ai-enablement" className="relative bg-[#f1f5f9] border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="space-y-2 border-b border-slate-300 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
              Data Integration Hooked to AI
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              AI Enablement &amp; Agentic System Engineering
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Modern AI and Data Science initiatives succeed only when powered by disciplined, high-quality data integration. By hooking validated data pipelines directly into agentic architectures, AI models receive clean, source-grounded context without hallucinations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Skill 1: Prompt & Context Engineering */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-blue-500 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-indigo-500 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-cyan-500 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-blue-500 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                <Bot className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Agentic Systems &amp; SKILL.md
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Designing modular, domain-specific AI agents using structured <code className="text-blue-800 font-mono text-[11px] bg-blue-50 px-1 py-0.5 rounded">SKILL.md</code> definitions, autonomous execution boundaries, and strict tool permissions.
              </p>
            </div>

            {/* Skill 5: AI Loop Engineering */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-indigo-500 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-cyan-500 hover:shadow-sm transition-all">
              <div className="size-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs">
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

      {/* ── SECTION 5: RESEARCH PROJECT — MF LENS & MEDALLION DELTA LAKE (HIGH CONTRAST WHITE) ── */}
      <section id="research" className="relative bg-white border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                Independent Research Project
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
                DevOps &amp; AI Enablement with Medallion Architecture
              </h2>
            </div>
            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors"
            >
              <span>Explore Live Platform</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>

          <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-7 sm:p-9 space-y-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-md">
                  <Activity className="size-3.5 text-blue-600" />
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
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-700/20 shrink-0"
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
                <div className="p-5 rounded-xl bg-white border border-amber-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-800 uppercase">Bronze Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">Raw Ingest</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Daily Automated Ingest</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automated GitHub Actions CI/CD jobs pulling daily raw AMFI NAV feeds and official factsheets directly into raw S3 buckets.
                  </p>
                </div>

                {/* Silver */}
                <div className="p-5 rounded-xl bg-white border border-slate-300 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-700 uppercase">Silver Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">Cleaned Parquet</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Columnar Partitioning</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hyparquet transform pipeline validating schemas, scrubbing missing timestamps, and generating partitioned columnar parquet tables.
                  </p>
                </div>

                {/* Gold */}
                <div className="p-5 rounded-xl bg-white border border-blue-300 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-blue-800 uppercase">Gold Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">AI &amp; Predictions</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">MF Analyst Agent Engine</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Precomputed analytical snapshots combined with an autonomous ReAct AI Analyst agent using server tools to predict and evaluate risk metrics in real time.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 6: IMPACT & TRACK RECORD (LIGHT BLUE-SLATE #f1f5f9) ── */}
      <section id="impact" className="relative bg-[#f1f5f9] border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-8">
          
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
              Proven Track Record
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Enterprise Delivery &amp; Reliability
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-600">15+ Yrs</div>
              <div className="text-xs font-bold text-slate-900">Enterprise Integration</div>
              <p className="text-[11px] text-slate-500">Large-scale enterprise delivery</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-indigo-600">10+ Yrs</div>
              <div className="text-xs font-bold text-slate-900">Retail, Mfg &amp; Insurance</div>
              <p className="text-[11px] text-slate-500">Cross-industry architecture</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-600">250+</div>
              <div className="text-xs font-bold text-slate-900">Pipelines Governed</div>
              <p className="text-[11px] text-slate-500">Oracle, AWS &amp; Azure</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-700">98.4%</div>
              <div className="text-xs font-bold text-slate-900">First-Time Go-Live Rate</div>
              <p className="text-[11px] text-slate-500">Zero critical production rollbacks</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 7: CONTACT & COLLABORATION (HIGH CONTRAST WHITE) ── */}
      <section id="contact" className="relative bg-white py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
                Get in Touch
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
                Contact &amp; Collaboration
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Reach out for enterprise integration consulting, cloud data pipelines, AI enablement, or project inquiries.
            </p>
          </div>

          <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm max-w-3xl">
            {submitted ? (
              <div className="p-6 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm space-y-2">
                <p className="font-bold">✓ Message Received</p>
                <p className="text-xs text-blue-800">
                  Thank you, {name}. Sandip has received your note and will follow up shortly at {email}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                    Subject / Area of Interest
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. SCM &amp; ERP Integration / AWS Data Lake / AI Enablement &amp; MCP"
                    className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell me about your integration landscape, data pipelines, or AI enablement objectives..."
                    className="w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors resize-none shadow-2xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-700/20 disabled:opacity-50"
                  >
                    <span>{submitting ? "Sending..." : "Send Message"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>

                  <a
                    href="mailto:sandipprodhan100@gmail.com"
                    className="text-xs text-slate-600 hover:text-blue-700 transition-colors"
                  >
                    Direct email: <span className="font-mono font-bold text-slate-900">sandipprodhan100@gmail.com</span>
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
            <span className="font-bold text-slate-900">Sandip Prodhan</span> · Integration Consultant &amp; AI Enabler · Cambridge, UK
          </div>
          <div className="flex items-center gap-6">
            <a
              href="mailto:sandipprodhan100@gmail.com"
              className="hover:text-blue-700 transition-colors"
            >
              sandipprodhan100@gmail.com
            </a>
            <a
              href="https://linkedin.com/in/sandip-prodhan-17790427"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              <span>LinkedIn</span>
              <ExternalLink className="size-3" />
            </a>
            <a
              href={fundLensAppUrl}
              className="hover:text-blue-700 transition-colors text-blue-700 font-bold"
            >
              Fund Lens App
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
