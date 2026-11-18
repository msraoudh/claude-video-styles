#!/usr/bin/env bash
# usage (from Git Bash on Windows): bash whisper.sh <workdir> <script.py> [args...]
# Runs one of the faster-whisper scripts on the GPU inside WSL (venv ~/.venvs/whisper, model large-v3 cached
# in ~/.cache/huggingface). Paths in [args] are relative to <workdir>.
# Env passed through: WHISPER_PROMPT (names/words to expect), WHISPER_LANG (default fr).
set -e
WORK=$(cd "$1" && (pwd -W 2>/dev/null || pwd)); shift
SCRIPT_DIR=$(cd "$(dirname "$0")" && (pwd -W 2>/dev/null || pwd))
SCRIPT="$1"; shift
to_wsl() { echo "$1" | sed -E 's#^([A-Za-z]):[\\/]#/mnt/\L\1/#; s#\\#/#g'; }
W_WORK=$(to_wsl "$WORK"); W_SCRIPT=$(to_wsl "$SCRIPT_DIR")/"$SCRIPT"
PROMPT=${WHISPER_PROMPT:-"the user, Claude, la tech, le cloud, l'IA, wesh, frère."}
LANG_=${WHISPER_LANG:-fr}
QARGS=$(printf ' %q' "$@")
wsl -e bash -lc "N=\$HOME/.venvs/whisper/lib/python3.12/site-packages/nvidia; export LD_LIBRARY_PATH=\$N/cublas/lib:\$N/cudnn/lib; export WHISPER_PROMPT=$(printf %q "$PROMPT") WHISPER_LANG=$LANG_; cd '$W_WORK' && \$HOME/.venvs/whisper/bin/python '$W_SCRIPT' $QARGS 2>&1 | grep -v -i -E 'warn|^\s*$'"
