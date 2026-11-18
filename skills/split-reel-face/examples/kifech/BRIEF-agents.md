# Brief for scene agents — « Kifech na3mel el reels hedhom »

The user (a Tunisian DevOps/AI creator, Instagram @yourhandle) filmed a 1:55 face-cam reel in Tunisian explaining HOW
they make reels with Claude: find a reel → give it to Claude, which downloads and analyses it (ffmpeg frame by frame,
Whisper) → « habbetli les outils », same style, « act as expert motion graphics editor » → topic → script → ElevenLabs
voice → Remotion + skills + SFX + music → work split across agents in parallel, while they watch and ask for changes →
render 60 fps, 9:16 or 16:9, GPU, 20 min → video ready → bonus: « a3melli skill » for every next video.
We are editing it with motion graphics that SHOW each step. You build ONE scene. Read first:
- `C:\Users\YOU\Desktop\reel-project\reel-claude-workflow\EDIT-PLAN.md` — decisions, look, layout, **beat sheet** (your rows).
- `refs\Deg4HQMBJY3-analysis.md` and `refs\DemwzTPJK6J-analysis.md` (same parent folder) — the two references we copy
  (AIS meta-graphics: real commands/data, stamps, filmstrip, terminal; Claude editorial: one accent, serif keyword in
  italic coral, Claude UI rebuilt, each element enters ON its word). Look at their contact sheets in `refs\*-frames\`.
- `src/edit/kit.tsx` (USE IT: useIn/usePop/enter/float, Card, Chip, Title, Spark, typed/Caret, Window, ClaudeWindow,
  Bubble, Terminal, Cursor, Ring, Wave, Thumb, Stamp), `src/edit/theme.ts` (K colours, AR/UI/SERIF/MONO fonts, L layout),
  `src/edit/time.ts` (`wf(word, approxSec)` → frame of that spoken word; `f(sec)`), `src/edit/layout.ts` (modes).

## Project + commands (Windows, Git Bash)
- Remotion 4.0.535 project: `C:\Users\YOU\Desktop\reel-project\reel-claude-workflow\remotion-video`.
- Type-check: `cd <project> && npx tsc --noEmit` (other agents edit other files at the same time: fix only YOUR errors).
- Stills of your scene alone (silent, with captions + header, GLOBAL frame numbers):
  `npx remotion still Scene-<id> out/qa/<id>/f<frame>.jpg --frame=<frame> --scale=0.5 --image-format=jpeg --log=error`
  Tile them with ffmpeg (`-filter_complex hstack/vstack` or `tile=`) and READ the sheet. Iterate until it looks premium.
- **NEVER render the video** (`npx remotion render`) and never start the Studio — the user reviews in Studio themselves.
- You own ONLY `src/scenes/<YourScene>.tsx` (+ new files `src/scenes/<YourScene>/*` if you want). Everything else is read-only.
  Keep the exports: `export const <YourScene>: React.FC` and `export const <yourScene>Cues: Cue[]` (Cue from `../edit/cue`).

## Rules
- **Global frames.** Scenes are mounted without a Sequence offset: `useCurrentFrame()` is the reel frame. Return `null`
  outside your range(s) (keep ~10 frames of exit). For videos/clips inside your scene use `<Sequence from={globalFrame}>`.
- **On the word.** Every element enters ON the word that names it: `wf("ffmpeg", 34.2)` etc. (word times are in the
  beat sheet and `src/data/captions.json`). Entrance = house grammar (blur 6→0, scale .96→1, rise 14, ~7 frames); exits fast.
- **Never static**: something moves every 0.3–0.7 s (new element, typing, counter, float, slow push 1→1.03).
- **Layout areas** (1080×1920):
  - split (most steps): your stage is y **1040–1450**, x 60–1020 (keep x ≤ 940 below y 1000 is NOT needed here except for
    text near the right edge; the IG icon column starts x > 950 at y > 1000 — keep important text inside x 60–940).
    The face panel (y 0–880) and the header (progress + title, y 880–1035) are not yours. Captions sit at y ≈ 1460–1560.
  - face (hook / easy / outro): the face fills the frame — face box ≈ x 180–950, y 20–1150: NEVER cover it. Use the
    sides of the head (x < 200 or > 900), above the hair (y < 120) only lightly, and the chest y 1150–1450
    (captions at y ≈ 1190–1290 in face mode, the mic at x 600–1000, y 1300–1550).
  - gfx (agents, reveal): full frame is yours, y 200–1450 (a small face circle sits at x 800–1020, y 200–420: avoid it),
    captions at y ≈ 1460–1560.
- **Look**: warm dark + ONE accent coral `K.coral` (#D97757). Cream text. Glass cards (`Card`, `glass()`). Latin keyword in
  `SERIF` italic coral (Claude editorial). Mono for commands. No other accent colours except `K.ok` for a success tick.
  No logos of real companies (Instagram, CapCut, Premiere, ElevenLabs, GitHub…): their NAMES in plain text are fine,
  Claude's spark (`Spark`) is fine. Rebuild UIs as clean vector mockups (no screenshots).
- **Text**: Arabic in `AR` font with `dir="rtl"`, tech/English/French words in Latin (like the captions). Prompts the user
  types to Claude are in 3arbizi Latin (« tfarrej fel vidéo hedhi w analysiha b détails »), Claude's replies in French.
  Keep on-screen text short (the captions already carry the words).
- **Meta / real data** (AIS reference): show the REAL commands and numbers of this very project when you can:
  `yt-dlp https://www.instagram.com/p/DemwzTPJK6J/`, `ffmpeg -i reel.mp4 -vf fps=2,tile=5x4 sheet.jpg`,
  `whisper large-v3 → 281 mots`, the video is 1080×1920 · 30 fps · 1:55, Remotion 4.0.535, skills `reel-pro-edit`,
  `cinematic-motion-teaser`, `remotion-best-practices`, `aura-trailer`, `devops45-reel`, 8 agents in parallel.
- **The user's LAST 4 Instagram reels** (real, @yourhandle, newest first): `public/thumbs/ig-1.mp4` … `ig-4.mp4` (360×640,
  silent; frame sheets `refs\mine\sheet-ig-N.jpg`, 1 fps). Never the pinned reel. The hook uses them; other scenes may too.
- **The user's own videos** for every other "reel" you show: `Thumb name="trailer-1..4 | intro-1..4 | ep1-1..4 | fr-1..4"` and
  clips `public/thumbs/clip-trailer.mp4 | clip-intro.mp4 | clip-ep1.mp4 | clip-fr.mp4 | ep1-full.mp4` (360×640, use
  `<OffthreadVideo>` or `@remotion/media` `<Video>` muted inside a Sequence).
- **3D** is welcome where it adds wow (`@remotion/three` + `three` are installed; see `src/overlays/Claude.tsx`
  ClaudeSpark3D for a working example) — keep it light, one 3D element at a time.
- **Sound**: export your cues `[{ f: wf("…", t), sfx: "whoosh", vol: 0.4, note: "…" }]`. Files in public/audio/sfx/:
  anime-wow bone-crack ding dissolve flash keypad loading-lag match mouse-click page-turn pop record-scratch riser
  shutter-modern snapchat-notification sting success swipe switch tap tick vine-boom whip whoosh windows-xp-error.
  Lots of sound design (the user wants it), but tasteful: 0.2–0.5 volume, short, on the visual event, never on top of a
  key word for long. `trimFrames` cuts a long file. Mode changes (face↔split↔gfx) already get no sound: add a whoosh/whip.
- Deterministic only (no Math.random / Date). `random(seed)` from remotion is fine.

## Report
Files, what the viewer sees per beat (frame → visual → word), your cues, stills reviewed (paths), open issues.
