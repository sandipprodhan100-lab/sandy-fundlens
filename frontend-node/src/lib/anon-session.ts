/** Per-browser-session id used to meter the 3 free analyst questions. */
const KEY = "mflens:analyst-session";

export const TRIAL_THREAD_ID = "trial";

export function getAnonSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
