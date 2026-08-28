/**
 * Durable, shared result cache.
 *
 * The in-process memo cache dies with every worker instance, so the first
 * visitor after a deploy always paid the full S3 + upstream cost. This layer
 * persists finished analytics results in the backend so a warm result is
 * shared across users, requests and restarts.
 *
 * Server-only: it uses the service-role client and is never reachable from a
 * browser bundle (the `.server.ts` suffix is blocked from client builds).
 */

/** Bump to invalidate every persisted entry after a scoring/logic change. */
export const CACHE_VERSION = "v1";

/** Skip persisting anything larger than this (jsonb write cost > recompute). */
const MAX_PAYLOAD_BYTES = 900_000;

export async function readDurable<R>(key: string): Promise<{ value: R } | null> {
  try {
    if (!process.env["SUPABASE_URL"] || !process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      return null;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("analysis_cache")
      .select("payload,expires_at")
      .eq("cache_key", `${CACHE_VERSION}:${key}`)
      .maybeSingle();
    if (!data) return null;
    if (new Date(data.expires_at).getTime() <= Date.now()) return null;
    return { value: data.payload as R };
  } catch {
    return null;
  }
}

export async function writeDurable(key: string, value: unknown, ttlMs: number): Promise<void> {
  try {
    if (!process.env["SUPABASE_URL"] || !process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      return;
    }
    const serialised = JSON.stringify(value);
    if (!serialised || serialised.length > MAX_PAYLOAD_BYTES) return;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("analysis_cache").upsert(
      {
        cache_key: `${CACHE_VERSION}:${key}`,
        payload: JSON.parse(serialised) as never,
        expires_at: new Date(Date.now() + ttlMs).toISOString(),
      },
      { onConflict: "cache_key" },
    );
  } catch {
    // cache writes are best-effort; never fail the request because of them
  }
}
