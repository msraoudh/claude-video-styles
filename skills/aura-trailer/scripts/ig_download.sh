#!/bin/bash
# Download public Instagram reels (video + .info.json metadata) with yt-dlp into <project>/source/.
#   bash ig_download.sh source/codes.txt        (one reel code per line, from ig_codes.js)
#   bash ig_download.sh DeFHsJoIH04 DZAcM0noCTq  (codes as arguments)
# Public reels need no login. Already-downloaded codes are skipped; 4 s between downloads (Instagram rate-limits).
# WSL may have no internet while the Windows VPN is on: then download from PowerShell into the UNC path.
P=${TRAILER:-$PWD}
mkdir -p "$P/source"
if [ ! -x ~/.venvs/ytdl/bin/yt-dlp ]; then
  python3 -m venv ~/.venvs/ytdl && ~/.venvs/ytdl/bin/pip -q install -U yt-dlp
fi
if [ -f "$1" ]; then CODES=$(grep -v '^\s*#' "$1" | awk '{print $1}'); else CODES="$*"; fi
cd "$P/source" || exit 1
for c in $CODES; do
  [ -f "$c.mp4" ] && continue
  ~/.venvs/ytdl/bin/yt-dlp -q --no-warnings -o "%(id)s.%(ext)s" --write-info-json "https://www.instagram.com/reel/$c/" < /dev/null || echo "FAIL $c"
  sleep 4
done
ls *.mp4 2>/dev/null | wc -l
