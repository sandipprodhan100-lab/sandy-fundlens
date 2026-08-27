/**
 * Scheduled analyst digest.
 *
 *   POST /api/public/agent/digest            -> all categories
 *   POST /api/public/agent/digest?category=large
 *
 * Requires the `x-ingest-secret` header to match INGEST_SECRET; the route is
 * public only so an external scheduler can reach it.
 */

import { createFileRoute } from "@tanstack/react-router";

import { CATEGORIES, type CategoryKey } from "@/lib/mf-catalog";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function run(request: Request) {
  const secret = process.env["INGEST_SECRET"];
  const provided = request.headers.get("x-ingest-secret") ?? "";
  if (!secret || !provided || !timingSafeEqual(provided, secret)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const one = url.searchParams.get("category");
  const categories = one
    ? CATEGORIES.filter((c) => c.key === one).map((c) => c.key)
    : CATEGORIES.map((c) => c.key);
  if (categories.length === 0) {
    return Response.json({ error: "Unknown category" }, { status: 400 });
  }

  const { runDigests } = await import("@/lib/digest.server");
  return Response.json(await runDigests(categories as CategoryKey[]));
}

export const Route = createFileRoute("/api/public/agent/digest")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
