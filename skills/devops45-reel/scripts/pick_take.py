"""Several ElevenLabs takes of the same script → keep the one Whisper hears closest to the script, as the episode's take.
Then run place_voice.py. (Generate 2 takes per episode: one often mangles a word — « AWS » became « à WS » once.)
  bash wpy.sh pick_take.py <project> take-1.mp3 take-2.mp3 [...]
Writes audio/voice/take-raw.mp3 (the winner), take.mp3 (atempo applied) and take.words.json, like align.py.
"""
import difflib
import json
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import elib  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

P = elib.proj()
takes = sys.argv[2:]
if not takes:
    sys.exit("usage: pick_take.py <project> take-1.mp3 [take-2.mp3 ...]")
ep = elib.load_episode(P)
want = elib.tokens(elib.clean_script(ep))
model = WhisperModel("large-v3", device=os.environ.get("WHISPER_DEVICE", "cuda"), compute_type="float16" if os.environ.get("WHISPER_DEVICE", "cuda") == "cuda" else "int8")


def words_of(path):
    segs, _ = model.transcribe(elib.audio16k(path), language="fr", word_timestamps=True, vad_filter=False, beam_size=5,
                               initial_prompt=elib.clean_script(ep)[:600])
    ws = [[w.word.strip(), round(w.start, 3), round(w.end, 3), round(w.probability, 2)]
          for s in segs for w in (s.words or []) if elib.norm(w.word)]
    bad, run = set(), []  # hallucinated repeats: ≥ 4 consecutive words of < 40 ms
    for i, w in enumerate(ws + [["", 0, 1, 0]]):
        if w[2] - w[1] < 0.04:
            run.append(i)
        else:
            if len(run) >= 4:
                bad.update(run)
            run = []
    return [w for i, w in enumerate(ws) if i not in bad]


best = None
for t in takes:
    ws = words_of(t)
    got = [elib.norm(w[0]) for w in ws]
    m = difflib.SequenceMatcher(None, want, got, autojunk=False)
    match = sum(b.size for b in m.get_matching_blocks()) / max(1, len(want))
    low = sum(1 for w in ws if w[3] < 0.5)
    score = match - 0.002 * low
    print(f"{os.path.basename(t)}: match {match:.1%} · {low} low-confidence words")
    if best is None or score > best[0]:
        best = (score, t, ws)
D = f"{P}/audio/voice"
os.makedirs(D, exist_ok=True)
shutil.copy(best[1], f"{D}/take-raw.mp3")
at = float(ep.get("voice", {}).get("atempo", 1.0))
af = ["-af", f"atempo={at}"] if abs(at - 1) > 1e-3 else []
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", f"{D}/take-raw.mp3", *af, "-ar", "44100", "-b:a", "192k",
                f"{D}/take.mp3"], check=True)
ws = best[2] if not af else words_of(f"{D}/take.mp3")
json.dump(ws, open(f"{D}/take.words.json", "w", encoding="utf-8"), ensure_ascii=False)
print(f"kept {os.path.basename(best[1])} → {D}/take.mp3 · {len(ws)} words")
