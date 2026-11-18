# Pipeline — exact commands

Windows 11, Git Bash for commands (PowerShell only where noted). Everything is frame-based at **30 fps**.

## Contents
0. Setup (tools, models) · 1. Project + sources + sync · 2. Listen (VAD, lips, Whisper)
3. Take selection → EDL · 4. First cut (v1) + QA · 5. Script glances · 6. Stutters & later removals
7. Final cut build + glance patches · 8. Privacy blur (raised arms) · 9. Person matte (cutout)
10. Captions · 11. Voice master · 12. Music bed · 13. Remotion build → 14. Render, master, QA

Variables used below:
```bash
SK="$HOME/.claude/skills/reel-pro-edit"          # this skill
PY="$LOCALAPPDATA/Programs/Python/Python312/python.exe"
M="$LOCALAPPDATA/reel-pro-edit/models"           # face_landmarker.task, silero_vad.onnx, rvm_mobilenetv3_fp32.onnx, pose_landmarker_full.task
P="<project>/remotion-video"; A="$P/analysis"    # Remotion project + analysis folder
```

## 0. Setup (check once per machine; everything below existed on 2026-10-14)
- ffmpeg 9 (winget Gyan.FFmpeg). ffmpeg 9 dropped `-filter_complex_script`: use `-/filter_complex file.txt`. `drawtext` crashes (no fontconfig) — never use it, draw with OpenCV instead.
- Node (for scripts + Remotion). Python on PATH is the MS-Store stub: always call `$PY` (Python 3.12, winget `Python.Python.3.12 --scope user`) with packages `mediapipe opencv-python-headless onnxruntime numpy`. A venv inside the temp dir prints nothing — don't use one.
- Whisper: WSL Ubuntu, venv `~/.venvs/whisper` (`pip install faster-whisper nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"`), model `large-v3` cached in `~/.cache/huggingface`. Run through `bash $SK/scripts/whisper.sh <workdir> <script.py> args…` (sets LD_LIBRARY_PATH, converts paths, uses the GPU). PyAV is broken in that venv → the scripts read 16 kHz mono WAV with `wave`, so always feed them `*-16k.wav`.
- Models missing? Download into `$M`:
  - `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task`
  - `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task`
  - `https://github.com/snakers4/silero-vad/raw/master/src/silero_vad/data/silero_vad.onnx`
  - `https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx`
- Remotion project: copy `$SK/assets/remotion-template/*` into `$P`, `npm i`, then `npx remotion add @remotion/media @remotion/captions @remotion/google-fonts @remotion/three @remotion/transitions @remotion/shapes @remotion/effects @remotion/layout-utils` and `npm i three@0.178.0 @react-three/fiber@9.3.0 && npm i -D @types/three@0.178.1`. Copy `$SK/assets/sfx/*.wav` to `$P/public/audio/sfx/`.

## 1. Sources and sync
- From a CapCut project: `node $SK/scripts/capcut_read.js` (lists recent projects) then `node $SK/scripts/capcut_read.js <name>`. The video and audio segments at timeline 0 give `VIDEO_START` and `AUDIO_START` (seconds into each source file).
- Single camera file with its own sound: `AUDIO_FILE = VIDEO_FILE`, `AUDIO_START = VIDEO_START = 0` (or the first useful second).
- The camera file is often 4K HEVC with a rotation tag: ffmpeg auto-rotates on decode, so frames come out vertical. Check with `ffprobe -show_entries stream=width,height,r_frame_rate`.
- Timeline 0 = `AUDIO_START` in the voice file = `VIDEO_START` in the camera file. `VIDEO_OFFSET_FRAMES = round(VIDEO_START*30)`.
```bash
mkdir -p "$A" && cd "$A"
ffmpeg -y -ss $AUDIO_START -t $DUR -i "$AUDIO_FILE" -ac 1 -ar 48000 voice-raw.wav
ffmpeg -y -i voice-raw.wav -ac 1 -ar 16000 voice-16k.wav
ffmpeg -y -i voice-16k.wav -f s16le audio.raw            # for vad.py
```

## 2. Listen
```bash
$PY -I $SK/scripts/vad.py audio.raw $M/silero_vad.onnx vad.json                      # speech prob every 32 ms
$PY -I $SK/scripts/mouth.py "$VIDEO_FILE" $VIDEO_START $DUR $M/face_landmarker.task mouth.json   # lip motion, 15 fps (background, ~5 min for 5 min of 4K)
WHISPER_PROMPT="<names, jargon>" bash $SK/scripts/whisper.sh . transcribe.py voice-16k.wav transcript.json
node $SK/scripts/regions.js vad.json mouth.json transcript.json regions.json      # speech regions + words
bash $SK/scripts/whisper.sh . transcribe_regions.py voice-16k.wav regions.json regions-words.json
```
- Regions whose region-transcription is "Sous-titrage …", "Merci d'avoir regardé" etc. are Whisper hallucinations on non-speech (breath, mic handling): drop them.
- Whisper word times are unreliable around gaps (±0.2 s). Cut on region bounds / loudness, use words only to know *which take* a region is.

## 3. Take selection → edl.json (this is editorial judgement — do it yourself)
Read the region list next to the script. For every line, keep the **last complete, fluent take** (usually the last). Drop false starts, repeated phrases, stutters ("il y avait des… il y avait"), hallucinated regions. A region that mixes a good take and a false start needs an **internal cut**: find the exact point with
```bash
node -e "…10 ms dB strip…"   # see snippet below
bash $SK/scripts/whisper.sh . check_ranges.py voice-16k.wav 52.2-52.60 53.42-54.4   # what is said in each exact slice
```
10 ms loudness strip (look for a dip ≤ -45 dB between words; resume points inside a dip near -60 dB are perfect):
```bash
node -e "const b=require('fs').readFileSync('voice-16k.wav');const W=160;const db=t=>{const i=44+Math.floor(t*16000)*2;let s=0;for(let j=0;j<W;j++){const v=b.readInt16LE(i+j*2)/32768;s+=v*v}return 10*Math.log10(s/W+1e-12)};let l='';for(let t=52.4;t<52.85;t+=0.01)l+=db(t).toFixed(0).padStart(4);console.log(l)"
```
edl.json: `{"clips":[{"a":0.29,"b":0.90,"text":"Hé, bon."}, {"a":5.55,"b":6.16,"he":true,"text":"On sait jamais,"}, …]}` — seconds on the timeline; `hs`/`he` = hard start/end (a cut inside connected speech: don't extend there).
```bash
node $SK/scripts/refine.js voice-16k.wav edl.json edl-refined.json    # snaps to where the voice really starts/ends (>-50 dB) + tiny pads
node $SK/scripts/make_v1.js edl-refined.json cut-v1.json
echo '{"removed":[]}' > removed.json
```

## 4. First cut (v1) + QA
```bash
node $SK/scripts/build_cut.js cut-v1.json removed.json cut-v1-check.json $VIDEO_OFFSET_FRAMES .
ffmpeg -y -i voice-raw.wav -/filter_complex cut-audio.txt -map "[a]" -ar 48000 voice-v1.wav
ffmpeg -y -i voice-v1.wav -ac 1 -ar 16000 voice-v1-16k.wav
bash $SK/scripts/whisper.sh . qa_transcribe.py voice-v1-16k.wav       # must read like the script: no repeats, no clipped words
ffmpeg -y -i "$VIDEO_FILE" -/filter_complex cut-video.txt -map "[v]" -r 30 -c:v libx264 -preset fast -crf 12 -g 30 -an cut-v1.mp4   # background, ~3 min / min of 4K
```
If QA shows a clipped word ("toujours" → "tout") or a stray syllable, move that clip's edge and redo 3–4.

## 5. Script glances (the person reads a script on a screen)
```bash
$PY -I $SK/scripts/gaze.py cut-v1.mp4 $M/face_landmarker.task gaze-v1.json
node $SK/scripts/glance_trims.js cut-v1.json gaze-v1.json voice-v1-16k.wav removed.json --side left          # dry run report
```
Before `--write`, LOOK: face crops of the flagged frames (ffmpeg select + crop of the top of the frame + tile=8x4). Sideways glances toward the screen = script reading. "Looking up" with a hand on the head = gesture, not reading. The first frame after a jump cut can be a tracker artifact. Then `--write` (appends silent glance frames to removed.json).

## 6. Stutters and any later removal
Add `[v1Start, v1End]` (v1 cut frames, inclusive) to removed.json. v1 frame = `clip.cutStartF + (srcFrame - clip.srcStartF)` with `srcFrame = round(sec*30)` on the timeline. Cut in a loudness dip; check both sides with check_ranges.py.

## 7. Final cut build + glance patches
```bash
node $SK/scripts/build_cut.js cut-v1.json removed.json cut.json $VIDEO_OFFSET_FRAMES .
ffmpeg -y -i voice-raw.wav -/filter_complex cut-audio.txt -map "[a]" -ar 48000 voice.wav
ffmpeg -y -i voice.wav -ac 1 -ar 16000 voice-16k-cut.wav
ffmpeg -y -i "$VIDEO_FILE" -/filter_complex cut-video.txt -map "[v]" -r 30 -c:v libx264 -preset fast -crf 12 -g 30 -an cut-plain.mp4
$PY -I $SK/scripts/gaze.py cut-plain.mp4 $M/face_landmarker.task gaze-plain.json
node $SK/scripts/glance_patch.js gaze-plain.json cut.json removed.json frame-map.json --side left [--cover 35.03-36.07]
$PY -I $SK/scripts/apply_frame_map.py cut-plain.mp4 frame-map.json ../public/footage/cut-vN.mp4 1440 2560
```
- Glances > 16 frames during speech are reported as COVER: design a full-screen cutaway graphic over them (reel #1: « plus tard » 99 % → ∞ JAMAIS.), pass its ORIGINAL-cut seconds with `--cover`.
- Re-run gaze.py on the patched file to prove it: count frames with side-gaze > 0.4 outside covers (reel #1: 141 → 0).
- `cp removed.json ../src/data/remap.json` and `cp cut.json ../src/data/cut.json` — `sec()` in the template remaps every cue through remap.json.
- **File locks**: Remotion Studio keeps open media locked. Never overwrite a file Studio uses: write a new name (`cut-v2.mp4`, `cut-v3.mp4`…) and update the `staticFile()` path.

## 8. Privacy blur (raised arms → armpit)
```bash
$PY -I $SK/scripts/pose.py ../public/footage/cut-vN.mp4 $M/pose_landmarker_full.task pose.json
node $SK/scripts/raised_arms.js pose.json cut.json ../src/data/armpit.json
```
Then VERIFY on a pixel grid: OpenCV overlay of the shoulder point + a 100 px grid on frames of each event (crop 450..1080 × 500..1300), find the armpit crease, adjust `--dx --dy --rx --ry`, and simulate the blur with OpenCV (GaussianBlur + feathered ellipse) before rendering. Reel #1: armpit = shoulder + (-55, +115) px, ellipse 165×195. `<ArmpitBlur/>` is the last child inside `<Footage>` (above the cutouts).

## 9. Person matte (for text behind the subject)
```bash
$PY -I $SK/scripts/matte.py ../public/footage/cut-vN.mp4 cut.json $M/rvm_mobilenetv3_fp32.onnx matte.mp4      # background, ~6 min / min
ffmpeg -y -i ../public/footage/cut-vN.mp4 -i matte.mp4 -filter_complex "[0:v]scale=1080:1920:flags=lanczos[v];[1:v]format=gray[m];[v][m]alphamerge,format=yuva420p[fg]" -map "[fg]" -r 30 -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 22 -row-mt 1 -deadline good -cpu-used 4 -auto-alt-ref 0 ../public/footage/cutout-vN.webm
```
If the footage gets patched after the matte (frame map), apply the SAME frame-map.json to matte.mp4 (`apply_frame_map.py matte.mp4 frame-map.json matte-p.mp4 1080 1920`) and re-encode — cheaper than re-matting.

## 10. Captions (always from the FINAL voice)
```bash
WHISPER_PROMPT="<script's first lines + names>" bash $SK/scripts/whisper.sh . words.py voice-16k-cut.wav words.json
node $SK/scripts/build_captions.js words.json cut.json ../src/data/captions.json fixes.json
```
Read the printed text against the script. Every suspicious word: `check_ranges.py` on that slice — a breath shows up as "Sous-titrage …". Add the correction to fixes.json (`[[["cloud","pour"],["Claude","pour"]], [["jamais,","hein."],["jamais."]]]`). Never shift old word timings onto a new cut; re-transcribe.

## 11. Voice master
```bash
ffmpeg -y -i voice.wav -af "highpass=f=75,acompressor=threshold=-26dB:ratio=3:attack=5:release=90:makeup=4,equalizer=f=3500:t=q:w=1.2:g=2,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 48000 -c:a pcm_s16le ../public/footage/voice-vN-master.wav
```
(mono voice measures ~3 LU louder once it plays on both channels of the stereo mix.)

## 12. Music bed
1. Candidates: Mixkit (free, no credit, social OK). Page → preview URLs: `curl -sL -A "Mozilla/5.0" https://mixkit.co/free-stock-music/<genre-or-mood>/ -o p.html` then parse `item-grid-card__title` with `data-audio-player-preview-url-value` (same order). MP3 = `https://assets.mixkit.co/music/<id>/<id>.mp3`.
2. `$PY -I $SK/scripts/music_analyze.py *.mp3` → BPM, loudness per second, bass jumps (drops). Pick a track whose structure fits the story (quiet intro → drop → breakdown → second drop is gold).
3. `$PY -I $SK/scripts/music_beats.py track.mp3 12.4-14.6 53.2-55.4` → exact drop downbeat (first big char after the quiet gap).
4. Align: the drop lands on the key line. With one offset that may also land the first drop / breakdown on story beats — check.
5. `node $SK/scripts/music_bed.js music.json removed.json <totalFrames> music-bed.sh && bash music-bed.sh` (config documented in the script). Check the loudness strip of the result.
Music level in Remotion: ~0.11 under voice (≈ -19 dB), 0.15 after the drop.

## 13. Remotion build — see references/remotion.md

## 14. Render, master, QA
```bash
cd "$P" && npx tsc --noEmit
npx remotion still Reel out/qa/f<frame>.jpg --frame=<frame> --scale=0.5 --image-format=jpeg    # key moments, then hstack + Read
npx remotion render Reel out/reel-raw.mp4 --codec=h264 --crf=16 --concurrency=4              # background, ~7 min / min
ffmpeg -y -i out/reel-raw.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000,alimiter=limit=0.84:level=false" -c:a aac -b:a 256k -movflags +faststart out/reel-vN.mp4
ffmpeg -i out/reel-vN.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:"           # ≈ -14 LUFS, peak ≤ -1.4 dBTP
ffmpeg -y -i out/reel-vN.mp4 -vf "fps=1,scale=160:284,tile=11x6:padding=2" -frames:v 1 out/qa/contact.jpg   # Read it
ffmpeg -y -i out/reel-vN.mp4 -vn -ac 1 -ar 16000 analysis/mix-16k.wav && bash $SK/scripts/whisper.sh analysis qa_transcribe.py mix-16k.wav   # voice intelligible under music+SFX
```
Send the file with SendUserFile (display render) and give its full path.
