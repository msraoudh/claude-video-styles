# usage: python mouth.py video.mov start_s duration_s model.task out.json
# Tracks the face and records, per frame (15 fps, timeline time), how open the mouth is.
import sys, json, subprocess, numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions

video, start, dur, model, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], sys.argv[5]
W, H, FPS = 540, 960, 15
cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(start), "-t", str(dur), "-i", video,
       "-vf", f"fps={FPS},scale={W}:{H}", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"]
proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=W * H * 3 * 4)

lm = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model), running_mode=vision.RunningMode.VIDEO,
    output_face_blendshapes=True, num_faces=1))

rows, i = [], 0
while True:
    buf = proc.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.frombuffer(buf, np.uint8).reshape(H, W, 3))
    r = lm.detect_for_video(img, int(i * 1000 / FPS))
    t = round(i / FPS, 4)
    if r.face_landmarks:
        p = r.face_landmarks[0]
        face_h = abs(p[152].y - p[10].y) or 1e-6           # chin to forehead
        gap = abs(p[14].y - p[13].y) / face_h               # inner lip opening
        bs = {c.category_name: c.score for c in r.face_blendshapes[0]}
        rows.append([t, round(gap, 5), round(bs.get("jawOpen", 0), 4), round(bs.get("mouthClose", 0), 4)])
    else:
        rows.append([t, None, None, None])
    i += 1
    if i % 600 == 0:
        print(f"{i / FPS:.0f}s", flush=True)

json.dump({"fps": FPS, "cols": ["t", "lipGap", "jawOpen", "mouthClose"], "rows": rows}, open(out, "w"))
print("done frames", i, "with face", sum(r[1] is not None for r in rows))
