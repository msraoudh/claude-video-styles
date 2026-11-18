#!/bin/bash
# Everything between the placed voice and the render (fast, re-run after any episode.json / data change):
#   plan_episode (scene ranges) → music_plan (drop on the ident) → cues (archetype SFX rules) → mix → tsc
#   bash prep.sh <project>
set -euo pipefail
P=$(cd "${1:?usage: prep.sh <project>}" && pwd)
[ -f "$P/episode.json" ] || P=$P/project
SK="$(cd "$(dirname "$0")" && pwd)"
source "$SK/env.sh"
"$PY" "$SK/plan_episode.py" "$P"
"$PY" "$SK/music_plan.py" "$P"
"$PY" "$SK/cues.py" "$P"
"$PY" "$SK/mix.py" "$P"
cd "$P/video" && lockrun tsc npx tsc --noEmit -p . && echo "TSC_OK"   # one tsc at a time across agents
