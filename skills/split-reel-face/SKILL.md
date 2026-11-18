---
name: split-reel-face
description: Edit the user's face-cam reel (they talk to the camera, often in Tunisian, French or English — a CapCut export or raw 9:16 file) into a premium explainer where the screen SPLITS — their face on top, an animated stage below showing exactly what they say, step by step — with full-screen graphic moments (their shot shrinking into a card, a full-screen « wow » scene, a reveal), word-by-word captions (Tunisian in Arabic letters with Latin tech words, or French/English), Claude-editorial look (warm dark + coral, glass cards, serif accents), lots of SFX ducked under the voice, a music bed starting where the user wants, 8 scene agents in parallel, Remotion preview in Studio, render only on the user's OK, and an Instagram cover. The proven pipeline of « Kifech na3mel el reels hedhom » (2026-10-21). Use this skill WHENEVER the user hands a talking video and wants it edited « like the split one », « same as the Claude reel », with « motion graphics showing what I say », « animation under me », a tutorial / how-to / « kifech » / « les étapes » / explainer on camera, or says split screen, top/bottom, face on top — even if they don't name the skill. Not for faceless explainers (faceless-explainer), trailers on a song's bass (aura-trailer), the daily DevOps lesson (devops45-reel) or plain silence-cut cleanups with captions (reel-pro-edit).
---

# split-reel-face — face on top, the story animated below

You are the **editor and motion director**. The user films themself explaining something (a workflow, a tool, steps,
a story). You turn it into a reel where every sentence is SHOWN: the layout morphs between full face, split (face panel
on top + animated stage below), full-screen graphics and the user's shot as a card, and each element lands ON the word
that names it. The quality bar is the first reel: `examples/kifech/` (EDIT-PLAN.md, the 9 scenes, project.ts, lines.json)
and the final video `C:\Users\YOU\Desktop\reel-project\reel-claude-workflow\remotion-video\out\reel-v1.mp4`.

## Read first
| Need | File |
|---|---|
| Every command, in order | `references/pipeline.md` |
| `src/data/project.ts`: layout schedule, face position, steps, scenes, cover | `references/project-config.md` |
| Captions in Tunisian (Arabic letters + Latin tech words) / French / English | `references/captions.md` |
| Briefing the reference-analysis, music and 8 scene agents | `references/agents.md` |
| SFX, ducking, the music bed, levels | `references/sound-music.md` |
| What went wrong before (keyframes, Studio lag, bidi, pinned reel…) | `references/lessons.md` |
| How the two reference reels are built (AIS meta-graphics, Claude editorial) | `references/refs-Deg4HQMBJY3.md`, `references/refs-DemwzTPJK6J.md` |

Engine (copied into each project by `scripts/new_project.sh`, never rewritten per video):
`assets/template/src/edit/` — `layout.ts` (modes + morph), `Face.tsx` (the user's shot in the current box, push-in),
`Stage.tsx` (warm-dark world, progress bar, step titles), `Captions.tsx` (word-by-word pills, RTL/LTR), `Sound.tsx`
(voice + music + every scene's SFX, ducked under words), `kit.tsx` (Card, Chip, Title, Spark, Window, ClaudeWindow,
Bubble, Terminal, Cursor, Ring, Wave, Thumb, Stamp, useIn/usePop/enter), `theme.ts`, `time.ts` (`wf(word, sec)`).
Per video you write `src/data/project.ts`, `analysis/lines.json`, `src/edit/music.ts` and the scenes in `src/scenes/`.

## Non-negotiables (and why)
1. **Never render without the user's OK.** Build in Remotion, open Studio, tell them what to check; render only when
   they say « render ». (Their rule.) QA stills with `scripts/qa_stills.sh` are fine.
2. **Show what they say, on the word.** Every visual enters on the word that names it (`wf()`), house entrance (blur 6→0,
   scale .96→1, rise 14, 7 frames). Something new every 0.3–0.7 s. That sync is the whole format.
3. **Never cover the face.** Split: face panel on top (measure it: `analysis/grid.jpg`), stage below. Face mode: only the
   sides and the chest. gfx: avoid the face circle. Captions never on the mouth/chin.
4. **Their content, their language.** Tunisian → captions and titles in Arabic letters, tech/English/French words in
   Latin (their choice); prompts they type to Claude in 3arbizi. Use THEIR reels/videos as the examples on screen (ask
   which ones; « last N reels » means the most recent, never the pinned one).
5. **Full quality.** Don't downgrade effects to make the Studio preview smooth: the Studio stutters on heavy layers,
   the render doesn't (it computes every frame). Explain that instead.
6. **Meta and real data** (AIS reference): show the real commands, numbers and files of the actual work
   (yt-dlp/ffmpeg lines, word counts, durations, skill names, « 8 agents »). It's what makes it credible.
7. **Lots of sound design, never over the voice.** Every scene exports cues; `Sound.tsx` ducks SFX to 62 % under words;
   one transition sound per boundary (remove doubles). Music: royalty-free stock, the user picks from a list, starts
   where they want.
8. **Delegate**: reference analysis, music search and one agent per scene run in parallel (the user expects it). You
   design the base, brief, review every agent's stills and assemble.
9. **Ask the creative questions that are theirs** (layout, captions language, colours, length, music, start point,
   which reels) in one or two AskUserQuestion rounds; decide the rest and explain it.

## Pipeline (details and commands: references/pipeline.md)
0. `bash scripts/new_project.sh <name>` → `Desktop\reel-project\<name>\` (remotion-video with the engine, SFX, junctioned node_modules).
1. `bash scripts/ingest.sh <project> <video>` — re-encoded copy (keyframe every second), voice files, contact + grid sheets.
2. Listen: `bash scripts/wpy.sh scripts/transcribe.py <project>` (WSL GPU, ar + fr). Write `analysis/lines.json` by hand
   (one entry per spoken line, corrected, in the caption script) → `python3 scripts/build_captions.py <project>`.
3. Ask the user (layout, captions, colours, length…). Meanwhile agents analyse the references they gave (yt-dlp, frames,
   Whisper) and a music agent prepares 5 measured candidates with previews on their voice.
4. Write `src/data/project.ts` (modes, face, steps, titles, scenes, cover) + `EDIT-PLAN.md` (beat sheet: time · line ·
   mode · visual · SFX). Check the base with stills (face crop, captions, header) before any scene work.
5. Brief and launch the scene agents (references/agents.md) — one file each, stills QA each. Review their sheets, fix
   overlaps, remove doubled transition sounds, `npx tsc --noEmit`.
6. Music: the user picks → `scripts/music_bed.py` → `src/edit/music.ts`.
7. `qa_stills.sh` on the whole reel, READ the sheet, then start Studio (`preview_start`, launch.json entry) and hand
   over: « check it in Studio ». Iterate on their notes.
8. On « render »: `bash scripts/render.sh <project>` → master −14 LUFS, contact sheet; give the full path (files over
   30 MB can't reach their phone — say so). Then the cover: `scripts/cover.sh` (pick a frame) with COVER in project.ts.

## Look (the one the user loved)
Warm dark `#0F0B09→#261A15`, cream text, ONE accent Claude coral `#D97757`, glass cards with a warm border, Alexandria
(Arabic + Latin) for captions/titles, Instrument Serif italic coral for Latin keywords, Inter for UI, JetBrains Mono for
commands; grade warm and natural, slow push-in on the face, cinematic layer 0.5 without leaks, film grain.
Change the palette only if the user asks (theme.ts `K`).
