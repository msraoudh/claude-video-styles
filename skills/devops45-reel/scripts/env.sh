# Platform layer for every devops45 shell script: source it, never run it.
# Works in WSL (bash) and on Windows (Git Bash). Windows is the default platform since 2026-11-09
# (WSL froze the user's PC): projects in C:\Users\YOU\reels\output, Python venv ~/.venvs/devops45.
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) DEVOPS45_WIN=1 ;; *) DEVOPS45_WIN=0 ;; esac
if [ "$DEVOPS45_WIN" = 1 ]; then
  PY=${PY:-$HOME/.venvs/devops45/Scripts/python.exe}
  WPY=$HOME/.venvs/devops45/Scripts/python.exe
  export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
  export DEVOPS45_CSV=${DEVOPS45_CSV:-C:/Users/YOU/Desktop/reel-project/devops45-catalog.csv}
else
  [ -f "$HOME/.nvm/nvm.sh" ] && { source "$HOME/.nvm/nvm.sh" >/dev/null; nvm use 24 >/dev/null; }
  PY=${PY:-$HOME/.venvs/audio/bin/python}
  WPY=$HOME/.venvs/whisper/bin/python
fi
LOCKBASE=${LOCKBASE:-/tmp}

# lockrun <name> <cmd...> — one holder at a time per name (shared by every agent).
# flock where it exists (WSL); else an atomic mkdir lock that is freed if its holder died.
lockrun() {
  local name=$1; shift
  if command -v flock >/dev/null 2>&1; then flock "$LOCKBASE/devops45-$name.lock" "$@"; return; fi
  local L="$LOCKBASE/devops45-$name.lockdir" waited=0
  while ! mkdir "$L" 2>/dev/null; do
    local holder; holder=$(cat "$L/pid" 2>/dev/null || true)
    if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then rm -rf "$L"; continue; fi
    [ $waited = 0 ] && echo "[lockrun] waiting for $name lock…" >&2; waited=1
    sleep 3
  done
  echo $$ > "$L/pid"
  local rc=0; "$@" || rc=$?
  rm -rf "$L"
  return $rc
}

# free_mb — available RAM in MB (Linux /proc or Windows CIM).
free_mb() {
  # Git Bash has a /proc/meminfo without MemAvailable, so only trust it on real Linux.
  if [ "$DEVOPS45_WIN" = 0 ] && grep -q MemAvailable /proc/meminfo 2>/dev/null; then awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo
  else powershell.exe -NoProfile -Command "[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)" | tr -d '\r'; fi
}
