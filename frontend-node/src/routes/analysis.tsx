import { createFileRoute } from "@tanstack/react-router";

import { MFLensApp } from "@/components/MFLensApp";

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
          "Deep mutual fund analysis across sideways market phases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://fundlens.sandipprodhan.in/og-cover.png" },
      { name: "twitter:image", content: "https://fundlens.sandipprodhan.in/og-cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://fundlens.sandipprodhan.in/analysis" }],
  }),
  component: MFLensApp,
});
