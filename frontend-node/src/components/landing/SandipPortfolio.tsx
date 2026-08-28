import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
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
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Package,
  ShieldCheck,
  Sparkles,
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
      // 1. Store in S3 request store
      await submitPortfolioRequest({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: subject.trim() || "Consulting & Project Inquiry",
          allocations: `Contact Message: ${message.trim() || "Enterprise Integration & AI Enablement"}`,
          horizon: "Direct Inquiry",
        },
      });

      // 2. Trigger direct mailto link to sandipprodhan100@gmail.com
      const mailtoUrl = `mailto:sandipprodhan100@gmail.com?subject=${encodeURIComponent(
        subject.trim() || `Inquiry from ${name.trim()}`,
      )}&body=${encodeURIComponent(
        `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
      )}`;
      
      window.location.href = mailtoUrl;

      setSubmitted(true);
      toast.success("Thank you! Your inquiry has been sent to sandipprodhan100@gmail.com.");
    } catch {
      // Fallback direct mailto
      window.location.href = `mailto:sandipprodhan100@gmail.com?subject=${encodeURIComponent(
        subject.trim() || "Consulting Inquiry",
      )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-slate-200 selection:text-slate-900">
      
      {/* ── STICKY TOP NAVIGATION ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200 shadow-2xs">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white font-bold text-sm shadow-2xs">
              SP
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Sandip Prodhan
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                  Available
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Enterprise Integration Consultant, Cloud Data Engineer &amp; AI Reliability Practitioner
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-600 font-semibold">
            <a href="#expertise" className="hover:text-slate-950 transition-colors">
              Tech Areas
            </a>
            <a href="#domains" className="hover:text-slate-950 transition-colors">
              Domains
            </a>
            <a href="#ai-enablement" className="hover:text-slate-950 transition-colors">
              AI Enablement &amp; MCP
            </a>
            <a href="#education" className="hover:text-slate-950 transition-colors">
              Education &amp; Certs
            </a>
            <a href="#research" className="hover:text-slate-950 transition-colors text-slate-900">
              Research (MF Lens)
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs"
            >
              <Mail className="size-3.5 text-slate-600" />
              <span>Contact</span>
            </a>

            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 shadow-2xs transition-all"
            >
              <span>MF Lens App</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: HERO (TWO-LINE ADJUSTABLE HEADING, NO PERIOD) ── */}
      <section className="relative bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
        
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Sparkles className="size-3.5 text-slate-600 animate-pulse" />
            <span>15+ Years Enterprise Integration &amp; Large-Scale Delivery</span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.14]">
              Enterprise Integration &amp; Cloud Data Pipelines
              <span className="block text-slate-900">
                &amp; AI Enablement
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-3xl">
              15+ years delivering mission-critical enterprise integration programs. Specialized as an <strong className="text-slate-900 font-semibold">Enterprise Integration Consultant, Cloud Data Engineer &amp; Enterprise AI Reliability Practitioner and Adoption Agent</strong>. Architecting <strong className="text-slate-900 font-semibold">Oracle Middleware (OIC, SOA, ODI)</strong>, <strong className="text-slate-900 font-semibold">AWS &amp; Azure Integration Services</strong>, <strong className="text-slate-900 font-semibold">API-Led &amp; Microservices</strong> architectures, and Medallion Lakehouses powering agentic AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono text-slate-600 pt-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg shadow-2xs">
              <MapPin className="size-4 text-slate-700" />
              <span className="font-semibold text-slate-900">Cambridge, UK</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg shadow-2xs">
              <ShieldCheck className="size-4 text-slate-700" />
              <span>10+ Oracle Integration Projects Delivered</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg shadow-2xs">
              <Award className="size-4 text-slate-700" />
              <span>5+ Medallion Data Engineering Projects</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: DOMAIN & BUSINESS PROCESS EXPERTISE ── */}
      <section id="domains" className="relative bg-[#f1f5f9] border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-300 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                Industry &amp; Functional Scope
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1">
                Domain &amp; Enterprise Process Expertise
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              10+ years Retail leadership with deep cross-industry delivery across Manufacturing, Insurance, and Financial Services.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Functional Area 1: SCM & Logistics */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs hover:border-slate-400 hover:shadow-sm transition-all">
              <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold">
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

      {/* ── SECTION 3: CORE WORK & TECH AREAS (ORACLE, AWS, AZURE, API-LED) ── */}
      <section id="expertise" className="relative bg-white border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                Core Specializations
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1">
                Work &amp; Technology Areas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Enterprise-proven architecture across Oracle Middleware, AWS &amp; Azure integration services, and API-led microservices.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Oracle Middleware */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-6 space-y-4 hover:border-slate-400 hover:shadow-sm transition-all shadow-2xs">
              <div className="size-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-bold">
                <Network className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-slate-600 uppercase">10+ Projects Delivered</div>
                <h3 className="text-base font-bold text-slate-900">
                  Oracle Middleware Integration Products
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Architecting, deploying, and governing mission-critical enterprise integration pipelines across cloud and on-premises Oracle landscapes.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-mono text-slate-800">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Oracle Integration Cloud (OIC)</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">SOA Suite 12c</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">ODI 12c</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Oracle Service Bus (OSB)</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">PL/SQL Optimization</span>
              </div>
            </div>

            {/* Card 2: AWS & Azure Integration Services */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-6 space-y-4 hover:border-slate-400 hover:shadow-sm transition-all shadow-2xs">
              <div className="size-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-bold">
                <Workflow className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-slate-600 uppercase">Cloud Native Integration</div>
                <h3 className="text-base font-bold text-slate-900">
                  AWS &amp; Azure Integration Services
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Serverless event routing, asynchronous messaging, workflow state machines, and enterprise SaaS connectors on AWS &amp; Azure.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-mono text-slate-800">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">AWS EventBridge</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">AWS AppFlow</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Amazon SQS/SNS</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">AWS Step Functions</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Azure Service Bus</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Azure Logic Apps</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Azure Event Grid</span>
              </div>
            </div>

            {/* Card 3: API-Led & Microservices */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-6 space-y-4 hover:border-slate-400 hover:shadow-sm transition-all shadow-2xs">
              <div className="size-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-bold">
                <Code2 className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-slate-600 uppercase">API &amp; Architecture</div>
                <h3 className="text-base font-bold text-slate-900">
                  API-Led &amp; Microservices Practitioner
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                System, Process, and Experience API decomposition, contract-first design, API Gateways, OAuth2/OIDC, and Domain-Driven Design (DDD).
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-mono text-slate-800">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">API Gateway / APIM</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">REST / JSON</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">GraphQL &amp; gRPC</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">OpenAPI 3.0 / Swagger</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">OAuth2 / OIDC</span>
              </div>
            </div>

            {/* Card 4: Data Engineering AWS & Azure */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-6 space-y-4 hover:border-slate-400 hover:shadow-sm transition-all shadow-2xs">
              <div className="size-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-bold">
                <Database className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-slate-600 uppercase">5+ Projects Delivered</div>
                <h3 className="text-base font-bold text-slate-900">
                  Data Engineering with AWS &amp; Azure (dbt, Databricks)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-tier Medallion Lakehouses, analytical data planes, and high-throughput transformation pipelines for enterprise data science and real-time BI.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-mono text-slate-800">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">dbt (Data Build Tool)</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Databricks</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Apache Spark</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">AWS (S3, Glue, Athena)</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Delta Lake / Parquet</span>
              </div>
            </div>

            {/* Card 5: Python & SQL */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-6 space-y-4 hover:border-slate-400 hover:shadow-sm transition-all shadow-2xs">
              <div className="size-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-bold">
                <FileCode className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-slate-600 uppercase">Core Development</div>
                <h3 className="text-base font-bold text-slate-900">
                  Python &amp; Advanced SQL Proficiencies
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asynchronous data services, statistical modeling, analytical window functions, query plan optimization, and robust PostgreSQL schemas.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-mono text-slate-800">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Python 3.11+ / FastAPI</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Pandas &amp; NumPy</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Analytical SQL</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">PostgreSQL</span>
              </div>
            </div>

            {/* Card 6: CI/CD & YAML IaC */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-6 space-y-4 hover:border-slate-400 hover:shadow-sm transition-all shadow-2xs">
              <div className="size-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-bold">
                <GitBranch className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-slate-600 uppercase">DevOps &amp; Automation</div>
                <h3 className="text-base font-bold text-slate-900">
                  CI/CD Implementation &amp; YAML-based IaC
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated release pipelines, multi-environment deployments, container orchestration, and configuration governance with YAML Infrastructure-as-Code.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-mono text-slate-800">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">GitHub Actions (YAML)</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Jenkins Pipelines</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Docker</span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Cloudflare Workers</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 4: AI ENABLEMENT & AGENTIC SYSTEMS ── */}
      <section id="ai-enablement" className="relative bg-[#f1f5f9] border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="space-y-2 border-b border-slate-300 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
              Data Integration Hooked to AI
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              AI Enablement &amp; Agentic System Engineering
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Modern AI and Data Science initiatives succeed only when powered by disciplined, high-quality data integration. By hooking validated data pipelines directly into agentic architectures, AI models receive clean, source-grounded context without hallucinations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Skill 1: Prompt & Context Engineering */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-400 hover:shadow-2xs transition-all">
              <div className="size-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-400 hover:shadow-2xs transition-all">
              <div className="size-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-400 hover:shadow-2xs transition-all">
              <div className="size-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-400 hover:shadow-2xs transition-all">
              <div className="size-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                <Bot className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Agentic Systems &amp; SKILL.md
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Designing modular, domain-specific AI agents using structured <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">SKILL.md</code> definitions, autonomous execution boundaries, and strict tool permissions.
              </p>
            </div>

            {/* Skill 5: AI Loop Engineering */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-400 hover:shadow-2xs transition-all">
              <div className="size-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 hover:border-slate-400 hover:shadow-2xs transition-all">
              <div className="size-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
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

      {/* ── SECTION 5: EDUCATION & CERTIFICATIONS ── */}
      <section id="education" className="relative bg-white border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
              Qualifications &amp; Credentials
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Education &amp; Professional Certifications
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Education Box */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-7 space-y-5 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <GraduationCap className="size-5 text-slate-700" />
                <span>Academic Education</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <div className="font-bold text-slate-900 text-sm">
                    Advanced Executive Program in Cloud Computing &amp; DevOps
                  </div>
                  <div className="text-slate-600 font-medium">Indian Institute of Technology (IIT) Madras</div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Specialized in enterprise cloud architecture, distributed systems, container orchestration, and automated CI/CD engineering.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <div className="font-bold text-slate-900 text-sm">
                    Bachelor of Technology (B.Tech)
                  </div>
                  <div className="text-slate-600 font-medium">Computer Science &amp; Engineering</div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Strong foundational training in data structures, algorithms, relational database theory, and enterprise software engineering.
                  </p>
                </div>
              </div>
            </div>

            {/* Certifications Box */}
            <div className="rounded-2xl bg-[#f8fafc] border border-slate-200 p-7 space-y-5 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Award className="size-5 text-slate-700" />
                <span>Industry Certifications</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <div className="font-bold text-slate-900">Oracle Certified Specialist</div>
                  <div className="text-[11px] text-slate-600 font-mono">Oracle Integration Cloud (OIC)</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <div className="font-bold text-slate-900">Oracle Certified Specialist</div>
                  <div className="text-[11px] text-slate-600 font-mono">SOA Suite 12c Implementation</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <div className="font-bold text-slate-900">AWS Certified</div>
                  <div className="text-[11px] text-slate-600 font-mono">Solutions Architecture / Cloud</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <div className="font-bold text-slate-900">Oracle Certified Associate</div>
                  <div className="text-[11px] text-slate-600 font-mono">Database PL/SQL Developer</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
                Continuous professional development in GenAI systems, Model Context Protocol (MCP), and Databricks Lakehouse engineering.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 6: RESEARCH PROJECT — MF LENS & MEDALLION DELTA LAKE ── */}
      <section id="research" className="relative bg-[#f1f5f9] border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-300 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                Independent Research Project
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1">
                DevOps &amp; AI Enablement with Medallion Architecture
              </h2>
            </div>
            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-slate-950 transition-colors"
            >
              <span>Explore Live Platform</span>
              <ArrowRight className="size-3.5" />
            </a>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-7 sm:p-9 space-y-8 shadow-2xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
                  <Activity className="size-3.5 text-slate-600" />
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
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-2xs shrink-0"
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
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-700 uppercase">Bronze Layer</span>
                    <span className="text-[10px] font-mono text-slate-500">Raw Ingest</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Daily Automated Ingest</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automated GitHub Actions CI/CD jobs pulling daily raw AMFI NAV feeds and official factsheets directly into raw S3 buckets.
                  </p>
                </div>

                {/* Silver */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs">
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
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-900 uppercase">Gold Layer</span>
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

      {/* ── SECTION 7: IMPACT & TRACK RECORD ── */}
      <section id="impact" className="relative bg-white border-b border-slate-200 py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-8">
          
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
              Proven Track Record
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              Enterprise Delivery &amp; Reliability
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">15+ Yrs</div>
              <div className="text-xs font-bold text-slate-900">Enterprise Integration</div>
              <p className="text-[11px] text-slate-500">Large-scale enterprise delivery</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">10+ Yrs</div>
              <div className="text-xs font-bold text-slate-900">Retail, Mfg &amp; Insurance</div>
              <p className="text-[11px] text-slate-500">Cross-industry architecture</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">250+</div>
              <div className="text-xs font-bold text-slate-900">Pipelines Governed</div>
              <p className="text-[11px] text-slate-500">Oracle, AWS &amp; Azure</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900">98.4%</div>
              <div className="text-xs font-bold text-slate-900">First-Time Go-Live Rate</div>
              <p className="text-[11px] text-slate-500">Zero critical production rollbacks</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 8: CONTACT FORM (DISPATCHES DIRECT TO sandipprodhan100@gmail.com) ── */}
      <section id="contact" className="relative bg-[#f1f5f9] py-16 sm:py-20">
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-300 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                Get in Touch
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mt-1">
                Contact &amp; Collaboration
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Send a direct message to Sandip Prodhan. All submissions dispatch directly to sandipprodhan100@gmail.com.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm max-w-3xl">
            {submitted ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm space-y-3">
                <p className="font-bold text-base text-emerald-800">✓ Message Sent to Sandip</p>
                <p className="text-xs text-slate-600">
                  Thank you, {name}. Your inquiry has been dispatched to <strong>sandipprodhan100@gmail.com</strong> and archived in our secure inquiry store. Sandip will reply to <strong>{email}</strong> shortly.
                </p>
                <div className="pt-2">
                  <a
                    href={`mailto:sandipprodhan100@gmail.com?subject=${encodeURIComponent(
                      subject || `Follow-up from ${name}`,
                    )}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 underline hover:text-slate-700"
                  >
                    Click here if you wish to send additional details via email client
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. David Sterling"
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                      Your Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors shadow-2xs"
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
                    placeholder="e.g. Oracle OIC Integration / AWS Lakehouse / AI Enablement &amp; MCP"
                    className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors shadow-2xs"
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
                    className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors resize-none shadow-2xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-2xs disabled:opacity-50"
                  >
                    <span>{submitting ? "Sending…" : "Send Message to Sandip"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>

                  <a
                    href="mailto:sandipprodhan100@gmail.com"
                    className="text-xs text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Direct Email: <span className="font-mono font-bold text-slate-900">sandipprodhan100@gmail.com</span>
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
            <span className="font-bold text-slate-900">Sandip Prodhan</span> · Enterprise Integration Consultant, Cloud Data Engineer &amp; AI Reliability Practitioner · Cambridge, UK
          </div>
          <div className="flex items-center gap-6">
            <a
              href="mailto:sandipprodhan100@gmail.com"
              className="hover:text-slate-900 transition-colors"
            >
              sandipprodhan100@gmail.com
            </a>
            <a
              href="https://linkedin.com/in/sandip-prodhan-17790427"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <span>LinkedIn</span>
              <ExternalLink className="size-3" />
            </a>
            <a
              href={fundLensAppUrl}
              className="hover:text-slate-900 transition-colors text-slate-900 font-bold"
            >
              Fund Lens App
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
