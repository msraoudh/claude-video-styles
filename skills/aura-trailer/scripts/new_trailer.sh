#!/bin/bash
# Scaffold a new trailer project (WSL):
#   bash ~/.claude/skills/aura-trailer/scripts/new_trailer.sh ~/<slug> <slug>
#   MODULES_FROM=~/me-trailer/video bash ... (symlink an existing node_modules of the same template: instant, works offline)
# Creates source/ analysis/ music/ audio/{stems,sfx-pick,sfx-kit,out} brief/ plan/ qa/ out/ video/ (the Remotion template),
# trailer.json + footage.json starters, brief/agent-common.md (the scene-agent rules to fill), and installs node_modules.
set -e
SK=$(cd "$(dirname "$0")/.." && pwd)
DIR=${1:?usage: new_trailer.sh <dir> <slug>}
SLUG=${2:-$(basename "$DIR")}
[ -e "$DIR/trailer.json" ] && { echo "$DIR already has a trailer.json — not overwriting"; exit 1; }
mkdir -p "$DIR"/{source,analysis/transcripts,music,audio/{stems,sfx-pick,sfx-kit,out},brief,plan,qa/stills,out,video}
cp -r "$SK/assets/remotion-template/." "$DIR/video/"
chmod +x "$DIR/video/still.sh" "$DIR/video/stills.sh"
cp "$SK/assets/sfx/dark/"* "$DIR/audio/sfx-pick/"
cp "$SK/assets/sfx/kit/"* "$DIR/audio/sfx-kit/"
sed "s/SLUG/$SLUG/g" "$SK/assets/trailer.starter.json" > "$DIR/trailer.json"
cp "$SK/assets/footage.starter.json" "$DIR/footage.json"
sed "s#{{PROJECT}}#$(cd "$DIR" && pwd)#g" "$SK/references/agent-brief-template.md" > "$DIR/brief/agent-common.md"
cd "$DIR/video"
if [ -n "$MODULES_FROM" ] && [ -d "$MODULES_FROM/node_modules" ]; then
  ln -s "$(cd "$MODULES_FROM" && pwd)/node_modules" node_modules
else
  source ~/.nvm/nvm.sh >/dev/null && nvm use 24 >/dev/null && npm ci --no-audit --no-fund
fi
echo "scaffolded $(cd "$DIR" && pwd) — next: download the reels (ig_download.sh), the song (music_prep.sh)"
