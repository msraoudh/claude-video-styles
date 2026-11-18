# usage: strip.py out.ppm path start label  -> renders 46 s window: spectrogram + energy curves + teaser markers
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from au import load
out,path,start,label=sys.argv[1],sys.argv[2],float(sys.argv[3]),sys.argv[4]
SR=22050; N=2048; HOP=256; W=float(os.environ.get("DUR","45"))+1
x=load(path,SR,ss=max(0,start),t=W)
if start<0: x=np.concatenate([np.zeros(int(-start*SR),np.float32),x])
x=np.pad(x,(0,max(0,int(W*SR)-len(x))))
fr=1+(len(x)-N)//HOP
idx=np.arange(N)[None,:]+HOP*np.arange(fr)[:,None]
M=np.abs(np.fft.rfft(x[idx]*np.hanning(N),axis=1))
f=np.fft.rfftfreq(N,1/SR)
Wd,Hs=1150,110
# log-frequency rows 30 Hz..11 kHz
edges=np.geomspace(30,11000,Hs+1)
S=np.zeros((Hs,fr))
for i in range(Hs):
    sel=(f>=edges[i])&(f<edges[i+1])
    if not sel.any(): sel=np.argmin(abs(f-edges[i]))
    S[Hs-1-i]=M[:,sel].mean(1) if np.ndim(sel)>0 and getattr(sel,'dtype',None)==bool else M[:,sel]
S=20*np.log10(S+1e-6); S=np.clip((S-(S.max()-70))/70,0,1)
cols=np.linspace(0,fr-1,Wd).astype(int); S=S[:,cols]
img=np.zeros((Hs+60,Wd,3),np.uint8)
# magma-ish colormap
c=S[...,None]; img[:Hs]=(np.concatenate([c**0.8*255, c**2.2*200, (0.35+0.4*c)*(1-c)*255+c**4*150],axis=2)).clip(0,255).astype(np.uint8)
# energy curves in bottom panel
P=M**2
def env(sel):
    e=10*np.log10(P[:,sel].sum(1)+1e-9); k=int(0.2*SR/HOP); e=np.convolve(e,np.ones(k)/k,'same'); return e[cols]
eF=env(f>25); eL=env((f>25)&(f<150)); eH=env((f>2000)&(f<10000))
top=np.max(eF)
for e,colr in ((eF,(255,255,255)),(eL,(255,80,80)),(eH,(90,200,255))):
    y=Hs+59-np.clip((e-(top-36))/36,0,1)*58
    for xx in range(Wd): img[int(y[xx]),xx]=colr
# markers: 22.8 code, 27.25 lift, 34.65 endcard cut, 35.47 "NearMatch."
MARKS=[(float(t),(120,120,120)) for t in os.environ.get("MARKS","5.95,10.9,16.4,42.5").split(",")]+[(float(os.environ.get("LIFT_T","27.25")),(0,255,0)),(float(os.environ.get("CUT_END","34.65")),(255,0,255))]
for t,colr in MARKS:
    xx=int(t/W*Wd); img[:,xx]=colr
with open(out,'wb') as fh:
    fh.write(b'P6 %d %d 255\n'%(Wd,Hs+60)); fh.write(img.tobytes())
