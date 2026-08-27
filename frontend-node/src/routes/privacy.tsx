import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/LegalPage";

const TITLE = "Privacy Policy — MF Lens";
const DESC =
  "How MF Lens collects, uses and protects your data, including mobile numbers used for OTP sign-in, under India's DPDP Act 2023.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mutualfundlens.lovable.app/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="18 August 2026">
      <p>
        This policy explains what personal data MF Lens processes and why. It is written with
        India's Digital Personal Data Protection Act, 2023 (DPDP Act) in mind.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address (Google sign-in) or mobile number (OTP
          sign-in), and a user identifier.
        </li>
        <li>
          <strong>Subscription data:</strong> plan, status and payment-processor references. Card
          details are handled by our payment processor and never reach our servers.
        </li>
        <li>
          <strong>Usage data:</strong> analyses run, AI analyst queries and counts, error logs, and
          coarse technical data (timestamps, request metadata) needed to operate and secure the
          Service.
        </li>
      </ul>

      <h2>2. Why we use it (purpose)</h2>
      <ul>
        <li>To authenticate you and keep your session secure.</li>
        <li>To deliver the analytics you request and enforce plan limits and fair use.</li>
        <li>To prevent abuse, SMS pumping and fraud.</li>
        <li>To handle billing, support and legal obligations.</li>
      </ul>
      <p>
        We do not sell personal data and we do not use your mobile number for marketing SMS. OTP
        messages are transactional only.
      </p>

      <h2>3. Retention</h2>
      <ul>
        <li>One-time passcodes: deleted on use, and in any case expire within minutes.</li>
        <li>Account and subscription records: kept while the account exists, plus the period we
          are legally required to retain financial records.</li>
        <li>Usage and diagnostic logs: retained for a limited operational period, then deleted or
          aggregated.</li>
      </ul>

      <h2>4. Processors</h2>
      <p>
        We rely on infrastructure and service providers to run the product: our cloud/database and
        authentication provider, our SMS gateway for OTP delivery, our payment processor for
        subscriptions, and an AI provider that powers the analyst feature. They process data only
        on our instructions.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You may request access to, correction of, or erasure of your personal data, withdraw
        consent, or nominate another person to exercise your rights on your behalf. Deleting your
        account removes your profile and usage history. To exercise any right, or to raise a
        grievance, contact <strong>support@mutualfundlens.app</strong>. We respond within 7 working
        days.
      </p>

      <h2>6. Security</h2>
      <p>
        Access to data is protected by row-level authorisation, encrypted transport (HTTPS/HSTS),
        content-security and anti-clickjacking headers, rate limiting on the OTP endpoint and
        server-side entitlement checks. No system is perfectly secure; report suspected issues to
        the contact above.
      </p>

      <h2>7. Children</h2>
      <p>The Service is not intended for users under 18.</p>

      <h2>8. Changes</h2>
      <p>Material changes are reflected in the "last updated" date at the top of this page.</p>
    </LegalPage>
  );
}
