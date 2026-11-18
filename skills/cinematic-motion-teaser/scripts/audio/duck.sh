#!/usr/bin/env bash
# duck.sh <bed.wav> <vo.wav> <out_ducked.wav> <music_gain_dB> <threshold=0.095> <ratio=2>
# voice-keyed sidechain ducking of a music bed (for measuring/auditioning; Remotion does the real ducking via volume callbacks)
set -euo pipefail
PAD=$(python3 -c "print(${DUR:-45}+1)")
ffmpeg -nostdin -v error -y -i "$1" -i "$2" -filter_complex \
"[1:a]aresample=48000,highpass=f=100,volume=24dB,alimiter=limit=0.5:attack=1:release=30:level=disabled,pan=stereo|c0=c0|c1=c0,apad=whole_dur=$PAD[key];\
[0:a]volume=${4}dB[m];[m][key]sidechaincompress=threshold=${5:-0.095}:ratio=${6:-2}:attack=20:release=250:knee=2:detection=rms:makeup=1[d]" -map "[d]" -c:a pcm_f32le "$3"
