# RESUME — « NO MORE EXCUSES » trailer about the user (@yourhandle), started 2026-10-18

## Status (2026-10-19): v1 DELIVERED, waiting for the user's verdict
- Desktop\reel-project\me-trailer\out\no-more-excuses-9x16-v1.mp4 (1080x1920, 60 fps, 60.0 s, -13.9 LUFS, DECODE_OK)
  and no-more-excuses-9x16-v1-sans-musique.mp4 (voice + SFX only, to add ACIDO III in-app).
- Blind Whisper on the delivered mp4: all 9 lines heard (L40 tail "dans l'IT" heard as "dans la…"; text on screen says it).
  Voice lead per line ≥ 10.3 dB broadband, ≥ 11.8 dB in 1-4 kHz (qa/audio-qa.txt).
- Review sheets of the render: qa/review-1..4.jpg; motion QA audio/motion_qa.py (no unintended black/frozen runs).
- Fixes after the agents: TrailerFX no flash after tapeStop; Shot cssFilter("none"+filter); cold open face visible from
  frame 0 (Cold.tsx reveal); hero 757 uses titleslam-alt; reverse SFX trimmed to 0.7 s; SFX duck 0.15; voice +2.5 dB;
  heartbeat 2880 → 0.18, subdrop 2746 → 0.3.

## How to rebuild
- Picture: `bash audio/render.sh` (full, ~25 min) or `A=<f> B=<f> bash audio/patch_render.sh` (splice a range).
- Audio + delivery: `SKIP_RENDER=1 v=v2 bash audio/final.sh`.
- Sections: video/src/sections/{open,hero,escalate,climax} (agent reports summarised in the session); cues in
  video/src/data/cues/*.json; mixer audio/mix.py; plan audio/plan.py (voice line cut points) → audio/build_voice.py.

## Request / context
60 s thriller trailer "about me", cut on the bass of ACIDO III (UdieNnx x Mc Denny, user's mp3, slowed 0.85 by me),
music ducked under their voice, dark SFX (ElevenLabs flow RaCI4OfGDcWwZd1r7bJV), their motion-graphics skills ported
(glass-shard-title, wireframe-portal-title, code-slice-hero, cuboid-carousel, orbit-card, adaptive-glass, their series
liquid-glass card). French.
