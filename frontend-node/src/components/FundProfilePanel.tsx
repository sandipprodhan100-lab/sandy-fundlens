import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { FundDocuments } from "@/components/FundDocuments";
import { FundRatings } from "@/components/FundRatings";
import { getFundProfile } from "@/lib/mf.functions";
import { fmtCrore, type FundProfile } from "@/lib/mf-catalog";

export function FundProfilePanel({
  schemeCode,
  fundName,
  onLoaded,
}: {
  schemeCode: number;
  fundName: string;
  onLoaded?: (code: number, profile: FundProfile) => void;
}) {
  const query = useQuery({
    queryKey: ["profile", schemeCode],
    queryFn: async () => {
      const result = await getFundProfile({ data: { schemeCode, fundName } });
      onLoaded?.(schemeCode, result);
      return result;
    },
    staleTime: 1000 * 60 * 60,
  });

  const ratings = <FundRatings fundName={fundName} />;

  if (query.isPending) {
    return (
      <div className="space-y-2 py-3">
        {ratings}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin text-primary" /> Looking up the fund manager…
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-2 py-3">
        {ratings}
        <p className="text-xs text-destructive">{(query.error as Error).message}</p>
      </div>
    );
  }

  const p = query.data!;
  if (!p.manager && !p.aumCrore) {
    return (
      <div>
        <div className="pt-3">{ratings}</div>
        <p className="py-3 text-xs text-muted-foreground">{p.note ?? "No manager details found."}</p>
        <DocsBlock fundName={fundName} />
      </div>
    );
  }

  return (
    <dl className="space-y-2 py-3 text-xs">
      <div className="pb-1">{ratings}</div>
      <Row label="Fund manager" value={p.manager ?? "—"} />
      {p.managerRole && <Row label="Designation" value={p.managerRole} />}
      {p.managerSince && <Row label="Managing since" value={p.managerSince} />}
      {p.managerExperience && <Row label="Experience" value={p.managerExperience} />}
      <Row label="Fund size (AUM)" value={fmtCrore(p.aumCrore)} />
      {p.avgMarketCapCrore !== null && (
        <Row label="Portfolio avg market cap" value={fmtCrore(p.avgMarketCapCrore)} />
      )}
      {p.career.length > 0 ? (
        <div>
          <dt className="uppercase tracking-widest text-muted-foreground">Recent employment</dt>
          <dd className="mt-1">
            <ul className="space-y-1 border-l border-border pl-3 text-foreground/85">
              {p.career.map((c) => (
                <li key={`${c.organisation}-${c.period ?? ""}`}>
                  <span className="font-medium">{c.organisation}</span>
                  {c.role ? ` — ${c.role}` : ""}
                  {c.period ? (
                    <span className="text-muted-foreground"> · {c.period}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ) : (
        p.previousEmployment.length > 0 && (
          <Row label="Previously at" value={p.previousEmployment.join(", ")} />
        )
      )}
      {p.otherFunds.length > 0 && (
        <div>
          <dt className="uppercase tracking-widest text-muted-foreground">Also manages</dt>
          <dd className="mt-1">
            <ul className="space-y-0.5 text-foreground/85">
              {p.otherFunds.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </dd>
        </div>
      )}
      <p className="pt-1 text-[11px] text-muted-foreground">Source: {p.source ?? "—"}</p>
      <DocsBlock fundName={fundName} />
    </dl>
  );
}

function DocsBlock({ fundName }: { fundName: string }) {
  return (
    <div className="mt-2 border-t border-border/70 pt-2">
      <p className="uppercase tracking-widest text-muted-foreground">Fund-house documents</p>
      <FundDocuments fundName={fundName} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground/90">{value}</dd>
    </div>
  );
}
