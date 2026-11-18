# usage: python music_beats.py track.mp3 START-END [START-END ...]
# Low-end (kick) energy strip at 40 ms resolution for each window, to find the exact downbeat of a drop
# (the first big '#'/'@' after a quiet stretch). Use it to align the drop on a word to the frame.
import sys, subprocess, numpy as np
SR = 22050
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                                 capture_output=True).stdout, np.int16).astype(np.float32) / 32768
low = np.convolve(x, np.ones(60) / 60, "same")  # crude low-pass ~ kick band
for rng in sys.argv[2:]:
    a, b = map(float, rng.split("-"))
    s = ""
    for t in np.arange(a, b, 0.04):
        i = int(t * SR)
        r = 20 * np.log10(np.sqrt(np.mean(low[i:i + int(0.04 * SR)] ** 2)) + 1e-6)
        s += " .:-=+*#%@"[max(0, min(9, int((r + 50) / 4)))]
    print(f"{a:7.2f} {s} {b:.2f}   (one char = 40 ms)")
