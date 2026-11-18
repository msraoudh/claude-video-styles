#!/bin/bash
# Wait (max ~9.5 min) until the render finishes or fails; print the last progress line. Run again if STILL_RENDERING.
P=${TRAILER:-$PWD}
for i in $(seq 1 113); do
  pgrep -f "remotion render" >/dev/null || break
  sleep 5
done
tail -c 300 "$P/out/render.log" 2>/dev/null; echo
pgrep -f "remotion render" >/dev/null && echo STILL_RENDERING || echo RENDER_DONE
