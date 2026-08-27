/**
 * Third-party star ratings (Value Research + Morningstar) for a scheme.
 *
 * Neither house publishes an open API, so the rating is read off the public
 * fund page with Firecrawl and cached hard (ratings move at most monthly).
 */
import { gatewayHeaders, scrapeJson, searchUrls } from "@/lib/firecrawl.server";
import { memoise } from "@/lib/memo.server";

export type AgencyRating = {
  agency: "Value Research" | "Morningstar";
  stars: number | null;
  label: string | null;
  url: string | null;
};

export type FundRatings = {
  fundName: string;
  ratings: AgencyRating[];
  note: string | null;
};

const TTL = 1000 * 60 * 60 * 24; // a day

const SCHEMA = {
  type: "object",
  properties: {
    stars: { type: "number", description: "Star rating out of 5 for this fund, null if absent" },
    label: { type: "string", description: "Any rating word shown, e.g. Gold, Silver, Neutral, 4-star" },
    fundName: { type: "string" },
  },
} as const;

function cleanStars(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").match(/\d(\.\d)?/)?.[0]);
  if (!Number.isFinite(n) || n <= 0 || n > 5) return null;
  return Math.round(n * 10) / 10;
}

/** Guard against picking up a page for a completely different scheme. */
function looksLikeSameFund(fundName: string, scraped: unknown) {
  const got = String(scraped ?? "").toLowerCase();
  if (!got) return true;
  const words = fundName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["fund", "plan", "direct", "growth", "regular"].includes(w));
  if (words.length === 0) return true;
  const hits = words.filter((w) => got.includes(w)).length;
  return hits / words.length >= 0.5;
}

async function readAgency(
  fundName: string,
  agency: AgencyRating["agency"],
  domains: string[],
  headers: Record<string, string>,
): Promise<AgencyRating> {
  const empty: AgencyRating = { agency, stars: null, label: null, url: null };
  try {
    const urls = await searchUrls(`${fundName} ${agency} rating`, headers, domains, 6);
    const url = urls.find((u) => domains.some((d) => u.includes(d)));
    if (!url) return empty;

    const json = await scrapeJson(
      url,
      `Read the ${agency} rating for this mutual fund page. Return the star rating out of 5 as a number and any rating label shown. Use null when the page shows no rating.`,
      SCHEMA as unknown as Record<string, unknown>,
      headers,
    );
    if (!looksLikeSameFund(fundName, json["fundName"])) return { ...empty, url };

    let label = typeof json["label"] === "string" ? json["label"].trim().slice(0, 40) : null;
    // Drop labels that only restate the stars ("4 star", "5 out of 5 stars").
    if (label && /^\d(\.\d)?\s*(out of\s*5\s*)?stars?$/i.test(label)) label = null;
    return { agency, stars: cleanStars(json["stars"]), label: label || null, url };
  } catch {
    return empty;
  }
}

async function fetchRatings(fundName: string): Promise<FundRatings> {
  const headers = gatewayHeaders();
  if (!headers) {
    return { fundName, ratings: [], note: "Ratings lookup is not configured for this app." };
  }

  const [vr, ms] = await Promise.all([
    readAgency(fundName, "Value Research", ["valueresearchonline.com"], headers),
    readAgency(fundName, "Morningstar", ["morningstar.in", "morningstar.com"], headers),
  ]);

  const ratings = [vr, ms];
  const any = ratings.some((r) => r.stars !== null || r.label);
  return {
    fundName,
    ratings,
    note: any
      ? null
      : "Neither Value Research nor Morningstar publishes a rating for this scheme right now — funds under 3 years old are usually unrated.",
  };
}

export const getRatingsCached = memoise(fetchRatings, (name) => `ratings:${name.toLowerCase()}`, TTL);
