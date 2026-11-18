# Pipeline — every command, in order

Everything runs in **WSL Ubuntu**. Projects live in `~/<slug>`. Run the scripts from the project folder, or set `TRAILER=~/<slug>`.

From the Windows side:
- Edit files through `\\wsl.localhost\Ubuntu\home\mesaid\<slug>\...` with Read/Write/Edit.
- Run commands with `MSYS_NO_PATHCONV=1 wsl.exe -d Ubuntu -- bash /mnt/c/.../script.sh`.
- **wsl.exe mangles `$` in inline `bash -lc "..."`**: put every loop or variable into a .sh file and run that file.

```bash
SK=~/.claude/skills/aura-trailer/scripts      # this skill (a symlink to the Windows copy)
P=~/<slug>                                     # the project
```

## Contents
0. Setup · 1. Scaffold · 2. Know the person (Instagram) · 3. The song · 4. Voice lines · 5. Shot library + matte
6. Plan check · 7. Scene agents · 8. Assemble + look · 9. Sound · 10. Render · 11. Deliver + QA

## 0. Setup (all present on 2026-10-21; check once)
- **venvs:**
  - `~/.venvs/audio`: librosa, numpy, scipy, soundfile.
  - `~/.venvs/whisper`: faster-whisper with CUDA wheels, model large-v3 cached. Always run it through `$SK/wpy.sh`.
  - `~/.venvs/demucs`: demucs htdemucs_ft.
  - `~/.venvs/ytdl`: yt-dlp.
- **Node 24** via nvm (`source ~/.nvm/nvm.sh && nvm use 24`).
- **Renders:**
  - The render lock is `~/.claude/skills/cinematic-motion-teaser/scripts/render-safe.sh` (WSL copy of that skill).
  - The beat analyzer is music-to-video's `analyze-beatgrid.py`; `music_prep.sh` finds it on the Windows side.
- **Matte (Windows side, from reel-pro-edit):**
  - Python: `$LOCALAPPDATA/Programs/Python/Python312/python.exe`, with onnxruntime.
  - Model: `$LOCALAPPDATA/reel-pro-edit/models/rvm_mobilenetv3_fp32.onnx`.
- **No internet in WSL?** The Windows VPN cuts WSL's network. Download from PowerShell with `Invoke-WebRequest` straight into the UNC path, and tell any agent that downloads the same.

## 1. Scaffold
```bash
MODULES_FROM=~/me-trailer/video bash $SK/new_trailer.sh ~/<slug> <slug>   # instant: symlinks the same node_modules
# or without MODULES_FROM: npm ci (needs internet, ~1 GB)
```
This creates:
- `trailer.json` + `footage.json` starters (`references/config.md`);
- `brief/agent-common.md` (the scene-agent rules, to fill);
- `video/`, the Remotion template: it type-checks and renders the Placeholder at once;
- `audio/sfx-pick/` (the dark set) and `audio/sfx-kit/`.

## 2. Know the person (their Instagram)
1. Ask the user to log in to Instagram in the browser pane. **They type their own credentials; you never do.** Public reels download without a login, but the grid lists more when logged in.
2. On `https://www.instagram.com/<handle>/reels/`, run `scripts/ig_codes.js` with the browser's javascript tool. Save the codes to `$P/source/codes.txt`, one per line.
   - Only scroll the grid. Fetching post pages in a loop hits HTTP 429 within minutes.
3. Download:
   ```bash
   bash $SK/ig_download.sh source/codes.txt   # yt-dlp, 4 s apart, + .info.json (views, likes, caption, music)
   ```
4. Look:
   ```bash
   python3 $SK/ig_sheets.py                   # analysis/sheet-N.jpg (6 frames per reel) + analysis/reels.json
   bash $SK/wpy.sh transcribe.py --skip <faceless codes>   # analysis/transcripts/<code>.json, word timestamps
   python3 $SK/ig_txt.py                      # every transcript, compact, with views and captions
   python3 $SK/ig_sheets.py --dense --skip <codes>         # analysis/dense/dense-N.jpg: 12 timestamped frames per reel
   ```
   Copy the sheets to the scratchpad and Read them.
5. Write down, in `brief/agent-common.md` "What this is":
   - their look (set, lights, clothes, mic, glasses);
   - formats (talking head, split screen with a screen recording, motion episodes with their face card);
   - top reels by views, and the slogans from captions and transcripts;
   - which reels are in which language.

## 3. The song
1. Ask for the file: "send me the mp3 of <track>" (or the user downloads it). Put it in `music/`.
   - Trending tracks are copyrighted: don't download them from rips. Audiomack geo-blocked ACIDO. CapCut's library is the in-app fallback.
2. Analyse:
   ```bash
   bash $SK/music_prep.sh music/<song>.mp3 0.85     # 1 = untouched; 0.85 = slowed (pitch + tempo down, darker)
   ```
   It prints the beat grid summary (BPM, downbeats, key moments, hard stops, silences, energy phases), the strong 808 hits per 12 s window, and a loudness strip.
3. Pick the window: `music.offset_s` = the song second that plays at trailer frame 0. Choose it so that:
   - the song is still quiet or filtered for the first ~4 s (the cold open; the mixer low-passes it anyway);
   - the bass or 808 enters around 4 s, right after the hook line;
   - a drop-out (a bar where the beat stops) falls around 10–12 s, so the intro line can sit in it;
   - drop 1 lands at ~12–13 s;
   - a long section of strong bass runs ~30–47 s;
   - **a real silence or breakdown** falls around 47–51 s (the confession lines), followed by **the biggest 808 hit** (the title slam);
   - a couple of big hits follow for the finale, and the song is still going at ~58 s for the tape stop.
4. Write the moments into `trailer.json` `key` (in song seconds, read off the strip) and set the `sections` around them (`references/editing.md` has the arc).

## 4. Voice lines (their own voice)
1. Choose 6–10 lines from the transcripts (`references/editing.md`, "Choosing the lines"). Each line must be:
   - self-contained, 1–4 s, from a clean take;
   - from a reel whose face shot can be shown in sync.
2. Per source reel:
   - **Clean voice** (no music under it): `voice.sources.<id>.audio` = the reel's mp4/wav, and `words` = its transcript JSON.
   - **Music under the voice:** isolate it first. Use the **same start** for its lip-sync clip in `footage.json`:
     ```bash
     bash $SK/vocals.sh source/<code>.mp4 0 12 audio/stems/<id>-vocals.wav
     bash $SK/wpy.sh transcribe.py --files audio/stems/<id>-vocals.wav   # -> analysis/transcripts/<id>-vocals.json
     ```
3. Fill `lines[]`: `in`/`out` = source seconds, `at` = trailer second. Then iterate:
   ```bash
   ~/.venvs/audio/bin/python $SK/plan.py          # lines in trailer frames
   ~/.venvs/audio/bin/python $SK/snap_cuts.py     # loudness strip around every in/out: cut in the valleys
   bash $SK/wpy.sh find_in.py <id> <first word> <lo> <hi>   # earliest in-point where Whisper hears exactly the first word
   ~/.venvs/audio/bin/python $SK/plan.py && ~/.venvs/audio/bin/python $SK/build_voice.py
   bash $SK/wpy.sh qa_lines.py                    # every line heard word for word? residue floor?
   ```
   Placement rules: a line's last key word ends **just before** the next 808 hit (2–8 frames), so the hit punctuates it. Lines sit in the drop-outs, dips and the silence, where the music already makes room.

## 5. Shot library + matte
1. From the dense sheets, list 30–60 clips in `footage.json`, 2.5–3 s each:
   - the lip-sync master(s);
   - face b-roll with different looks and gestures;
   - screens (crops of split-screen reels);
   - their episodes; their earlier finished reels.
   Give each a `desc`: agents choose shots from these descriptions.
   - Every lip-sync clip starts at the same second as its voice source (usually 0) and lasts as long as the lines need.
   - Use crop presets for split-screen reels (find the y-range with a probe frame and a pixel ruler).
2. Matte of the main master, for text behind the subject (RVM, Windows Python, ~6 min per minute of video):
   ```bash
   # Git Bash on Windows
   PY="$LOCALAPPDATA/Programs/Python/Python312/python.exe"; M="$LOCALAPPDATA/reel-pro-edit/models"
   echo '{"clips":[{"cutStartF":0}]}' > cut.json    # one shot, no jump cuts (list every cut start frame if it has cuts)
   ffmpeg -y -i master.mp4 -vf fps=30 master30.mp4
   "$PY" -I ~/.claude/skills/reel-pro-edit/scripts/matte.py master30.mp4 cut.json "$M/rvm_mobilenetv3_fp32.onnx" matte.mp4
   ffmpeg -y -i master30.mp4 -i matte.mp4 -filter_complex "[0:v]scale=1080:1920:flags=lanczos[v];[1:v]format=gray[m];[v][m]alphamerge,format=yuva420p[fg]" -map "[fg]" -r 30 -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 22 -row-mt 1 -deadline good -cpu-used 4 -auto-alt-ref 0 cutout.webm
   ```
   Set that clip's `"matte": "<path>/cutout.webm"`.
3. Cut the library:
   ```bash
   python3 $SK/footage.py     # video/public/footage/<id>.mp4 + src/data/footage.ts + qa/footage-sheet.jpg
   ```
   **Copy or hard-link media into `video/public/`, never symlink**: Remotion's bundle drops symlinked files (404 at render).

## 6. Plan check
```bash
~/.venvs/audio/bin/python $SK/plan.py         # beats.ts, voice.ts, sections.ts, fx.ts
cd video && npx tsc --noEmit -p . && ./stills.sh Trailer 120 757 2000
```
- The Placeholder shows the section, the bar.beat counter, the word being spoken, and a flash on every hit.
- To preview with sound, run `bash $SK/studio.sh ~/<slug> 3125` (or add a launch.json entry; see the header of studio.sh), then open it with preview_start. **Never open the Studio while a render runs.**

## 7. Scene agents
1. Fill `brief/agent-common.md`:
   - "What this is";
   - the KEY list with what happens at each;
   - one "Your part" block per agent: frame range, sections, lines, KEY moments inside, the signature moment, suggested shots, and what the neighbours start and end on.
2. Launch one `general-purpose` Agent per part, in the background, all in one message. Their prompt:
   - "Read `<P>/brief/agent-common.md` (your part: X) and the data files it lists, then build your part. Only write in `src/sections/X/` and `src/data/cues/X.json`."
   - Remind them that the stills lock serialises renders and that the WSL `$` issue applies.
3. While they work, you own:
   - the mix curves (`trailer.json` `mix`);
   - the letterbox and flash settings (`fx`) and the director cues;
   - SFX generation, if a new mood is needed (`references/sound.md`).
4. When each one reports, read its stills before trusting the report.
5. Register the parts in `video/src/sections/index.ts`:
   ```ts
   import { Open } from "./open"; ...
   const REGISTRY: Record<string, React.FC> = { open: Open, hero: Hero, escalate: Escalate, climax: Climax };
   ```

## 8. Assemble + look
```bash
cd $P/video && npx tsc --noEmit -p .
./stills.sh Trailer <every part boundary ±2> <every line start+6 / end-6> <every big hit> <the signature frames>
```
- Stack the stills into contact sheets (PIL) and Read them.
- Typical fixes last time:
  - TrailerFX flashes washed out the end card, so the fx now stop at `fx.live_until`.
  - The cold-open face was hidden at frame 0.
  - `cssFilter("none" + filter)` produced invalid CSS.
  - A part used another face clip during a line.
  - Text sat under the Instagram UI.
- Fix inside the owning part, or send the agent a follow-up.

## 9. Sound
```bash
~/.venvs/audio/bin/python $SK/mix.py > audio/out/cues.log && grep MISSING audio/out/cues.log
bash $SK/wpy.sh qa_mix.py     # needs audio/out/mix-master.wav for the blind pass (deliver.sh makes it); else it uses mix.wav
```
- Read the lead table. Any line < 10 dB in either band means:
  - deepen `duck_db`;
  - lower that part's SFX near it;
  - shorten a reverse;
  - or raise `voice_gain_db`.
- Read the blind transcript: every line must come back word for word.
- Then read `cues.log`: too many cues stacked in one bar is mud.

## 10. Render (GPU, through the lock)
```bash
bash $SK/render.sh            # Trailer-silent -> out/raw.mp4, --gl=angle, ~8-10 min for 60 s (software GL: ~80 min)
bash $SK/wait_render.sh       # until RENDER_DONE (re-run while STILL_RENDERING)
A=1800 B=2100 bash $SK/render.sh   # fix a range later: re-renders A..B and splices it into raw.mp4
```
- nvidia-smi shows 0 % even when ANGLE works (D3D12 passthrough). To check the GPU, time one heavy still instead.
- Run renders in the background (run_in_background) and don't poll. While it renders, run nothing else heavy.

## 11. Deliver + QA
```bash
SKIP_RENDER=1 v=v1 bash $SK/deliver.sh   # mix -> master (-14 LUFS, TP limiter) -> qa/audio-qa.txt -> 2 mp4s -> Desktop
python3 $SK/motion_qa.py out/<slug>-9x16-v1.mp4          # black/frozen runs, cuts per second, luma per second
python3 $SK/review.py out/<slug>-9x16-v1.mp4 qa/review   # qa/review-N.jpg: Read every sheet
bash $SK/wpy.sh verify_delivery.py out/<slug>-9x16-v1.mp4 out/<slug>-9x16-v1-sans-musique.mp4
explorer.exe "$(wslpath -w <deliver.desktop_dir>)"
```
- Write `progress/RESUME.md`: status, how to rebuild, what is pending.
- Tell the user:
  - the two file paths;
  - your creative decisions (lines, arc, signature moments, SFX);
  - the measurements: duration, LUFS, true peak, voice lead, blind transcript;
  - what you could not verify (you can't hear it).
