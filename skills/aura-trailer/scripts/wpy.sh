#!/bin/bash
# Run a Python script inside the faster-whisper venv with its CUDA libraries on the path:
#   bash wpy.sh <script.py> [args...]      (transcribe.py, find_in.py, qa_lines.py, qa_mix.py, verify_delivery.py)
# First time: python3 -m venv ~/.venvs/whisper && ~/.venvs/whisper/bin/pip install faster-whisper nvidia-cublas-cu12 nvidia-cudnn-cu12 scipy soundfile
V=~/.venvs/whisper
SP=$(ls -d $V/lib/python*/site-packages)
export LD_LIBRARY_PATH=$SP/nvidia/cublas/lib:$SP/nvidia/cudnn/lib:$LD_LIBRARY_PATH
S=$1; shift
case "$S" in /*) ;; *) [ -f "$S" ] || S="$(cd "$(dirname "$0")" && pwd)/$S" ;; esac
exec $V/bin/python "$S" "$@"
