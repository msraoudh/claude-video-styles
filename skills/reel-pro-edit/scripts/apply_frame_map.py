# usage: python apply_frame_map.py in.mp4 frame-map.json out.mp4 WIDTH HEIGHT
# Re-times a video frame by frame: output frame k shows input frame map[k].
# Sources stay within a few dozen frames of k, so only a small window is kept in memory.
import sys, json, subprocess

src, mapf, out, W, H = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
fmap = json.load(open(mapf))
size = W * H * 3 // 2  # yuv420p
dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-pix_fmt", "yuv420p", "-f", "rawvideo", "-"], stdout=subprocess.PIPE, bufsize=size * 4)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-g", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
                       stdin=subprocess.PIPE)
frames, nxt = {}, 0
for k, want in enumerate(fmap):
    while want >= nxt:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            raise SystemExit(f"input ended at frame {nxt}, needed {want}")
        frames[nxt] = buf
        nxt += 1
    enc.stdin.write(frames[want])
    for old in [i for i in frames if i < k - 64]:
        del frames[old]
enc.stdin.close(); enc.wait()
print("wrote", len(fmap), "frames")
