import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from au import load
bed=load(sys.argv[1],48000); duck=load(sys.argv[2],48000); vo=load(sys.argv[3],48000); g=float(sys.argv[4])
n=min(len(bed),len(duck)); vo=np.pad(vo,(0,max(0,n-len(vo))))[:n]
w=int(0.05*48000)
def env(x): return np.sqrt(np.convolve(x[:n]**2,np.ones(w)/w,'same'))[::w]
eb=env(bed)*10**(g/20); ed=env(duck); ev=env(vo)
gr=20*np.log10((ed+1e-9)/(eb+1e-9))
sp=20*np.log10(ev+1e-9)>-40
quiet=20*np.log10(ev+1e-9)<-60
ok=20*np.log10(eb+1e-9)>-50
print(f"GR during speech: median {np.median(gr[sp&ok]):.1f} dB p10 {np.percentile(gr[sp&ok],10):.1f} p90 {np.percentile(gr[sp&ok],90):.1f} | between lines median {np.median(gr[quiet&ok]):.1f}")
