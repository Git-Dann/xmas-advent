# CLAUDE.md: The 25th Key

A private, personalised Christmas puzzle gift for Chloe from Dan, Oliver and George. Runs 1 to 25 December 2026. Production deadline 30 November 2026. Read `docs/PROGRESS.md` first: it says what is done and what is next.

## Non-negotiables

- **The server is the only authority.** Availability, completion, evidence and the Christmas Key are decided in `server/` only. Never trust client state, device clocks, local storage, route guards or animation state.
- **No secrets in the public build.** Puzzle content, answers, the final message and family media live server-side (`server/content`, D1, R2). `src/` must never import from `server/` (ESLint enforces it). `npm run build` runs `scripts/check-bundle.mjs`, which fails if answers or private details reach `dist/`. Never weaken that check; extend it.
- **Codes are strings.** `0130` is correct, `130` is not. Never normalise digits away.
- **Explicit aliases only.** No fuzzy matching and no LLM judging. Add accepted answers to `server/content/answers.ts` (or via the admin area).
- **Never invent family facts.** Only use the canonical facts in the brief (see `docs/STORY.md`). Fictional framing is fine, but never put invented words in Oliver's or George's mouths.
- **Gentle by design.** No timers, lives, attempt limits shown to the player, or punitive feedback. Wrong answers get a calm message and never reveal the answer.
- **Production clock is real time.** The test clock only works when `ENVIRONMENT` is not `production` and `ALLOW_TEST_CLOCK=1`. The preview clock only ever applies to the preview player.
- **Admin preview never touches Chloe.** Use the preview player (`player-preview`).
- **No AI-generated artwork or audio.** Sourced, licensed assets only, recorded in `docs/asset-register.json` and `docs/ASSET-REGISTER.md`. Programmatic UI geometry, icons, masks, particles and puzzle graphics are allowed.
- **Do not deploy or create Cloudflare resources** without Dan's explicit go-ahead.

## Design rules (from Dan's review)

- No one-sided strokes or accent bars on rounded elements. They taper at the corners and look generic. Use hairlines on square elements, full rings, tints or soft shadows instead.
- No gaps or orphaned cells in grids (the door grid is 4 by 6 on phones and 6 by 4 wider, with door 25 centred below).
- One focal point per screen, generous spacing, restrained ornament. Editorial type: Cormorant Garamond for display, Manrope for UI. Never decorative type for instructions or inputs.
- Verify visual changes with a screenshot before calling them done.

## Commands

```bash
npm install
npm test                 # Vitest: validation, gating, full 25-day playthrough via the real router
npm run build            # typecheck, build, privacy check
npm run dev:api          # build + wrangler pages dev on :8788 (local D1, test clock on)
npm run test:e2e         # Playwright against wrangler pages dev on :8789 (Chromium + WebKit)
npm run docs:generate    # regenerate docs/PUZZLE-MAP.md and docs/ANSWER-KEY.md from code
npm run lint
```

## Layout

- `server/`: all game logic. `router.ts` (API), `game.ts` (gating, attempts, rewards), `admin.ts`, `auth.ts`, `clock.ts`, `validation/` (normalise + matchers), `content/` (days, evidence, answers, overrides, dependency graph).
- `functions/api/[[path]].ts`: the single Pages Function, delegating to `server/router.ts`.
- `migrations/`: D1 schema.
- `shared/api.ts`: payload types only (no content).
- `src/`: React client. `screens/`, `puzzles/` (stage components), `scenes/`, `three/` (lazy village), `audio/` (engine + sound map), `admin/` (lazy admin bundle).
- `tests/unit`: Vitest with a D1 shim over `node:sqlite` (`tests/helpers`). `tests/e2e`: Playwright.

## When changing puzzles

1. Edit `server/content/days.ts` (text, stages), `answers.ts` (matchers) or `evidence.ts`.
2. Keep option ids opaque (they must not reveal answers).
3. `npm test` (the graph test catches missing or circular dependencies), then `npm run docs:generate`.
