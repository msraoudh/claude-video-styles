"""Measured QA of a delivered episode + report.json for n8n (the Producer's final answer).
Checks: format (1080x1920, 60 fps, H.264 + AAC, 38–52 s, ≤ 46 MB), loudness (−14 ±1 LUFS, true peak ≤ −1 dBTP),
voice lead over music+SFX on every phrase (≥ 8 dB broadband), blind Whisper transcript vs the script (≥ 85 % words),
black / frozen stretches, placeholder archetypes. Builds qa/sheet.jpg (one frame per scene) — LOOK at it.
  bash wpy.sh qa.py <project>
"""
import difflib
import glob
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import elib  # noqa: E402

P = elib.proj()
O = elib.out_dir(P)
ep = elib.load_episode(P)
F = f"{O}/final.mp4"
issues, info = [], {}


def run(*a):
    return subprocess.run(list(a), capture_output=True, text=True)


# ---------------------------------------------------------------- format
pr = json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", F).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video")
a = next((s for s in pr["streams"] if s["codec_type"] == "audio"), None)
dur = float(pr["format"]["duration"])
size = os.path.getsize(F)
info.update(duration_s=round(dur, 2), size_mb=round(size / 1048576, 1), width=v["width"], height=v["height"],
            fps=v["r_frame_rate"], vcodec=v["codec_name"], acodec=a and a["codec_name"])
if (v["width"], v["height"]) != (1080, 1920):
    issues.append(("high", "format", f"{v['width']}x{v['height']}"))
if v["r_frame_rate"] != "60/1":
    issues.append(("medium", "format", f"fps {v['r_frame_rate']}"))
if not a:
    issues.append(("high", "audio", "no audio stream"))
LANG = ep.get("lang", "fr")
DMIN, DMAX = ((100, 140) if ep.get("timing", {}).get("min_s", 0) >= 100 else (55, 70)) if LANG == "en" else (38, 52)  # English: 60 s or long ~2 min
if not DMIN <= dur <= DMAX:
    issues.append(("high", "duration", f"{dur:.1f} s (expected {DMIN}–{DMAX})"))
if size > 46_000_000:
    issues.append(("high", "size", f"{size / 1048576:.1f} MB > 44 MB (Telegram preview)"))

# ---------------------------------------------------------------- loudness
eb = run("ffmpeg", "-nostdin", "-hide_banner", "-nostats", "-i", F, "-af", "ebur128=peak=true", "-f", "null", "-").stderr
summ = eb[eb.rfind("Summary:"):]
mi = re.search(r"I:\s+(-?[\d.]+) LUFS", summ)
mt = re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ)
I, TP = float(mi.group(1)), float(mt.group(1)) if mt else 0.0
info.update(loudness_lufs=I, true_peak_dbtp=TP)
if abs(I + 14) > 1.0:
    issues.append(("medium", "loudness", f"{I} LUFS"))
if TP > -1.0:
    issues.append(("medium", "true peak", f"{TP} dBTP"))

# ---------------------------------------------------------------- voice lead per phrase (stems)
vp = json.load(open(f"{P}/plan/voice.json", encoding="utf-8"))
vo, sr = sf.read(f"{O}/voice.wav", always_2d=True)
bed = sf.read(f"{O}/music.wav", always_2d=True)[0] + sf.read(f"{O}/sfx.wav", always_2d=True)[0]
leads = []
for p in vp["phrases"]:
    s, e = int(p["onset"] * sr), int(p["end"] * sr)
    rv = np.sqrt(np.mean(vo[s:e] ** 2)) + 1e-9
    rb = np.sqrt(np.mean(bed[s:e] ** 2)) + 1e-9
    leads.append(round(float(20 * np.log10(rv / rb)), 1))
info["voice_lead_db_min"] = min(leads)
for p, l in zip(vp["phrases"], leads):
    if l < 8:
        issues.append(("medium", f"mix {p['id']}", f"voice only {l} dB above music+sfx: « {p['text'][:40]} »"))

# ---------------------------------------------------------------- sound design present (the series sound = SFX too)
sfxs = sf.read(f"{O}/sfx.wav", always_2d=True)[0]
sfx_rms = float(20 * np.log10(np.sqrt(np.mean(sfxs ** 2)) + 1e-9))
info["sfx_rms_db"] = round(sfx_rms, 1)
if sfx_rms < -60:
    issues.append(("high", "sfx", f"the SFX stem is silent ({sfx_rms:.0f} dB): no sound effects in the mix"))
log_p = f"{P}/audio/out/cues.log"
log = open(log_p, encoding="utf-8").read().splitlines() if os.path.exists(log_p) else []
missing = [l for l in log if l.startswith("MISSING")]
if missing:
    issues.append(("high", "sfx", f"{len(missing)} cue sounds missing: {', '.join(missing[:4])}"))
info["sfx_cues"] = len(log) - len(missing)
cues_p = f"{P}/plan/cues.json"
cued = {c.get("src", "").split(":")[0] for c in json.load(open(cues_p))} if os.path.exists(cues_p) else set()
cued |= {os.path.basename(p)[:-5] for p in glob.glob(f"{P}/video/src/data/cues/*.json") if json.load(open(p))}
for s in json.load(open(f"{P}/plan/scenes.json", encoding="utf-8"))["scenes"]:
    if s["id"] not in cued:
        issues.append(("medium", f"sfx {s['id']}", f"scene '{s['type']}' has no sound cue"))

# ---------------------------------------------------------------- blind transcript
from faster_whisper import WhisperModel  # noqa: E402

wav = f"{P}/qa/blind.wav"
run("ffmpeg", "-nostdin", "-v", "error", "-y", "-i", F, "-ac", "1", "-ar", "16000", wav)
model = WhisperModel("large-v3", device=os.environ.get("WHISPER_DEVICE", "cuda"), compute_type="float16" if os.environ.get("WHISPER_DEVICE", "cuda") == "cuda" else "int8")
segs, _ = model.transcribe(elib.audio16k(wav), language=LANG, beam_size=5, vad_filter=False)  # NO prompt: blind
heard = " ".join(s.text.strip() for s in segs)
want_t, heard_t = elib.tokens(elib.clean_script(ep)), elib.tokens(heard)
m = difflib.SequenceMatcher(None, want_t, heard_t, autojunk=False)
match = sum(b.size for b in m.get_matching_blocks()) / max(1, len(want_t))
info.update(blind_transcript=heard, script_match=round(match, 3))
if match < 0.85:
    issues.append(("high", "voice", f"only {match:.0%} of the script heard blind (masked words or cut phrases)"))

# ---------------------------------------------------------------- black / frozen / placeholders
bd = run("ffmpeg", "-nostdin", "-hide_banner", "-i", F, "-vf", "blackdetect=d=0.4:pix_th=0.04", "-an", "-f", "null", "-").stderr
blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)
for s, e in blacks:
    if float(s) < dur - 1.5:  # the tail fade is allowed
        issues.append(("medium", "picture", f"black {float(s):.1f}–{float(e):.1f} s"))
fz = run("ffmpeg", "-nostdin", "-hide_banner", "-i", F, "-vf", "scale=270:-1,freezedetect=n=0.002:d=1.6", "-an", "-f", "null", "-").stderr
for s in re.findall(r"freeze_start: ([\d.]+)", fz):
    if float(s) < dur - 2.0:
        issues.append(("medium", "picture", f"frozen ≥ 1.6 s at {float(s):.1f} s (never static)"))
scn = json.load(open(f"{P}/plan/scenes.json", encoding="utf-8"))
for s in scn["scenes"]:
    if s["type"] == "custom":
        continue
    src = f"{P}/video/src/archetypes/{s['type']}/index.tsx"
    if not os.path.exists(src) or "Placeholder(p)" in open(src).read():
        issues.append(("high", s["id"], f"archetype '{s['type']}' is a placeholder"))

# ---------------------------------------------------------------- contact sheet (one frame per scene, at 60 % of it)
os.makedirs(f"{P}/qa/sheet", exist_ok=True)
for f_ in glob.glob(f"{P}/qa/sheet/*.jpg"):
    os.remove(f_)
for i, s in enumerate(scn["scenes"]):
    t = (s["from"] + 0.6 * (s["to"] - s["from"])) / 60
    run("ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", F, "-frames:v", "1", "-vf", "scale=270:-1",
        f"{P}/qa/sheet/{i:02d}.jpg")
n = len(scn["scenes"])
cols = 5
run("ffmpeg", "-nostdin", "-v", "error", "-y", "-framerate", "1", "-i", f"{P}/qa/sheet/%02d.jpg", "-vf",
    f"tile={cols}x{(n + cols - 1) // cols}:padding=6:color=0x111111", "-frames:v", "1", f"{P}/qa/sheet.jpg")

# ---------------------------------------------------------------- report
high = [i for i in issues if i[0] == "high"]
mp = json.load(open(f"{P}/plan/music.json"))
files = [f for f in ("final.mp4", "cover.jpg", "captions.srt", "caption.txt", "alt_text.txt", "mix.wav", "voice.wav",
                     "music.wav", "sfx.wav") if os.path.exists(f"{O}/{f}")]
rep = {
    "ok": not high, "episode_id": ep.get("id"), "topic": ep.get("topic"), "duration_s": round(dur, 2),
    "engine": "remotion", "skills_used": ["devops45-reel", "remotion-best-practices"],
    "deliverable": F, "files": files, "format": info, "voice": {"provider": "ElevenLabs", "voice_id":
    ep.get("voice", {}).get("voice_id", "<YOUR_ELEVENLABS_VOICE_ID>"), "model": ep.get("voice", {}).get("model", "eleven_v4")},
    "music": {"title": mp["title"], "credit": mp["credit"], "licence": mp["licence"], "offset_s": mp["offset"]},
    "scenes": [f"{s['id']}:{s['type']}" for s in scn["scenes"]],
    "issues": [{"severity": s, "where": w, "problem": p} for s, w, p in issues],
    "qa_sheet": f"{P}/qa/sheet.jpg", "published": False,
}
if high:
    rep["error"] = "; ".join(f"{w}: {p}" for _, w, p in high)
elib.wjson(f"{O}/report.json", rep)
print(f"QA {'PASS' if not high else 'FAIL'} · {dur:.1f} s · {I} LUFS · TP {TP} · lead ≥ {min(leads)} dB · "
      f"blind match {match:.0%} · {len(issues)} issues")
for s, w, p in issues:
    print(f"  [{s}] {w}: {p}")
