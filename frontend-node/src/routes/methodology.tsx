import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalPage } from "@/components/LegalPage";

const TITLE = "How MF Lens Detects Sideways Markets — Methodology";
const DESC =
  "The full MF Lens methodology: how sideways index phases are detected, how the fund universe is screened, and how alpha, drawdown, Sharpe, Sortino and Treynor feed the ranking.";
const URL = "https://mutualfundlens.lovable.app/methodology";

const FAQ = [
  {
    q: "What is a sideways market?",
    a: "A sideways (range-bound) market is a stretch where an index neither trends up nor down meaningfully: it oscillates inside a narrow band. MF Lens flags a window as sideways when the index stays inside a tight price band for at least about three months and its start-to-end drift is close to zero.",
  },
  {
    q: "How does MF Lens detect a sideways window?",
    a: "We scan daily index closes and look for the longest stretches where the peak-to-trough range stays within a set percentage band and absolute start-to-end drift stays small. Each detected window is shown with its start date, end date, drift and range, so you can judge the call yourself.",
  },
  {
    q: "Which funds are included?",
    a: "Direct plan, growth option schemes only, one scheme per fund house per category, with a minimum track record of about three years and an AUM that is meaningful relative to the category average. This keeps the leaderboard comparable rather than crowded with duplicate plans.",
  },
  {
    q: "How are funds ranked?",
    a: "Funds are scored on percentile blends of alpha over the benchmark during the window, return through the worst drawdown, volatility, and the Sharpe, Sortino and Treynor ratios. Weights differ by category, because a small-cap fund and an aggressive hybrid fund are not judged on the same things.",
  },
  {
    q: "Sharpe vs Sortino vs Treynor — which matters?",
    a: "Sharpe rewards return per unit of total volatility, Sortino only penalises downside volatility, and Treynor measures return per unit of market beta. In flat Indian markets Sortino and downside capture tend to be the most informative, which is why they carry weight in the blend.",
  },
  {
    q: "Where does the data come from?",
    a: "Daily NAV data comes from AMFI, stored in our own data lake and topped up every day. AUM, manager and portfolio details come from AMC factsheets and public disclosures.",
  },
  {
    q: "Is this investment advice?",
    a: "No. MF Lens is an analytics tool. It describes how schemes behaved in past windows and does not recommend any scheme. It is not a SEBI-registered investment adviser, research analyst or distributor.",
  },
];

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://mutualfundlens.lovable.app/og-cover.png" },
      { name: "twitter:image", content: "https://mutualfundlens.lovable.app/og-cover.png" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Methodology,
});

function Methodology() {
  return (
    <LegalPage title="Methodology" updated="18 August 2026">
      <p>
        MF Lens answers one question: <strong>which funds actually deliver when the index goes
        sideways?</strong> This page explains exactly how that is measured, so you can check the
        workings rather than take a ranking on faith.
      </p>

      <h2>1. Detecting a sideways phase</h2>
      <p>
        We read daily closes for the chosen benchmark (Nifty 50, Nifty Midcap 150, Nifty Smallcap
        250 or Nifty 500) and search for the longest windows that satisfy two conditions at once: a
        narrow peak-to-trough band, and a near-zero start-to-end drift, over a minimum duration of
        roughly one quarter. Every window we surface shows its dates, drift and range so the call
        is auditable.
      </p>

      <h2>2. Screening the universe</h2>
      <ul>
        <li>Direct plan, growth option only.</li>
        <li>One scheme per fund house per category, to avoid near-duplicate plans.</li>
        <li>Minimum track record of about three years.</li>
        <li>AUM that is material relative to the category average.</li>
      </ul>

      <h2>3. Metrics computed per fund</h2>
      <ul>
        <li>Window return and alpha versus the benchmark over the same dates.</li>
        <li>Maximum drawdown and the return achieved through that drawdown.</li>
        <li>Annualised volatility and beta against the benchmark.</li>
        <li>Sharpe, Sortino and Treynor ratios.</li>
        <li>Trailing CAGR (1Y / 3Y / 5Y), AUM and recent flows, style and size classification.</li>
      </ul>

      <h2>4. Turning metrics into a rank</h2>
      <p>
        Each metric is converted to a percentile within the screened category, then blended with
        category-specific weights — downside protection counts for more in hybrid and large-cap
        cohorts, alpha and consistency count for more in mid and small cap. Combined mode repeats
        the exercise across the last three sideways phases and rewards funds that show up
        repeatedly, not once.
      </p>

      <h2>5. Data provenance</h2>
      <p>
        NAV data: AMFI daily NAV files, ingested into our own store and refreshed every business
        day. Portfolio, AUM and manager details: AMC factsheets and public disclosures. Independent
        star ratings shown alongside funds belong to their respective providers.
      </p>

      <h2>Frequently asked questions</h2>
      {FAQ.map((f) => (
        <div key={f.q}>
          <p className="font-medium text-foreground">{f.q}</p>
          <p>{f.a}</p>
        </div>
      ))}

      <p>
        <Link to="/" className="text-foreground underline">
          Run the live analysis
        </Link>
      </p>
    </LegalPage>
  );
}
