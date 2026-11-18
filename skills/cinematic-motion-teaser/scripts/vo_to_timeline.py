#!/usr/bin/env python3
"""Voiceover word timings -> Remotion master clock (src/data/timeline.ts + src/data/captions.json).

The voiceover is the master clock of the whole video. Every scene boundary, caption and
beat is derived from the spoken words, so changing the VO = re-running this script.

Usage
-----
  # real VO timings (ElevenLabs alignment, Whisper, or vo_repace.py output):
  python3 vo_to_timeline.py --words placed.json --scenes scenes.json --out-dir video/src/data \
      [--fps 60] [--total-seconds 45] [--tail 8.5]

  # no VO yet: estimate timings from the script so the project renders today
  python3 vo_to_timeline.py --script "Line one. Line two." --wps 2.6 --scenes scenes.json --out-dir ...

words JSON: a list of {"w"|"word"|"text": str, "s"|"start": sec, "e"|"end": sec}. Times are
ABSOLUTE seconds in the final video (i.e. after any lead-in / re-pacing gaps).

scenes JSON: ordered list, one entry per scene, each starting at a word index:
  [{"id": "hook",   "firstWord": 0},
   {"id": "reveal", "firstWord": 7,  "transition": "whipPush",    "frames": 16},
   {"id": "ui",     "firstWord": 12, "transition": "lightStreak", "frames": 22},
   {"id": "endcard","firstWord": 66, "transition": "lightStreak", "frames": 24}]
transition = one of lightStreak | whipPush | irisFrom | blurDissolve | cardFlyAway.
Optional per scene: "cut": <absolute frame> to override the automatic cut, "line": display text.
(NearMatch's final cuts were auto ±12 frames, then hand-nudged after watching: 177/357/654/984/...)

How cuts are placed (the rule that made the NearMatch cuts feel "on the word"):
  cut = midpoint of the silence between the previous scene's last word and the next scene's
  first word. The incoming transition is centred on the cut, so each scene's Sequence starts
  frames/2 before its cut and ends frames/2 after the next cut (TransitionSeries overlap).
"""
import argparse
import json
import re
import sys


def load_words(path):
    raw = json.load(open(path))
    out = []
    for x in raw:
        w = x.get("w") or x.get("word") or x.get("text") or ""
        s = x.get("s", x.get("start"))
        e = x.get("e", x.get("end"))
        if s is None and "startMs" in x:
            s, e = x["startMs"] / 1000, x["endMs"] / 1000
        out.append({"w": w.strip(), "s": float(s), "e": float(e)})
    return out


def estimate_words(script, wps, lead, sentence_gap):
    """Rough timings for a script with no audio yet (replace with the real VO later)."""
    out, t = [], lead
    for tok in script.split():
        dur = max(0.16, len(re.sub(r"\W", "", tok)) / 12 + 1 / wps * 0.55)
        out.append({"w": tok, "s": round(t, 3), "e": round(t + dur, 3)})
        t += dur
        if tok[-1] in ".?!…":
            t += sentence_gap
    return out


def ts_obj(d):
    """JSON object -> TS object literal with bare keys."""
    if d is None:
        return "null"
    return "{ " + ", ".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in d.items()) + " }"


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--words")
    g.add_argument("--script")
    ap.add_argument("--wps", type=float, default=2.6, help="words/sec for --script estimates")
    ap.add_argument("--lead", type=float, default=0.6, help="seconds before the first word (--script)")
    ap.add_argument("--sentence-gap", type=float, default=0.45)
    ap.add_argument("--scenes", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--total-seconds", type=float, default=None,
                    help="video length; default = last word end + --tail")
    ap.add_argument("--tail", type=float, default=8.5,
                    help="seconds of end card after the last word (logo + tagline + hold)")
    a = ap.parse_args()

    words = load_words(a.words) if a.words else estimate_words(a.script, a.wps, a.lead, a.sentence_gap)
    scenes = json.load(open(a.scenes))
    fps = a.fps
    fr = lambda sec: int(round(sec * fps))
    W = [{"i": i, "w": w["w"], "s": fr(w["s"]), "e": fr(w["e"])} for i, w in enumerate(words)]
    total = fr(a.total_seconds) if a.total_seconds else W[-1]["e"] + fr(a.tail)

    for k, sc in enumerate(scenes):
        first = sc["firstWord"]
        last = scenes[k + 1]["firstWord"] - 1 if k + 1 < len(scenes) else len(W) - 1
        sc["words"] = list(range(first, last + 1))
    cuts = [0]
    for k in range(1, len(scenes)):
        prev_end = W[scenes[k]["words"][0] - 1]["e"]
        nxt = W[scenes[k]["words"][0]]["s"]
        # optional "cut": absolute frame override (after you've watched it: e.g. cut on a visual beat)
        cuts.append(int(scenes[k].get("cut", (prev_end + nxt) // 2)))
    cuts.append(total)
    specs = []
    for k, sc in enumerate(scenes):
        t_in = sc.get("frames", 20) if k > 0 else 0
        t_out = scenes[k + 1].get("frames", 20) if k + 1 < len(scenes) else 0
        start = 0 if k == 0 else cuts[k] - t_in // 2
        end = cuts[k + 1] + (t_out - t_out // 2) if k + 1 < len(scenes) else total
        specs.append({
            "id": sc["id"],
            "line": sc.get("line") or " ".join(W[i]["w"] for i in sc["words"]),
            "from": start,
            "durationInFrames": end - start,
            "cutIn": cuts[k],
            "cutOut": cuts[k + 1],
            "transitionIn": None if k == 0 else {"type": sc.get("transition", "whipPush"), "frames": t_in},
            "words": sc["words"],
        })
    # TransitionSeries: sum(durations) - sum(transition frames) must equal the total
    tsum = sum(s["durationInFrames"] for s in specs) - sum(
        s["transitionIn"]["frames"] for s in specs if s["transitionIn"])
    if tsum != total:
        print(f"!! transition math off by {total - tsum} frames; adjusting the last scene", file=sys.stderr)
        specs[-1]["durationInFrames"] += total - tsum

    src = "an estimate from the script (--script); replace with the real VO" if a.script else a.words
    js = lambda o: json.dumps(o, ensure_ascii=False)
    lines = [
        f"// AUTO-GENERATED by vo_to_timeline.py from {src}. Do not hand-edit; re-run the script.",
        f"// Master clock: public/audio/vo.wav starts at frame 0. All frames at {fps} fps.",
        f"export const FPS = {fps};",
        f"export const TOTAL_FRAMES = {total};",
        "",
        "export type Word = { i: number; w: string; s: number; e: number };",
        "/** Every spoken word with its ABSOLUTE start/end frame in the final video. */",
        "export const WORDS: Word[] = [",
        *[f"  {{ i: {w['i']}, w: {js(w['w'])}, s: {w['s']}, e: {w['e']} }}," for w in W],
        "];",
        "",
        'export type TransitionType = "whipPush" | "lightStreak" | "irisFrom" | "blurDissolve" | "cardFlyAway";',
        "export type SceneSpec = {",
        "  id: string;",
        "  line: string;",
        "  /** Absolute frame where this scene's <TransitionSeries.Sequence> starts (includes half the incoming transition). */",
        "  from: number;",
        "  durationInFrames: number;",
        "  /** Absolute frame of the cut point at the start / end (centre of the transitions). */",
        "  cutIn: number;",
        "  cutOut: number;",
        "  transitionIn: { type: TransitionType; frames: number } | null;",
        "  /** Indices into WORDS spoken during this scene. */",
        "  words: number[];",
        "};",
        "",
        "export const SCENES: SceneSpec[] = [",
        *[
            f"  {{ id: {js(s['id'])}, line: {js(s['line'])}, from: {s['from']}, durationInFrames: {s['durationInFrames']}, "
            f"cutIn: {s['cutIn']}, cutOut: {s['cutOut']}, transitionIn: {ts_obj(s['transitionIn'])}, words: {js(s['words'])} }},"
            for s in specs
        ],
        "];",
        "",
        "export const scene = (id: string): SceneSpec => {",
        "  const s = SCENES.find((x) => x.id === id);",
        "  if (!s) throw new Error(`Unknown scene ${id}`);",
        "  return s;",
        "};",
        "",
        "/** LOCAL frame (inside the scene component) at which word `i` starts being spoken. */",
        "export const wordAt = (sceneId: string, i: number) => WORDS[i].s - scene(sceneId).from;",
        "/** LOCAL frame at which word `i` ends. */",
        "export const wordEnd = (sceneId: string, i: number) => WORDS[i].e - scene(sceneId).from;",
        "",
    ]
    out = a.out_dir.rstrip("/")
    open(f"{out}/timeline.ts", "w").write("\n".join(lines))
    caps = [{"text": (" " if i else "") + w["w"], "startMs": round(words[i]["s"] * 1000),
             "endMs": round(words[i]["e"] * 1000), "timestampMs": round(words[i]["s"] * 1000),
             "confidence": 1} for i, w in enumerate(W)]
    json.dump(caps, open(f"{out}/captions.json", "w"), indent=1, ensure_ascii=False)
    print(f"wrote {out}/timeline.ts + captions.json ({len(W)} words, {len(specs)} scenes, "
          f"{total} frames = {total / fps:.2f} s)")
    for s in specs:
        t = s["transitionIn"]["type"] if s["transitionIn"] else "-"
        print(f"  {s['id']:<10} from {s['from']:>5} dur {s['durationInFrames']:>4}  cut {s['cutIn']:>5}  in: {t}")


if __name__ == "__main__":
    main()
