# snr.py <ducked_music.wav> <vo.wav> <vo_gain_lin> -> voice-to-music ratio in speech frames (full band and 1-4 kHz)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from au import load
m=load(sys.argv[1],48000); v=load(sys.argv[2],48000)*float(sys.argv[3])
n=min(len(m),len(v)); m=m[:n]; v=v[:n]
N=2048; H=1024
def bandE(x):
    fr=1+(len(x)-N)//H; idx=np.arange(N)[None,:]+H*np.arange(fr)[:,None]
    X=np.abs(np.fft.rfft(x[idx]*np.hanning(N),axis=1))**2; f=np.fft.rfftfreq(N,1/48000)
    return X.sum(1), X[:,(f>=1000)&(f<4000)].sum(1)
vf,vb=bandE(v); mf,mb=bandE(m)
sp=10*np.log10(vf+1e-12) > 10*np.log10(vf.max())-30
rf=10*np.log10((vf[sp]+1e-12)/(mf[sp]+1e-12)); rb=10*np.log10((vb[sp]+1e-12)/(mb[sp]+1e-12))
print(f"voice/music in speech: full-band median {np.median(rf):.1f} dB (p10 {np.percentile(rf,10):.1f}) | 1-4 kHz median {np.median(rb):.1f} dB (p10 {np.percentile(rb,10):.1f})")
