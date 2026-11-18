"""Word timings of the take with faster-whisper large-v3 (GPU) → audio/voice/take.words.json  [[word, start, end, prob]].
Applies episode.json voice.atempo first (take-raw.mp3 → take.mp3) when the take is too long for 45–50 s.
Run through the whisper venv:   bash wpy.sh align.py <project>
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import elib  # noqa: E402

P = elib.proj()
ep = elib.load_episode(P)
D = f"{P}/audio/voice"
raw, take = f"{D}/take-raw.mp3", f"{D}/take.mp3"
at = float(ep.get("voice", {}).get("atempo", 1.0))
if not os.path.exists(raw):
    sys.exit(f"missing {raw} (run tts.py or save the ElevenLabs take there)")
af = ["-af", f"atempo={at}"] if abs(at - 1) > 1e-3 else []
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", raw, *af, "-ar", "44100", "-b:a", "192k", take], check=True)

from faster_whisper import WhisperModel  # noqa: E402

model = WhisperModel("large-v3", device=os.environ.get("WHISPER_DEVICE", "cuda"), compute_type="float16" if os.environ.get("WHISPER_DEVICE", "cuda") == "cuda" else "int8")
segs, info = model.transcribe(elib.audio16k(take), language="fr", word_timestamps=True, vad_filter=False, beam_size=5,
                              initial_prompt=elib.clean_script(ep)[:600])
words = []
for s in segs:
    for w in s.words or []:
        if elib.norm(w.word):  # drop bare punctuation tokens
            words.append([w.word.strip(), round(w.start, 3), round(w.end, 3), round(w.probability, 2)])
# Whisper hallucinates repeats at the end of a take (seen: the whole CTA again, 14 words packed in 0.2 s) →
# drop every run of ≥ 4 consecutive words that each last < 40 ms
bad, run = set(), []
for i, w in enumerate(words + [["", 0, 1, 0]]):
    if w[2] - w[1] < 0.04:
        run.append(i)
    else:
        if len(run) >= 4:
            bad.update(run)
        run = []
if bad:
    print(f"dropped {len(bad)} hallucinated words: « {' '.join(words[i][0] for i in sorted(bad))} »")
words = [w for i, w in enumerate(words) if i not in bad]
json.dump(words, open(f"{D}/take.words.json", "w", encoding="utf-8"), ensure_ascii=False)
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", take],
                           capture_output=True, text=True).stdout)
print(f"take.mp3 {dur:.2f} s (atempo {at}) · {len(words)} words · « {' '.join(w[0] for w in words[:12])} … »")
