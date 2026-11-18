# « DevOps en 45 secondes » — reusable ARCHETYPE scenes. Rules for every builder agent.

## What this is
The page **Your Page** (@your_page) posts one **45 s French DevOps lesson per day**,
produced automatically (n8n → Claude). Every episode must look like the approved brand intro
(`/home/you/reels/output/brand-intro/final.mp4`, source in `/home/you/reels/output/brand-intro/project/video/src/scenes/s1…s6`).
Each episode is a list of scenes; each scene has a TYPE (archetype) and DATA written by a producer from that day's brief.
You build archetype components that turn `{type, data, spoken words}` into a premium, word-synced, never-static scene —
for ANY topic (Linux, AWS, monitoring, Kubernetes, CI/CD, Terraform, security…), with no hand-tuning per episode.
This is the hard part: **variable content**. Labels can be 3 or 30 characters, lists 2–5 items, commands short or long.
Measure text (`fitText` / `measureText` from `@remotion/layout-utils`, already installed) and scale/wrap instead of
assuming lengths. Never overflow, never collide with the captions band, never leave a frame static.

## Brand (non-negotiable — `src/lib/look.ts`)
- Teal & orange: electric cyan `B.cyan #22D3EE` builds the world (UI, rims, lines, light); warm amber `B.amber #F59E0B`
  is the SIGNAL — every « 45 », the `$` prompt, cursors, the one key highlight per scene, the Abonne-toi pill. Never big
  amber fills. `B.ok #34D399` only for healthy/fixed states. Deep ink background with a blue depth gradient (`B.bg`), light
  behind glass. NO RED alarms, no "service down" horror: warnings are amber, the tone is confident and warm.
- Glass cards: `glass()` in look.ts. Fonts: `fontInter` 800 titles (tracking −0.03…−0.05em), `fontMono` (JetBrains Mono) for
  code/commands. Icons: `src/kit/Icon.tsx` + `kit/phosphor.ts` (Phosphor names like "Plugs", "Shield", "Database").
- No logos / trademarks (no Docker whale, k8s wheel, AWS smile, Tux, Instagram UI). Tool names are plain text. Faceless.
- French typography: real accents, narrow no-break space before « ? ! : » (`\u202f`).

## Layout (1080x1920)
- Safe area: important content ≥ 220 px from top, ≤ y 1580 at the bottom, ≥ 60 px from the left, ≥ 60 px from the right
  above y 1000 and **≥ 140 px from the right below y 1000** (Instagram's icon column). `SAFE` in look.ts.
- The series HUD (small ring timer, top-left, y 70–200) belongs to the signature agent — keep y < 220 free.
- **Captions** (global, `components/Captions.tsx`) occupy y 1300–1540 while words are spoken (all types except
  `title` and `cta`). Put your hero visual in y 240–1270 for captioned types.

## Project + tools
- Remotion 4.0.535 project: `/home/you/reels/_devops45-dev/video` (WSL). Edit with Read/Write/Edit through
  `\\wsl.localhost\Ubuntu\home\mesaid\reels\_devops45-dev\video\...`.
- Shell: write a .sh file and run `MSYS_NO_PATHCONV=1 wsl.exe bash /path/to/file.sh` — wsl.exe mangles `$` inside inline
  `bash -lc "…"`. Put your .sh helpers in `/home/you/reels/_devops45-dev/qa/<your-name>/`.
- Type-check: `cd /home/you/reels/_devops45-dev/video && source ~/.nvm/nvm.sh && nvm use 24 && npx tsc --noEmit -p .`
  (other agents edit other folders at the same time; if tsc fails in THEIR folder, ignore it, fix only yours).
- Stills (GLOBAL frames, half scale, GPU, shared render lock — fine to run while others do):
  `/home/you/reels/_devops45-dev/video/stills.sh Part-<sceneId> <frame> <frame> …` → `…/_devops45-dev/qa/stills/Part-<id>-<f>.jpg`.
  Part comps include the HUD + captions so you SEE overlaps. Build contact sheets with python3 + PIL
  (`~/.venvs/audio/bin/python` has PIL? if not use `python3 -m pip`-free approach: ffmpeg `tile` filter) and copy them to
  `/mnt/c/Users/YOU/AppData/Local/Temp/claude/C--Users-myourname-ext-Desktop-reel-project/69e47e80-6628-42aa-9af8-e621f1e4aaa6/scratchpad/arch/`
  so you can Read them (Windows path `C:\Users\YOU\AppData\Local\Temp\claude\C--Users-myourname-ext-Desktop-reel-project\69e47e80-6628-42aa-9af8-e621f1e4aaa6\scratchpad\arch\`).
- **Never render video, never start the Studio, never run `npx remotion render` yourself.**
- You own ONLY the folders listed in your task. Everything else is read-only (archetypes/index.ts already imports your
  stub `export const <Name>: Archetype` from `src/archetypes/<type>/index.tsx` — keep that export name).

## Data + timing contract (read these files first)
- `src/data/episode.ts` — `SCENES: SceneSpec[] = {id, type, from, to, phrases, captions, data}` (GENERATED from
  `/home/you/reels/_devops45-dev/episode.json`, the dev fixture — read it to see your scenes' data). `EPISODE` meta, `KEY`.
- `src/data/voice.ts` — the MASTER CLOCK: phrases with per-word frames `{w, f, fe}` (GLOBAL 60 fps). In the fixture the
  timings are synthetic (2.7 words/s) — real episodes use the ElevenLabs voice, so never hard-code frames.
- `src/lib/episode.ts` — `onWord(spec, "word")`, `beatFor(spec, item, i, n)`, `beatsFor(spec, items)`, `speechSpan(spec)`:
  every visual beat lands on a spoken word (`data.items[i].on`), fallback = spread over the speech. USE THESE.
- `src/lib/sync.ts` — `useGlobalFrame()` (inside a Sequence `useCurrentFrame()` is LOCAL = global − spec.from),
  `beatPulse/barPulse/hitPulse/sub(f)` (music grid, data/beats.ts), `rand(seed)`.
- Component signature: `export const Terminal: Archetype = ({ spec }) => …` where `spec.data` is your type's data.
  Be defensive: missing optional fields must not crash; unknown icon → a sensible default icon.
- Kit (`src/kit`): Glass, KineticText, Burst, Sparkles, PulseRings, Glow, Bokeh, Backgrounds, Clock, Phone, Live, Icon,
  Effects; `src/lib/motion.ts` easings (house ease `bezier(0.16,1,0.3,1)`), `lib/transitions.tsx`. Three.js available
  (`@remotion/three`), frame-driven only, keep it light.
- **Quality bar = the brand intro scenes.** Study `/home/you/reels/output/brand-intro/project/video/src/scenes/`
  (s1 tab pile/world, s2 PromiseCard + RingTimer, s3 GlassTitle 3D glass title, s4 cards/terminal/kubectl/p95 chart/finale,
  s5 struck-through wall, s6 CTA + RingTimer + Backdrop) and look at its frames: extract stills of the final video with
  ffmpeg (`ffmpeg -ss <s> -i /home/you/reels/output/brand-intro/final.mp4 -frames:v 1 -vf scale=540:-1 out.jpg`).
  COPY code you reuse into your folder (never import across projects or from other archetype folders).

## Motion rules
- Something moves within 0.5 s of the scene start; no static frame > 1.5 s; continuous slow drift / push-in (1→1.04).
- Each beat (item appearing, line typed, check, highlight) lands ON its word (eyes ≈ 2 frames before ears).
- Entrances: house ease, blur 14→0 + rise + scale 0.94→1, staggers 3–5 frames; exits are fast (8 frames) or a hard cut.
- Depth: ≥ 3 planes (light plate / glow → glass subject → foreground bokeh/particles). Beat-reactive glow via `beatPulse`.
- Deterministic: no Math.random / Date / CSS animations. ≤ 3 heavy layers per frame; full-frame blur ≤ 20 px.

## Sound
No audio in components. In your report give the **cue rule** of each archetype (which sound, relative to which beat):
names `whoosh` (peak on f), `basshit` (peak), `glass`, `cards` (start), `tick`, `typing` (start; 2.2 s, trimmed),
`glint`, `check`, `tap`, `suckin` (END on f), `riser` (END on f), `impact`, plus `ui-pop`, `ui-click`, `zoom-swish`.
E.g. « terminal: typing at command start, ui-click on Enter, ui-pop on each output line (gain 0.2) ». Sparse, never on top
of a word you want heard.

## Process + report
Build → tsc → stills at scene start, every beat, mid-scene and last frame → contact sheet → Read it → fix → repeat until it
looks premium on a phone (would the user post it?). Then report: files, the data schema you support (every field,
required/optional, limits), the cue rules, how you handle long/short content, stills reviewed (paths), open issues.
