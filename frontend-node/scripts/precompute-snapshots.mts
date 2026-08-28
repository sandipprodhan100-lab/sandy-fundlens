#!/usr/bin/env node
/**
 * Pre-compute analysis snapshots and upload to S3.
 *
 * This script runs the full sideways detection + fund analysis for every
 * (category, index) pair and stores the results as JSON in S3.  The
 * Cloudflare Worker then reads a single small JSON file instead of making
 * 50+ S3 GETs and 45+ upstream API calls on every page load.
 *
 * Run:  node --import tsx scripts/precompute-snapshots.mjs
 * Or:   npx tsx scripts/precompute-snapshots.mjs
 *
 * Required env vars:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
 */

import { CATEGORIES, INDEXES } from "../src/lib/mf-catalog.js";
import { S3_PATHS } from "../src/lib/s3-layout.js";
import { s3PutJSON } from "../src/lib/s3.server.js";
import { detectSideways, analyse } from "../src/lib/mf.server.js";

const VERSION = "v1";

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  MF Lens — Pre-compute analysis snapshots   ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  const startAll = Date.now();
  const errors: string[] = [];

  // 1. Pre-compute sideways windows for each index
  console.log("── Sideways windows ──");
  const sidewaysResults = new Map<string, Awaited<ReturnType<typeof detectSideways>>>();
  for (const idx of INDEXES) {
    const t0 = Date.now();
    try {
      console.log(`  [${idx.key}] computing...`);
      const result = await detectSideways(idx.key);
      sidewaysResults.set(idx.key, result);
      const envelope = {
        _meta: {
          refreshedAt: new Date().toISOString(),
          version: VERSION,
          durationMs: Date.now() - t0,
        },
        data: result,
      };
      await s3PutJSON(S3_PATHS.sidewaysSnapshot(idx.key), envelope);
      console.log(
        `  [${idx.key}] ✓ ${result.windows.length} windows, ${((Date.now() - t0) / 1000).toFixed(1)}s`,
      );
    } catch (err) {
      const msg = `sideways/${idx.key}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`  [${idx.key}] ✗ ${msg}`);
    }
  }

  // 2. Pre-compute full analysis for each (category, defaultIndex) pair
  console.log("\n── Fund analysis ──");
  for (const cat of CATEGORIES) {
    const idx = INDEXES.find((i) => i.key === cat.defaultIndex)!;
    const sidewaysData = sidewaysResults.get(idx.key);
    if (!sidewaysData || sidewaysData.windows.length === 0) {
      console.log(`  [${cat.key}/${idx.key}] skipped — no sideways windows`);
      continue;
    }

    // Use the most recent sideways window as the analysis window
    const latestWindow = sidewaysData.windows[0]!;
    const t0 = Date.now();
    try {
      console.log(`  [${cat.key}/${idx.key}] computing (${latestWindow.start} → ${latestWindow.end})...`);
      const result = await analyse({
        category: cat.key,
        indexKey: idx.key,
        start: latestWindow.start,
        end: latestWindow.end,
      });
      const envelope = {
        _meta: {
          refreshedAt: new Date().toISOString(),
          version: VERSION,
          durationMs: Date.now() - t0,
        },
        data: result,
      };
      await s3PutJSON(S3_PATHS.analysisSnapshot(cat.key, idx.key), envelope);
      console.log(
        `  [${cat.key}/${idx.key}] ✓ ${result.analysed} funds, top score ${result.funds[0]?.score?.toFixed(1) ?? "-"}, ${((Date.now() - t0) / 1000).toFixed(1)}s`,
      );
    } catch (err) {
      const msg = `analysis/${cat.key}_${idx.key}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`  [${cat.key}/${idx.key}] ✗ ${msg}`);
    }
  }

  // 3. Write global metadata
  const meta = {
    refreshedAt: new Date().toISOString(),
    version: VERSION,
    totalDurationMs: Date.now() - startAll,
    errors,
  };
  await s3PutJSON(S3_PATHS.snapshotMeta, meta);

  console.log(`\n═══════════════════════════════════════`);
  console.log(`Total: ${((Date.now() - startAll) / 1000).toFixed(1)}s`);
  if (errors.length) {
    console.log(`Errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e}`));
    process.exit(1);
  } else {
    console.log("All snapshots written successfully ✓");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
