/**
 * Low-level AWS S3 access for MF Lens.
 *
 * In Cloudflare, requests use direct AWS Signature V4 authentication.
 * Older Lovable environments can fall back to the connector gateway when
 * direct AWS credentials are not configured.
 *
 * The bucket is the system of record for the app: NAV history (Parquet),
 * raw daily AMFI downloads, fund-house documents and app config all live here.
 */

const GATEWAY = "https://connector-gateway.lovable.dev/aws_s3";
const SIGN = "https://connector-gateway.lovable.dev/api/v1/sign_storage_url?provider=aws_s3";

export type S3Object = { key: string; size: number; lastModified: string };

type AwsConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  sessionToken?: string;
};

function env(name: string) {
  return process.env[name]?.trim();
}

function awsConfig(): AwsConfig | null {
  const accessKeyId = env("AWS_ACCESS_KEY_ID");
  const secretAccessKey = env("AWS_SECRET_ACCESS_KEY");
  const region = env("AWS_REGION") ?? env("AWS_DEFAULT_REGION");
  const bucket = env("AWS_S3_BUCKET") ?? env("S3_BUCKET");
  if (!accessKeyId || !secretAccessKey || !region || !bucket) return null;
  const config: AwsConfig = { accessKeyId, secretAccessKey, region, bucket };
  const sessionToken = env("AWS_SESSION_TOKEN");
  if (sessionToken) {
    config.sessionToken = sessionToken;
  }
  return config;
}

function lovableHeaders(): Record<string, string> | null {
  const lovableKey = env("LOVABLE_API_KEY");
  const connectionKey = env("AWS_S3_API_KEY");
  if (!lovableKey || !connectionKey) return null;
  return { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectionKey };
}

export function isS3Configured() {
  return awsConfig() !== null || lovableHeaders() !== null;
}

function requireAwsConfig() {
  const config = awsConfig();
  if (!config) throw new Error("AWS S3 credentials are not configured.");
  return config;
}

function requireLovableHeaders() {
  const headers = lovableHeaders();
  if (!headers) throw new Error("AWS S3 is not connected for this project.");
  return headers;
}

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeKey(key: string) {
  return key.split("/").map(awsEncode).join("/");
}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}

async function hmac(key: ArrayBuffer | Uint8Array, value: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value));
}

async function signingKey(secret: string, date: string, region: string) {
  const dateKey = await hmac(new TextEncoder().encode(`AWS4${secret}`), date);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

function host(config: AwsConfig) {
  return `${config.bucket}.s3.${config.region}.amazonaws.com`;
}

function endpoint(config: AwsConfig, key?: string) {
  return `https://${host(config)}/${key ? encodeKey(key) : ""}`;
}

function canonicalQuery(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${awsEncode(key)}=${awsEncode(value)}`)
    .join("&");
}

async function signedRequest(
  config: AwsConfig,
  method: string,
  key: string | undefined,
  query: Record<string, string> = {},
  body?: Uint8Array | string,
  contentType?: string,
) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const payloadHash = await sha256(body ?? "");
  const headers: Record<string, string> = { host: host(config), "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  if (contentType) headers["content-type"] = contentType;
  if (config.sessionToken) headers["x-amz-security-token"] = config.sessionToken;
  const signedHeaders = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaders.map((name) => `${name}:${headers[name]!.trim()}\n`).join("");
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const canonicalRequest = [method, `/${key ? encodeKey(key) : ""}`, canonicalQuery(query), canonicalHeaders, signedHeaders.join(";"), payloadHash].join("\n");
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256(canonicalRequest)}`;
  const signature = hex(await hmac(await signingKey(config.secretAccessKey, date, config.region), stringToSign));
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`;
  const url = `${endpoint(config, key)}${Object.keys(query).length ? `?${canonicalQuery(query)}` : ""}`;
  return fetch(url, { method, headers, body: body as BodyInit | undefined, signal: AbortSignal.timeout(120000) });
}

async function directSignedUrl(config: AwsConfig, key: string, mode: "read" | "write") {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "900",
    "X-Amz-SignedHeaders": "host",
  };
  if (config.sessionToken) query["X-Amz-Security-Token"] = config.sessionToken;
  const canonicalRequest = [mode === "read" ? "GET" : "PUT", `/${encodeKey(key)}`, canonicalQuery(query), `host:${host(config)}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256(canonicalRequest)}`;
  query["X-Amz-Signature"] = hex(await hmac(await signingKey(config.secretAccessKey, date, config.region), stringToSign));
  return `${endpoint(config, key)}?${canonicalQuery(query)}`;
}

/** List every object under a prefix (handles pagination). */
export async function s3List(prefix: string, limit = 5000): Promise<S3Object[]> {
  const config = awsConfig();
  if (!config) return lovableList(prefix, limit);
  const out: S3Object[] = [];
  let token: string | undefined;
  do {
    const query: Record<string, string> = { "list-type": "2", prefix, "max-keys": "1000" };
    if (token) query["continuation-token"] = token;
    const res = await signedRequest(config, "GET", undefined, query);
    if (!res.ok) throw new Error(`S3 list failed [${res.status}]: ${await res.text()}`);
    const xml = await res.text();
    for (const match of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const block = match[1]!;
      const key = block.match(/<Key>([^<]*)<\/Key>/)?.[1];
      if (!key) continue;
      out.push({ key: decodeXml(key), size: Number(block.match(/<Size>(\d+)<\/Size>/)?.[1] ?? 0), lastModified: block.match(/<LastModified>([^<]*)<\/LastModified>/)?.[1] ?? "" });
      if (out.length >= limit) return out;
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? xml.match(/<NextContinuationToken>([^<]*)<\/NextContinuationToken>/)?.[1] : undefined;
  } while (token);
  return out;
}

async function lovableList(prefix: string, limit: number) {
  const headers = requireLovableHeaders();
  const out: S3Object[] = [];
  let token: string | undefined;
  do {
    const params = new URLSearchParams({ "list-type": "2", prefix, "max-keys": "1000" });
    if (token) params.set("continuation-token", token);
    const res = await fetch(`${GATEWAY}/?${params}`, { headers, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`S3 list failed [${res.status}]: ${await res.text()}`);
    const xml = await res.text();
    for (const match of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const block = match[1]!;
      const key = block.match(/<Key>([^<]*)<\/Key>/)?.[1];
      if (!key) continue;
      out.push({ key: decodeXml(key), size: Number(block.match(/<Size>(\d+)<\/Size>/)?.[1] ?? 0), lastModified: block.match(/<LastModified>([^<]*)<\/LastModified>/)?.[1] ?? "" });
      if (out.length >= limit) return out;
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? xml.match(/<NextContinuationToken>([^<]*)<\/NextContinuationToken>/)?.[1] : undefined;
  } while (token);
  return out;
}

export async function s3Head(key: string): Promise<{ size: number; contentType: string } | null> {
  const config = awsConfig();
  const res = config ? await signedRequest(config, "HEAD", key) : await fetch(`${GATEWAY}/${encodeURI(key)}`, { method: "HEAD", headers: requireLovableHeaders(), signal: AbortSignal.timeout(20000) });
  if (res.status === 404 || !res.ok) return null;
  return { size: Number(res.headers.get("content-length") ?? 0), contentType: res.headers.get("content-type") ?? "application/octet-stream" };
}

export async function s3SignedUrl(key: string, mode: "read" | "write"): Promise<string> {
  const config = awsConfig();
  if (config) return directSignedUrl(config, key, mode);
  const headers = requireLovableHeaders();
  let lastErr = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${SIGN}&mode=${mode}`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ object_path: key }), signal: AbortSignal.timeout(30000) });
      if (res.ok) return ((await res.json()) as { url: string }).url;
      lastErr = `[${res.status}]: ${await res.text()}`;
      if (res.status < 500 && res.status !== 429) break;
    } catch (error) {
      lastErr = error instanceof Error ? error.message : "network error";
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }
  throw new Error(`S3 sign (${mode}) failed ${lastErr}`);
}

export async function s3GetBytes(key: string): Promise<Uint8Array | null> {
  const config = awsConfig();
  const res = config ? await signedRequest(config, "GET", key) : await fetch(await s3SignedUrl(key, "read"), { signal: AbortSignal.timeout(120000) });
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) throw new Error(`S3 download failed [${res.status}] for ${key}`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function s3GetText(key: string): Promise<string | null> {
  const bytes = await s3GetBytes(key);
  return bytes ? new TextDecoder().decode(bytes) : null;
}

export async function s3GetJSON<T>(key: string): Promise<T | null> {
  const text = await s3GetText(key);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function s3PutBytes(key: string, body: Uint8Array | string, contentType: string) {
  const config = awsConfig();
  const res = config ? await signedRequest(config, "PUT", key, {}, body, contentType) : await fetch(await s3SignedUrl(key, "write"), { method: "PUT", body: body as BodyInit, headers: { "Content-Type": contentType }, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`S3 upload failed [${res.status}] for ${key}: ${await res.text()}`);
  return { key, bytes: typeof body === "string" ? body.length : body.byteLength };
}

export async function s3PutJSON(key: string, value: unknown) {
  return s3PutBytes(key, JSON.stringify(value, null, 2), "application/json");
}
