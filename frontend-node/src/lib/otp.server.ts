/**
 * Mobile OTP sign-in for Indian numbers, delivered through MSG91 (free-tier
 * friendly Indian SMS provider). We mint and verify the code ourselves so the
 * flow works without a hosted SMS provider being wired into auth settings.
 */

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

export function toE164(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+\d{10,15}$/.test(digits)) return digits;
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  if (/^91\d{10}$/.test(digits)) return `+${digits}`;
  return null;
}

export function randomCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return String(n).padStart(6, "0");
}

export async function hashCode(phone: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${phone}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(36)).join("").slice(0, 32);
}

/** Sends the code over MSG91. Returns null on success, an error string otherwise. */
export async function sendSms(phone: string, code: string): Promise<string | null> {
  const key = process.env["MSG91_AUTH_KEY"];
  if (!key) return "SMS sign-in isn't configured yet — use Google to sign in.";

  const senderId = process.env["MSG91_SENDER_ID"] ?? "MSGIND";
  const templateId = process.env["MSG91_TEMPLATE_ID"];
  const mobile = phone.replace(/^\+/, "");

  try {
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("mobile", mobile);
    url.searchParams.set("otp", code);
    url.searchParams.set("sender", senderId);
    url.searchParams.set("otp_expiry", String(OTP_TTL_MINUTES));
    if (templateId) url.searchParams.set("template_id", templateId);

    const res = await fetch(url, {
      method: "POST",
      headers: { authkey: key, "content-type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok || /error/i.test(text)) {
      console.error("msg91 send failed", res.status, text.slice(0, 300));
      return "We could not send the SMS right now. Try Google sign-in.";
    }
    return null;
  } catch (err) {
    console.error("msg91 send error", err);
    return "We could not reach the SMS provider. Try Google sign-in.";
  }
}
