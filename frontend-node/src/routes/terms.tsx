import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/LegalPage";

const TITLE = "Terms of Service — MF Lens";
const DESC =
  "The terms that govern use of MF Lens: analytics-only scope, no investment advice, subscriptions, acceptable use and liability.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://fundlens.sandipprodhan.in/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="18 August 2026">
      <p>
        These terms govern your use of MF Lens (the "Service"). By using the Service you accept
        them. If you do not accept them, do not use the Service.
      </p>

      <h2>1. What MF Lens is</h2>
      <p>
        MF Lens is a quantitative research and analytics tool. It analyses publicly available
        mutual fund NAV data and fund-house disclosures to describe how schemes behaved during
        past market phases, including "sideways" (range-bound) windows of Indian equity indices.
      </p>

      <h2>2. What MF Lens is not</h2>
      <p>
        <strong>
          MF Lens is not investment advice and does not recommend any scheme, security or course of
          action.
        </strong>{" "}
        We are not a SEBI-registered investment adviser, research analyst, portfolio manager or
        mutual fund distributor. Outputs — including rankings, calculators, model allocations and
        AI-generated summaries — are descriptive analytics on historical data. Past performance is
        not indicative of future returns. Decisions you take are your own; consult a
        SEBI-registered adviser before investing.
      </p>

      <h2>3. Data accuracy</h2>
      <p>
        Data is sourced from AMFI daily NAV files, AMC factsheets and other public disclosures.
        Data may be delayed, incomplete or wrong, and derived metrics may contain errors. The
        Service is provided "as is", without warranties of any kind.
      </p>

      <h2>4. Accounts and acceptable use</h2>
      <ul>
        <li>You are responsible for activity under your account and for keeping access secure.</li>
        <li>
          Do not scrape, resell, redistribute or reverse engineer the Service, attempt to bypass
          paywalls or rate limits, or probe the infrastructure without written permission.
        </li>
        <li>Automated access is only permitted through documented interfaces at fair-use rates.</li>
      </ul>

      <h2>5. Subscriptions and refunds</h2>
      <p>
        Paid plans renew automatically until cancelled, and are billed in INR through our payment
        processor. Taxes may apply. You can cancel at any time from your account; access continues
        to the end of the paid period. Where a refund is granted, paid access is revoked
        immediately.
      </p>

      <h2>6. Liability</h2>
      <p>
        To the maximum extent permitted by law, MF Lens is not liable for investment losses or for
        indirect, incidental or consequential damages. Our aggregate liability is limited to the
        amount you paid in the twelve months before the claim.
      </p>

      <h2>7. Changes and contact</h2>
      <p>
        We may update these terms; material changes will be reflected in the "last updated" date.
        Questions, complaints or grievances: <strong>support@mutualfundlens.app</strong>. We aim to
        respond within 7 working days.
      </p>
    </LegalPage>
  );
}
