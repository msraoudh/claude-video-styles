#!/bin/bash
# Isolate the voice of a reel that has music under it (Demucs htdemucs_ft, two stems) -> 48 kHz mono wav.
#   bash vocals.sh <video-or-audio> <start_s> <dur_s> <out.wav>
# Cut it from second <start_s> and use the SAME start for its lip-sync clip in footage.json, so line seconds match.
# First time: python3 -m venv ~/.venvs/demucs && ~/.venvs/demucs/bin/pip install demucs soundfile
set -e
IN=$1; SS=${2:-0}; DUR=${3:-30}; OUT=$4
[ -n "$OUT" ] || { echo "usage: vocals.sh <in> <start_s> <dur_s> <out.wav>"; exit 1; }
T=$(mktemp -d)
NAME=$(basename "${OUT%.*}")
ffmpeg -nostdin -v error -y -ss "$SS" -i "$IN" -t "$DUR" -ac 2 -ar 44100 "$T/$NAME.wav"
~/.venvs/demucs/bin/python -m demucs --two-stems=vocals -n htdemucs_ft -o "$T/demucs" "$T/$NAME.wav"
mkdir -p "$(dirname "$OUT")"
ffmpeg -nostdin -v error -y -i "$T/demucs/htdemucs_ft/$NAME/vocals.wav" -ac 1 -ar 48000 "$OUT"
rm -rf "$T"
echo "$OUT"
