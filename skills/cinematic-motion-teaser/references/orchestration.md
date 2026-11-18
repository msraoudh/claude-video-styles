# Orchestration — you direct, subagents build

The user's words: "as usual delegate it to subagents". "work on video by video !!! not 2 format at the same time".

## Roles
- **Director (you):**
  - brief, style bible, VO, timeline, shot list, kit review
  - assembling `Teaser.tsx`, transitions, captions, SoundDesign
  - final render + master + delivery
  - reviewing every agent's stills
  - talking to the user
- **Agents (one job each, run in parallel):**
  1. **Product brief agent:** reads the repo read-only and writes `brief/product-brief.md` (screens with exact copy/layout, brand tokens, motion file, never-show list, demo data).
  2. **Capture agent:** real screens + flow videos via `scripts/capture/` (Playwright + mock API). Writes `screens/INDEX.md`.
  3. **Kit agent:** re-skins `src/kit` (theme, fonts) and rebuilds the product's screens as components (`Screens.tsx`), checked against the captures. Renders a showcase sheet.
  4. **Asset agent:** portraits and plates via Kie AI (`scripts/gen/kie_image.py`), cropped to `-sq.jpg` + full sizes (`scripts/gen/finalize.py`).
  5. **Sound agent:** SFX library (or reuse the bundled 13), music candidates + LIST.md.
  6. **Scene agents:** one per scene, or one per two light scenes. NearMatch used about 7 agents for 9 scenes.
  7. **QA/polish agents:** after assembly, pairs of scenes per agent for the second format.

## The shared rules file (`brief/agent-common.md`)
Every scene agent's prompt says "read `brief/agent-common.md` fully first". Write it from this template; the real one is `examples/nearmatch/brief/agent-common.md`.

```markdown
# Common instructions for every <Product> scene agent (read fully)
You are a senior motion designer and Remotion engineer building part of a premium <N>-second teaser for <Product>.
- Project: Remotion 4.x at <abs>/video (React 19 + TS, 60 fps). ONE code base renders 1080×1920 and 1920×1080.
- Quality bar: the @itsbahahaouas "edited by Claude" reels — premium, kinetic, glassy, never static, Apple-keynote polish.
## Read, in order
1. brief/scenes.md — your section(s) (LOCAL frames; word timings via wordAt(sceneId, i) from src/data/timeline.ts)
2. brief/creative-direction.md — style bible; §7 brand rules override everything
3. ~/.claude/skills/remotion-best-practices/SKILL.md → ~/.claude/skills/remotion-markup/SKILL.md + its topic files in that folder (3d.md, images.md, motion-blur.md, text-highlights.md, measuring-text.md…)
4. The kit: src/kit/index.ts and the files you use; usage examples in KitShowcase/KitScreens; look renders in qa/kit/
5. Ground truth: screens/ (INDEX.md) — extract frames from screens/video/*.mp4 with ffmpeg and LOOK. Use the demo data, not the captures' mock data.
6. brief/product-brief.md (screens, brand, never-show list)
## Rules
- File ownership: ONLY src/scenes/<Name>.tsx + src/scenes/<sceneid>/*. Never edit kit/lib/data/components/Teaser/Root or other scenes; work around kit bugs locally and report them.
- Exports: `export const <Name>Scene: React.FC` and `export const SFX_CUES: Cue[]` (LOCAL frames; sfx names = files in public/audio/sfx). Director already places riser + transition whooshes.
- Both formats from one component: useLayout() → portrait, u; scale every px by u.
- Keep the caption band clear in captioned scenes (portrait y 64–76%, landscape 80–92%).
- Assets: check with getStaticFiles(); fall back gracefully (other agents may still be generating them).
- Deterministic only. `npx tsc --noEmit` must pass.
- Alive at EVERY frame 0..durationInFrames, including both transition halves.
## QA (required)
- Render stills at the key frames listed in your task into qa/<id>/ and LOOK at every one (downscale with PIL first).
- Iterate until premium: hierarchy, nothing clipped, UI looks like the real app, beats land on the words.
- Motion check: short low-res clip (≤150 frames, --scale=0.5), extract frames, look.
## MACHINE SAFETY (the user's PC is a WSL laptop that must NOT crash)
- NEVER call npx remotion still/render directly — ALWAYS <skill>/scripts/render-safe.sh (lock + RAM floor + concurrency cap). Absolute output paths.
- Never start remotion studio; avoid parallel tsc; keep test clips short and scaled.
## Hooks
A GateGuard "Fact-Forcing Gate" blocks the first Bash command and each new file: state the request/what the command does (or importers, API, data schema) + the user's verbatim instruction, then retry. For destructive commands also list affected files + a rollback.
## The user's instructions (verbatim)
- "<quote the user's original request>"
## Report
Beat-by-beat summary · QA still paths · SFX cues · kit issues worked around · what the director must wire (e.g. IRIS_ORIGIN).
## ⚠️ CURRENT PHASE: <9:16 ONLY | 16:9 ONLY, 9:16 FROZEN>
<phase rules — see below>
```

## Phases (append to agent-common.md as you go)
- **Phase 1: 9:16 only.**
  - QA and polish only `<id>-9x16`.
  - Keep the landscape branches compiling but don't spend time on them.
- **Phase 2: 16:9 only, 9:16 FROZEN.**
  - Only change what renders in landscape, inside `portrait ? A : B` / `if (!portrait)` guards.
  - Never change shared timings, beats, SFX_CUES, copy or shared helpers. Add a landscape variant instead.
  - Use the 16:9 plates (`venue-wide.jpg`).
  - At the end, render ONE portrait still at a touched frame and compare it with the approved still (`scripts/qa/cmp.py`, tolerance ±1 for WebGL).
- When a session crashes mid-work, add: "files saved by previous agents are on disk — READ AND CONTINUE from them".

## Scene agent prompt (per scene)
```
You own scene <n> `<id>` (<File>.tsx). Read /abs/brief/agent-common.md fully, then your section in
brief/scenes.md. Key frames to QA (local): <list, e.g. 0, 40, 100, 128, 180, durationInFrames-1>.
Render them with render-safe.sh into qa/<id>/<fmt>-f<N>.png, look, iterate until premium.
Report as described in agent-common.md.
```

## Director's review loop
1. When an agent reports, open its QA stills. Build a contact sheet with `scripts/qa/sheet.py` and look.
2. Send fixes back to the same agent (SendMessage) instead of starting a new one.
3. After assembly, render stills at every cut −6/0/+6 for both transitions and captions, all in one sheet.
4. Show the user the first finished format straight away and ask them to look.

## Context hygiene
- Keep `progress/RESUME.md` current: status, the next steps, paths, and what is frozen.
- Keep a project `CLAUDE.md` with the layout and rules.
- Before compacting, write the state down, then compact with a one-line summary of where things stand.
