"""Shared helpers for the aura-trailer scripts: project paths, trailer.json, frame references.

Every script runs from the PROJECT folder (or with TRAILER=/path/to/project) and reads trailer.json there.
Frame references used in trailer.json (mix curves, director cues, fx):
  123              a frame number
  "key:drop1"      a named moment from trailer.json "key" (resolved by plan.py into plan/plan.json)
  "key:drop1-12"   ... with an offset in frames
  "key:dip[1]+4"   ... an element of a list-valued key, with an offset
  "t:57.9"         trailer seconds
  "song:58.75"     song seconds (in the processed music file)
  "key:end"        the last frame (also "key:start" = 0)
"""
import json
import os
import re
import subprocess

import numpy as np


def root():
    return os.path.abspath(os.environ.get("TRAILER", os.getcwd()))


def path(p, base=None):
    """Project-relative unless absolute; expands ~."""
    p = os.path.expanduser(p)
    return p if os.path.isabs(p) else os.path.join(base or root(), p)


def config():
    p = path("trailer.json")
    if not os.path.exists(p):
        raise SystemExit(f"no trailer.json in {root()} (run from the project folder or set TRAILER=...)")
    return json.load(open(p, encoding="utf-8"))


def plan():
    return json.load(open(path("plan/plan.json"), encoding="utf-8"))


REF = re.compile(r"^(key|t|song|f):([A-Za-z0-9_.]+)(?:\[(\d+)\])?([+-]\d+)?$")


def frame(v, keys=None, fps=60, offset=0.0):
    """Resolve a frame reference (see module doc) to an int frame."""
    if isinstance(v, (int, float)):
        return int(round(v))
    m = REF.match(str(v).strip())
    if not m:
        raise ValueError(f"bad frame reference {v!r}")
    kind, name, idx, add = m.groups()
    if kind == "key":
        if keys is None or name not in keys:
            raise KeyError(f"unknown key {name!r} in {v!r} (define it in trailer.json \"key\")")
        x = keys[name]
        if isinstance(x, list):
            x = x[int(idx or 0)]
    elif kind == "t":
        x = round(float(name) * fps)
    elif kind == "song":
        x = round((float(name) - offset) * fps)
    else:
        x = float(name)
    return int(round(x)) + int(add or 0)


def points(pts, keys, fps=60, offset=0.0):
    """[[ref, value], ...] -> [(frame, value), ...] sorted by frame (for np.interp curves)."""
    out = [(frame(a, keys, fps, offset), float(b)) for a, b in pts]
    return sorted(out, key=lambda p: p[0])


def load_audio(p, sr=48000, ch=1):
    """Any audio/video file -> float32 array (n,) for ch=1 or (n, 2) for ch=2, via ffmpeg."""
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", p, "-ac", str(ch), "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).copy()
    return a if ch == 1 else a.reshape(-1, ch)


def load_words(p):
    """Word timings from either a flat [[w, s, e], ...] list or a transcribe.sh transcript ({segments: [{w: [[w, s, e, p]]}]})."""
    d = json.load(open(path(p), encoding="utf-8"))
    if isinstance(d, dict):
        return [[w[0], w[1], w[2]] for s in d["segments"] for w in s["w"]]
    return [[w[0], w[1], w[2]] for w in d]
