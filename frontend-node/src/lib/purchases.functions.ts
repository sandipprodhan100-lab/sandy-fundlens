import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getServerPaddleEnvironment, type PaddleEnv } from "@/lib/paddle.server";

export const hasProAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const env = getServerPaddleEnvironment() as PaddleEnv;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.rpc("has_pro_access", {
      user_uuid: context.userId,
      check_env: env,
    });
    return !!data;
  });
