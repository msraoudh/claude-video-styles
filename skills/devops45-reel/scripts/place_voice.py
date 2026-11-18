"""Voice = master clock. Cut the ElevenLabs take into phrases (one per sentence of episode.json scenes[].say) at the
REAL pauses of the take, then lay them out on the episode timeline:

  0.20 s  hook phrase(s)                      (music: filtered build)
  +TITLE_GAP  series ident « DevOps en 45 secondes » + episode title  (music DROP on the ident)
  body phrases, natural pauses clamped        (scene changes breathe a little more)
  CTA phrases, final hit right AFTER the last word, 1.1 s tail

Writes  video/public/audio/voice.wav (48 kHz mono)
        plan/voice.json   (phrases + words in output seconds/frames, title gap, final hit)
        video/src/data/voice.ts
Then run plan_episode.py (scene ranges) — deliver.sh does it for you.

  python place_voice.py <project>              real take: audio/voice/take.mp3 + take.words.json (align.py)
  python place_voice.py <project> --synthetic  no audio: fake word timings at 2.7 words/s (to build/QA visuals
                                               before the voice exists; voice.wav is silence)
Lessons baked in (brand intro, 2026-10-21):
  - cut at measured energy valleys, never at Whisper word ends (they truncated « Linux », « monitoring »)
  - Whisper word STARTS run ~0.17 s early on Kev → +LAG on every word after a phrase's first one
  - each phrase levelled to the same voiced loudness (Kev drops softer at sentence ends → masked by the music)
"""
import difflib
import os
import subprocess
import sys

import numpy as np

import elib

P = elib.proj()
SYN = "--synthetic" in sys.argv
ep = elib.load_episode(P)
PH = elib.phrases(ep)
if not PH:
    sys.exit("episode.json has no scenes[].say text")
SR, FPS = elib.SR, elib.FPS
cfg = ep.get("timing", {})
START = cfg.get("start_s", 0.20)
TITLE_GAP = cfg.get("title_gap_s", 1.15)       # silence for the series ident (drop lands at its start)
GAP_MIN, GAP_MAX = cfg.get("gap_min_s", 0.20), cfg.get("gap_max_s", 0.45)
SCENE_GAP_MIN, SCENE_GAP_MAX = cfg.get("scene_gap_min_s", 0.30), cfg.get("scene_gap_max_s", 0.60)
TAIL = cfg.get("tail_s", 1.10)
LAG = cfg.get("whisper_lag_s", 0.17)
MAX_DUR = cfg.get("max_s", 50.5)
hook_ids = [ep["scenes"][0]["id"]]
first_body_scene = ep["scenes"][1]["id"] if len(ep["scenes"]) > 1 else None

# ------------------------------------------------------------------ source take
if SYN:
    import re
    words, t = [], 0.0
    for k, (pid, sc, text) in enumerate(PH):
        for w in text.split():
            d = max(0.16, 0.37 * len(elib.norm(w)) / 5)
            words.append([w, round(t, 3), round(t + d * 0.9, 3), 1.0])
            t += d
        t += 0.35
    y = np.zeros(int((t + 1) * SR), np.float32)
    ATEMPO = 1.0
else:
    import json
    take = f"{P}/audio/voice/take.mp3"
    words = json.load(open(f"{P}/audio/voice/take.words.json", encoding="utf-8"))
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", take, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    y = np.frombuffer(raw, dtype=np.float32).copy()
    ATEMPO = float(ep.get("voice", {}).get("atempo", 1.0))

hop = SR // 200  # 5 ms
env = 20 * np.log10(np.sqrt(np.mean(y[: len(y) // hop * hop].reshape(-1, hop) ** 2, axis=1)) + 1e-9)
if SYN:
    env[:] = -90.0
    for w in words:
        env[int(w[1] * 200):int(w[2] * 200)] = -20.0
floor = float(np.percentile(env, 8))
THR = max(-48.0, min(-36.0, floor + 14))  # pause threshold, adapted to the take's noise floor

# ------------------------------------------------------------------ map script phrases → Whisper words
stoks, sidx = [], []
for k, (pid, sc, text) in enumerate(PH):
    for t in elib.tokens(text):
        stoks.append(t)
        sidx.append(k)
wtoks = [elib.norm(w[0]) for w in words]
sm = difflib.SequenceMatcher(None, stoks, wtoks, autojunk=False)
s2w = {}
for a, b, n in sm.get_matching_blocks():
    for i in range(n):
        s2w[a + i] = b + i
cov = len(s2w) / max(1, len(stoks))
if cov < 0.75:
    sys.exit(f"take does not match the script ({cov:.0%} of words matched) — wrong take or TTS changed the text")
spans = []
for k in range(len(PH)):
    idx = [i for i, kk in enumerate(sidx) if kk == k]
    mapped = [s2w[i] for i in idx if i in s2w]
    if not mapped:  # phrase Whisper missed entirely: interpolate between neighbours
        prev = spans[-1][1] if spans else -1
        mapped = [min(prev + 1, len(words) - 1)]
    spans.append((min(mapped), max(mapped)))
for k in range(1, len(spans)):  # monotonic
    if spans[k][0] <= spans[k - 1][1]:
        spans[k] = (spans[k - 1][1] + 1, max(spans[k][1], spans[k - 1][1] + 1))
spans = [(min(a, len(words) - 1), min(b, len(words) - 1)) for a, b in spans]


def longest_pause(a_s, b_s):
    """middle and length of the longest run below THR in [a_s, b_s] (5 ms frames); argmin if none"""
    a, b = max(0, int(a_s * 200)), min(len(env) - 1, int(b_s * 200))
    if b <= a:
        return a_s, 0.0
    q = env[a:b + 1] < THR
    best, run, bs = (0, 0), 0, 0
    for i, v in enumerate(q):
        if v:
            if run == 0:
                bs = i
            run += 1
            if run > best[1]:
                best = (bs, run)
        else:
            run = 0
    if best[1] == 0:
        return (a + int(np.argmin(env[a:b + 1]))) / 200, 0.0
    return (a + best[0] + best[1] / 2) / 200, best[1] / 200


# cut points between consecutive phrases: middle of the real pause between the last word of k and the first of k+1
cuts, pauses = [0.0], []
for k in range(len(PH) - 1):
    lw, nw = words[spans[k][1]], words[spans[k + 1][0]]
    c, plen = longest_pause(lw[1] + 0.08, nw[2])
    cuts.append(c)
    pauses.append(plen)
cuts.append(len(y) / SR)


def onset(t0, t1, thr=None):
    thr = THR + 6 if thr is None else thr
    a, b = int(t0 * 200), int(t1 * 200)
    idx = np.where(env[a:b] > thr)[0]
    return (a + idx[0]) / 200 if len(idx) else t0


def audible_end(t0, t1, thr=None):
    thr = THR + 4 if thr is None else thr
    a, b = int(t0 * 200), int(t1 * 200)
    idx = np.where(env[a:b] > thr)[0]
    return (a + idx[-1] + 1) / 200 if len(idx) else t1


# ------------------------------------------------------------------ layout
MIN_DUR = cfg.get("min_s", 41.0)  # n8n rejects < 38 s; a short take breathes a little more instead


def layout(extra_scene=0.0, extra_in=0.0):
    segs, t_out, title_gap = [], START, None
    for k, (pid, sc, text) in enumerate(PH):
        ci, co = cuts[k], cuts[k + 1]
        on, en = onset(ci, co), audible_end(ci, co)
        if k > 0:
            prev_sc = PH[k - 1][1]
            if prev_sc in hook_ids and sc not in hook_ids:
                title_gap = (t_out, t_out + TITLE_GAP)
                t_out += TITLE_GAP
            elif prev_sc != sc:
                t_out += float(np.clip(pauses[k - 1], SCENE_GAP_MIN, SCENE_GAP_MAX)) + extra_scene
            else:
                t_out += float(np.clip(pauses[k - 1], GAP_MIN, GAP_MAX)) + extra_in
        segs.append(dict(k=k, pid=pid, sc=sc, text=text, ci=ci, co=co, on=on, en=en, place_on=t_out))
        t_out = t_out + (en - on)
    return segs, title_gap, t_out


segs, title_gap, last_end = layout()
short = MIN_DUR - (last_end + 0.03 + TAIL)
if short > 0 and not SYN:
    # stretch the breaths: scene changes first (≤ +0.45 s each), then pauses inside scenes (≤ +0.20 s each)
    n_sc = sum(1 for k in range(1, len(PH)) if PH[k - 1][1] != PH[k][1] and PH[k - 1][1] not in hook_ids)
    n_in = sum(1 for k in range(1, len(PH)) if PH[k - 1][1] == PH[k][1])
    xs = min(0.45, short / max(1, n_sc))
    xi = min(0.20, max(0.0, short - xs * n_sc) / max(1, n_in))
    segs, title_gap, last_end = layout(xs, xi)
    print(f"short take: +{xs:.2f} s per scene change, +{xi:.2f} s per pause → {last_end + 0.03 + TAIL:.1f} s")
final_hit = last_end + 0.03
DUR = round(final_hit + TAIL, 3)
if DUR > MAX_DUR and not SYN:
    print(f"WARNING: {DUR:.1f} s > {MAX_DUR} s — set episode.json voice.atempo (e.g. {min(1.12, DUR / (MAX_DUR - 1)):.2f}) "
          f"and re-run tts/align, or shorten the script")

# ------------------------------------------------------------------ render the voice track + word timings
out = np.zeros(int(DUR * SR) + SR, np.float32)
phr = []
for s in segs:
    k = s["k"]
    pre = min(0.12, s["on"] - s["ci"])        # keep a little air before the onset (breath, consonant attack)
    post = min(0.18, s["co"] - s["en"])       # and after the audible end (reverb tail of the last syllable)
    a_src, b_src = s["on"] - pre, s["en"] + post
    seg = y[int(a_src * SR): int(b_src * SR)].copy()
    if not SYN and len(seg):
        win = 480
        rr = np.sqrt(np.mean(seg[: len(seg) // win * win].reshape(-1, win) ** 2, axis=1))
        voiced = rr[rr > np.percentile(rr, 55)] if len(rr) else rr
        if len(voiced):
            seg *= min(10 ** (-17 / 20) / (np.sqrt(np.mean(voiced ** 2)) + 1e-9), 4.0)
        f = min(len(seg), int(0.006 * SR))
        seg[:f] *= np.linspace(0, 1, f)
        g = min(len(seg), int(0.03 * SR))
        seg[-g:] *= np.linspace(1, 0, g)
    st = int((s["place_on"] - pre) * SR)
    n = max(0, min(len(seg), len(out) - st))
    out[st:st + n] += seg[:n]
    shift = s["place_on"] - s["on"]
    i0, i1 = spans[k]
    wl, last = [], s["on"]
    for n_, i in enumerate(range(i0, i1 + 1)):
        s_src = s["on"] if n_ == 0 else max(words[i][1] + (0 if SYN else LAG), last + 0.05)
        s_src = min(s_src, s["en"] - 0.05)
        last = s_src
        e_src = min(max(words[i][2] + (0 if SYN else LAG), s_src + 0.06), s["en"] + 0.02)
        wl.append({"w": words[i][0], "s": round(s_src + shift, 3), "e": round(e_src + shift, 3),
                   "f": int(round((s_src + shift) * FPS)), "fe": int(round((e_src + shift) * FPS))})
    end_out = s["en"] + shift
    phr.append({"id": s["pid"], "scene": s["sc"], "text": s["text"], "onset": round(s["place_on"], 3),
                "end": round(end_out, 3), "from": int(round(s["place_on"] * FPS)), "to": int(round(end_out * FPS)),
                "srcIn": round(a_src, 3), "srcOut": round(b_src, 3), "words": wl})
    print(f"{s['pid']} {s['sc']:6s} {s['place_on']:6.2f}–{end_out:6.2f}s  src {a_src:6.2f}-{b_src:6.2f}  {s['text']}")

out = out[: int(DUR * SR)]
pk = np.abs(out).max()
if pk > 0.89:
    out *= 0.89 / pk
os.makedirs(f"{P}/video/public/audio", exist_ok=True)
import soundfile as sf
sf.write(f"{P}/video/public/audio/voice.wav", out, SR)
NF = int(round(DUR * FPS))
plan = {"fps": FPS, "duration": DUR, "durationInFrames": NF, "synthetic": SYN, "pause_threshold_db": round(THR, 1),
        "title_gap": [round(title_gap[0], 3), round(title_gap[1], 3)] if title_gap else None,
        "final_hit_s": round(final_hit, 3), "final_hit_f": int(round(final_hit * FPS)), "phrases": phr}
elib.wjson(f"{P}/plan/voice.json", plan)
import json as _j
os.makedirs(f"{P}/video/src/data", exist_ok=True)
with open(f"{P}/video/src/data/voice.ts", "w", encoding="utf-8") as fh:
    fh.write(elib.ts_header("place_voice.py") + "// The voice is the master clock.\n")
    fh.write(f"export const FPS = {FPS};\nexport const DURATION = {NF};\n")
    fh.write("export type Word = {w: string; s: number; e: number; f: number; fe: number};\n")
    fh.write("export type Phrase = {id: string; scene: string; text: string; onset: number; end: number; from: number; to: number; srcIn: number; srcOut: number; words: Word[]};\n")
    fh.write(f"export const PHRASES: Phrase[] = {_j.dumps(phr, ensure_ascii=False, indent=1)};\n")
    fh.write("export const phrase = (id: string) => PHRASES.find((p) => p.id === id)!;\n")
print(f"voice.wav {DUR:.2f} s ({NF} f) · title gap {plan['title_gap']} · final hit {final_hit:.2f} s · pause thr {THR:.0f} dB"
      + (" · SYNTHETIC" if SYN else ""))
