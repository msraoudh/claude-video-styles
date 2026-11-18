"""Contact sheets of every downloaded reel (6 frames each, 8 reels per sheet, newest first) + analysis/reels.json
(views, likes, comments, date, caption, music track) — the first look at who the subject is and what works for them.
Then a dense sheet per reel for shot picking: --dense (12 timestamped frames per reel, 4 reels per sheet).
Run in the project folder: python3 ~/.claude/skills/aura-trailer/scripts/ig_sheets.py [--dense] [--skip CODE ...]
"""
import argparse
import glob
import json
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--dense", action="store_true", help="dense shot-picking sheets (needs reels.json)")
ap.add_argument("--skip", nargs="*", default=[], help="codes to leave out (faceless reels...)")
args = ap.parse_args()
SRC, OUT = tlib.path("source"), tlib.path("analysis")
os.makedirs(OUT, exist_ok=True)
tmp = os.path.join(tempfile.mkdtemp(), "f.png")


def grab(video, t, w, h):
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1",
                    "-vf", f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2", tmp], check=True)
    return Image.open(tmp)


if not args.dense:
    W, H, N = 160, 284, 6
    rows = []
    for p in glob.glob(f"{SRC}/*.mp4"):
        c = os.path.basename(p)[:-4]
        ij = f"{SRC}/{c}.info.json"
        info = json.load(open(ij)) if os.path.exists(ij) else {}
        d = float(info.get("duration") or 0) or float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)
        rows.append((info.get("timestamp") or os.path.getmtime(p), c, d, info))
    rows.sort(reverse=True)
    meta = []
    for i in range(0, len(rows), 8):
        chunk = rows[i:i + 8]
        sheet = Image.new("RGB", (N * W + 120, len(chunk) * H), (20, 20, 20))
        dr = ImageDraw.Draw(sheet)
        for r, (ts, c, d, info) in enumerate(chunk):
            for k in range(N):
                sheet.paste(grab(f"{SRC}/{c}.mp4", d * (k + 0.5) / N, W, H), (120 + k * W, r * H))
            n = i + r
            dr.text((4, r * H + 6), f"#{n} {c}", fill=(255, 255, 0))
            dr.text((4, r * H + 24), f"{d:.0f}s", fill=(255, 255, 255))
            dr.text((4, r * H + 42), f"{info.get('view_count') or ''} v", fill=(200, 200, 200))
            meta.append({"n": n, "code": c, "dur": round(d, 1), "views": info.get("view_count"),
                         "likes": info.get("like_count"), "comments": info.get("comment_count"),
                         "date": info.get("upload_date"), "caption": (info.get("description") or "")[:300],
                         "track": info.get("track"), "artist": info.get("artist")})
        out = f"{OUT}/sheet-{i // 8 + 1}.jpg"
        sheet.save(out, quality=85)
        print(out)
    json.dump(meta, open(f"{OUT}/reels.json", "w"), ensure_ascii=False, indent=1)
    print(f"{OUT}/reels.json", len(meta), "reels")
else:
    meta = json.load(open(f"{OUT}/reels.json"))
    reels = [r for r in meta if r["code"] not in set(args.skip)]
    D = f"{OUT}/dense"
    os.makedirs(D, exist_ok=True)
    W, H, N, PER = 135, 240, 12, 4
    for i in range(0, len(reels), PER):
        chunk = reels[i:i + PER]
        sheet = Image.new("RGB", (N * W, len(chunk) * (H + 18)), (15, 15, 15))
        dr = ImageDraw.Draw(sheet)
        for r, m in enumerate(chunk):
            y = r * (H + 18)
            dr.text((4, y + 2), f"#{m['n']} {m['code']}  {m['dur']:.0f}s  {m['caption'][:60]}", fill=(255, 255, 0))
            for k in range(N):
                t = m["dur"] * (k + 0.5) / N
                sheet.paste(grab(f"{SRC}/{m['code']}.mp4", t, W, H), (k * W, y + 18))
                dr.text((k * W + 3, y + 20), f"{t:.1f}", fill=(0, 255, 120))
        out = f"{D}/dense-{i // PER + 1}.jpg"
        sheet.save(out, quality=82)
        print(out)
