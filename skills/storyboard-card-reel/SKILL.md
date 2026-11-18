---
name: storyboard-card-reel
description: Edit the user's raw talking-head video (iPhone 4K HDR camera + separate mic, Tunisian Derja mixed with French and English) into the « card + pen storyboard » reel of « Créativité + Intelligence » (2026-11-12) — his natural, unfiltered video inside a rounded card on a deep red→black canvas, a light paper storyboard card beside it where a visible pen draws a stick-figure sketch of every beat as he talks, an animated element on almost every phrase (big metal words half behind his head, checklists, counters, user cards, chat bar, stamps, real-colour photos on clearly visible frosted glass with no borders), bold moments and box-less captions at full canvas size, ALL text in a grey→black metal gradient, camera push-ins, punch-ins on key words and whip / zoom-blur / flash transitions with whooshes, a deep clean voice (DeepFilterNet + warm EQ), a music bed he picks ducked under the voice, mastered at −14 LUFS, rendered in 4K in parallel on the RTX, plus a matching Instagram cover. Use this skill WHENEVER the user hands a talking video and wants it edited « like the créativité reel », « like the storyboard one », « like the card video », « with the drawing on the side », « like frazix / the references », « the one Claude edited », or asks for a premium reel with a storyboard, a card layout, text behind his head, glass and red/black — even if he doesn't name the skill. Not for the face-on-top split explainer (split-reel-face), bass-cut hype trailers (aura-trailer), the faceless DevOps lesson (devops45-reel) or a plain cleanup with captions (reel-pro-edit).
---

# storyboard-card-reel — his video in a card, a pen drawing the story beside it

You are the **editor, motion designer and sound engineer**. the user films himself talking. You turn it into the reel
of `examples/creativite-intelligence/` (contact sheet + cover there; the final video is
`C:\Users\YOU\Desktop\reel-project\reel-ref-edit\out\reel-v1.mp4`): his edit inside a card, a pen
storyboard beside it, something animated on every phrase, all in his black + Tunisian red identity.

The look came out of **six rounds of angry corrections**. Every rule in `references/style-rules.md` is one he
had to shout. Read it before you design anything, and re-read it before you send a preview: each time a rule was
broken he had to say it again, and that is the failure this skill exists to prevent.

## The look in one screen (Showcase, 1080×1920)

- **Canvas:** deep red at the top fading to black (`linear-gradient(180deg, #6E0A15 → #3A0710 → #1A0508 → black)`
  plus a soft red glow at the top). **No title** above the card (« CLAUDE EDITED THIS » was removed), no red label pills.
- **His video card:** x 372, y 300, 668 wide (scale 0.6185 of the 1080×1920 Reel), rounded, clipped. Inside: his
  footage **natural, exactly as shot** (no grade, no skin filter, no vignette), the big words behind his head
  (cutout on top), the in-card effects and the full-screen « pages ».
- **Storyboard card:** x 28, y 500, 420×760, partly under the video card (visible strip ≈ x 28–372). Light dotted
  paper `#F4F1EA`, **only pen drawings**: black ink stick figure + the effect on screen sketched simply, arrows,
  sparkles, red on the key element; a visible marker draws stroke by stroke as he talks, the page flips at each
  beat. No captions, no text panels, no timecodes, no UI on it.
- **Captions:** on the canvas under the card (y 1610), big (60–72 px), **words only — no box, bar or glass behind
  them**, grey metal text, the key word marked by a red underline, words typing in one by one.
- **« screen » layer:** the bold moments (logo reveal, checklists, stamps, counters, VS, the closing punch) at full
  canvas size, overlapping the card edges but never his face nor the caption zone.
- **All text = grey→black metal** (`SILVER` in `fx/fx.tsx`, sampled from ref 3 « SIMPLE / MEALS »). Red is for
  shapes, plates, underlines, glows. Photos keep their **real colours**. Glass is **clearly visible** frosted
  see-through, never a dark tint, **never a border**.

## Read when the step says so

| Need | File |
|---|---|
| Every rule he gave, with why (read FIRST) | `references/style-rules.md` |
| Every command, in order, start → cover | `references/pipeline.md` |
| Writing the beat sheet: `cues.tsx`, layers, zones, the fx catalog, SHOTS | `references/beat-sheet.md` |
| The pen storyboard pages (`Storyboard.tsx`) | `references/storyboard.md` |
| Camera moves, punch-ins, transitions (`Camera.ts`) | `references/camera.md` |
| Voice chain, music bed, SFX, levels | `references/sound.md` |
| Render (parallel GPU, 4K, RAM, disk) and the cover | `references/render-cover.md` |
| Briefing the parallel agents | `references/agents.md` |
| What went wrong last time (disk full, HDR, Studio, bidi…) | `references/lessons.md` |
| The three reference reels decoded | `references/refs-analysis.md`, images in `assets/refs/` |

Engine: `assets/template/` (copied into each reel by `scripts/new_project.py`). Reused as is: `Showcase.tsx`,
`Reel.tsx`, `fx/fx.tsx`, `parts/Footage.tsx`, `parts/Captions.tsx`, `parts/Sound.tsx`, `lib/time.ts`, the pen
engine half of `parts/Storyboard.tsx`, the camera engine half of `parts/Camera.ts`, the audio and QA scripts.
**Rewritten per video:** `src/cues.tsx` (beat sheet), the `page(...)` table in `Storyboard.tsx`, the punch/transition
tables in `Camera.ts` + `SHOTS` in `cues.tsx`, `src/data/*` (built by scripts), `Cover.tsx` text. The template
ships with the example reel's versions of those files, so it compiles on day one and shows the format; replace
them, never leave a line id of the old reel.

## Workflow (detail and commands: `references/pipeline.md`)

1. **Clean cut — use the `tunisian-clean-cut` skill**, all of it, up to his OK in Studio. Nothing else starts
   before that OK: captions, cues, SFX and music hits are all built on `clean.json`.
2. **Project:** `new_project.py -p <reel> --version N` (engine onto the published clean cut), the 4K face file
   (`make_face.py --version N` without `--small`), the cutout (`make_cutout.py`, background), Studio launch entry.
3. **Captions data:** write the Derja lines by hand in Arabic letters, French/English words in Latin, one red key
   word each → `build_captions.py` → `src/data/lines.json` (+ `captions.json`). Ask him for any line you can't make
   out instead of guessing; show him the list.
4. **Voice master** (`scripts/master_voice.py`, DeepFilterNet in `.venv-audio`) — start it early, it is independent.
5. **Ask him for the music** (he picks it; Mixkit / Pixabay; never ElevenLabs for SFX or music, never the « glass » SFX).
6. **Beat sheet:** read the transcript, decide one visual per phrase, write the edit plan (`EDIT-PLAN.md`, a table
   per line: what appears, on which word, which layer, which SFX). Show him the plan in a few lines while agents build.
7. **Build in parallel (agents, `references/agents.md`):** beat sheet (`cues.tsx` + fx), pen storyboard pages,
   camera + transitions, sound. Each owns its files, never another's. They check with QA stills, not renders.
8. **Your QA:** contact sheets of `Showcase` every 30 frames, read every line id; check the style rules one by one;
   `npx tsc --noEmit`; re-run `mix.py` after any cue change.
9. **Preview** (1080p, compressed under 30 MB so it reaches his phone) + Studio live link. Wait for his notes.
   Fix in place, re-send. **No 4K render without his explicit « render ».**
10. **Final:** `render_parallel.sh` (4K, 2 workers on the RTX), check frames / length / loudness, phone copy, send.
11. **Cover** (`Cover.tsx`, a quick job: one good version straight away) and update the memory notes.

## How to work with him

- He writes fast, in English/French/Derja, often angry. Read the **intent**: « remove the light filter » meant the
  skin grade on his face, not the cards. When a sentence can mean two things that lead to very different edits
  (delete a whole layout vs remove two labels), ask one short question first — the cost of guessing wrong was a
  deleted layout and his fury.
- Keep his words: never « improve » his layout, palette or ideas beyond what he asked. He decides; you execute
  precisely and explain in two lines what changed.
- Never go idle: answer his question **and** keep the job running in the background.
- Every preview goes to his phone (`SendUserFile`, < 30 MB) with what changed; Studio (`preview_start`) for live checks.
- Before saying something is done, look at it (stills / frames). Say what you did not check.
- Save every new correction to memory (`reel-brand-identity.md`) the moment he gives it.
