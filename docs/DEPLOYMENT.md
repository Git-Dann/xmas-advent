# Deployment

## Live now

| Item | Value |
|---|---|
| Production URL | https://the-25th-key.pages.dev |
| Admin | https://the-25th-key.pages.dev/admin |
| Cloudflare Pages project | `the-25th-key`, connected to GitHub `Git-Dann/xmas-advent`; every push to `claude/25th-key-production-e1dnuf` builds and deploys production (switch the production branch to `main` once the PR is merged) |
| D1 database | `the-25th-key` (`46cdc2ba-6994-413a-8761-f08613546518`), schema `0001_init.sql` applied and recorded in `d1_migrations` |
| Production variables | `ENVIRONMENT=production`, `ADMIN_PASSWORD` (secret) |
| Preview deployments | No database binding at all, so they can never read or change Chloe's data |
| R2 (photos and recordings) | Not enabled on the account yet; uploads are disabled until it is |

Deploys are automatic: push to the production branch and Cloudflare runs `npm run build` (Node 22 via `.node-version`) and publishes `dist/` plus `functions/`. Bindings come from `wrangler.toml`; `ADMIN_PASSWORD` is a project secret. Tester codes (Admin > Access > Create tester code) sign in as the preview player, whose date is set in Admin > Preview.

The very first deploy was made from a cloud session through the Cloudflare connector, because no API token was available there: public files were uploaded with a Pages upload token (`scripts/deploy-api.mjs`), and the server bundle (`deploy/worker-entry.ts`, built with esbuild as an advanced-mode `_worker.js`) was passed to the deployment API directly. From your own machine, the normal route below is simpler.

Target: Cloudflare Pages (static shell) with Pages Functions (`/api/*`), D1 (game data) and R2 (private family media). Nothing has been deployed yet. Every step below runs under Dan's Cloudflare account and needs his go-ahead.

## Cost

Everything here fits the free tiers for a single player: Pages, Pages Functions (Workers free plan), D1 and R2 (10 GB free). Enabling R2 on an account can require adding a payment method. If you would rather not, delete the two `r2_buckets` blocks from `wrangler.toml`: the game works fully, and only photo and recording uploads are disabled (the admin area says so).

## One-time setup

```bash
npx wrangler login
```

```bash
npx wrangler d1 create the-25th-key
```

```bash
npx wrangler d1 create the-25th-key-preview
```

Copy each `database_id` into `wrangler.toml`, replacing `REPLACE_WITH_PRODUCTION_D1_ID` and `REPLACE_WITH_PREVIEW_D1_ID`.

```bash
npx wrangler r2 bucket create the-25th-key-media
```

```bash
npx wrangler r2 bucket create the-25th-key-media-preview
```

```bash
npx wrangler pages project create the-25th-key --production-branch main
```

Apply the schema to both databases:

```bash
npx wrangler d1 migrations apply the-25th-key --remote
```

```bash
npx wrangler d1 migrations apply the-25th-key-preview --remote --env preview
```

Set the admin password as a secret (use a long passphrase). Production:

```bash
npx wrangler pages secret put ADMIN_PASSWORD --project-name the-25th-key
```

For preview deployments, set a different `ADMIN_PASSWORD` in the Cloudflare dashboard: Workers & Pages > the-25th-key > Settings > Variables and Secrets > Preview.

Never set `ALLOW_TEST_CLOCK` or `INVITE_CODES` in production or preview. `ENVIRONMENT` comes from `wrangler.toml` (`production` at top level, `preview` under `[env.preview]`); the test clock is ignored whenever `ENVIRONMENT` is `production`.

### Protect preview deployments

Preview URLs contain solution data. In the dashboard: Workers & Pages > the-25th-key > Settings > General > enable "Access policy" for preview deployments, limited to Dan's email.

## Deploy

```bash
npm run deploy:preview
```

```bash
npm run deploy:production
```

Both run `npm run build` first (type check, build, privacy check). Production deploys never touch existing data: migrations are separate and additive.

## After the first production deploy

1. Open `https://<your-domain>/admin`, sign in.
2. Access > Create code, label "Chloe". Copy the invitation link (`https://<your-domain>/#code=XXXX-XXXX-XXXX-XXXX`). The code is shown once; create another any time.
3. Final message: edit and save the Christmas letter.
4. Media: upload `final-photo` images (and optionally `final-recording`, `honeymoon-photo`, `investigators`).
5. Preview: set a preview date and play days as the preview player. Chloe's progress is never affected.
6. Send Chloe the invitation link on 1 December (or earlier: doors only open on their dates).

If Chloe loses access: create a new code in Admin > Access, or give her the same code again. Her progress is kept on the server.

## Backups and restore

Full database export (blocks other queries briefly while it runs):

```bash
npm run backup:production
```

Chloe's progress only, restorable from the admin area: Admin > Repair and backup > Download Chloe's progress. Restore with the file picker on the same page (type RESTORE to confirm).

D1 Time Travel can restore the whole database to any minute in the last 7 days (free plan):

```bash
npx wrangler d1 time-travel restore the-25th-key --timestamp=2026-12-10T20:00:00Z
```

Restore a SQL export into a new, empty database rather than over live data:

```bash
npx wrangler d1 execute the-25th-key-restore --remote --file=backups/production-YYYY-MM-DD.sql
```

## Custom domain (optional)

Workers & Pages > the-25th-key > Custom domains. The site sends `noindex` everywhere and `robots.txt` disallows all crawling, but privacy relies on authentication, not on search engines behaving.
