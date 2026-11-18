# Sources & licences

## Reference videos (style)
- The reel: https://www.instagram.com/reel/DeZ10EbNbn3/ (@itsbahahaouas). Re-download with yt-dlp.
- Masterclass intro, "edited by Claude": https://odd-grass-9a6a.justbahahaouas.workers.dev/assets/intro.mp4. Local copy: `examples/nearmatch/research/reference-intro.mp4` (reference only, not for reuse in videos).
- Course page: https://odd-grass-9a6a.justbahahaouas.workers.dev/

## Tools & docs
- Remotion: https://www.remotion.dev/docs. Scaffold with `npx create-video@latest`.
- Official skills: `npx skills add remotion-dev/skills`. Installed globally as `remotion-*` (router: `remotion-best-practices`).
- Remotion packages used:
  - @remotion/transitions, @remotion/media, @remotion/captions, @remotion/three
  - @remotion/noise, @remotion/fonts, @remotion/motion-blur, @remotion/layout-utils
  - @remotion/paths, @remotion/shapes
  - three, @react-three/fiber
- ElevenLabs (voice, alignment): MCP `claude_ai_ElevenLabs` tools. Voice "Dalida – Warm Global American" `E3mW95MIKt5YUzwjsfbi`, model eleven_v3.
- **Kie AI (all image generation):** https://kie.ai · docs https://docs.kie.ai · keys https://kie.ai/api-key
- Whisper large-v3 (word timings), ffmpeg (audio/video processing), yt-dlp (downloads), Playwright (screen capture).
- Local fallback image model (only if the user allows it): `SG161222/RealVisXL_V5.0_Lightning` + `madebyollin/sdxl-vae-fp16-fix` (Hugging Face).

## SFX (all 13 bundled files)
**Mixkit Sound Effects Free License:** commercial use, no attribution (https://mixkit.co/license/). Each file is at `https://assets.mixkit.co/active_storage/sfx/<id>/<id>.wav`; pages are at https://mixkit.co/free-sound-effects/

| id | title | category | used in |
|---|---|---|---|
| 792 | Cinematic fast raiser | cinematic | riser |
| 2161 | Air in a hit | swish | riser |
| 2627 | Fast swipe zoom | woosh | whoosh |
| 3115 | Fast transitions swoosh | transition | whip |
| 2925 | Soap bubble sound | bubbles | pop |
| 3124 | Modern technology select | technology | tap, keypad |
| 1462 | Quick swoosh | swoosh | swipe |
| 2867 | Confirmation tone | tones | match |
| 2299 | Short bass hit | bass | match (sub) |
| 871 | Fairy magic sparkle | fairy | match (tail) |
| 1063 | Fast wall clock ticking | clock | tick |
| 951 | Positive notification | notification | success |
| 1085 | Rewind magic spell | magic | dissolve |
| 882 | Thin icicles spell | magic | dissolve |
| 867 | Fairy glitter | magic | dissolve |
| 563 | Drum deep impact | cinematic | sting |
| 870 | Sparkling fairy glow | fairy | sting |
| 2585 | On or off light switch tap | click | flash |
| 3062 | Magic wand sparkle | fairy | flash |

**Remotion free SFX:** https://remotion.media/whip.wav (layered into whip.wav). Others available: whoosh, switch, mouse-click, ding, shutter-modern, page-turn (.wav).

## Music
**Mixkit Stock Music Free License:** commercial use including social and online ads, **no credit**. It does not cover TV/radio broadcast, games, or CD/DVD. File URL: `https://assets.mixkit.co/music/<id>/<id>.mp3`.

| id | track | artist | notes |
|---|---|---|---|
| 609 | Moon Walk | Eugenio Mininni | NearMatch 9:16 bed, 98 BPM, drop at 73.77 s in the source |
| 201 | Swish Swed | Arulo | tech-house ~120 BPM; best tension→release |
| 133 | Dub Techno Groove | Alejandro Magaña | ~123 BPM |
| 190 | Electro Dreams | Arulo | house ~120 BPM |
| 162 | Minimal Techno 01 | Alejandro Magaña | ~128 BPM |
| 73 | Torn Threads | Ahjay Stelino | dark drone → heavy beat, ~71 BPM |
| 1120 | Spooky Night | Michael Ramir C. | dark electronica ~100 BPM |

Browse: https://mixkit.co/free-stock-music/ — `/mood/hypnotic/`, `/mood/dark/`, `/mood/mysterious/`, `/mood/tension/`, `/techno/`, `/house/`, `/electronica/`, `/synthwave/`, `/discover/night/`

**Kevin MacLeod (incompetech.com):** CC BY 4.0, **credit required**; a paid standard licence removes the credit.
- Ethernight Club: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ethernight%20Club.mp3 (117 BPM, A minor)
- Industrial Cinematic: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Industrial%20Cinematic.mp3 (110 BPM)
- Credit text: *"Title" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/*

Pixabay music is free too, but it blocks scripted downloads (Cloudflare 403). Use it only manually.

## Fonts & icons (bundled)
- Inter (400–800) and JetBrains Mono (500/700): SIL Open Font License.
- Phosphor Icons (`T/kit/phosphor.ts`): MIT, © 2023 Phosphor Icons.

## Example production
NearMatch teaser:
- briefs: `examples/nearmatch/brief/`
- full Remotion source: `examples/nearmatch/video/src/`
- music list: `examples/nearmatch/music-candidates-16x9.md`
- the project's CLAUDE.md: `examples/nearmatch/PROJECT-CLAUDE.md`

The live project is at `/home/you/nearmatch-motion`; the final videos are in `out/`.
