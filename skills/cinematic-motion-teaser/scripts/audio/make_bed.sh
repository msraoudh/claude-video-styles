#!/usr/bin/env bash
# make_bed.sh <track.mp3> <start_s> <out.wav>  -> (DUR+1) s bed, 48k stereo, HP 30 Hz, -3 dB @2.6 kHz voice pocket,
#   fade in 0.8 / fade out over the last 2.5 s of the video, ~-16 LUFS.  DUR = video length in s (env, default 45)
set -euo pipefail
DUR=${DUR:-45}; BED=$(python3 -c "print($DUR+1)"); FO=$(python3 -c "print($DUR-2.5)")
in="$1"; st="$2"; out="$3"; tmp="$(mktemp -d)"
ffmpeg -nostdin -v error -y -i "$in" -af "aresample=48000,aformat=channel_layouts=stereo,atrim=start=$st:duration=$BED,asetpts=PTS-STARTPTS,highpass=f=30:poles=2,equalizer=f=2600:t=o:w=1.3:g=-3,afade=t=in:st=0:d=0.8,afade=t=out:st=$FO:d=2.5,apad=whole_dur=$BED" -c:a pcm_f32le "$tmp/a.wav"
I=$(ffmpeg -nostdin -hide_banner -nostats -i "$tmp/a.wav" -af ebur128 -f null - 2>&1 | awk '/Summary/{s=1} s&&/I:/{print $2; exit}')
g=$(python3 -c "print(round(-16-($I),2))")
ffmpeg -nostdin -v error -y -i "$tmp/a.wav" -af "volume=${g}dB" -c:a pcm_f32le "$tmp/b.wav"
TP=$(ffmpeg -nostdin -hide_banner -nostats -i "$tmp/b.wav" -af ebur128=peak=true -f null - 2>&1 | awk '/Summary/{s=1} s&&/Peak:/{print $2; exit}')
lim=""
if python3 -c "import sys; sys.exit(0 if float('$TP')>-1.5 else 1)"; then lim=",alimiter=limit=0.82:attack=2:release=60:level=disabled"; fi
ffmpeg -nostdin -v error -y -i "$tmp/b.wav" -af "anull$lim,atrim=duration=$BED" -ar 48000 -ac 2 -c:a pcm_s24le "$out"
I2=$(ffmpeg -nostdin -hide_banner -nostats -i "$out" -af ebur128=peak=true -f null - 2>&1 | awk '/Summary/{s=1} s&&/I:/{i=$2} s&&/Peak:/{p=$2} END{print i, p}')
echo "bed $out srcI=$I gain=$g tpBefore=$TP limiter=${lim:+yes} -> I/TP: $I2 dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")"
rm -rf "$tmp"
