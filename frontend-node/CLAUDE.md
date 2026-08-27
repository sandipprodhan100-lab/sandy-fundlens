# Fund Navigator

## Project

Fund Navigator is a TanStack Start application built with TypeScript, React, and Tailwind CSS. It provides mutual fund research, comparison, analysis, and portfolio tools.

## Commands

Use npm for project scripts on the local Windows setup:

- `npm install` - install dependencies
- `npm run dev` - start the Vite development server
- `npm run build` - create a production build
- `npm run deploy:dry-run` - build and validate the Cloudflare Worker bundle
- `npm run deploy` - build and deploy to Cloudflare Workers
- `npm run lint` - run ESLint
- `npm run format` - format the repository with Prettier

Run the narrowest relevant check after making changes, then run `bun run build` for changes that affect routes, server code, configuration, or shared components.

## Structure

- `src/routes/` contains TanStack file-based routes and server endpoints.
- `src/components/` contains reusable UI and feature components.
- `src/lib/` contains server-side services, data access, and domain logic.
- `src/integrations/` contains external service clients and adapters.
- `src/server.ts` is the SSR/server wrapper and `src/start.ts` configures request middleware.
- `supabase/` contains database configuration and migrations.

## Conventions

- Preserve existing TypeScript, React, TanStack Start, and Tailwind patterns.
- Keep server-only code in server modules and do not expose secrets to client code.
- Prefer existing components and helpers before introducing new abstractions.
- Keep generated route artifacts synchronized with TanStack route changes.
- Keep changes focused; do not reformat unrelated files or modify generated lockfile entries manually.
- Review environment variable changes carefully and never commit secrets.
- For Cloudflare, set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optional
	`AWS_SESSION_TOKEN` with `wrangler secret put`. Set `AWS_REGION` and
	`AWS_S3_BUCKET` in `wrangler.jsonc` or with dashboard variables.

## Validation

Before finishing, run the relevant lint or build command and report any unrelated pre-existing failures separately. Do not commit or rewrite history unless explicitly requested.
