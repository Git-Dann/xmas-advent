# Research Audit: The 25th Key

Audit for a single-player, 25-day advent puzzle app on iPhone Safari. Sources read 26 November 2026; unreadable pages are stated, not filled from memory. Points marked *(platform knowledge)* were not confirmed from a fetched page: verify on device.

---

## 1. Apple Human Interface Guidelines

The HIG HTML returned only a title; content was read from Apple's JSON endpoints for the same pages.

**Findings**

- **Design principles** (reintroduced June 2026): "Help people recover from mistakes"; make guided flows "easy to skip or escape"; "Don't mistake delight for decoration"; "Create defining moments."
- **Motion**: "Make motion optional... avoid using it as the only way to communicate important information." "Aim for brevity and precision in feedback animations." "Let people cancel motion... don't make people wait for an animation to complete." Avoid motion on frequent interactions. Sustained oscillation near 0.2 Hz is singled out as uncomfortable (visionOS section, but the physiology applies).
- **Accessibility**: iOS default control size 44x44 pt, minimum 28x28 pt. iOS default text 17 pt, minimum 11 pt. Contrast 4.5:1 up to 17 pt, 3:1 at 18 pt and above. Support text enlargement to at least 200 percent. Under Reduce Motion, reduce "automatic and repetitive animations, including zooming, scaling, and peripheral motion", avoid animating z-depth, and replace x/y/z transitions with fades. "Minimize use of time-boxed interface elements." "Use haptics in addition to audio cues." "Avoid autoplaying audio... without also providing controls."
- **Playing audio**: silent mode should silence "sound effects, game soundtracks, and other audible feedback"; system volume "always governs the final output"; *Ambient* "Responds to the silence switch. Mixes with other sounds." Vary repetitive sounds by randomising "pitch and volume during playback".
- **Haptics**: consistent, causal, short, intensity matched to the animation.

**Applied here**

- Every tappable element is at least 44x44 CSS px with 8 px clear space; nothing interactive below 28 px even inside puzzles (dials, tiles, keyhole hotspots get padded hit areas).
- Body text 17 px, no text below 11 px, `rem` sizing so iOS text zoom to 200 percent does not break layouts. Contrast checked at 4.5:1 for body and 3:1 for headings and icon glyphs, in both themes.
- Motion budget: tap feedback 100 to 160 ms; panel and drawer transitions 240 to 320 ms; door-opening and reveal set pieces up to 1.2 s, always skippable by a second tap. No animation blocks input.
- `prefers-reduced-motion: reduce`: replace slide, scale and parallax with 150 ms opacity fades; stop snowfall and idle bobbing; Three.js village renders a static framed view on demand with no camera drift. Ambient loops never oscillate slowly at large amplitude (ornament sway kept under 2 degrees, period well away from 5 s).
- No timed puzzles or auto-dismissing clue toasts; hints and "reset puzzle" always reachable.
- Every audio clue has a visual or caption equivalent.
- Respect the silent switch *(platform knowledge: `navigator.audioSession.type = "ambient"`, Safari 16.4+)*; master volume plus music and effects toggles; unlock Web Audio on a gesture.
- iOS Safari lacks `navigator.vibrate` *(platform knowledge)*, so haptics are never required.

---

## 2. !Boring: "The Sound of Software" and the Sound Kit

**Findings**

- Essay rules: sound must do a job; 8 to 12 random variations; layer recorded, synthesised and musical sources; related actions share a family, opposites are mirrored; offer mute and volume; test on phone speakers.
- The essay links the kit as "Sound kit for playing & prototyping"; `notbor.ing/soundkit` redirects to a public Notion page (read via Notion's public page API).
- **Exact wording on the kit page**: "Sounds for prototyping and play." and "License: This work is licensed by Not Boring Software under CC BY-NC-SA 4.0" (linking to creativecommons.org/licenses/by-nc-sa/4.0/).
- **How it is obtained**: free, no login: one "!Boring Sound Kit.zip" plus individual WAVs (Button Clicks with six variants, Success/Completed, Failed/Undo, Whoosh, Musical Taps, Natural Taps, Atmosphere).

**Applied here**

- Sound families: *tap* (wooden click, 6 variants), *turn* (tick pitched by dial position), *success* (bell plus pad), *fail* (success motif reversed and muted, never a buzzer), *unlock* (key, latch, two-note chime), *ambience* (fire and wind beds).
- Variation: each one-shot plays a random variant with plus or minus 3 percent playback rate and plus or minus 2 dB gain; never the same variant twice running.
- Layering: unlock sound is three buses (mechanical, tonal, air) so day 25 can reuse the unlock with an extra choir layer, making the finale sound like the culmination of 24 earlier unlocks.
- The kit is used for prototyping only unless the licence conditions in section 8 are accepted; see that section.

---

## 3. Rive

**Findings**

- The web docs now recommend `@rive-app/webgl2` ("the same renderer as the Rive Editor"); `@rive-app/canvas-lite` is the smaller variant for files without Text, Layouts, Scripting or Audio. All packages share one API. `cleanup()` must be called because the C++ objects "need to be manually deleted to prevent memory leaks."
- Data binding replaces state machine inputs and runtime events, which are now described as deprecated (existing files keep working). JS API: `autoBind: true`, `r.viewModelInstance`, `vmi.number("...").value`, `vmi.trigger("...").trigger()`, `vmi.enum(...)`, `vmi.color(...)`, or manual `viewModelByName()`, `defaultInstance()`, `bindViewModelInstance()`.
- WASM loads from unpkg by default; self-hosted `rive.wasm` must match the package version, be served as `application/wasm`, and use the same URL for preload and `RuntimeLoader.setWasmUrl()`.
- **Size** (measured from npm, `@rive-app/canvas` 2.55.1): `rive.wasm` 2.36 MB raw, about 0.96 MB gzip; `rive.js` 0.72 MB raw, about 157 KB gzip. `canvas-lite` WASM is 0.91 MB raw, about 365 KB gzip. The docs state no sizes.

**Applied here**

- Rive stays off the core path (about 1.1 MB compressed); CSS handles UI motion.
- If one hero animation justifies it (the key turn), use `canvas-lite`, self-host versioned WASM, lazy-load on that day only, use data binding, `cleanup()` on unmount.

---

## 4. Three.js and Three.js Journey Christmas challenges

**Findings**

- The manual: geometries, materials and textures are "not released automatically"; call `dispose()` on each (textures separately from materials).
- "Rendering on demand": render only when something changes, to save battery on portable devices.
- Responsive guide: on phones with a 3x pixel ratio, rendering at native resolution is 9x the work; passing `window.devicePixelRatio` straight to `setPixelRatio` is "strongly NOT RECOMMENDED".
- Challenge #006 (Christmas) winner: "The Great Gift Hunt" by Piotr Obidowski (thegreatgifthunt.com). Steve Krichten won #015 with "Cozy Christmas Scene" (x-mas24.vercel.app) and #021 with "Christmas Light Show" (x-mas25.vercel.app). The pages list winners only; no technique write-ups were found, so nothing is claimed about how they were built.

**Applied here**

- Village is a dynamic `import()` after first paint and after the day's puzzle is interactive; never on the LCP path.
- Pixel ratio capped at `Math.min(devicePixelRatio, 2)`, dropping to 1.5 if frame time exceeds 20 ms for a sustained period.
- Render loop pauses when the tab is hidden, the village is off-screen, or reduced motion is on (render on demand).
- A dispose helper traverses the scene on unmount and disposes geometries, materials and textures; verify with `renderer.info.memory`.
- Borrow the *gift hunt* idea: the village is where found evidence physically appears (one new lit window or object per solved day).

---

## 5. Puzzle and narrative references

**theory11 Box One and Box Two** (reviews, Room Escape Artist and others; no official design write-up found)

- Box One is built around one premise and a reveal reviewers say cannot be repeated; Box Two reveals "unusual" hidden layers and magic-style surprises.
- Props with "surprising heft and depth"; nothing destroyed, reset is "its own magic trick."
- Criticism: a typo-intolerant chat parser put solving "on tight rails."

**Fireproof Games, The Room** (Pocket Gamer, Game Developer interviews; no GDC talk found)

- Direct manipulation: "no floating d-pads"; push sliders, pull switches, turn keys. Camera zooms on the object; the room recedes.
- Touch should be processed immediately because players notice lag.
- Narrative "sits on the periphery", posing new questions as answers near.

**ustwo, Monument Valley** (Pocket Gamer, Unity, Kill Screen)

- Every level should be good enough to "print out and hang on a wall."
- Build strong standalone puzzles first, then experiment with order; user-test every two to three weeks, even white-box levels.

**Rusty Lake** (itch.io interview, GamesRadar, Thinky Games)

- The first two Cube Escape games shared a code that unlocked a different ending, which "made people feel like these games were part of something bigger."
- Recurring motifs (cubes, shared settings) bind releases into one world.

**GCHQ Christmas Challenge 2025** (gchq.gov.uk)

- Seven puzzles on the back of a card; answers then "reveal a final festive message using the front of the card."
- The front carries hidden codes: "the longer you look, the more you see." Hints are a separate document: "It's okay to ask for help!"

**Applied here**

- One premise, one reveal: the 25th key. Each day yields a fragment (a letter, a number, a shape) stored in an inventory; day 25 asks the player to assemble them, GCHQ-style, against the "front of the card" (the village and calendar art itself).
- Evidence recurs on a schedule: each object appears at least three times (introduced, used, recontextualised). Example cadence: an item shown on day 3, used as a tool on day 9, revealed as a memory on day 17. Rusty Lake-style cross-day codes link pairs of days.
- Hidden layer: the calendar art contains marks that mean nothing until later days teach how to read them.
- Answer input is forgiving: normalise case, whitespace, punctuation and diacritics; accept agreed alternative spellings; never a Box Two-style rigid parser.
- Tactile interactions follow The Room: drag, rotate, slide, press-and-hold, with immediate response on `pointerdown`, short tick sounds and a zoomed object view.
- Pacing: weekday puzzles 5 to 10 minutes, weekend days richer, a "wow" set piece every fifth day and day 25 the largest. Three-tier hints (nudge, method, answer) with no penalty.
- Narrative stays peripheral: memory notes unlock after solving. Each day's final state is composed as a frame worth keeping; puzzles are tested standalone before being sequenced.

---

## 6. Web Vitals

**Findings** (web.dev): LCP good at 2.5 s or less; INP good at 200 ms or less, poor above 500 ms; CLS good at 0.1 or less, poor above 0.25; assessed at the 75th percentile. The LCP "poor" boundary appears only in an image chart on the fetched page and is not quoted here.

**Applied here**

- LCP element is the HTML/CSS door grid; no 3D, Rive or audio decoding before it.
- INP: handlers do minimal synchronous work; audio decoding and D1 writes follow paint.
- CLS: aspect-ratio boxes for images and the canvas; `size-adjust` font fallbacks.

---

## 7. CodePen

**Finding**: "Public pens are automatically MIT licensed." Private pens carry no licence: "It belongs entirely to you." No option for PRO users to relicense public pens is described.

**Applied here**: adapted pen code keeps the MIT notice (`THIRD-PARTY-NOTICES` plus a source comment). Embedded third-party assets are checked separately.

---

## 8. Licensing conclusions

- **!Boring Sound Kit**: CC BY-NC-SA 4.0, explicitly framed as "Sounds for prototyping and play." A private, non-commercial gift can use it if we (a) credit Not Boring Software with a licence link in an in-app credits screen, (b) indicate any changes, and (c) license any adapted sounds under the same CC BY-NC-SA 4.0 terms. It cannot ship in anything sold or monetised. Recommendation: prototype with it; for the final build prefer original or synthesised sounds, keeping kit files only where credited.
- **Rive Marketplace**: "Marketplace files are all shared under a CC BY license" (CC BY 4.0), which allows commercial use and redistribution with attribution. Download needs no login: the Download button resolves to a public `public.rive.app/community/runtime-files/....riv` URL that returned HTTP 200 without authentication. Remixing in the editor adds a copy to "your file browser", so it needs an account. Credit authors in the credits screen.
- **CodePen**: public pens are MIT; retain the notice.
- **Sketchfab**: the `sketchfab.com/licenses` page covers only paid Store licences (Standard: commercial, single-seat, no standalone redistribution; Editorial: no commercial use). The help article on free-download Creative Commons licences returned HTTP 503, so per-model CC terms could not be confirmed. Caveats: check the exact licence on each model page (NC and ND variants exist), never ship a downloadable model as a standalone file, and keep attribution with the author's name and model link.
- **Three.js Journey entries**: ideas only; no code or models copied.

---

## 9. Cloudflare configuration facts

**wrangler.toml for Pages** (Wrangler 3.45.0+; JSON forms from 3.91.0; current npm release 4.168.0)

- Required top-level keys: `name` (alphanumeric and dashes), `pages_build_output_dir` (for example `"./dist"`), `compatibility_date` as `"yyyy-mm-dd"`. The dashboard's "Latest" is not supported in the file.
- The file becomes the source of truth; dashboard fields go read-only.
- Only two environments: `[env.preview]` and `[env.production]`. Top-level values apply to **local development and production**; `env.preview` applies to all preview deployments (no per-branch config).
- Inheritable: `name`, `pages_build_output_dir`, `compatibility_date`, `compatibility_flags`, `send_metrics`, `limits`, `placement`, `upload_source_maps`.
- Non-inheritable: `vars`, `d1_databases`, `durable_objects`, `hyperdrive`, `kv_namespaces`, `queues.producers`, `r2_buckets`, `vectorize`, `services`, `analytics_engine_datasets`, `ai`. If an environment overrides any one of these, it must restate every non-inheritable key it needs, or deploy validation fails.
- `[[d1_databases]]` keys: `binding`, `database_name`, `database_id` (required); `preview_database_id`, `migrations_dir` (default `migrations`), `migrations_table` (default `d1_migrations`), `migrations_pattern` (optional, defaults to `migrations/*.sql`).

```toml
name = "the-25th-key"
pages_build_output_dir = "./dist"
compatibility_date = "2026-11-26"

[vars]
APP_ENV = "local-or-production"

[[d1_databases]]
binding = "DB"
database_name = "key25-prod"
database_id = "<PROD_DATABASE_ID>"
migrations_dir = "migrations"

[env.preview.vars]
APP_ENV = "preview"

[[env.preview.d1_databases]]
binding = "DB"
database_name = "key25-preview"
database_id = "<PREVIEW_DATABASE_ID>"
migrations_dir = "migrations"
```

Local dev uses a local SQLite copy of the top-level binding, so it never touches the production database.

**D1 transactions**: "D1 operates in auto-commit." `db.batch([...])`: "Batched statements are SQL transactions. If a statement in the sequence fails... it aborts or rolls back the entire sequence." There are no interactive `BEGIN`/`COMMIT` transactions; D1's import guide says to remove `BEGIN TRANSACTION` and `COMMIT` from dumps to avoid "cannot start a transaction within a transaction". So: put every multi-row write (solve plus fragment award plus progress update) in one `batch()`, and guard with conditional SQL (`INSERT ... ON CONFLICT DO NOTHING`, `UPDATE ... WHERE day = ? AND solved_at IS NULL`). `exec()` is for maintenance only.

**Commands**

```sh
npx wrangler d1 migrations create key25-prod add_progress
npx wrangler d1 migrations apply key25-prod --local
npx wrangler d1 migrations apply key25-preview --remote
npx wrangler d1 migrations apply key25-prod --remote
npx wrangler d1 migrations list key25-prod --remote
npx wrangler pages dev            # reads pages_build_output_dir; serves on :8788
npx wrangler pages deploy         # add --branch <production-branch> to target production
npx wrangler d1 export key25-prod --remote --output=./backups/key25-YYYYMMDD.sql
npx wrangler d1 time-travel info key25-prod
npx wrangler d1 time-travel restore key25-prod --timestamp=<unix-or-RFC3339>
```

The docs do not state a local or remote default, so always pass `--local` or `--remote`. Local data persists between runs. Time Travel is always on (7 days Free, 30 days Paid); restore is destructive and returns an undo bookmark. A running export blocks other requests.

**`_headers`** (in `public/` so Vite copies it to `dist/`): block of URL pattern then indented `Name: value` lines; up to 100 rules; 2,000 characters per line; applied in file order; duplicate headers are joined with commas (dangerous for `Cache-Control`); `! Name` detaches an earlier header. **Not applied to Pages Functions responses**, so API headers must be set in code.

```txt
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: same-origin
  X-Robots-Tag: noindex
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

**`_routes.json`** (also in `public/`): `version` 1, `include`, `exclude`; exclude wins; wildcards span segments; at most 100 rules combined, 100 characters each. Auto-generated if a `functions/` directory exists and no file is supplied.

```json
{ "version": 1, "include": ["/api/*"], "exclude": [] }
```

**Cloudflare Access for previews**: preview URLs are public by default. Settings > General > "Enable access policy" restricts preview deployments (hash URLs and other preview links) to an Access policy. It does not protect the production `*.pages.dev` domain or a custom domain; those need a separate Access application (see Pages "Known issues"). Branch aliases follow the `<branch>.<project>.pages.dev` pattern.

---

## 10. Sources not fully readable

- `notbor.ing/terms` (Notion shell only); Fab/Sketchfab CC help article (HTTP 503); Rive `runtimes/data-binding` (introduction only, detail from `runtimes/web/data-binding`).
- No first-party design write-ups for theory11, Rusty Lake or the Three.js Journey winners; findings rely on reviews, interviews and listings.
