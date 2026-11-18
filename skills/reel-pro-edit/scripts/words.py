# usage: python words.py cut-voice-16k.wav out.json  -> word timings on the cut timeline
import os
import sys, json, wave, numpy as np
from faster_whisper import WhisperModel
wf = wave.open(sys.argv[1]); audio = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
segs, _ = m.transcribe(audio, language=os.environ.get("WHISPER_LANG", "fr"), word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=True,
                       initial_prompt=os.environ.get("WHISPER_PROMPT", "the user, Claude, la tech, le cloud, l'IA, wesh, frère."))
words = [{"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 2)} for s in segs for w in s.words]
json.dump(words, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(" ".join(f'{w["w"].strip()}@{w["s"]:.2f}' for w in words))
