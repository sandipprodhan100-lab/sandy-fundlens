import { getRequest } from "@tanstack/react-start/server";

export type Viewer = { userId: string | null; isPro: boolean };

/**
 * Open entitlement check: every viewer has full Pro access to all features.
 */
export async function getViewer(): Promise<Viewer> {
  let token: string | null = null;
  try {
    const request = getRequest();
    const header = request?.headers?.get("authorization") ?? null;
    if (header?.startsWith("Bearer ")) token = header.slice("Bearer ".length).trim() || null;
  } catch {
    token = null;
  }

  let userId: string | null = null;
  if (token && token.split(".").length === 3) {
    try {
      if (process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: claimData } = await supabaseAdmin.auth.getClaims(token);
        userId = (claimData?.claims?.sub as string | undefined) ?? null;
        if (!userId) {
          const { data: userData } = await supabaseAdmin.auth.getUser(token);
          userId = userData?.user?.id ?? null;
        }
      }
    } catch {
      userId = null;
    }
  }

  return { userId, isPro: true };
}

export async function requirePro(): Promise<void> {
  // Open edition: all features are accessible to everyone
  return;
}

/** Admin-only gate for the S3 storage console (data lake operations). */
export async function requireStorageAdmin(): Promise<string> {
  const viewer = await getViewer();
  if (!viewer.userId) throw new Error("Sign in to manage storage.");
  if (process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: viewer.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Storage administration is restricted to admins.");
  }
  return viewer.userId;
}
