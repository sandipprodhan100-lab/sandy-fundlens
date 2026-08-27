import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

const IDLE_MS = 15 * 60 * 1000; // sign out after 15 minutes of inactivity
const WARN_MS = 60 * 1000; // warn one minute before

const ACTIVITY = ["mousedown", "keydown", "touchstart", "scroll", "visibilitychange"] as const;

/**
 * Signs the user out after 15 minutes without interaction, with a one-minute
 * warning that lets them stay signed in.
 */
export function SessionTimeout() {
  const { session } = useSession();
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const warnTimer = useRef<number | null>(null);
  const outTimer = useRef<number | null>(null);
  const tick = useRef<number | null>(null);
  const warningRef = useRef(false);

  const clearAll = useCallback(() => {
    if (warnTimer.current) window.clearTimeout(warnTimer.current);
    if (outTimer.current) window.clearTimeout(outTimer.current);
    if (tick.current) window.clearInterval(tick.current);
    warnTimer.current = null;
    outTimer.current = null;
    tick.current = null;
  }, []);

  const signOutNow = useCallback(async () => {
    clearAll();
    setWarning(false);
    await supabase.auth.signOut();
    window.location.assign("/login?timeout=1");
  }, [clearAll]);

  const reset = useCallback(() => {
    clearAll();
    setWarning(false);
    warningRef.current = false;
    setSecondsLeft(60);
    warnTimer.current = window.setTimeout(() => {
      setWarning(true);
      warningRef.current = true;
      setSecondsLeft(60);
      tick.current = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    }, IDLE_MS - WARN_MS);
    outTimer.current = window.setTimeout(() => void signOutNow(), IDLE_MS);
  }, [clearAll, signOutNow]);

  useEffect(() => {
    if (!session) {
      clearAll();
      setWarning(false);
      return;
    }
    reset();
    const onActivity = () => {
      // While the warning is up the user must click "Stay signed in" — casual
      // mouse movement should not silently extend the session.
      if (!warningRef.current) reset();
    };
    ACTIVITY.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      ACTIVITY.forEach((e) => window.removeEventListener(e, onActivity));
      clearAll();
    };
  }, [session, reset, clearAll]);

  if (!session || !warning) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] mx-auto w-[min(92vw,26rem)] rounded-lg border border-sideways/50 bg-popover p-4 shadow-lg">
      <p className="text-sm font-semibold text-foreground">Session about to expire</p>
      <p className="mt-1 text-xs text-muted-foreground">
        You have been inactive for a while. You will be signed out in{" "}
        <span className="num font-semibold text-foreground">{secondsLeft}s</span>.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Stay signed in
        </button>
        <button
          onClick={() => void signOutNow()}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Sign out now
        </button>
      </div>
    </div>
  );
}
