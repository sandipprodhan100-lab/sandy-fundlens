import { getRequest } from "@tanstack/react-start/server";

export type Viewer = { userId: string | null; isPro: boolean };

/**
 * Server-side entitlement check. Anonymous callers get a non-pro viewer so the
 * demo/free flows keep working, but paid data must be gated on `isPro` inside
 * the handler — never in the UI alone.
 */
export async function getViewer(): Promise<Viewer> {
  // Open edition: everything is free, so every viewer is treated as entitled.
  const openEdition = import.meta.env["VITE_APP_EDITION"] !== "subscription";

  let token: string | null = null;
  try {
    const request = getRequest();
    const header = request?.headers?.get("authorization") ?? null;
    if (header?.startsWith("Bearer ")) token = header.slice("Bearer ".length).trim() || null;
  } catch {
    token = null;
  }

  if (!token || token.split(".").length !== 3) return { userId: null, isPro: openEdition };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Verify the same way the generated auth middleware does: `getClaims` handles
  // asymmetric signing keys, while `auth.getUser(token)` can reject them and
  // silently downgrade a paying/admin user to anonymous.
  let userId: string | null = null;
  try {
    const { data: claimData } = await supabaseAdmin.auth.getClaims(token);
    userId = (claimData?.claims?.sub as string | undefined) ?? null;
  } catch {
    userId = null;
  }
  if (!userId) {
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    userId = userData?.user?.id ?? null;
  }
  if (!userId) return { userId: null, isPro: openEdition };

  if (openEdition) return { userId, isPro: true };

  const { getServerPaddleEnvironment } = await import("@/lib/paddle.server");
  const { data: pro } = await supabaseAdmin.rpc("has_pro_access", {
    user_uuid: userId,
    check_env: getServerPaddleEnvironment(),
  });

  return { userId, isPro: !!pro };
}

export async function requirePro(): Promise<void> {
  const viewer = await getViewer();
  if (!viewer.isPro) {
    throw new Error("This feature requires an active MF Lens Pro plan.");
  }
}

/** Admin-only gate for the S3 storage console (data lake operations). */
export async function requireStorageAdmin(): Promise<string> {
  const viewer = await getViewer();
  if (!viewer.userId) throw new Error("Sign in to manage storage.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
    _user_id: viewer.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Storage administration is restricted to admins.");
  return viewer.userId;
}

