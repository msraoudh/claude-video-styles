# The beat sheet: `src/cues.tsx`

One file says everything that appears, when, where, and which SFX it carries. The mixer reads the SFX from it
(`scripts/dump-sfx.mjs`), the storyboard reads the cues to know what is on screen, Showcase draws the `"screen"`
cues on the canvas. Rewrite it fully per video; keep its helpers (top of file) and the `SHOTS` block format.

## Timing: never hard-code frames
`src/lib/time.ts`: `at(id)` first frame of a line, `end(id)` last frame, `w(id, "word")` first frame of the first
word containing that text (or an index). Everything is global frames (30 fps) on the clean voice. A cue that
enters « on the word » starts at `w(id, word)` (pops, slams) or 2–3 frames before it (slides, whooshes).

## Helpers
```ts
add(from, to, layer, (dur) => <El …/>, [S("pop-light", frame, vol)])   // one cue
both(from, to, "front" | "page", (d) => <InCard/>, (d) => <OnCanvas/>, sfx) // a bold moment: in-card for Reel, canvas for Showcase
S(name, frame, vol)   // public/audio/sfx/<name>.wav, vol 0.35–0.6 typically (mix.py caps it 8 LU under the voice)
```

## Layers
| layer | where it draws | use |
|---|---|---|
| `behind` | between his wall and the cutout (inside the card) | big words (`BigWord`), rings around the head |
| `front` | over him, inside the card (Reel coordinates 1080×1920) | wall tiles, photos, chest rows, brackets |
| `page` | full screen inside the card, covers him (≤ 2.5 s, 1 per 4–6 s) | definition pages, photo pages, the climax |
| `screen` | Showcase canvas 1080×1920, full size, outside the card | bold moments: logo reveal, checklists, stamps, counters, VS, the punch line |

`ReelOnly` hides an in-card copy in Showcase (so `both()` never shows a moment twice).
`PAGES` (exported) hides captions during pages.

## Zones (Reel coordinates 1080×1920)
- Head ≈ x 300–760, y 220–880 (close shot: x 247–825, y 100–940). **Never over eyes/mouth.**
- Right wall `RW` centre x 945, left wall `LW` centre x 135, y 300–820, ≤ 220 wide (tiles, photos, cards).
- Top (big words) y 60–300: `BigWord` at `BW_Y 145`, size `BW_SIZE 175`, only its bottom ~20 % behind the hair.
- Chest rows `ROW_Y 1355`, gap 98, 3 slots, 2 columns (x 40 and 560), glass `CheckBar`s.
- Canvas (`screen`): card x 372–1040, y 300–1488; storyboard x 28–448, y 500–1260; his face ≈ x 560–850,
  y 420–780 (keep off); captions y 1540–1690 (keep off). `SC` constants: rows at x 50 / 548, width 480, size 54.

## The fx catalog (`src/fx/fx.tsx`)
Glass: `Glass`, `glassStyle(hot, tint, r, tone)`, `Fade`/`FadeDiv` (fades without killing the blur), `Pill`.
Text: `BigWord` (letters rise, red wave line, sparkles), `Type` (words rise from a mask; `tone` is layout only,
every text is metal), `Label`, `Stamp` (red plate slam), `CountUp`, `NumTile` (01→06).
Things: `Photo` (real colours, `pos`, `rotate`, `tone="dark"` dims only), `UserCard`, `VideoCard`, `Phone`,
`ClaudeLogo`, `IconTile` (icons draw on; `ICONS` list), `AnswerCard` (ok → wrong), `ChatBar` (typing prompt),
`Bubble` (dots then text), `FilmStrip`.
Data: `CheckBar` (check / cross / dot), `Stack` (rows on their words), `Bars` (last overshoots), `Gauge`,
`People` (grid, the minority lights up), `Venn` (merge), `Stars`, `Target`, `Brackets` (face corners + tag).
Accents: `Pop`, `Sparkle`, `Draw` (SVG paths draw on), `GlowRing`, `Flash` (red radial), `LightSweep`,
`WaveOut` (a big word's wave leaving the card onto the canvas).
`Page` = full-screen page on the red→black gradient with grain and a light sweep.
Add a component when a beat needs a new thing; keep it in the same glass/metal language.

## Choosing visuals (what worked)
- One idea = one visual, entering on the word that names it. Something on almost every phrase; vary the kind.
- Big word behind the head for the 5–8 core words of the talk (one or two per 15 s), lines forced WIDE.
- Lists he enumerates → glass check rows building one per word (on the canvas at full size).
- Numbers/claims → counters, gauges, bars. Contrast (« user A / user B ») → two user cards, VS, then one lit.
- A wrong/right turn → answer card stamped, red stamp « غالطة ». Risk → 100 → 0 % counter + trash.
- The climax (« DON'T JUST LEARN AI ») → music fade before it, page, slow push + snap, big metal type on the canvas.
- Real photos in natural colours for concrete things (crowd, classroom, products); found free (Pexels/Unsplash)
  or given by him; never AI-looking stock.

## SHOTS (camera per line, end of the file)
`WIDE 1.035` / `CLOSE 1.28` alternate per line; big-word lines forced WIDE and pinned to the top, their neighbours
CLOSE. `CAM[id] = [move, [[word, amount, offset?], …]]`: move ±0.03–0.08, punch 0.04–0.09 on the stressed word.
Pages hold the camera. See `camera.md`.
