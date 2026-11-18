"""Tile fNNNN.jpg stills into one labelled contact sheet (frame · seconds). WSL python3 + PIL.
  python3 sheet.py <stills dir> <out.jpg> [cols=10]
"""
import glob
import os
import sys

from PIL import Image, ImageDraw

d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 10
fs = sorted(glob.glob(os.path.join(d, "f*.jpg")))
ims = [Image.open(f) for f in fs]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * (w + 4), rows * (h + 18)), (17, 17, 17))
dr = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * (w + 4), (i // cols) * (h + 18)
    S.paste(im, (x, y + 16))
    fr = int(os.path.basename(f)[1:5])
    dr.text((x + 3, y + 2), f"{fr} · {fr / 30:.1f}s", fill=(255, 200, 120))
S.save(out, quality=82)
print(len(fs), "stills →", out, S.size)
