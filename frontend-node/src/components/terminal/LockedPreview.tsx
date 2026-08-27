import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Paywall pattern: a real-looking preview stays rendered underneath and a
 * frosted veil carries a single teal action. Never a plain "please sign in".
 */
export function LockedPreview({
  title,
  hint,
  action,
  children,
  minHeight = 220,
}: {
  title: string;
  hint: string;
  /** custom CTA; defaults to a sign-in link */
  action?: ReactNode;
  children: ReactNode;
  minHeight?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border" style={{ minHeight }}>
      <div aria-hidden className="pointer-events-none select-none opacity-70">
        {children}
      </div>
      <div className="frost absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="grid size-9 place-items-center rounded-full border border-primary/30 bg-primary/10">
          <Lock className="size-4 text-primary" />
        </span>
        <p className="text-sm font-semibold">{title}</p>
        <p className="max-w-md text-xs text-muted-foreground">{hint}</p>
        <div className="mt-1">
          {action ?? (
            <Link
              to="/login"
              search={{ next: "/analysis" }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Lock className="size-3.5" /> Unlock with Pro
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Generic skeleton block used behind frosted overlays and while loading. */
export function SkeletonRows({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 p-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="shimmer size-6 rounded-md" />
          <span className="shimmer h-3 flex-1 rounded" style={{ maxWidth: `${70 - i * 6}%` }} />
          <span className="shimmer h-3 w-14 rounded" />
          <span className="shimmer h-3 w-14 rounded" />
          <span className="shimmer h-3 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}
