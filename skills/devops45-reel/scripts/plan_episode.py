"""episode.json + plan/voice.json → scene ranges on the global timeline.

Writes plan/scenes.json and video/src/data/episode.ts (EPISODE meta, SCENES with from/to/phrases/data, KEY frames).
  python plan_episode.py <project>           (after place_voice.py)
  python plan_episode.py <project> --check   validate episode.json only (no voice needed) — run it right after
                                             writing episode.json; exit code 1 + a list of problems if invalid
"""
import json
import sys

import elib

TYPES = {"hook", "terminal", "code", "steps", "cards", "compare", "myth", "analogy", "flow", "stat", "incident", "cta", "tool",
         "custom"}
P = elib.proj()
ep = elib.load_episode(P)


def check(ep):
    bad = []
    sc = ep.get("scenes") or []
    if len(sc) < 4:
        bad.append("need ≥ 4 scenes (hook, ≥ 2 body, cta)")
    ids = [s.get("id") for s in sc]
    if len(set(ids)) != len(ids) or "title" in ids:
        bad.append("scene ids must be unique and not 'title' (the series ident is inserted automatically)")
    for s in sc:
        if s.get("type") not in TYPES:
            bad.append(f"{s.get('id')}: unknown type {s.get('type')!r} (one of {sorted(TYPES)})")
        if not s.get("say", "").strip():
            bad.append(f"{s.get('id')}: empty `say` (every scene carries its exact voice-over sentences)")
        if s.get("type") == "custom" and not s.get("data", {}).get("component"):
            bad.append(f"{s.get('id')}: custom scene needs data.component (folder in src/scenes/)")
    if sc and sc[0].get("type") != "hook":
        bad.append("first scene must be type 'hook'")
    if sc and sc[-1].get("type") != "cta":
        bad.append("last scene must be type 'cta'")
    t = ep.get("title") or {}
    if not t.get("line"):
        bad.append("title.line missing (the episode title shown in the series ident, ≤ 32 chars)")
    elif len(t["line"]) > 34:
        bad.append(f"title.line is {len(t['line'])} chars (≤ 34)")
    words = len(elib.clean_script(ep).split())
    if not 85 <= words <= 140:
        bad.append(f"script is {words} words (aim 105–120 for 45 s)")
    for s in sc:
        d = s.get("data", {})
        for k in ("line", "command", "myth", "fact", "label"):
            v = d.get(k)
            if isinstance(v, str) and len(v) > 60:
                bad.append(f"{s['id']}: data.{k} is {len(v)} chars — on-screen text must stay short (≤ 60)")
    return bad


problems = check(ep)
if "--check" in sys.argv:
    print("\n".join(problems) if problems else f"episode.json OK — {len(ep['scenes'])} scenes, "
          f"{len(elib.clean_script(ep).split())} words, {len(elib.phrases(ep))} phrases")
    sys.exit(1 if problems else 0)
if problems:
    print("WARNING episode.json:\n  " + "\n  ".join(problems))

vp = json.load(open(f"{P}/plan/voice.json", encoding="utf-8"))
NF, FPS = vp["durationInFrames"], vp["fps"]
PH = vp["phrases"]
by_scene = {}
for p in PH:
    by_scene.setdefault(p["scene"], []).append(p)

scenes = []
order = [ep["scenes"][0]] + [{"id": "title", "type": "title", "data": {}}] + ep["scenes"][1:]
tg = vp.get("title_gap")
for i, s in enumerate(order):
    ph = by_scene.get(s["id"], [])
    if i == 0:
        frm = 0
    elif s["id"] == "title":
        # the series ident fills the silence after the hook; the music drop lands on its first frame
        frm = int(round(tg[0] * FPS)) + 2 if tg else by_scene[order[0]["id"]][-1]["to"] + 2
    elif order[i - 1]["id"] == "title":
        frm = ph[0]["from"] - 2  # hard cut from the ident onto the first body word
    else:
        # body cut: the new visual lands 8 frames before its first word, never before the previous scene's last word ends
        prev_last = scenes[-1]["phrases"] and by_scene[scenes[-1]["id"]][-1]["to"] or scenes[-1]["from"]
        frm = max(prev_last + 1, ph[0]["from"] - 8)
    scenes.append({"id": s["id"], "type": s["type"], "from": frm, "to": NF,
                   "phrases": [p["id"] for p in ph],
                   "captions": s["type"] not in ("title", "cta") and s.get("data", {}).get("captions", True) is not False,
                   "data": s.get("data", {})})
for a, b in zip(scenes, scenes[1:]):
    a["to"] = b["from"]
for s in scenes:
    if s["to"] - s["from"] < 30:
        print(f"WARNING scene {s['id']} is only {s['to'] - s['from']} frames")

title = next(s for s in scenes if s["id"] == "title")
cta = scenes[-1]
KEY = {"drop": title["from"], "titleFrom": title["from"], "titleTo": title["to"], "ctaFrom": cta["from"],
       "finalHit": vp["final_hit_f"], "end": NF}
meta = {k: ep.get(k) for k in ("id", "number", "series", "category", "format", "topic")}
meta["series"] = meta["series"] or "DevOps en 45 secondes"
meta["title"] = ep.get("title", {})
meta["page"] = ep.get("page", "Your Page")
meta["handle"] = ep.get("handle", "@your_page")
elib.wjson(f"{P}/plan/scenes.json", {"key": KEY, "scenes": scenes, "meta": meta})
import os
os.makedirs(f"{P}/video/src/data", exist_ok=True)
with open(f"{P}/video/src/data/episode.ts", "w", encoding="utf-8") as fh:
    fh.write(elib.ts_header("plan_episode.py"))
    fh.write("/* eslint-disable @typescript-eslint/no-explicit-any */\n")
    fh.write("export type SceneSpec = {id: string; type: string; from: number; to: number; phrases: string[]; captions: boolean; data: any};\n")
    fh.write(f"export const EPISODE = {json.dumps(meta, ensure_ascii=False, indent=1)} as const;\n")
    fh.write(f"export const SCENES: SceneSpec[] = {json.dumps(scenes, ensure_ascii=False, indent=1)};\n")
    fh.write(f"export const KEY = {json.dumps(KEY)} as const;\n")
    fh.write("export const scene = (id: string) => SCENES.find((s) => s.id === id)!;\n")
for s in scenes:
    print(f"{s['id']:6s} {s['type']:9s} {s['from']:5d}–{s['to']:5d}  ({(s['to'] - s['from']) / FPS:4.1f} s)  {' '.join(s['phrases'])}")
print("KEY", KEY)
