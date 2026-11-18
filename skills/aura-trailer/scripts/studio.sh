#!/bin/bash
# Remotion Studio for a trailer project (preview only — never while a render runs).
#   bash ~/.claude/skills/aura-trailer/scripts/studio.sh ~/<slug> [port]
# For the desktop app's browser pane, add to <cwd>/.claude/launch.json:
#   {"name": "<slug>-studio", "runtimeExecutable": "wsl.exe", "runtimeArgs": ["bash", "/home/you/.claude/skills/aura-trailer/scripts/studio.sh", "/home/you/<slug>", "3125"], "port": 3125}
P=${1:-${TRAILER:-$PWD}}
PORT=${2:-3125}
cd "$P/video" || exit 1
source ~/.nvm/nvm.sh >/dev/null && nvm use 24 >/dev/null
exec npx remotion studio src/index.ts --port "$PORT" --no-open
