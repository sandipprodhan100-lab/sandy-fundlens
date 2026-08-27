/**
 * Scheduled ingest endpoint for the S3 data lake.
 *
 *   POST /api/public/s3/ingest?job=daily-nav
 *   POST /api/public/s3/ingest?job=backfill&category=large
 *
 * Requires the `x-ingest-secret` header to match INGEST_SECRET; it is public
 * only so an external scheduler (cron) can reach it.
 */

import { createFileRoute } from "@tanstack/react-router";
import { CATEGORIES, type CategoryKey } from "@/lib/mf-catalog";

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function run(request: Request) {
  const secret = process.env["INGEST_SECRET"];
  const provided = request.headers.get("x-ingest-secret") ?? "";
  if (!secret || !provided || !timingSafeEqual(provided, secret)) return unauthorized();

  const url = new URL(request.url);
  const job = url.searchParams.get("job") ?? "daily-nav";
  const { ingestDailyNav, backfillCategory, backfillIndexes, migrateAll } = await import("@/lib/amfi.server");

  try {
    if (job === "daily-nav") {
      return Response.json(await ingestDailyNav());
    }
    if (job === "migrate") {
      const limit = Number(url.searchParams.get("limit") ?? 60);
      return Response.json(await migrateAll(Number.isFinite(limit) ? limit : 60));
    }
    if (job === "backfill-index") {
      return Response.json(await backfillIndexes());
    }
    if (job === "harvest-docs") {
      const { harvestFundDocuments } = await import("@/lib/doc-harvest.server");
      const perHouseLimit = Number(url.searchParams.get("limit") ?? 4);
      return Response.json(
        await harvestFundDocuments({
          house: url.searchParams.get("house") ?? undefined,
          perHouseLimit: Number.isFinite(perHouseLimit) ? perHouseLimit : 4,
        }),
      );
    }
    if (job === "extract-doc-facts") {
      const { extractAllDocumentFacts } = await import("@/lib/doc-facts.server");
      const limit = Number(url.searchParams.get("limit") ?? 6);
      return Response.json(await extractAllDocumentFacts(Number.isFinite(limit) ? limit : 6));
    }
    if (job === "backfill") {
      const category = url.searchParams.get("category") as CategoryKey | null;
      if (!category || !CATEGORIES.some((c) => c.key === category)) {
        return Response.json({ error: "Unknown category" }, { status: 400 });
      }
      const limit = Number(url.searchParams.get("limit") ?? 40);
      return Response.json(await backfillCategory(category, Number.isFinite(limit) ? limit : 40));
    }
    return Response.json({ error: `Unknown job "${job}"` }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Ingest failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/s3/ingest")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
