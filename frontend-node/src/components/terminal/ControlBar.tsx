import {
  CATEGORIES,
  INDEXES,
  fmtPct,
  prettyDate,
  type CategoryKey,
  type IndexKey,
} from "@/lib/mf-catalog";
import type { ModeKey } from "@/components/terminal/ModeCards";
import { ArrowLeft, ArrowRight, Wrench } from "lucide-react";

/**
 * Compact terminal control bar: everything the analysis needs — module,
 * fund category, benchmark, detected phase, custom parameters, and history navigation.
 */
export function ControlBar({
  category,
  onCategory,
  indexKey,
  onIndex,
  indexLocked,
  phase,
  loading,
  mode,
  modes,
  bandPct,
  onBandPct,
  minDays,
  onMinDays,
  maxDrift,
  onMaxDrift,
  onOpenSettings,
}: {
  category: CategoryKey;
  onCategory: (k: CategoryKey) => void;
  indexKey: IndexKey;
  onIndex: (k: IndexKey) => void;
  indexLocked?: boolean;
  phase: { start: string; end: string; days: number; drift: number } | null;
  loading?: boolean;
  mode: ModeKey;
  modes: { key: ModeKey; label: string; hint: string }[];
  bandPct: number;
  onBandPct: (v: number) => void;
  minDays: number;
  onMinDays: (v: number) => void;
  maxDrift: number;
  onMaxDrift: (v: number) => void;
  onOpenSettings?: () => void;
}) {
  const activeMode = modes.find((m) => m.key === mode);

  return (
    <div className="panel flex flex-col gap-2.5 p-3.5 bg-card/75 backdrop-blur-md border border-border shadow-lg transition-all">
      {/* Top row: History navigation + module badge + category tabs + Admin Settings */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* History Back / Forward Navigation Controls */}
          <div className="flex items-center gap-0.5 rounded-md border border-border/80 bg-background/80 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Navigate Back (←)"
              aria-label="Back"
            >
              <ArrowLeft className="size-3.5" />
            </button>
            <div className="h-3 w-px bg-border" />
            <button
              type="button"
              onClick={() => window.history.forward()}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Navigate Forward (→)"
              aria-label="Forward"
            >
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          <span className="num rounded-md border border-accent/25 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent tracking-wide uppercase">
            {activeMode?.label ?? "Module"}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow hidden sm:inline text-ink-3">Category</span>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={c.key === category}
                onClick={() => onCategory(c.key)}
                className="chip"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="chip hover:bg-accent-soft inline-flex items-center gap-1 py-1.5 px-3 text-xs text-ink-2 font-semibold"
            title="Admin System Settings"
          >
            <Wrench className="size-3.5" />
            <span>Admin Settings</span>
          </button>
        )}
      </div>

      {/* Bottom row: benchmark, detected phase, custom parameters */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow text-ink-3">Benchmark</span>
            {INDEXES.map((i) => (
              <button
                key={i.key}
                type="button"
                aria-pressed={i.key === indexKey}
                disabled={indexLocked}
                onClick={() => onIndex(i.key)}
                className="chip"
              >
                {i.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border/60 hidden md:block" />

          {loading ? (
            <span className="shimmer h-7 w-64 rounded-md" />
          ) : phase ? (
            <span className="num inline-flex items-center gap-2 rounded-md border border-sideways/35 bg-sideways/10 px-2.5 py-1.5 text-xs text-sideways font-medium">
              <span className="size-1.5 rounded-full bg-sideways animate-pulse" />
              {prettyDate(phase.start)} → {prettyDate(phase.end)} · {phase.days}d · index{" "}
              {fmtPct(phase.drift)}
            </span>
          ) : (
            <span className="num text-xs text-muted-foreground">no flat phase detected</span>
          )}
        </div>

        {/* Dynamic Sideways Parameters Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-black/10 dark:bg-black/25 p-1 rounded-lg border border-border/30">
          <span className="eyebrow text-[10px] text-ink-3 px-1.5">Regime Parameters</span>
          
          <select
            value={bandPct}
            onChange={(e) => onBandPct(Number(e.target.value))}
            className="bg-bg text-ink text-xs py-1 px-2.5 rounded border border-border font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="2">±2% Band</option>
            <option value="3">±3% Band</option>
            <option value="4">±4% Band</option>
            <option value="5">±5% Band</option>
          </select>

          <select
            value={minDays}
            onChange={(e) => onMinDays(Number(e.target.value))}
            className="bg-bg text-ink text-xs py-1 px-2.5 rounded border border-border font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="90">3 Months</option>
            <option value="120">4 Months</option>
            <option value="180">6 Months</option>
          </select>

          <select
            value={maxDrift}
            onChange={(e) => onMaxDrift(Number(e.target.value))}
            className="bg-bg text-ink text-xs py-1 px-2.5 rounded border border-border font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="3">±3% Drift</option>
            <option value="5">±5% Drift</option>
            <option value="8">±8% Drift</option>
            <option value="10">±10% Drift</option>
          </select>
        </div>
      </div>
    </div>
  );
}
