# usage: python vad.py audio.raw(16k mono s16le) silero_vad.onnx out.json
# Speech probability every 32 ms from the Silero voice detector (ignores clicks, bumps, handling noise).
import sys, json, numpy as np, onnxruntime as ort

raw, model, out = sys.argv[1:4]
x = np.fromfile(raw, dtype=np.int16).astype(np.float32) / 32768
s = ort.InferenceSession(model)
SR, N, CTX = 16000, 512, 64
state = np.zeros((2, 1, 128), np.float32)
ctx = np.zeros((1, CTX), np.float32)
probs = []
for i in range(0, len(x) - N + 1, N):
    chunk = np.concatenate([ctx, x[i:i + N][None, :]], axis=1)
    p, state = s.run(None, {"input": chunk, "state": state, "sr": np.array(SR, np.int64)})
    ctx = chunk[:, -CTX:]
    probs.append(round(float(p[0][0]), 4))
json.dump({"step": N / SR, "probs": probs}, open(out, "w"))
print("chunks", len(probs), "speech>0.5:", round(sum(p > 0.5 for p in probs) * N / SR, 1), "s")
