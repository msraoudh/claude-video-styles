#!/bin/bash
# Final render of the user's reel (composition Showcase) at 4K: chunks of 300 frames, several browsers on the RTX
# (--gl=angle + SHIM_MCCOMPAT for this process only), muted picture, then the mastered mix muxed on.
#   bash render_parallel.sh <reel-dir> <version> <mix.wav> [workers=2] [concurrency=1] [scale=2]
set -uo pipefail
R=$(cd "${1:?reel dir}" && pwd); N=${2:?version}; MIX=$(cygpath -u "$(realpath "${3:?mix wav}")"); WORKERS=${4:-2}; CONC=${5:-1}; SCALE=${6:-2}
# 4K Showcase: 4 workers x concurrency 2 ran out of RAM (32 GB) decoding the 4K footage. 2 x 1 is safe (~700 s per 5 chunks).
V=$R/remotion-video
cd "$V" || exit 1
export SHIM_MCCOMPAT=0x800000001
export CONC SCALE
TOTAL=$(node -e "const c=require('./src/data/clean.json');process.stdout.write(String(c.totalF+60))")  # clean.totalF + TAIL (src/lib/time.ts)
export C=out/chunks-v$N
rm -rf "$C"; mkdir -p "$C" "$C/tmp"
export TEMP="$(cygpath -w "$V/$C/tmp")" TMP="$(cygpath -w "$V/$C/tmp")"
npx tsc --noEmit || exit 1
npx remotion bundle --out-dir="$C/bundle" --log=error || exit 1
START=$(date +%s)
( while :; do nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader,nounits >> "$C/gpu.log"; sleep 10; done ) &
GPULOG=$!
render_one() {
  local i=$1 a=$2 b=$3 f conc
  f=$(printf "c%02d.mkv" "$i")
  for conc in "$CONC" 1; do
    if npx remotion render "$C/bundle" Showcase "$C/$f" --codec=h264-mkv --muted --crf=17 --scale="$SCALE" --frames="$a-$b" --concurrency="$conc" --gl=angle --timeout=240000 > "$C/$f.log" 2>&1; then
      echo "chunk $i done ($a-$b) at concurrency $conc"; return 0
    fi
    echo "chunk $i ($a-$b) failed at concurrency $conc, retrying"
  done
  echo "CHUNK_FAILED $i ($a-$b)"; return 1
}
export -f render_one
: > "$C/jobs.txt"; : > "$C/list.txt"
a=0; i=0
while [ "$a" -lt "$TOTAL" ]; do
  b=$((a + 299)); [ "$b" -ge "$TOTAL" ] && b=$((TOTAL - 1)); i=$((i + 1))
  echo "$i $a $b" >> "$C/jobs.txt"; echo "file '$(printf "c%02d.mkv" "$i")'" >> "$C/list.txt"; a=$((b + 1))
done
xargs -P "$WORKERS" -L 1 bash -c 'render_one "$0" "$1" "$2"' < "$C/jobs.txt"
STATUS=$?
kill "$GPULOG" 2>/dev/null
if [ "$STATUS" != 0 ]; then
  echo "RENDER FAILED"; for l in "$C"/*.log; do sed 's/\x1b\[[0-9;]*m//g' "$l" | grep -iE "error|crash|timeout" | head -3 | cut -c1-240; done; exit 1
fi
echo "picture took $(( $(date +%s) - START )) s"
ffmpeg -nostdin -v error -y -f concat -safe 0 -i "$C/list.txt" -c copy "$C/picture.mkv" || exit 1
GAIN=$(ffmpeg -nostdin -hide_banner -nostats -i "$MIX" -af ebur128=framelog=quiet -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{printf "%.2f", -14 - $2}')
echo "master gain $GAIN dB"
mkdir -p "$R/out"
ffmpeg -nostdin -v error -y -i "$C/picture.mkv" -i "$MIX" -map 0:v -map 1:a -c:v copy -af "volume=${GAIN}dB,alimiter=limit=0.85:level=false,aresample=48000" -c:a aac -b:a 256k -movflags +faststart -shortest "$R/out/reel-v$N.mp4" || exit 1
echo "total $(( $(date +%s) - START )) s"
ffmpeg -nostdin -hide_banner -nostats -i "$R/out/reel-v$N.mp4" -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):"
ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=codec_name,nb_read_packets,width,height,r_frame_rate -of csv=p=0 "$R/out/reel-v$N.mp4"
ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$R/out/reel-v$N.mp4"
ffmpeg -nostdin -v error -y -i "$R/out/reel-v$N.mp4" -vf scale=1080:1920 -c:v libx264 -preset medium -crf 27 -maxrate 2.2M -bufsize 4.4M -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$R/out/reel-v$N-phone.mp4"
ls -la "$R/out/reel-v$N.mp4" "$R/out/reel-v$N-phone.mp4"
sort -n "$C/gpu.log" | awk -F, '{u[NR]=$1; if($2>m)m=$2} END {print "GPU use: median " u[int(NR/2)+1] " %, max " u[NR] " %, memory max " m " MiB"}'
rm -rf "$C/tmp" "$C/bundle"
echo "RENDER_OK"
