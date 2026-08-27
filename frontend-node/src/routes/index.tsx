import { createFileRoute } from "@tanstack/react-router";
import { HostSwitcher } from "@/components/landing/HostSwitcher";

const SITE = "https://sandipprodhan.in";
const TITLE = "Sandip Prodhan — Enterprise Integration Architect & AI Enabler";
const DESC =
  "Sandip Prodhan's technical portfolio — 14+ years experience architecting Oracle Cloud (OIC, SOA, ODI), AWS, Azure integration solutions, and modern GenAI agentic architectures.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content: DESC,
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Sandip Prodhan" },
      { property: "og:url", content: SITE },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],
  }),
  component: () => <HostSwitcher />,
});
