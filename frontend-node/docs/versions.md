# MF Lens — version 1 and version 2

One codebase, two builds, switched by `VITE_APP_EDITION`. The split lives in
`src/lib/app-edition.ts` (`FEATURES`) and is enforced both in the UI and on the
server (`src/lib/entitlement.server.ts`).

## Version 1 — `VITE_APP_EDITION="open"` (current default)

~70% of the product, completely free, **no pricing surface at all**:

- Single-phase ranking, combined ranking across the last 3 flat phases, dip radar
- SIP / lumpsum / return calculators, single-fund analyser
- Every sideways window, all categories and benchmarks, charts, holdings,
  manager profiles, AUM stats, leaderboard
- `/pricing`, `/analyst` and their nav links redirect to `/`
- Sitemap omits `/pricing`

Reserved (hidden, not teased with a paywall): model portfolio, sector drift,
holdings overlap, PDF report export, AI Analyst.

The ideology stays reserved in this edition too: thresholds, scoring formula,
per-category weights and ratio maths show a plain-English teaser only.

## Version 2 — `VITE_APP_EDITION="subscription"`

Everything above plus the reserved 30%, the free-demo/Pro gating, pricing page,
checkout, promo codes, account and billing.

## Building each version

```bash
VITE_APP_EDITION=open bun run build          # version 1
VITE_APP_EDITION=subscription bun run build  # version 2
```

For a permanently separate deployment, duplicate the project in Lovable and set
`VITE_APP_EDITION="subscription"` in the copy's `.env.production` — no code fork
is needed, since every difference is behind `FEATURES`.
