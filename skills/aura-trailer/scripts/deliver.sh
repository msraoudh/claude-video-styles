#!/bin/bash
# Full delivery: (render) -> mix -> master -> audio QA -> mux two versions -> decode check -> copy to the Desktop.
#   v=v1 bash ~/.claude/skills/aura-trailer/scripts/deliver.sh              (renders first)
#   SKIP_RENDER=1 v=v2 bash ~/.claude/skills/aura-trailer/scripts/deliver.sh (reuse out/raw.mp4)
# Master: two-pass loudnorm to -14 LUFS, then a 4x-oversampled true-peak limiter at -3 dBFS so the AAC encode stays
# <= -1 dBTP. Video stream is copied untouched (no generation loss). Versions:
#   <slug>-9x16-<v>.mp4               the trailer
#   <slug>-9x16-<v>-sans-musique.mp4  voice + SFX only (to add the song in Instagram/TikTok/CapCut, licence-safe)
set -e
SK=$(cd "$(dirname "$0")" && pwd)
P=${TRAILER:-$PWD}
V=${v:-v1}
cd "$P"
SLUG=$(python3 -c "import json;print(json.load(open('trailer.json'))['slug'])")
DESK=$(python3 -c "import json;print(json.load(open('trailer.json')).get('deliver',{}).get('desktop_dir',''))")
[ "${SKIP_RENDER:-0}" = "1" ] || bash "$SK/render.sh"
[ -f out/raw.mp4 ] || { echo "out/raw.mp4 missing"; exit 1; }
~/.venvs/audio/bin/python "$SK/mix.py" > audio/out/cues.log 2>&1 || { tail -20 audio/out/cues.log; exit 1; }
cd audio/out
master() {  # master <in.wav> <out.wav>
  ffmpeg -nostdin -hide_banner -nostats -y -i "$1" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2> ln.json || true
  ARGS=$(python3 -c "
import json
t=open('ln.json').read(); j=json.loads(t[t.rfind('{'):t.rfind('}')+1])
print(f\"measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}\")")
  ffmpeg -nostdin -v error -y -i "$1" -af "loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:$ARGS,aresample=192000,alimiter=limit=0.708:attack=1:release=60:level=disabled,aresample=48000" -ar 48000 -c:a pcm_s24le "$2"
}
master mix.wav mix-master.wav
master nomusic.wav nomusic-master.wav
cd "$P"
mkdir -p qa
bash "$SK/wpy.sh" qa_mix.py > qa/audio-qa.txt 2>&1 || echo "audio QA failed (see qa/audio-qa.txt)"
for kind in "" "-sans-musique"; do
  A=audio/out/mix-master.wav; [ -n "$kind" ] && A=audio/out/nomusic-master.wav
  ffmpeg -nostdin -v error -y -i out/raw.mp4 -i $A -map 0:v -map 1:a -c:v copy -c:a aac -profile:a aac_low -b:a 256k -ar 48000 -ac 2 \
    -shortest -movflags +faststart "out/$SLUG-9x16-$V$kind.mp4"
  ffmpeg -nostdin -v error -i "out/$SLUG-9x16-$V$kind.mp4" -f null - && echo "DECODE_OK $SLUG-9x16-$V$kind.mp4"
done
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact "out/$SLUG-9x16-$V.mp4"
ffmpeg -nostdin -hide_banner -nostats -i "out/$SLUG-9x16-$V.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^ +(I|Peak):" | tr -s ' '
if [ -n "$DESK" ]; then
  mkdir -p "$DESK"
  cp "out/$SLUG-9x16-$V.mp4" "out/$SLUG-9x16-$V-sans-musique.mp4" "$DESK/"
  ls -la "$DESK"
fi
