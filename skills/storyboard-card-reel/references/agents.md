# Briefing the parallel agents

Run 2–4 agents in parallel only on independent files (his memory note says « one video at a time », not « one agent
at a time »). Each brief is the only context the agent gets: give it the goal in his words, the files it owns and
the ones it must not touch, the style rules that apply, the exact QA command, and what to report.

## Common block (paste into every brief)
- Windows only, never WSL. Project `<reel>/remotion-video/` (Remotion 4, 30 fps). `npx tsc --noEmit` must pass.
- Don't render video, don't start or touch Studio (it runs with hot reload).
- QA with stills only: `COMP=Showcase sh scripts/qa/qa.sh out/qa-<agent> every:30` (own bundle + own TEMP, cleans up;
  give each agent its own `out/qa-<name>` and, if two run QA at once, its own copy of `scripts/qa/` paths — a
  shared temp folder was deleted mid-run once). Never leave Remotion temp in `%TEMP%`: C: filled up (116 GB).
- Style rules (copy the relevant ones from `style-rules.md` verbatim — they are his words).
- Report: what changed per file, contact sheet paths, what is not done, anything another agent must know.

## 1. Beat sheet agent — owns `src/cues.tsx` (except SHOTS), `src/fx/fx.tsx`
Give: `EDIT-PLAN.md`, `references/beat-sheet.md`, `src/data/lines.json`, the zones, the list of bold moments for the
`screen` layer, the big-word lines, the pages, the photos in `public/photos/`. Ask for an animated element on
almost every phrase, entering on its word, SFX on each, and to check every line id on the sheets.
Report also: the SFX count (you re-run the mix).

## 2. Storyboard agent — owns only `src/parts/Storyboard.tsx`
Give: `references/storyboard.md`, `assets/refs/r1_storyboard.png` (+ `ref1_zoom.jpg`), `cues.tsx` to read (what is on
screen per beat). Ask: rewrite only the `page(...)` table (extend the drawing kit if needed), one stroke group per
phrase, only drawings (no captions/UI/text but the big word), check 3 consecutive frames for the pen moving, sheets
of the card every 15 frames. Report what each beat draws.

## 3. Camera agent — owns `src/parts/Camera.ts`, `src/parts/Footage.tsx`, the `SHOTS` block of `cues.tsx`, may edit `src/Reel.tsx` (transition wrapper)
Give: `references/camera.md`, `lines.json` key words, the big-word lines, the pages, the climax. Ask for a move on
every shot, punches on key words, jump-cut reframes, 10–15 transitions, the ramp into the climax, no colour filter
on the footage. Report the plan per line and the transition list with frames.

## 4. Sound — you or an agent; owns `scripts/master_voice.py`, `scripts/mix.py`, `src/parts/Sound.tsx`
Give: `references/sound.md`, the track he chose, the climax line id. Report the measured numbers (LUFS, LU under
voice, capped SFX) and A/B clips.

When agents finish: read their reports (they are claims), look at their sheets yourself, run `tsc`, re-run the mix,
then preview. If one reports something it could not do (permission, disk), surface it to him; never redo a denied
action for it.
