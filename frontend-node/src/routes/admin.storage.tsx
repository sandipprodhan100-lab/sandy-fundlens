import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Database, FileText, Loader2, RefreshCw, Settings2, Ticket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthStatus } from "@/components/AuthStatus";
import { getPaddleEnvironment } from "@/lib/paddle";
import { listPromoCodes } from "@/lib/payments.functions";
import type { CategoryKey } from "@/lib/mf-catalog";
import { DOC_TYPES, type DocType } from "@/lib/s3-layout";
import {
  extractDocumentFacts,
  getDocumentLink,
  getStorageOverview,
  harvestDocuments,
  importFundDocument,
  listFundDocuments,
  listFundHouses,
  runIngestJob,
  saveAppConfig,
} from "@/lib/storage.functions";

export const Route = createFileRoute("/admin/storage")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "S3 Data Lake Console — MF Lens" },
      {
        name: "description",
        content:
          "Admin console for the MF Lens S3 data lake: Parquet NAV history, daily AMFI downloads, fund-house documents and app configuration.",
      },
      { property: "og:title", content: "S3 Data Lake Console — MF Lens" },
      { property: "og:description", content: "Manage Parquet NAV history, AMFI ingest and fund documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StorageConsole,
});

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

function StorageConsole() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [docHouse, setDocHouse] = useState("");
  const [docType, setDocType] = useState<DocType>("factsheet");
  const [docUrl, setDocUrl] = useState("");
  const [backfillLimit, setBackfillLimit] = useState("40");

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/login", search: { next: "/admin/storage" }, replace: true });
  }, [loading, session, navigate]);

  const overview = useQuery({
    queryKey: ["storage-overview", session?.user?.id],
    queryFn: () => getStorageOverview(),
    enabled: !!session,
    retry: false,
  });

  const documents = useQuery({
    queryKey: ["storage-documents", session?.user?.id],
    queryFn: () => listFundDocuments(),
    enabled: !!session && !overview.error,
    retry: false,
  });

  const ingest = useMutation({
    mutationFn: (input: {
      job: "daily-nav" | "backfill" | "backfill-index" | "migrate";
      category?: CategoryKey;
      limit?: number;
    }) =>
      runIngestJob({ data: input }),
    onSuccess: (report) => {
      toast.success(`${report.job}: ${report.updatedSchemes} scheme(s) written, ${report.errors.length} error(s)`);
      void qc.invalidateQueries({ queryKey: ["storage-overview"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const importDoc = useMutation({
    mutationFn: () =>
      importFundDocument({ data: { fundHouse: docHouse, docType, sourceUrl: docUrl } }),
    onSuccess: (entry) => {
      toast.success(`Stored ${entry.fileName}`);
      setDocUrl("");
      void qc.invalidateQueries({ queryKey: ["storage-documents"] });
      void qc.invalidateQueries({ queryKey: ["storage-overview"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const houses = useQuery({
    queryKey: ["fund-houses"],
    queryFn: () => listFundHouses(),
    enabled: !!session,
    retry: false,
  });

  const harvest = useMutation({
    mutationFn: (input: { house?: string | undefined; perHouseLimit?: number }) => harvestDocuments({ data: input }),
    onSuccess: (report) => {
      toast.success(
        `Harvest: ${report.stored} new document(s), ${report.skipped} already stored, ${report.errors.length} error(s)`,
      );
      void qc.invalidateQueries({ queryKey: ["storage-documents"] });
      void qc.invalidateQueries({ queryKey: ["storage-overview"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const extract = useMutation({
    mutationFn: (input: { limit?: number }) => extractDocumentFacts({ data: input }),
    onSuccess: (report) => {
      toast.success(
        `Read ${report.processed} document(s) · ${report.schemes} scheme fact(s) · ${report.errors.length} error(s)`,
      );
      void qc.invalidateQueries({ queryKey: ["storage-overview"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const config = useMutation({
    mutationFn: () => saveAppConfig({ data: { backfillLimit: Number(backfillLimit) || 40 } }),
    onSuccess: () => {
      toast.success("Configuration saved to S3");
      void qc.invalidateQueries({ queryKey: ["storage-overview"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (loading || (!session && !loading)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (overview.error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-2xl font-semibold">Storage console</h1>
        <p className="mt-3 text-muted-foreground">{(overview.error as Error).message}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </main>
    );
  }

  const data = overview.data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="text-sm font-semibold">
            MF Lens · admin
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 text-sm">
            <Link to="/admin/observability" className="text-muted-foreground hover:text-foreground">
              Observability
            </Link>
            <ThemeToggle />
            <AuthStatus />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">S3 data lake</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Storage console</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            NAV history is kept as Parquet per scheme, the official AMFI daily file is archived raw, fund-house
            documents live in their own folder, and runtime config sits under <code>app/config/</code>.
          </p>
        </div>
        <Button variant="outline" onClick={() => void overview.refetch()} disabled={overview.isFetching}>
          <RefreshCw className={overview.isFetching ? "size-4 animate-spin" : "size-4"} /> Refresh
        </Button>
      </header>

      {!data ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Parquet schemes", value: String(data.nav.schemes) },
              { label: "Parquet size", value: mb(data.nav.bytes) },
              { label: "Daily AMFI files", value: String(data.rawDailyFiles) },
              { label: "Fund documents", value: `${data.docs.files} · ${mb(data.docs.bytes)}` },
              { label: "Scheme facts read", value: `${data.facts.schemes} · ${data.facts.houses} houses` },
              { label: "Facts with AUM", value: String(data.facts.withAum) },
              { label: "Facts with manager", value: String(data.facts.withManager) },
              { label: "Documents parsed", value: String(data.facts.documents) },
            ].map((card) => (
              <div key={card.label} className="panel rounded-xl p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-2 text-xl font-semibold">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 panel rounded-xl p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Database className="size-4" /> NAV history by category
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2">Category</th>
                    <th>Schemes</th>
                    <th>Rows</th>
                    <th>Latest NAV</th>
                    <th className="text-right">Backfill</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categories.map((c) => (
                    <tr key={c.key} className="border-t border-border/60">
                      <td className="py-2 font-medium">{c.label}</td>
                      <td>{c.schemes}</td>
                      <td>{c.rows.toLocaleString("en-IN")}</td>
                      <td>{c.lastDate ?? "—"}</td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={ingest.isPending}
                          onClick={() =>
                            ingest.mutate({
                              job: "backfill",
                              category: c.key as CategoryKey,
                              limit: Number(backfillLimit) || 40,
                            })
                          }
                        >
                          Backfill
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button disabled={ingest.isPending} onClick={() => ingest.mutate({ job: "daily-nav" })}>
                {ingest.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Run daily AMFI download
              </Button>
              <Button
                variant="secondary"
                disabled={ingest.isPending}
                onClick={() => ingest.mutate({ job: "migrate", limit: Number(backfillLimit) || 60 })}
              >
                {ingest.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Migrate all categories
              </Button>
              <Button variant="secondary" disabled={ingest.isPending} onClick={() => ingest.mutate({ job: "backfill-index" })}>
                Backfill benchmarks
              </Button>
              <span className="text-xs text-muted-foreground">
                Latest raw file: {data.lastRawDaily ?? "none yet"}
              </span>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="panel rounded-xl p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="size-4" /> Fund-house documents
              </h2>
              <div className="mt-4 grid gap-3">
                <Input placeholder="Fund house (e.g. HDFC Mutual Fund)" value={docHouse} onChange={(e) => setDocHouse(e.target.value)} />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocType)}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <Input placeholder="https://…/factsheet.pdf" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
                <Button onClick={() => importDoc.mutate()} disabled={importDoc.isPending || !docHouse || !docUrl}>
                  {importDoc.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Fetch & store in S3
                </Button>
              </div>

              <div className="mt-5 rounded-lg border border-border/60 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Automatic harvest
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pulls monthly factsheets and portfolio disclosures published by each AMC, stores the PDFs in S3, then
                  reads fund size and fund-manager details out of them.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={docHouse}
                    onChange={(e) => setDocHouse(e.target.value)}
                  >
                    <option value="">All fund houses</option>
                    {(houses.data ?? []).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <Button
                    disabled={harvest.isPending}
                    onClick={() => harvest.mutate({ house: docHouse || undefined, perHouseLimit: 4 })}
                  >
                    {harvest.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Harvest documents
                  </Button>
                  <Button variant="secondary" disabled={extract.isPending} onClick={() => extract.mutate({ limit: 6 })}>
                    {extract.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Read AUM & managers
                  </Button>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {(documents.data ?? []).slice(0, 8).map((doc) => (
                  <li key={doc.key} className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
                    <span className="truncate">
                      <span className="text-muted-foreground">{doc.fundHouse}</span> · {doc.fileName}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const { url } = await getDocumentLink({ data: { key: doc.key } });
                        window.open(url, "_blank", "noopener");
                      }}
                    >
                      Open
                    </Button>
                  </li>
                ))}
                {!documents.data?.length ? (
                  <li className="pt-2 text-muted-foreground">No documents stored yet.</li>
                ) : null}
              </ul>
            </div>

            <div className="panel rounded-xl p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Settings2 className="size-4" /> App configuration
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Stored at <code>app/config/app.json</code> in the bucket.
              </p>
              <div className="mt-4 flex items-end gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Backfill limit / category</span>
                  <Input value={backfillLimit} onChange={(e) => setBackfillLimit(e.target.value)} className="w-32" />
                </label>
                <Button variant="outline" onClick={() => config.mutate()} disabled={config.isPending}>
                  Save
                </Button>
              </div>
              <div className="mt-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Recent ingest logs
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {data.lastLogs.map((log) => (
                    <li key={log.key} className="truncate">
                      {log.key.replace("app/logs/ingest/", "")}
                    </li>
                  ))}
                  {!data.lastLogs.length ? <li>No runs recorded yet.</li> : null}
                </ul>
              </div>
            </div>
          </section>

          <PromoCodes />
        </>
      )}
    </main>
    </div>
  );
}

function PromoCodes() {
  const env = getPaddleEnvironment();
  const promos = useQuery({
    queryKey: ["adminPromos", env],
    queryFn: () => listPromoCodes({ data: { environment: env } }),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <section className="mt-6 panel rounded-xl p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Ticket className="size-4" /> Promo codes
        <span className="eyebrow">{env === "sandbox" ? "test" : "live"}</span>
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Share these at checkout — enter the code on the pricing page before subscribing.
      </p>

      {promos.isLoading ? (
        <div className="mt-4 space-y-2">
          <div className="shimmer h-8 w-full" />
          <div className="shimmer h-8 w-full" />
        </div>
      ) : promos.error ? (
        <p className="mt-4 text-xs text-destructive">{(promos.error as Error).message}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Discount</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right">Used</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {(promos.data ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="num py-2 pr-3 font-semibold text-primary">{p.code}</td>
                  <td className="num py-2 pr-3">
                    {p.percentOff !== null ? `${p.percentOff}% off` : "flat"}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {p.enabledForCheckout ? p.status : `${p.status} · off`}
                  </td>
                  <td className="num py-2 pr-3 text-right text-muted-foreground">{p.timesUsed}</td>
                  <td className="py-2 text-muted-foreground">{p.description}</td>
                </tr>
              ))}
              {!(promos.data ?? []).length ? (
                <tr>
                  <td colSpan={5} className="py-3 text-muted-foreground">
                    No promo codes configured.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
