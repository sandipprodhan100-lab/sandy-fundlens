import type { ModeKey } from "@/components/terminal/ModeCards";

/**
 * Header-level module switcher. Rendered as a visible row of tabs (no dropdown)
 * so every analysis module is one click away.
 */
export function ModuleMenu({
  mode,
  onMode,
  modes,
}: {
  mode: ModeKey;
  onMode: (k: ModeKey) => void;
  modes: { key: ModeKey; label: string; hint: string }[];
}) {
  return (
    <div
      role="tablist"
      aria-label="Analysis modules"
      className="flex max-w-full flex-wrap items-center gap-1 overflow-x-auto"
    >
      {modes.map((m) => {
        const isActive = m.key === mode;
        return (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={m.hint}
            onClick={() => onMode(m.key)}
            className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              isActive
                ? "border-primary/50 bg-primary/12 text-primary"
                : "border-border/60 text-foreground/70 hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
