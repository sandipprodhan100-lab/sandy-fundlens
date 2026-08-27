/**
 * Turns archived fund-house PDFs into structured scheme facts.
 *
 * Monthly factsheets and portfolio disclosures carry the authoritative fund
 * size (AUM), fund-manager name/tenure and portfolio stats. We read the stored
 * PDF text (unpdf), extract per-scheme rows with the Lovable AI gateway and
 * cache the result in S3 at documents/_facts/<house>.json, so the app can show
 * AUM and manager details from in-house documents instead of scraping.
 */

import { S3_PATHS, slug } from "./s3-layout";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

export type SchemeFact = {
  scheme: string;
  aumCrore: number | null;
  manager: string | null;
  managerSince: string | null;
  coManagers: string[];
  avgMarketCapCrore: number | null;
  expenseRatio: number | null;
  benchmark: string | null;
  asOf: string | null;
  fundHouse: string;
  sourceKey: string;
  sourceFile: string;
  extractedAt: string;
};

export type FactsExtractionReport = {
  job: "extract-doc-facts";
  at: string;
  documents: number;
  processed: number;
  schemes: number;
  errors: string[];
};

/* ------------------------------------------------------------------ text */

async function pdfText(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const doc = await getDocumentProxy(bytes);
  const { text } = await extractText(doc, { mergePages: true });
  return typeof text === "string" ? text : (text as string[]).join("\n");
}

function chunks(text: string, size = 22000, max = 16) {
  const out: string[] = [];
  for (let i = 0; i < text.length && out.length < max; i += size) out.push(text.slice(i, i + size));
  return out;
}

/* -------------------------------------------------------------------- ai */

const SYSTEM =
  "You read Indian mutual fund factsheets and portfolio disclosures. Extract only facts printed in the text. Never invent a scheme, manager or number. Reply with JSON only.";

const INSTRUCTION = `From the document extract, list every equity or hybrid scheme you can identify with its published details.
Return JSON: {"asOf":"<month year printed on the document or null>","schemes":[{"scheme":"full scheme name","aumCrore":<AUM/month-end AUM in Rs crore as a number or null>,"manager":"primary fund manager full name or null","managerSince":"date/year they started managing or null","coManagers":["other managers"],"avgMarketCapCrore":<number or null>,"expenseRatio":<direct plan TER percent or null>,"benchmark":"benchmark index or null"}]}
Omit schemes with no usable detail. Numbers must be plain numbers in crore (convert "1.2 lakh cr" to 120000).`;

async function aiExtract(text: string): Promise<{ asOf: string | null; schemes: Record<string, unknown>[] }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI gateway is not configured for this project.");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `${INSTRUCTION}\n\n---\n${text}` },
      ],
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`AI extraction failed [${res.status}]: ${(await res.text()).slice(0, 240)}`);
  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return { asOf: null, schemes: [] };
  try {
    const parsed = JSON.parse(json) as { asOf?: string; schemes?: Record<string, unknown>[] };
    return { asOf: parsed.asOf ?? null, schemes: Array.isArray(parsed.schemes) ? parsed.schemes : [] };
  } catch {
    return { asOf: null, schemes: [] };
  }
}

function num(raw: unknown): number | null {
  const v = typeof raw === "string" ? Number(raw.replace(/[^\d.\-]/g, "")) : Number(raw);
  return Number.isFinite(v) && v !== 0 ? v : null;
}

function str(raw: unknown) {
  const v = String(raw ?? "").trim();
  return v.length > 1 && !/^(n\.?a\.?|null|none)$/i.test(v) ? v : null;
}

/* --------------------------------------------------------------- storage */

export async function readHouseFacts(house: string): Promise<SchemeFact[]> {
  const { s3GetJSON } = await import("./s3.server");
  return (await s3GetJSON<SchemeFact[]>(S3_PATHS.docFacts(house)).catch(() => null)) ?? [];
}

async function writeHouseFacts(house: string, facts: SchemeFact[]) {
  const { s3PutJSON } = await import("./s3.server");
  await s3PutJSON(S3_PATHS.docFacts(house), facts);
}

let allCache: { at: number; value: SchemeFact[] } | null = null;

export async function readAllFacts(): Promise<SchemeFact[]> {
  if (allCache && Date.now() - allCache.at < 600000) return allCache.value;
  const { s3List, s3GetJSON } = await import("./s3.server");
  const objects = await s3List(S3_PATHS.docFactsPrefix).catch(() => []);
  const files = await Promise.all(
    objects
      .filter((o) => o.key.endsWith(".json"))
      .map((o) => s3GetJSON<SchemeFact[]>(o.key).catch(() => null)),
  );
  const value = files.flatMap((f) => f ?? []);
  allCache = { at: Date.now(), value };
  return value;
}

/* -------------------------------------------------------------- matching */

const NOISE = new Set([
  "fund",
  "scheme",
  "plan",
  "direct",
  "regular",
  "growth",
  "idcw",
  "dividend",
  "payout",
  "reinvestment",
  "option",
  "the",
  "mutual",
  "an",
  "open",
  "ended",
]);

function tokens(name: string) {
  return new Set(
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !NOISE.has(t)),
  );
}

/** Best matching factsheet row for a scheme name, or null when unsure. */
export async function lookupSchemeFact(fundName: string): Promise<SchemeFact | null> {
  const facts = await readAllFacts();
  if (facts.length === 0) return null;
  const want = tokens(fundName);
  if (want.size === 0) return null;

  let best: { fact: SchemeFact; score: number } | null = null;
  for (const fact of facts) {
    const have = tokens(fact.scheme);
    let hits = 0;
    for (const t of want) if (have.has(t)) hits++;
    const score = hits / Math.max(want.size, have.size);
    if (!best || score > best.score) best = { fact, score };
  }
  return best && best.score >= 0.7 ? best.fact : null;
}

/* ------------------------------------------------------------- extraction */

/** Read one stored PDF and persist the scheme facts it contains. */
export async function extractDocumentFacts(key: string): Promise<SchemeFact[]> {
  const { readDocumentIndex } = await import("./docs-store.server");
  const { s3GetBytes } = await import("./s3.server");

  const entry = (await readDocumentIndex()).find((d) => d.key === key);
  if (!entry) throw new Error(`Document ${key} is not in the catalogue.`);

  const bytes = await s3GetBytes(key);
  if (!bytes) throw new Error(`Document ${key} could not be read from storage.`);

  const text = await pdfText(bytes);
  if (text.trim().length < 200) throw new Error(`No readable text in ${entry.fileName}.`);

  const merged = new Map<string, SchemeFact>();
  let asOf: string | null = null;

  for (const chunk of chunks(text)) {
    const { asOf: chunkAsOf, schemes } = await aiExtract(chunk);
    asOf = asOf ?? (chunkAsOf ? String(chunkAsOf) : null);
    for (const row of schemes) {
      const scheme = str(row["scheme"]);
      if (!scheme) continue;
      const fact: SchemeFact = {
        scheme,
        aumCrore: num(row["aumCrore"]),
        manager: str(row["manager"]),
        managerSince: str(row["managerSince"]),
        coManagers: Array.isArray(row["coManagers"])
          ? (row["coManagers"] as unknown[]).map((v) => String(v).trim()).filter((v) => v.length > 2).slice(0, 4)
          : [],
        avgMarketCapCrore: num(row["avgMarketCapCrore"]),
        expenseRatio: num(row["expenseRatio"]),
        benchmark: str(row["benchmark"]),
        asOf,
        fundHouse: entry.fundHouse,
        sourceKey: key,
        sourceFile: entry.fileName,
        extractedAt: new Date().toISOString(),
      };
      const id = slug(scheme);
      const prev = merged.get(id);
      merged.set(
        id,
        prev
          ? {
              ...prev,
              aumCrore: prev.aumCrore ?? fact.aumCrore,
              manager: prev.manager ?? fact.manager,
              managerSince: prev.managerSince ?? fact.managerSince,
              coManagers: prev.coManagers.length ? prev.coManagers : fact.coManagers,
              avgMarketCapCrore: prev.avgMarketCapCrore ?? fact.avgMarketCapCrore,
              expenseRatio: prev.expenseRatio ?? fact.expenseRatio,
              benchmark: prev.benchmark ?? fact.benchmark,
            }
          : fact,
      );
    }
  }

  const fresh = [...merged.values()].filter((f) => f.aumCrore !== null || f.manager !== null);
  const current = await readHouseFacts(entry.fundHouse);
  const byId = new Map(current.map((f) => [slug(f.scheme), f]));
  for (const f of fresh) byId.set(slug(f.scheme), f);
  await writeHouseFacts(entry.fundHouse, [...byId.values()]);
  allCache = null;
  return fresh;
}

/** Extract facts from every stored factsheet / portfolio document not yet read. */
export async function extractAllDocumentFacts(limit = 6): Promise<FactsExtractionReport> {
  const { readDocumentIndex } = await import("./docs-store.server");
  const docs = (await readDocumentIndex()).filter(
    (d) => d.docType === "factsheet" || d.docType === "portfolio-disclosure",
  );
  const done = new Set((await readAllFacts()).map((f) => f.sourceKey));
  const todo = docs.filter((d) => !done.has(d.key)).slice(0, limit);

  const report: FactsExtractionReport = {
    job: "extract-doc-facts",
    at: new Date().toISOString(),
    documents: docs.length,
    processed: 0,
    schemes: 0,
    errors: [],
  };

  for (const doc of todo) {
    try {
      const facts = await extractDocumentFacts(doc.key);
      report.processed++;
      report.schemes += facts.length;
    } catch (err) {
      report.errors.push(`${doc.fileName}: ${err instanceof Error ? err.message : "extraction failed"}`);
    }
  }

  const { s3PutJSON } = await import("./s3.server");
  await s3PutJSON(S3_PATHS.ingestLog("extract-doc-facts", report.at), report).catch(() => null);
  return report;
}

export async function factsStatus() {
  const facts = await readAllFacts().catch(() => []);
  return {
    schemes: facts.length,
    houses: new Set(facts.map((f) => f.fundHouse)).size,
    withAum: facts.filter((f) => f.aumCrore !== null).length,
    withManager: facts.filter((f) => f.manager !== null).length,
    documents: new Set(facts.map((f) => f.sourceKey)).size,
  };
}
