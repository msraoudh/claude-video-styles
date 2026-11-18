#!/bin/bash
# Prepare the song: optional slow-down (asetrate, pitch drops with it, the "slowed" edit sound), then the beat grid
# (music-to-video's analyze-beatgrid.py: beats, downbeats, drops, hard stops, silences, energy phases) and the
# 808 analysis (bass.py). Run in the project folder:
#   bash ~/.claude/skills/aura-trailer/scripts/music_prep.sh music/song.mp3 0.85 [name]
# -> music/<name>.wav (48 kHz), music/audiomap.json, music/bass.json, video/public/music/<name>.wav
set -e
SK=$(cd "$(dirname "$0")" && pwd)
P=${TRAILER:-$PWD}
IN=$1; RATE=${2:-1}; NAME=${3:-$(basename "${IN%.*}" | tr ' ' '-')}
[ "$RATE" != "1" ] && NAME="$NAME-slowed$(python3 -c "print(int(round($RATE*100)))")"
cd "$P"
mkdir -p music video/public/music
if [ ! -x ~/.venvs/audio/bin/python ]; then
  python3 -m venv ~/.venvs/audio && ~/.venvs/audio/bin/pip -q install librosa numpy scipy soundfile
fi
SRATE=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "$IN")
if [ "$RATE" = "1" ]; then
  ffmpeg -nostdin -v error -y -i "$IN" -ar 48000 -ac 2 -c:a pcm_s16le "music/$NAME.wav"
else
  ffmpeg -nostdin -v error -y -i "$IN" -af "asetrate=$SRATE*$RATE,aresample=48000" -ac 2 -c:a pcm_s16le "music/$NAME.wav"
fi
cp "music/$NAME.wav" video/public/music/
BG=""
for c in "$SK/analyze-beatgrid.py" ~/.claude/skills/music-to-video/scripts/analyze-beatgrid.py \
         /mnt/c/Users/*/.agents/skills/music-to-video/scripts/analyze-beatgrid.py /mnt/c/Users/*/.claude/skills/music-to-video/scripts/analyze-beatgrid.py; do
  [ -f "$c" ] && { BG=$c; break; }
done
[ -n "$BG" ] || { echo "analyze-beatgrid.py not found (music-to-video skill)"; exit 1; }
~/.venvs/audio/bin/python "$BG" "music/$NAME.wav" -o music/audiomap.json --print 2>&1 | tail -60
~/.venvs/audio/bin/python "$SK/bass.py" "music/$NAME.wav" music/bass.json
echo "music/$NAME.wav ready — set trailer.json music.file to it and pick music.offset_s"
