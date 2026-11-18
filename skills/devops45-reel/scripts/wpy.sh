#!/bin/bash
# Run a Python script with faster-whisper and its CUDA libraries on the path:
#   bash wpy.sh <script.py> [args...]      (pick_take.py, align.py, qa.py …)
# Windows: venv ~/.venvs/devops45 (pip install numpy scipy soundfile faster-whisper nvidia-cublas-cu12 nvidia-cudnn-cu12==9.*)
# WSL:     venv ~/.venvs/whisper (same packages)
source "$(dirname "$0")/env.sh"
if [ "$DEVOPS45_WIN" = 1 ]; then
  SP=$HOME/.venvs/devops45/Lib/site-packages
  export PATH="$SP/nvidia/cublas/bin:$SP/nvidia/cudnn/bin:$SP/nvidia/cuda_nvrtc/bin:$PATH"
else
  SP=$(ls -d $HOME/.venvs/whisper/lib/python*/site-packages)
  export LD_LIBRARY_PATH=$SP/nvidia/cublas/lib:$SP/nvidia/cudnn/lib:${LD_LIBRARY_PATH:-}
fi
S=$1; shift
case "$S" in /*|[A-Za-z]:*) ;; *) [ -f "$S" ] || S="$(cd "$(dirname "$0")" && pwd)/$S" ;; esac
exec "$WPY" "$S" "$@"
