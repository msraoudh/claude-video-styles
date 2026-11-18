# « NO MORE EXCUSES » — trailer about the user (@yourhandle). Rules every scene agent follows.

## What this is
A 60-second, 9:16, 60 fps **thriller-style trailer about a creator**: Med the user (the user), @yourhandle, a French/Tunisian
tech creator (cloud, AI, automation with n8n, Claude, web explainers, IT-career tough love). Their reels: talking to camera
with a lav mic in hand, bedroom-desk with RGB lights, Nike Air cap, glasses, curls; plus motion-graphics episodes with their
face in a glass card at the bottom. Their own slogans (from their captions): "No more excuses", "Move on !!", "Adapt urself to ai",
"Get the hell outta there", "focus on the value", "Learn these and u will dominate the market".

The edit is **cut on the bass** of the song ACIDO III (UdieNnx x Mc Denny), slowed to 0.85 (112.3 BPM, a beat = 32 frames).
Dark, cold, menacing, premium. Think film trailer + phonk edit: hard cuts on 808 hits, punch-ins, speed ramps, strobe, flash
frames, text slamming on beats, black frames, slow-mo on the silences. The user wants "real editing", dark sound effects and
dark animations. All on-screen words in **French** (tech words may stay English).

Pronouns: the user's pronouns are not stated — in any prose you write (comments, reports) refer to them by name or as "the user".

## Project
- Remotion 4.0.535 project: `/home/you/me-trailer/video` (WSL). Composition `Trailer` 1080x1920, 60 fps, 3600 frames.
- Edit files via the Windows UNC path `\\wsl.localhost\Ubuntu\home\mesaid\me-trailer\video\...` with Read/Write/Edit.
- Run shell commands as: `MSYS_NO_PATHCONV=1 wsl.exe bash /home/you/<script>.sh` — **wsl.exe mangles `$` in inline
  `bash -lc "..."` commands**, so put anything with variables/loops into a .sh file and run that file.
- Type-check: `cd ~/me-trailer/video && source ~/.nvm/nvm.sh && nvm use 24 && npx tsc --noEmit -p .`
- QA stills (GLOBAL frame numbers): `~/me-trailer/video/stills.sh Part-<yourpart> <frame> <frame> ...`
  → `~/me-trailer/qa/stills/Part-<yourpart>-<frame>.jpg` (half scale). Stills go through a shared render lock, one at a
  time across all agents — **never run `npx remotion render` yourself, never render video, never start the Studio.**
  Make contact sheets with python3 + PIL (copy them to a Windows path you can Read, e.g.
  `/mnt/c/Users/YOU/AppData/Local/Temp/claude/C--Users-myourname-ext-Desktop-reel-project/69e47e80-6628-42aa-9af8-e621f1e4aaa6/scratchpad/`).
- You may ONLY write inside `video/src/sections/<yourpart>/` (any files) and `video/src/data/cues/<yourpart>.json`.
  Do not edit shared files (Trailer.tsx, Root.tsx, lib/, components/, data/*.ts, kit/). Need a helper? Put it in your folder.

## Data you build on (read these files first)
- `src/data/beats.ts` — `BEATS` (every beat), `DOWNBEATS` (bar starts), `HITS` (808 onsets {f, rise dB, level dB}),
  `BIG_HITS` (the heavy accents), `SUB_ENV` (sub-bass loudness 0..1 per frame), `KEY` (named moments). All GLOBAL frames.
- `src/data/voice.ts` — `LINES`: the user's own voice lines with `from`, `durationInFrames`, `srcIn` (seconds into the source),
  and per-word frames `words[{w,f,e}]` (GLOBAL frames). `line("A")`.
- `src/data/sections.ts` — section ranges. `src/data/footage.ts` — the shot library `CLIPS` (+ `qa/footage-sheet.jpg` shows
  a frame of each; descriptions say what's in it). `brief/plan.json`-style master: `/home/you/me-trailer/plan/plan.json`.
- `src/lib/beat.ts` — `useGlobalFrame()` (USE THIS for anything music-synced; useCurrentFrame() is local to your Sequence),
  `beatPulse/hitPulse/strongHitPulse/bigHitPulse(f)`, `sub(f)`, `bassShake(f, px)`, `beatsBetween/hitsBetween/snapToBeat`,
  `rand(seed)` (deterministic). `src/lib/look.ts` — palette `L` and footage grades `GRADE`.
- `src/components/Shot.tsx` — `<Shot clip="f05" at={sec} speed={1|0.3|0|timeMap} focus="50% 35%" scale punch shake grade>`
  (muted footage with exact time-mapping: slow-mo, freezes, speed ramps via `ramp(...)`), `<Matte>` = alpha cut-out of the user
  from the master `master-v4` (same `at`/`speed`) for **text behind them**: render `<Shot clip="master-v4" at=…/>`, then your
  text, then `<Matte at=… />` on top.
- Kit: `src/kit` (Glass/glassStyle "liquid glass", KineticText, Burst, Sparkles, PulseRings, Glow, Bokeh, fonts: `fontInter`
  (400-800) and `fontMono` (JetBrains Mono 500/700)). Easing presets in `src/lib/motion.ts`. Three.js is installed
  (`@remotion/three` ThreeCanvas, `@react-three/fiber`, `three`) — 3D must be **frame-driven** (no useFrame clocks).
  `@remotion/google-fonts` is installed if you want ONE display face for big titles (e.g. Anton or Bebas Neue) — Inter 800
  with tight tracking (-0.04em) is the default and matches their series.

## Editing rules (non-negotiable)
1. **Cuts land exactly on a beat or an 808 hit frame** from beats.ts. Strong moments on downbeats / big hits. Pace grows:
   1 cut per 2 beats → 1 per beat → half-beats in the strobe parts. Never a cut that floats off the grid.
2. **Lip-sync.** When one of their lines plays, any shot where we see them TALK must be the matching source:
   lines A-G → `<Shot clip="master-v4" at={line.srcIn + (frame - line.from)/60} />` (i.e. a Sequence starting at line.from with
   `at={line.srcIn}`); lines H and L40 → `clip="card-zones"` the same way. Cutaways (screens, data, text, their other footage)
   are welcome DURING lines, but keep their lip-synced face on screen for at least ~40 % of each line, and **never show another
   clip of them with moving lips while a line plays** (it reads as out of sync). Other face clips (f01-f26) go in music-only
   gaps, or as 2-6 frame strobe flashes, or slowed to speed ≤ 0.35 / frozen (then they read as "not talking").
3. **Text**: French, few words, trailer cards. Big: Inter 800 uppercase, tight tracking; small: JetBrains Mono caps with wide
   letter-spacing (0.3-0.5em). Words land on beats or on the spoken word frame. Hold ≥ 30 frames unless it's a strobe flash.
   Safe area for anything that must be read: x 90-990, y 220-1540 (Instagram UI covers the bottom ~380 px and top ~200 px).
   No full subtitles — only key words of their lines as kinetic type (e.g. « TOI. », « PLUS TARD », « JAMAIS. »).
4. **Look**: background `L.ink` (#03060d), cold grades (`GRADE.cold/night/mono`), accents used sparingly: `L.blood` (danger,
   the old world, "plus tard"), `L.violet` (AI), `L.acid` (action, "go"). Liquid glass for panels/cards (their series' signature).
5. **TrailerFX already adds** grain, vignette, letterbox (on the drop-outs), the white flash on big hits and an edge chroma
   fringe. Don't add your own global grain/vignette/letterbox. Local effects (glitch slices, RGB split on a shot, light
   sweeps, shockwaves, particles, flash on your own cut) are yours.
6. **No audio in components.** Instead write sound cues to `src/data/cues/<yourpart>.json`:
   `[{ "f": <GLOBAL frame of the visual event>, "sfx": "<name>", "gain": 0.0-1.0, "note": "why" }]`.
   SFX names: `braam`, `subdrop`, `metalhit`, `heartbeat`, `reverse` (its peak lands ON f: give f = the hit it sucks into),
   `drone`, `glitch`, `whoosh`, `titleslam`, `powerdown` (ElevenLabs, dark trailer set), and the kit: `camera-shutter`,
   `ui-click`, `ui-pop`, `typing`, `keypad`, `zoom-swish`, `riser`, `metallic-riser`, `impact`, `sub-impact`, `glitch-1..3`,
   `whoosh-cinematic`, `whoosh-short`. The director owns the mix and keeps SFX under their voice; cue the visual events, don't
   over-cue (the song already hits hard — cue the special moments, not every cut).
7. Determinism: no Math.random/Date; animate only from frames. No CSS animations/transitions.
8. Performance (the user's laptop renders this): ≤ 4 video elements visible at once, 3D scenes light, no huge blurs on
   full-frame layers every frame (filter blur ≤ 20 px on big layers).
9. Taste: premium and readable beats busy. Black frames and silence are tools. Each section must have ONE signature moment.

## How you work
Build → type-check → stills at every cut, every text landing, every line start/end and the signature moment → look at
them (contact sheets) → fix → repeat until it looks like a pro trailer. Then reply with: what you built (per beat range),
the frame list of every cut, the cue list, which stills you reviewed, and anything you could not solve.
