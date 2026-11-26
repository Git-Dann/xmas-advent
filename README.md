# The 25th Key: The Story of Us

*Some stories are worth keeping.*

A private, interactive Christmas puzzle experience: 25 doors from 1 to 25 December 2026, a collection of evidence that keeps coming back, four chapter seals, the Christmas Key on Christmas Eve, and a vault that opens on Christmas morning.

Built with React, TypeScript (strict) and Vite, a lazy-loaded Three.js village, a custom Web Audio engine, and Cloudflare Pages Functions with D1 (and R2 for private family media).

## Quick start

```bash
npm install
npm run db:seed:local     # applies migrations to the local D1 database
npm run dev:api           # builds and serves on http://localhost:8788
```

Then open `http://localhost:8788/#code=LOCAL-KEY-2026`. The admin area is at `/admin` (local password `local-admin`).

For front-end work with hot reload, keep `npm run dev:api` running and run `npm run dev` (Vite proxies `/api` to port 8788).

## Commands

| Task | Command |
|---|---|
| Install | `npm install` |
| Local API and app | `npm run dev:api` |
| Front end with hot reload | `npm run dev` |
| Local migrations | `npm run db:migrate:local` |
| Seed local game | `npm run db:seed:local` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit and integration tests | `npm test` |
| Browser tests | `npm run test:e2e` |
| Production build | `npm run build` |
| Regenerate puzzle map and answer key | `npm run docs:generate` |
| Deploy preview | `npm run deploy:preview` |
| Deploy production | `npm run deploy:production` |
| Back up production | `npm run backup:production` |

## Documentation

- `CLAUDE.md`: rules for anyone (human or agent) working on this
- `docs/PROGRESS.md`: status and next steps
- `docs/ARCHITECTURE.md`, `docs/DESIGN-SYSTEM.md`, `docs/STORY.md`, `docs/PUZZLE-MAP.md`, `docs/ANSWER-KEY.md` (private), `docs/SOUND-DESIGN.md`, `docs/ASSET-REGISTER.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, `docs/RESEARCH-AUDIT.md`

This repository contains private family content and the answer key. Keep it private.
