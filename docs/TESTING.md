# Testing

## Automated

```bash
npm test             # Vitest: 79 tests, unit and API integration (real router, D1 shim over node:sqlite)
npm run test:e2e     # Playwright: real Pages runtime (wrangler pages dev, isolated local D1)
npm run lint
npm run typecheck
npm run build        # includes the public-bundle privacy check
```

WebKit for Playwright is not available in the build container. On your machine, run `npx playwright install webkit` once, then `npm run test:e2e` covers Chromium (iPhone 13 viewport and desktop) and WebKit (iPhone 13).

### Results at the time of writing

| Suite | Result |
|---|---|
| Vitest (`tests/unit`) | 79 passed |
| Playwright, Chromium iPhone 13 | 11 passed |
| Playwright, Chromium desktop | 11 passed |
| Playwright, WebKit iPhone 13 | Not run here (browser not installed in the container); run locally |

### Brief scenarios and where they are covered

| Scenario | Test |
|---|---|
| Day 1 unavailable on 30 November; available at 00:00 UK on 1 December | `progression.test.ts` "Day 1 cannot be played…", "Day 1 becomes available…" |
| Day 2 needs Day 1 complete, and its own date | "Day 2 cannot be played if Day 1 is incomplete", "…on 1 December even if Day 1 is complete" |
| Catch-up: Day 1 on 5 December permits Day 2 | "completing Day 1 on 5 December permits Day 2" |
| Browser clock irrelevant | unit "the browser clock is irrelevant"; e2e "future and locked doors stay shut, whatever the browser clock says" (Playwright clock set to 25 December) |
| Future puzzle returns no private content | "a future puzzle returns no private content" |
| Client cannot award evidence or the key | "a client cannot award itself evidence or the Christmas Key" |
| 130 rejected; 0130 only with prerequisites | "130 is rejected; 0130 is accepted only with all prerequisites", e2e "christmas eve" |
| Day 25 unavailable on 24 December and without the key | "Day 25 is unavailable on 24 December…", "…without the earned key" |
| Christmas morning, and playable after Christmas | "Day 25 opens on Christmas morning and the game stays playable afterwards", e2e "christmas morning" |
| Aliases, whitespace, case, punctuation, Unicode, dates, leading zeros | `validation.test.ts` per day |
| Mappings (Day 16 sorting, ticket pieces, seals) | `validation.test.ts` |
| Evidence ownership | "day 6 rejects attempts if required evidence is missing", day 18 matcher tests |
| Duplicate and concurrent submissions | "duplicate and concurrent submissions do not duplicate rewards" |
| Refresh mid-puzzle | "refreshing mid-puzzle keeps completed stages" |
| Session recovery on a new device | "a new device can recover with the same invitation code" |
| Hidden layers protected | "hidden evidence layers stay on the server until their reveal" |
| No answers in payloads or the public bundle | "puzzle payloads never contain answers…", `scripts/check-bundle.mjs` |
| Admin preview isolation and production clock | "preview player has its own clock…", "the test clock is ignored in production" |
| Admin edits, repairs, backup and restore | "admin edits…", "repairs keep progression sequential…" |
| Dependency graph: missing references, cycles, impossible states | `graph.test.ts` |
| Offline submission keeps input | e2e "offline submissions keep the answer…" |
| Reduced motion | e2e "reduced motion still opens doors…" |
| Accessibility (axe, WCAG 2.2 AA tags) | e2e invitation, village, Day 1, calendar list, Christmas Room |
| Keyboard operation of lock wheels | e2e "day 6" (spinbutton with arrow keys) |

Screenshots from the browser tests are written to `screenshots/review/` (not committed).

## Manual checks on a real iPhone (required before launch)

Emulation is not a substitute. On Chloe's iPhone model (or the closest available), in Safari and as a home-screen app:

- [ ] Invitation link opens and signs in; closing and reopening Safari keeps the session.
- [ ] Add to Home Screen: icon, name, standalone layout, safe areas around the notch and home indicator.
- [ ] Village 3D scene: smooth (aim for 60 fps), no overheating over 5 minutes, falls back cleanly with the 3D village turned off in Settings.
- [ ] Sound: invite appears once; sound on and off; volumes; audio resumes after a phone call and after switching apps; nothing plays while locked.
- [ ] Every stage type: typing (no zoom on focus), lock wheels by swipe and by tap, tile and seal dragging, tap alternatives, frost wiping, the clock slider, the calendar picker, native selects on Day 17.
- [ ] Keyboard does not hide the answer field or submit button.
- [ ] VoiceOver: doors, wheels, dialogs, hints and feedback announcements.
- [ ] Text size set to the largest Dynamic Type size: nothing clipped.
- [ ] Reduce Motion on in iOS settings: no animation, everything still works.
- [ ] Airplane mode mid-puzzle: clear message, input kept, works again when back online.
- [ ] Day 20 recording and the Christmas Room photos (after uploading them) play and display.
