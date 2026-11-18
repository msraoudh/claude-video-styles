#!/bin/bash
# Ingest the user's face-cam video (their CapCut export, or any 9:16 file with its own sound):
#   bash ingest.sh <project dir> <video.mp4> [voice.wav]
# - keeps the original in analysis/orig-media/
# - RE-ENCODES the picture with a keyframe every second (CRF 14): CapCut exports have a keyframe every ~5 s and the
#   Remotion render dies with « Timeout while extracting frame » on them (seen on the first reel).
# - voice: analysis/voice-raw.wav (48 k) + voice-16k.wav (Whisper) + public/footage/voice-v1-master.wav (−16 LUFS)
# - analysis/contact.jpg (1 frame / 2 s) and analysis/grid.jpg (3 frames with a y-grid: measure where the face sits
#   → PROJECT.face / seam / captionY in src/data/project.ts); prints durationFrames.
set -euo pipefail
P=$(cd "${1:?usage: ingest.sh <project> <video> [voice]}" && pwd)
SRC=${2:?video}
VOICE=${3:-$SRC}
A=$P/analysis
V=$P/remotion-video
mkdir -p "$A/orig-media" "$V/public/footage"
cp -n "$SRC" "$A/orig-media/" || true
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of compact "$SRC"
ffmpeg -nostdin -v error -y -i "$SRC" -an -c:v libx264 -preset slow -crf 14 -g 30 -keyint_min 30 -sc_threshold 0 \
  -pix_fmt yuv420p -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" -movflags +faststart \
  "$V/public/footage/talk-v1.mp4"
ffmpeg -nostdin -v error -y -i "$VOICE" -vn -ac 1 -ar 48000 "$A/voice-raw.wav"
ffmpeg -nostdin -v error -y -i "$A/voice-raw.wav" -ac 1 -ar 16000 "$A/voice-16k.wav"
ffmpeg -nostdin -v error -y -i "$A/voice-raw.wav" -af "highpass=f=75,acompressor=threshold=-26dB:ratio=3:attack=5:release=90:makeup=4,equalizer=f=3500:t=q:w=1.2:g=2,loudnorm=I=-16:TP=-1.5:LRA=7" \
  -ar 48000 -c:a pcm_s16le "$V/public/footage/voice-v1-master.wav"
ffmpeg -nostdin -v error -y -i "$V/public/footage/talk-v1.mp4" -vf "fps=0.5,scale=180:320,tile=10x6:padding=3" -frames:v 1 "$A/contact.jpg"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V/public/footage/talk-v1.mp4")
for t in 0.15 0.5 0.85; do
  ts=$(awk "BEGIN{print $D*$t}")
  ffmpeg -nostdin -v error -y -ss "$ts" -i "$V/public/footage/talk-v1.mp4" -frames:v 1 -vf "scale=540:960,drawgrid=w=540:h=50:t=1:c=orange@0.7" "$A/g-$t.png"
done
ffmpeg -nostdin -v error -y -i "$A/g-0.15.png" -i "$A/g-0.5.png" -i "$A/g-0.85.png" -filter_complex hstack=3 "$A/grid.jpg"
NF=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$V/public/footage/talk-v1.mp4")
echo "durationFrames = $NF  (→ PROJECT.durationFrames)"
echo "grid lines every 100 source px (50 at half scale): read analysis/grid.jpg to set PROJECT.face.splitSy / cx / cy"
