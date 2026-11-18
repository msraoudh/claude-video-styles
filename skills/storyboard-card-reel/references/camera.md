# Camera work and transitions: `src/parts/Camera.ts` + `SHOTS` in `cues.tsx`

« You did not do any editing on me: camera movement, transitions and stuff. » Static wide/close cuts are not enough.

## Engine (keep)
`camAt(frame)` is a pure function of the frame (Studio scrubbing = render). It returns `{scale, x, y, rotate, blur}`,
applied identically to `Footage` and `Cutout` (so the big words stay behind his head) and to the in-card cue layers
by the transition wrapper in `Reel.tsx`. Origin `49% 33%` ≈ his face. Translation is clamped so the frame never
shows an edge (checked at 4° rotation and +25 % snaps). Only filter allowed on the footage: motion blur.

Per shot (`Shot` from `SHOTS`, one per line):
- `scale` WIDE 1.035 / CLOSE 1.28 (hard cut between lines; graphics are placed for these two framings).
- `move` slow push (+) / pull (−) 3–8 % over the shot, eased; `drift` 10–14 px alternating; seeded handheld
  ≈1.8 px / 1.3 px / 0.08°.
- `punch` snap zoom on the stressed word: ~2 frames in, ~20 % overshoot, settled by frame 8, then holds.
  4–9 %, 3–4.5 % on big-word lines (light motion blur on the snap frames).
- `alt` jump-cut hiding: at every clean-cut piece boundary inside a line (`clean.json pieces[].t0`, both sides
  ≥ 8 frames) the framing cycles base → +7 % & 12 px → +3.5 % & −10 px (±4 % on big-word lines).
- `pinTop` big-word lines: zooming pushes his hair DOWN so the word behind it reads better.
- `ramp [start, amount]` accelerating push into the climax (e.g. +18 % over 42 frames), then a crash-zoom snap.
- Pages hold the camera (no move, no punch).

## Transitions (rewrite the `TRANSITIONS` table per video)
10–15 total, varied, 4–8 frames each, at section changes and strong beats, never on every cut:
`whipL/whipR/whipU` (whip pan with directional blur), `zoom` (zoom-blur punch), `flash` (white light),
`redflash`, `shake` (hit), `spin/spinL` (±4° rotation snap), `snap` (crash zoom). Combine two kinds on big hits
(`["flash","shake"]`). Good spots: into and out of pages, « par exemple », « the second thing », the risk line,
the conclusion, the climax, the final line.
`cues.tsx` adds a whoosh for each transition that doesn't already carry a hit (block after the cues:
whip → `whoosh-fast-1`, zoom → `swoosh-zoom`, flash → `whoosh-soft-1`, spin → `whoosh-soft-2`).

## QA
`COMP=Reel sh scripts/qa/qa.sh out/qa-cam every:10`, plus runs of consecutive frames around 5 transitions and
5 punch-ins (`COMP=Reel sh scripts/qa/qa.sh out/qa-cam-seq 4 470 471 472 473 474 475 476 477 478`). Check: no
black corners, eyes and mouth always in frame, big words still readable, pages' fades look like part of the move.
