#!/usr/bin/env bash
# master.sh <raw.mp4> <final.mp4> [I=-14] [TP=-2] [LIMIT=0.7]
# Social-ready audio master for a rendered Remotion video, picture untouched (-c:v copy):
#   two-pass linear loudnorm to I LUFS / TP dBTP, 48 kHz, then a brick-wall alimiter at LIMIT (0.7 ≈ -3.1 dBFS)
#   because Remotion's summed VO + SFX + music bed can hit 0 dBTP on transients.
# NearMatch 9:16 result: -15.9 LUFS integrated, -3.0 dBTP. Verify: true peak must be <= -1.5 dBTP.
set -euo pipefail
in="$1"; out="$2"; I="${3:--14}"; TP="${4:--2}"; LIM="${5:-0.7}"
J=$(ffmpeg -nostdin -hide_banner -nostats -i "$in" -vn -af "loudnorm=I=$I:TP=$TP:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
read -r ii itp ilra ith off < <(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
ffmpeg -nostdin -v error -y -i "$in" -c:v copy \
  -af "loudnorm=I=$I:TP=$TP:LRA=11:measured_I=$ii:measured_TP=$itp:measured_LRA=$ilra:measured_thresh=$ith:offset=$off:linear=true,aresample=48000,alimiter=limit=$LIM:attack=3:release=80:level=disabled" \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$out"
R=$(ffmpeg -nostdin -hide_banner -nostats -i "$out" -vn -af ebur128=peak=true -f null - 2>&1 | awk '/Summary/{s=1} s&&/I:/{i=$2} s&&/Peak:/{p=$2} END{print i" LUFS, true peak "p" dBTP"}')
echo "master $out  (input I=$ii TP=$itp)  ->  $R"
python3 - "$R" <<'EOF'
import sys,re
p=float(re.findall(r"peak (-?[\d.]+)",sys.argv[1])[0])
print("OK peak <= -1.5 dBTP" if p<=-1.5 else f"!! peak {p} dBTP > -1.5 — lower LIMIT (e.g. 0.6) and re-run")
EOF
