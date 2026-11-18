#!/usr/bin/env bash
# RAM/GPU watchdog for long renders / GPU generation on a WSL laptop.
# Prints one line per alert (stdout) so it works with Claude Code's Monitor tool or run_in_background.
#   < WARN_MB  available  -> "ALERT low RAM"   (pause new work, don't start more renders)
#   < KILL_MB  available  -> kills headless Chrome ONLY (Remotion's renderer), never anything else
# Usage: watchdog.sh [WARN_MB=1500] [KILL_MB=800] [INTERVAL_S=5] [DURATION_S=3600]
WARN=${1:-1500}; KILL=${2:-800}; INT=${3:-5}; DUR=${4:-3600}
end=$(( $(date +%s) + DUR ))
last=""
while [ "$(date +%s)" -lt "$end" ]; do
  avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
  gpu=""
  if command -v nvidia-smi >/dev/null 2>&1; then
    gpu=$(nvidia-smi --query-gpu=memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits 2>/dev/null | head -1)
  fi
  if [ "$avail" -lt "$KILL" ]; then
    echo "KILL RAM ${avail}MB < ${KILL}MB -> killing headless chrome (gpu: ${gpu:-n/a})"
    pkill -f chrome-headless-shell 2>/dev/null || pkill -f 'chrome.*--headless' 2>/dev/null || true
    sleep 15
  elif [ "$avail" -lt "$WARN" ]; then
    msg="ALERT low RAM ${avail}MB (gpu used/total/temp: ${gpu:-n/a})"
    [ "$msg" != "$last" ] && echo "$msg"; last=$msg
  else
    last=""
  fi
  if [ -n "$gpu" ]; then
    t=$(echo "$gpu" | awk -F', ' '{print $3}')
    [ -n "$t" ] && [ "$t" -ge 87 ] 2>/dev/null && echo "ALERT GPU temp ${t}C"
  fi
  sleep "$INT"
done
echo "watchdog: duration ended"
