"""Print transcripts compactly (code, language, stats, caption, then segments with their start second).
Run in the project folder: python3 ~/.claude/skills/aura-trailer/scripts/ig_txt.py [code ...]"""
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402

D = tlib.path("analysis/transcripts")
rj = tlib.path("analysis/reels.json")
meta = {r["code"]: r for r in json.load(open(rj))} if os.path.exists(rj) else {}
codes = sys.argv[1:] or sorted(os.path.basename(p)[:-5] for p in glob.glob(f"{D}/*.json"))
for c in codes:
    t = json.load(open(f"{D}/{c}.json"))
    m = meta.get(c, {})
    print(f"\n=== #{m.get('n')} {c} [{t['lang']} {t['lang_p']}] {m.get('dur')}s views={m.get('views')} likes={m.get('likes')} | {m.get('caption', '')[:80]!r}")
    print(" ".join(f"[{s['s']:.0f}] {s['t']}" for s in t["segments"]))
