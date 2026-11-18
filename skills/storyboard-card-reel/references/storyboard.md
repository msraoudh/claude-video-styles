# The pen storyboard card: `src/parts/Storyboard.tsx`

The left card of Showcase. A light paper pad on which a visible marker draws, stroke by stroke, a sketch of what is
on screen while he talks. Reference: `assets/refs/r1_storyboard.png` (frazix). He rejected both a « director's
board » with UI and a near-empty card: **only drawings, and the pen drawing most of the time he speaks.**

## What is reused vs rewritten
- **Engine (keep):** geometry (`bez`, `qbez`, `arc`, `resample`, `wobble` = seeded hand wobble), the stroke
  sampler (the pen tip sits exactly on the end of the drawn line, no DOM measuring), pen speed `MIN_V/MAX_V`
  adapted so each group fills the gap to the next phrase, pen hops between strokes, slides off under the video card
  during long pauses, the 7-frame page flip 4 frames before a page starts, `LIFT` (−46 px: the canvas check rows
  cover the card's bottom), paper `#F4F1EA` + dot grid, ink `#151515` 4.5 px round caps, red `#E30A17`.
- **Drawing kit (keep, extend):** `fig()` stick figure (head at `HX, HY`), `mini()` small person, `brackets`,
  `claude()` mark, `glyph/glyphs` (letters as strokes), `bigWord()` (Anton, red, behind the figure's head),
  `bulb`, `magnifier`, `eye`, `phone`, `videoCard`, `gauge/gaugeNeedle`, `target`, `userCard`, `row` (check row),
  `flask`, `filmStrip`, `book`, `gradCap`, `trash`, `chatBar`, `bubble`, `wheel`, `cloud`, `camera`, `clapper`,
  `mirror`, `cube`, `arrow`, `sparkle`, `check`, `cross`, `box`, `circle`, `ln`, `dot`.
- **Per video (rewrite):** the `page(...)` table — one page per beat (usually per line, or two short lines together).

## Writing a page
```ts
/* two: « personnellement … زوز حاجات … les AI users » */
page(at("two"), [
  [at("two"), F],                                                    // the stick figure first
  [wd("two", "personnellement"), () => brackets(HX, HY, 82)],        // red brackets: « me »
  [wd("two", "نشوف"), () => eye(70, 150, 1)],
  [wd("two", "زوز") - 2, () => [bigWord("ZOUZ", 120), sparkle(44, 110, 13, true)]],
  [wd("two", "حاجات"), () => [circle(290, 170, 26, { red: true }), ...glyph("2", 280, 150, 40, true)]],
]);
```
- Each group `[frame, () => strokes]` starts drawing on its word (`wd(id, needle, nth)`); one group per phrase
  (2–6 words) so the pen keeps moving with the speech.
- Draw the **current shot**: the figure where he is (WIDE vs CLOSE is the same figure), the effect on screen as
  simple shapes at its real place (big word behind the head, tiles on the walls, rows at the chest, the page
  content for full-screen pages — then no figure). Small arrows point to the effect; sparkles for emphasis; red
  only on the key element.
- Words: only the big word behind the figure's head (Anton, red) and single symbols drawn as strokes
  (`?`, `2`, `%`, `!`). Never sentences, captions, labels or a script line.
- Everything inside the visible strip x 16–328 of the card (the video card covers the rest).

## QA
`COMP=Showcase sh scripts/qa/qa.sh out/qa-sb every:15`, crop the card (x 28–448, y 500–1260 at 0.4 scale) into a
sheet; check three consecutive frames to see the pen moving along a stroke. `SB_DEBUG` logs each group's word
frame vs when the pen really draws it (start within 0–10 frames of the word is the target).
Known overlap: canvas bold moments (logo reveal, check rows) can cover the card's top or bottom for a moment;
place screen cues so they don't sit on the card while the pen is drawing something important.
