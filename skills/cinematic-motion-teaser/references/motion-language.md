# Motion language — the vocabulary, the numbers, where the code is

All numbers assume 60 fps and the layout unit `u = min(w,h)/1080`.

Paths:
- `T/` = `templates/remotion-starter/src/`
- `N/` = `examples/nearmatch/video/src/`

## Contents
1. House curves & springs
2. The 10 moves (recipe + code)
3. Transitions
4. Editing grammar & rhythm
5. Scene recipes from NearMatch (copy these patterns)
6. Layout rules for 9:16 vs 16:9
7. Gotchas

## 1. House curves & springs (`T/lib/motion.ts`)
- `EASE_OUT = bezier(0.16,1,0.3,1)`: expo settle, used for almost everything that arrives.
- `EASE_IN_OUT = bezier(0.65,0,0.35,1)`: transitions and camera.
- `EASE_IN = bezier(0.7,0,0.84,0)`: exits and fly-aways.
- Springs (damping/stiffness/mass):
  - `SPRING_WORD` 18/140/0.9
  - `SPRING_POP` 14/160/0.8 (chips, badges)
  - `SPRING_SOFT` 20/110/1 (big things)
  - From the NearMatch app: card 22/180/1, sheet 26/240/0.9, celebrate 14/140/1.1, click 12/220/0.8.
- Helpers:
  - `springIn(frame,fps,delay,cfg)`
  - `lerp(frame,[a,b],[x,y],ease)` (clamped)
  - `drift(frame,fps,seed,amp,period)` gives `{x,y,r}`, an organic float so nothing freezes
  - `blurInStyle(p,u,rise)` / `blurOutStyle(q,u)`
- Overshoot stays subtle except on celebration beats (match, success).

## 2. The 10 moves

1. **Kinetic word stacks** — `KineticText` in `T/kit/Type.tsx`.
   - Each word animates blur 14u→0, translateY 40u→0, scale 0.92→1 and opacity, using `SPRING_WORD`.
   - To sync each word to the VO, use `stagger={0}` and per-word `delay = W(i) - W(i-1)`, with `startFrame = W(first) - 3`.
   - Key word: accent colour + `glow`. A heavier weight or italic gives contrast.
   - Exit: `exitFrame` blurs the stack 0→16u and fades it over 8 frames.
   - Hero lines run 120–250u. Keep line length ≤ ~14 characters in portrait.
2. **Number rolls** — `NumberRoll` in `T/kit/Clock.tsx`.
   - Odometer mode: pass a number. Fractional values roll; drive it with `lerp(frame,[a,b],[0,37])`.
   - Slot mode: pass a string with `from`, `progress`, `spins`, `stagger`; columns land left→right.
   - Vertical motion blur is built in.
   - Use it for any number: counts, prices, timers, codes.
   - Ticking clocks: roll one tick every ~20 frames (not real time), with a light pulse plus a tick SFX each tick.
3. **Live UI simulation.** Rebuild the real screen in app points (390×844) inside `<Phone height>`, then "use" it:
   - `TapRipple` + `PillButton press` for taps
   - swipe with rotation + spring-back (`N/scenes/deck/swipe.ts`)
   - typing with a blinking caret, one digit per keypad sound (`N/scenes/code/`)
   - chat bubbles popping in with overshoot (`N/kit/Chat.tsx`)
   - notifications dropping from the top with glass
   - rings filling
   - `CheckMark` drawing on (stroke-dashoffset)
4. **Glass layers** — `glassStyle()` in `T/kit/Glass.tsx`.
   - Recipe: blur 26 + saturate 180%, fill `rgba(40,40,44,.42)`, 1px border `rgba(255,255,255,.14)`, 1px inner top highlight `rgba(255,255,255,.22)`, **no drop shadow**.
   - Floating chips: `drift` with amplitude 4–8u, period 3–5 s, phase per element.
5. **Depth & parallax** (≥3 planes):
   - background plate/aurora (slow)
   - subject
   - foreground `Bokeh` (blur 10–26u, fastest)
   - `NightAurora` / `OnyxBg` / `Glow` give coloured light. Light is a radial glow, not a shadow.
6. **3D device** — `Phone` with `tilt`, `glare` and extruded thickness.
   - Keep the tilt moving across the scene (−22°→−8°).
   - Use Three.js (`@remotion/three`) for true 3D: the feed tunnel in `N/scenes/hook/FeedTunnel.tsx`, the particle dissolve in `N/scenes/gone/Dust.tsx`, the depth field in `N/scenes/endcard/DepthField.tsx`.
7. **Camera.**
   - Every scene has a continuous push (scale 1→1.06 over the scene).
   - Punch-in on the key beat: +0.05–0.15 with an EASE_OUT settle over ~30 frames.
   - Push in on the phone as the scene progresses.
8. **Masks & reveals.**
   - Iris from the element just tapped.
   - Letters rising through an `overflow:hidden` mask (end-card wordmark).
   - Strike-through drawn across "the old way" (`StrikeThrough`).
   - Highlighter swipe behind key words (`Highlight`).
   - Logo drawing on with stroke-dashoffset.
9. **Accents.**
   - `Sparkles` (one-shot or twinkle)
   - `PulseRings` / ripples from a live element
   - `Burst` (12 dots) on a success/match
   - `Glow` pulses on the primary CTA
   - film `Grain` at 0.06–0.08 on brand frames
10. **Text behind the subject.** Huge words (Inter 800, white ~90% or outline) placed BEHIND the phone, which occludes part of the letters. Example: NearMatch deck "HERE." → "RIGHT NOW." → "SAME PLACE." (`N/scenes/deck/BigType.tsx`).

## 3. Transitions (`T/lib/transitions.tsx`, wired in `T/Teaser.tsx`)

| name | what | when | frames | SFX (lead before the cut) |
|---|---|---|---|---|
| `lightStreak({core,accent})` | diagonal glowing 3-bar sweep that reveals the next scene behind it | **signature**: into product scenes and the end card (use a violet accent into the logo) | 22–24 | whoosh 0.55 (lead 12) |
| `whipPush({direction})` | fast push + motion blur (sin-shaped blur peak 36u) | energetic line changes; "down" after the hook | 16–20 | whip 0.5 (lead 8) |
| `irisFrom({x,y,ring})` | circle reveal from a point (frame fractions) with a glowing ring | from the button just tapped (NearMatch: from the like ♥ into the match) — export the point from the scene | 20 | pop 0.4 (lead 2) |
| `blurDissolve()` | focus pull + slight scale | mood drop (into the "gone" scene) | 20 | soft whoosh 0.3 |
| `cardFlyAway()` | old scene shrinks to a tilted 3D card and flies off | "chapter" change | 18–24 | whoosh 0.5 |

The NearMatch order was: whip↓, streak, whip, iris(♥), streak, whip, blurDissolve, streak(violet). Alternate the types; never repeat one three times in a row.

## 4. Editing grammar & rhythm
- **Cut point** = the midpoint of the silence between two lines (`vo_to_timeline.py`). Nudge by eye after watching.
- **Each scene must be alive at every frame,** including the half-transition at both ends: start already in motion and keep moving through the exit.
- **Temperature:** hook cold/grey (the old way) → reveal warm brand → product scenes black UI + coloured light → mood-drop scene desaturated → end card brand aurora.
- **One idea per scene,** and ≥2 visual beats per spoken line.
- **Beat density:** 0.6–1.5 s between "new things". Count them on a contact sheet.

## 5. Scene recipes (NearMatch — the full code is in `N/scenes/`, the shot list in `examples/nearmatch/brief/scenes.md`)

| Scene | Line | Recipe |
|---|---|---|
| hook | "Other apps keep you on your phone." | Cold grey **Three.js feed tunnel** of blurred cards/bubbles streaming at the camera. Kinetic stack word-on-word. Ends with a CRT switch-off (line → dot). No brand colours (the old way). |
| reveal | "NearMatch gets you off it." | Aurora breathes in. The logo **draws itself**; the dots click on the brand word, then flash + ripples. Wordmark blur-rises; the kinetic line lands. |
| checkin | "Check in where you are. A bar, a café, a gym." | Blurred venue plate + bokeh. 3D phone with the real check-in screen. Tap → glass confirm sheet → success. Three glass venue chips burst out, **one per spoken noun**, with number-roll counts. |
| deck | "See who's here, right now…" | Big phone swipe deck: two passes (rotation + fly-out), the hero card holds, like ♥ pressed. **Huge text behind the phone.** Floating chips. Exports `IRIS_ORIGIN` (♥ centre). |
| match | "Match… and the clock starts. No extensions, no snooze." | Celebration: portraits slide together, heart pop + 12-dot burst + chime. Then a giant mono countdown with ring arc and ticks. "+15 min" pill struck through; "Snooze" toggle struck. |
| code | "Find each other and swap the code, face to face." | Chat with a live timer → tap "Come see me" → two phones turn to face each other. The code reveals digit by digit on one and is typed on the other (keypad SFX). All boxes go green with a success flash. |
| met | "You met? The chat is yours to keep." | Portraits meet, green check + burst + success chime on "met?". Pull back into the chat: the countdown ring unwinds into a "Met" pill, new warm bubbles, a "Saved" chip. |
| gone | "Miss it… and it's gone." | Colder. A critical rose countdown hits 00:00 and the chat **disintegrates into particles** (Three.js points) with the dissolve SFX. Quiet "match ended" state dims out. |
| endcard | "NearMatch. Meet someone. Tonight. Right here. Be here now." | Aurora + ripples + 3D depth particles. The logo draws, the dots click EXACTLY on the brand word (sting). Headline stack, then it clears and the signature line lands word by word. URL pill. Long calm hold. |

The template's demo scenes (`T/scenes/Hook|Product|EndCard.tsx`) are small, commented versions of the same patterns: word-synced stack + glass cards + counter → fly-out + name punch; a phone used by a finger + orbiting glass chips + burst; logo draw + letter mask + tagline + sparkles.

## 6. Layout: one component, two formats
- `portrait ? A : B` for positions and sizes only. Timing, beats, copy and SFX stay shared, which keeps the two formats in sync.
- **Portrait:**
  - type in the upper 40%, device centred
  - phone height ~52–60% of the frame with its top at ~8%, bottom above the caption band
  - chips orbit the phone's top half
- **Landscape:**
  - device at 30–40% of the width, type/chips on the other side
  - phone height ~70% of the frame
  - huge background text spans the full width
- After a format is approved, put further changes **only inside the other branch**, and prove the approved format is pixel-identical (`scripts/qa/cmp.py`).

## 7. Gotchas we hit
- **NumberRoll gap:** a number-roll gap ("Gym 9 here") showed as a visible flaw; check spacing next to rolled digits.
- **`backdrop-filter`** only blurs what is painted behind it inside the same stacking root. On pure black, glass reads as graphite (that's correct).
- **Whisper spelling:** it writes "cafe," for "café,". Fix it at display time (`DISPLAY` in `captions.config.ts`).
- **WebGL noise:** Three.js scenes can differ by ±1 per pixel between renders. Compare with a tolerance, not exact equality.
- **TransitionSeries:** the total equals the sum of durations minus the sum of transition frames. `vo_to_timeline.py` keeps that true; don't hand-edit `timeline.ts`.
- **Assets:** check they exist with `getStaticFiles()` and fall back gracefully, because agents work while assets are still being generated.
