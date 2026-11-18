# windows.py <track...>  -> best 46 s windows per track whose drop lands on LIFT_T (env LIFT_T/END_T/CUT_END, NPICK)
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from au import load
SR=22050; N=2048; HOP=512; FPS=SR/HOP
NPICK=int(os.environ.get("NPICK","3"))
# Video landmarks (s) — set per project: the drop/release word, the end-card cut, the logo line
LIFT_T=float(os.environ.get("LIFT_T","27.25")); END_T=float(os.environ.get("END_T","35.5")); CUT_END=float(os.environ.get("CUT_END","34.65"))
def stft(x):
    w=np.hanning(N).astype(np.float32)
    fr=1+(len(x)-N)//HOP
    out=np.empty((fr,N//2+1),np.float32)
    for i in range(0,fr,1500):
        j=min(fr,i+1500)
        idx=np.arange(N)[None,:]+HOP*np.arange(i,j)[:,None]
        out[i:j]=np.abs(np.fft.rfft(x[idx]*w,axis=1))
    return out
KEYS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
MAJ=np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
MIN=np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
def key_of(M,freqs):
    sel=(freqs>100)&(freqs<2000)
    f=freqs[sel]; pc=(np.round(12*np.log2(f/440.0))+9)%12
    P=M[:,sel]**2
    chroma=np.zeros(12)
    tot=P.sum(0)
    for k in range(12): chroma[k]=tot[pc==k].sum()
    chroma/=chroma.sum()
    best=None
    for k in range(12):
        for name,prof in (('major',MAJ),('minor',MIN)):
            c=np.corrcoef(chroma,np.roll(prof,k))[0,1]
            if best is None or c>best[0]: best=(c,KEYS[k]+' '+name)
    return best[1], round(float(best[0]),2)
def smooth(a,n):
    return np.convolve(a,np.ones(n)/n,'same')
def run(path,bpm_hint=None):
    x=load(path,SR); dur=len(x)/SR
    M=stft(x); freqs=np.fft.rfftfreq(N,1/SR); P=M**2
    E=10*np.log10(P.sum(1)+1e-9)
    L=10*np.log10(P[:,(freqs>25)&(freqs<150)].sum(1)+1e-9)
    H=10*np.log10(P[:,(freqs>2000)&(freqs<10000)].sum(1)+1e-9)
    lM=np.log1p(M*10); flux=np.concatenate([[0],np.maximum(np.diff(lM,axis=0),0).sum(1)])
    t=np.arange(len(E))/FPS
    def m(a,t0,t1):
        i0=max(0,int(t0*FPS)); i1=max(i0+1,int(t1*FPS)); return float(a[i0:i1].mean())
    Emax=np.percentile(E,95)
    res=[]
    D=LIFT_T
    while D<dur-12:
        W=D-LIFT_T
        lift=m(E,D,D+2)-m(E,D-2,D)
        liftL=m(L,D,D+2)-m(L,D-2,D)
        onset=float(flux[int(D*FPS)-2:int(D*FPS)+3].max()/ (np.median(flux)+1e-9))
        pre=m(E,D-5,D)-m(E,D-10,D-5)   # rising into the lift?
        early=m(E,W+1,W+20)-Emax        # music present in the first 20 s
        e2=m(E,W+CUT_END-W+0,W+CUT_END+1.5)-m(E,W+CUT_END-2,W+CUT_END) if False else m(E,D+(CUT_END-LIFT_T),D+(CUT_END-LIFT_T)+1.5)-m(E,D+(CUT_END-LIFT_T)-1.5,D+(CUT_END-LIFT_T))
        tailok= (W+45.0)<=dur+0.5
        riser=m(H,D-1.5,D-0.2)-m(H,D-6,D-4.5)
        score=1.0*lift+0.8*max(min(liftL,15),-10)+0.3*max(min(riser,6),-3)+0.6*min(onset,6)+0.3*max(min(e2,6),-3)+0.3*max(min(pre,4),-4)+0.25*max(min(early+12,0),-12)
        if not tailok: score-=50
        res.append((score,D,W,lift,liftL,onset,pre,early,e2,riser))
        D+=0.05
    res.sort(reverse=True)
    picks=[]
    for r in res:
        if all(abs(r[1]-p[1])>4 for p in picks): picks.append(r)
        if len(picks)==NPICK: break
    xs=x[::2]; n2=8192; w2=np.hanning(n2); fr=[np.abs(np.fft.rfft(xs[i:i+n2]*w2)) for i in range(0,len(xs)-n2,n2)]
    M2=np.array(fr); f2=np.fft.rfftfreq(n2,2/SR); sel=f2>100
    key=key_of(M2[:,sel],f2[sel])
    return dict(dur=dur,key=key,picks=[dict(score=round(p[0],2),drop=round(p[1],2),start=round(p[2],2),lift=round(p[3],1),liftL=round(p[4],1),onset=round(p[5],1),pre=round(p[6],1),early=round(p[7],1),endcard=round(p[8],1),riser=round(p[9],1)) for p in picks])
if __name__=='__main__':
    out={}
    for d in sys.argv[2:]:
        k=os.path.basename(d)
        r=run(os.path.join(d,'track.mp3'))
        out[k]=r
        print(k, r['key'], ' | '.join(f"drop {p['drop']} start {p['start']} sc {p['score']} lift {p['lift']} sub {p['liftL']} on {p['onset']} pre {p['pre']} early {p['early']} end {p['endcard']} riser {p['riser']}" for p in r['picks']), flush=True)
    json.dump(out,open(sys.argv[1],'w'),indent=1,default=float)
