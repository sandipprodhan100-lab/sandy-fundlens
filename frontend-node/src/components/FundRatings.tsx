import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, Star } from "lucide-react";

import { getFundRatings } from "@/lib/ratings.functions";

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= Math.round(value)
              ? "size-3.5 fill-primary text-primary"
              : "size-3.5 text-muted-foreground/40"
          }
        />
      ))}
      <span className="num ml-1 text-[11px] font-semibold text-foreground">{value}/5</span>
    </span>
  );
}

/** Third-party star ratings shown alongside a fund's own analytics. */
export function FundRatings({ fundName }: { fundName: string }) {
  const query = useQuery({
    queryKey: ["fund-ratings", fundName],
    queryFn: () => getFundRatings({ data: { fundName } }),
    staleTime: 1000 * 60 * 60 * 6,
  });

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin text-primary" /> Fetching Value Research and
        Morningstar ratings…
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="py-2 text-xs text-muted-foreground">
        Ratings are unavailable right now ({(query.error as Error).message}).
      </p>
    );
  }

  const data = query.data!;

  return (
    <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Independent ratings
      </p>
      <ul className="space-y-1.5">
        {data.ratings.map((r) => (
          <li key={r.agency} className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{r.agency}</span>
            <span className="flex items-center gap-2">
              {r.stars !== null ? (
                <Stars value={r.stars} />
              ) : (
                <span className="text-muted-foreground">Unrated</span>
              )}
              {r.label && (
                <span className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-foreground/80">
                  {r.label}
                </span>
              )}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary hover:underline"
                  aria-label={`Open the ${r.agency} page for ${fundName}`}
                >
                  <ExternalLink className="size-3" />
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
      {data.note && <p className="mt-2 text-[11px] text-muted-foreground">{data.note}</p>}
      <p className="mt-2 text-[10px] text-muted-foreground">
        Ratings are published by Value Research and Morningstar; MF Lens only displays them and does
        not endorse them.
      </p>
    </div>
  );
}
