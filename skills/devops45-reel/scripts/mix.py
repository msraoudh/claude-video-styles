"""Offline mix of one episode (48 kHz stereo, frame-accurate at 60 fps) — the brand intro's mixer, driven by the plan.

  voice  video/public/audio/voice.wav (placed by place_voice.py) — the master clock, −2 dB (mix.voice_db)
  music  plan/music.json (series track, offset so its drop = KEY.drop): filtered build under the hook, 0.25 s hole,
         full groove from the drop, a dip just before the final hit, tail fade.
         Ducked under the voice: broadband −16 dB × sidechain + a dynamic 1–4 kHz carve (−12 dB).
  sfx    plan/cues.json (archetype cue rules, cues.py) + video/src/data/cues/*.json (custom scenes) + director cues
         (drop basshit + glass, final impact). Each sound peak-normalised, aligned by its peak / start / end on f,
         SFX ducked to ~0.18 under every word.
Writes audio/out/{mix,music,sfx,voice}.wav (float) + video/public/audio/preview-mix.wav (Studio).
  ~/.venvs/audio/bin/python mix.py <project>
"""
import glob
import json
import os

import numpy as np
import scipy.signal as ss
import soundfile as sf
from scipy.ndimage import maximum_filter1d

import elib

P = elib.proj()
SR, FPS = elib.SR, elib.FPS
SPF = SR // FPS
sc = json.load(open(f"{P}/plan/scenes.json", encoding="utf-8"))
K = sc["key"]
NF = K["end"]
N = NF * SPF
DROP, FINAL, CTA = K["drop"], K["finalHit"], K["ctaFrom"]
HOLE = (DROP - 15, DROP - 1)


def db(x):
    return 10 ** (x / 20)


def load(p, ch=2):
    y, sr = sf.read(p, dtype="float32", always_2d=True)
    if sr != SR:
        import librosa
        y = librosa.resample(y.T, orig_sr=sr, target_sr=SR).T
    if y.shape[1] == 1 and ch == 2:
        y = np.repeat(y, 2, axis=1)
    if ch == 1:
        y = y.mean(axis=1, keepdims=True)
    return y.astype(np.float32)


def curve(points):
    pts = sorted((max(0, min(NF - 1, int(x))), y) for x, y in points)
    xs, ys = zip(*pts)
    return np.interp(np.arange(NF), xs, ys)


def per_sample(c):
    return np.interp(np.arange(N) / SPF, np.arange(len(c)), c).astype(np.float32)


# ---------------------------------------------------------------- voice + sidechain
voice = load(f"{P}/video/public/audio/voice.wav", 1)[:, 0]
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
voice = ss.sosfilt(ss.butter(2, 70, "high", fs=SR, output="sos"), voice).astype(np.float32)
w = SR // 100
r = np.sqrt(np.mean(voice[: N // w * w].reshape(-1, w) ** 2, axis=1))
act = (20 * np.log10(r + 1e-9) > -42).astype(np.float32)
scn = np.zeros_like(act)
a_att, a_rel = 1 - np.exp(-1 / 2.0), 1 - np.exp(-1 / 25)  # attack 20 ms, release 250 ms
for i in range(len(act)):
    prev = scn[i - 1] if i else 0
    scn[i] = prev + (a_att if act[i] > prev else a_rel) * (act[i] - prev)
scn = np.maximum(scn, np.concatenate([scn[3:], np.zeros(3, np.float32)]))  # 30 ms look-ahead
side = np.interp(np.arange(N) / w, np.arange(len(scn)), scn).astype(np.float32)

# ---------------------------------------------------------------- music
music = np.zeros((N, 2), np.float32)
mp = json.load(open(f"{P}/plan/music.json"))
src = load(mp["file"])
o = int(round(mp["offset"] * SR))
if o < 0:
    src = np.concatenate([np.zeros((-o, 2), np.float32), src])
    o = 0
body = src[o:o + N]
body = np.pad(body, ((0, N - len(body)), (0, 0)))
BED = mp.get("mode") == "bed"
if BED:  # calm bed under the whole lesson (the drop track « up » is for the brand intro only)
    cut = curve([(0, 20000), (NF - 1, 20000)])
    gain_db = curve([(0, -40), (30, -3), (DROP - 6, -3), (DROP, 0), (DROP + 70, -3), (CTA, -3), (CTA + 20, -1),
                     (FINAL - 1, -1), (FINAL + 8, -2), (NF - 1, -60)])
else:
    cut = curve([(0, 900), (DROP - 90, 2200), (DROP - 18, 7000), (DROP, 20000), (NF - 1, 20000)])
    gain_db = curve([(0, -4), (HOLE[0] - 2, -2), (HOLE[0], -40), (HOLE[1], -40), (DROP, 0),
                     (CTA, 0), (CTA + 20, 1), (FINAL - 32, 1), (FINAL - 26, -8), (FINAL - 1, -8), (FINAL, 0),
                     (FINAL + 8, -2), (NF - 1, -60)])
zi = [np.zeros((2, 2)) for _ in range(2)]
out = np.zeros_like(body)
for fi in range(NF):
    a, b = fi * SPF, (fi + 1) * SPF
    c = min(float(cut[fi]), 19000.0)
    if cut[fi] >= 19000:
        out[a:b] = body[a:b]
        continue
    bb, aa = ss.butter(2, c, "low", fs=SR)
    yb = body[a:b]
    for k in range(2):
        yb, zi[k] = ss.lfilter(bb, aa, yb, axis=0, zi=zi[k])
    out[a:b] = yb
band = ss.sosfilt(ss.butter(2, [1000, 4000], "band", fs=SR, output="sos"), out, axis=0)
out = out - (1 - db(-12)) * side[:, None] * band          # dynamic speech-band carve
duck = db((-10 if BED else -16) * side)                   # broadband duck under the voice (gentler under a bed)
MIXO = elib.load_episode(P).get("mix") or {}  # per-episode overrides: music_db, sfx_master, voice_db
music = (out * (per_sample(db(gain_db)) * duck)[:, None] * db(float(MIXO.get("music_db", -10 if BED else -2)))).astype(np.float32)  # bed −7 dB vs « Up »: voice lead ≥ 8–10 dB with SFX
if (elib.load_episode(P).get("music") or {}).get("mute", False):  # optional: voice + SFX only
    music[:] = 0

# ---------------------------------------------------------------- SFX
SFXDIR = [f"{P}/audio/sfx", f"{elib.SKILL}/assets/sfx"]
_cache = {}


def sfx(name):
    if name not in _cache:
        p = next((f"{d}/{name}{e}" for d in SFXDIR for e in (".wav", ".mp3") if os.path.exists(f"{d}/{name}{e}")), None)
        if p is None:
            raise FileNotFoundError(name)
        y = load(p)
        y = y / (np.abs(y).max() + 1e-9) * db(-3)
        env = np.convolve(np.abs(y).max(axis=1), np.ones(240) / 240, mode="same")
        _cache[name] = (y, int(np.argmax(env)))
    return _cache[name]


DEF = {"glass": (0.5, "peak"), "tick": (0.35, "start"), "cards": (0.45, "start"), "suckin": (0.5, "end"),
       "basshit": (0.6, "peak"), "typing": (0.35, "start"), "glint": (0.35, "peak"), "check": (0.45, "peak"),
       "impact": (0.8, "start"),  # starts AFTER the last word (its pre-roll would bite it)
       "whoosh": (0.4, "peak"), "riser": (0.4, "end"), "tap": (0.5, "peak"),
       "ui-pop": (0.35, "peak"), "ui-click": (0.35, "peak"), "zoom-swish": (0.35, "peak"), "camera-shutter": (0.35, "peak")}
SFX_MASTER = float((elib.load_episode(P).get("mix") or {}).get("sfx_master", 0.5))
cues = []
if os.path.exists(f"{P}/plan/cues.json"):
    cues += [dict(c, src=c.get("src", "cues.py")) for c in json.load(open(f"{P}/plan/cues.json"))]
for p in sorted(glob.glob(f"{P}/video/src/data/cues/*.json")):
    cues += [dict(c, src=os.path.basename(p)) for c in json.load(open(p))]
cues += [{"f": DROP, "sfx": "basshit", "gain": 0.55 if BED else 1.0, "note": "series ident", "src": "director"},
         {"f": FINAL, "sfx": "impact", "gain": 1.0, "note": "final hit right after the last word", "src": "director"}]
sfx_bus = np.zeros((N, 2), np.float32)
log = []
for c in sorted(cues, key=lambda c: c["f"]):
    try:
        y, pk = sfx(c["sfx"])
    except FileNotFoundError:
        log.append(f"MISSING {c['sfx']} ({c['src']})")
        continue
    g0, mode = DEF.get(c["sfx"], (0.4, "start"))
    mode = c.get("align", mode)
    if c.get("max_s"):  # trim long textures (typing 2.2 s → the typed span)
        n = int(c["max_s"] * SR)
        y = y[:n].copy()
        fl = min(len(y), int(0.04 * SR))
        y[-fl:] *= np.linspace(1, 0, fl)[:, None]
    anchor = {"peak": min(pk, len(y) - 1), "end": len(y) - 1, "start": 0}[mode]
    start = int(c["f"] * SPF) - anchor
    a, b = max(0, start), min(N, start + len(y))
    if b <= a:
        continue
    sfx_bus[a:b] += y[a - start:b - start] * g0 * float(c.get("gain", 1.0)) * SFX_MASTER
    log.append(f"{c['f']:5d} {c['sfx']:10s} g={c.get('gain', 1)} {c['src']} {c.get('note', '')}")
sfx_bus *= (1 - 0.82 * side)[:, None]  # SFX never cover a word

# ---------------------------------------------------------------- sum + safety limiter
# user 2026-10-22: « lower a little the voice of Kev » → −2 dB (was +1); episode.json mix.voice_db overrides
VOICE_DB = float((elib.load_episode(P).get("mix") or {}).get("voice_db", -2.0))
v2 = np.repeat(voice[:, None], 2, axis=1) * db(VOICE_DB)
mix = music + sfx_bus + v2


def limiter(x, ceiling=db(-1.5), look=96, release_ms=80):
    env = maximum_filter1d(np.abs(x).max(axis=1), size=look, origin=-(look // 2))
    gr = np.minimum(1.0, ceiling / np.maximum(env, 1e-9))
    k = 48
    g = gr[: len(gr) // k * k].reshape(-1, k).min(axis=1)
    a = np.exp(-1 / (release_ms * SR / 1000 / k))
    for i in range(1, len(g)):
        g[i] = min(g[i], a * g[i - 1] + (1 - a))
    return (x * np.interp(np.arange(len(gr)) / k, np.arange(len(g)), g)[:, None]).astype(np.float32)


OUT = f"{P}/audio/out"
os.makedirs(OUT, exist_ok=True)
lim = limiter(mix)
sf.write(f"{OUT}/mix.wav", lim, SR, subtype="FLOAT")
sf.write(f"{P}/video/public/audio/preview-mix.wav", lim * db(3), SR, subtype="PCM_16")
sf.write(f"{OUT}/music.wav", music, SR, subtype="FLOAT")
sf.write(f"{OUT}/sfx.wav", sfx_bus, SR, subtype="FLOAT")
sf.write(f"{OUT}/voice.wav", v2, SR, subtype="FLOAT")
open(f"{OUT}/cues.log", "w").write("\n".join(log) + "\n")
print(f"mix {NF / FPS:.2f} s · {len(cues)} cues · {sum(1 for l in log if l.startswith('MISSING'))} missing")
