---
name: cinematic-motion-teaser
description: Make premium "edited by Claude" cinematic motion videos — app/product teasers, launch trailers, promo reels, ads, brand intros — in Remotion at 60 fps, 9:16 and 16:9 from one code base, at the quality of the NearMatch teaser. Kinetic word-synced type, the real product UI rebuilt and "used" on a 3D phone, glass layers, light-streak / whip / iris transitions, word-by-word captions, a voiceover that drives every cut, curated free SFX + music beds, mastered audio, subagent scene production, crash-safe rendering on WSL. Use this skill WHENEVER the user wants a cinematic / motion / promo / teaser / launch / trailer / ad video of anything (an app, a website, a product, a project, an event, a course), says "like the NearMatch video", "like @itsbahahaouas", "edited by Claude style", "same quality", or asks for motion graphics with voiceover and music. (For the talking-head tech-explainer reel series use cinematic-reel-builder instead; for a hype/aura trailer about a person, cut on a song's bass from their own reels and voice, use aura-trailer; for a « DevOps en 45 secondes » episode of @your_page use devops45-reel.)
---

# Cinematic Motion Teaser

You are the **director**. This skill is everything learned making the NearMatch 45 s teaser
(approved by the user: "loved the video!"). It tells you what to do, in what order, where every
reference lives, the exact numbers that made it look premium, and how this user likes to work.
The finished production — full source, briefs, shot list, sound — is in `examples/nearmatch/`.
Open it whenever you need to see how something was really done; it is the quality bar.

## Read first (what's where)

| Need | File |
|---|---|
| The look we are copying, decoded (reels by @itsbahahaouas) | `references/reel-analysis.md` |
| The style bible template — fill one per product, agents read it | `references/creative-direction-template.md` |
| Motion vocabulary, exact easings/springs/timings, transitions, scene recipes | `references/motion-language.md` |
| SFX library + music sourcing + ducking + mastering | `references/sound-design.md` |
| Script, ElevenLabs voice, re-pacing, word timings → master clock | `references/voiceover-and-timeline.md` |
| How to run subagents (one per scene), prompts, phases, file ownership | `references/orchestration.md` |
| Real product screens, Kie AI images, fonts, plates, portraits | `references/assets.md` |
| QA loop, safe rendering on WSL, final render + master + delivery | `references/render-qa-delivery.md` |
| This user's preferences + the mistakes not to repeat | `references/lessons-and-preferences.md` |
| Every URL and licence (reels, SFX, music, models, docs) | `references/sources.md` |

Code you **copy, don't rewrite**:
- `templates/remotion-starter/` — a working project (it renders both formats).
  - The master-clock wiring, TransitionSeries assembly, the 5 house transitions, global captions and SoundDesign.
  - The motion kit: Phone, Glass, KineticText, NumberRoll, Effects, Backgrounds.
  - The 13 SFX, the fonts, and 3 demo scenes.
- `examples/nearmatch/video/src/` — 9 real scenes plus a full rebuilt app UI kit. Steal patterns from it:
  - Three.js feed tunnel
  - swipe deck
  - match celebration
  - code typing
  - particle dissolve
  - end-card lockup
- `scripts/` — the small helpers we actually needed:
  - `vo_repace.py`, `vo_to_timeline.py`
  - `render-safe.sh`, `watchdog.sh`
  - `audio/master.sh`, `audio/make_bed.sh`, `audio/mix.sh`
  - `qa/sheet.py`, `qa/cmp.py`
  - `gen/kie_image.py`
  - `capture/` (Playwright + mock API screen capture)

Also load the installed Remotion skill `remotion-best-practices` for API rules. Its rules are law:
- frame-driven only
- `premountFor`
- `staticFile`
- `<Img>`
- `ThreeCanvas`

## The non-negotiables (and why)

1. **The voiceover is the master clock.** Every cut, caption and beat comes from word timestamps (`timeline.ts`). A word that appears on screen lands within ±3 frames of being spoken. That sync is most of what reads as "edited by a pro".
2. **Never static.** Something new happens every 0.6–1.5 s, and everything else keeps drifting (sine float 4–8u, slow push-in 1→1.06). A frozen frame looks like a template.
3. **Show the real product, used.** Capture the real app's screens, rebuild them as React components, then animate a finger using them: taps, swipes, typing, toggles. Pasted screenshots look cheap; rebuilt UI looks like Apple.
4. **One code base, both formats.** `const {portrait, u} = useLayout()`, `u = min(w,h)/1080`, and every px × u. Portrait stacks; landscape goes side by side. Never write two scenes.
5. **Brand rules beat style.** Each product's style bible gets a "brand system" section that overrides everything. That covers colour roles, logo do/don'ts and never-show lists. NearMatch's rules: no map, no match %, never recolour, rotate or glow the logo, never write "N minutes".
6. **Look at every frame you ship.** Render stills, read them, fix, repeat. Agents must QA their own scenes at key frames in the format being worked on.
7. **The user's PC must not crash.** It's a WSL laptop with a 6 GB GPU. Run one render at a time through `scripts/render-safe.sh`, with a RAM watchdog during long renders.
8. **Deterministic.** Use `random(seed)` and `@remotion/noise`; never `Math.random`, `Date`, or CSS animations/transitions.

## The pipeline

Work top to bottom. Show the user something early and often; they like to see progress.

**Framework:** this skill is the proven Remotion path. If the user hasn't picked a framework, say in one line that you'll use this (the NearMatch pipeline) and that HyperFrames is the alternative. Their memory says to offer the choice, not assume it. For a NearMatch-quality teaser, recommend this one.

**Running the scripts:** they run from the skill folder (`~/.claude/skills/cinematic-motion-teaser/scripts/…`); there's no need to copy them. Pass absolute paths. Audio scripts take `DUR=<video seconds>` (default 45).

**0. Intake** (keep it short; this user dislikes question floods)
- Find out:
  - what the video is about (product repo/URL)
  - length (default 45 s)
  - formats (default 9:16 + 16:9, 60 fps)
  - VO language and voice
  - tagline / CTA
- Read the product repo **read-only**. Never open `.env`/secrets.
- Decide whatever has a sensible default and say so.

**1. Reference** (if they show a reel/video): read `references/reel-analysis.md`.
- Download with `yt-dlp` and extract frames.
- Transcribe with Whisper.
- Write down structure, motion vocabulary and tools.

**2. Product brief + real screens.** Have an agent write `brief/product-brief.md`:
- every screen, its exact copy and layout
- brand tokens
- the never-show list
- demo data

Capture the real UI with `scripts/capture/` (see `references/assets.md`).

**3. Creative direction system.** Fill `references/creative-direction-template.md` into `brief/creative-direction.md`. This is the "نظام التوجيه الإبداعي" the reel's author pastes into Claude. It is the reusable style bible every agent reads.

**4. Script + voiceover.** Script rules: one idea per line, a hook claim in the first 1.5 s, and the logo as the payoff at the END.
- Length: about 2.6 spoken words/s minus the end card. 45 s → ~110–120 words; 30 s → ~65–75; 15 s → ~30.
- Each scene's first word goes into `video/src/data/scenes.json`, which feeds the timeline script.
- Generate the voice: ElevenLabs if credits allow, else ask the user.
- Get word timings, then re-pace with `vo_repace.py`.
- Build the master clock: `vo_to_timeline.py` → `src/data/timeline.ts` + `captions.json`.

See `references/voiceover-and-timeline.md`.

**5. Shot list.** Write `brief/scenes.md`: one scene per VO line, using LOCAL frames. For each scene give:
- words with frames
- mood
- hero visual
- action beats on words
- the layout for each format
- transitions in/out
- SFX cues

Use the NearMatch one as the model (`examples/nearmatch/brief/scenes.md`).

**6. Scaffold + kit.**
- Copy `templates/remotion-starter/` → `<project>/video/` and `npm i`. It type-checks and renders as shipped (demo product "Lumen").
- Re-skin `src/kit/theme.ts` and `fonts.ts` with the brand.
  - Keep the key NAMES and change the values: `C.rose` = the brand's live/accent colour, `C.green` = success/presence, `C.violet` = the end-card streak accent, `C.night`/`C.bg` = backgrounds.
  - `Teaser.tsx`, the demo scenes and Captions use those names. Rewrite the NearMatch comments in theme.ts for the new brand.
- `irisFrom` in `Teaser.tsx` uses a fixed point. Change it to the tapped element's centre: export `IRIS_ORIGIN = {portrait:{x,y}, landscape:{x,y}}` (frame fractions) from that scene and import it, as `examples/nearmatch/video/src/Teaser.tsx` does with the deck's like button.
- Rebuild the product's key screens as kit components (`Screens.tsx`), checking them against the captures.
  - **Web app / website:** there is no browser frame in the kit. Build a `BrowserWindow` (glass title bar, 3 traffic-light dots, URL pill, 14u radius) or a laptop frame, and design screens at 1440×900 points scaled like `Phone` does.
- Add a `KitShowcase` composition (pattern: `examples/nearmatch/video/src/kit/KitShowcase.tsx` + `KitScreens.tsx`). Render a sheet and look at it before any scene work.

**7. Assets.** People and plates come from **Kie AI** (`scripts/gen/kie_image.py`); the user requires Kie AI for all image generation. Portraits are fictional people; tell the user they are AI-generated. Brand SVGs come from the repo.

**8. Scenes by subagents.** Use one agent per scene (or two light scenes). They all read `brief/agent-common.md` (template in `references/orchestration.md`) and own only their files. Run them in parallel; renders are serialised by the lock. **Work one format at a time:** 9:16 first, show it, then 16:9.

**9. Assemble.**
- `Teaser.tsx` puts each scene on a TransitionSeries; transitions are centred on the cuts.
- Add global captions and the VO.
- Add `SoundDesign`: riser, whooshes on cuts, per-scene SFX_CUES and the ducked music bed.
- Render a still at every cut ±6 frames into one contact sheet and look at it.

**10. Sound.** Get SFX and music from free sources. Give the user a **numbered list of music candidates** to choose from. Duck the music under the voice, then master. See `references/sound-design.md`.

**11. Render, master, deliver.**
- Render `Teaser-9x16` at h264 crf 16, then master it to −14 LUFS / ≤ −2 dBTP with `scripts/audio/master.sh`.
- Sample frames for QA.
- Open the out folder in Windows Explorer so they see the full-quality file. Never send compressed copies.
- Tell them as soon as one format is ready.

**12. Freeze.** Once the user approves a format, it is frozen. Later changes go only into the format they name, behind `portrait ? A : B` guards. Prove the other format is unchanged with `qa/cmp.py`.

## Numbers that made it premium (60 fps)

- **House ease** `bezier(0.16,1,0.3,1)` (expo-out settle). In-out `(0.65,0,0.35,1)`.
- **Springs** (damping / stiffness / mass):
  - word 18/140/0.9
  - pop 14/160/0.8
  - soft 20/110/1
- **Kinetic word in:**
  - blur 14u→0, rise 40u→0, scale 0.92→1, opacity
  - stagger 3–4 frames, or each word on its own spoken frame
  - out = blur 0→16u + fade over 8 frames
- **Transitions** last 14–24 frames, centred on the cut. The cut sits at the midpoint of the silence between lines. Never a plain crossfade by default.
- **Type** at u=1:
  - hero 120–220
  - secondary 84
  - support 44
  - captions 60 (portrait) / 50 (landscape)
  - tracking −3%, line-height 1.0–1.08
- **Safe areas:**
  - portrait: sides 90u, top 220u, bottom 380u
  - landscape: 100u all round
  - caption band: portrait y 64–76%, landscape y 80–92%
- **Camera:**
  - continuous push 1→1.06
  - punch-in 1→1.15 on the key beat
  - phone tilt keeps turning (e.g. −22°→−8°)
- **Depth:** at least 3 planes (glow plate → subject → foreground bokeh blur 8–26u).
- **Audio:**
  - SFX peak on the cut (whoosh lead 12f, whip 8f)
  - music 0.17 under the voice / 0.36 between lines (calm) or 0.33/0.67 (present), 10-frame ramp
  - master −14 LUFS integrated, limiter 0.7, true peak ≤ −2 dBTP

## Working style this user expects

Full list with reasons: `references/lessons-and-preferences.md`.

- **Delegate to subagents** ("as usual delegate it to subagents"). You direct, review and assemble.
- **One video at a time**: "work on video by video !!! not 2 format at the same time". Say when the first format is ready: "if you finish 16:9 or 9:16 one before the other tell me i take a look".
- **Free online sources** for music and SFX ("there are so many sites that can provide that !!! for free !"). Use **Kie AI** for every image ("for image generation always use kie ai always").
- **Music:** give a numbered list first; they pick and say *replace* or *on top*.
- **Delivery:** full quality only. "no dont make lighter ... put it in folder so i see it" → `explorer.exe "$(wslpath -w <out dir>)"`.
- **Honesty:** you can't hear audio, so say so and rank music from measurements. Report failures plainly.
- **Machine:** "try to not crash the pc … it is wsl". Use the render lock, the RAM floor and the watchdog.
