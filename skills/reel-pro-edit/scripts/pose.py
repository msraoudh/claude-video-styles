# usage: python pose.py video.mp4 pose_landmarker.task out.json
# Per frame: shoulders, elbows, wrists, hips (normalised x,y + visibility) to find raised arms (armpits).
import sys, json, subprocess, numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions

video, model, out = sys.argv[1:4]
W, H = 540, 960
proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={W}:{H}", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"],
                        stdout=subprocess.PIPE, bufsize=W * H * 3 * 4)
lm = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model), running_mode=vision.RunningMode.VIDEO, num_poses=1))
IDS = {"lS": 11, "rS": 12, "lE": 13, "rE": 14, "lW": 15, "rW": 16, "lH": 23, "rH": 24}
rows, i = [], 0
while True:
    buf = proc.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    r = lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.frombuffer(buf, np.uint8).reshape(H, W, 3)), int(i * 1000 / 30))
    if r.pose_landmarks:
        p = r.pose_landmarks[0]
        rows.append({k: [round(p[j].x, 4), round(p[j].y, 4), round(p[j].visibility, 2)] for k, j in IDS.items()})
    else:
        rows.append(None)
    i += 1
json.dump(rows, open(out, "w"))
print("frames", i, "with pose", sum(r is not None for r in rows))
