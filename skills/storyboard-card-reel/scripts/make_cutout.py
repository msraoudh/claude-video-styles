"""Cutout of the speaker for words BEHIND the head: Robust Video Matting on the clean-cut face video, then a VP9
alpha webm the Reel draws over the big words (OffthreadVideo transparent, same camera transform as the footage).

The recurrent memory is reset at every jump cut (pieces[].t0 of clean.json), so edges never drag across a cut.
Run on the 1080x1920 face file (the cutout is drawn scaled; 4K is not needed for a soft matte edge).

  python -I make_cutout.py -p <reel folder> --face talk-clean-v1.mp4 --out cutout-v1.webm
  (reads <reel>/remotion-video/src/data/clean.json, writes <reel>/remotion-video/public/footage/<out>)
Model: %LOCALAPPDATA%/reel-pro-edit/models/rvm_mobilenetv3_fp32.onnx (onnxruntime on system Python 3.12).
About 1 frame per 30 ms on CPU: ~2-4 min per minute of video. Run it in the background.
"""
import argparse
import json
import os
import subprocess
from pathlib import Path

import numpy as np
import onnxruntime as ort

W, H = 1080, 1920
MODEL = Path(os.environ.get("LOCALAPPDATA", "")) / "reel-pro-edit" / "models" / "rvm_mobilenetv3_fp32.onnx"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("-p", required=True, help="reel folder")
    ap.add_argument("--face", required=True, help="face file in public/footage (1080x1920)")
    ap.add_argument("--out", required=True, help="cutout webm name in public/footage")
    ap.add_argument("--model", default=str(MODEL))
    a = ap.parse_args()
    R = Path(a.p) / "remotion-video"
    src = R / "public" / "footage" / a.face
    dst = R / "public" / "footage" / a.out
    if dst.exists():
        raise SystemExit(f"{dst} exists (Studio may hold it): use a new name")
    clean = json.loads((R / "src" / "data" / "clean.json").read_text(encoding="utf8"))
    cuts = {p["t0"] for p in clean["pieces"]}
    matte = dst.with_suffix(".matte.mp4")

    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(src), "-vf", f"scale={W}:{H}", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"],
                           stdout=subprocess.PIPE, bufsize=W * H * 3 * 2)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                            "-c:v", "libx264", "-preset", "medium", "-crf", "10", "-pix_fmt", "yuv420p", str(matte)], stdin=subprocess.PIPE)
    sess = ort.InferenceSession(a.model, providers=["CPUExecutionProvider"])
    ratio = np.array([0.25], np.float32)

    def zero():
        return [np.zeros((1, 1, 1, 1), np.float32)] * 4

    rec, n = zero(), 0
    while True:
        buf = dec.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        if n in cuts:
            rec = zero()
        x = np.frombuffer(buf, np.uint8).reshape(H, W, 3).transpose(2, 0, 1)[None].astype(np.float32) / 255
        _fgr, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": ratio})
        enc.stdin.write((np.clip(pha[0, 0], 0, 1) * 255).astype(np.uint8).tobytes())
        n += 1
        if n % 300 == 0:
            print(f"{n} frames", flush=True)
    enc.stdin.close()
    enc.wait()
    # colour from the face file + alpha from the matte -> VP9 with alpha
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-i", str(matte), "-filter_complex",
                    f"[0:v]scale={W}:{H},format=rgba[c];[1:v]scale={W}:{H},format=gray[m];[c][m]alphamerge,format=yuva420p",
                    "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "28", "-row-mt", "1", "-auto-alt-ref", "0", "-an", str(dst)], check=True)
    matte.unlink(missing_ok=True)
    print(f"cutout: {n} frames -> {dst}")


if __name__ == "__main__":
    main()
