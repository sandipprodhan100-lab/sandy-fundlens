import { useEffect, useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { SandipPortfolio } from "@/components/landing/SandipPortfolio";

export function HostSwitcher() {
  const [isFundLens, setIsFundLens] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const appParam = searchParams.get("app");

      if (appParam === "fundlens") {
        setIsFundLens(true);
      } else if (appParam === "portfolio") {
        setIsFundLens(false);
      } else if (host.includes("fundlens") || host.includes("mflens")) {
        setIsFundLens(true);
      }
    }
  }, []);

  // Avoid flash during SSR by showing the portfolio by default unless hostname is fundlens
  if (!mounted) {
    return <SandipPortfolio />;
  }

  if (isFundLens) {
    return <LandingPage />;
  }

  return <SandipPortfolio />;
}

