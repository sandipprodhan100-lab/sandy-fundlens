import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Shared shell for the static trust pages (terms, privacy, methodology). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm font-semibold tracking-tight text-foreground">
            MF Lens
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-4 text-xs text-muted-foreground">
              <Link to="/analysis" className="hover:text-foreground">
                Analysis
              </Link>
              <Link to="/methodology" className="hover:text-foreground">
                Methodology
              </Link>
              <Link to="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </nav>
            <div className="h-3.5 w-px bg-border" />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:pt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground">
          {children}
        </div>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-6 text-[11px] text-muted-foreground">
          Mutual fund investments are subject to market risks. Read all scheme related documents
          carefully before investing. MF Lens is an independent analytics tool and is not a
          SEBI-registered investment adviser, research analyst or distributor.
        </div>
      </footer>
    </div>
  );
}
