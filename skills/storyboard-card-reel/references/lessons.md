# Lessons from the first reel (2026-11-11/12)

- **Ambiguous instruction → ask one short question.** « Remove the red labels » ≠ « delete the card layout ». « Remove
  the light filter » meant the skin grade on his face, then « remove the skin filter » made it explicit. Guessing
  wrong cost two rounds of fury.
- **Disk full.** Every Remotion still/render copies `public/` assets into `%TEMP%\remotion-v4…` and leaves them:
  715 folders, 116 GB, C: at 0 MB, renders failing with ENOSPC. All scripts here redirect TEMP into `out/` and delete
  it. Check `df -h /c` before renders. Deleting the shared Temp needs his OK (auto mode blocks it).
- **QA collisions:** two agents sharing `out/qa-v3/tmp` deleted each other's temp mid-run. One QA folder per agent.
- **HDR:** iPhone HLG → SDR tone map (mobius) makes the skin a bit warm; a « skin fix » grade on top was rejected.
  Keep the tone-mapped footage as is.
- **afftdn delays 25 ms** (1200 samples). DeepFilterNet has no delay. Re-align any processed voice by
  cross-correlation against the raw voice.
- **Music vanishing on phones:** bass-heavy tracks disappear on phone speakers; measure the music with < 250 Hz
  removed, aim ≈ 13 LU under the voice while talking.
- **backdrop-filter dies under a parent with opacity < 1** → glass looked like a dark tint. Use the `Fade` context.
- **Card scale 0.6185**: small labels inside the card end up 20–30 px on the phone. Readable text goes on the canvas.
- **Big words:** his hair top is ≈ y 140–200 on wide shots: a word « fully above the hair » at a big size is
  impossible; place it high with only its bottom tucked, keep big-word lines WIDE.
- **Mixed Arabic/Latin while typing** (chat bar, captions) shows odd word order for a few frames until the line is
  complete. Acceptable; per-word spans with `direction` per chunk keep captions right.
- **Brackets aren't face-tracked:** fixed head box, a bit off when he leans.
- **Phone delivery:** > 30 MB never arrives. Compress previews to ~20 MB.
- **4K parallel render RAM:** 4×2 browsers on 4K footage crashed; 2×1 works; resume only missing chunks.
- **Relative paths in background scripts** broke the final mux (the script `cd`s). Always pass absolute paths.
- **Unclear line:** one line (#6) stayed with incomplete caption words to the end because nobody asked him. Ask
  for the exact words early, during the plan.
