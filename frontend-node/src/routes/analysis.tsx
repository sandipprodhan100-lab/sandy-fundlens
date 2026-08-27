import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { MFLensApp } from "@/components/MFLensApp";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/analysis")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Full Fund Analysis — MF Lens" },
      {
        name: "description",
        content:
          "Run the full MF Lens analysis: every sideways window, all equity categories, risk ratios, holdings, manager profiles and PDF reports.",
      },
      { property: "og:title", content: "Full Fund Analysis — MF Lens" },
      {
        property: "og:description",
        content:
          "Signed-in workspace for deep mutual fund analysis across sideways market phases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://mutualfundlens.lovable.app/og-cover.png" },
      { name: "twitter:image", content: "https://mutualfundlens.lovable.app/og-cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://mutualfundlens.lovable.app/analysis" }],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setReady(true);
      else navigate({ to: "/login", search: { next: "/analysis" }, replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin text-primary" /> Checking your session…
      </div>
    );
  }

  return <MFLensApp />;
}
