import { createStart } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/start-client-core";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Baseline browser-side hardening for every response. Framing is restricted
// through CSP frame-ancestors (which supports an allowlist) rather than
// X-Frame-Options, so the Lovable preview iframe keeps working while third
// party clickjacking is blocked.
const CSP = [
  "default-src 'self'",
  // Vite/React Start inline bootstrap + Paddle checkout need inline/eval.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://*.paddle.com https://*.lovable.dev https://*.lovable.app",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https://*.paddle.com https://*.supabase.co",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self' https://*.lovableproject.com https://*.lovable.app https://*.lovable.dev https://lovable.dev",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()",
  "cross-origin-opener-policy": "same-origin-allow-popups",
  "cross-origin-resource-policy": "same-site",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-dns-prefetch-control": "off",
};


/** Hosts that legitimately embed the app in an iframe (Lovable editor preview). */
const isPreviewHost = (host: string) =>
  host.includes("id-preview--") || host.includes("lovableproject.com") || host.includes("lovable.dev");

const securityHeadersMiddleware = createMiddleware().server(async ({ next, request }) => {
  const result = await next();
  const response = (result as { response?: Response }).response;
  const target = response instanceof Response ? response : (result as unknown as Response);
  if (target instanceof Response) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      if (!target.headers.has(key)) target.headers.set(key, value);
    }
    // Legacy clickjacking header for scanners that don't read frame-ancestors.
    // Skipped on the editor preview so the embedded iframe keeps rendering.
    let host = "";
    try {
      host = new URL(request.url).host;
    } catch {
      host = "";
    }
    if (!isPreviewHost(host) && !target.headers.has("x-frame-options")) {
      target.headers.set("x-frame-options", "SAMEORIGIN");
    }
  }
  return result;
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createMiddleware().server(async (ctx) => {
  if (ctx.handlerType !== "serverFn") return ctx.next();
  const fetchSite = ctx.request.headers.get("Sec-Fetch-Site");
  if (fetchSite === "same-origin" || fetchSite === "same-site") return ctx.next();

  const requestOrigin = new URL(ctx.request.url).origin;
  const origin = ctx.request.headers.get("Origin");
  if (origin !== null && origin === requestOrigin) return ctx.next();

  const referer = ctx.request.headers.get("Referer");
  if (referer !== null && new URL(referer).origin === requestOrigin) return ctx.next();
  if (fetchSite === null && origin === null && referer === null) return ctx.next();
  return new Response("Forbidden", { status: 403 });
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [securityHeadersMiddleware, errorMiddleware, csrfMiddleware],
}));
