# src/data/project.ts — everything specific to one video

The engine reads only this file (plus captions.json / lines.json / music.ts and the scenes). Seconds are source seconds
of the user's cut; the engine converts with `f(s) = round(s × 30)`. The example (`examples/kifech/project.ts`) is the
first reel's real config — start from it.

| field | what | how to set it |
|---|---|---|
| `title`, `handle` | for the plan and the end card | the user's @handle (@yourhandle) |
| `durationFrames` | length | printed by `ingest.sh` (nb_read_frames) |
| `video`, `voice` | `footage/talk-v1.mp4`, `footage/voice-v1-master.wav` | written by `ingest.sh` |
| `face.splitSy` | source y shown at the top of the face panel in split | forehead line on `grid.jpg` |
| `seam` | face panel height in split (stage starts there) | forehead → just below the chin (first reel: 880) |
| `face.cx, cy` | push-in centre (source px) | between the eyes and the mouth |
| `face.pip` | `{sx, sy, sw}` square crop for the small face circle (gfx) | head + a bit of hair |
| `captionY` | caption pill centre per mode: `split` (≈ 1508, under the stage), `face` (between chin and mic), `gfx` | never over mouth/chin, never below y 1560 (IG caption UI) |
| `modes` | `[sec, "face"|"split"|"gfx"|"wall"]` — the layout story | see below |
| `wallTile` | screen box of the user's shot as a 9:16 card in `wall` | centred card ≈ `{x:345,y:520,w:390,h:693}` |
| `stepAt`, `stepCount`, `bonusLabel` | the segmented progress bar (0 = hidden, N+1 = bonus) | one entry per step start |
| `titles` | step titles under the bar: `[[text], [keyword, true]]` | short, in the video's language; keyword = Latin, coral serif |
| `dir` | `"rtl"` (Arabic letters) or `"ltr"` | captions + titles direction |
| `scenes` | named ranges, one scene file each | from the beat sheet |
| `COVER` | cover title, kicker, chips, face frame | in the video's language |

## Modes (morph 14 frames between them)
- **face** — the user full frame. Hook, punchlines, callbacks, the end. Overlays only on the sides of the head and the chest.
- **split** — face panel `0–seam` on top (the mic and hands disappear), warm-dark stage below with the progress bar
  (seam+26), the step title (seam+72…) and the scene content (y ≈ seam+160 → 1450). The default for every step.
- **gfx** — full-frame graphic, the face in a small coral circle top-right (x 800–1020, y 200–420): the big « wow »
  moments (the first reel: 8 agents in parallel; the 20:00 → done reveal).
- **wall** — the user's shot shrinks into a 9:16 card (wallTile): « these reels » moments — a carousel of their own
  reels around it (first reel 0.6–2.62 s, the user's idea).

Rhythm that worked (1:55): face 0–9.6 (hook + wall 0.6–2.6) → split steps → gfx 5–6 s in the middle → split → gfx
reveal 2.4 s → face callback 2.8 s → split bonus → face end.

## Safe areas (1080×1920, Instagram)
Top 0–210 and bottom 1560–1920 belong to the IG UI; below y 1000 keep text inside x 60–940 (icon column at x > 950).
