# Brand, layout, voice, music, mix

The source of truth for colours and safe areas is `assets/template/video/src/lib/look.ts`. This page explains it.

## Brand system (set by the brand intro, 2026-10-21)
- **Teal & orange.** Electric cyan `#22D3EE` builds the world: UI, rims, lines, light. Warm amber `#F59E0B` is the SIGNAL:
  every « 45 », the `$` prompt, cursors, the one key highlight of a scene, the Abonne-toi pill. Never big amber fills.
  Green `#34D399` only for healthy / fixed states. No red alarms: warnings are amber, the tone is confident and warm.
- Background: deep ink `#04070F` with a blue depth gradient (`B.bg`), never flat; light plates behind the glass.
- Glass cards (`glass()`), Inter 800 titles (tracking −0.03…−0.05em), JetBrains Mono for code.
- Series signature: the cyan ring timer « 00:45 » with amber digits (ident, HUD countdown, end card).
- **Real logos (the user's direction 2026-10-22: « I want my reels to have logos »).** Every tool / AWS service the
  episode talks about shows its REAL logo: `video/src/kit/Logo.tsx` + `kit/logos.ts` (77 logos in `public/logos/`:
  brands from Gil Barbara's SVG Logos, CC0; AWS services = the official AWS Architecture Icons; « devops » = the
  infinity loop drawn in code). Put the key in any `icon` field (`"icon": "docker"`, `"ec2"`, `"githubactions"`) —
  every archetype then draws the logo instead of the line glyph; the hook takes `data.logo` (main logo, big in the
  tile). When the voice SAYS a tool name, `components/LogoCallouts.tsx` pops its logo chip top-right (+ ui-pop cue),
  automatically. Brand logos sit on a light frosted plate so they read in their true colours. Studio composition
  « LogoSheet » shows them all. Each catalog episode lists its logos (`logos`, CSV column `logos`).
- Faceless: no person, no face card.
- French typography: accents, narrow no-break space before « ? ! : ».

## Layout (1080×1920)
- Safe: ≥ 220 px from the top, content ≤ y 1580, ≥ 60 px left; right ≥ 60 px above y 1000 and **≥ 140 px below y 1000**
  (Instagram's like/comment/share column).
- HUD: top-left, y 70–200 (body scenes only).
- Captions: y 1300–1540, Inter 800 72 px, ≤ 19 chars per line, 2 lines, cyan on the spoken word. Off in `title` and `cta`.
- Cover: the ident, text inside the central 1080×1080 (profile grid crops).

## Voice
- ElevenLabs « Kev - French - Dynamic » `<YOUR_ELEVENLABS_VOICE_ID>`, model `eleven_v4` (fallback `eleven_v3`), audio tags allowed
  (`[warmly] [confident] [softly] [pause]`). It's the voice the user approved. Never Chatterbox / stock French voices
  (English accent, rejected).
- Kev speaks ≈ 2.6 words/s: 105–120 words ≈ 45 s with the ident and the tail.
- Whisper word starts run ≈ 0.17 s early on Kev → `place_voice.py` adds that lag after each phrase's first word.

## Music
- **Episodes = the calm bed `calm`** (user, 2026-10-22: « I don't want music like that for those reels, only for the
  introduction reel »). A bed track has `mode: bed` in meta.json: it plays from `start_s`, no filtered build, no hole,
  steady level (gentler duck −10 dB × sidechain), soft swell on the ident, tail fade. Add one with
  `music_add.py <file> <start s> calm "<title>" "<credit>" "<licence>" bed`. Everything below about « Up » and the drop
  applies to the brand intro only.
- Library `assets/music/<key>/` (track.flac + meta.json with the whole-track beat grid, sub hits, drop). Default `up` =
  « Bang! Johann – Up », Mixkit 549, Mixkit Stock Music Free License (social/commercial OK, no attribution, never
  register it on Content ID). 107.7 BPM, drop at 104.66 s of the source; 165.5 s long → covers any episode ≤ 60 s.
- The drop lands on the series ident (`KEY.drop`); filtered build under the hook (low-pass 900 Hz → open), 0.25 s hole
  before the drop, full groove after, a short dip before the final hit, tail fade.
- To add a track (only one the user picked, royalty-free stock, no AI music, no songs):
  `~/.venvs/audio/bin/python music_add.py <file> <approx drop s> <key> "<title>" "<credit>" "<licence>"`, then set
  `music.track` in episode.json. Offer the user a numbered list of measured candidates first.

## SFX
`assets/sfx/`: glass, tick, cards, suckin (END on f), basshit, typing (2.2 s, trimmed with `max_s`), glint, check,
impact (starts after the last word), whoosh (peak on f), riser (END on f), tap, ui-pop, ui-click, zoom-swish,
camera-shutter. ElevenLabs Sound Effects v2 picks from the brand intro, measured (not listened).
The director cues are automatic: basshit + glass on the drop, impact on the final hit.

## Mix (`mix.py`) and master (`deliver.sh`)
- Sidechain from the voice (−42 dB gate, 20 ms attack, 250 ms release, 30 ms look-ahead).
- Music: broadband −16 dB × sidechain, dynamic 1–4 kHz carve −12 dB, −2 dB trim.
- SFX: peak-normalised −3 dBFS, × default gain × cue gain × 0.6, ducked to 0.18 under words.
- Voice +1 dB; safety limiter −1.5 dBFS.
- Master: two-pass loudnorm −14 LUFS (linear), 192 kHz alimiter 0.708 (true peak), 48 kHz 24-bit; final AAC-LC 256k.
- QA: voice lead ≥ 8 dB per phrase (aim ≥ 10), blind Whisper hears ≥ 85 % of the script.
