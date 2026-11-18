# Rendering, QA, delivery — without crashing the PC

The machine: a WSL2 Ubuntu laptop with ~15.7 GB RAM and a 6 GB NVIDIA GPU. The user said: "try to not crash the pc check gpu and stuff and make sure for pc to not crash itis wsl btw".

## Safety rules
- **Every** still/render goes through `scripts/render-safe.sh`:
  - a flock on `/tmp/remotion-render.lock`, so only one Remotion process runs across all agents
  - it waits for MemAvailable ≥ 2500 MB
  - `--concurrency=2` (finals: `CONC=4` when RAM is free)
- Set `VIDEO_DIR` to the project and give **absolute** output paths.
- Run `scripts/watchdog.sh` in the background (or under the Monitor tool) during long renders and GPU generation:
  - it alerts below 1500 MB
  - below 800 MB it kills headless Chrome only
- Never start a second `remotion studio`. Avoid parallel `tsc`. Keep test clips ≤150 frames at `--scale=0.5`.
- GPU generation (if ever local): use group offload. `enable_model_cpu_offload` OOM'd on 6 GB, and `expandable_segments` errors on WSL.
- If a render dies, look at `free -m` / `dmesg` before retrying. Don't loop.

## QA loop (how the work got to "perfect")
1. Each agent renders stills of its scene composition at the key frames, e.g. `render-safe.sh still deck-9x16 /abs/qa/deck/9x16-f140.png --frame=140`.
2. **Read every PNG** (downscale big ones with PIL first). Check:
   - hierarchy
   - clipping and safe areas
   - the caption band is clear
   - the UI matches the real app
   - the beat lands on the word
3. Motion check: a short clip (`--frames=80-200 --scale=0.5`), then extract frames and look.
4. Director: a contact sheet of every cut at −6/0/+6 frames (`scripts/qa/sheet.py out.png cols thumbW imgs…`).
5. Frozen-format proof: `python3 scripts/qa/cmp.py approved.png new.png` → the bbox/max/mean diff must be zero (±1 for WebGL).

## Final render
```bash
# bundle once, then render (h264, high quality)
CONC=4 VIDEO_DIR=/abs/video scripts/render-safe.sh render Teaser-9x16 /abs/out/<name>-9x16-raw.mp4 --codec=h264 --crf=16
scripts/audio/master.sh /abs/out/<name>-9x16-raw.mp4 /abs/out/<name>-9x16.mp4   # -14 LUFS, ≤ -2 dBTP, video copied
```
- Verify with ffprobe:
  - 1080×1920 / 1920×1080
  - 60 fps
  - duration
  - audio 48 kHz
  - true peak ≤ −1.5 dBTP
- Sample 6–9 frames across the timeline into a sheet and look.
- NearMatch 9:16 final: 1080×1920, 60 fps, 45.1 s, ~39 MB, −15.9 LUFS, −3.0 dBTP.

## Delivery (how this user wants it)
- Full quality only. "no dont make lighter ... put it in folder so i see it". Open the folder in Windows:
  `explorer.exe "$(wslpath -w /abs/out)"`
- Tell them the moment the first format is ready ("if you finish 16:9 or 9:16 one before the other tell me i take a look at least").
- After approval, the format is **frozen**: no re-renders, no shared-code changes that alter it, no "lighter" copies.

## Project layout that worked
```
<project>-motion/
  CLAUDE.md                 rules + layout for future sessions
  progress/RESUME.md        current state + next steps (update before every compact)
  brief/                    product-brief.md, creative-direction.md, scenes.md, agent-common.md
  research/                 reference analysis + reference videos
  screens/                  real captures + INDEX.md     capture-tooling/
  audio/                    vo takes, words json, placed json, stems/, music-candidates/
  video/                    Remotion project (from templates/remotion-starter)
  qa/                       stills + sheets per scene
  out/                      finals (+ -raw), previews, music previews + LIST.md
  tools/                    render-safe.sh, gen/
```
The user wants everything for a project inside one folder ("move all in a folder … what you have created and memory and what is all related to this chat"), not in `~`.
