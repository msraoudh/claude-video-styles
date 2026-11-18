#!/bin/bash
# One Remotion process at a time across all agents, only when RAM is free (the user's PC must stay usable).
#   VIDEO_DIR=/abs/project/video remotion-safe.sh still <Comp> /abs/out.jpg --frame=140 [--scale=0.5]
#   VIDEO_DIR=/abs/project/video CONC=2 remotion-safe.sh render <Comp> /abs/out.mp4 [flags]
set -euo pipefail
source "$(dirname "$0")/env.sh"
MIN_MB=${MIN_MB:-3000}
CONC=${CONC:-2}
cd "${VIDEO_DIR:?set VIDEO_DIR to the Remotion project}"
sub=$1; shift
run() {
  while :; do a=$(free_mb); [ "${a:-0}" -ge "$MIN_MB" ] && break; echo "[remotion-safe] only ${a} MB free, waiting…" >&2; sleep 10; done
  if [ "$sub" = render ]; then npx remotion render src/index.ts "$@" --concurrency="$CONC"
  else npx remotion still src/index.ts "$@"; fi
}
lockrun render run "$@"
