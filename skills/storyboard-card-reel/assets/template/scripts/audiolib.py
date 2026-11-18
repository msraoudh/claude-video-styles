"""Shared DSP + metering for master_voice.py and mix.py (numpy / scipy only, offline, 48 kHz float64).

Metering follows ITU-R BS.1770-4 / EBU R128 (K-weighting, 400 ms momentary, 3 s short-term,
-70 LUFS absolute + -10 LU relative gates, 4x oversampled true peak). ffmpeg's ebur128 is used
as the independent referee in the reports (`ffmpeg_ebur128`).
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

import numpy as np
import scipy.io.wavfile as wavfile
import scipy.signal as ss
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000


# ---------------------------------------------------------------- io
def read_wav(path: str | Path) -> tuple[np.ndarray, int]:
    """Returns (samples x channels float64 in [-1, 1], sr)."""
    sr, x = wavfile.read(str(path))
    if x.dtype == np.int16:
        x = x.astype(np.float64) / 32768.0
    elif x.dtype == np.int32:
        x = x.astype(np.float64) / 2147483648.0
    elif x.dtype == np.uint8:
        x = (x.astype(np.float64) - 128.0) / 128.0
    else:
        x = x.astype(np.float64)
    if x.ndim == 1:
        x = x[:, None]
    return x, sr


def write_wav(path: str | Path, x: np.ndarray, sr: int = SR, codec: str = "pcm_s24le") -> None:
    """Writes PCM 24-bit (via a float32 temp + ffmpeg, scipy cannot write 24-bit)."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 2 and x.shape[1] == 1:
        x = x[:, 0]
    tmp = path.with_suffix(".tmp-f32.wav")
    wavfile.write(str(tmp), sr, x.astype(np.float32))
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(tmp), "-c:a", codec, str(path)], check=True)
    tmp.unlink()


def db(x: float | np.ndarray) -> float | np.ndarray:
    return 20.0 * np.log10(np.maximum(np.abs(x), 1e-12))


def undb(d: float | np.ndarray) -> float | np.ndarray:
    return 10.0 ** (np.asarray(d) / 20.0)


# ---------------------------------------------------------------- filters (RBJ cookbook biquads)
def _biquad(b, a, x):
    return ss.lfilter(np.asarray(b) / a[0], np.asarray(a) / a[0], x, axis=0)


def peaking(x, f0, gain_db, q, sr=SR):
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / sr
    al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return _biquad(b, a, x)


def shelf(x, f0, gain_db, kind="high", s=0.7, sr=SR):
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / sr
    al = np.sin(w) / 2 * np.sqrt((A + 1 / A) * (1 / s - 1) + 2)
    c, sq = np.cos(w), 2 * np.sqrt(A) * al
    if kind == "high":
        b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
        a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    else:
        b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
        a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
    return _biquad(b, a, x)


def highpass(x, fc, order=4, sr=SR):
    sos = ss.butter(order, fc, "highpass", fs=sr, output="sos")
    return ss.sosfilt(sos, x, axis=0)


def bandpass(x, lo, hi, order=4, sr=SR, zero_phase=False):
    sos = ss.butter(order, [lo, hi], "bandpass", fs=sr, output="sos")
    return ss.sosfiltfilt(sos, x, axis=0) if zero_phase else ss.sosfilt(sos, x, axis=0)


def lowpass_zero_phase(x, fc, order=4, sr=SR):
    sos = ss.butter(order, fc, "lowpass", fs=sr, output="sos")
    return ss.sosfiltfilt(sos, x, axis=0)


# ---------------------------------------------------------------- envelopes / dynamics
def rms_env_db(x: np.ndarray, win_s: float, sr=SR) -> np.ndarray:
    """Centered running RMS in dB (per sample, channels summed as power mean)."""
    p = x**2 if x.ndim == 1 else (x**2).mean(axis=1)
    n = max(1, int(win_s * sr))
    return 10 * np.log10(np.maximum(uniform_filter1d(p, n, mode="nearest"), 1e-14))


def smooth_gain_db(target_db: np.ndarray, attack_s: float, release_s: float, sr=SR, step=24) -> np.ndarray:
    """Attack/release ballistics on a gain-reduction curve (dB, <= 0). Attack = moving further negative.
    Runs on a decimated grid (step samples, 0.5 ms) then interpolates back."""
    t = target_db[::step]
    dt = step / sr
    aa = np.exp(-dt / max(attack_s, 1e-5))
    ar = np.exp(-dt / max(release_s, 1e-5))
    out = np.empty_like(t)
    g = 0.0
    for i, v in enumerate(t):
        g = aa * g + (1 - aa) * v if v < g else ar * g + (1 - ar) * v
        out[i] = g
    return np.interp(np.arange(len(target_db)), np.arange(len(t)) * step, out)


def compressor(x, threshold_db, ratio, attack_s, release_s, knee_db=6.0, detect_win_s=0.005, sr=SR):
    """Feed-forward RMS compressor with soft knee. Returns (y, gain_reduction_db per sample)."""
    lvl = rms_env_db(x, detect_win_s, sr)
    over = lvl - threshold_db
    gr = np.zeros_like(over)
    k = knee_db / 2
    m = over > k
    gr[m] = -(over[m]) * (1 - 1 / ratio)
    mk = (over > -k) & ~m
    gr[mk] = -((over[mk] + k) ** 2 / (2 * knee_db)) * (1 - 1 / ratio)
    gr = smooth_gain_db(gr, attack_s, release_s, sr)
    g = undb(gr)
    return (x * (g[:, None] if x.ndim == 2 else g)), gr


def true_peak_db(x: np.ndarray) -> float:
    x2 = x if x.ndim == 2 else x[:, None]
    up = ss.resample_poly(x2, 4, 1, axis=0)
    return float(db(np.max(np.abs(up))))


def limiter(x, ceiling_db, lookahead_s=0.0015, release_s=0.06, sr=SR, true_peak=True, passes=3):
    """Lookahead brick-wall limiter (zero-latency offline: gain curve is centred on the peaks).
    Detection on the 4x oversampled signal when true_peak. Returns (y, gain_reduction_db)."""
    x2 = x if x.ndim == 2 else x[:, None]
    y = x2.copy()
    total = np.zeros(len(y))
    L = max(2, int(lookahead_s * sr))
    for _ in range(passes):
        if true_peak:
            up = np.abs(ss.resample_poly(y, 4, 1, axis=0)).max(axis=1)
            pk = up[: len(y) * 4].reshape(-1, 4).max(axis=1)
        else:
            pk = np.abs(y).max(axis=1)
        ceil = undb(ceiling_db)
        if pk.max() <= ceil * 1.0000001:
            break
        req = np.minimum(1.0, ceil / np.maximum(pk, 1e-12))
        hold = minimum_filter1d(req, 2 * L + 1, mode="nearest")
        rel = smooth_gain_db(db(hold), 0.0, release_s, sr, step=8)  # instant down, slow up
        rel = np.minimum(rel, db(hold))
        # centred box (length L+1) inside the 2L+1 hold: at each peak every averaged value is <= its requirement
        g = np.minimum(1.0, undb(uniform_filter1d(rel, L + 1, mode="nearest")))
        y = y * g[:, None]
        total += db(g)
    return (y if x.ndim == 2 else y[:, 0]), total


# ---------------------------------------------------------------- BS.1770 loudness
_KB1 = np.array([1.53512485958697, -2.69169618940638, 1.19839281085285])
_KA1 = np.array([1.0, -1.69065929318241, 0.73248077421585])
_KB2 = np.array([1.0, -2.0, 1.0])
_KA2 = np.array([1.0, -1.99004745483398, 0.99007225036621])


def k_weight(x: np.ndarray) -> np.ndarray:
    x2 = x if x.ndim == 2 else x[:, None]
    return ss.lfilter(_KB2, _KA2, ss.lfilter(_KB1, _KA1, x2, axis=0), axis=0)


def _power_sum(xk: np.ndarray) -> np.ndarray:
    return (xk**2).sum(axis=1)  # L/R (and mono) weights = 1


def loudness_curve(x: np.ndarray, win_s: float, hop_s: float = 0.1, sr=SR):
    """Returns (times of window centres, loudness LUFS) for windows of win_s (0.4 momentary, 3 short-term)."""
    p = _power_sum(k_weight(x))
    n, h = int(win_s * sr), int(hop_s * sr)
    c = np.concatenate([[0.0], np.cumsum(p)])
    starts = np.arange(0, max(1, len(p) - n + 1), h)
    ms = (c[np.minimum(starts + n, len(p))] - c[starts]) / n
    return (starts + n / 2) / sr, -0.691 + 10 * np.log10(np.maximum(ms, 1e-14))


def integrated_lufs(x: np.ndarray, sr=SR, mask: np.ndarray | None = None) -> float:
    """Gated integrated loudness. `mask` (per sample bool) restricts the blocks considered."""
    p = _power_sum(k_weight(x))
    n, h = int(0.4 * sr), int(0.1 * sr)
    c = np.concatenate([[0.0], np.cumsum(p)])
    starts = np.arange(0, len(p) - n + 1, h)
    ms = (c[starts + n] - c[starts]) / n
    if mask is not None:
        mc = np.concatenate([[0], np.cumsum(mask.astype(np.int64))])
        ms = ms[(mc[starts + n] - mc[starts]) >= n * 0.99]
    lk = -0.691 + 10 * np.log10(np.maximum(ms, 1e-14))
    ms = ms[lk > -70]
    if not len(ms):
        return -70.0
    rel = -0.691 + 10 * np.log10(ms.mean()) - 10
    lk = -0.691 + 10 * np.log10(ms)
    return float(-0.691 + 10 * np.log10(ms[lk > rel].mean()))


def ffmpeg_ebur128(path: str | Path) -> dict:
    """Independent check with ffmpeg: integrated LUFS, LRA, true peak (dBTP)."""
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    t = r.stderr[r.stderr.rfind("Summary:"):]
    g = lambda k: float(re.search(k + r":\s+(-?[\d.]+|-inf)", t).group(1).replace("-inf", "-999"))
    return {"I": g("I"), "LRA": g("LRA"), "TP": g("Peak")}


# ---------------------------------------------------------------- spectrum report
BANDS = [(20, 80), (80, 150), (150, 300), (300, 600), (600, 1200), (1200, 2500), (2500, 5000), (5000, 8000), (8000, 12000), (12000, 20000)]


def band_levels(x: np.ndarray, sr=SR, mask: np.ndarray | None = None) -> list[float]:
    """Long-term average spectrum per band (dB, absolute power) over the masked samples."""
    m = x.mean(axis=1) if x.ndim == 2 else x
    if mask is not None:
        m = m[mask]
    f, P = ss.welch(m, sr, nperseg=8192)
    df = f[1] - f[0]
    return [float(10 * np.log10(P[(f >= a) & (f < b)].sum() * df + 1e-20)) for a, b in BANDS]
