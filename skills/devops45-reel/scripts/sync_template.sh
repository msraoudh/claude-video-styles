#!/bin/bash
# Maintainer tool: copy the dev project's Remotion source into the skill's template (assets/template/video).
#   bash sync_template.sh [dev dir, default ~/reels/_devops45-dev]
# Improve archetypes in the dev project (fixture episode = every archetype), QA them, then sync.
# Generated audio is not copied; generated data/*.ts are (so the template type-checks as shipped).
set -euo pipefail
DEV=${1:-$HOME/reels/_devops45-dev}
SK="$(cd "$(dirname "$0")/.." && pwd)"
T=$SK/assets/template/video
mkdir -p "$T"
rsync -a --delete --exclude node_modules --exclude 'public/audio/*.wav' --exclude 'public/music' --exclude '*.log' \
  --exclude out --exclude build "$DEV/video/" "$T/"
mkdir -p "$T/public/audio"
cp "$DEV/brief/agent-common.md" "$SK/references/archetype-builders.md" 2>/dev/null || true
du -sh "$T"; find "$T/src" -name '*.ts*' | wc -l
