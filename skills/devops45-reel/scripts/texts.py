"""Text deliverables next to final.mp4: captions.srt (≤ 2 lines × 42 chars per cue, from the placed voice),
caption.txt (Instagram caption = episode.json caption, else the brief's caption.text) and alt_text.txt.
  ~/.venvs/audio/bin/python texts.py <project>
"""
import json
import os

import elib

P = elib.proj()
O = elib.out_dir(P)
ep = elib.load_episode(P)
vp = json.load(open(f"{P}/plan/voice.json", encoding="utf-8"))


def ts(t):
    h, r = divmod(max(0.0, t), 3600)
    m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"


cues = []
for p in vp["phrases"]:
    words, line, lines, start = p["words"], "", [], None
    chunk = []
    for w in words:
        t = w["w"].strip()
        glue = t.startswith(("'", "-")) or t in ",.?!…:;"
        cand = (line + t) if glue or not line else f"{line} {t}"
        if len(cand) > 42 and line:
            lines.append(line)
            line = t
            if len(lines) == 2:
                chunk.append((start, w["s"], lines))
                lines, start = [], None
        else:
            line = cand
        if start is None:
            start = w["s"]
    if line:
        lines.append(line)
    if lines:
        chunk.append((start if start is not None else p["onset"], p["end"] + 0.25, lines))
    for i, (a, b, ls) in enumerate(chunk):
        cues.append((a, chunk[i + 1][0] if i + 1 < len(chunk) else b, ls))
with open(f"{O}/captions.srt", "w", encoding="utf-8") as fh:
    for i, (a, b, ls) in enumerate(cues, 1):
        fh.write(f"{i}\n{ts(a)} --> {ts(b)}\n" + "\n".join(ls) + "\n\n")
brief = json.load(open(f"{P}/brief.json", encoding="utf-8")) if os.path.exists(f"{P}/brief.json") else {}
cap = ep.get("caption") or (brief.get("caption") or {}).get("text") or ep.get("topic", "")
open(f"{O}/caption.txt", "w", encoding="utf-8").write(cap.strip() + "\n")
if ep.get("lang") == "en":
    alt = (f"Animated {round(vp['duration'])}-second video, « {ep.get('series', 'DevOps in 60 seconds')} », episode "
           f"{ep.get('number', '')}: {ep.get('topic', '')}. Dark blue background, animated diagrams and terminal, captions. "
           f"Voice-over: {elib.clean_script(ep)}")
else:
  alt = (f"Vidéo animée de {round(vp['duration'])} secondes, « {ep.get('series', 'DevOps en 45 secondes')} », épisode "
         f"{ep.get('number', '')} : {ep.get('topic', '')}. Fond bleu nuit, cartes en verre et terminal animés, sous-titres. "
         f"Voix off : {elib.clean_script(ep)}")
open(f"{O}/alt_text.txt", "w", encoding="utf-8").write(alt[:1000] + "\n")
print(f"captions.srt {len(cues)} cues · caption.txt {len(cap)} chars · alt_text.txt")
