# EDIT-PLAN — « Kifech na3mel el reels hedhom » (1:55, Tunisian, face cam)

Source: `C:\Users\YOU\AppData\Local\CapCut\Videos\1021.mp4` (the user's CapCut cut of `Downloads\Demo.mp4`), 1080×1920, 30 fps, 115.03 s.
Remotion project: `remotion-video/` (reel-pro-edit template + `src/edit/` + `src/scenes/`). **No final render without the user's OK.**

## User decisions (2026-10-21)
- Layout: **split** (face on top, animation below — the mic disappears) + **full-screen hits** (hook, agents in parallel, the video « حاضرة », the end).
- Captions: **Arabic letters**, tech / English / French words stay in Latin (« الـ reels », « Claude », « ffmpeg »). Word by word.
- Colours: **Claude coral + warm dark**. Length: **keep 1:55** (no content cut).
- Sound: music + lots of SFX. **Music: #4 « Young Trizzy 02 » (Arulo, Mixkit 431)**, starting at **3 s** (user: "start it at 3 sec"):
  its first 808 hit lands on « والصوت » (3.04 s, "and this sound"). Bed
  `music/bed-trizzy-v2.wav` (bar splices skip the 8-bar break), level ≈ 18 dB under the voice. « كلّو بـ Claude » keeps an SFX hit.

## References (refs/*-analysis.md)
- **Deg4HQMBJY3 (AIS / Nate Herk):** graphic + speaker split, 52 % full-screen graphics, hard cuts, every graphic shows THIS video's real data (terminal lines, transcript, timeline, cut counter, ✕ RETAKE / ✓ KEPT stamps, filmstrip), slow push-in on every shot, caption pill on the seam, music enters with a sub hit on the reveal line.
- **DemwzTPJK6J (Claude editorial):** one accent (terracotta), Instrument Serif title with the keyword in italic accent, a segmented progress bar of the steps, Claude's UI rebuilt as vector mockups (typing prompt, attachment chips, replies), each element enters ON the word that names it (blur 6→0, scale .96→1, rise 12 px, 6 frames), ring counter, recap checklist.
- **Our mix:** the meta idea of reel 1 (show the REAL commands / data we used for this very video) + the clean Claude editorial grammar of reel 2, in warm dark + coral.

## Look
- Palette: bg `#0F0B09`→`#1B1310`, cream text `#F5EEE4`, muted `#B9A898`, coral `#D97757` (Claude), coral light `#F0A487`, glass `rgba(36,26,21,.62)` + 1.5 px `rgba(255,236,220,.16)` border, ok green `#7FD1A1` (sparingly).
- Fonts: **Alexandria** 700–900 (Arabic + Latin captions and titles), **Instrument Serif** italic (Latin keyword accents), **Inter** (UI), **JetBrains Mono** (terminal, timecodes).
- Grade: warm, natural skin; slow push-in on the face (1.00→1.04 per shot), cinematic layer 0.5, no leaks.

## Layout (1080×1920)
| mode | face | stage | captions |
|---|---|---|---|
| `face` | full frame | — (overlays on the chest area y 980–1480, never on the face) | pill y≈1330 |
| `split` | panel y 0–800 (source y 0–800 shown, push-in) | warm-dark stage y 800–1920, progress bar y≈840, step title y≈880–950, content y 980–1560, right margin 140 px | pill on the seam y≈800 |
| `gfx` | small PiP circle top-right (optional) | full-frame graphic, content y 220–1560 | pill y≈1600 |
Transitions between modes: 14-frame eased morph of the face panel (no hard jump), whoosh.

## Beat sheet (seconds = 1021.mp4 time; word starts from `src/data/captions.json`)
| t | line | mode | visual | SFX |
|---|---|---|---|---|
| 0.00 | كيفاش قاعد نعمل في الـ reels هذوما | face | punch-in 1.00→1.10; **the user's LAST 4 Instagram reels** (`public/thumbs/ig-1..4.mp4` = 19 Oct, 17 Oct, ~15 Oct, 14 Oct — NOT the pinned one) land side by side on « الـ reels » (0.70), each PLAYING a lively 2–3 s capture in coral glass frames, same vibe; they stay through « هذوما » (2.62) then fly to the sides as the chips arrive | whoosh, pop ×4 |
| 1.34 | والـ motion graphics هذوما، والصوت هذا، وكل شيء | face | chips « motion graphics » (1.34), waveform « الصوت » (3.04), « كل شيء » burst (3.84) | pop, tick |
| 4.38 | أولاً ما نستعمل حتى logiciel de montage | face | a generic editing timeline card gets struck ✕ « 0 logiciel » | record-scratch-lite, error |
| 5.92 | كلّو بـ Claude | face | **MUSIC STARTS + sub hit**; Claude spark 3D slams in, coral flash | sting/impact |
| 6.92 | تابع معايا 60 seconde، نوريك les étapes | face | ring timer « 60 » (7.45) + 5 step dots (8.40) | tick, pop ×5 |
| 9.14 | easy peasy | face | sticker « easy peasy ✌️ » | pop |
| 9.62 | → split | split | morph, progress bar step 1 lights | whoosh |
| 9.80 | étape الأولى: نلوّج على reel مزيانة عجبتني | split | phone mock with a vertical feed of the user's reels scrolling, stops on one (11.75), heart burst « عجبتني » (12.31) | swipe, like |
| 12.96 | الـ motion متاعها… الـ style، الـ rythme، الـ animation | split | 4 tags land on their words (12.96 / 14.68 / 15.33 / 15.84) | pop ×4 |
| 16.63 | ونكوبي الـ lien متاعها، سواء Instagram، سواء vidéo، سواء أي حاجة | split | « Copier le lien » click (16.63) → link chip; source chips Instagram / vidéo / أي حاجة (18.11 / 18.86 / 19.37) | click, pop |
| 19.86 | étape 2: نعطي الـ lien لـ Claude ونقلّو تفرّج… أناليزيها… | split | Claude chat window (dark), link chip drops in (21.98), prompt typed in 3arbizi « tfarrej fel video hedhi w analysiha b details… » (23.33→30.4) | typing, send |
| 30.70 | Claude يهبّطها وحدو، ويناليزيها بالـ outils كيما ffmpeg، frame by frame | split | terminal: `yt-dlp` download bar (31.59), `ffmpeg -i reel.mp4 -vf fps=2 frames/%03d.jpg` (34.19), filmstrip of frames flips « frame by frame » (34.91) | keys, ticks |
| 35.56 | وبعد يقلّي كل شيء: بشنوّة، وكيفاش، وشنوّة الـ outils | split | Claude reply card: analysis bullets (hook, layout, motion, couleurs, sons) + tool chips (Remotion · ffmpeg · Whisper) | ding, pops |
| 39.08 | étape 3: نقلّو بهي، هبّطلي الـ outils هاذم الكل | split | tool cards drop into a toolbox (41.16) | drops |
| 43.04 | باش نعملو حاجة بنفس الـ style، نفس الـ motions، نفس الـ cards | split | ref card ↔ our card, 3 checks on style (44.20) / motions (45.30) / cards (46.37) | check ×3 |
| 47.38 | brainstormi معايا و act as expert motion graphics editor | split | prompt chip typed + role badge stamp « 🎬 Expert Motion Graphics Editor » (49.26) | typing, stamp |
| 51.20 | ديما نحكيلو نفس الحكاية… selon الـ vibe متاعنا | split | ref palette swatches morph into our coral palette « vibe » (54.61) | shimmer |
| 55.28 | étape 4: نعطيه الـ topic، وهو يمشي يكتب الـ script | split | topic chip (56.71) → script doc types itself (58.55) | typing |
| 59.04 | يجينيري الصوت بـ ElevenLabs، يستعمل Remotion والـ skills | split | voice waveform generating « ElevenLabs » (59.95), Remotion timeline builds (61.49), skill chips: reel-pro-edit · cinematic-motion-teaser · remotion-best-practices (62.13) | pops |
| 63.22 | الـ sound effects، الموزيكا، كل شيء يلوّجو | split | SFX lane + music lane slide into the timeline | whoosh, bass |
| 67.20 | ويفرّق الخدمة على des agents، يعني عندو équipe de montage كاملة، تخدم en parallèle | **gfx** | grid of 6 agent windows (scène hook, étape 1…5), each with its own progress bar and live mini preview; « en parallèle » (71.91) = all bars race | riser, ticks |
| 72.60 | وأنا نقعد نتفرّج، وديما يقلّي | split | face back « watching », popcorn-ish cue | whoosh |
| 75.06 | ادخل لـ Remotion وشوف… كمّلت، تحب نعمل الـ rendu؟ | split | Claude notifications: « Odkhel l Remotion, chouf 👀 » (75.06) + a Studio-like player; « Kammelt ✓ — t7eb na3mel el rendu ? » with buttons (77.78) | notification ×2 |
| 79.71 | أنا ديما نتشيكي، وكان حاجة ما عجبتنيش نقلّو يبدّلها | split | the user's feedback chips « vibe / rythme / design / motion » (82.94 / 83.43 / 84.59 / 85.31) each flip a card variant | click, swap |
| 86.52 | étape 5: كي عجبني، نقلّو c'est bon، اعمللي rendering 60 fps | split | ✓ « c'est bon » (87.69), render settings card « 60 fps » (89.27) | check |
| 90.52 | نعطيه الـ format: 9:16 ولّا 16:9 | split | a 9:16 frame morphs into 16:9 (91.91 / 92.86) | swish |
| 93.40 | ça dépend… يستعمل الـ GPU في الـ rendering باش يكون rapide | split | GPU chip + speed meter needle (96.28) | rev |
| 98.13 | نستنّى 20 minutes، ونلقى الـ vidéo متاعي حاضرة | **gfx** | ring 20:00 → 00:00 fast (98.50), then the finished video (the user's ep 1) plays in a phone « حاضرة ✓ » (100.13) | ticking, success |
| 100.44 | ساهلة الحكاية، ما فيها حتى شي | face | « easy peasy » callback sticker | pop |
| 103.26 | bien sûr، كان تحب برشا vidéos كيما هكّا | split | a stack of many video cards fans out (105.46) | page-turn |
| 106.86 | تقلّو: اعمللي skill باللي عملتو الكل | split | SKILL.md card types itself (real skill names: aura-trailer, devops45-reel) (107.63) | typing |
| 109.24 | يعمللك skill، كل مرة تعطيه vidéo ولّا idée، وتقلّو استعمل الـ skill هاذي | split | idea → skill → video loop runs fast (111.73 / 112.75) | whoosh ×3 |
| 113.42 | direct يركّحلك جوّك. voilà | face | Claude spark + end card « @yourhandle » follow (114.43) | sting, click |

## Scenes (one owner each — built in parallel by agents)
`src/scenes/Hook.tsx` (0–9.62 + 100.44–103.26 callback + 113.42–end), `Step1.tsx` (9.62–19.86), `Step2.tsx` (19.86–39.08),
`Step3.tsx` (39.08–55.28), `Step4.tsx` (55.28–67.0 and 72.6–86.52), `Agents.tsx` (67.0–72.6, gfx), `Step5.tsx` (86.52–98.0),
`Reveal.tsx` (98.0–100.44, gfx), `Bonus.tsx` (103.26–113.42).

## Build log — v1 in Remotion (2026-10-21, not rendered: the user reviews in Studio first)
- 8 scene agents built in parallel: Hook (+ callback + end), Step1, Step2, Step3, Step4 (A+B), Agents (gfx), Step5, Reveal (gfx), Bonus.
- Hook: user's idea — the last 4 Instagram reels (19/17/~15/14 Oct, NOT the pinned one) play in a 3D coverflow while the
  user's own shot becomes the centre card (layout mode `wall`, 0.6–2.62 s).
- Music: Young Trizzy 02, from 3.0 s with the first 808 on « والصوت » (user: "start it at 3 sec"); bed at ≈ −18 dB under the voice.
- SFX: every scene's cues (≈ 330 in total), ducked to 62 % while a word is spoken (Sound.tsx). 7 doubled transition sounds
  removed at the scene boundaries (one whoosh/swipe/whip per boundary).
- Captions: Arabic letters + Latin tech words, inline bidi (« والـ motion graphics » reads right), pill at y ≈ 1508 in split.
- Open for the user: Step 2 shows 20 small frames of the analysed reference reel (DemwzTPJK6J, another creator) as the
  « reel I found » example — keep, credit it, or swap for the user's own reel.
