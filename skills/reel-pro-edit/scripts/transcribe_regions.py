# usage: python transcribe_regions.py voice-16k.wav regions.json out.json
# Re-transcribes each speech region on its own: short clips give much tighter word timings.
import os
import sys, json, wave, numpy as np
from faster_whisper import WhisperModel
wf = wave.open(sys.argv[1]); audio = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
regs = json.load(open(sys.argv[2]))
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
PAD = 0.2
out = []
for r in regs:
    a = max(0, r["a"] - PAD); b = r["b"] + PAD
    clip = audio[int(a * 16000):int(b * 16000)]
    segs, _ = m.transcribe(clip, language=os.environ.get("WHISPER_LANG", "fr"), word_timestamps=True, vad_filter=False, beam_size=5,
                           condition_on_previous_text=False,
                           initial_prompt=os.environ.get("WHISPER_PROMPT", "the user, Claude, la tech, le cloud, l'IA, wesh, frère."))
    ws = [{"w": w.word.strip(), "s": round(a + w.start, 3), "e": round(a + w.end, 3), "p": round(w.probability, 2)} for s in segs for w in s.words]
    out.append({**r, "words": ws})
    print(r["id"], f'{r["a"]:.2f}', " ".join(f'{w["w"]}@{w["s"]:.2f}' for w in ws), flush=True)
json.dump(out, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
