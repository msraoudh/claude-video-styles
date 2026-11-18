# Creative Direction System — template

Copy this into `<project>/brief/creative-direction.md` and fill every `{…}`. Every scene agent reads it before writing code, so it must be specific. Section 7 (brand system) overrides everything else.

Filled example: `examples/nearmatch/brief/creative-direction.md`. Read it; it is the version that got approved.

---

# {Product} {Teaser} — Creative Direction System

> The style bible. Every scene subagent reads this file before writing a single line of code.
> The quality bar: the @itsbahahaouas "edited by Claude" reels — premium, kinetic, glassy, and never static.

## 0. Deliverables & technical frame
- Two compositions from ONE code base: `Teaser-16x9` (1920×1080) and `Teaser-9x16` (1080×1920), both 60 fps, {~45 s}.
- Every scene is responsive: `const {portrait, u} = useLayout()`, and every px × u (u = min(w,h)/1080).
- Never build two scenes per format.
- Landscape usually puts the visual on one side and the type on the other. Portrait stacks the type above the visual (or puts the type behind the device).
- Safe areas:
  - Portrait: ≥90u from the sides, ≥220u from the top, ≥380u from the bottom (Instagram UI).
  - Landscape: ≥100u on all sides.
  - Caption band: portrait y 64–76%, landscape y 80–92%. Keep it clear in the captioned scenes.
- Minimum type at u=1:
  - hero 120–220
  - secondary 84
  - supporting 44
  - (UI micro-labels inside mockups can be smaller)
- Remotion law (from `remotion-best-practices`):
  - `useCurrentFrame` + `interpolate`/`spring`/`Easing` only; no CSS transitions or animations
  - `premountFor={fps}`
  - `staticFile()`
  - `<Img>`
  - `@remotion/three` with frame-driven animation, no `useFrame`
- Determinism: `random(seed)` and `@remotion/noise`; never `Math.random`/`Date`.

## 1. The feeling
{3–5 adjectives, e.g. "Premium · alive · warm · intimate · local"}. {One image, e.g. "an Apple keynote cut by a TikTok editor: big confident type, real product UI that moves like it's being used, constant gentle motion."}

## 2. Motion vocabulary (combine 2–4 per scene)
Details and numbers are in the skill's `references/motion-language.md`. Pick the ones that fit:
1. kinetic word stacks
2. number rolls
3. live UI simulation
4. glass layers
5. depth & parallax (≥3 planes)
6. 3D device
7. camera moves (push 1→1.06 plus punch-ins)
8. masks & reveals (iris, wipes, strike-through, highlighter)
9. accents (sparkles, ripples, glow pulses)
10. text behind the subject

## 3. Editing grammar
- Never static: something new every 0.6–1.5 s.
- Cut on the word: the VO word timings (`src/data/timeline.ts`) are the master clock, ±3 frames.
- Transitions (house set in `src/lib/transitions.tsx`), 14–24 frames, never a plain crossfade by default:
  - `lightStreak` — the signature diagonal glowing bar
  - `whipPush`
  - `irisFrom(x, y)` — from the element just tapped
  - `cardFlyAway`
  - `blurDissolve` — reserved for mood drops
- Rhythm: alternate scene temperature (dark ↔ light, dense ↔ airy).
- Hook rule: the first 1.5 s has motion AND a bold claim. No logo-first opening; the logo is the payoff.

## 4. Captions
- Word by word.
- Spoken word white 100%; not yet spoken 35%; key words in their semantic colour with a soft glow.
- Max 2 lines / ~5 words per page, from `src/data/captions.config.ts`.
- No captions on scenes whose line is already kinetic type (hook, reveal, end card).

## 5. Sound design (director only; scene agents just export `SFX_CUES`)
- VO = the master clock.
- Riser at frame 0, a whoosh/whip on every cut (peak on the cut), UI pops on chips, a swipe swish, a hero chime on the big moment, ticks for timers, a logo sting at the end.
- Music bed ducked under the voice. Its drop lands on the release line ({e.g. "You met?"}).

## 6. Scene list
→ `brief/scenes.md` (one scene per VO line, local frames, beats on words, layouts per format, SFX cues).

## 7. {Product} brand system (AUTHORITATIVE — overrides everything above)
- **Product in one line:** {…}. **Signature line:** {…}. **Headline:** {…}.
- **Palettes:** {UI palette with exact hexes: background, surfaces, hairlines, text tiers}; {brand-frame palette for title/end cards}.
- **Colour roles (meaning):** {e.g. accent = LIVE only; green = presence/success; the gradient belongs ONLY to the logo}. Selection colour {…}. Primary button {…}.
- **Type:** {families + weights from the brand; digits font}. Headline {weight, tracking, line-height, case}. No other families.
- **Shape:** radii {…}. Glass recipe {fill, blur, border, top highlight}. Shadows {rules — e.g. "coloured light = radial glow, never a drop shadow"}.
- **Motion DNA (from the app's own motion file):** house curve {…}; springs {…}; stagger {…}; "{no bounce}" (the teaser may be more kinetic, but keep overshoot for celebration beats).
- **Logo:** {how it animates (copy the app's animation)}; **never** {rotate / recolour / glow / retype}. Use the SVGs in `public/brand/`.
- **Tone:** {voice rules, e.g. short, warm, direct, present tense, second person; no emoji in our own voice}.
- **Never show:** {e.g. maps, scores/%, competitor features, store badges with links, user numbers…}.
- **Demo data (use exactly):** {names, ages, places, codes, times, counts — one consistent fictional story}.
- **Real UI references to mirror:** {paths to app components, design docs, the captures in `screens/`}.
