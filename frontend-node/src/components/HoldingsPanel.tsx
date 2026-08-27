import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { getHoldings } from "@/lib/mf.functions";
import type { HoldingsResult } from "@/lib/mf-catalog";

export function HoldingsPanel({
  schemeCode,
  fundName,
  onLoaded,
}: {
  schemeCode: number;
  fundName: string;
  onLoaded?: (code: number, result: HoldingsResult) => void;
}) {
  const query = useQuery({
    queryKey: ["holdings", schemeCode],
    queryFn: async () => {
      const result = await getHoldings({ data: { schemeCode, fundName } });
      onLoaded?.(schemeCode, result);
      return result;
    },
    staleTime: 1000 * 60 * 60,
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin text-primary" /> Fetching top holdings…
      </div>
    );
  }

  if (query.isError) {
    return <p className="py-3 text-xs text-destructive">{(query.error as Error).message}</p>;
  }

  const data = query.data!;
  if (data.holdings.length === 0) {
    return <p className="py-3 text-xs text-muted-foreground">{data.note ?? "No holdings available."}</p>;
  }

  return (
    <div className="py-3">
      <table className="w-full text-xs">
        <thead className="text-left uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="pb-1 font-medium">Stock</th>
            <th className="pb-1 text-right font-medium">Weight</th>
            <th className="pb-1 text-right font-medium">Sector</th>
          </tr>
        </thead>
        <tbody>
          {data.holdings.map((h) => (
            <tr key={h.name} className="border-t border-border/60">
              <td className="py-1.5 pr-2">{h.name}</td>
              <td className="num py-1.5 text-right">
                {h.weight === null ? "—" : `${h.weight.toFixed(2)}%`}
              </td>
              <td className="py-1.5 text-right text-muted-foreground">{h.sector ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Source: {data.source ?? "—"}
        {data.asOf ? ` · as of ${data.asOf}` : ""}
      </p>
    </div>
  );
}
