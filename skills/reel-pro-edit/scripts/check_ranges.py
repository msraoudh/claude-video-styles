# usage: python check_ranges.py voice-16k.wav "a-b" "a-b" ...   -> what is said in each exact range
import os
import sys, wave, numpy as np
from faster_whisper import WhisperModel
wf = wave.open(sys.argv[1]); audio = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
for r in sys.argv[2:]:
    a, b = map(float, r.split("-"))
    segs, _ = m.transcribe(audio[int(a*16000):int(b*16000)], language=os.environ.get("WHISPER_LANG", "fr"), word_timestamps=True, vad_filter=False, condition_on_previous_text=False,
                           initial_prompt=os.environ.get("WHISPER_PROMPT", "the user, Claude, la tech, le cloud, l'IA, wesh, frère."))
    print(f"{r:>14} | " + " ".join(f"{w.word.strip()}@{a+w.start:.2f}" for s in segs for w in s.words), flush=True)
