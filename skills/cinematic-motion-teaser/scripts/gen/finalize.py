"""Finalize a generated PNG into project assets.

Usage:
  python -I finalize.py SRC.png OUT.jpg WIDTH HEIGHT [--sq OUT-sq.jpg CX CY SIDE]

Centre-crops SRC to WIDTH:HEIGHT aspect, Lanczos-resizes to WIDTHxHEIGHT, light unsharp,
saves q92 JPEG. --sq crops a square of SIDE px (in final-image pixels) centred on (CX, CY)
from the final image, clamped to bounds, resized to 600x600, q92.
"""
import sys

from PIL import Image, ImageFilter


def fit(img, w, h):
    sw, sh = img.size
    target = w / h
    if sw / sh > target:  # too wide -> crop width
        nw = round(sh * target)
        x0 = (sw - nw) // 2
        img = img.crop((x0, 0, x0 + nw, sh))
    else:  # too tall -> crop height
        nh = round(sw / target)
        y0 = (sh - nh) // 2
        img = img.crop((0, y0, sw, y0 + nh))
    img = img.resize((w, h), Image.LANCZOS)
    return img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))


def main():
    a = sys.argv[1:]
    src, out, w, h = a[0], a[1], int(a[2]), int(a[3])
    img = fit(Image.open(src).convert("RGB"), w, h)
    img.save(out, quality=92, optimize=True)
    print("wrote", out, img.size)
    if "--sq" in a:
        i = a.index("--sq")
        sq_out, cx, cy, side = a[i + 1], int(a[i + 2]), int(a[i + 3]), int(a[i + 4])
        side = min(side, w, h)
        x0 = min(max(cx - side // 2, 0), w - side)
        y0 = min(max(cy - side // 2, 0), h - side)
        sq = img.crop((x0, y0, x0 + side, y0 + side)).resize((600, 600), Image.LANCZOS)
        sq.save(sq_out, quality=92, optimize=True)
        print("wrote", sq_out, (x0, y0, side))


if __name__ == "__main__":
    main()
