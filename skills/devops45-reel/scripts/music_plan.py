"""Place the series track so its DROP lands on the series ident (KEY.drop), write plan/music.json + data/beats.ts.
Run after plan_episode.py (needs plan/scenes.json). Track = episode.json music.track (default "up").
  ~/.venvs/audio/bin/python music_plan.py <project>
"""
import json
import os
import shutil
import sys

import elib

P = elib.proj()
ep = elib.load_episode(P)
key = (ep.get("music") or {}).get("track", "calm")
D = f"{elib.SKILL}/assets/music/{key}"
if not os.path.exists(f"{D}/meta.json"):
    sys.exit(f"no track '{key}' in {elib.SKILL}/assets/music (add one with music_add.py)")
m = json.load(open(f"{D}/meta.json"))
sc = json.load(open(f"{P}/plan/scenes.json"))
NF, FPS = sc["key"]["end"], elib.FPS
drop_v = sc["key"]["drop"] / FPS
BED = m.get("mode") == "bed"                     # calm bed (episodes): no drop, plays from start_s
offset = round(m.get("start_s", 0.0), 3) if BED else round(m["drop_s"] - drop_v, 3)  # source seconds at video 0
if offset < 0 or offset + NF / FPS > m["duration_s"]:
    print(f"WARNING: track '{key}' does not cover the episode (offset {offset}, {m['duration_s']} s long)")
os.makedirs(f"{P}/audio/music", exist_ok=True)
dst = f"{P}/audio/music/track.flac"
if not os.path.exists(dst):
    shutil.copy(f"{D}/track.flac", dst)


def vf(t):
    return int(round((t - offset) * FPS))


beats = [vf(t) for t in m["beats_s"]]
downs = [vf(t) for t in m["downbeats_s"]]
# the tracker can lose the grid: extend at the measured period to cover the episode
bs = m["beats_s"]
period = (bs[-1] - bs[-17]) / 16
t = bs[-1]
while vf(t + period) < NF:
    t += period
    beats.append(vf(t))
td, dp = m["downbeats_s"][-1], period * m["beats_per_bar"]
while vf(td + dp) < NF:
    td += dp
    downs.append(vf(td))
beats = [b for b in beats if 0 <= b < NF]
downs = [d for d in downs if 0 <= d < NF]
hits = [{"f": vf(t), "rise": r} for t, r in m["sub_hits"] if 0 <= vf(t) < NF]
o60 = int(round(offset * FPS))
subenv = (m["sub_env_60"][o60:o60 + NF] + [0.0] * NF)[:NF]
mp = {"track": key, "file": dst, "offset": offset, "title": m["title"], "credit": m["credit"], "licence": m["licence"],
      "bpm": m["bpm"], "drop_video_s": round(drop_v, 3), "mode": "bed" if BED else "drop"}
elib.wjson(f"{P}/plan/music.json", mp)
os.makedirs(f"{P}/video/src/data", exist_ok=True)
with open(f"{P}/video/src/data/beats.ts", "w", encoding="utf-8") as fh:
    fh.write(elib.ts_header("music_plan.py") + f"// « {m['title']} » ({m['credit']}), drop on the series ident = frame {sc['key']['drop']}.\n")
    fh.write(f"export const BEATS: number[] = {json.dumps(beats)};\n")
    fh.write(f"export const DOWNBEATS: number[] = {json.dumps(downs)};\n")
    fh.write(f"export const HITS: {{ f: number; rise: number; level: number }}[] = {json.dumps([dict(h, level=0) for h in hits])};\n")
    fh.write(f"export const SUB_ENV: number[] = {json.dumps(subenv)};\n")
    fh.write(f"export const MUSIC = {{ file: \"music/track.flac\", offset: {offset}, bpm: {m['bpm']} }};\n")
print(f"music '{key}' offset {offset} s · drop at {drop_v:.2f} s · {len(beats)} beats · {len(hits)} sub hits")
