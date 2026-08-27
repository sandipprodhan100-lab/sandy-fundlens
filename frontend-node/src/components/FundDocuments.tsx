import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2 } from "lucide-react";

import { getFundDocuments } from "@/lib/fund-docs.functions";

const DOC_LABEL: Record<string, string> = {
  factsheet: "Monthly factsheet",
  "portfolio-disclosure": "Portfolio disclosure",
  "sid-scheme-document": "Scheme information document",
  "annual-report": "Annual report",
  other: "Document",
};

function fmtSize(bytes: number) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Fund-house published PDFs for one scheme, with the page to jump to. */
export function FundDocuments({ fundName }: { fundName: string }) {
  const query = useQuery({
    queryKey: ["fund-docs", fundName],
    queryFn: () => getFundDocuments({ data: { fundName } }),
    staleTime: 1000 * 60 * 5,
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin text-primary" /> Looking up fund-house documents…
      </div>
    );
  }

  if (query.isError) {
    return <p className="py-3 text-xs text-destructive">{(query.error as Error).message}</p>;
  }

  const docs = query.data ?? [];
  if (docs.length === 0) {
    return (
      <p className="py-3 text-xs text-muted-foreground">
        No archived document from this fund house yet. Documents are harvested from the AMC website and stored in the
        in-house library.
      </p>
    );
  }

  return (
    <ul className="space-y-2 py-3 text-xs">
      {docs.map((d) => (
        <li
          key={d.key}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/60 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <FileText className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{DOC_LABEL[d.docType] ?? d.docType}</span>
            </p>
            <p className="mt-0.5 truncate text-muted-foreground">
              {d.fileName} · {fmtSize(d.sizeBytes)}
              {d.pages ? ` · ${d.pages} pages` : ""} · {new Date(d.uploadedAt).toLocaleDateString("en-IN")}
            </p>
            <p className="mt-1">
              {d.startPage ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  Start at page {d.startPage}
                  {d.matchQuality === "likely" ? " (closest match)" : ""}
                </span>
              ) : (
                <span className="text-muted-foreground">Scheme page not detected — open the scheme index in the PDF</span>
              )}
            </p>
          </div>
          <a
            href={d.startPage ? `${d.downloadUrl}#page=${d.startPage}` : d.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 font-medium text-primary transition hover:bg-primary/20"
          >
            <Download className="size-3.5" /> Download PDF
          </a>
        </li>
      ))}
    </ul>
  );
}
