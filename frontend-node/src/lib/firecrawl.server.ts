const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export function gatewayHeaders() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !connectionKey) return null;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
  };
}

export async function call(path: string, body: unknown, headers: Record<string, string>) {
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Firecrawl ${path} failed [${res.status}]: ${text.slice(0, 300)}`);
  return JSON.parse(text) as Record<string, unknown>;
}

/** Firecrawl search results arrive either as a flat array or under data.web */
export async function searchUrls(
  query: string,
  headers: Record<string, string>,
  preferred: string[],
  limit = 6,
) {
  const search = await call("/search", { query, limit }, headers);
  const payload = search["data"];
  const results = (
    Array.isArray(payload)
      ? payload
      : Array.isArray((payload as Record<string, unknown>)?.["web"])
        ? ((payload as Record<string, unknown>)["web"] as unknown[])
        : []
  ) as { url?: string }[];

  const rank = (url: string) => {
    const i = preferred.findIndex((d) => url.includes(d));
    return i === -1 ? preferred.length : i;
  };

  return results
    .map((r) => r.url ?? "")
    .filter(Boolean)
    .sort((a, b) => rank(a) - rank(b));
}

export async function scrapeJson(
  url: string,
  prompt: string,
  schema: Record<string, unknown>,
  headers: Record<string, string>,
) {
  const scraped = await call(
    "/scrape",
    { url, onlyMainContent: true, formats: [{ type: "json", prompt, schema }] },
    headers,
  );
  const payload = (scraped["data"] ?? scraped) as Record<string, unknown>;
  return (payload["json"] ?? {}) as Record<string, unknown>;
}

/**
 * LLM extractions sometimes hallucinate anonymised rows ("Stock A", "Company 1",
 * "Holding B"). Those must never reach the UI.
 */
export function isPlaceholderName(name: string) {
  const n = name.trim();
  if (n.length < 3) return true;
  return /^(stock|company|holding|security|scrip|equity|fund|issuer|name)\s*[-–—#]?\s*([a-z]|[0-9]{1,2})?$/i.test(
    n,
  );
}

/** parse "₹ 12,345 Cr", "12345.6 crore", "1.2 lakh crore" into crore */
export function toCrore(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const s = raw.toLowerCase().replace(/,/g, "");
  const num = Number((s.match(/-?\d+(\.\d+)?/) ?? [])[0]);
  if (!Number.isFinite(num)) return null;
  if (/lakh\s*cr/.test(s)) return num * 100000;
  if (/\bbn\b|billion/.test(s)) return num * 100; // USD-free: treat as ₹ bn ≈ 100 cr
  return num;
}
