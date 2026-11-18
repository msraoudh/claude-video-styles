#!/bin/bash
# Scaffold one episode:  bash new_episode.sh <episode_id> [brief.json]
#   → ~/reels/output/<episode_id>/project/{video,audio,plan,qa,brief.json}
#   (Windows: C:\Users\YOU\reels\output\…, WSL: /home/you/reels/output/…)
# The Remotion template is copied from the skill (assets/template/video). node_modules come from ~/reels/_base/node_modules
# (one install): a directory junction on Windows, hard links on WSL. Never symlink media into video/public/
# (Remotion drops symlinked files): copy them.
set -euo pipefail
ID=${1:?usage: new_episode.sh <episode_id> [brief.json]}
SK="$(cd "$(dirname "$0")/.." && pwd)"
source "$SK/scripts/env.sh"
OUT=${REELS_OUT:-$HOME/reels/output}/$ID
P=$OUT/project
if [ -f "$P/episode.json" ]; then echo "exists: $P (episode.json kept)"; fi
mkdir -p "$P"/{audio/voice,audio/sfx,audio/music,audio/out,plan,qa/stills,out} "$P/video"
if [ ! -f "$P/video/package.json" ]; then
  cp -r "$SK/assets/template/video/." "$P/video/"
fi
BASE=$HOME/reels/_base/node_modules
if [ ! -e "$P/video/node_modules" ]; then
  if [ -d "$BASE" ] && [ "$DEVOPS45_WIN" = 1 ]; then cmd.exe //c mklink //J "$(cygpath -w "$P/video/node_modules")" "$(cygpath -w "$BASE")" >/dev/null
  elif [ -d "$BASE" ]; then cp -al "$BASE" "$P/video/node_modules"
  else (cd "$P/video" && npm ci --no-audit --no-fund) ; fi
fi
cp -n "$SK"/assets/sfx/*.wav "$P/audio/sfx/" 2>/dev/null || true
mkdir -p "$P/video/public/audio" "$P/video/src/data/cues"
[ $# -ge 2 ] && cp "$2" "$P/brief.json"
chmod +x "$P/video/"*.sh 2>/dev/null || true
echo "$P"
