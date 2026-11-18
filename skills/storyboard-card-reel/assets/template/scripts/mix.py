"""Offline mix of the Showcase reel -> out/mix-v3.wav (48 kHz stereo, 24-bit), copied to public/audio/mix-v3.wav.

Re-runnable: every run re-dumps the SFX cues from src/cues.tsx, so after any cue change just run it again
(python scripts/master_voice.py first only if the voice master itself must change).

v3 (the user: « the music you showed me earlier, where is it? »): the v2 bed sat ~22 LU under the voice, and
the Greed track's energy is mostly below 160 Hz, which phone speakers do not play: it vanished. v3:
  bed 13 LU under the voice while he talks (measured after ducking), duck 3.5 dB (attack 15 ms, release 300 ms);
  music EQ: -3 dB @ 2.8 kHz (the 2-4 kHz voice presence band), -1.5 dB @ 250 Hz (room for the voice body),
  +2 dB high shelf @ 10 kHz (air the phone-mic voice does not have: the music shines there without masking);
  music from the first frame (no fade-in), un-ducked +4 dB until the voice starts, settling over 0.4 s.

Layers
  voice  public/audio/voice-master-v3.wav (run scripts/master_voice.py first), centre.
  music  public/audio/music/greed.wav (Mixkit #404 « Greed », 100 BPM, 4/4, bar = 2.4 s, 40 bars, grid starts at 0).
         Arrangement (all cuts on bar lines, checked with onset + bar self-similarity analysis):
           A  mix 0 .. 50.4 s      = track 2.4 .. 52.8 s (starts on bar 1 so the 4-bar phrase hits
                                     land at mix 96.0 s, a full bar before the « dont » fade, not inside it)
              mix 50.4 s .. fade   = track 24.0 s .. (bar 22 -> bar 10: the producer's repeated loop,
                                     residual -36 dB, the 0.6 s before the seam -44 dB: inaudible)
              fade out at(dont)-50 -> at(dont)-2 (equal-power), silent during « DON'T JUST LEARN AI »
           B  end(dont) ..         = track 9.6 s .. (bar 4: the track's first drop, a drum hit after a
                                     dropout) on the exact frame, + impact-soft hit, 1.5 s fade at the end.
         Bed level solved so that music - voice = BED_TALK LU (integrated, while talking, after the duck).
  sfx    every cue of src/cues.tsx (dumped by scripts/dump-sfx.mjs), at its frame, gain = the Studio
         balance (0.32 x vol) scaled by the voice-master gain, then capped so its max momentary
         loudness stays >= 8 LU under the voice short-term loudness at that moment.
Master: gain to -14 LUFS integrated, true-peak lookahead limiter, <= -1 dBTP (ffmpeg-verified).

Usage: python scripts/mix.py            (node must be on PATH for the cue dump)
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audiolib import (SR, db, ffmpeg_ebur128, highpass, integrated_lufs, limiter, loudness_curve, peaking,  # noqa: E402
                      read_wav, rms_env_db, shelf, smooth_gain_db, true_peak_db, undb, write_wav)

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
VOICE_RAW = ROOT / "public/audio/voice-clean-v2.wav"
VOICE = ROOT / "public/audio/voice-master-v3.wav"
MUSIC = ROOT / "public/audio/music/greed.wav"
OUT = ROOT / "out/mix-v3.wav"
PUBLIC = ROOT / "public/audio/mix-v3.wav"
CUES = ROOT / "out/sfx-cues.json"

BAR = 2.4  # s, 100 BPM 4/4
BED_TALK = -13.0  # LU, music vs voice while he talks, measured after ducking (v2 was -21.9)
DUCK_DB = 3.5
DUCK_ATTACK, DUCK_RELEASE = 0.015, 0.300
INTRO_LIFT_DB, INTRO_SETTLE = 4.0, 0.4  # bed lift before the first word, then a 0.4 s settle into the bed
MUSIC_EQ = [("peak", 2800.0, -3.0, 0.8), ("peak", 250.0, -1.5, 1.0), ("high", 10000.0, 2.0, 0.7)]
SFX_MARGIN = 8.0  # LU under the voice, minimum
SFX_STUDIO = 0.32  # Sound.tsx live gain (x vol)
SFX_MAX_S = 150 / FPS  # Sound.tsx <Sequence durationInFrames={150}>
MASTER_LUFS = -14.0
TP_CEIL = -1.2  # limiter ceiling on the 4x oversampled signal, so ffmpeg reads <= -1.0 dBTP
RETURN_HIT = ("audio/sfx/impact-soft.wav", 0.8)  # the hit the music comes back on at end(dont)


def sec(frame: float) -> float:
    return frame / FPS


def smp(t: float) -> int:
    return int(round(t * SR))


def ramp(n: int, up: bool = True) -> np.ndarray:
    """Equal-power (sine) ramp of n samples."""
    r = np.sin(np.linspace(0, np.pi / 2, max(n, 1)))
    return r if up else r[::-1]


def dump_cues() -> dict:
    subprocess.run(["node", str(ROOT / "scripts/dump-sfx.mjs"), str(CUES)], check=True, cwd=ROOT,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return json.loads(CUES.read_text(encoding="utf-8"))


def build_music(track: np.ndarray, total: int, dont_at: int, dont_end: int) -> tuple[np.ndarray, np.ndarray, dict]:
    """Returns (arranged music, its automation gain (fades, no ducking), info)."""
    out = np.zeros((total, 2))
    # --- A: mix t -> track t + 2.4 until the seam at 50.4 s, then mix t -> track t - 26.4
    seam = smp(21 * BAR)  # mix 50.4 s = track bar 22 start (52.8 s) replaced by track bar 10 (24.0 s)
    off1, off2 = smp(BAR), smp(BAR) - smp(12 * BAR)
    a_end = smp(sec(dont_at - 2)) + SR // 10
    xf = smp(0.03)
    t = np.arange(a_end)
    src1 = track[np.clip(t + off1, 0, len(track) - 1)]
    src2 = track[np.clip(t + off2, 0, len(track) - 1)]
    w = np.clip((t - (seam - xf // 2)) / xf, 0, 1)[:, None]  # linear crossfade: the two sides are the same audio
    out[:a_end] = src1 * (1 - w) + src2 * w
    win = slice(seam - smp(0.6), seam)
    seam_res = float(10 * np.log10(((src1[win] - src2[win]) ** 2).mean() / (src1[win] ** 2).mean()))
    # --- B: track bar 4 downbeat on end(dont), 5 ms early so the transient is intact
    b0 = smp(sec(dont_end)) - smp(0.005)
    tb = smp(4 * BAR) - smp(0.005)
    n = total - b0
    out[b0:] = track[tb:tb + n]
    # --- automation
    g = np.ones(total)
    g[: smp(0.005)] *= np.linspace(0, 1, smp(0.005))  # declick only: the music is there on frame 0
    f0, f1 = smp(sec(dont_at - 50)), smp(sec(dont_at - 2))
    g[f0:f1] *= ramp(f1 - f0, up=False)
    g[f1:b0] = 0.0
    g[b0:b0 + smp(0.005)] *= np.linspace(0, 1, smp(0.005))
    e0 = total - smp(1.5)
    g[e0:] *= ramp(total - e0, up=False)
    info = dict(seam_mix=seam / SR, seam_track_from=(seam + off1) / SR, seam_track_to=(seam + off2) / SR,
                seam_residual_db=seam_res, fade=(f0 / SR, f1 / SR), back=b0 / SR + 0.005, back_track=4 * BAR, tail_fade=(e0 / SR, total / SR))
    return out, g, info


def main() -> None:
    cues = dump_cues()
    total = smp(sec(cues["duration"]))
    dont_at, dont_end = cues["dont"]["at"], cues["dont"]["end"]

    # ---------------- voice
    v, sr = read_wav(VOICE)
    assert sr == SR
    v = v[:, 0]
    voice = np.zeros((total, 2))
    voice[: min(total, len(v))] = v[:total, None]
    vI = integrated_lufs(voice)
    v_gain = undb(integrated_lufs(v[:, None]) - integrated_lufs(read_wav(VOICE_RAW)[0]))  # voice master gain vs the raw file Studio balanced on
    voice_end = len(v) / SR

    # ---------------- music
    track, sr = read_wav(MUSIC)
    assert sr == SR and track.shape[1] == 2
    for kind, f0, g_, q in MUSIC_EQ:  # carve the voice's room, add air where the phone-mic voice has none
        track = peaking(track, f0, g_, q) if kind == "peak" else shelf(track, f0, g_, kind, s=q)
    music, auto, minfo = build_music(track, total, dont_at, dont_end)
    # sidechain: voice level (10 ms RMS) -> up to DUCK_DB, proportional over the 12 dB under the speech level
    vl = rms_env_db(voice, 0.010)
    speech = np.percentile(vl[: smp(voice_end)], 70)
    duck = -DUCK_DB * np.clip((vl - (speech - 18)) / 12, 0, 1)
    duck = smooth_gain_db(duck, DUCK_ATTACK, DUCK_RELEASE)
    # intro: before his first word the bed is lifted, then settles (equal-power) into the ducked bed
    onset = int(np.argmax(vl > speech - 30))
    lift = np.zeros(total)
    lift[:onset] = INTRO_LIFT_DB
    n_set = smp(INTRO_SETTLE)
    lift[onset:onset + n_set] = INTRO_LIFT_DB * (1 - np.sin(np.linspace(0, np.pi / 2, n_set)) ** 2)
    talk = np.zeros(total, bool)
    talk[smp(2.0): smp(voice_end)] = True  # past the intro
    talk &= auto > 0.999  # music present (excludes the « dont » fade/silence)
    shape = (auto * undb(duck + lift))[:, None]
    m_gain = 1.0
    for _ in range(3):  # solve the bed level on the ducked result, while talking
        m_gain *= undb(BED_TALK - (integrated_lufs(music * m_gain * shape, mask=talk) - integrated_lufs(voice, mask=talk)))
    music *= m_gain
    music_bed = music * shape

    # ---------------- sfx
    v_st_t, v_st = loudness_curve(voice, 3.0, hop_s=0.05)  # voice short-term loudness (3 s), at window centres
    sfx_bus = np.zeros((total, 2))
    rows = []
    cache: dict[str, np.ndarray] = {}
    events = [(s["src"], s["at"], s["vol"]) for s in cues["sfx"]] + [(RETURN_HIT[0], dont_end, RETURN_HIT[1])]
    for src, at, vol in events:
        if "glass" in src.lower():
            raise SystemExit(f"glass SFX refused: {src}")
        if src not in cache:
            y, s2 = read_wav(ROOT / "public" / src)
            assert s2 == SR, src
            cache[src] = np.repeat(y, 2, axis=1) if y.shape[1] == 1 else y[:, :2]
        y = cache[src][: smp(SFX_MAX_S)].copy()
        y[-smp(0.01):] *= np.linspace(1, 0, smp(0.01))[:, None]
        start = smp(sec(max(0, at)))
        y = y[: max(0, total - start)]
        if not len(y):
            continue
        g0 = SFX_STUDIO * vol * v_gain
        pad = np.zeros((smp(0.4), 2))
        mt, ml = loudness_curve(np.vstack([pad, y * g0, pad]), 0.4, hop_s=0.01)
        k = int(np.argmax(ml))
        m_max, t_peak = float(ml[k]), start / SR + mt[k] - 0.4
        ref = float(np.interp(t_peak, v_st_t, v_st))
        g = g0 * min(1.0, undb(ref - SFX_MARGIN - m_max))
        sfx_bus[start:start + len(y)] += y * g
        rows.append(dict(src=src.split("/")[-1], frame=at, t=start / SR, vol=vol, m=m_max + db(g / g0), ref=ref,
                         margin=ref - (m_max + db(g / g0)), capped=db(g / g0)))

    # ---------------- master
    mix = voice + music_bed + sfx_bus
    gain = MASTER_LUFS - integrated_lufs(mix)
    for _ in range(4):
        out, l_gr = limiter(mix * undb(gain), TP_CEIL, lookahead_s=0.0015, release_s=0.08)
        err = MASTER_LUFS - integrated_lufs(out)
        if abs(err) < 0.03:
            break
        gain += err
    write_wav(OUT, out)
    shutil.copyfile(OUT, PUBLIC)

    # ---------------- report
    ff = ffmpeg_ebur128(OUT)
    mv_talk = integrated_lufs(music_bed, mask=talk) - integrated_lufs(voice, mask=talk)
    mv_base = integrated_lufs(music * auto[:, None], mask=talk) - integrated_lufs(voice, mask=talk)
    # short-term difference distribution while talking
    _, ms_st = loudness_curve(music_bed, 3.0, 0.1)
    _, vs_st = loudness_curve(voice, 3.0, 0.1)
    tt = 1.5 + np.arange(len(ms_st)) * 0.1
    sel = (tt > 2) & (tt < voice_end - 1.5) & ((tt < minfo["fade"][0] - 1.5) | (tt > minfo["back"] + 1.5))
    d = ms_st[sel] - vs_st[sel]
    print(f"\nmix -> {OUT}  (+ copy {PUBLIC})")
    print(f"length {total / SR:.3f} s = {cues['duration']} frames; voice ends {voice_end:.2f} s")
    print(f"MASTER (ffmpeg ebur128): I {ff['I']:.1f} LUFS, true peak {ff['TP']:.1f} dBTP, LRA {ff['LRA']:.1f} LU | "
          f"own meter I {integrated_lufs(out):.2f} LUFS, TP {true_peak_db(out):.2f} dBTP | master gain {gain:+.1f} dB, "
          f"limiter GR mean {l_gr.mean():.2f} dB, max {l_gr.min():.1f} dB")
    print(f"voice stem (stereo) I {vI:.1f} LUFS before master gain; voice onset {onset / SR:.3f} s (intro lift +{INTRO_LIFT_DB:.0f} dB "
          f"until then, settled by {(onset + n_set) / SR:.2f} s)")
    # small-speaker view (phones): what is left above 250 Hz, where Greed's sub/bass energy is gone
    hp = lambda x: highpass(x, 250.0, order=2)
    mv_phone = integrated_lufs(hp(music_bed), mask=talk) - integrated_lufs(hp(voice), mask=talk)
    print(f"small-speaker view (>250 Hz): music vs voice while talking {mv_phone:.1f} LU")
    print(f"music vs voice while talking: {mv_talk:.1f} LU (ducked, target {BED_TALK:.0f}), {mv_base:.1f} LU un-ducked; short-term diff "
          f"median {np.median(d):.1f}, p10 {np.percentile(d, 10):.1f}, p90 {np.percentile(d, 90):.1f} LU; duck mean {duck[talk].mean():.1f} dB")
    print(f"music: seam at mix {minfo['seam_mix']:.2f} s (track {minfo['seam_track_from']:.1f} s -> {minfo['seam_track_to']:.1f} s, "
          f"bar 22 -> bar 10), residual of the 0.6 s before the seam {minfo['seam_residual_db']:.1f} dB; fade {minfo['fade'][0]:.2f}-{minfo['fade'][1]:.2f} s, "
          f"back at {minfo['back']:.3f} s on track {minfo['back_track']:.1f} s (bar 4), tail fade {minfo['tail_fade'][0]:.2f}-{minfo['tail_fade'][1]:.2f} s")
    caps = [r for r in rows if r["capped"] < -0.05]
    print(f"sfx: {len(rows)} events, {len(caps)} capped by the -{SFX_MARGIN:.0f} LU rule; min margin {min(r['margin'] for r in rows):.1f} LU")
    for r in rows:
        print(f"  f{r['frame']:>5} {r['t']:7.2f}s {r['src']:<20} vol {r['vol']:.2f}  M {r['m']:6.1f}  voice S {r['ref']:6.1f}  margin {r['margin']:5.1f}"
              + (f"  capped {r['capped']:.1f} dB" if r["capped"] < -0.05 else ""))


if __name__ == "__main__":
    main()
