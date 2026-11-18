"""Build the music bed from the user's pick: bar-aligned splices of the source track (skip breaks, loop the groove)
so it covers the reel from `start` to the end, with a fade-out. Writes remotion-video/public/audio/music-bed-vN.wav.
  python3 music_bed.py <project> <track.mp3> <plan.json>
plan.json: {"version": 2, "start_s": 3.0, "first_hit_src": 13.65, "pre_roll": 0.03, "total_s": 115.03,
            "segments": [[13.62, 41.08], [54.80, 89.08], [13.65, 41.08], [54.80, 78.0]], "fade_out_s": 1.6}
- start_s = video second where the bed starts (the first hit lands at start_s + pre_roll); the user decides it
  (« Kifech » reel: 3.0 s, the first 808 on « والصوت »).
- segments = source ranges in seconds, cut on bar lines (music LIST.md of the music agent gives the structure);
  30 ms triangular crossfades join them. Output length = total_s − start_s.
Then set src/edit/music.ts: from = round(start_s × 30), file = "audio/music-bed-vN.wav", volume ≈ 0.085.
"""
import json
import os
import subprocess
import sys

P, SRC, PLAN = os.path.abspath(sys.argv[1]), sys.argv[2], json.load(open(sys.argv[3]))
segs = PLAN["segments"]
length = PLAN["total_s"] - PLAN["start_s"]
fade = PLAN.get("fade_out_s", 1.6)
v = PLAN.get("version", 1)
parts, labels = [], []
for i, (a, b) in enumerate(segs):
    parts.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS[s{i}]")
    labels.append(f"s{i}")
chain, cur = [], labels[0]
for i, nxt in enumerate(labels[1:], 1):
    out = f"x{i}"
    chain.append(f"[{cur}][{nxt}]acrossfade=d=0.03:c1=tri:c2=tri[{out}]")
    cur = out
fc = ";".join(parts + chain) + f";[{cur}]atrim=0:{length:.3f},afade=t=in:st=0:d=0.02,afade=t=out:st={length - fade:.3f}:d={fade}[out]"
dst = f"{P}/remotion-video/public/audio/music-bed-v{v}.wav"
os.makedirs(os.path.dirname(dst), exist_ok=True)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", SRC, "-filter_complex", fc, "-map", "[out]", "-ar", "48000", "-ac", "2", dst], check=True)
dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst], capture_output=True, text=True).stdout.strip()
lu = subprocess.run(["ffmpeg", "-nostdin", "-i", dst, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
I = [l for l in lu.splitlines() if l.strip().startswith("I:")][-1].strip()
print(f"{dst}  {dur} s  {I}  → music.ts: from = {round(PLAN['start_s'] * 30)}, volume ≈ 10^((−34 − LUFS)/20)")
