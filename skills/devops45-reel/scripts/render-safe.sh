#!/usr/bin/env bash
# Crash-safe wrapper for Remotion stills/renders on a WSL laptop (the user's PC must never crash).
# - ONE remotion process at a time across all agents (flock on a shared lock file).
# - Waits until MemAvailable >= MIN_MB before starting.
# - Caps Chrome concurrency (default 2; final full renders may pass CONC=4 when RAM is free).
#
# Usage (from anywhere; VIDEO_DIR = the Remotion project, default: walk up from $PWD to find one):
#   VIDEO_DIR=/abs/project/video render-safe.sh still deck-9x16 /abs/out.png --frame=140
#   render-safe.sh render gone-9x16 /abs/out.mp4 --frames=100-210 --scale=0.5
#   CONC=4 render-safe.sh render Teaser-9x16 /abs/out/raw.mp4 --codec=h264 --crf=16
# Always pass ABSOLUTE output paths (the script cds into VIDEO_DIR).
set -euo pipefail
LOCK=${LOCK:-/tmp/remotion-render.lock}
MIN_MB=${MIN_MB:-2500}
CONC=${CONC:-2}

if [ -z "${VIDEO_DIR:-}" ]; then
  d=$PWD
  while [ "$d" != "/" ]; do
    if [ -f "$d/package.json" ] && grep -q '"remotion"' "$d/package.json"; then VIDEO_DIR=$d; break; fi
    [ -f "$d/video/package.json" ] && { VIDEO_DIR=$d/video; break; }
    d=$(dirname "$d")
  done
fi
[ -n "${VIDEO_DIR:-}" ] || { echo "[render-safe] set VIDEO_DIR to the Remotion project" >&2; exit 2; }
cd "$VIDEO_DIR"

exec 9>"$LOCK"
echo "[render-safe] waiting for render lock…" >&2
flock 9

while :; do
  avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
  if [ "$avail" -ge "$MIN_MB" ]; then break; fi
  echo "[render-safe] only ${avail} MB RAM free, waiting…" >&2
  sleep 10
done

sub="$1"; shift
extra=()
if [ "$sub" = "render" ]; then
  extra+=(--concurrency="$CONC")
fi
echo "[render-safe] running in $VIDEO_DIR: npx remotion $sub $* ${extra[*]}" >&2
npx remotion "$sub" "$@" "${extra[@]}"
