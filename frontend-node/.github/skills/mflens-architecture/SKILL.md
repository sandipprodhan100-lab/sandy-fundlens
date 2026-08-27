---
name: mflens-architecture
description: "Use when analyzing, documenting, reviewing, or extending the MF Lens application architecture. Covers TanStack Start routes, React components, server functions, Supabase auth and entitlements, S3 data lake, mutual-fund analysis engines, MCP tools, editorial content, Paddle billing, and Cloudflare deployment."
---

# MF Lens Architecture

Use this skill to keep architecture work grounded in the current MF Lens implementation. The canonical diagram and component inventory are stored in `.github/modernize/assessment/engines/facts/architecture-diagram.md`.

## System boundaries

MF Lens is a TypeScript React application built with TanStack Start and Vite. It has two user-facing surfaces:

- The public Rishi landing page, including Word-backed stories and poetry with local image assets.
- The MF Lens analytics application for sideways-market detection, fund ranking, charts, holdings, profiles, calculators, model portfolios, and the AI analyst.

The deployed runtime is a Cloudflare Worker with static assets. Supabase provides authentication and relational account data. An S3-compatible bucket is the system of record for NAV history, raw downloads, AMC documents, extracted facts, configuration, and code snapshots.

## Architecture rules

- Keep route files in `src/routes/` and reusable UI in `src/components/`.
- Keep server-only domain logic and external credentials in `src/lib/*.server.ts` or server functions.
- Define client-to-server operations with `createServerFn` in `src/lib/*.functions.ts` and validate inputs with Zod.
- Enforce paid access in server handlers through entitlement checks; UI gating is not a security boundary.
- Attach Supabase bearer tokens to server-function calls with the registered auth middleware.
- Read NAV and document data through the S3 adapters and domain services instead of embedding data in components.
- Keep editorial sources under `public/stories/<slug>/story.docx` and `public/stories/<slug>/images/`; regenerate `src/generated/stories.ts` with `npm run build-stories`.
- Do not edit generated route or story files by hand.
- Never expose AWS, Supabase service-role, Paddle, or other secrets to client modules or public assets.

## Architecture workflow

1. Read the canonical architecture artifact and the relevant source files before proposing changes.
2. Update the artifact when a boundary, integration, storage contract, or major component changes.
3. Keep Mermaid diagrams under 40 nodes and use ASCII-safe labels.
4. Validate route, server, and shared-component changes with `npm run build`; validate content changes with `npm run build-stories` followed by `npm run build`.
5. For a production change, use `npm run deploy` and record the Cloudflare Worker version.

## Key references

- Routes: `src/routes/`
- Root shell and global auth listener: `src/routes/__root.tsx`
- Analytics application: `src/components/MFLensApp.tsx`
- Server functions: `src/lib/*.functions.ts`
- Mutual-fund domain engines: `src/lib/mf.server.ts`, `src/lib/mf-multi.server.ts`, `src/lib/mf-catalog.ts`
- Authentication and session state: `src/lib/auth.ts`, `src/integrations/supabase/`
- Entitlements and billing: `src/lib/entitlement.server.ts`, `src/lib/purchases.functions.ts`, `src/lib/paddle*.ts`
- Storage adapters: `src/lib/s3.server.ts`, `src/lib/docs-store.server.ts`, `src/lib/app-config.server.ts`
- Editorial pipeline: `scripts/build-stories.mjs`, `public/stories/`, `src/generated/stories.ts`
- Deployment: `wrangler.jsonc`, `package.json`
