# Progress

Last updated: 26 November 2026. Deadline: 30 November 2026. Live from 1 December 2026.

## Status

| Area | State |
|---|---|
| Server engine: auth, gating, validation, rewards, hints, archive, finale | Done, 79 tests passing |
| All 25 puzzles: content, stages, answers, hints, reveals, evidence | Done; full playthrough tested through the API and the UI |
| Admin: overview, text and answer editing, final message, media upload, codes, preview player and clock, repair, backup and restore, audit log | Done |
| Player UI: invitation, village (3D plus fallback), doors and list, day player, all stage types, Archive and evidence viewer with lamp, Vault, Christmas Room, Settings | Done |
| Sound engine and event map | Done; final asset set in progress (see `ASSET-REGISTER.md`) |
| Browser tests (Playwright plus axe) | 22 passing on Chromium; WebKit to run locally |
| Docs | Done |
| Cloudflare deployment | Not started: needs Dan's account (see `DEPLOYMENT.md`) |
| Real iPhone verification | Not started (checklist in `TESTING.md`) |

## Decisions worth knowing

- Puzzle content lives in server code with D1 overrides, not in D1 tables. See `ARCHITECTURE.md`.
- No Rive runtime (about 1 MB WASM) and no React Three Fiber; CSS motion and plain Three.js instead.
- The !Boring Sound Kit (CC BY-NC-SA 4.0) is used because this is a personal, non-commercial gift (Dan confirmed). Attribution is in `public/assets/NOTICES.txt`.
- Kenney packs (CC0) were not used: kenney.nl blocks automated downloads. Dan can download them manually if wanted.
- The village is a procedural miniature diorama (programmatic geometry, no AI imagery). It reads as a lit model on a wooden plinth and gets brighter as days are completed; the tree's star appears with the Christmas Key.
- Design rules from Dan's review: no tapering one-sided strokes on rounded elements, no gaps in grids. Recorded in `CLAUDE.md` and `DESIGN-SYSTEM.md`.

## Before launch (Dan)

1. Create Cloudflare resources and deploy (`DEPLOYMENT.md`).
2. Sign in to `/admin`, create Chloe's invitation code.
3. Review and edit the fictional framing lines listed in `STORY.md`, the Junior Investigators' notes and the final letter.
4. Upload Christmas Room photos (`final-photo`), and optionally a recording from you and the boys (`investigators` for Day 20, `final-recording` for Christmas morning) and a honeymoon photo.
5. Play days 1 to 25 as the preview player on your iPhone with a simulated date.
6. Work through the real-iPhone checklist in `TESTING.md`.
7. Run `npx playwright install webkit` and `npm run test:e2e` locally.

## Known gaps and ideas

- WebKit browser tests have not been run in the container.
- Performance has been measured only as bundle sizes; frame rate and Core Web Vitals need a real iPhone.
- Optional: replace the procedural village houses with Kenney Holiday Kit models if Dan downloads them (same style, CC0).
