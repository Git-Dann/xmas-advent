# Design system

## Principles

One focal point per screen. Generous spacing. Paper, wood, brass and warm light rather than glass and gradients. Ornament is restrained: seals, a single icon set, hairlines on square elements. Motion has meaning: anticipation, interaction, confirmation, reward.

### Rules from review

- **No one-sided strokes or accent bars on rounded elements.** They taper at the corners and read as generic. Use a hairline on a square element, a full ring, a tint or a soft shadow.
- **No gaps or orphaned cells in grids.** The door grid is 4 by 6 on phones and 6 by 4 from 640px, with door 25 centred beneath as a double door.
- No pill-shaped cards, neon, gratuitous gradients or meaningless glass. Blur is used only on the sticky top bar and tab bar, with solid fallbacks.

## Colour tokens (`src/styles/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--maroon` | #641D35 | Available door, wax seals, paper buttons |
| `--burgundy` | #33121F | Headings on paper, Christmas door |
| `--forest` | #203B30 | Surfaces, doors |
| `--midnight` | #101D18 | Page background |
| `--gold` | #D3B477 | Eyebrows, primary buttons, focus |
| `--ivory` | #F4EBDD | Text on dark, paper |
| `--snow` | #F3F0EA | Snow |
| `--ink` / `--ink-soft` | #2A211C / #5C5047 | Text on paper |
| `--mist` / `--mist-soft` | #B9AE9C / #9C9284 | Secondary text on dark |
| `--gold-ink` | #7A5F2B | Gold text on paper |

Measured contrast: ivory on midnight 14.7:1, gold on midnight 8.7:1, gold on forest 6.1:1, ivory on maroon 10.1:1, ink on ivory 13.3:1, ink-soft on ivory 6.6:1, gold-ink on ivory 5.1:1, mist on midnight 7.9:1, mist-soft on midnight 5.7:1. All pass WCAG AA for body text. Automated axe scans run in the browser tests.

## Typography

- **Cormorant Garamond** (variable, self-hosted via `@fontsource-variable`, OFL): display headings, letters, records, door numbers.
- **Manrope** (variable, self-hosted, OFL): body, instructions, labels, controls, inputs.
- Fluid scale `--step--1` to `--step-4`. Inputs are at least 16px so iOS never zooms. Never decorative type for instructions or numeric input.

## Space, shape, depth

4px base (`--s-1` 4 to `--s-8` 64). Radii 4, 8, 12px. Paper uses a sourced texture under an ivory wash and a layered soft shadow (`--shadow-paper`). Touch targets are at least 44 by 44px.

## Motion

| Kind | Duration | Token |
|---|---|---|
| Press feedback | 100ms | `--t-press` |
| Interface transitions | 220ms | `--t-ui` |
| Object interactions | 450ms | `--t-object` |
| Major reveals | 1000ms | `--t-reveal` |

Spring easing via CSS `linear()` with a cubic-bezier fallback. `prefers-reduced-motion` and the in-app setting set durations to zero, stop the village animation and make door opening instant. Wrong answers get a small shake (none under reduced motion) and a soft sound, never red flashes.

## Components

- **Doors** (`screens.css`): arched cottage doors in a recessed doorway, plank texture, brass knob. Future and locked doors are dark and quiet; the available door is maroon with warm light around it; completed doors stand ajar with the room lit behind.
- **Paper** (`.paper`, `.record`): letters, records, clues, menus.
- **Seals** (`Seal.tsx`): gold, silver and wax variants, rendered programmatically.
- **Glyphs** (`Glyph.tsx`): one 24px line-icon set, 1.5px stroke.
- **Stages** (`src/puzzles/stages.tsx`): text, code wheels, dials, choices, tiles, placement (including the Day 24 emblem), sorting, sentence builder, calendar picker, evidence board, record comparison, evidence slots, and the vault key.
- **Dialogs**: native `<dialog>` for focus trapping, Escape and focus return.
- **Feedback**: calm display-type lines above a hairline, announced through a polite live region.
