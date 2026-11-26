# Architecture

## Overview

```
iPhone Safari / home-screen app
  └─ Static shell (Cloudflare Pages, dist/)      React + TS, no content, no answers
       ├─ /static/*        hashed JS/CSS/fonts (immutable)
       ├─ /assets/*        licensed audio, textures, engravings (public, non-secret)
       └─ /api/*  ──────►  Pages Function  functions/api/[[path]].ts
                                └─ server/router.ts
                                     ├─ auth.ts      sessions, invitation codes, admin
                                     ├─ game.ts      gating, puzzles, attempts, rewards, archive, finale
                                     ├─ admin.ts     content overrides, media, preview, repair, backup
                                     ├─ clock.ts     Europe/London dates, test and preview clocks
                                     └─ content/     days, evidence, answers, overrides, graph
                                ├─ D1 (DB)          players, progress, evidence, rewards, overrides, audit
                                └─ R2 (MEDIA)       private photos and recordings, served only via /api/media
```

The browser never receives future content, answers, solution mappings or the final message. Puzzle content ships inside the Functions bundle, which is not publicly downloadable. Dan's edits are stored in D1 (`content_overrides`) and merged per request.

## Decisions

| Decision | Why |
|---|---|
| Puzzle definitions in server code, overrides in D1 | Type-checked, tested and versioned. D1 only holds what Dan changes, so a bad edit can be reverted per field. The brief suggested `puzzle_definitions`/`puzzle_answers`/`puzzle_dependencies` tables; code plus `content_overrides` covers the same need with less risk. |
| One catch-all Pages Function | A single router is simpler to secure and to test. Vitest drives the same `handle()` with a D1 shim over `node:sqlite`. |
| Plain Three.js, not React Three Fiber | One scene, imperative lifecycle (pause, dispose, context loss) and a smaller bundle. Loaded only on the village and Christmas Room. |
| No Rive runtime | The research audit found marketplace files are CC BY 4.0 but the runtime is about 1 MB of WASM. Every animation needed here is achievable reliably in CSS. |
| No Howler, Zustand or router library | A focused Web Audio engine (`src/audio/engine.ts`), React context and a 40-line router cover the need. |
| CSS motion with a spring curve | `linear()` spring easing with a cubic-bezier fallback. All motion respects `prefers-reduced-motion` and an in-app setting. |

## Request lifecycle

1. `router.ts` ensures the real and preview players exist, checks Origin on state-changing requests, and routes.
2. Player routes require a valid session cookie (`k25_session`, HttpOnly, Secure, SameSite=Strict). Only a SHA-256 hash of the token is stored.
3. `createContext()` resolves "now" (`clock.ts`), loads content overrides and the player's full state in one D1 batch.
4. `dayState()` decides: `complete`, `future` (date not reached in Europe/London), `locked` (an earlier day is incomplete, or Day 25 without the key), `in_progress` or `available`.
5. Responses are JSON with `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`.

## Gating and rewards

- Day N is date-eligible from 00:00 Europe/London on N December 2026 (`EVENT_YEAR` in `clock.ts`). Missed days can be caught up in order. Everything stays playable after Christmas.
- An attempt checks: authentication, day validity, date, all earlier days complete, required evidence owned, earlier stages complete, then the matcher.
- Completion is one D1 batch (a transaction): attempt log, stage progress, then `UPDATE puzzle_progress SET status='complete'` guarded by "every earlier day is complete", then rewards inserted only `WHERE EXISTS` a completed row. Primary keys make rewards idempotent, so duplicate or concurrent submissions cannot double-award.
- The Christmas Key is a server-side entitlement (`player_rewards`) plus an evidence item, awarded only by completing Day 24's two stages.
- Hidden evidence layers (the lamp writing on the ticket, the family records' names and day values) are filtered on the server until their rule is met.

## Validation engine

`server/validation/matchers.ts` supports: text with explicit aliases, exact codes, choices, ordered sequences, sets, mappings, dates, multi-field answers, alternatives (`any`), evidence-or-text slots and evidence presentation. Normalisation is NFKC, lower case, apostrophes dropped, punctuation to spaces, whitespace collapsed. Codes are never normalised beyond trimming. Incorrect answers return a gentle message and, for multi-part answers, how many parts are right, never which.

## Security

- Sessions: random 256-bit tokens, hashed at rest; players 400 days (Chloe keeps her place), admin 12 hours.
- Invitation codes: 16 characters from a 32-character alphabet, stored as hashes, revocable, reusable on a new device for recovery.
- CSRF: SameSite=Strict cookies, JSON-only bodies (forces a preflight cross-origin) and an Origin check.
- Rate limits (D1 fixed windows): invitation claims 12 per 15 minutes per IP, admin sign-in 10 per 15 minutes, attempts 60 per 5 minutes per player. Relaxed only in test environments.
- SQL: parameterised statements only. Table names in admin export/import come from a fixed list.
- Static headers (`public/_headers`): CSP `default-src 'self'` with no remote scripts, `frame-ancestors 'none'`, HSTS, no referrer, `noindex`. `style-src` allows inline styles for React style attributes only.
- Media: R2 objects are private and served through `/api/media/:id` only after the matching day is reached. Photos are re-encoded in the admin's browser before upload, which strips EXIF and GPS.
- The service worker caches only the public shell and static assets, never `/api`.

## Data model (D1)

`players`, `access_codes`, `sessions`, `puzzle_progress`, `puzzle_stage_progress`, `player_evidence`, `player_rewards`, `hint_usage`, `attempts`, `player_preferences`, `content_overrides`, `media_assets`, `admin_audit_log`, `rate_limits`, `settings`. See `migrations/0001_init.sql`.

## Performance (measured on the current build)

| Item | Size (gzip) | Budget |
|---|---|---|
| App shell JS (`index-*.js`) | about 93 KB | under 250 KB |
| App CSS | about 14 KB | |
| Three.js chunk (lazy) | about 143 KB | |
| Village scene module (lazy) | about 4 KB | |
| Admin bundle (lazy) | about 6 KB | |
| Fonts (Latin subsets actually used) | about 62 KB | |

The village uses instanced meshes (a handful of draw calls), unlit emissive windows and additive halos instead of real lights or shadows, GPU-driven snow, adaptive pixel ratio, pausing when hidden, a static frame under reduced motion, context-loss fallback and explicit disposal. Lighthouse scores and real-iPhone frame rates still need measuring on a device (see `docs/TESTING.md`).
