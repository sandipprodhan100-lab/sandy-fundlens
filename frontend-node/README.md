# Fund Navigator

Fund Navigator is a TanStack Start application for researching and comparing
mutual funds.

## Development

Install [Node.js](https://nodejs.org/) and the project dependencies:

```powershell
npm install
npm run dev
```

The development server runs on the URL printed by Vite. Other useful commands:

```powershell
npm run build
npm run lint
npm run format
```

## Cloudflare Deployment

Authenticate Wrangler, then configure the Worker with the AWS S3 connection:

```powershell
npx wrangler login
npx wrangler secret put AWS_ACCESS_KEY_ID
npx wrangler secret put AWS_SECRET_ACCESS_KEY
npx wrangler secret put AWS_REGION
npx wrangler secret put AWS_S3_BUCKET
npm run deploy
```

The AWS identity needs `s3:ListBucket` on the bucket and `s3:GetObject` and
`s3:PutObject` on the bucket objects. `HEAD` requests use the `s3:GetObject`
permission.
Use an IAM user or role dedicated to this application and keep its credentials
in Wrangler secrets. Change the `name` in `wrangler.jsonc` if `fund-navigator`
is already taken in your Cloudflare account.
The Worker is named `mflens` to match this Fund Navigator deployment. Change
the `name` in `wrangler.jsonc` only if that name is already
taken in your Cloudflare account.

- TanStack Start
- TypeScript
- Tailwind CSS
