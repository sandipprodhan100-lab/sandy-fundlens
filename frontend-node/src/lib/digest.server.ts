import { generateText } from "ai";

import { CATEGORIES, type CategoryKey } from "@/lib/mf-catalog";

type DigestRow = {
  digest_date: string;
  category: string;
  headline: string;
  body: string;
  facts: Record<string, unknown>;
};

/**
 * Scheduled agent: for one category it runs the deterministic engine, then asks
 * the model to write a short commentary strictly over those numbers.
 */
export async function buildCategoryDigest(category: CategoryKey): Promise<DigestRow> {
  const cat = CATEGORIES.find((c) => c.key === category)!;
  const { detectSideways, analyse } = await import("@/lib/mf.server");
  const { windows } = await detectSideways(cat.defaultIndex);
  const win = windows[0];
  if (!win) throw new Error(`No sideways window detected for ${cat.label}.`);

  const result = await analyse({
    category,
    indexKey: cat.defaultIndex,
    start: win.start,
    end: win.end,
  });

  const top = result.funds.slice(0, 5).map((f, i) => ({
    name: f.name,
    rank: i + 1,
    return: Number(f.return.toFixed(2)),
    alpha: Number(f.alpha.toFixed(2)),
    maxDrawdown: Number(f.maxDrawdown.toFixed(2)),
    sharpe: f.sharpe === null ? null : Number(f.sharpe.toFixed(2)),
    aumCrore: f.aumCrore ?? null,
  }));

  const facts = {
    category: cat.label,
    indexLabel: result.indexLabel,
    window: { start: result.start, end: result.end },
    indexReturn: Number(result.indexReturn?.toFixed?.(2) ?? result.indexReturn),
    indexDrift: Number(result.indexDrift?.toFixed?.(2) ?? result.indexDrift),
    analysed: result.analysed,
    top,
  };

  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { createLovableAiGatewayProvider, ANALYST_MODEL } = await import("@/lib/ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(key);

  const { text } = await generateText({
    model: gateway(ANALYST_MODEL),
    system:
      "You write a short daily digest for MF Lens. Use ONLY the JSON figures given; never invent or adjust a number. First line: a headline under 90 characters, no markdown. Then 3-5 sentences of plain commentary naming the window, the benchmark and the leading funds with their alpha and drawdown. End with one short line noting this is analysis, not investment advice.",
    prompt: JSON.stringify(facts),
  });

  const [headlineLine, ...rest] = text.trim().split("\n");
  return {
    digest_date: new Date().toISOString().slice(0, 10),
    category,
    headline: (headlineLine ?? `${cat.label} digest`).replace(/^#+\s*/, "").slice(0, 140),
    body: rest.join("\n").trim() || text.trim(),
    facts,
  };
}

export async function runDigests(categories: CategoryKey[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const results: { category: string; ok: boolean; error?: string }[] = [];
  for (const category of categories) {
    try {
      const row = await buildCategoryDigest(category);
      const { error } = await supabaseAdmin
        .from("agent_digests")
        .upsert(row as never, { onConflict: "digest_date,category" });
      if (error) throw new Error(error.message);
      results.push({ category, ok: true });
    } catch (error) {
      results.push({
        category,
        ok: false,
        error: error instanceof Error ? error.message : "failed",
      });
    }
  }
  return { ranAt: new Date().toISOString(), results };
}
