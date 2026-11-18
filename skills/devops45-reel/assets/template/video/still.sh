#!/bin/bash
# QA still of a composition at a GLOBAL frame: ./still.sh <CompId> <frame> [out.jpg]
# (goes through the shared render lock — never run plain `npx remotion render` in parallel)
set -e
cd "$(dirname "$0")"
SK=$HOME/.claude/skills/devops45-reel/scripts
source "$SK/env.sh"
COMP=$1; F=$2; OUT=${3:-$PWD/../qa/stills/$COMP-$F.jpg}
mkdir -p "$(dirname "$OUT")"
VIDEO_DIR=$PWD bash "$SK/remotion-safe.sh" still "$COMP" "$OUT" --frame="$F" --scale=0.5 --gl=angle --log=error 2>&1 | tail -3
echo "$OUT"
