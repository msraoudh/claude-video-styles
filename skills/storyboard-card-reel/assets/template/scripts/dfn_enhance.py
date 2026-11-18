"""DeepFilterNet 3 speech enhancement (denoise + light dereverb), run by master_voice.py in .venv-audio.

.venv-audio is a Python 3.11 venv (DeepFilterLib has Windows wheels only up to cp311), torch 2.0.1 CPU,
deepfilternet 0.5.6; its interpreter lives in .venv-audio-python (uv-managed, project-local).

Usage: .venv-audio\\Scripts\\python.exe scripts/dfn_enhance.py in.wav out.wav [atten_lim_db]
  atten_lim_db caps how much noise DFN may remove (dB); a cap keeps the room tone natural, no « vacuum ».
"""
import sys

import numpy as np
import soundfile as sf
import torch
from df.enhance import enhance, init_df


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    lim = float(sys.argv[3]) if len(sys.argv) > 3 else None
    model, state, _ = init_df(log_level="ERROR")
    x, sr = sf.read(src, dtype="float32", always_2d=True)
    assert sr == state.sr(), (sr, state.sr())
    audio = torch.from_numpy(np.ascontiguousarray(x.T))
    y = enhance(model, state, audio, atten_lim_db=lim)
    sf.write(dst, y.numpy().T, sr, subtype="FLOAT")


if __name__ == "__main__":
    main()
