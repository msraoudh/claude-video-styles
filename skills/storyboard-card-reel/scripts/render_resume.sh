#!/bin/bash
# Re-render only the missing chunks of a render_parallel.sh run (same bundle), then concat + mux + phone copy.
#   bash render_resume.sh <reel-dir> <version> <mix.wav> [workers=2] [scale=2]
set -uo pipefail
R=$(cd "${1:?reel dir}" && pwd); N=${2:?version}; MIX=$(cygpath -u "$(realpath "${3:?mix wav}")"); WORKERS=${4:-2}; SCALE=${5:-2}
V=$R/remotion-video
cd "$V" || exit 1
export SHIM_MCCOMPAT=0x800000001 SCALE
export C=out/chunks-v$N
mkdir -p "$C/tmp"
export TEMP="$(cygpath -w "$V/$C/tmp")" TMP="$(cygpath -w "$V/$C/tmp")"
[ -d "$C/bundle" ] || npx remotion bundle --out-dir="$C/bundle" --log=error || exit 1
START=$(date +%s)
render_one() {
  local i=$1 a=$2 b=$3 f
  f=$(printf "c%02d.mkv" "$i")
  if npx remotion render "$C/bundle" Showcase "$C/$f" --codec=h264-mkv --muted --crf=17 --scale="$SCALE" --frames="$a-$b" --concurrency=1 --gl=angle --timeout=300000 > "$C/$f.log" 2>&1; then
    echo "chunk $i done ($a-$b)"; return 0
  fi
  echo "CHUNK_FAILED $i ($a-$b)"; return 1
}
export -f render_one
: > "$C/missing.txt"
while read -r i a b; do f=$(printf "c%02d.mkv" "$i")
  # a chunk is done when its file holds all its frames (no log needed)
  n=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$C/$f" 2>/dev/null)
  [ "${n:-0}" -ge $((b - a + 1)) ] && continue
  echo "$i $a $b" >> "$C/missing.txt"; done < "$C/jobs.txt"
echo "missing: $(tr '\n' ';' < "$C/missing.txt")"
xargs -P "$WORKERS" -L 1 bash -c 'render_one "$0" "$1" "$2"' < "$C/missing.txt" || { echo "RENDER FAILED"; exit 1; }
echo "missing chunks took $(( $(date +%s) - START )) s"
ffmpeg -nostdin -v error -y -f concat -safe 0 -i "$C/list.txt" -c copy "$C/picture.mkv" || exit 1
GAIN=$(ffmpeg -nostdin -hide_banner -nostats -i "$MIX" -af ebur128=framelog=quiet -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{printf "%.2f", -14 - $2}')
echo "master gain $GAIN dB"
ffmpeg -nostdin -v error -y -i "$C/picture.mkv" -i "$MIX" -map 0:v -map 1:a -c:v copy -af "volume=${GAIN}dB,alimiter=limit=0.85:level=false,aresample=48000" -c:a aac -b:a 256k -movflags +faststart -shortest "$R/out/reel-v$N.mp4" || exit 1
ffmpeg -nostdin -hide_banner -nostats -i "$R/out/reel-v$N.mp4" -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):"
ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=codec_name,nb_read_packets,width,height,r_frame_rate -of csv=p=0 "$R/out/reel-v$N.mp4"
ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$R/out/reel-v$N.mp4"
ffmpeg -nostdin -v error -y -i "$R/out/reel-v$N.mp4" -vf scale=1080:1920 -c:v libx264 -preset medium -crf 27 -maxrate 2.2M -bufsize 4.4M -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$R/out/reel-v$N-phone.mp4"
ls -la "$R/out/reel-v$N.mp4" "$R/out/reel-v$N-phone.mp4"
rm -rf "$C/tmp" "$C/bundle"
echo "RENDER_OK"
