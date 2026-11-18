# Agents — who does what, and the briefs

The user expects multi-agents in parallel. You (the main session) own the engine, `project.ts`, the beat sheet, the
review and the assembly. Agents own one file each and never render the video or start Studio.

| when | agent | output |
|---|---|---|
| step 3, as soon as the user gives the reference reels | 1 per reference reel | `refs/<id>-analysis.md` + `refs/<id>-frames/` contact sheets |
| step 3 | 1 music agent | `music/LIST.md` + 5 previews on the user's voice |
| step 3, if the user wants their own reels on screen | you or 1 agent | `public/thumbs/ig-N.mp4` (360×640, `-g 15`) + `refs/mine/sheet-ig-N.jpg` |
| step 5 | 1 per scene (first reel: 9 scenes → 8 agents, Hook + Step1 together) | `src/scenes/<Scene>.tsx` (+ `src/scenes/<Scene>/*`) |

Launch every agent of one step in ONE message (parallel). Each brief is self-contained: the agent has not seen this
conversation.

## Reference-analysis agent (one per reel URL)
> Analyse the Instagram reel <URL> as a motion-graphics editor would, for a face-cam explainer we are about to edit.
> Download it (WSL `~/.venvs/ytdl/bin/yt-dlp -o <P>/refs/<id>.mp4 <URL>`; if WSL has no network, Windows
> `"$LOCALAPPDATA/Programs/Python/Python312/python.exe" -m yt_dlp`). Extract frames (`ffmpeg -vf fps=2,scale=270:-1,tile=5x4`
> sheets into `refs/<id>-frames/`) and READ every sheet; transcribe with Whisper (`scripts/wpy.sh scripts/transcribe.py`
> or faster-whisper large-v3). Write `refs/<id>-analysis.md`: structure with timecodes (what is on screen per line),
> layout (split ratio, where the face sits, full-screen share), typography (fonts, sizes, accent use), the motion
> vocabulary (entrances, durations in frames, transitions), caption style, sound (music entrance, SFX on which events),
> and a « what to steal » list of 8–12 concrete moves. Never post, like or comment; don't log in.

The two analyses of the first reel are in `references/refs-*.md` — read them instead if the user gives the same reels.

## Music agent
> Find royalty-free music for a <length> face-cam explainer reel in <language>, mood <mood> (first reel: modern
> trap/lo-fi groove, confident, not epic). Source: Mixkit (Stock Music Free License) first, then Pixabay; never
> commercial songs, never AI music. Download ~30 candidates to `music/candidates/`, measure each (ffmpeg ebur128 LUFS,
> BPM, where the drums enter, breaks without bass), keep the 5 best, and make for each a 30 s preview `music/previews/
> N-<slug>.mp3` = the bed at −18 dB under `analysis/voice-16k.wav` (or the master voice) from 0 s. Write `music/LIST.md`:
> number, title, artist, URL, licence line, BPM, LUFS, why it fits, the bar map (bars with/without bass, best loop).
> You can't hear: rank from measurements and say so.

## Scene agent brief (write `remotion-video/BRIEF-agents.md` once, then a short prompt per agent)
Start from `examples/kifech/BRIEF-agents.md` and replace the video-specific parts. It must contain:
1. **The story** in 4–6 lines: who the user is, what they explain, the steps.
2. **Read first**: `EDIT-PLAN.md` (decisions, look, layout, beat sheet — « your rows »), the reference analyses and
   their frame sheets, `src/edit/kit.tsx` (use it), `theme.ts`, `time.ts` (`wf(word, approxSec)`), `layout.ts`.
3. **Commands**: `cd <V> && npx tsc --noEmit` (fix only your errors — others edit at the same time); stills of the scene
   alone with GLOBAL frames: `npx remotion still Scene-<id> out/qa/<id>/f<frame>.jpg --frame=<frame> --scale=0.5
   --image-format=jpeg --log=error`, tile them, READ the sheet, iterate until premium. **Never** `npx remotion render`,
   never start Studio.
4. **Ownership**: only `src/scenes/<Scene>.tsx` (+ `src/scenes/<Scene>/*`); exports `<Scene>: React.FC` and
   `<scene>Cues: Cue[]`.
5. **Rules**: global frames (no Sequence offset; return null outside the range, ~10 frames of exit; `<Sequence from>`
   only for clips); every element ON its word with the house entrance; never static (something new every 0.3–0.7 s);
   the layout areas of each mode with real pixel numbers from this video's `project.ts` (split stage `seam+160 → 1450`,
   face-mode free areas, gfx avoids the face circle, caption band); the look (warm dark, ONE accent coral, glass, serif
   italic coral keyword, mono commands, `K.ok` only for a success tick); no real company logos (names in text are fine,
   Claude's spark is fine), UIs rebuilt as vector mockups; text in the caption script (`AR` + `dir="rtl"` for Arabic,
   Latin tech words, 3arbizi for typed prompts), short; meta/real data of this very project (real commands, numbers,
   file names); the user's own reels/clips available in `public/thumbs/` (never the pinned reel); 3D welcome where it
   adds wow, one element at a time (`src/overlays/Claude.tsx` ClaudeSpark3D); SFX cues list + volumes; deterministic.
6. **Report**: files, per beat (frame → visual → word), cues, stills reviewed (paths), open issues.

Per-agent prompt: « Read `<V>\BRIEF-agents.md`. You build scene <Scene> (<from>–<to> s, rows <…> of the beat sheet). »
plus anything specific (« the 8 agents must be visibly parallel », « callback to the hook's reel cards »).

## Reviewing what comes back
- Read every agent's sheet yourself. Typical fixes: a card over the face circle, text under the caption pill, a
  scene that ends late and overlaps the next one's first element, two whooshes on one cut, Latin words reversed in RTL.
- Run `qa_stills.sh` on the whole reel after assembly; tsc clean; then Studio.
