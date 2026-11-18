# Reference analysis: reel-ref-edit

Files: `ref1.mp4` (frazix__visuals, 19.0 s, 1080×1920, 60 fps), `ref2.mp4` (render.rrush, 31.8 s, 60 fps), `ref3.mp4` (eightsenses.media, 10.0 s, 30 fps).
Method: frames every 0.25 s (`sheets/`), zoomed crops of the inner edit (`zoom/`), faster-whisper large-v3 word timings (`*.words.json`), ffmpeg scene detection, spectrograms (`zoom/*_spec.png`), Shazam.

**All three are "editor showcase" posts.** The actual edit plays inside a rounded card on a canvas:
- ref1: the card sits on a white dotted canvas, with the editor's hand-drawn storyboard card behind it ("StoryBoard 04 CAPTION POP", stick figure, arrows, handwritten notes).
- ref2: the raw clip is small on the left, the edit is big, on a dark blurred background, with a "$150 Edit" pill.
- ref3: the RAW card is tilted on the left, "AFTER · CLAUDE" is on the right, with the chrome title "CLAUDE DID THIS" and a prompt bar.

What we copy is the edit **inside** the card. The showcase frame is an optional extra (see the end).

---

## REF 1: MAIN (frazix): an effect on every spoken idea
Grade: clean, slightly cool and desaturated, soft contrast, clean whites. Two cameras: a close-up (face + mic, arms crossed) and a wide studio shot (chair, softbox), plus full-screen paper pages.
Palette: white, black, deep red (~#A3202E), cream paper (#F4F1E6). Fonts: condensed heavy display (Anton/Bebas type) for big words; a bold geometric sans (Montserrat/Inter ExtraBold) for captions; a handwritten script for small accent words.
Rhythm: 8 shots in 19 s (one cut every ~2.4 s), but a new graphic lands every 0.6–1.2 s, so it never feels static.

| Time | Words | On screen | Animation | SFX (from the spectrogram) |
|---|---|---|---|---|
| 0.0–0.95 | "Nine out of 10 times" | Close-up. A giant white "9/10" sits behind the head (depth matte, the head covers part of it). Two red 4-point sparkles sit at the corners. Below the chin: "Times" in bold white italic with a red marker underline and a red glow. | Starts with a motion blur and a red light leak (0–0.25), then snaps sharp. The underline draws on left to right. The sparkles pop in with scale-overshoot. | Click/pop on "Nine", tick on the sparkles |
| 0.97–2.9 | "the truth about perfectionism" | Cut to the wide shot. Over the head: "PERFECTIONISM" in huge white condensed type, with "the truth" and "about" in small handwriting above it and two small emoji stickers on the letters. | The handwritten words write on first (0.9–1.7), then the big word slams in (1.9). | Pencil/scribble on the handwriting, pop on the slam |
| 2.93–5.1 | "is that it's just procrastination in disguise" | Full-screen cream paper page with a tiny definition paragraph at the top. A B&W b-roll (dark tunnel / keyboard) plays in a rounded phone-like card with a drop shadow. A red pill label "Procrastination" sits under it, with a barcode bottom-right and big red 4-point sparkles. | The page comes in with a soft blur reveal, the b-roll card scales up, the pill slides up, the sparkles spin in. | Paper slide/whoosh on the cut, pop on the pill |
| 5.13–7.0 | "And the reason why I say nine out of 10 times" | Close-up. Caption "the reason" (bold white) with "why I say" under it in red handwriting with a red blur glow. Then "[9/10]" in brackets. | Word-by-word pop-in, the red sub-line fades in with a glow. | Soft pops per caption group |
| 7.07–9.7 | "is because there is that small percentage" | Cream page. Red bold "THERE" → "IS THAT" (in front of and behind a photo) + handwritten "small" + "PERCENTAGE" across the bottom. A vintage photo cut-out of an office worker asleep on his desk (humour) sits in the middle. | Each word lands exactly on its spoken word. The photo drops in with a slight rotate and settles. Letters overlap the photo (one word behind, one in front). | Big broadband hit at 7.35 (the cut to the paper), small pops per word |
| 9.73–12.5 | "of people who utilize perfectionism specifically in content" | Plain cream page, kinetic type only: handwritten "who utilize" → red "PERFECTIONISM" → handwritten "specifically" → "IN" (red) → "CONTENT" (black). | Type-on, word-synced, each word in place, building the sentence. | Scribble on the handwritten words, ticks |
| 12.6–14.7 | "as a high standard to work after" | Wide shot. "AS A HIGH STANDARD" white condensed over the head + handwritten "to work after" + red sparkles. | Slams in, sparkles twinkle, the handwriting writes on. | Pop + sparkle tick |
| 14.77–17.8 | "meaning that they're still moving and doing necessary steps" | Close-up. Captions "meaning that" → "moving and" with a red glowing handwritten sub-line "necessary steps". | Word pops, red glow sub-lines. | Soft pops |
| 17.75 | (cut) | One-frame negative/inverted B&W flash of the wide shot. | Flash transition into the wide shot. | Whoosh/impact |
| 17.9–19.0 | "to achieve that goal" | Wide shot. Caption "to achieve" with red glow handwriting under it. | Pop in. | Pop |

Captions: 1–3 words, bold white, middle of the chest, under the chin; never on the face. The emphasis or second half goes in **red handwriting with a red blur glow** under the white line.
Music: very low, almost inaudible (no Shazam match). Most of the sound design is light pops, scribbles and one big hit.

---

## REF 2 (render.rrush): cut rhythm, b-roll, numbers, transitions
Grade: dark and moody, lifted blacks, green-tinted shadows; the speaker on dark acoustic slats with warm vertical light strips. Accent green (#3BE38A) plus red for the negatives. Captions: small white Inter Medium at the chest, often typed into a green gradient box.
Rhythm: a visual change every ~1.2–2 s; full-screen cutaways (b-roll, logo, astronaut, money) every ~4–6 s, each 1.5–3 s long.

| Time | Words | On screen | Animation | SFX |
|---|---|---|---|---|
| 0.0–0.5 | "Alpha Trader Firm" | Green face-tracking corner brackets on her face; white caption "Alpha Trader firm". | Brackets snap in; the caption types on. | Tech click |
| 0.6–1.5 | "pays you" | 3D green dollar bills fly across the frame, big "PAYS YOU" (white + green). | Bills fly toward the lens with motion blur, the words slam. | Whoosh + paper flutter |
| 1.75–2.9 | "for passing their challenge" | Text typed into a green highlight box. | The box wipes in left to right, words type. | Soft ticks |
| 3.2–4.1 | "not the other way around" | Plain white caption. | Pop. | — |
| 4.2–6.1 | "Most prop firms charge you a fee" | B&W office stock b-roll (a woman signing). Black label "Charge you a fee" with red text, held by tracking corner handles; a red dashed circle around the pen. | The label types; the circle spins and pulses. | Pen/marker + tick |
| 6.2–7.4 | "and that money is gone" | Back on face. Red glowing circle with an alert-envelope icon over a dark bar; words type into the bar. | The icon pops with a red glow pulse. | Alert pop |
| 7.4–8.1 | "forever" | Big red "FOREVER" with a white outline, on the chest. | Slam + shake. | Impact |
| 8.3–11.0 | "even if you pass, even if you're profitable" | Two checklist rows (green square + text on a green gradient bar). | Each row wipes in on its words. | Tick per row |
| 11.0–11.4 | "gone" | Both rows turn red. | Colour flip. | Negative blip |
| 11.4–12.6 | "Alpha does the opposite" | Logo reveal: the white logo glows on a dimmed frame with a big glowing ring sweeping around. | The ring arcs in, the logo scales up with bloom. | Strong whoosh + hit (11.1 s spike) |
| 12.7–16.0 | "You pass the evaluation, they refund you 200%" | Full-screen astronaut silhouette before a planet with a glowing ring. Caption, then a huge chrome "24% → 200%" count-up with a green pill "They refund you"; green wash rising from the bottom. | Count-up over ~1.5 s, ending on the word "200%". | Fast counter ticks (6–12 kHz hatching at 14–16 s) |
| 16.1–20.4 | "That means if you paid $350 for a 100k account" | Face, re-framed (punch-in, she moves to the right). "PAID $350" counter top-left. | Counts 28 → 350 on the word. | Counter ticks (17.4–18.4) |
| 20.5–22.3 | "you get $700 back" | "GET BACK $700" top-right, a green arc line draws from the first number to the second. Green glow at the bottom. | The arc draws on, the number counts. | Ticks + swoosh |
| 22.5–25.3 | "You literally made $350 just by passing" | Full-screen astronaut holding a trophy, big green "$350" counting up, green bills flying, a green glow fill. | Count-up + flying bills. | Ticks + flutter (22.6–25.2) |
| 25.4–31.8 | "Plus you keep the funded account. Plus you keep up to 100% of trading profits" | Face; tracking brackets; green pill "Keep funded accounts", then white pill "Retain 100% profits". | Pills slide in on the words. | Clicks |

What we take from it: punch-in reframes between sentences, full-screen cutaways (b-roll / logo / visual metaphor) every 4–6 s, number count-ups with ticks, items that change colour when the meaning flips, face-tracking corner brackets when he names something.

---

## REF 3 (eightsenses.media, "CLAUDE DID THIS"): music only, no voice in the post audio
Inner edit: dark moody grade, deep blacks, a vertical LED light bar in the back, teal accent (#2EC4B6), white-to-silver chrome type.
- 0.0–0.9: chrome "SIMPLE" behind the head + a teal sine-wave line crossing the frame through the head (behind him), small uppercase caption "OR SIMPLE THINGS LIKE".
- 0.9–3.2: teal app-icon chips stack up one by one: "Hitting the gym" → "Going out to eat" → "Missing meals", with a small "Sometimes" tag; chrome "MEALS" behind the head at 2.7.
- 3.4–4.6: caption "SO I KNEW I HAD TO MAKE THE…"; a clean breath with no graphic (the music drops out at 4.2–4.6).
- 4.6–6.0 (the drop): chrome "SWITCH" behind the head, "ASAP" icons orbit on a thin ellipse ring (3D orbit around the head).
- 6.2–9.9: a teal gauge (speedometer arc with ticks) behind the head fills up; caption "ULTIMATELY, I DECIDED ON"; a notification card "Selling · Low-ticket digital products" slides in, then a white pill "One Claude skill · $20".
Rhythm: the graphics change on the beat (≈ every 0.8–1.6 s); the big change is on the drop.
**Music: "Shot" by Meechie Alexander** (Shazam match on two separate clips: full and from 4.5 s). The drop is at 4.6 s.

---

## Rule set: "an effect on every spoken idea" (from ref1, with ref2/ref3 rhythm)

1. **One idea = one visual.** Split the transcript into ideas (a clause of 2–6 words). Every idea gets exactly one main visual plus the caption. Never two main graphics at once.
2. **Sync.** The visual enters on the onset of its key word (0–2 frames early). It stays until the next idea starts (normally 0.8–2.5 s). Exit fast (4–6 frames) or get replaced by the next one. No dead frames between visuals.
3. **What each kind of phrase gets:**
   - **Hook / claim / number** → giant condensed word behind the head (depth matte), 1.5–2.5 s, two red 4-point sparkles, small handwritten words around it.
   - **Ordinary sentence** → caption only: 1–3 bold white words under the chin; the emphasis word or second half in red handwriting with a red glow.
   - **Key word he stresses** → red marker underline or circle drawn on (marker SFX).
   - **Definition / "what is X"** → full-screen paper page: a real b-roll or screenshot in a rounded card + a red pill label + a small definition line (paper-slide SFX). 1.5–2.5 s, then back to the face.
   - **"Some people / most people / that guy who…"** → a real photo cut-out (funny if possible) with the words layered in front of and behind it.
   - **Named thing (tool, brand, app, person)** → its real logo or object, revealed with a glow ring or popping beside the head; corner brackets on his face if he means himself.
   - **Number / money / percent** → count-up with ticks, landing on the spoken word.
   - **List** → chips/checkboxes stacking one per item, a tick on each.
   - **Negative / mistake / "gone"** → the item turns red, gets struck through, or a red alert icon appears.
   - **Turn / punchline** → a flash or whoosh transition to the other framing + one bigger hit (once or twice per reel at most).
   - **Joke / aside** → a small hand-drawn doodle (arrow, "lol", circle, stick figure) drawn on next to the head.
4. **Face rule.** Text sits either BEHIND the head (between the background and him, using a matte) or under the chin in front of the chest. Never over the eyes or mouth. The only time the face is fully covered is a deliberate full-screen page/cutaway, 1.5–2.5 s, at most once every 4–6 s.
5. **Framing.** Alternate wide ↔ close (punch-in crop from his 4K) every 2–3 s or on each new sentence. That replaces ref1's second camera.
6. **Handwriting = the "drawings".** Small script words, arrows, circles and underlines draw on stroke by stroke (scribble/pencil SFX, quiet).
7. **Restraint.** Light pops on captions (quiet), one paper/whoosh on each full-screen change, one big hit per reel half. No SFX on top of a word.

## Brand adaptation (the user)
- Ref1's palette is already red / white / black, so it maps almost 1:1 onto black + deep Tunisian red.
- The paper pages become **dark paper**: black-to-deep-red gradient with grain, red and white type, and handwriting in off-white (instead of ref1's cream). Alternative to keep from ref1 if he prefers: cream paper only on the definition pages.
- Fonts: Anton (big words behind the head), Inter ExtraBold (captions), a handwritten script for accents, Cairo for any Arabic.
- Optional, from all 3 refs: a showcase intro (raw vs. edited cards, "Edited by Claude") for the first 1–2 s. Off by default.
