# « {{TITLE}} » — trailer about {{SUBJECT}}. Rules every scene agent follows.

<!-- Director: new_trailer.sh copied this to brief/agent-common.md. Fill every {{…}} (the "What this is" part is
     yours: who the subject is, what their content looks like, their slogans, the song, the mood), delete what does
     not apply, keep the rules. Agents read ONLY this file + the data files, so everything they must know goes here.
     The original is examples/no-more-excuses/agent-common.md. -->

## What this is
A {{DURATION}}-second, 9:16, 60 fps **thriller-style trailer about {{SUBJECT}}** ({{HANDLE}}): {{WHO — job, topics,
what their reels look like (set, lights, clothes, mic, glasses…), their recurring formats}}. Their own slogans (from
their captions and transcripts): {{"…", "…"}}.

The edit is **cut on the bass** of {{SONG — artist}}{{, slowed to 0.85}} ({{BPM}} BPM, a beat = {{N}} frames).
Dark, cold, menacing, premium. Think film trailer + phonk/aura edit: hard cuts on 808 hits, punch-ins, speed ramps,
strobe, flash frames, text slamming on beats, black frames, slow-mo on the silences. "Real editing", dark sound effects
and dark animations. All on-screen words in **{{LANGUAGE}}** (tech words may stay English).

Pronouns: the subject's pronouns are not stated — in any prose you write (comments, reports) refer to them by name.

## Project
- Remotion 4.0.535 project: `{{PROJECT}}/video` (WSL). Composition `Trailer` 1080x1920, 60 fps.
- Edit files via the Windows UNC path `\\wsl.localhost\Ubuntu{{PROJECT}}\video\...` with Read/Write/Edit.
- Run shell commands as: `MSYS_NO_PATHCONV=1 wsl.exe bash /home/you/<script>.sh` — **wsl.exe mangles `$` in inline
  `bash -lc "..."` commands**, so put anything with variables/loops into a .sh file and run that file.
- Type-check: `cd {{PROJECT}}/video && source ~/.nvm/nvm.sh && nvm use 24 && npx tsc --noEmit -p .`
- QA stills (GLOBAL frame numbers): `{{PROJECT}}/video/stills.sh Part-<yourpart> <frame> <frame> ...`
  → `{{PROJECT}}/qa/stills/Part-<yourpart>-<frame>.jpg` (half scale). Stills go through a shared render lock, one at a
  time across all agents — **never run `npx remotion render` yourself, never render video, never start the Studio.**
  Make contact sheets with python3 + PIL and copy them to a Windows path you can Read (your scratchpad).
- You may ONLY write inside `video/src/sections/<yourpart>/` (any files) and `video/src/data/cues/<yourpart>.json`.
  Do not edit shared files (Trailer.tsx, Root.tsx, lib/, components/, data/*.ts, kit/). Need a helper? Put it in your
  folder. Export your part's component from `sections/<yourpart>/index.tsx`; the director registers it.

## Data you build on (read these files first)
- `src/data/beats.ts` — `BEATS` (every beat), `DOWNBEATS` (bar starts), `HITS` (808 onsets {f, rise dB, level dB}),
  `BIG_HITS` (the heavy accents), `SUB_ENV` (sub-bass loudness 0..1 per frame), `KEY` (named moments: {{list them with
  what happens there}}). All GLOBAL frames.
- `src/data/voice.ts` — `LINES`: the subject's own voice lines with `from`, `durationInFrames`, `srcIn` (seconds into
  the source), `clip` (its lip-sync clip) and per-word frames `words[{w,f,e}]` (GLOBAL frames). `line("A")`.
- `src/data/sections.ts` — section ranges + `PARTS`. `src/data/footage.ts` — the shot library `CLIPS` (+
  `qa/footage-sheet.jpg` shows a frame of each; descriptions say what's in it). Master plan: `{{PROJECT}}/plan/plan.json`.
- `src/lib/beat.ts` — `useGlobalFrame()` (USE THIS for anything music-synced; useCurrentFrame() is local to your
  Sequence), `beatPulse/hitPulse/strongHitPulse/bigHitPulse(f)`, `sub(f)`, `bassShake(f, px)`,
  `beatsBetween/hitsBetween/snapToBeat`, `rand(seed)` (deterministic). `src/lib/look.ts` — palette `L`, grades `GRADE`.
- `src/components/Shot.tsx` — `<Shot clip="f05" at={sec} speed={1|0.3|0|timeMap} focus="50% 35%" scale punch shake grade>`
  (muted footage with exact time-mapping: slow-mo, freezes, speed ramps via `ramp(...)`); `<Matte clip=… at=…>` = alpha
  cut-out of the subject for **text behind them**: render the Shot, then your text, then the Matte on top (same at/speed).
- `src/components/LipSync.tsx` — `<LipShot line="A" />` plays the line's lip-sync clip in sync wherever you put it
  (`trimStart/trimEnd` frames for cutaways at the edges); `<LipMatte line="A" />` is its cut-out.
- Kit: `src/kit` (Glass/glassStyle "liquid glass", KineticText, Burst, Sparkles, PulseRings, Glow, Bokeh; fonts
  `fontInter` 400-800 and `fontMono` JetBrains Mono 500/700). Easings in `src/lib/motion.ts`. Three.js is installed
  (`@remotion/three` ThreeCanvas, `@react-three/fiber`, `three`) — 3D must be **frame-driven** (no useFrame clocks).
  `@remotion/google-fonts` is there for ONE display face for big titles (Anton / Bebas Neue); Inter 800 with tight
  tracking (-0.04em) is the default.
- The finished « NO MORE EXCUSES » scenes are the quality bar and a source of patterns:
  `~/.claude/skills/aura-trailer/examples/no-more-excuses/sections/` (3D dossier name reveal, glass-shard title, slice
  wall, carousel, cut-out text, CRT end card…). Read before building; copy patterns, not content.

## Editing rules (non-negotiable)
1. **Cuts land exactly on a beat or an 808 hit frame** from beats.ts. Strong moments on downbeats / big hits. Pace grows:
   1 cut per 2 beats → 1 per beat → half-beats in the strobe parts. Never a cut that floats off the grid.
2. **Lip-sync.** When one of their lines plays, any shot where we see them TALK must be that line's `<LipShot>`.
   Cutaways (screens, data, text, other footage) are welcome DURING lines, but keep the lip-synced face on screen for at
   least ~40 % of each line, and **never show another clip of them with moving lips while a line plays** (it reads as out
   of sync). Other face clips go in music-only gaps, as 2-6 frame strobe flashes, or slowed to speed ≤ 0.35 / frozen
   (then they read as "not talking").
3. **Text**: {{LANGUAGE}}, few words, trailer cards. Big: Inter 800 uppercase, tight tracking; small: JetBrains Mono caps
   with wide letter-spacing (0.3-0.5em). Words land on beats or on the spoken word frame. Hold ≥ 30 frames unless it's a
   strobe flash. Safe area for anything that must be read: x 90-990, y 220-1540 (Instagram UI covers the bottom ~380 px
   and top ~200 px; keep x ≤ 940 below y 1000 — the icon column). No full subtitles — only key words of the lines as
   kinetic type.
4. **Look**: background `L.ink` (#03060d), cold grades (`GRADE.cold/night/mono`), accents used sparingly: `L.blood`
   (danger, the old world), `L.violet` (AI/tech), `L.acid` (action, "go"). Liquid glass for panels/cards.
5. **TrailerFX already adds** grain, vignette, letterbox (on the drop-outs), the white flash on big hits and an edge
   chroma fringe. Don't add your own global grain/vignette/letterbox. Local effects (glitch slices, RGB split on a shot,
   light sweeps, shockwaves, particles, flash on your own cut) are yours.
6. **No audio in components.** Write sound cues to `src/data/cues/<yourpart>.json`:
   `[{ "f": <GLOBAL frame of the visual event>, "sfx": "<name>", "gain": 0.0-1.5, "note": "why" }]`.
   Dark set: `braam`, `subdrop`, `metalhit`, `heartbeat`, `reverse` (its peak lands ON f: give f = the hit it sucks into),
   `drone`, `glitch`, `whoosh`, `titleslam`, `titleslam-alt`, `powerdown`. Kit: `camera-shutter`, `ui-click`, `ui-pop`,
   `typing`, `keypad`, `zoom-swish`, `riser`, `metallic-riser`, `impact`, `sub-impact`, `glitch-1..3`,
   `whoosh-cinematic`, `whoosh-short` (+ the rest of audio/sfx-kit). The director owns the mix and keeps SFX under the
   voice; cue the special moments, not every cut — the song already hits hard.
7. Determinism: no Math.random/Date; animate only from frames. No CSS animations/transitions.
8. Performance (a laptop renders this): ≤ 4 video elements visible at once, 3D scenes light, no huge blurs on
   full-frame layers every frame (filter blur ≤ 20 px on big layers).
9. Taste: premium and readable beats busy. Black frames and silence are tools. Each part has ONE signature moment.

## Your part
{{PART ID, its GLOBAL frame range, the sections it covers and what happens in each (from trailer.json), the lines it
carries (ids + frames), the KEY moments inside it, the signature moment you want, shots you suggest from the library,
what the previous part ends on and what the next one starts with.}}

## How you work
Build → type-check → stills at every cut, every text landing, every line start/end and the signature moment → look at
them (contact sheets) → fix → repeat until it looks like a pro trailer. Then reply with: what you built (per beat range),
the frame list of every cut, the cue list, which stills you reviewed, and anything you could not solve.
