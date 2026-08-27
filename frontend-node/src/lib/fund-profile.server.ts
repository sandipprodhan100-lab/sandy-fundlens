import { gatewayHeaders, scrapeJson, searchUrls, toCrore } from "./firecrawl.server";
import type { CareerStep, CategorySizeStats, FundProfile } from "./mf-catalog";

const TTL = 1000 * 60 * 60 * 24;
const cache = new Map<number, { at: number; value: FundProfile }>();

const PREFERRED = [
  "valueresearchonline.com",
  "morningstar.in",
  "moneycontrol.com",
  "advisorkhoj.com",
  "groww.in",
  "etmoney.com",
];

const SCHEMA = {
  type: "object",
  properties: {
    manager: { type: "string" },
    managerSince: { type: "string" },
    managerRole: { type: "string" },
    managerExperience: { type: "string" },
    career: {
      type: "array",
      items: {
        type: "object",
        properties: {
          organisation: { type: "string" },
          role: { type: "string" },
          period: { type: "string" },
        },
      },
    },
    previousEmployment: { type: "array", items: { type: "string" } },
    otherFunds: { type: "array", items: { type: "string" } },
    aum: { type: "string" },
    avgMarketCap: { type: "string" },
  },
} as const;

const PROMPT =
  "For this specific mutual fund scheme, extract: the current fund manager's full name; the date or year they started managing this scheme; their current designation/role at the AMC; their total years of experience if stated; their employment history as a list of {organisation, role, period} entries, most recent first (e.g. {organisation: 'ICICI Prudential AMC', role: 'Senior Fund Manager', period: '2015-2021'}); their previous employers as plain names; the names of other schemes this manager also manages; the scheme's total AUM / fund size including its unit (e.g. '₹ 24,312 Cr'); and the portfolio's average market capitalisation if stated. Use only facts printed on the page — never guess or invent a name; omit any field the page does not state.";

function list(raw: unknown, limit: number) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 2)
    .slice(0, limit);
}

function careerOf(raw: unknown): CareerStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => {
      const row = (v ?? {}) as Record<string, unknown>;
      return {
        organisation: String(row["organisation"] ?? "").trim(),
        role: str(row["role"]),
        period: str(row["period"]),
      };
    })
    .filter((c) => c.organisation.length > 2)
    .slice(0, 6);
}

function str(raw: unknown) {
  const v = String(raw ?? "").trim();
  return v.length > 1 ? v : null;
}

export async function fetchFundProfile(input: {
  schemeCode: number;
  fundName: string;
}): Promise<FundProfile> {
  const hit = cache.get(input.schemeCode);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const empty = (note: string): FundProfile => ({
    manager: null,
    managerSince: null,
    managerRole: null,
    managerExperience: null,
    career: [],
    previousEmployment: [],
    otherFunds: [],
    aumCrore: null,
    avgMarketCapCrore: null,
    source: null,
    note,
  });

  // In-house first: facts read from the fund house's own factsheet in S3.
  let sheet: Awaited<ReturnType<typeof import("./doc-facts.server").lookupSchemeFact>> = null;
  try {
    const { lookupSchemeFact } = await import("./doc-facts.server");
    sheet = await lookupSchemeFact(input.fundName);
  } catch {
    /* fall through to public sources */
  }
  if (sheet && sheet.manager && sheet.aumCrore) {
    const value: FundProfile = {
      manager: sheet.manager,
      managerSince: sheet.managerSince,
      managerRole: null,
      managerExperience: null,
      career: [],
      previousEmployment: [],
      otherFunds: sheet.coManagers,
      aumCrore: sheet.aumCrore,
      avgMarketCapCrore: sheet.avgMarketCapCrore,
      source: `${sheet.fundHouse} factsheet${sheet.asOf ? ` (${sheet.asOf})` : ""}`,
      note: null,
    };
    cache.set(input.schemeCode, { at: Date.now(), value });
    return value;
  }

  const headers = gatewayHeaders();
  if (!headers) {
    if (!sheet) return empty("Fund research source is not configured for this project.");
    const value: FundProfile = {
      manager: sheet.manager,
      managerSince: sheet.managerSince,
      managerRole: null,
      managerExperience: null,
      career: [],
      previousEmployment: [],
      otherFunds: sheet.coManagers,
      aumCrore: sheet.aumCrore,
      avgMarketCapCrore: sheet.avgMarketCapCrore,
      source: `${sheet.fundHouse} factsheet${sheet.asOf ? ` (${sheet.asOf})` : ""}`,
      note: null,
    };
    cache.set(input.schemeCode, { at: Date.now(), value });
    return value;
  }

  let urls: string[] = [];
  try {
    urls = (
      await searchUrls(
        `${input.fundName} fund manager profile AUM fund size`,
        headers,
        PREFERRED,
        6,
      )
    ).slice(0, 3);
  } catch (err) {
    return empty(err instanceof Error ? err.message : "Fund manager lookup failed.");
  }
  if (urls.length === 0) return empty("No public fact page found for this fund.");

  for (const url of urls) {
    try {
      const json = await scrapeJson(url, PROMPT, SCHEMA as unknown as Record<string, unknown>, headers);
      const value: FundProfile = {
        manager: sheet?.manager ?? str(json["manager"]),
        managerSince: sheet?.managerSince ?? str(json["managerSince"]),
        managerRole: str(json["managerRole"]),
        managerExperience: str(json["managerExperience"]),
        career: careerOf(json["career"]),
        previousEmployment: list(json["previousEmployment"], 6),
        otherFunds: list(json["otherFunds"], 8),
        aumCrore: sheet?.aumCrore ?? toCrore(json["aum"]),
        avgMarketCapCrore: sheet?.avgMarketCapCrore ?? toCrore(json["avgMarketCap"]),
        source: sheet ? `${sheet.fundHouse} factsheet` : new URL(url).hostname.replace(/^www\./, ""),
        note: null,
      };
      if (value.manager || value.aumCrore) {
        cache.set(input.schemeCode, { at: Date.now(), value });
        return value;
      }
    } catch {
      /* try next candidate page */
    }
  }

  if (sheet) {
    const value: FundProfile = {
      manager: sheet.manager,
      managerSince: sheet.managerSince,
      managerRole: null,
      managerExperience: null,
      career: [],
      previousEmployment: [],
      otherFunds: sheet.coManagers,
      aumCrore: sheet.aumCrore,
      avgMarketCapCrore: sheet.avgMarketCapCrore,
      source: `${sheet.fundHouse} factsheet${sheet.asOf ? ` (${sheet.asOf})` : ""}`,
      note: null,
    };
    cache.set(input.schemeCode, { at: Date.now(), value });
    return value;
  }

  return empty("Could not read manager or fund-size details from the public sources found.");
}

export async function fetchCategorySizes(
  funds: { code: number; name: string; house: string }[],
): Promise<CategorySizeStats> {
  const results: CategorySizeStats["funds"] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, funds.length) }, async () => {
      while (cursor < funds.length) {
        const f = funds[cursor++]!;
        let aumCrore: number | null = null;
        try {
          const profile = await fetchFundProfile({ schemeCode: f.code, fundName: f.name });
          aumCrore = profile.aumCrore;
        } catch {
          /* leave unknown */
        }
        results.push({ code: f.code, name: f.name, house: f.house, aumCrore });
      }
    }),
  );

  const order = new Map(funds.map((f, i) => [f.code, i]));
  results.sort((a, b) => (order.get(a.code) ?? 0) - (order.get(b.code) ?? 0));

  const values = results.map((r) => r.aumCrore).filter((v): v is number => v !== null && v > 0);
  return {
    funds: results,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    covered: values.length,
    note: values.length === 0 ? "No published fund sizes could be read for this category." : null,
  };
}
