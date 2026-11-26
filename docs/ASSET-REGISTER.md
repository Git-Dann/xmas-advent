# Asset register

Every third-party asset shipped in the public build. Generated from `docs/asset-register.json` (edit that file, then regenerate). Required notices are in `public/assets/NOTICES.txt`.

No asset is AI-generated. Interface icons, seals, the frost mask, snow particles and the procedural village fallback are programmatic interface graphics drawn in code.

## soundkit UI and cue sounds (THISUX)

- Creator: THISUX Private Limited
- Source: https://github.com/thisuxhq/soundkit
- Licence: MIT (https://github.com/thisuxhq/soundkit/blob/main/LICENSE)
- Downloaded: 2026-11-26
- Attribution: soundkit, Copyright (c) 2026 THISUX Private Limited, MIT License (full licence text in public/assets/NOTICES.txt)
- Permitted usage: MIT: use, copy, modify, merge, publish, distribute, sublicense and sell, provided the copyright notice and permission notice are included.
- Size: 199059 bytes original, 84238 bytes optimised
- Modifications: DSP-generated sounds (not recordings) from the soundkit repository; selected files renamed, mono, trimmed, loudness-normalised and re-encoded AAC .m4a, metadata stripped (previous sourcing run). originalFileSize is the whole downloaded soundkit "full" folder.
- Files: `/assets/audio/ui/back-1.m4a`, `/assets/audio/ui/back-2.m4a`, `/assets/audio/ui/close-1.m4a`, `/assets/audio/ui/error-soft-1.m4a`, `/assets/audio/ui/error-soft-2.m4a`, `/assets/audio/ui/inspect-1.m4a`, `/assets/audio/ui/open-1.m4a`, `/assets/audio/ui/press-1.m4a`, `/assets/audio/ui/press-2.m4a`, `/assets/audio/ui/release-1.m4a`, `/assets/audio/ui/release-2.m4a`, `/assets/audio/ui/tap-1.m4a` and more

## !Boring Sound Kit (18 sounds: Button Clicks, Natural Taps, Musical Taps, Whoosh, Success, Failed/Undo, Atmosphere)

- Creator: Not Boring Software
- Source: https://notbor.ing/soundkit (linked from https://notbor.ing/words/the-sound-of-software; public Notion page andyworksco.notion.site/Boring-Sounds-d92a136378114eceb1898313acb673f0, file "!Boring Sound Kit.zip")
- Licence: CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Downloaded: 2026-11-26
- Attribution: Sounds from the "!Boring Sound Kit" by Not Boring Software (https://notbor.ing/soundkit), licensed under CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/). These files have been modified (trimmed, normalised and converted) and are distributed under the same CC BY-NC-SA 4.0 licence.
- Permitted usage: Non-commercial use only (owner confirmed this is a private, personal, non-commercial one-time gift). Attribution, indication of changes and ShareAlike (adapted files stay CC BY-NC-SA 4.0) required. Must not be used in anything sold or monetised.
- Size: 3768784 bytes original, 213740 bytes optimised
- Modifications: Source WAVs (44.1 kHz stereo, from the official zip, which contained no licence/readme file) trimmed of silence, mixed to mono, short fades, loudness-normalised (approx. -18 LUFS; fail.wav to -24 LUFS), converted to AAC .m4a 96 kbps, metadata stripped, renamed. Mapping: button-1.wav -> /assets/audio/ui/click-1.m4a; button-2.wav -> /assets/audio/ui/click-2.m4a; button-3.wav -> /assets/audio/ui/click-3.m4a; button-4.wav -> /assets/audio/fx/dial-tick-1.m4a; button-5.wav -> /assets/audio/fx/dial-tick-2.m4a; button-6.wav -> /assets/audio/fx/dial-tick-3.m4a; natural-tap-1.wav -> /assets/audio/fx/wood-tap-1.m4a; natural-tap-2.wav -> /assets/audio/fx/wood-tap-2.m4a; natural-tap-3.wav -> /assets/audio/fx/wood-tap-3.m4a; whoosh-1.wav -> /assets/audio/fx/whoosh-1.m4a; whoosh-2.wav -> /assets/audio/fx/whoosh-2.m4a; musical-tap-1.wav -> /assets/audio/cues/musical-tap-1.m4a; musical-tap-2.wav -> /assets/audio/cues/musical-tap-2.m4a; musical-tap-3.wav -> /assets/audio/cues/musical-tap-3.m4a; success.wav -> /assets/audio/cues/success-1.m4a; atmosphere-1.wav -> /assets/audio/cues/reveal-shimmer-1.m4a; atmostphere-2.wav -> /assets/audio/cues/reveal-shimmer-2.m4a; fail.wav -> /assets/audio/ui/undo-soft-1.m4a. originalFileSize is the sum of the 18 WAVs (zip 2,340,540 bytes).
- Files: `/assets/audio/ui/click-1.m4a`, `/assets/audio/ui/click-2.m4a`, `/assets/audio/ui/click-3.m4a`, `/assets/audio/fx/dial-tick-1.m4a`, `/assets/audio/fx/dial-tick-2.m4a`, `/assets/audio/fx/dial-tick-3.m4a`, `/assets/audio/fx/wood-tap-1.m4a`, `/assets/audio/fx/wood-tap-2.m4a`, `/assets/audio/fx/wood-tap-3.m4a`, `/assets/audio/fx/whoosh-1.m4a`, `/assets/audio/fx/whoosh-2.m4a`, `/assets/audio/cues/musical-tap-1.m4a` and more

## Howling wind.ogg

- Creator: Tvabutzku1234
- Source: https://commons.wikimedia.org/wiki/File:Howling_wind.ogg
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 1112243 bytes original, 485051 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original; excerpt of 30-34 s cut, mixed to mono, 44.1 kHz, tail crossfaded into head (1.5 s) for a seamless loop, loudness-normalised (approx. -28 to -35 LUFS, light peak limiting), encoded AAC 128 kbps .m4a, metadata stripped.
- Files: `/assets/audio/ambient/wind-1.m4a`

## Killiney Hill Storm Floris 20250804 1537.ogg

- Creator: Karlunun
- Source: https://commons.wikimedia.org/wiki/File:Killiney_Hill_Storm_Floris_20250804_1537.ogg
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 1160895 bytes original, 486568 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original; excerpt of 30-34 s cut, mixed to mono, 44.1 kHz, tail crossfaded into head (1.5 s) for a seamless loop, loudness-normalised (approx. -28 to -35 LUFS, light peak limiting), encoded AAC 128 kbps .m4a, metadata stripped.
- Files: `/assets/audio/ambient/wind-2.m4a`

## Campfire sound ambience.ogg

- Creator: Glaneur de sons
- Source: https://commons.wikimedia.org/wiki/File:Campfire_sound_ambience.ogg
- Licence: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
- Downloaded: 2026-11-26
- Attribution: "Campfire sound ambience" by Glaneur de sons (via Freesound), CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Campfire_sound_ambience.ogg. Modified (excerpted, looped, normalised, converted).
- Permitted usage: CC BY: use, modification and redistribution (including commercial) permitted with attribution and indication of changes.
- Size: 554608 bytes original, 588519 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original; excerpt of 30-34 s cut, mixed to mono, 44.1 kHz, tail crossfaded into head (1.5 s) for a seamless loop, loudness-normalised (approx. -28 to -35 LUFS, light peak limiting), encoded AAC 128 kbps .m4a, metadata stripped.
- Files: `/assets/audio/ambient/fireplace-1.m4a`

## Dry grass burning in open fireplace.ogg

- Creator: ezwa
- Source: https://commons.wikimedia.org/wiki/File:Dry_grass_burning_in_open_fireplace.ogg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 511116 bytes original, 484017 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original; excerpt of 30-34 s cut, mixed to mono, 44.1 kHz, tail crossfaded into head (1.5 s) for a seamless loop, loudness-normalised (approx. -28 to -35 LUFS, light peak limiting), encoded AAC 128 kbps .m4a, metadata stripped.
- Files: `/assets/audio/ambient/fireplace-2.m4a`

## Tawny owl calling at night in Tuntorp, Brastad, Sweden.ogg

- Creator: W.carter
- Source: https://commons.wikimedia.org/wiki/File:Tawny_owl_calling_at_night_in_Tuntorp,_Brastad,_Sweden.ogg
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Downloaded: 2026-11-26
- Attribution: "Tawny owl calling at night in Tuntorp, Brastad, Sweden" by W.carter, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Tawny_owl_calling_at_night_in_Tuntorp,_Brastad,_Sweden.ogg. Modified (excerpted, looped, normalised, converted).
- Permitted usage: CC BY: use, modification and redistribution (including commercial) permitted with attribution and indication of changes.
- Size: 21603448 bytes original, 1006049 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original; excerpt of 30-34 s cut, mixed to mono, 44.1 kHz, tail crossfaded into head (1.5 s) for a seamless loop, loudness-normalised (approx. -28 to -35 LUFS, light peak limiting), encoded AAC 128 kbps .m4a, metadata stripped. Two excerpts (from 102 s and 172 s).
- Files: `/assets/audio/ambient/winter-night-1.m4a`, `/assets/audio/ambient/winter-night-2.m4a`

## Turning a page.ogg

- Creator: planish
- Source: https://commons.wikimedia.org/wiki/File:Turning_a_page.ogg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 49558 bytes original, 11726 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/letter-unfold-1.m4a`

## Book paper pages assorted.ogg

- Creator: stephan
- Source: https://commons.wikimedia.org/wiki/File:Book_paper_pages_assorted.ogg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 2474211 bytes original, 54078 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped. Four short excerpts.
- Files: `/assets/audio/fx/paper-rustle-1.m4a`, `/assets/audio/fx/paper-rustle-2.m4a`, `/assets/audio/fx/paper-rustle-3.m4a`, `/assets/audio/fx/letter-unfold-2.m4a`

## Tearing off small strip.ogg

- Creator: stephan
- Source: https://commons.wikimedia.org/wiki/File:Tearing_off_small_strip.ogg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 47757 bytes original, 18420 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/seal-break-1.m4a`

## 342618 spacejoe lock-1-close-lock-3.wav

- Creator: SpaceJoe
- Source: https://commons.wikimedia.org/wiki/File:342618_spacejoe_lock-1-close-lock-3.wav
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 319576 bytes original, 4709 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/lock-engage-1.m4a`

## 342701 spacejoe lock-3-close-lock-1.wav

- Creator: SpaceJoe
- Source: https://commons.wikimedia.org/wiki/File:342701_spacejoe_lock-3-close-lock-1.wav
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 200792 bytes original, 6101 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/lock-engage-2.m4a`

## 342675 spacejoe lock-2-close-lock-1.wav

- Creator: SpaceJoe
- Source: https://commons.wikimedia.org/wiki/File:342675_spacejoe_lock-2-close-lock-1.wav
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 233560 bytes original, 5447 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/lock-engage-3.m4a`

## 342706 spacejoe lock-3-open-lock-3.wav

- Creator: SpaceJoe
- Source: https://commons.wikimedia.org/wiki/File:342706_spacejoe_lock-3-open-lock-3.wav
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 94296 bytes original, 2172 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/lock-release-1.m4a`

## Lock (Gravity Sound).wav

- Creator: Gravity Sound
- Source: https://commons.wikimedia.org/wiki/File:Lock_(Gravity_Sound).wav
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Downloaded: 2026-11-26
- Attribution: "lock" by Gravity Sound, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Lock_(Gravity_Sound).wav. Modified (trimmed, normalised, converted).
- Permitted usage: CC BY: use, modification and redistribution (including commercial) permitted with attribution and indication of changes.
- Size: 100452 bytes original, 6092 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/lock-release-2.m4a`

## Lock 2 (Gravity Sound).wav

- Creator: Gravity Sound
- Source: https://commons.wikimedia.org/wiki/File:Lock_2_(Gravity_Sound).wav
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Downloaded: 2026-11-26
- Attribution: "lock 2" by Gravity Sound, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Lock_2_(Gravity_Sound).wav. Modified (trimmed, normalised, converted).
- Permitted usage: CC BY: use, modification and redistribution (including commercial) permitted with attribution and indication of changes.
- Size: 133560 bytes original, 7467 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/key-insert-1.m4a`

## Keys shaking (Gravity Sound).wav

- Creator: Gravity Sound
- Source: https://commons.wikimedia.org/wiki/File:Keys_shaking_(Gravity_Sound).wav
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Downloaded: 2026-11-26
- Attribution: "keys shaking" by Gravity Sound, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Keys_shaking_(Gravity_Sound).wav. Modified (trimmed, normalised, converted).
- Permitted usage: CC BY: use, modification and redistribution (including commercial) permitted with attribution and indication of changes.
- Size: 1182304 bytes original, 9562 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/key-insert-2.m4a`

## Key item pick up 2 (Gravity Sound).wav

- Creator: Gravity Sound
- Source: https://commons.wikimedia.org/wiki/File:Key_item_pick_up_2_(Gravity_Sound).wav
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Downloaded: 2026-11-26
- Attribution: "key item pick up 2" by Gravity Sound, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Key_item_pick_up_2_(Gravity_Sound).wav. Modified (trimmed, normalised, converted).
- Permitted usage: CC BY: use, modification and redistribution (including commercial) permitted with attribution and indication of changes.
- Size: 67324 bytes original, 4387 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/key-pickup-1.m4a`

## Tight door lock (Gravity Sound).wav

- Creator: Gravity Sound
- Source: https://commons.wikimedia.org/wiki/File:Tight_door_lock_(Gravity_Sound).wav
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Downloaded: 2026-11-26
- Attribution: "tight door lock" by Gravity Sound, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Tight_door_lock_(Gravity_Sound).wav. Modified (trimmed, normalised, converted).
- Permitted usage: CC BY: use, modification and redistribution (including commercial) permitted with attribution and indication of changes.
- Size: 530990 bytes original, 13041 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/key-turn-1.m4a`

## Tight door lock 2 (Gravity Sound).wav

- Creator: Gravity Sound
- Source: https://commons.wikimedia.org/wiki/File:Tight_door_lock_2_(Gravity_Sound).wav
- Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Downloaded: 2026-11-26
- Attribution: "tight door lock 2" by Gravity Sound, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Tight_door_lock_2_(Gravity_Sound).wav. Modified (trimmed, normalised, converted).
- Permitted usage: CC BY: use, modification and redistribution (including commercial) permitted with attribution and indication of changes.
- Size: 530988 bytes original, 13043 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/key-turn-2.m4a`

## Squeaky door.ogg

- Creator: leonmire
- Source: https://commons.wikimedia.org/wiki/File:Squeaky_door.ogg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 96166 bytes original, 41883 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/door-open-1.m4a`

## Closing an old door.ogg

- Creator: ezwa
- Source: https://commons.wikimedia.org/wiki/File:Closing_an_old_door.ogg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 82246 bytes original, 16841 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/door-close-1.m4a`

## Door handle creaking.ogg

- Creator: stephan
- Source: https://commons.wikimedia.org/wiki/File:Door_handle_creaking.ogg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 145741 bytes original, 17335 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/door-handle-1.m4a`

## Watch tick.ogg

- Creator: Marble Toast
- Source: https://commons.wikimedia.org/wiki/File:Watch_tick.ogg
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 12903 bytes original, 2677 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/fx/dial-tick-4.m4a`

## Chime.wav

- Creator: Walechon24
- Source: https://commons.wikimedia.org/wiki/File:Chime.wav
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 198956 bytes original, 7505 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/cues/chime-1.m4a`

## Chime (1) Sample.wav

- Creator: UnKnownrNone
- Source: https://commons.wikimedia.org/wiki/File:Chime_(1)_Sample.wav
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 133754 bytes original, 17915 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped.
- Files: `/assets/audio/cues/chime-2.m4a`

## Windglockenspiel.Koshi.ogg

- Creator: Membeth.
- Source: https://commons.wikimedia.org/wiki/File:Windglockenspiel.Koshi.ogg
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 1420891 bytes original, 86304 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped. 7 s excerpt from 23.8 s, 2 s fade-out.
- Files: `/assets/audio/cues/wind-chime-1.m4a`

## Stille Nacht.ogg

- Creator: unbekannt, tot seit über 70 Jahren
- Source: https://commons.wikimedia.org/wiki/File:Stille_Nacht.ogg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 396278 bytes original, 148659 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped. 12 s excerpt from the start, 2.5 s fade-out. Recording of an antique Polyphon music-box disc (c. 1880) playing "Silent Night" (Gruber, public domain).
- Files: `/assets/audio/cues/finale-music-box-1.m4a`

## Sleigh bells.wav

- Creator: The Midnite Wolf
- Source: https://commons.wikimedia.org/wiki/File:Sleigh_bells.wav
- Licence: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 1302830 bytes original, 94916 bytes optimised
- Modifications: Downloaded as Wikimedia Commons MP3 transcode of the original (originals were rate-limited); trimmed, silence removed, mixed to mono, resampled to 44.1 kHz, short fades added, loudness-normalised (approx. -18 LUFS one-shots / -28 to -32 LUFS loops, light peak limiting where needed), encoded AAC .m4a, metadata stripped. First 8 s, 1.2 s fade-out.
- Files: `/assets/audio/cues/finale-sleigh-bells-1.m4a`

## Engraving: red-squirrel

- Creator: Bibliographisches Institut
- Source: https://commons.wikimedia.org/wiki/File:Meyers_b11_s0979a.jpg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (public domain). Courtesy note: via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Meyers_b11_s0979a.jpg
- Permitted usage: Public domain (expired copyright, 19th/early-20th-century publication): unrestricted use, modification and redistribution.
- Size: 824206 bytes original, 251710 bytes optimised
- Modifications: Plate "Nagetiere I", Meyers Konversations-Lexikon 4th ed. (1885-90), vol. 11; panel "Eichhorn (Sciurus vulgaris)"; the two smaller squirrels at right were removed. Downloaded a Wikimedia Commons standard-size thumbnail of the scan; cropped to the single subject, unwanted neighbouring figures/captions whited out, paper converted to transparency (luminance-to-alpha), ink re-coloured dark sepia (#261b13), downscaled to <=900 px long edge, exported WebP (quality 70-78) with alpha, metadata stripped.
- Files: `/assets/engravings/red-squirrel.webp`

## Engraving: robin

- Creator: Plate printer Joseph M. Kornheim (1810-1896) published by Frederick Warne & Co.
- Source: https://commons.wikimedia.org/wiki/File:Book_Illustration_of_a_Robin_and_Wren.jpg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (public domain). Courtesy note: via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Book_Illustration_of_a_Robin_and_Wren.jpg
- Permitted usage: Public domain (expired copyright, 19th/early-20th-century publication): unrestricted use, modification and redistribution.
- Size: 88652 bytes original, 26324 bytes optimised
- Modifications: Robin and wren book illustration, 1871 (plate printer Joseph M. Kornheim, Frederick Warne & Co.); upper bird (robin) cropped; source image is only 553 px wide so the result is small (285x240). Downloaded a Wikimedia Commons standard-size thumbnail of the scan; cropped to the single subject, unwanted neighbouring figures/captions whited out, paper converted to transparency (luminance-to-alpha), ink re-coloured dark sepia (#261b13), downscaled to <=900 px long edge, exported WebP (quality 70-78) with alpha, metadata stripped.
- Files: `/assets/engravings/robin.webp`

## Engraving: owl

- Creator: various
- Source: https://commons.wikimedia.org/wiki/File:Meyers_b5_s0905a.jpg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (public domain). Courtesy note: via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Meyers_b5_s0905a.jpg
- Permitted usage: Public domain (expired copyright, 19th/early-20th-century publication): unrestricted use, modification and redistribution.
- Size: 733607 bytes original, 131764 bytes optimised
- Modifications: Plate "Eulen", Meyers Konversations-Lexikon 4th ed. (1885-90), vol. 5; panel "Waldkauz (Syrnium aluco)" (tawny owl). Downloaded a Wikimedia Commons standard-size thumbnail of the scan; cropped to the single subject, unwanted neighbouring figures/captions whited out, paper converted to transparency (luminance-to-alpha), ink re-coloured dark sepia (#261b13), downscaled to <=900 px long edge, exported WebP (quality 70-78) with alpha, metadata stripped.
- Files: `/assets/engravings/owl.webp`

## Engraving: hare

- Creator: various
- Source: https://commons.wikimedia.org/wiki/File:Die_Gartenlaube_(1871)_b_645.jpg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (public domain). Courtesy note: via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Die_Gartenlaube_(1871)_b_645.jpg
- Permitted usage: Public domain (expired copyright, 19th/early-20th-century publication): unrestricted use, modification and redistribution.
- Size: 1865275 bytes original, 291238 bytes optimised
- Modifications: Wood engraving after Guido Hammer, Die Gartenlaube 1871 p. 645; running hare cropped (dog in background excluded). Downloaded a Wikimedia Commons standard-size thumbnail of the scan; cropped to the single subject, unwanted neighbouring figures/captions whited out, paper converted to transparency (luminance-to-alpha), ink re-coloured dark sepia (#261b13), downscaled to <=900 px long edge, exported WebP (quality 70-78) with alpha, metadata stripped.
- Files: `/assets/engravings/hare.webp`

## Engraving: fox

- Creator: Unknown engraver
- Source: https://commons.wikimedia.org/wiki/File:AmCyc_Fox_-_European_Fox.jpg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (public domain). Courtesy note: via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:AmCyc_Fox_-_European_Fox.jpg
- Permitted usage: Public domain (expired copyright, 19th/early-20th-century publication): unrestricted use, modification and redistribution.
- Size: 403031 bytes original, 131688 bytes optimised
- Modifications: European fox, The American Cyclopaedia vol. 7 (1879) p. 359; cropped to the fox (prey at the bottom of the original excluded); lower alpha cut-off to drop print show-through from the reverse page. Downloaded a Wikimedia Commons standard-size thumbnail of the scan; cropped to the single subject, unwanted neighbouring figures/captions whited out, paper converted to transparency (luminance-to-alpha), ink re-coloured dark sepia (#261b13), downscaled to <=900 px long edge, exported WebP (quality 70-78) with alpha, metadata stripped.
- Files: `/assets/engravings/fox.webp`

## Engraving: hedgehog

- Creator: Butterworth and Heath
- Source: https://commons.wikimedia.org/wiki/File:EB1911_-_Hedgehog.jpg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (public domain). Courtesy note: via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:EB1911_-_Hedgehog.jpg
- Permitted usage: Public domain (expired copyright, 19th/early-20th-century publication): unrestricted use, modification and redistribution.
- Size: 336625 bytes original, 239106 bytes optimised
- Modifications: Hedgehog engraving by Butterworth & Heath, Encyclopaedia Britannica 11th ed. (1911), vol. 13. Note: published 1911 (early 20th century), engraved in the 19th-century line style. Downloaded a Wikimedia Commons standard-size thumbnail of the scan; cropped to the single subject, unwanted neighbouring figures/captions whited out, paper converted to transparency (luminance-to-alpha), ink re-coloured dark sepia (#261b13), downscaled to <=900 px long edge, exported WebP (quality 70-78) with alpha, metadata stripped.
- Files: `/assets/engravings/hedgehog.webp`

## Engraving: deer

- Creator: Unknown
- Source: https://commons.wikimedia.org/wiki/File:Meyers_b8_s0565a.jpg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (public domain). Courtesy note: via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Meyers_b8_s0565a.jpg
- Permitted usage: Public domain (expired copyright, 19th/early-20th-century publication): unrestricted use, modification and redistribution.
- Size: 727894 bytes original, 135056 bytes optimised
- Modifications: Plate "Hirsche", Meyers Konversations-Lexikon 4th ed. (1885-90), vol. 8; panel "Renntier (Rangifer tarandus)" (reindeer, antlered); neighbouring figures (Axis deer legs, Sami herder and tent) whited out. Downloaded a Wikimedia Commons standard-size thumbnail of the scan; cropped to the single subject, unwanted neighbouring figures/captions whited out, paper converted to transparency (luminance-to-alpha), ink re-coloured dark sepia (#261b13), downscaled to <=900 px long edge, exported WebP (quality 70-78) with alpha, metadata stripped.
- Files: `/assets/engravings/deer.webp`

## Engraving: elephant

- Creator: Unknown engraver
- Source: https://commons.wikimedia.org/wiki/File:PSM_V02_D156_Asiatic_elephant.jpg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (public domain). Courtesy note: via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:PSM_V02_D156_Asiatic_elephant.jpg
- Permitted usage: Public domain (expired copyright, 19th/early-20th-century publication): unrestricted use, modification and redistribution.
- Size: 354367 bytes original, 231160 bytes optimised
- Modifications: Head and trunk of an Asiatic elephant, Popular Science Monthly vol. 2 (1872-73). Downloaded a Wikimedia Commons standard-size thumbnail of the scan; cropped to the single subject, unwanted neighbouring figures/captions whited out, paper converted to transparency (luminance-to-alpha), ink re-coloured dark sepia (#261b13), downscaled to <=900 px long edge, exported WebP (quality 70-78) with alpha, metadata stripped.
- Files: `/assets/engravings/elephant.webp`

## Engraving: foxglove

- Creator: Unknown engraver
- Source: https://commons.wikimedia.org/wiki/File:Britannica_Scrophulariaceae,_Foxglove.jpg
- Licence: Public domain (https://creativecommons.org/publicdomain/mark/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (public domain). Courtesy note: via Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Britannica_Scrophulariaceae,_Foxglove.jpg
- Permitted usage: Public domain (expired copyright, 19th/early-20th-century publication): unrestricted use, modification and redistribution.
- Size: 343344 bytes original, 50002 bytes optimised
- Modifications: Foxglove (Digitalis purpurea), Encyclopaedia Britannica 11th ed. (1911) vol. 24 p. 485; botanical detail figures 1-3 and numerals removed, main flowering plant kept. Note: published 1911. Downloaded a Wikimedia Commons standard-size thumbnail of the scan; cropped to the single subject, unwanted neighbouring figures/captions whited out, paper converted to transparency (luminance-to-alpha), ink re-coloured dark sepia (#261b13), downscaled to <=900 px long edge, exported WebP (quality 70-78) with alpha, metadata stripped.
- Files: `/assets/engravings/foxglove.webp`

## Brown Leather (Poly Haven)

- Creator: Rob Tuytel
- Source: https://polyhaven.com/a/brown_leather
- Licence: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (CC0). Courtesy credit: Poly Haven (polyhaven.com)
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 503348 bytes original, 243898 bytes optimised
- Modifications: From the 1K albedo map; re-encoded as JPEG and WebP for the web, metadata stripped (previous sourcing run). Source identified by pixel correlation with the downloaded originals (r>=0.89; normal map is a re-processed version, r=0.35).
- Files: `/assets/textures/leather-brown.jpg`, `/assets/textures/leather-brown.webp`

## Snow 02 (Poly Haven)

- Creator: Rob Tuytel
- Source: https://polyhaven.com/a/snow_02
- Licence: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (CC0). Courtesy credit: Poly Haven (polyhaven.com)
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 325497 bytes original, 146046 bytes optimised
- Modifications: From the 1K diffuse map; re-encoded as JPEG and WebP for the web, metadata stripped (previous sourcing run). Source identified by pixel correlation with the downloaded originals (r>=0.89; normal map is a re-processed version, r=0.35).
- Files: `/assets/textures/snow.jpg`, `/assets/textures/snow.webp`

## Velour Velvet (Poly Haven)

- Creator: colormass (photography), Rico Cilliers (processing)
- Source: https://polyhaven.com/a/velour_velvet
- Licence: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (CC0). Courtesy credit: Poly Haven (polyhaven.com)
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 735556 bytes original, 83479 bytes optimised
- Modifications: From the 1K diffuse map, cropped and colour-adjusted toward maroon; re-encoded as JPEG and WebP for the web, metadata stripped (previous sourcing run). Source identified by pixel correlation with the downloaded originals (r>=0.89; normal map is a re-processed version, r=0.35).
- Files: `/assets/textures/velvet-maroon.jpg`, `/assets/textures/velvet-maroon.webp`

## Wood Table 001 (Poly Haven)

- Creator: Dimitrios Savva (photography), Rico Cilliers (processing)
- Source: https://polyhaven.com/a/wood_table_001
- Licence: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (CC0). Courtesy credit: Poly Haven (polyhaven.com)
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 267500 bytes original, 302293 bytes optimised
- Modifications: From the 1K diffuse and normal (GL) maps; re-encoded as JPEG and WebP for the web, metadata stripped (previous sourcing run). Source identified by pixel correlation with the downloaded originals (r>=0.89; normal map is a re-processed version, r=0.35).
- Files: `/assets/textures/wood-table.jpg`, `/assets/textures/wood-table.webp`, `/assets/textures/wood-table-normal.jpg`, `/assets/textures/wood-table-normal.webp`

## Paper 001 (ambientCG)

- Creator: ambientCG (Lennart Demes)
- Source: https://ambientcg.com/a/Paper001
- Licence: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (CC0). Courtesy credit: ambientCG.com
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 398173 bytes original, 48592 bytes optimised
- Modifications: From the 1K colour map, cropped to 1024x600; re-encoded as JPEG and WebP for the web, metadata stripped (previous sourcing run). Source identified by pixel correlation with the downloaded originals (r>=0.89; normal map is a re-processed version, r=0.35).
- Files: `/assets/textures/paper-fine.jpg`, `/assets/textures/paper-fine.webp`

## Paper 003 (ambientCG)

- Creator: ambientCG (Lennart Demes)
- Source: https://ambientcg.com/a/Paper003
- Licence: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (CC0). Courtesy credit: ambientCG.com
- Permitted usage: Public domain / CC0: unrestricted use, modification and redistribution, including on a private website.
- Size: 116443 bytes original, 20145 bytes optimised
- Modifications: From the 1K colour map; re-encoded as JPEG and WebP for the web, metadata stripped (previous sourcing run). Source identified by pixel correlation with the downloaded originals (r>=0.89; normal map is a re-processed version, r=0.35).
- Files: `/assets/textures/paper-crumpled.jpg`, `/assets/textures/paper-crumpled.webp`

## Holiday Kit 2.0 (27 models and shared colour map)

- Creator: Kenney (www.kenney.nl)
- Source: https://kenney.nl/assets/holiday-kit
- Licence: CC0 1.0 (http://creativecommons.org/publicdomain/zero/1.0/)
- Downloaded: 2026-11-26
- Attribution: None required (credit to Kenney given voluntarily)
- Permitted usage: Personal, educational and commercial use; modification and redistribution allowed
- Size: 4482244 bytes original, 728029 bytes optimised
- Modifications: Supplied by Dan as the official zip. Subset of GLB models used unchanged. Colour map recoloured to the project palette (greens to forest, orange timber to aged timber, pinks to gold, reds to maroon).
- Files: `public/assets/models/holiday/cabin-corner-logs.glb`, `public/assets/models/holiday/cabin-doorway.glb`, `public/assets/models/holiday/cabin-roof-snow-chimney.glb`, `public/assets/models/holiday/cabin-roof-snow-point.glb`, `public/assets/models/holiday/cabin-roof-snow.glb`, `public/assets/models/holiday/cabin-roof-top.glb`, `public/assets/models/holiday/cabin-wall-roof-center.glb`, `public/assets/models/holiday/cabin-wall-roof.glb`, `public/assets/models/holiday/cabin-wall-wreath.glb`, `public/assets/models/holiday/cabin-wall.glb`, `public/assets/models/holiday/cabin-window-a.glb`, `public/assets/models/holiday/cabin-window-b.glb` and more
