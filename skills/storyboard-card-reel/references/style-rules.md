# Style rules (every one came from a correction he had to give)

Read this before designing and again before every preview. Check each line against the stills.

## Layout
- **The card layout IS the reel.** His edit sits in a card on the canvas with the storyboard card beside it.
  When he said « remove the red labels » I deleted the whole card layout and went full-screen: wrong, he was
  furious. Only remove exactly the element he names.
- **No red label pills** (« @MS_YOURNAME », « STORYBOARD » tags) and **no title** above the card
  (« CLAUDE EDITED THIS » was removed on 2026-11-12). The top of the canvas is just the red→black gradient.
- The **captions and some effects live on the full canvas**, not inside the small card (« I told you to put them
  in the full video, not the f*** card »). Small text inside the card ends up 20–30 px on the phone: unreadable.

## Colour
- **Black + Tunisian red** (`#E30A17`, deep `#7A0C17`), red→black gradients (canvas + full-screen pages).
- **Not everything red.** Photos keep their **real colours** (a red duotone on photos was rejected). Red is the
  accent: underlines, plates, glows, marks, shapes.
- **All text = grey→black metal** (`SILVER`, ref 3): silver top, darker band, bright highlight, deep grey-black
  base. That includes captions, big words behind the head, pages, labels, stamps, counters, the end card.
  The caption key word stays metal with a **red underline**. (Only words sketched in red ink on the paper
  storyboard stay red ink: metal on light paper does not read.)
- « I hate white » meant **cream cards and borders**, not every white pixel: white light sweeps/flashes and the
  light paper storyboard are fine. Plain white text was later replaced by the metal gradient anyway.
- **His face: no filter at all.** No skin grade, no red tint, no vignette, no colour overlay on the footage.
  « Make my video natural as I gave it to you ». The iPhone HDR → SDR conversion of `make_face.py` is the only
  processing; do not « fix » his skin.

## Glass
- Glass must be **clearly visible**: frosted, see-through (you see the blurred video behind), backdrop blur
  18–22 px + saturate 1.3–1.4, light white tint 0.08–0.14, a bright specular top edge, soft inner glow, drop
  shadow, rounded 26–28 px. A dark tint that hides the video is not glass (« where is the f*** glassy effect »).
- **No borders, no strokes** around cards, photos, plates. The only edge is the 1 px specular highlight.
- A parent with `opacity < 1` kills `backdrop-filter`: fades go through the `Fade` context in `fx.tsx`.

## Storyboard card
- **Only pen drawings**, like the frazix reference (`assets/refs/r1_storyboard.png`): light dotted paper, black
  ink stick figure + the effect sketched simply, arrows, sparkles, red on the key element, a visible marker
  drawing stroke by stroke while he talks, a page flip per beat.
- A « live director's board » with headers, timecodes, typed script, timeline and badges was rejected
  (« the storyboard is shit »). An almost empty card with one tiny sketch per beat was rejected too (« make it
  full animated, add content to it »). The pen is drawing most of the time he speaks.

## Big words behind his head
- **High**: only the bottom ~15–25 % of the letters tucked behind his hair, so the word reads (« move it higher,
  only a little part behind my head, it's unreadable »). `BW_Y = 145`, `BW_SIZE = 175` in Reel coordinates;
  big-word lines are forced WIDE in `SHOTS`. Check every one on stills (LIK, ZOUZ, INIMAGINABLE…).

## Captions
- **Words only, no box / bar / glass behind them**, big (60–72 px), max 2 lines inside x 40–1040, on the canvas
  under the card. Word-by-word typing kept. Derja in Arabic letters, French/English in Latin, right-to-left handled.
- No handwriting / script font anywhere (Caveat was banned): Anton for big words and numbers, Inter 900 for the
  rest, a mono only where code is shown.

## Motion
- **An animated element on almost every phrase** (2–6 words), entering on the word that names it.
- **Editing on him**: every shot moves (slow push-in or pull-out, drift, light handheld), snap punch-ins on key
  words, jump cuts reframed, 10–15 varied quick transitions (whip, zoom-blur, flash, shake, rotation snap) with
  whooshes. « You did not do any editing on me » = static cuts are not enough.
- Never over his eyes or mouth. Restraint stays: premium, not silly.

## Sound
- Voice **deep, clear, natural** (v2 with +3 kHz and fast compression sounded thin « phone »: rejected).
- The music he chose must be **clearly audible** (≈ 13 LU under the voice while talking, EQ'd so it survives
  phone speakers), still ducked under words. SFX ≥ 8 LU under the voice, never the « glass » SFX.
- Master −14 LUFS, true peak ≤ −1 dBTP.
