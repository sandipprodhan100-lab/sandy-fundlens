import { useState } from "react";
import {
  Database,
  Layers,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Server,
  Cloud,
} from "lucide-react";

interface LayerDetail {
  id: "bronze" | "silver" | "gold";
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  icon: typeof Database;
  description: string;
  specs: string[];
  techStack: string[];
}

const MEDALLION_LAYERS: LayerDetail[] = [
  {
    id: "bronze",
    badge: "Bronze Layer",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    title: "Raw AMFI Feeds & Daily Ingestion",
    subtitle: "Automated Regulatory Data Landing",
    icon: Cloud,
    description:
      "Automated extraction from official AMFI NAV endpoints and historical data dumps. Raw text records land directly with zero modification to preserve auditability.",
    specs: [
      "Official AMFI daily NAV dumps (~9:00 PM IST)",
      "High-throughput async batch ingestion worker",
      "Raw landing audit trail with file metadata headers",
      "Historical backfill parity spanning 2018 - 2026",
    ],
    techStack: ["Node.js / Python", "AWS S3 Raw", "AMFI API"],
  },
  {
    id: "silver",
    badge: "Silver Layer",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    title: "Curated S3 Lakehouse",
    subtitle: "Columnar Snappy Parquet with Partition Pruning",
    icon: Server,
    description:
      "Cleansed, validated, and schema-enforced Parquet storage partitioned hierarchically (year/month). Provides sub-second query performance and ultra-low S3 storage costs.",
    specs: [
      "Partitioned S3: s3://mutualfundlens-s3/curated/nav/",
      "Snappy compressed columnar Parquet format",
      "Automated deduplication and numeric type casting",
      "Hive-style directory layout for instant partition pruning",
    ],
    techStack: ["AWS S3", "Apache Parquet", "Delta / Snappy"],
  },
  {
    id: "gold",
    badge: "Gold Layer",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    title: "Snowflake Enterprise Marts + dbt",
    subtitle: "Kimball Star Schema & Continuous Ingestion",
    icon: Cpu,
    description:
      "Auto-ingested via Snowpipe SQS event triggers into Snowflake. Transformed via dbt into conformed dimensions and incremental merge fact tables for enterprise analytics.",
    specs: [
      "Continuous auto-ingestion via Snowpipe & SQS",
      "dbt incremental merge on (scheme_code, nav_date)",
      "Star Schema: DIM_FUND, DIM_AMC, DIM_DATE, FACT_NAV",
      "Automated dbt data tests: uniqueness, not_null, referential",
    ],
    techStack: ["Snowflake Data Cloud", "dbt Core", "Snowpipe", "SQL"],
  },
];

const ARCHITECTURE_METRICS = [
  {
    label: "Continuous Ingest SLA",
    val: "< 3 mins",
    desc: "From AMFI publish to curated S3 & Snowflake staging",
  },
  {
    label: "dbt Incremental Strategy",
    val: "Idempotent Merge",
    desc: "Natural business key deduplication across all NAV dates",
  },
  {
    label: "Warehouse Cost Optimization",
    val: "60s Auto-Suspend",
    desc: "Zero idle credit consumption when transformations finish",
  },
  {
    label: "Data Quality Governance",
    val: "100% Verified",
    desc: "dbt schema constraints & foreign key contract validations",
  },
];

export function DataArchitectureSection() {
  const [activeLayer, setActiveLayer] = useState<"bronze" | "silver" | "gold">("gold");
  const current = MEDALLION_LAYERS.find((l) => l.id === activeLayer) || MEDALLION_LAYERS[2];

  return (
    <section
      id="data-engineering"
      className="relative overflow-hidden border-t py-20 px-5 sm:px-8"
      style={{
        background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-alt) 100%)",
        borderColor: "var(--border)",
      }}
    >
      {/* Background ambient glow effect */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-600/10" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header Badge & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-400 backdrop-blur-md">
            <Layers className="size-3.5" />
            <span>Enterprise Data Engineering Architecture</span>
          </div>

          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
            Medallion Lakehouse &amp; Analytics Platform
          </h2>

          <p className="mt-3 max-w-2xl text-base text-[var(--ink-2)]">
            A resilient, decoupled analytical pipeline transforming raw AMFI mutual fund data
            into high-performance dimensional data marts using <strong>dbt</strong>, <strong>AWS S3</strong>, and <strong>Snowflake</strong>.
          </p>
        </div>

        {/* 3-Tier Interactive Medallion Pipeline Selector */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MEDALLION_LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isSelected = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => setActiveLayer(layer.id)}
                className={`group relative flex flex-col items-start rounded-xl border p-5 text-left transition-all duration-300 ${
                  isSelected
                    ? "border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/5 dark:bg-blue-950/30"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-blue-500/30 hover:bg-[var(--card-hover)]"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${layer.badgeColor}`}
                  >
                    {layer.badge}
                  </span>
                  <div
                    className={`rounded-lg p-2 transition-colors ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "bg-[var(--bg-alt)] text-[var(--ink-2)] group-hover:text-blue-400"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                </div>

                <h3 className="mt-4 font-display text-lg font-semibold text-[var(--ink)]">
                  {layer.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--ink-2)] line-clamp-2">
                  {layer.subtitle}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-blue-400">
                  <span>Explore specifications</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Layer Inspection Card */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl backdrop-blur-md sm:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left: Overview and Specs */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${current.badgeColor}`}
                >
                  {current.badge} Deep Dive
                </span>
                <span className="text-xs text-[var(--ink-3)]">•</span>
                <span className="text-xs text-[var(--ink-2)]">{current.subtitle}</span>
              </div>

              <h3 className="mt-3 font-display text-2xl font-bold text-[var(--ink)]">
                {current.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
                {current.description}
              </p>

              {/* Specification Bullet Points */}
              <div className="mt-6 grid gap-2.5">
                {current.specs.map((spec) => (
                  <div key={spec} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    <span className="text-xs leading-normal text-[var(--ink-2)] sm:text-sm">
                      {spec}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tech Stack Pills */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[var(--ink-3)]">Core Stack:</span>
                {current.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-[var(--border)] bg-[var(--bg-alt)] px-2.5 py-1 text-xs font-mono text-[var(--ink)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Interactive Architectural Visual Card */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-alt)] p-5 shadow-inner">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="size-4 text-blue-400" />
                    <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                      pipeline_lineage.sql
                    </span>
                  </div>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Active Production
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 font-mono text-xs text-[var(--ink-2)]">
                  <div className="rounded bg-[var(--card)] p-2.5">
                    <p className="text-[var(--ink-3)]">// S3 Curated &rarr; Snowflake Ingest</p>
                    <p className="text-blue-400">CREATE OR REPLACE PIPE pipe_amfi_nav_ingest</p>
                    <p className="text-[var(--ink)]">AUTO_INGEST = TRUE AS</p>
                    <p className="text-emerald-400">COPY INTO raw_stg.amfi_nav_stream</p>
                    <p className="text-[var(--ink-2)]">FROM @s3_curated_stage/nav/</p>
                  </div>

                  <div className="rounded bg-[var(--card)] p-2.5">
                    <p className="text-[var(--ink-3)]">// dbt Incremental Star Schema</p>
                    <p className="text-purple-400">{`{{ config(materialized='incremental') }}`}</p>
                    <p className="text-amber-400">unique_key = ['scheme_code', 'nav_date']</p>
                    <p className="text-blue-400">incremental_strategy = 'merge'</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                  <span>Storage: S3 Columnar Parquet</span>
                  <span>Warehouse: Snowflake DW</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Platform Metrics / Highlights */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ARCHITECTURE_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center transition-colors hover:border-blue-500/30"
            >
              <p className="font-mono text-xl font-bold text-blue-400 sm:text-2xl">
                {metric.val}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--ink)] sm:text-sm">
                {metric.label}
              </p>
              <p className="mt-1 text-[11px] text-[var(--ink-2)] leading-relaxed">
                {metric.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
