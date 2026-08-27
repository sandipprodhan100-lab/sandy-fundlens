import { gatewayHeaders, isPlaceholderName, scrapeJson, searchUrls } from "./firecrawl.server";
import type { Holding, HoldingsResult } from "./mf-catalog";

const TTL = 1000 * 60 * 60 * 24;

const cache = new Map<number, { at: number; value: HoldingsResult }>();

/** domains that publish top-holdings tables in scrapeable HTML */
const PREFERRED = [
  "valueresearchonline.com",
  "moneycontrol.com",
  "groww.in",
  "morningstar.in",
  "advisorkhoj.com",
  "etmoney.com",
  "tickertape.in",
];

function normalise(raw: unknown): Holding[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => {
      const row = h as Record<string, unknown>;
      const name = String(row["name"] ?? row["stock"] ?? row["company"] ?? "").trim();
      const weightRaw = row["weight"] ?? row["percentage"] ?? row["allocation"];
      const weight =
        typeof weightRaw === "number"
          ? weightRaw
          : Number(String(weightRaw ?? "").replace(/[^0-9.\-]/g, "")) || null;
      const sectorRaw = row["sector"] ?? row["industry"];
      return {
        name,
        weight: weight && Number.isFinite(weight) ? weight : null,
        sector: sectorRaw ? String(sectorRaw).trim() : null,
      };
    })
    .filter((h) => h.name.length > 1 && !isPlaceholderName(h.name))
    .slice(0, 10);
}

export async function fetchHoldings(input: {
  schemeCode: number;
  fundName: string;
}): Promise<HoldingsResult> {
  const hit = cache.get(input.schemeCode);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const headers = gatewayHeaders();
  if (!headers) {
    return {
      holdings: [],
      source: null,
      asOf: null,
      note: "Holdings source is not configured for this project.",
    };
  }

  const empty = (note: string): HoldingsResult => ({ holdings: [], source: null, asOf: null, note });

  let urls: string[] = [];
  try {
    urls = (
      await searchUrls(`${input.fundName} top 10 holdings portfolio`, headers, PREFERRED, 6)
    ).slice(0, 3);
  } catch (err) {
    return empty(err instanceof Error ? err.message : "Holdings search failed.");
  }

  if (urls.length === 0) return empty("No public portfolio page found for this fund.");

  for (const url of urls) {
    try {
      const json = await scrapeJson(
        url,
        "Extract the fund's top equity holdings table exactly as printed on the page. Use the real listed company names (for example 'HDFC Bank Ltd', 'Reliance Industries Ltd'); never invent, anonymise or placeholder-label a holding as 'Stock A', 'Company 1' or similar — if a real name is not visible on the page, omit that row. Return up to 10 holdings with the stock name, the portfolio weight as a number in percent, and the sector if shown. Also return the portfolio as-of date if the page states one. Only use data for this specific mutual fund scheme.",
        {
          type: "object",
          properties: {
            asOf: { type: "string" },
            holdings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  weight: { type: "number" },
                  sector: { type: "string" },
                },
                required: ["name"],
              },
            },
          },
          required: ["holdings"],
        },
        headers,
      );
      const holdings = normalise(json["holdings"]);
      if (holdings.length >= 3) {
        const value: HoldingsResult = {
          holdings,
          source: new URL(url).hostname.replace(/^www\./, ""),
          asOf: json["asOf"] ? String(json["asOf"]) : null,
          note: null,
        };
        cache.set(input.schemeCode, { at: Date.now(), value });
        return value;
      }
    } catch {
      /* try the next candidate page */
    }
  }

  return empty("Could not read a real holdings table from the public sources found.");
}
