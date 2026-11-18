# Remotion build — template architecture

Template: `assets/remotion-template/` (Remotion 4.0.535, 1080×1920, 30 fps, composition `Reel`). Load the
`remotion-best-practices` skill before writing Remotion code (markup rules, sfx, 3d, captions, effects).
`src/data/example-reel1/` holds reel #1's data so the template can be previewed: copy those 4 files to
`src/data/` to try it; the pipeline overwrites them for the new video.

## Layer stack (`src/Reel.tsx`)
1. `<Footage>` — the shot inside a moving camera (`cameraAt()`), CSS grade (`gradeAt()`), lens vignette.
   Children render INSIDE the camera, above the plate:
   - `<ColorWipe>`-style backdrop-filter effects on the plate
   - `<BehindText>` beats: big words + `<Cutout>` (transparent webm of the person) on top → text behind the subject
   - `<DropStage>` (background replaced by a designed stage, cutout on top), `<OrbitStage>` (chips orbiting the head: back half, cutout, front half)
   - `<ArmpitBlur/>` LAST (above every cutout)
2. `<CinematicLayer amount={0.5} leaks={false} />` — plain sibling right after `</Footage>` (no wrapper with opacity/transform/filter, or its blend modes stop reaching the footage). **0.5 + no leaks is the user's approved strength.** Full strength was "too much colours".
3. Motion graphics: one `<Sequence name=… from={sec(t)} durationInFrames={sec(t2)-sec(t)} premountFor={fps}>` per beat, each component gets `from`/`dur` and cues with `cue = (t) => sec(t) - from`.
4. `<Captions captions hide={[[ms,ms]]}/>` on top (hide them under a full-screen title).
5. `<SoundDesign/>` — voice, music bed (volume callback), one `<Audio name="sfx …" from={sec(t)}>` node per effect.

## Time: always `sec()`
`src/lib/motion.ts` `sec(s)`: seconds on the ORIGINAL cut timeline → frame on the CURRENT cut, skipping
`src/data/remap.json` removed ranges. Write every cue in the seconds you read from the first word-timing
pass and never touch them again when glances/stutters are removed later — everything stays on its word.
Durations that are not timestamps (e.g. an SFX length) are plain frame numbers, NOT `sec()`.
`gradeAt()` must compare frames: `interpolate(frame, [sec(a), sec(b)], …)`.

## Camera (`src/timeline.ts`)
- `FRAMING[origClipIndex] = [scaleStart, scaleEnd]`: alternate wide (1.0) / tight (1.1–1.14) on consecutive clips to hide jump cuts; deliberate moves on story beats (slow tension push 1.0→1.12, punch 1.3 on the key word, comic pull-out 1.16→1.0, dramatic push 1.0→1.26 before the drop). Clips without an entry alternate automatically. Split clips (`part > 0`) get ×1.1.
- `PUNCHES` (in-clip punch at a word), `SHAKES` (record scratch, impact, drop), drop bounce.
- `cineMoveAt()` (src/cinematic/zooms.ts): dolly / dutch-tilt moves layered on top, `coverScale()` guarantees the plate edges never show. Times there are ORIGINAL-cut seconds too.
- transform origin 50% 30% (face height).

## Text behind the subject (`src/components/Behind.tsx`)
- Measure where the head is from the matte (bands of 100 px rows, person x-extent per beat). In reel #1 the head spanned x≈150–700 → words live in the free column on the right `[630, 540+500/zoom]`, left edge tucked behind the head, bottom line behind the shoulder. A centred word gets eaten by the head ("…ÇAIS").
- `fitText` (@remotion/layout-utils) sizes each line to the column; split long words over lines ("FRAN/ÇAIS", "LE/MONTAGE/VIDÉO").
- The column is computed from the camera zoom at the beat so zoomed shots never push words off-frame.

## Overlays library (`src/overlays/` — reel #1 content, reuse the components, rewrite the copy)
ui.tsx (Glass card, enter/exit, emoji font, SVG icons, Claude spark mark) · Intro (progress card, name card + chips, checklist) · Struggle (idea burst, cinematic preview card, error pop-ups, tutorial pile, screen crack, snoozed reminders, loading-forever bar, full-screen JAMAIS cutaway) · Claude (3D spark with @remotion/three, chat card typing + ticking items, before/after colour wipe, glitch hit, light streak) · Outro (drop stage with scrolling text wall, flash, rocket, fan cards, French sweep, IG poll, whip, orbit chips, follow CTA with cursor click).
Safe zones (1080×1920): face ≈ y 100–760 · cards y 780–1240 · captions top 1265 · avoid y > 1480 (Reels UI) and x > 950 for y 1000–1700 (icons).

## Captions (`src/components/Captions.tsx`)
createTikTokStyleCaptions (750 ms pages), Inter 900 74 px, white with dark 14 px stroke, active word lifts 1.07, keywords in accent orange (regex list — update per video), unsaid words at 55 %.

## Gotchas
- Cutout: `<OffthreadVideo transparent>` of a VP9 yuva420p webm, `trimBefore={from}` inside its Sequence, same `gradeAt` filter as the plate.
- Inside a Sequence `useVideoConfig().durationInFrames` is the composition's — pass `dur` explicitly.
- Remotion Studio locks media files → new file names per version.
- WebGL (3D, effects) needs `Config.setChromiumOpenGlRenderer("angle")` (already in remotion.config.ts).
- `npx tsc --noEmit` before every render; `noUnusedLocals` is on.
- Studio: `.claude/launch.json` at the folder the session runs in, e.g. `{"name":"remotion-studio","runtimeExecutable":"npm","runtimeArgs":["--prefix","remotion-video","run","dev","--","--no-open","--port","3123"],"port":3123}` then `preview_start`.
