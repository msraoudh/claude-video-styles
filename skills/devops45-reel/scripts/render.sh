#!/bin/bash
# Silent picture render (60 fps, H.264) + the cover still, through the shared render lock, GPU (--gl=angle: 8 min
# instead of ~80 on this PC). Writes <project>/out/raw.mp4, out/cover.png, out/render.log.
#   bash render.sh <project>            (CRF=18 default; the final mp4 must stay ≤ 45 MB for the Telegram preview)
set -euo pipefail
P=$(cd "${1:?usage: render.sh <project>}" && pwd)
[ -f "$P/episode.json" ] || P=$P/project
SK="$(cd "$(dirname "$0")" && pwd)"
cd "$P/video"
source "$SK/env.sh"
mkdir -p "$P/out"
START=$(date +%s)
CONC=${CONC:-3} VIDEO_DIR=$PWD bash "$SK/remotion-safe.sh" render Episode-silent "$P/out/raw.mp4" --codec=h264 --crf=${CRF:-18} \
  --muted --gl=angle --timeout=120000 > "$P/out/render.log" 2>&1 || { tail -30 "$P/out/render.log"; exit 1; }
echo "render took $(( $(date +%s) - START )) s"
VIDEO_DIR=$PWD bash "$SK/remotion-safe.sh" still Cover "$P/out/cover.png" --frame=0 --gl=angle --log=error >> "$P/out/render.log" 2>&1
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_read_frames -of compact "$P/out/raw.mp4"
ls -la "$P/out"
