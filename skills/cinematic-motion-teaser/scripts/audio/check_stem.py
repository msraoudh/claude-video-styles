# check_stem.py <tools_dir = this scripts/audio folder, for au.py> <stem.wav> <music.wav> <vo.wav> [offset_frames=19] -> proves the stem has no music bleed (NCC at the music offset)
import sys; sys.path.insert(0, sys.argv[1])
import numpy as np
from au import load
sr=8000
stem=load(sys.argv[2],sr); mus=load(sys.argv[3],sr); vo=load(sys.argv[4],sr)
print(len(stem)/sr, len(mus)/sr, len(vo)/sr)
def ncc(a,b,lag):
    # b delayed by lag samples
    n=min(len(a)-lag, len(b))
    x=a[lag:lag+n]; y=b[:n]
    return float(np.dot(x,y)/np.sqrt(np.dot(x,x)*np.dot(y,y)+1e-12))
lag=int(round((int(sys.argv[5]) if len(sys.argv)>5 else 19)/60*sr))
print('music ncc at true lag', ncc(stem,mus,lag), 'random lags', [round(ncc(stem,mus,l),4) for l in (lag+400, lag+1300, lag+5000)])
print('vo ncc at 0', ncc(stem,vo,0))
