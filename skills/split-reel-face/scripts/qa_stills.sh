#!/bin/bash
# QA stills of the whole reel (or one scene) WITHOUT rendering the video: bundle once, then one browser renders many
# stills (≈ 4 s each instead of ≈ 60 s with `npx remotion still`), then a labelled contact sheet.
#   bash qa_stills.sh <project> [comp=Reel] [every=60 frames] [scale=0.25]
#   → remotion-video/out/qa/<comp>/fNNNN.jpg + out/qa/<comp>-sheet.jpg  (READ the sheet)
set -euo pipefail
P=$(cd "${1:?usage: qa_stills.sh <project> [comp] [every] [scale]}" && pwd)
COMP=${2:-Reel}; EVERY=${3:-60}; SCALE=${4:-0.25}
SK="$(cd "$(dirname "$0")" && pwd)"
V=$P/remotion-video
cd "$V"
NF=$(grep -o "durationFrames: [0-9]*" src/data/project.ts | grep -o "[0-9]*")
rm -rf "out/qa/$COMP" && mkdir -p "out/qa/$COMP"
npx remotion bundle --out-dir=out/bundle --log=error
FR=$(seq -s, $((EVERY / 2)) "$EVERY" $((NF - 1)))
node "$SK/stills.js" out/bundle "$COMP" "out/qa/$COMP" "$FR" "$SCALE"
# Git Bash /c/... → WSL /mnt/c/... (PIL lives in WSL's python3)
WV="/mnt/c${V#/c}"
WS="/mnt/c${SK#/c}"
MSYS_NO_PATHCONV=1 wsl.exe python3 "$WS/sheet.py" "$WV/out/qa/$COMP" "$WV/out/qa/$COMP-sheet.jpg"
echo "sheet: $V/out/qa/$COMP-sheet.jpg"
