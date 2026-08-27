import { Link } from "@tanstack/react-router";
import {
  Activity,
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
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

export function SandipPortfolio() {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("192.168."));
  const fundLensAppUrl = isLocal ? "/?app=fundlens" : "https://fundlens.sandipprodhan.in";

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background Subtle Gradient Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.07),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#07080a]/80 border-b border-slate-800/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm tracking-wider">
              SP
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-100">
                Sandip Prodhan
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Integration Architect &amp; AI Specialist
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#about" className="hover:text-slate-200 transition-colors">
              About
            </a>
            <a href="#ai-innovations" className="hover:text-slate-200 transition-colors">
              AI Innovations
            </a>
            <a href="#experience" className="hover:text-slate-200 transition-colors">
              Experience
            </a>
            <a href="#tech-stack" className="hover:text-slate-200 transition-colors">
              Skills
            </a>
            <a href="#live-project" className="hover:text-slate-200 transition-colors text-emerald-400">
              Live Agentic Project
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="mailto:sandipprodhan100@gmail.com"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 hover:border-slate-600 transition-all"
            >
              <Mail className="size-3.5 text-emerald-400" />
              <span>Contact</span>
            </a>

            <a
              href={fundLensAppUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40 transition-all"
            >
              <span>Fund Lens App</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 space-y-16">
        {/* HERO SECTION */}
        <section id="about" className="relative space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <Sparkles className="size-3.5" />
            <span>14+ Years Enterprise Integration &amp; AI Enablement</span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Enterprise Integration Architect &amp; <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Senior Data Engineer &amp; AI Enabler
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Specialized in architecting and governing 250+ enterprise integration solutions across{" "}
              <strong className="text-slate-100 font-semibold">Oracle Cloud (OIC, SOA, ODI)</strong>,{" "}
              <strong className="text-slate-100 font-semibold">AWS</strong>, and{" "}
              <strong className="text-slate-100 font-semibold">Azure landscapes</strong>. Served as the sole{" "}
              <strong className="text-slate-100 font-semibold">Integration Authority for Selfridges</strong> for over 8 years with a 98%+ go-live success record. Leading the transition to AI-native workflows using Model Context Protocol (MCP), OCI GenAI, and ReAct agentic frameworks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2">
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md">
              <MapPin className="size-3.5 text-emerald-400" />
              <span>Leicester, UK</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md">
              <Award className="size-3.5 text-emerald-400" />
              <span>Oracle Certified OIC &amp; SOA Specialist</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md">
              <Cpu className="size-3.5 text-emerald-400" />
              <span>IIT Madras Advanced Cloud Alum</span>
            </div>
          </div>
        </section>

        {/* KEY IMPACT STATS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">14+</div>
            <div className="text-xs text-slate-400 font-medium">Years Experience</div>
            <p className="text-[11px] text-slate-500 pt-1">Enterprise Architecture &amp; Delivery</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">250+</div>
            <div className="text-xs text-slate-400 font-medium">Integration Pipelines</div>
            <p className="text-[11px] text-slate-500 pt-1">Oracle, AWS &amp; Azure Landscapes</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">8+ Yrs</div>
            <div className="text-xs text-slate-400 font-medium">Selfridges Integration Lead</div>
            <p className="text-[11px] text-slate-500 pt-1">98%+ Go-live success rate</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">53%</div>
            <div className="text-xs text-slate-400 font-medium">Component Reusability</div>
            <p className="text-[11px] text-slate-500 pt-1">Reduced development costs</p>
          </div>
        </section>

        {/* FEATURED LIVE AGENTIC PROJECT CARD */}
        <section id="live-project" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono">
                Featured Live AI Project
              </h2>
            </div>
            <span className="text-xs text-emerald-400 font-mono">Agentic AI Architecture</span>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0b0e14] border border-emerald-500/30 p-6 sm:p-8 space-y-6 shadow-2xl shadow-emerald-950/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                  <Activity className="size-3.5" />
                  <span>Mutual Fund Lens App</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Enterprise-Grade Agentic Mutual Fund Screener
                </h3>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  A high-performance quantitative investment platform surfacing sideways market regimes with real-time risk metrics (Sharpe, Sortino, Treynor, CAGR).
                </p>
              </div>

              <a
                href={fundLensAppUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-all shrink-0 shadow-lg shadow-emerald-500/20"
              >
                <span>Launch Live Application</span>
                <ArrowUpRight className="size-4" />
              </a>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Bot className="size-3.5 text-emerald-400" />
                  <span>Dual-Agent Pipeline</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  ReAct synthesis loop powered by Gemini 1.5 Pro + secondary SEBI Compliance validator scan.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Database className="size-3.5 text-teal-400" />
                  <span>Hybrid Storage</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  TimescaleDB time-series database backed by deep historical Parquet S3 data lakes.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Zap className="size-3.5 text-cyan-400" />
                  <span>Numerical Engine</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Dynamic sideways parameters (band %, duration, drift limit) computed on the fly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI & INNOVATION HIGHLIGHTS */}
        <section id="ai-innovations" className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              <Brain className="size-4 text-emerald-400" />
              <span>AI &amp; GenAI Architecture Innovations</span>
            </h2>
            <p className="text-xs text-slate-400">
              Modernizing enterprise messaging, data engineering, and integration pipelines using agentic systems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Innovation 1 */}
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold font-mono">
                <Terminal className="size-4" />
                <span>Agentic MQ &amp; Order Processing</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Architected and deployed an Inventory and Order Agentic solution to read messages from IBM MQ, connecting via <strong className="text-slate-100 font-medium">Model Context Protocol (MCP)</strong> to hand off payloads to downstream autonomous agents for automated order processing.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400 pt-1">
                <span className="bg-slate-800 px-2 py-0.5 rounded">IBM MQ</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">MCP Protocol</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">Agentic Automation</span>
              </div>
            </div>

            {/* Innovation 2 */}
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-2 text-teal-400 text-sm font-semibold font-mono">
                <Layers className="size-4" />
                <span>OIC Agent Automation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Designed and implemented a custom OIC agent that consumes design specification plans (<strong className="text-slate-100 font-medium">plan.md</strong>) stored in OCI Object Storage to automatically provision OIC integration pipelines with minimal manual overhead.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400 pt-1">
                <span className="bg-slate-800 px-2 py-0.5 rounded">Oracle Integration Cloud</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">OCI Storage</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">Auto-Provisioning</span>
              </div>
            </div>

            {/* Innovation 3 */}
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold font-mono">
                <Database className="size-4" />
                <span>Golden Data Copy Generation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Engineered PySpark and SQL processing scripts to ingest, de-duplicate, and reconcile transactional datasets from multiple sources, generating a high-quality <strong className="text-slate-100 font-medium">"golden data copy"</strong> feeding downstream retail AI assistants.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400 pt-1">
                <span className="bg-slate-800 px-2 py-0.5 rounded">PySpark</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">Delta Lake</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">Data Reconciliation</span>
              </div>
            </div>

            {/* Innovation 4 */}
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold font-mono">
                <ShieldCheck className="size-4" />
                <span>AI-Assisted Delivery Governance</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Standardized integration delivery utilizing OCI Generative AI, OIC AI-assisted development tools, and GitHub Copilot to accelerate design-to-production timelines while maintaining 98%+ TDA compliance.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400 pt-1">
                <span className="bg-slate-800 px-2 py-0.5 rounded">OCI GenAI</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">GitHub Copilot</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">TDA Governance</span>
              </div>
            </div>
          </div>
        </section>

        {/* EXPERIENCE TIMELINE */}
        <section id="experience" className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              <Server className="size-4 text-emerald-400" />
              <span>Professional Experience</span>
            </h2>
            <p className="text-xs text-slate-400">
              Track record leading high-availability integration authority and data platforms.
            </p>
          </div>

          <div className="space-y-6 relative border-l border-slate-800 ml-3 pl-6">
            {/* Experience Item 1 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-emerald-500 ring-4 ring-[#07080a]" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h3 className="text-base font-bold text-white">
                  Enterprise Integration Architect &amp; Technical Delivery Lead
                </h3>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Jun 2025 – Present
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mb-2">Cognizant (Selfridges Project) · London, UK</p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Lead SPOC and Integration Authority for the Selfridges estate, defining API security standards and OIC/SOA/ODI patterns.</li>
                <li>Architected IBM MQ Agentic order solution utilizing Model Context Protocol (MCP).</li>
                <li>Governed implementations of OCI Generative AI, OIC AI-assisted development, and retail AI assistants.</li>
                <li>Directed multi-vendor delivery teams (12+ developers), managing TDA sign-offs.</li>
              </ul>
            </div>

            {/* Experience Item 2 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-slate-700 ring-4 ring-[#07080a]" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h3 className="text-base font-bold text-white">
                  Technical Delivery Lead &amp; Technical Lead - Integration
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Jul 2020 – Jun 2025
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mb-2">Cognizant · India &amp; UK</p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Led delivery of 83 integrations across In-Store Fulfilment (ISF) and WMS DC Fulfilment programs.</li>
                <li>Architected OIC-based ERP Cloud (GL, AP, AR, Procurement) and HCM Cloud (Benefits, Payroll) integrations.</li>
                <li>Migrated 75+ ODI jobs and 50+ SOA services, and upgraded 170+ ledger integrations with zero downtime.</li>
              </ul>
            </div>

            {/* Experience Item 3 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-slate-700 ring-4 ring-[#07080a]" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h3 className="text-base font-bold text-white">
                  Integration Subject Matter Expert &amp; Developer
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Feb 2016 – Jul 2020
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mb-2">Cognizant · UK &amp; India</p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Built 40+ high-volume data integrations and 10+ ETL data load plans using ODI 12c.</li>
                <li>Created SOA 12c APIs for Oracle EBS Finance and linked inventory platforms (ISIM), Salesforce, and OMS.</li>
              </ul>
            </div>

            {/* Experience Item 4 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-slate-700 ring-4 ring-[#07080a]" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h3 className="text-base font-bold text-white">
                  IT Analyst – Middleware Integration
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Dec 2011 – Feb 2016
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mb-2">Tata Consultancy Services (TCS) · India</p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Designed and built Oracle Middleware (SOA, BPEL, OSB, ODI) integration interfaces for global Insurance and Telecom clients.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SKILLS & PORTFOLIO */}
        <section id="tech-stack" className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              <Code2 className="size-4 text-emerald-400" />
              <span>Technology Stack &amp; Certifications</span>
            </h2>
            <p className="text-xs text-slate-400">
              Core technologies, certifications, and academic background.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                Cloud &amp; Integration
              </h3>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li>Oracle Integration Cloud (OIC)</li>
                <li>Oracle SOA Suite 11g/12c &amp; OSB</li>
                <li>Oracle Data Integrator (ODI 12c)</li>
                <li>AWS Services (Lambda, Glue, S3)</li>
                <li>Azure Integration Services (ADF, Logic Apps)</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono">
                AI &amp; Data Engineering
              </h3>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li>Model Context Protocol (MCP)</li>
                <li>OCI Generative AI &amp; Gemini API</li>
                <li>PySpark &amp; Delta Lake Architecture</li>
                <li>Python, SQL, PL/SQL Performance</li>
                <li>FastAPI, Next.js, ReAct Agent Loops</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                Databases &amp; Platforms
              </h3>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li>PostgreSQL / TimescaleDB &amp; Redis</li>
                <li>Oracle Database &amp; SQL Server</li>
                <li>Oracle SaaS (ERP/HCM Cloud)</li>
                <li>Salesforce CRM &amp; Blue Yonder WMS</li>
                <li>Docker, GitHub Actions CI/CD</li>
              </ul>
            </div>
          </div>

          {/* Education & Certifications */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Award className="size-4 text-emerald-400" />
                <span>Certifications</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                <li>Oracle Cloud Platform Application Integration 2022 Certified Implementation Specialist (1Z0-1042)</li>
                <li>Oracle SOA Suite 12c Certified Implementation Specialist</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Globe className="size-4 text-emerald-400" />
                <span>Education</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                <li>
                  <strong className="text-slate-100 font-medium">Advanced Certification, Software Engineering for Cloud (AWS)</strong> – IIT Madras / Great Learning (2021 – 2022)
                </li>
                <li>
                  <strong className="text-slate-100 font-medium">B.Tech in Computer Science &amp; Engineering</strong> – University of Calcutta (2008 – 2011)
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050608] mt-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-5 py-6 sm:px-8 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Sandip Prodhan. All rights reserved.
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <a href="mailto:sandipprodhan100@gmail.com" className="hover:text-slate-300 transition-colors">
              sandipprodhan100@gmail.com
            </a>
            <a
              href="https://linkedin.com/in/sandip-prodhan-17790427"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              LinkedIn
            </a>
            <a href={fundLensAppUrl} className="text-emerald-400 hover:underline">
              Fund Lens Subdomain
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
