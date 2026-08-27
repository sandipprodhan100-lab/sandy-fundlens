import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export function AuthStatus({ next = "/analysis" }: { next?: string }) {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (loading) return null;

  if (!session) {
    return (
      <Link
        to="/login"
        search={{ next }}
        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Sign in <ArrowRight className="size-4" />
      </Link>
    );
  }

  const label =
    session.user.email ?? session.user.phone ?? session.user.user_metadata?.["name"] ?? "Signed in";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="max-w-[180px] truncate text-muted-foreground">{String(label)}</span>
      <button
        type="button"
        onClick={signOut}
        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-foreground hover:bg-muted"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}
