"""Offline, frame-accurate mix of a trailer (48 kHz stereo). Everything is driven by trailer.json "mix".

  music  = the processed song from plan.musicOffset, with per-frame automation:
           - low-pass "behind the wall" curve (mix.lowpass_hz: cold open, build opening up, drop-outs, dips)
           - gain curve (mix.music_gain_db: 1-frame mutes so the 808 lands on silence, holes before drops)
           - ducking under the voice: broadband (duck_db) + a dynamic 1-4 kHz dip (band_dip_db) + a low-pass
             glide toward voice_lowpass_hz while a word is spoken, so every word cuts through
           - tape stop (mix.tape_stop): playback rate 1 -> 0, darkened, then silence
  voice  = video/public/voice/voice.wav (build_voice.py)
  sfx    = cues from video/src/data/cues/*.json (scene agents) + mix.director_cues; each sound's PEAK (or start)
           lands on its cue frame; ducked under the voice so SFX never cover a word
Writes audio/out/{mix,music,sfx,voice,novoice,nomusic}.wav (float). deliver.sh masters and muxes them.
Run in the project folder: ~/.venvs/audio/bin/python ~/.claude/skills/aura-trailer/scripts/mix.py
"""
import glob
import json
import os
import sys

import numpy as np
import scipy.signal as ss
import soundfile as sf
from scipy.ndimage import maximum_filter1d

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402

SR = 48000
C = tlib.config()
X = C.get("mix", {})
plan = tlib.plan()
FPS = plan["fps"]
SPF = SR // FPS  # samples per video frame (800 at 60 fps)
NF = plan["durationInFrames"]
N = NF * SPF
K = plan["keyFrames"]


def F(v):
    return tlib.frame(v, K, FPS, plan["musicOffset"])


def db(x):
    return 10 ** (x / 20)


def load(p, ch=2):
    y, sr = sf.read(p, dtype="float32", always_2d=True)
    if sr != SR:
        import librosa
        y = librosa.resample(y.T, orig_sr=sr, target_sr=SR).T
    if y.shape[1] == 1 and ch == 2:
        y = np.repeat(y, 2, axis=1)
    if y.shape[1] == 2 and ch == 1:
        y = y.mean(axis=1, keepdims=True)
    return y


def curve(pts, default):
    """piecewise-linear per-frame curve from [[ref, value], ...]"""
    if not pts:
        return np.full(NF, float(default))
    xs, ys = zip(*tlib.points(pts, K, FPS, plan["musicOffset"]))
    return np.interp(np.arange(NF), xs, ys)


def frames_to_samples(c):
    return np.interp(np.arange(N) / SPF, np.arange(len(c)), c).astype(np.float32)


# ------------------------------------------------------------------ voice
voice = load(tlib.path("video/public/voice/voice.wav"), ch=1)[:, 0]
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
voice = ss.sosfilt(ss.butter(2, X.get("voice_highpass_hz", 80), "high", fs=SR, output="sos"), voice).astype(np.float32)
# voice activity (10 ms RMS) -> smoothed sidechain 0..1 (attack 25 ms, release 260 ms)
w = SR // 100
r = np.sqrt(np.mean(voice[: N // w * w].reshape(-1, w) ** 2, axis=1))
act = (20 * np.log10(r + 1e-9) > -42).astype(np.float32)
sc = np.zeros_like(act)
a_att, a_rel = 1 - np.exp(-1 / 2.5), 1 - np.exp(-1 / 26)
for i in range(len(act)):
    prev = sc[i - 1] if i else 0
    sc[i] = prev + (a_att if act[i] > prev else a_rel) * (act[i] - prev)
# look-ahead 30 ms so the duck is already down when the first consonant arrives
sc = np.maximum(sc, np.concatenate([sc[3:], np.zeros(3, np.float32)]))
side = np.interp(np.arange(N) / w, np.arange(len(sc)), sc).astype(np.float32)

# ------------------------------------------------------------------ music
song = load(tlib.path(plan["music"]))
o = int(plan["musicOffset"] * SR)
mus = song[o:o + int(N * 1.2)].copy()  # extra for the tape stop read-ahead
if len(mus) < int(N * 1.2):
    mus = np.pad(mus, ((0, int(N * 1.2) - len(mus)), (0, 0)))

cut = curve(X.get("lowpass_hz"), 20000)        # low-pass cutoff automation (Hz, per frame)
gain_db = curve(X.get("music_gain_db"), 0)     # music gain automation (dB, per frame), BEFORE ducking


def lowpass_auto(x, cut_hz):
    """Time-varying low-pass (2 cascaded 2nd-order Butterworth, coefficients per video frame).
    Frames with cutoff >= 19 kHz pass dry; the filter state keeps running so re-closing doesn't click."""
    out = np.zeros_like(x)
    zi = [np.zeros((2, x.shape[1])) for _ in range(2)]
    for fi in range(NF):
        a, b = fi * SPF, (fi + 1) * SPF
        blk = x[a:b]
        c = min(float(cut_hz[fi]), 19000.0)
        bb, aa = ss.butter(2, c, "low", fs=SR)
        y = blk
        for k in range(2):
            y, zi[k] = ss.lfilter(bb, aa, y, axis=0, zi=zi[k])
        out[a:b] = blk if cut_hz[fi] >= 19000 else y
    return out


body = mus[:N]
# while the subject speaks the music also goes "behind the wall": the cutoff glides toward voice_lowpass_hz
side_f = np.array([side[i * SPF:(i + 1) * SPF].max() for i in range(NF)])
vlp = X.get("voice_lowpass_hz", 850)
voice_cut = np.exp(np.log(20000) * (1 - side_f) + np.log(vlp) * side_f)
cut = np.minimum(cut, np.where(side_f > 0.02, voice_cut, 20000))
body = lowpass_auto(body, cut)
g = frames_to_samples(db(gain_db))
# ducking: broadband under the voice, plus a dynamic 1-4 kHz dip
duck = db(X.get("duck_db", -20) * side)
band = ss.sosfilt(ss.butter(2, [1000, 4000], "band", fs=SR, output="sos"), body, axis=0)
body = body - (1 - db(X.get("band_dip_db", -10))) * side[:, None] * band
body = body * (g * duck)[:, None]

TSC = X.get("tape_stop")
if TSC:
    # tape stop: playback rate 1 -> 0 over TS_LEN frames, then silence
    TS, TS_LEN = F(TSC["at"]), int(TSC.get("frames", 34))
    s0 = TS * SPF
    rate = np.ones(N - s0, dtype=np.float64)
    L_ts = TS_LEN * SPF
    tt = np.arange(min(L_ts, len(rate))) / L_ts
    rate[: len(tt)] = (1 - tt) ** 1.6
    rate[len(tt):] = 0
    pos = s0 + np.cumsum(rate) - rate[0]
    src_full = lowpass_auto(mus[:N], cut) * g[:, None]  # same chain without ducking (the last line comes after the stop)
    ts = np.stack([np.interp(pos, np.arange(len(src_full)), src_full[:, c]) for c in range(2)], axis=1)
    fade = np.clip(1 - np.arange(len(ts)) / (L_ts * 1.05), 0, 1) ** 0.7
    ts *= fade[:, None]
    # the pitch drop also darkens it: low-pass the tape-stop tail
    ts = ss.sosfilt(ss.butter(2, TSC.get("lowpass_hz", 2500), "low", fs=SR, output="sos"), ts, axis=0)
    body[s0:] = ts
music = body.astype(np.float32) * X.get("music_level", 0.92)

# ------------------------------------------------------------------ SFX
SFXDIR = [tlib.path(d) for d in X.get("sfx_dirs", ["audio/sfx-pick", "audio/sfx-kit"])]
_cache = {}


def sfx(name):
    if name not in _cache:
        p = next((f"{d}/{name}{ext}" for d in SFXDIR for ext in (".wav", ".mp3") if os.path.exists(f"{d}/{name}{ext}")), None)
        if p is None:
            raise FileNotFoundError(name)
        y = load(p)
        env = np.abs(y).max(axis=1)
        envs = np.convolve(env, np.ones(240) / 240, mode="same")
        _cache[name] = (y, int(np.argmax(envs)))
    return _cache[name]


# per-sound default gain (the dark generated set is loud) and whether its PEAK or its START lands on the cue frame
SFX_DEF = {
    "braam": (0.55, "peak"), "subdrop": (0.6, "start"), "metalhit": (0.5, "peak"), "heartbeat": (0.55, "start"),
    "reverse": (0.45, "peak"), "drone": (0.35, "start"), "glitch": (0.3, "start"), "whoosh": (0.4, "peak"),
    "titleslam": (0.7, "peak"), "titleslam-alt": (0.7, "peak"), "powerdown": (0.45, "start"), "sub-impact": (0.6, "peak"), "impact": (0.5, "peak"),
    "camera-shutter": (0.35, "start"), "ui-click": (0.3, "start"), "ui-pop": (0.3, "start"), "typing": (0.25, "start"),
    "keypad": (0.25, "start"), "zoom-swish": (0.35, "peak"), "riser": (0.4, "peak"), "metallic-riser": (0.4, "peak"),
    "whoosh-cinematic": (0.4, "peak"), "whoosh-short": (0.35, "peak"), "glitch-1": (0.3, "start"), "glitch-2": (0.3, "start"),
    "glitch-3": (0.3, "start"),
}
SFX_DEF.update({k: tuple(v) for k, v in X.get("sfx_defaults", {}).items()})
SFX_MASTER = X.get("sfx_master", 0.55)
REV_MAX = X.get("reverse_max_s", 0.7)
cues = []
for p in sorted(glob.glob(tlib.path("video/src/data/cues/*.json"))):
    if os.path.getsize(p) < 3:
        continue
    for c in json.load(open(p)):
        c["src"] = os.path.basename(p)
        cues.append(c)
# director cues (structure): drops, tape stop ... from trailer.json
for c in X.get("director_cues", []):
    cues.append({**c, "f": F(c["f"]), "src": "director"})
sfx_bus = np.zeros((N, 2), dtype=np.float32)
log = []
for c in cues:
    name = c["sfx"]
    try:
        y, pk = sfx(name)
    except FileNotFoundError:
        log.append(f"MISSING {name} ({c.get('src')})")
        continue
    g0, mode = SFX_DEF.get(name, (0.4, "start"))
    if name == "reverse" and pk > int(REV_MAX * SR):
        # a long suck-in would sit under the lines: keep only its last REV_MAX s, faded in
        y = y[pk - int(REV_MAX * SR):].copy()
        pk = int(REV_MAX * SR)
        y[:int(0.25 * SR)] *= np.linspace(0, 1, int(0.25 * SR))[:, None]
    start = int(F(c["f"]) * SPF) - (pk if mode == "peak" else 0)
    a = max(0, start)
    b = min(N, start + len(y))
    if b <= a:
        continue
    seg = y[a - start:b - start] * g0 * float(c.get("gain", 1.0)) * SFX_MASTER
    sfx_bus[a:b] += seg
    log.append(f"{F(c['f']):5d} {name:16s} g={c.get('gain', 1)} {c.get('src')} {c.get('note', '')}")
# SFX duck under the voice: down to sfx_under_voice while a word is spoken (they never cover a word)
sfx_bus *= (1 - (1 - X.get("sfx_under_voice", 0.15)) * side)[:, None]

# ------------------------------------------------------------------ sum + safety limiter
v2 = np.repeat(voice[:, None], 2, axis=1) * db(X.get("voice_gain_db", 2.5))
mix = music + sfx_bus + v2


def limiter_fast(x, ceiling=db(X.get("limiter_db", -1.0)), look=96, release_ms=80):
    env = maximum_filter1d(np.abs(x).max(axis=1), size=look, origin=-(look // 2))
    gr = np.minimum(1.0, ceiling / np.maximum(env, 1e-9))
    # smooth gain: instant down, exponential up (release), done on a decimated grid for speed
    k = 48
    gg = gr[: len(gr) // k * k].reshape(-1, k).min(axis=1)
    a = np.exp(-1 / (release_ms * SR / 1000 / k))
    for i in range(1, len(gg)):
        gg[i] = min(gg[i], a * gg[i - 1] + (1 - a))
    gs = np.interp(np.arange(len(gr)) / k, np.arange(len(gg)), gg)
    return (x * gs[:, None]).astype(np.float32)


mix = limiter_fast(mix)
OUT = tlib.path("audio/out")
os.makedirs(OUT, exist_ok=True)
sf.write(f"{OUT}/mix.wav", mix, SR, subtype="FLOAT")
sf.write(f"{OUT}/music.wav", music, SR, subtype="FLOAT")
sf.write(f"{OUT}/sfx.wav", sfx_bus, SR, subtype="FLOAT")
sf.write(f"{OUT}/voice.wav", v2, SR, subtype="FLOAT")
sf.write(f"{OUT}/novoice.wav", limiter_fast(music + sfx_bus), SR, subtype="FLOAT")
sf.write(f"{OUT}/nomusic.wav", limiter_fast(sfx_bus + v2), SR, subtype="FLOAT")
print("\n".join(log))
print("peak mix", 20 * np.log10(np.abs(mix).max() + 1e-9))
