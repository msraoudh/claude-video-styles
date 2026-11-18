#!/bin/bash
# Instagram cover:  bash cover.sh <project> pick          → analysis/cover/pick.jpg (8 candidate face frames: READ it)
#                   bash cover.sh <project> <seconds>     → public/cover/face.png from that second + render CoverIG
# Edit COVER in src/data/project.ts first (title in the video's language: Tunisian → Arabic letters + Latin tech words).
set -euo pipefail
P=$(cd "${1:?usage: cover.sh <project> pick|<seconds>}" && pwd)
V=$P/remotion-video
SRC=$(ls "$P"/analysis/orig-media/*.mp4 | head -1)
if [ "${2:-pick}" = pick ]; then
  mkdir -p "$P/analysis/cover"
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
  ins=()
  for k in 1 2 3 4 5 6 7 8; do
    t=$(awk "BEGIN{printf \"%.1f\", $D*($k-0.5)/8}")
    ffmpeg -nostdin -v error -y -ss "$t" -i "$SRC" -frames:v 1 -vf "scale=270:480,drawtext=text='$t s':x=8:y=8:fontcolor=white:fontsize=22" "$P/analysis/cover/c-$k.jpg" 2>/dev/null \
      || ffmpeg -nostdin -v error -y -ss "$t" -i "$SRC" -frames:v 1 -vf scale=270:480 "$P/analysis/cover/c-$k.jpg"
    ins+=(-i "$P/analysis/cover/c-$k.jpg"); echo "c-$k = $t s"
  done
  ffmpeg -nostdin -v error -y "${ins[@]}" -filter_complex hstack=8 "$P/analysis/cover/pick.jpg"
  echo "read $P/analysis/cover/pick.jpg, then: bash cover.sh $P <seconds>"
else
  mkdir -p "$V/public/cover"
  ffmpeg -nostdin -v error -y -ss "$2" -i "$SRC" -frames:v 1 "$V/public/cover/face.png"
  cd "$V" && npx remotion still CoverIG out/cover-v1.jpg --frame=0 --image-format=jpeg --jpeg-quality=95 --log=error
  echo "cover: $(cygpath -w "$V/out/cover-v1.jpg")"
fi
