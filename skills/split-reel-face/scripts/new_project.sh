#!/bin/bash
# New split-reel-face project (Windows, Git Bash):  bash new_project.sh <name>
#   → C:\Users\YOU\Desktop\reel-project\<name>\{remotion-video, analysis, refs, music, EDIT-PLAN.md}
# The Remotion template comes from assets/template; node_modules is a JUNCTION to an existing install
# (no npm install, no disk cost). public/ gets the SFX library. Media must be COPIED into public/ (never symlinked).
set -euo pipefail
NAME=${1:?usage: new_project.sh <name>}
SK="$(cd "$(dirname "$0")/.." && pwd)"
ROOT=${REELS_ROOT:-/c/Users/YOU/Desktop/reel-project}
P=$ROOT/$NAME
V=$P/remotion-video
mkdir -p "$P"/{analysis,refs,music/candidates,music/previews} "$V"
if [ ! -f "$V/package.json" ]; then cp -r "$SK/assets/template/." "$V/"; fi
mkdir -p "$V/public/audio/sfx" "$V/public/footage" "$V/public/thumbs" "$V/public/cover" "$V/out/qa"
cp -n "$SK"/assets/sfx/*.wav "$V/public/audio/sfx/" 2>/dev/null || true
[ -f "$P/EDIT-PLAN.md" ] || cp "$SK/references/edit-plan-template.md" "$P/EDIT-PLAN.md"
if [ ! -e "$V/node_modules" ]; then
  SRC=${MODULES_FROM:-/c/Users/YOU/Desktop/reel-project/remotion-video/node_modules}
  if [ -d "$SRC" ]; then
    WV=$(cygpath -w "$V/node_modules"); WS=$(cygpath -w "$SRC")
    powershell.exe -NoProfile -Command "New-Item -ItemType Junction -Path '$WV' -Target '$WS' | Out-Null"
  else
    (cd "$V" && npm ci --no-audit --no-fund)
  fi
fi
echo "project: $P"
echo "next: bash $SK/scripts/ingest.sh $P <video.mp4>"
