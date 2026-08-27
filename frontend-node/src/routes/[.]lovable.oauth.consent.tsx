import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { oauth } from "@/lib/oauth-consent";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { next: location.pathname + location.searchStr },
      });
    }
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-6 py-20 text-sm text-muted-foreground">
      Could not load this authorization request: {String((error as Error)?.message ?? error)}
    </main>
  ),
  component: Consent,
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "an app";
  const scopes = (details?.scope ?? "").split(" ").filter(Boolean);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      return setError(err.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Connect {clientName} to Fund Navigator
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This lets {clientName} call Fund Navigator&rsquo;s analysis tools as you.
      </p>

      {details?.client?.redirect_uri && (
        <p className="mt-2 break-all text-xs text-muted-foreground">
          Redirects to {details.client.redirect_uri}
        </p>
      )}

      <ul className="mt-6 space-y-2 text-sm text-foreground">
        {scopes.includes("profile") && <li>Share your basic profile</li>}
        {scopes.includes("email") && <li>Share your email address</li>}
        {scopes
          .filter((s) => !["openid", "email", "profile"].includes(s))
          .map((s) => (
            <li key={s}>Additional permission requested: {s}</li>
          ))}
        <li>Run fund screening, ranking, holdings and manager lookups</li>
      </ul>

      <p className="mt-4 text-xs text-muted-foreground">
        This does not bypass this app&rsquo;s permissions or backend policies.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(true)}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(false)}
          className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
        >
          Cancel connection
        </button>
      </div>
    </main>
  );
}
