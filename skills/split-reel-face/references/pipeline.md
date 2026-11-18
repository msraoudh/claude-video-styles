# Pipeline — exact commands

Windows 11, Git Bash for project commands (Node/Remotion run on Windows), WSL for Whisper and PIL.
`SK=/c/Users/YOU/.claude/skills/split-reel-face` · `P=/c/Users/YOU/Desktop/reel-project/<name>` ·
`V=$P/remotion-video`. wsl.exe mangles `$` inside inline `bash -c "…"`: put WSL commands with variables in a .sh file
and run `MSYS_NO_PATHCONV=1 wsl.exe bash /mnt/c/…/file.sh`.

## 0. Project
```bash
bash $SK/scripts/new_project.sh <name>        # template + SFX + node_modules junction + EDIT-PLAN.md
```

## 1. Ingest
Find the video: CapCut exports land in `C:\Users\YOU\AppData\Local\CapCut\Videos\<name>.mp4` (the draft folder
`…\CapCut\User Data\Projects\com.lveditor.draft\<name>` tells you the raw source and the user's cuts). Use the
EXPORT the user points at (their cut).
```bash
bash $SK/scripts/ingest.sh $P "/c/Users/YOU/AppData/Local/CapCut/Videos/<name>.mp4"
```
Read `analysis/contact.jpg` (framing, gestures, mic) and `analysis/grid.jpg` (orange line every 100 source px) → set in
`project.ts`: `face.splitSy` (top of the face panel: forehead), `seam` (face panel height: forehead → below the chin),
`face.cx/cy` (push-in centre between eyes and mouth), `face.pip`, `captionY.face` (between chin and mic). First reel:
eyes y 670, mouth 980, chin 1100, mic 1300–1550 → splitSy 270, seam 880, captionY.face 1240.

## 2. Listen
```bash
bash $SK/scripts/wpy.sh $SK/scripts/transcribe.py $P ar fr    # WSL path form: /mnt/c/…; WHISPER_PROMPT="names, jargon"
```
Read both passes. Write `analysis/lines.json`: `[{ "s": 0.0, "e": 4.38, "part": "hook", "t": "…" }]` — one entry per
spoken line (use the Whisper segment bounds), the text CORRECTED in the caption script (references/captions.md). Then
```bash
python3 $SK/scripts/build_captions.py $P ar     # → src/data/captions.json (word timings) + src/data/lines.json
```

## 3. Questions + parallel research
AskUserQuestion (≤ 4 per round): layout (split + full-screen hits recommended), captions script, colours, length, and
later the music and where it starts. Launch the reference agents (their reel URLs) and the music agent now
(references/agents.md). Download reels with yt-dlp (WSL `~/.venvs/ytdl/bin/yt-dlp`, or Windows
`"$LOCALAPPDATA/Programs/Python/Python312/python.exe" -m yt_dlp` when the VPN cuts WSL's network). A profile grid:
open it in the built-in browser and read the `/reel/` links (decline optional cookies); the first tile may be PINNED.

## 4. Config + beat sheet + base check
Write `src/data/project.ts` and `EDIT-PLAN.md` (template copied by new_project.sh). Copy the user's clips/thumbs into
`public/thumbs/` re-encoded small with short GOP (`-vf scale=360:640 -g 15 -crf 20`). Then:
```bash
cd $V && npx tsc --noEmit
npx remotion still Reel out/qa/base-60.jpg --frame=60 --scale=0.5     # face / split / gfx frames — READ them
```

## 5. Scenes (agents)
Stub one file per scene in `src/scenes/` (export `<Name>` + `<name>Cues`), register them in `src/scenes/index.ts`, write
`BRIEF-agents.md` from references/agents.md, launch the agents in parallel, review each report + sheet. Then:
- doubled transition sounds: list `sfx: "(whoosh|swipe|whip)"` cues, keep one per scene boundary;
- `npx tsc --noEmit` clean.

## 6. Music
User picks from `music/LIST.md` previews → write a splice plan → `python3 $SK/scripts/music_bed.py $P <track.mp3> plan.json`
(WSL or Windows python with ffmpeg) → `src/edit/music.ts` (`from`, `file`, `volume`).

## 7. Review in Studio
```bash
bash $SK/scripts/qa_stills.sh $P Reel 60 0.25     # whole reel, 1 still / 2 s → out/qa/Reel-sheet.jpg (READ it)
```
`.claude/launch.json` (session folder) entry: `{"name":"<name>-studio","runtimeExecutable":"npm","runtimeArgs":["--prefix","<name>/remotion-video","run","dev","--","--no-open","--port","3127"],"port":3127}`
→ `preview_start` → tell the user what to check. The preview may stutter on heavy layers: it's the live player, not the video.

## 8. Render (only on « render »), cover
```bash
# stop Studio first if you re-encoded media (Windows file locks)
bash $SK/scripts/render.sh $P 1        # ≈ 10 min for 1:55 · master −14 LUFS · out/qa/contact-v1.jpg
bash $SK/scripts/cover.sh $P pick      # 8 candidate frames → pick → edit COVER in project.ts
bash $SK/scripts/cover.sh $P 76        # face.png from 76 s + render CoverIG → out/cover-v1.jpg
```
Give the full Windows path of `out/reel-vN.mp4`. SendUserFile only reaches the phone under 30 MB (the cover does).
