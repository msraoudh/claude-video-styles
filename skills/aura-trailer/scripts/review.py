"""Review sheets of the RENDERED trailer (what the viewer sees, TrailerFX included): 30 frames per sheet (10 x 3),
each labelled with its frame and second. Default frames: every section start, every line start and end, every big
808 hit, the frame after each, and one frame per second in between. Pass frames to choose them yourself.
Usage (in the project folder): python3 review.py <video.mp4> <out_prefix> [frame ...]  -> <prefix>-1.jpg ..."""
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402

video, prefix = sys.argv[1], sys.argv[2]
FPS = tlib.plan()["fps"] if os.path.exists(tlib.path("plan/plan.json")) else 60
if len(sys.argv) > 3:
    KEY = [int(x) for x in sys.argv[3:]]
else:
    p = tlib.plan()
    NF = p["durationInFrames"]
    ks = {s["from"] for s in p["sections"]} | {s["from"] + 2 for s in p["sections"]}
    for l in p["lines"]:
        ks |= {l["from"] + 6, l["from"] + l["durationInFrames"] - 6}
    for h in p["bigHits"]:
        ks |= {h["f"], h["f"] + 3}
    ks |= set(range(FPS // 2, NF, FPS))
    KEY = sorted(k for k in ks if 0 <= k < NF)
tmp = tempfile.mkdtemp()
W, H, cols, rows = 216, 384, 10, 3
per = cols * rows
for i, f in enumerate(KEY):
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{f / FPS + 0.0001:.4f}", "-i", video, "-frames:v", "1",
                    "-vf", f"scale={W}:{H}", f"{tmp}/{i:04d}.png"], check=True)
for s in range(0, len(KEY), per):
    chunk = KEY[s:s + per]
    sheet = Image.new("RGB", (cols * W, rows * (H + 18)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for k, f in enumerate(chunk):
        x, y = (k % cols) * W, (k // cols) * (H + 18)
        sheet.paste(Image.open(f"{tmp}/{s + k:04d}.png"), (x, y + 18))
        d.text((x + 4, y + 3), f"{f}  {f / FPS:.2f}s", fill=(255, 255, 0))
    out = f"{prefix}-{s // per + 1}.jpg"
    sheet.save(out, quality=85)
    print(out)
