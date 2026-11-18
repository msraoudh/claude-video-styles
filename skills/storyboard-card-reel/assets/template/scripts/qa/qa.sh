#!/bin/sh
# QA stills without copying the 4 GB of footage into %TEMP%: one bundle with a stub public dir + hard-linked footage,
# its own TEMP inside out/qa/, deleted afterwards (Remotion temp copies once filled C: with 116 GB).
#   COMP=Showcase sh scripts/qa/qa.sh out/qa-x every:30        (run from remotion-video/)
#   COMP=Reel     sh scripts/qa/qa.sh out/qa-x 4 120 450 900     (outDir, concurrency, frames…)
T="$(pwd -W 2>/dev/null || pwd)/out/qa/tmp"
mkdir -p "$T"
TEMP="$T" TMP="$T" node scripts/qa/stills-par.mjs "$@" 2>&1 | grep -v "network requests" | tail -3
rm -rf "$T"
