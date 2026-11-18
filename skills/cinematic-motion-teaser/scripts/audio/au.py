import subprocess, numpy as np
def load(path, sr=48000, mono=True, ss=None, t=None):
    cmd=['ffmpeg','-nostdin','-v','error']
    if ss is not None: cmd+=['-ss',str(ss)]
    if t is not None: cmd+=['-t',str(t)]
    cmd+=['-i',path,'-f','f32le','-ac','1' if mono else '2','-ar',str(sr),'-']
    b=subprocess.run(cmd,capture_output=True,check=True).stdout
    x=np.frombuffer(b,dtype=np.float32)
    return x if mono else x.reshape(-1,2)
