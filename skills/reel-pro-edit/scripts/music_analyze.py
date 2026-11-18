import sys, subprocess, numpy as np
SR = 11025
for f in sys.argv[1:]:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    hop = 256; fr = len(x) // hop
    e = np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) for i in range(fr)])
    on = np.maximum(0, np.diff(np.log(e + 1e-4)))  # onset strength
    ac = np.correlate(on - on.mean(), on - on.mean(), "full")[len(on)-1:]
    lags = np.arange(len(ac)) * hop / SR
    ok = (lags > 60/180) & (lags < 60/70)
    bpm = 60 / lags[ok][np.argmax(ac[ok])]
    # bass energy (lowpass via moving average) per 1 s
    sec = len(x) // SR
    rms = [20*np.log10(np.sqrt(np.mean(x[i*SR:(i+1)*SR]**2))+1e-6) for i in range(sec)]
    k = 40; bass = np.convolve(x, np.ones(k)/k, "same")
    brms = [20*np.log10(np.sqrt(np.mean(bass[i*SR:(i+1)*SR]**2))+1e-6) for i in range(sec)]
    jumps = sorted(range(2, sec), key=lambda i: -(np.mean(brms[i:i+2]) - np.mean(brms[i-2:i])))[:3]
    bar = "".join(" .:-=+*#%@"[max(0, min(9, int((r + 40) / 4)))] for r in rms)
    print(f"{f:10} {sec:4d}s  bpm~{bpm:5.1f}  bass-jumps at {sorted(jumps)}s")
    print("   loud/1s:", bar)
