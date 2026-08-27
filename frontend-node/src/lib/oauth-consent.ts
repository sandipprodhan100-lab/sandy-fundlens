import { supabase } from "@/integrations/supabase/client";

export type OAuthClient = { name?: string; client_name?: string; redirect_uri?: string };

export type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};

type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

/**
 * Lives outside the route file: TanStack's route-splitting transform only keeps
 * known route exports, so a module-scope helper declared inside the route file
 * disappears from the shared chunk and breaks hydration for the whole app.
 */
export const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
