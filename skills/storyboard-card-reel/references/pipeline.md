# Pipeline: raw video → Showcase reel → 4K → cover

Windows only (never WSL). Git Bash commands. Long steps run in the background; while they run, prepare the next one.

```bash
SK=/c/Users/YOU/.claude/skills/storyboard-card-reel
TCC=/c/Users/YOU/.claude/skills/tunisian-clean-cut/scripts
PY="/c/Users/YOU/.venvs/devops45/Scripts/python.exe -I"     # Whisper/GPU venv
P="C:/Users/YOU/Desktop/reel-project/<reel-name>"             # the reel folder
R="$P/remotion-video"
```

## 1. Clean cut (the tunisian-clean-cut skill, completely)
Follow that skill to the end: sync, regions, transcripts, your editorial pass, `keep.json`, bursts/scan, proof,
`build_clean.py`, QA, `make_face.py --version 1 --small`, `publish.py --version 1 --small --scaffold --port <free port>`,
Studio, findings list → **his OK**. `--scaffold` creates `remotion-video/` (node_modules junction to the shared
`Desktop/reel-project/remotion-video/node_modules`) and the launch entry `<reel>-studio` in
`Desktop/reel-project/.claude/launch.json`.

## 2. Project engine, 4K face, cutout
```bash
python -I $SK/scripts/new_project.py -p "$P" --version 1                 # engine onto the published cut
$PY $TCC/make_face.py -p "$P" --version 1                               # 4K face for the final (background, ~10 min)
python -I $SK/scripts/make_cutout.py -p "$P" --face talk-clean-v1-small.mp4 --out cutout-v1.webm   # background
```
- `Footage.tsx` now points at `talk-clean-v1-small.mp4` (fast Studio) and `cutout-v1.webm`.
- The template still carries the example reel's `cues.tsx`, `Storyboard` pages, `Camera` tables and `data/lines.json`.
  It will not show his lines until steps 3 and 6 replace them; that is expected.
- Free disk first: `df -h /c`. Each Remotion still/render leaves GBs in `%TEMP%` unless TEMP is redirected
  (the QA and render scripts do it). Keep > 40 GB free.

## 3. Captions data (lines.json)
Copy `$SK/scripts/build_captions.py` into `$P/scripts/`, rewrite its `LINES` (one entry per kept line of
`work/keep.json`, same order): `(id, caption text, red key word)`.
- ids are short English words (`hook`, `two`, `risk`, `dont`…): every cue, page and punch is keyed on them.
- Derja in Arabic letters (`ح ع ق خ ش`), French/English tech words in Latin, glued Arabic prefixes like `بـClaude`,
  `الـvideo`. Keep his exact words; a line you can't make out → ask him, mark it `…` meanwhile.
```bash
python -I "$P/scripts/build_captions.py" -p "$P"        # -> src/data/lines.json + captions.json
```

## 4. Voice master (start early, independent)
One-time per machine/project: the DeepFilterNet venv (Python 3.11 needed: DeepFilterLib wheels stop at cp311).
```bash
cd "$R"
uv python install 3.11 --install-dir .venv-audio-python   # or any local 3.11
<py311> -m venv .venv-audio && .venv-audio/Scripts/pip install torch==2.0.1 --index-url https://download.pytorch.org/whl/cpu
.venv-audio/Scripts/pip install deepfilternet==0.5.6 soundfile
python -I scripts/master_voice.py            # -> public/audio/voice-master-v3.wav (falls back to afftdn without the venv)
```
Check the printed report: −16 LUFS stem, tilt, band table; `ab_clips.py` makes raw / master A/B clips at equal
loudness to send him if he doubts the voice.

## 5. Music
Ask him which track (he chooses). Put it in `public/audio/music/`, analyse BPM/bars (onsets), then set the
arrangement in `scripts/mix.py` (`MUSIC`, the A/B sections, the fade before the climax line, the drop on the
punch). See `sound.md`.

## 6. Beat sheet + plan
Read all lines, decide one visual per phrase, write `$P/EDIT-PLAN.md` (table: line id · words · visual · layer ·
on which word · SFX). Mark the 4–7 bold moments for the « screen » layer, 5–8 big words behind the head, 4–7
full-screen pages (≤ 2.5 s each), the climax line. Tell him the plan in 5 lines, then build.

## 7. Build with agents in parallel (`agents.md`)
1. Beat sheet agent: `src/cues.tsx` (+ new fx in `src/fx/fx.tsx` if needed), `Captions.tsx` untouched unless asked.
2. Storyboard agent: the `page(...)` table of `src/parts/Storyboard.tsx`.
3. Camera agent: `src/parts/Camera.ts` tables + `SHOTS` block of `cues.tsx`.
4. You or a sound agent: `mix.py` arrangement, then the mix.
Photos: real photos he provides or that you find (Pexels/Unsplash free), `public/photos/*.jpg`, natural colours.

## 8. QA (you, every round)
```bash
cd "$R"
npx tsc --noEmit
COMP=Showcase sh scripts/qa/qa.sh out/qa-r1 every:30      # one still per second, 0.4 scale
COMP=Showcase sh scripts/qa/qa.sh out/qa-r1b 4 405 1300   # exact frames
python -I scripts/mix.py                                  # after ANY cue/SFX change (re-dumps the cues)
```
Tile the stills into contact sheets (PIL) and look at every one against `style-rules.md`.

## 9. Preview to his phone + Studio
```bash
mkdir -p out/tmp-render && export TEMP="$(cygpath -w $PWD/out/tmp-render)" TMP="$TEMP"
npx remotion render src/index.ts Showcase ../out/preview1-video.mp4 --codec=h264 --crf=26 --concurrency=4 --muted --log=error
cd ../out && ffmpeg -v error -y -i preview1-video.mp4 -i ../remotion-video/public/audio/mix-v3.wav -map 0:v -map 1:a \
  -c:v libx264 -preset medium -crf 27 -maxrate 2.2M -bufsize 4.4M -c:a aac -b:a 160k -shortest -movflags +faststart preview1-phone.mp4
rm -rf ../remotion-video/out/tmp-render
```
Send with `SendUserFile` (must be < 30 MB or it never reaches his phone). Studio: `preview_start {name: "<reel>-studio"}`,
composition `Showcase`. Each preview: what changed, what you checked, what you did not.

## 10. Final 4K (only on his « render »)
Switch `FACE_FILE` to `talk-clean-vN.mp4` (4K), then:
```bash
cd "$P" && bash $SK/scripts/render_parallel.sh "$P" 1 "$R/public/audio/mix-v3.wav"     # 2 workers × concurrency 1, --scale 2
# chunks that failed (RAM): bash $SK/scripts/render_resume.sh "$P" 1 "$R/public/audio/mix-v3.wav"
```
→ `out/reel-v1.mp4` (2160×3840) + `out/reel-v1-phone.mp4`. Verify frame count = DURATION, −14 LUFS, frames at the
chunk joins; send the phone copy. Switch `FACE_FILE` back to `-small` for further Studio work.

## 11. Cover + memory
`Cover.tsx` (Still `Cover`): pick one strong frame of the cutout (`ffmpeg -c:v libvpx-vp9 -ss T -i cutout.webm -frames:v 1`),
put it in `public/cover/`, edit the words, `npx remotion still src/index.ts Cover ../out/cover-v1.png`. One version, send.
Update the reel's memory file and `reel-brand-identity.md` with anything new he said.
