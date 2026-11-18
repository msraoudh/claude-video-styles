#!/usr/bin/env bash
# mix.sh <bed.wav> <vo.wav> <vo+sfx stem.wav> <out.m4a> [music_gain_dB=-3.5]
# Audition mix of a candidate music bed: stem = the video rendered with --props='{"noMusic":true}' (voice+SFX only) -> stem + voice-keyed ducked bed, loudnorm -14/-2 (2-pass, linear) + alimiter 0.7, DUR s, AAC 256k
set -euo pipefail
DUR=${DUR:-45}; PAD=$(python3 -c "print($DUR+1)")  # DUR = video length (s)
bed="$1"; vo="$2"; stem="$3"; out="$4"; g="${5:--3.5}"; tmp="$(mktemp -d)"
ffmpeg -nostdin -v error -y -i "$bed" -i "$vo" -i "$stem" -filter_complex \
"[1:a]aresample=48000,highpass=f=100,volume=24dB,alimiter=limit=0.5:attack=1:release=30:level=disabled,pan=stereo|c0=c0|c1=c0,apad=whole_dur=$PAD[key];\
[0:a]volume=${g}dB[m];[m][key]sidechaincompress=threshold=0.095:ratio=2:attack=20:release=250:knee=2:detection=rms:makeup=1[d];\
[2:a]aresample=48000,apad=whole_dur=$PAD[st];[st][d]amix=inputs=2:normalize=0:duration=longest,atrim=duration=$DUR[mix]" -map "[mix]" -c:a pcm_f32le "$tmp/mix.wav"
J=$(ffmpeg -nostdin -hide_banner -nostats -i "$tmp/mix.wav" -af loudnorm=I=-14:TP=-2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
mi=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
read ii itp ilra ith off <<<"$mi"
ffmpeg -nostdin -v error -y -i "$tmp/mix.wav" -af "loudnorm=I=-14:TP=-2:LRA=11:measured_I=$ii:measured_TP=$itp:measured_LRA=$ilra:measured_thresh=$ith:offset=$off:linear=true,aresample=48000,alimiter=limit=0.7:attack=3:release=80:level=disabled,atrim=duration=$DUR" -c:a pcm_f32le "$tmp/master.wav"
ffmpeg -nostdin -v error -y -i "$tmp/master.wav" -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$out"
R=$(ffmpeg -nostdin -hide_banner -nostats -i "$out" -af ebur128=peak=true -f null - 2>&1 | awk '/Summary/{s=1} s&&/I:/{i=$2} s&&/Peak:/{p=$2} END{print i, p}')
echo "mix $out premaster I=$ii TP=$itp -> final I/TP(dBTP): $R dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")"
cp "$tmp/master.wav" "${out%.m4a}.master.wav.tmp" 2>/dev/null || true
rm -rf "$tmp"
