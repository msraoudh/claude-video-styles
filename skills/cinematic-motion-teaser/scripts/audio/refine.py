# refine.py <track> <window_start_s> <bpm>  -> exact onset of the drop near start+LIFT_T; prints the corrected window start
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from au import load
SR=22050; N=1024; HOP=128
path=sys.argv[1]; start=float(sys.argv[2]); bpm=float(sys.argv[3])
LIFT=float(os.environ.get("LIFT_T","27.25"))  # where the drop must land in the video (s)
D=start+LIFT
x=load(path,SR,ss=max(0,D-3),t=6)
off=max(0,D-3)
fr=1+(len(x)-N)//HOP
idx=np.arange(N)[None,:]+HOP*np.arange(fr)[:,None]
M=np.abs(np.fft.rfft(x[idx]*np.hanning(N),axis=1)); f=np.fft.rfftfreq(N,1/SR)
lM=np.log1p(100*M)
fluxL=np.concatenate([[0],np.maximum(np.diff(lM[:,(f>30)&(f<200)],axis=0),0).sum(1)])
fluxA=np.concatenate([[0],np.maximum(np.diff(lM,axis=0),0).sum(1)])
t=off+np.arange(fr)*HOP/SR + N/2/SR
sel=(t>D-0.3)&(t<D+0.3)
fl=fluxL/ (fluxL[sel].max()+1e-9) + fluxA/(fluxA[sel].max()+1e-9)
i=np.argmax(np.where(sel,fl,-1))
on=t[i]-0.012
print(f"onset {on:.3f} start {on-LIFT:.3f} (was {start}) shift {on-D:+.3f}")
