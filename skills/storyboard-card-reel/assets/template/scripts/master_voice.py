"""Voice master v3 for the Showcase reel: public/audio/voice-clean-v2.wav -> public/audio/voice-master-v3.wav

the user on v2: « the sound is so bad, my voice… make it more deep, clear or normal ». v2 cut 320 Hz and boosted
3.2 kHz (+2.5 dB) with a fast 3:1 compressor: on a phone mic that is already boxy at 400-500 Hz and peaky
at 8 kHz, it sounded thin and « phone ». v3 goes the other way: body first, presence only a touch.

Measured on the raw file (1/3-octave long-term speech spectrum, re 1 kHz): f0 median 123 Hz (p5 100 Hz);
a hump at 400-500 Hz (+12..+13 dB, 3-4 dB above the 315 Hz band = boxiness), a hole at 4-5 kHz (-9..-11)
and a narrow 8 kHz peak (-2.9, the phone capsule's harsh « s »), nothing above 12 kHz (codec low-pass).

Chain (v3)
  1. high-pass 70 Hz, 4th order: rumble/handling (50-63 Hz) out, his 100 Hz fundamentals untouched (-0.2 dB).
  2. denoise: DeepFilterNet 3 (when .venv-audio exists, attenuation limited so the room stays natural),
     else ffmpeg afftdn (nr 8 dB). --enhancer afftdn|dfn|none to force one.
  3. light de-ess: split-band (zero-phase complementary split at 5 kHz), detector 6-9 kHz,
     ratio 2, max 3 dB, only the loudest 4 % of sibilant moments; a 2nd slope (4:1, 10 dB above) only for
     the rare mouth clicks / « s » bursts of the phone capsule (one at 56.9 s hits -1 dBFS in the raw file).
  4. EQ (deep + clear + natural):
       low shelf +2.5 dB @ 150 Hz (S 0.6)      body / depth on his 100-140 Hz fundamentals
       peak +1.0 dB @ 220 Hz Q 0.9             proximity warmth (fills the 160-200 Hz dip)
       peak -1.5 dB @ 450 Hz Q 1.3             measured box hump
       peak +1.0 dB @ 3.0 kHz Q 0.7            gentle presence (broad, no phone honk)
       peak -1.5 dB @ 8.0 kHz Q 2.0            the capsule's harsh 8 kHz spike
       (no air shelf: above 10 kHz there is only codec hiss, +1 dB @ 10 kHz lifted the floor, not the voice)
  5. compressor 2:1, soft knee 8 dB, 10 ms RMS detector, attack 12 ms (transients pass), release 150 ms.
  6. make-up gain to -16 LUFS integrated, then a true-peak lookahead limiter at -0.5 dBFS (1.5 ms lookahead,
     80 ms release: it only shaves the syllable peaks the slow 2:1 lets through, mean GR < 1 dB).
Prints the report: loudness, spectral tilt, band balance at matched loudness, floor, GR statistics.

Usage: python scripts/master_voice.py [--enhancer auto|dfn|afftdn|none] [--out path] [--no-eq-air]
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import scipy.signal as ss

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audiolib import (BANDS, SR, band_levels, bandpass, compressor, db, ffmpeg_ebur128, highpass,  # noqa: E402
                      integrated_lufs, limiter, lowpass_zero_phase, peaking, read_wav, rms_env_db, shelf,
                      smooth_gain_db, true_peak_db, undb, write_wav)

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/audio/voice-clean-v2.wav"
DST = ROOT / "public/audio/voice-master-v3.wav"
VENV_AUDIO = ROOT / ".venv-audio/Scripts/python.exe"
DFN_SCRIPT = ROOT / "scripts/dfn_enhance.py"

TARGET_LUFS = -16.0
PEAK_CEIL = -0.5  # stem ceiling; the mix master lowers the voice ~1.5 dB, so it reaches the master at about -2 dBTP
P = dict(
    hpf=70.0,
    dn_nr=8.0, dn_nf_max=-40.0,
    dfn_atten=12.0,
    ds_split=5000.0, ds_lo=6000.0, ds_hi=9000.0, ds_ratio=2.0, ds_max=3.0, ds_pct=96.0, ds_click=10.0,
    # (kind, f0, gain dB, q or shelf slope)
    eq=[("low", 150.0, 2.5, 0.6), ("peak", 220.0, 1.0, 0.9), ("peak", 450.0, -1.5, 1.3),
        ("peak", 3000.0, 1.0, 0.7), ("peak", 8000.0, -1.5, 2.0)],
    air=("high", 10000.0, 1.0, 0.7),
    comp_ratio=2.0, comp_attack=0.012, comp_release=0.15, comp_knee=8.0, comp_pct=60.0, comp_det=0.010,
)
# v2 for the record: hpf 80, afftdn nr 10, de-ess ratio 2.5 / max 4 dB, EQ -2 dB @ 320 Hz + 2.5 dB @ 3.2 kHz,
# comp 3:1 attack 2 ms release 100 ms knee 6.


def frames_db(x: np.ndarray, win=0.02) -> np.ndarray:
    n = int(win * SR)
    m = x[: len(x) // n * n].reshape(-1, n)
    return 10 * np.log10((m**2).mean(axis=1) + 1e-14)


def speech_mask(x: np.ndarray) -> np.ndarray:
    """Samples belonging to 20 ms frames within 25 dB of the speech level (loud enough to be speech)."""
    f = frames_db(x)
    thr = np.percentile(f, 90) - 25
    n = int(0.02 * SR)
    m = np.repeat(f > thr, n)
    return np.concatenate([m, np.zeros(len(x) - len(m), bool)])


def afftdn(x: np.ndarray, nf: float) -> np.ndarray:
    import scipy.io.wavfile as wf
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as td:
        a, b = Path(td) / "a.wav", Path(td) / "b.wav"
        wf.write(str(a), SR, x.astype(np.float32))
        af = f"afftdn=nr={P['dn_nr']}:nf={nf:.1f}:tn=1"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(a), "-af", af, "-c:a", "pcm_f32le", str(b)], check=True)
        y, _ = read_wav(b)
    return y[:, 0][: len(x)]


def dfn(x: np.ndarray) -> np.ndarray:
    """DeepFilterNet 3 in the project venv (.venv-audio), 48 kHz in/out, attenuation limited."""
    import scipy.io.wavfile as wf
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as td:
        a, b = Path(td) / "a.wav", Path(td) / "b.wav"
        wf.write(str(a), SR, x.astype(np.float32))
        subprocess.run([str(VENV_AUDIO), str(DFN_SCRIPT), str(a), str(b), str(P["dfn_atten"])], check=True)
        y, sr = read_wav(b)
        assert sr == SR, sr
    y = y[:, 0]
    # DFN has a small fixed delay compensation; re-align on the cross-correlation to be frame-exact
    seg = slice(SR * 5, SR * 25)
    c = ss.correlate(y[seg], x[seg], mode="full", method="fft")
    lag = int(np.argmax(c)) - (seg.stop - seg.start - 1)
    if lag > 0:
        y = np.concatenate([y[lag:], np.zeros(lag)])
    elif lag < 0:
        y = np.concatenate([np.zeros(-lag), y[:lag]])
    print(f"dfn: re-aligned by {lag} samples")
    out = np.zeros(len(x))
    out[: min(len(x), len(y))] = y[: len(x)]
    return out


def deess(x: np.ndarray) -> tuple[np.ndarray, np.ndarray, float]:
    low = lowpass_zero_phase(x, P["ds_split"], order=4)
    high = x - low  # exact complementary split: low + high == x
    det = bandpass(x, P["ds_lo"], P["ds_hi"], order=3, zero_phase=True)
    lvl = rms_env_db(det, 0.004)
    sm = speech_mask(x)
    thr = float(np.percentile(lvl[sm], P["ds_pct"]))
    gr = -np.clip((lvl - thr) * (1 - 1 / P["ds_ratio"]), 0, P["ds_max"])
    # second slope, only for the rare « s » bursts / mouth clicks far above the sibilant level (phone capsule)
    gr -= np.clip((lvl - thr - P["ds_click"]) * (1 - 1 / 4), 0, None)
    gr = smooth_gain_db(gr, 0.001, 0.06)
    return low + high * undb(gr), gr, thr


def eq(x: np.ndarray, bands) -> np.ndarray:
    for kind, f0, g, q in bands:
        x = peaking(x, f0, g, q) if kind == "peak" else shelf(x, f0, g, kind, s=q)
    return x


def tilt_db_oct(x: np.ndarray, sm: np.ndarray) -> float:
    f, Pw = ss.welch(x[sm], SR, nperseg=8192)
    sel = (f > 150) & (f < 8000)
    return float(np.polyfit(np.log2(f[sel]), 10 * np.log10(Pw[sel] + 1e-20), 1)[0])


def stats(name: str, x: np.ndarray, sm: np.ndarray) -> dict:
    f = frames_db(x)
    sp = np.percentile(f[f > np.percentile(f, 90) - 25], 50)
    sib = rms_env_db(bandpass(x, 6000, 9000, order=3, zero_phase=True), 0.004)[sm]
    bands = np.array(band_levels(x, mask=sm))
    tot = 10 * np.log10((10 ** (bands / 10)).sum())
    return dict(name=name, I=integrated_lufs(x), TP=true_peak_db(x), floor1=float(np.percentile(f, 1) - sp),
                floor5=float(np.percentile(f, 5) - sp), sib99=float(np.percentile(sib, 99)), rel=bands - tot,
                tilt=tilt_db_oct(x, sm), crest=float(db(np.abs(x).max()) - 10 * np.log10((x**2).mean())))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--enhancer", default="auto", choices=["auto", "dfn", "afftdn", "none"])
    ap.add_argument("--out", default=str(DST))
    ap.add_argument("--air", action="store_true", help="add the +1 dB @ 10 kHz air shelf")
    a = ap.parse_args()
    enh = a.enhancer
    if enh == "auto":
        enh = "dfn" if VENV_AUDIO.exists() and DFN_SCRIPT.exists() else "afftdn"

    x, sr = read_wav(SRC)
    assert sr == SR, sr
    x = x.mean(axis=1)
    sm = speech_mask(x)
    report = [stats("raw", x, sm)]

    y = highpass(x, P["hpf"], order=4)
    report.append(stats("hpf", y, sm))
    nf = float(min(P["dn_nf_max"], max(-60.0, np.percentile(frames_db(y), 5))))
    if enh == "dfn":
        y = dfn(y)
    elif enh == "afftdn":
        y = afftdn(y, nf)
    report.append(stats(enh, y, sm))
    y, ds_gr, ds_thr = deess(y)
    report.append(stats("de-ess", y, sm))
    y = eq(y, P["eq"] + ([P["air"]] if a.air else []))
    report.append(stats("eq", y, sm))
    thr = float(np.percentile(rms_env_db(y, P["comp_det"])[sm], P["comp_pct"]))
    y, c_gr = compressor(y, thr, P["comp_ratio"], P["comp_attack"], P["comp_release"], P["comp_knee"], P["comp_det"])
    report.append(stats("comp", y, sm))
    gain = TARGET_LUFS - integrated_lufs(y)
    for _ in range(4):
        z, l_gr = limiter(y * undb(gain), PEAK_CEIL, lookahead_s=0.0015, release_s=0.08)
        err = TARGET_LUFS - integrated_lufs(z)
        if abs(err) < 0.05:
            break
        gain += err
    report.append(stats("master", z, sm))
    write_wav(a.out, z)

    ff_a, ff_b = ffmpeg_ebur128(SRC), ffmpeg_ebur128(a.out)
    print(f"\nvoice master v3 ({enh}{', air' if a.air else ''}) -> {a.out}")
    print(f"de-ess thr {ds_thr:.1f} dB, active {np.mean(ds_gr < -0.5) * 100:.1f}% of time, max {ds_gr.min():.1f} dB | "
          f"comp thr {thr:.1f} dBFS, GR mean(speech) {c_gr[sm].mean():.1f} dB, p95 {np.percentile(c_gr[sm], 5):.1f} dB | make-up {gain:+.1f} dB")
    print(f"limiter GR (speech): mean {l_gr[sm].mean():.2f} dB, p99 {np.percentile(l_gr[sm], 1):.1f}, max {l_gr.min():.1f} dB")
    print(f"ffmpeg ebur128  before: I {ff_a['I']:.1f} LUFS  LRA {ff_a['LRA']:.1f} LU  TP {ff_a['TP']:.1f} dBTP")
    print(f"ffmpeg ebur128  after : I {ff_b['I']:.1f} LUFS  LRA {ff_b['LRA']:.1f} LU  TP {ff_b['TP']:.1f} dBTP")
    print("stage      I(LUFS)   TP crest tilt dB/oct floor1 floor5 (dB re speech median) sib99 | band share re total (dB): "
          + " ".join(f"{lo}-{hi}" for lo, hi in BANDS))
    for r in report:
        print(f"{r['name']:<9}{r['I']:8.1f}{r['TP']:6.1f}{r['crest']:6.1f}{r['tilt']:8.2f}{r['floor1']:11.1f}{r['floor5']:7.1f}"
              f"{r['sib99']:29.1f} | " + " ".join(f"{v:6.1f}" for v in r["rel"]))


if __name__ == "__main__":
    main()
