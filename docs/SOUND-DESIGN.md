# Sound design

Sound is part of the material of the collection: paper sounds like paper, brass clicks like brass, discoveries ring. It is never required to solve anything, and everything audible is also shown on screen.

## Engine (`src/audio/engine.ts`)

- **Three channels** into a master gain: `ui` (interface and object feedback), `ambient` (wind, fire, winter loops), `narrative` (discoveries, chapter cues, key, finale, recordings).
- **Starts only after a gesture.** Sound is off by default. A single, quiet invitation ("This collection sounds better with sound on") appears once and never again. The top bar has a mute toggle; Settings has a per-channel volume for each.
- **Variation:** each event can map to several files; one is chosen at random, and interface sounds get a little pitch (±3%) and level jitter so repeats never feel mechanical. Identical events fired within 35ms are collapsed (fast dial spins).
- **Lazy loading:** buffers are fetched and decoded on first use and cached; the most common six are preloaded once sound is enabled.
- **Lifecycle:** the context suspends when the page is hidden or Safari backgrounds it, resumes on return, and recovers from iOS "interrupted" sessions (calls, Siri) on the next gesture. Ambient loops crossfade; only one ambient bed plays at a time.
- **Failure is silent.** A missing file or a blocked context never affects play.

## Event library

| Event | Where it plays | Channel |
|---|---|---|
| `ui.tap`, `ui.press`, `ui.release` | Buttons and choices; submitting; letting go of a lock wheel after a swipe | ui |
| `ui.open`, `ui.close`, `ui.back` | Dialogs and sound on; closing; the back link | ui |
| `ui.error.soft` | Wrong answer, locked door (gentle, never harsh) | ui |
| `door.unlock`, `door.open`, `door.close` | Opening a door in the village; arriving on a day; returning to the village after a reveal | ui |
| `paper.rustle`, `letter.unfold`, `seal.break` | Records, the Day 1 envelope, hints, calendar pages | ui |
| `object.pickup`, `object.rotate`, `object.place`, `object.inspect` | Dragging and placing tiles, pieces, seals; inspecting evidence; turning the model house | ui |
| `dial.tick` | Every lock wheel step, the clock, volume sliders | ui |
| `lock.engage`, `lock.release` | Submitting a combination; the vault | ui |
| `puzzle.correct` | A correct stage in a multi-part puzzle | narrative |
| `puzzle.complete` | A solved day | narrative |
| `evidence.collect` | Evidence added to the Archive | narrative |
| `secret.reveal` | Frost cleared, the lamp switched on | narrative |
| `chapter.complete` | Days 6, 12 and 18 | narrative |
| `key.earned` | Day 24 | narrative |
| `key.insert`, `key.turn` | Day 25 vault | ui |
| `christmas.reveal` | The vault opens | narrative |
| `ambient.winter` | The village | ambient |
| `ambient.fireplace` | The Christmas Room | ambient |
| `ambient.wind` | The Day 7 postcard | ambient |

The mapping from events to files is `src/audio/soundMap.json`. Sources and licences are in `docs/ASSET-REGISTER.md` and `public/assets/NOTICES.txt`.

## Mix guidance

- One-shots are normalised to about -18 LUFS, ambience to about -28 LUFS, so the bed never competes with interaction.
- Interface sounds stay under about 150ms where possible. Longer musical cues are reserved for chapter completions, the key and the finale.
- The finale (`christmas.reveal`) plays as the vault light blooms, then the fireplace bed fades in under the letter.

## Haptics

Safari on iPhone does not expose the Vibration API, so the experience promises no haptics. Feedback is always visual (press states, motion) plus optional sound.
