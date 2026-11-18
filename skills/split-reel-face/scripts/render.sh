#!/bin/bash
# FINAL render — ONLY after the user watched it in Remotion Studio and said « render ».
#   bash render.sh <project> [version=1]
# Full quality: H.264 CRF 16, 30 fps, GPU (--gl=angle), 4 threads (≈ 10 min for 1:55), then the master:
# loudnorm −14 LUFS / TP −1.5 + limiter, AAC 256k, video stream copied. Then the checks: ebur128, 1 fps contact sheet,
# mix WAV for the Whisper pass. Studio must be STOPPED first on Windows if media files were re-encoded.
set -euo pipefail
P=$(cd "${1:?usage: render.sh <project> [version]}" && pwd)
N=${2:-1}
V=$P/remotion-video
cd "$V"
npx tsc --noEmit
START=$(date +%s)
npx remotion render Reel "out/reel-v$N-raw.mp4" --codec=h264 --crf=16 --concurrency=4 --gl=angle --timeout=180000 > "out/render-v$N.log" 2>&1 \
  || { tail -c 1500 "out/render-v$N.log"; echo "RENDER FAILED (Timeout while extracting frame → re-run ingest.sh: keyframes)"; exit 1; }
echo "render took $(( $(date +%s) - START )) s"
ffmpeg -nostdin -v error -y -i "out/reel-v$N-raw.mp4" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000,alimiter=limit=0.84:level=false" \
  -c:a aac -b:a 256k -movflags +faststart "out/reel-v$N.mp4"
ffmpeg -nostdin -hide_banner -nostats -i "out/reel-v$N.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact "out/reel-v$N.mp4"
mkdir -p out/qa
ffmpeg -nostdin -v error -y -i "out/reel-v$N.mp4" -vf "fps=1,scale=160:284,tile=12x10:padding=2" -frames:v 1 "out/qa/contact-v$N.jpg"
ffmpeg -nostdin -v error -y -i "out/reel-v$N.mp4" -vn -ac 1 -ar 16000 "$P/analysis/mix-16k.wav"
echo "DELIVERABLE: $(cygpath -w "$V/out/reel-v$N.mp4")   (read out/qa/contact-v$N.jpg)"
