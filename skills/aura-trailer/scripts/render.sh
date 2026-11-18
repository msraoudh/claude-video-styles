#!/bin/bash
# Silent picture render (60 fps, H.264 CRF 16) through the shared render lock, on the GPU (--gl=angle: ~10x faster
# than WSL's software GL on this laptop). Logs to out/render.log. Run in the project folder:
#   bash ~/.claude/skills/aura-trailer/scripts/render.sh                (full)
#   A=1800 B=2100 bash ~/.claude/skills/aura-trailer/scripts/render.sh  (re-render frames A..B and splice them into out/raw.mp4)
# Check progress with wait_render.sh. Never start a second render or the Studio while one runs.
set -e
P=${TRAILER:-$PWD}
RS=~/.claude/skills/cinematic-motion-teaser/scripts/render-safe.sh
[ -x "$RS" ] || { echo "render-safe.sh missing: $RS (cinematic-motion-teaser skill in WSL)"; exit 1; }
mkdir -p "$P/out"
cd "$P/video"
source ~/.nvm/nvm.sh >/dev/null && nvm use 24 >/dev/null
free -m | head -2
START=$(date +%s)
if [ -z "$A" ]; then
  CONC=${CONC:-4} VIDEO_DIR=$PWD $RS render Trailer-silent "$P/out/raw.mp4" --codec=h264 --crf=16 --muted --gl=angle --timeout=120000 > "$P/out/render.log" 2>&1
  echo "render took $(( $(date +%s) - START )) s"
  ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,nb_frames -of compact "$P/out/raw.mp4"
else
  CONC=${CONC:-4} VIDEO_DIR=$PWD $RS render Trailer-silent "$P/out/patch.mp4" --codec=h264 --crf=16 --muted --gl=angle --timeout=120000 --frames=$A-$B --log=error 2>&1 | tail -2
  cd "$P/out"
  N=$((B - A + 1))
  ffmpeg -nostdin -v error -y -i raw.mp4 -i patch.mp4 -filter_complex \
   "[0:v]trim=end_frame=$A,setpts=PTS-STARTPTS[a];[1:v]trim=end_frame=$N,setpts=PTS-STARTPTS[p];[0:v]trim=start_frame=$((B + 1)),setpts=PTS-STARTPTS[b];[a][p][b]concat=n=3:v=1:a=0[v]" \
   -map "[v]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -r 60 raw-patched.mp4
  mv raw-patched.mp4 raw.mp4
  echo "patched $A-$B in $(( $(date +%s) - START )) s; frames:"
  ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 raw.mp4
fi
