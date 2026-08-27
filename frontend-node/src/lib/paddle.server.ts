import { createHmac, timingSafeEqual } from "crypto";

export type PaddleEnv = "sandbox" | "live";

export function getServerPaddleEnvironment(): PaddleEnv {
  const token =
    (typeof import.meta !== "undefined" && import.meta.env?.["VITE_PAYMENTS_CLIENT_TOKEN"]) ||
    process.env["VITE_PAYMENTS_CLIENT_TOKEN"];
  return token?.startsWith("test_") ? "sandbox" : "live";
}

export async function verifyWebhook(req: Request, env: PaddleEnv) {
  const signature = req.headers.get("paddle-signature");
  if (!signature) throw new Error("Missing paddle-signature header");

  const secret =
    env === "sandbox"
      ? process.env["PAYMENTS_SANDBOX_WEBHOOK_SECRET"]
      : process.env["PAYMENTS_LIVE_WEBHOOK_SECRET"];
  if (!secret) throw new Error(`Missing webhook secret for ${env}`);

  const body = await req.text();
  const parts = signature.split(";");
  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "ts") timestamp = value;
    if (key === "h1") signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) {
    throw new Error("Invalid paddle-signature format");
  }

  const signedPayload = `${timestamp}:${body}`;

  const keyCandidates = new Set<string>([secret]);
  const lastUnderscore = secret.lastIndexOf("_");
  if (lastUnderscore !== -1) {
    keyCandidates.add(secret.slice(lastUnderscore + 1));
  }

  for (const key of keyCandidates) {
    const expected = createHmac("sha256", key).update(signedPayload).digest("hex");
    const matched = signatures.some((sig) => {
      try {
        return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
      } catch {
        return false;
      }
    });
    if (matched) return JSON.parse(body);
  }

  throw new Error("Invalid webhook signature");
}

const PADDLE_GATEWAY = "https://connector-gateway.lovable.dev/paddle";

const paddleCache = new Map<string, { at: number; value: any }>();
const PADDLE_CACHE_TTL = 5 * 60 * 1000;

/** GET with a short in-memory cache + retries — Paddle rate-limits aggressively. */
export async function paddleFetchCached(env: PaddleEnv, path: string) {
  const key = `${env}:${path}`;
  const hit = paddleCache.get(key);
  if (hit && Date.now() - hit.at < PADDLE_CACHE_TTL) return hit.value;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const value = await paddleFetch(env, path);
      paddleCache.set(key, { at: Date.now(), value });
      return value;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
  }
  // serve stale rather than 500-ing the pricing page
  if (hit) return hit.value;
  throw lastErr;
}


export async function paddleFetch(env: PaddleEnv, path: string, init?: RequestInit) {
  const lovableKey = process.env["LOVABLE_API_KEY"]?.trim();
  const connectionKey = (
    env === "sandbox"
      ? process.env["PADDLE_SANDBOX_API_KEY"]
      : process.env["PADDLE_LIVE_API_KEY"]
  )?.trim();
  if (!lovableKey || !connectionKey) throw new Error(`Missing Paddle credentials for ${env}`);

  let res: Response | null = null;
  let json: any = {};
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(`${PADDLE_GATEWAY}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    json = await res.json().catch(() => ({}));
    if (res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
  }

  if (!res || !res.ok) {
    throw new Error(json?.error?.detail || `Paddle API ${res?.status} on ${path}`);
  }
  return json;

}
