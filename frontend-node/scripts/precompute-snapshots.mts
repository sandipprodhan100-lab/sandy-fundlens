#!/usr/bin/env node
/**
 * Pre-compute analysis snapshots and upload to S3.
 *
 * This script runs the full sideways detection + fund analysis for every
 * (category, index) pair and stores the results as JSON in S3. The
 * Cloudflare Worker then reads a single small JSON file instead of making
 * 50+ S3 GETs and 45+ upstream API calls on every page load.
 *
 * Run:  npx tsx scripts/precompute-snapshots.mts
 *
 * Required env vars (or in .env):
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load .env file if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1]!.trim();
      let val = match[2]!.trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const { CATEGORIES, INDEXES } = await import("../src/lib/mf-catalog.js");
const { S3_PATHS } = await import("../src/lib/s3-layout.js");
const { s3PutJSON, isS3Configured } = await import("../src/lib/s3.server.js");
const { detectSideways, analyse } = await import("../src/lib/mf.server.js");

const VERSION = "v1";

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  MF Lens — Pre-compute analysis snapshots   ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  if (!isS3Configured()) {
    console.error("Error: AWS S3 is not configured. Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET in .env");
    process.exit(1);
  }

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
  } else {
    console.log("All snapshots written successfully to S3 ✓");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
