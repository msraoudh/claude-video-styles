import os
import sys, wave, numpy as np
from faster_whisper import WhisperModel
wf = wave.open(sys.argv[1]); audio = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
segs, _ = m.transcribe(audio, language=os.environ.get("WHISPER_LANG", "fr"), word_timestamps=False, vad_filter=False, condition_on_previous_text=True, beam_size=5,
                       initial_prompt=os.environ.get("WHISPER_PROMPT", "the user, Claude, la tech, le cloud, l'IA, wesh, frère."))
for s in segs: print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}", flush=True)
