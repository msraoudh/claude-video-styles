import sys, os, json, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from au import load
SR=22050
def stft_mag(x, n=2048, hop=512):
    w=np.hanning(n).astype(np.float32)
    frames=1+(len(x)-n)//hop
    idx=np.arange(n)[None,:]+hop*np.arange(frames)[:,None]
    out=[]
    for i in range(0,frames,2000):
        out.append(np.abs(np.fft.rfft(x[idx[i:i+2000]]*w,axis=1)))
    return np.vstack(out)
def tempo(flux, fps):
    f=flux-np.convolve(flux,np.ones(16)/16,'same'); f=np.maximum(f,0)
    ac=np.correlate(f,f,'full')[len(f)-1:]
    lags=np.arange(len(ac))
    best=None
    for bpm in np.arange(70,181,0.5):
        l=60/bpm*fps
        s=0
        for k in (1,2,4):
            li=l*k
            if li<len(ac)-1:
                i0=int(li); fr=li-i0; s+=ac[i0]*(1-fr)+ac[i0+1]*fr
        if best is None or s>best[0]: best=(s,bpm)
    return best[1]
def analyze(path):
    x=load(path,SR)
    dur=len(x)/SR
    M=stft_mag(x)
    fps=SR/512
    freqs=np.fft.rfftfreq(2048,1/SR)
    P=M**2
    tot=P.sum(1)+1e-12
    def band(a,b): return P[:,(freqs>=a)&(freqs<b)].sum(1)
    sub=band(20,120); low=band(120,500); mid=band(1000,4000); hi=band(4000,11000)
    cent=(P*freqs[None,:]).sum(1)/tot
    lM=np.log1p(M*10)
    flux=np.maximum(np.diff(lM,axis=0),0).sum(1)
    flux=np.concatenate([[0],flux])
    bpm=tempo(flux[:int(min(len(flux),fps*90))], fps)
    # energy envelope at 0.25 s
    hop=int(fps*0.25)
    rms=np.array([10*np.log10(tot[i:i+hop].mean()+1e-12) for i in range(0,len(tot)-hop,hop)])
    loud=tot>np.percentile(tot,30)
    return dict(dur=dur,bpm=bpm,cent=float(np.median(cent[loud])),
        sub=float(10*np.log10(sub[loud].sum()/tot[loud].sum())),
        mid=float(10*np.log10(mid[loud].sum()/tot[loud].sum())),
        hi=float(10*np.log10(hi[loud].sum()/tot[loud].sum())),
        env=rms.tolist())
if __name__=='__main__':
    out={}
    for d in sys.argv[2:]:
        p=os.path.join(d,'track.mp3')
        try:
            out[os.path.basename(d)]=analyze(p)
            r=out[os.path.basename(d)]
            print(os.path.basename(d), f"{r['dur']:.0f}s bpm={r['bpm']} cent={r['cent']:.0f} sub={r['sub']:.1f} mid={r['mid']:.1f} hi={r['hi']:.1f}", flush=True)
        except Exception as e: print(d,'ERR',e)
    json.dump(out,open(sys.argv[1],'w'))
