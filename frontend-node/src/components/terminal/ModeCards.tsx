/**
 * Mode selector: four cards, each with a 40px inline vector glyph drawn in the
 * accent colour. No imagery, no emoji.
 */
export type ModeKey = "single" | "combined" | "calc" | "model";

const stroke = { stroke: "currentColor", strokeWidth: 1.5, fill: "none" } as const;

function Glyph({ mode }: { mode: ModeKey }) {
  const common = "size-10 text-primary";
  if (mode === "single")
    return (
      <svg viewBox="0 0 40 40" className={common} aria-hidden>
        <rect x="10" y="12" width="20" height="16" fill="var(--color-sideways)" opacity="0.18" />
        <path d="M2 22 L10 18 L14 21 L18 17 L22 21 L26 18 L30 21 L38 12" {...stroke} />
      </svg>
    );
  if (mode === "combined")
    return (
      <svg viewBox="0 0 40 40" className={common} aria-hidden>
        {[8, 18, 28].map((y) => (
          <g key={y}>
            <rect x="4" y={y - 4} width="32" height="8" fill="var(--color-sideways)" opacity="0.15" />
            <path d={`M4 ${y} L14 ${y - 3} L22 ${y + 2} L30 ${y - 2} L36 ${y}`} {...stroke} />
          </g>
        ))}
      </svg>
    );
  if (mode === "calc")
    return (
      <svg viewBox="0 0 40 40" className={common} aria-hidden>
        {[26, 20, 14, 8].map((y, i) => (
          <rect key={y} x={6 + i * 8} y={y} width="5" height={34 - y} fill="currentColor" opacity={0.35 + i * 0.18} />
        ))}
        <path d="M3 34 L37 34" {...stroke} />
      </svg>
    );
  return (
    <svg viewBox="0 0 40 40" className={common} aria-hidden>
      <circle cx="20" cy="20" r="12" stroke="var(--color-border)" strokeWidth="6" fill="none" />
      <circle
        cx="20"
        cy="20"
        r="12"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
        strokeDasharray="46 76"
        transform="rotate(-90 20 20)"
      />
      <circle
        cx="20"
        cy="20"
        r="12"
        stroke="var(--color-sideways)"
        strokeWidth="6"
        fill="none"
        strokeDasharray="20 76"
        strokeDashoffset="-48"
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}

export function ModeCards({
  modes,
  value,
  onChange,
}: {
  modes: { key: ModeKey; label: string; hint: string }[];
  value: ModeKey;
  onChange: (k: ModeKey) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {modes.map((m) => {
        const on = m.key === value;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            aria-pressed={on}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
              on
                ? "border-primary/40 bg-primary/8"
                : "border-border bg-card hover:border-primary/25"
            }`}
          >
            <Glyph mode={m.key} />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{m.label}</span>
              <span className="block text-[11px] leading-snug text-muted-foreground">{m.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
