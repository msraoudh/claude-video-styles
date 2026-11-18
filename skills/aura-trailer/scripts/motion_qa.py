"""Motion QA of a rendered video (you can't watch it): per-frame luma + frame-to-frame difference.
Flags black runs (unintended?), frozen runs (a dead shot), prints hard changes (cuts) per second and luma per second —
the cut density must climb with the music (1 cut / 2 beats -> 1 / beat -> strobes) and the silences must breathe.
Usage: python3 motion_qa.py <video.mp4> [fps]"""
import subprocess
import sys

import numpy as np

v = sys.argv[1]
FPS = int(sys.argv[2]) if len(sys.argv) > 2 else 60
W, H = 108, 192
raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", v, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(fr)
luma = fr.mean(axis=(1, 2))
diff = np.r_[0, np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))]
secs = int(np.ceil(n / FPS))
print("frames", n)


def runs(mask, minlen):
    out, s = [], None
    for i, m in enumerate(list(mask) + [False]):
        if m and s is None:
            s = i
        if not m and s is not None:
            if i - s >= minlen:
                out.append((s, i - 1))
            s = None
    return out


print("black runs (luma<3, >=4 f):", runs(luma < 3, 4))
print("frozen runs (diff<0.15, >=10 f):", runs(diff < 0.15, 10))
cuts = np.where(diff > 18)[0]
print("hard changes (diff>18):", len(cuts))
print("cuts per second:", " ".join(str(int(((cuts >= s * FPS) & (cuts < (s + 1) * FPS)).sum())) for s in range(secs)))
print("luma per second:", " ".join(f"{luma[s * FPS:(s + 1) * FPS].mean():.0f}" for s in range(secs)))
