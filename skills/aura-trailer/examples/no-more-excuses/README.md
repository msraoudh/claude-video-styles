# « NO MORE EXCUSES » — the reference production

The 60 s trailer about the user (@yourhandle), built 2026-10-18/19. It is the quality bar of this skill.

## Where things are
- **Delivered:** `C:\Users\YOU\Desktop\reel-project\me-trailer\out\no-more-excuses-9x16-v1.mp4` and `…-v1-sans-musique.mp4`.
- **The full project (media, analysis, QA sheets):** WSL `~/me-trailer` (its `progress/RESUME.md` is copied here).

## What's in this folder
| File | What |
|---|---|
| `trailer.json`, `footage.json` | its real configs (absolute media paths). Replaying them through the skill's scripts rebuilds the identical plan, voice and mix |
| `agent-common.md` | the brief the 4 scene agents worked from |
| `sections/{open,hero,escalate,climax}/` | the scenes the agents built (they compile in the skill's template) |
| `cues/` | their sound cues |
| `Trailer.tsx`, `TrailerFX.tsx` | the original hard-coded versions, before the skill made them config-driven |

## Measured result (v1)
- 1080×1920, 60 fps, 60.0 s, −13.9 LUFS, DECODE_OK.
- Voice lead ≥ 10.3 dB broadband and ≥ 11.8 dB at 1–4 kHz on every line.
- A blind Whisper pass heard all 9 lines.
