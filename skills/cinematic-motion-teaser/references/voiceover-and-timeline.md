# Script, voiceover and the master clock

## 1. Script
- A 45 s teaser takes ~110–120 spoken words, plus ~3.5–8 s of end card after the last word.
- **One VO line = one scene.** Short, present tense, second person. Each line is one idea.
- Arc:
  1. hook (the old way / a bold claim)
  2. reveal (the product name)
  3. 3–5 "how it works" lines, each a visible action
  4. emotional peak
  5. stakes / contrast line
  6. end card (name + headline + signature)
- **The release line** (where the music drops) is the emotional peak. NearMatch: "You met?".
- Use ellipses/commas for breathing room ("Match… and the clock starts.").
- NearMatch script (approved):
  > "Other apps keep you on your phone. NearMatch gets you off it. Check in where you are — a bar, a café, a gym. See who's here, right now, in the same place as you. Match… and the clock starts. No extensions, no snooze. Find each other — and swap the code, face to face. You met? The chat is yours to keep. Miss it… and it's gone. NearMatch. Meet someone. Tonight. Right here. Be here now."

## 2. Voice
- ElevenLabs via the MCP tools: `creative_list_voices`, then `creative_generate_speech`.
  - Pick a voice from the list; never invent a `voice_id`.
  - NearMatch used **"Dalida – Warm Global American"** (voice_id `E3mW95MIKt5YUzwjsfbi`, model eleven_v3).
  - Make 2 takes (A/B) and choose by delivery. Take A won.
- Generation spends credits. Never re-call to "retry". The credits ran out on 2026-10-13. The MCP has no balance call, so before generating, ask the user to check their ElevenLabs usage page (or to top up).
- **No credits?** Offer, in order:
  1. the user records the VO themselves (phone mic, quiet room); we clean it with ffmpeg (`highpass=80,afftdn,loudnorm`)
  2. a local open TTS such as Kokoro or Piper (free, lower quality; ask first)
  3. no VO, with on-screen kinetic type carrying the script; the timeline is built with `--script`
  Never silently ship a robotic voice.
- Save as `audio/vo-a.mp3/.wav` (48 kHz) in the project.

## 3. Word timings
- Get word-level timestamps from ElevenLabs alignment (`creative_transcribe_audio`) or Whisper (`large-v3`, `word_timestamps=True`).
- Format: `[{"w":"Other","s":0.0,"e":0.26}, …]`, saved as `audio/vo-a.words.json`.
- Check the words against the script and fix ASR spellings at display time (`captions.config.ts` `DISPLAY`).

## 4. Re-pace (air = premium)
TTS reads too evenly. Add a lead-in and a pause before every scene line, so each cut and transition lands in silence and the visuals get time to breathe:

```bash
# gaps.json: {"<word index>": extra seconds BEFORE that word}, e.g. scene starts + the logo line
python3 scripts/vo_repace.py audio/vo-a.wav audio/vo-a.words.json gaps.json \
  video/public/audio/vo.wav audio/vo-placed.json --lead 0.6
```

NearMatch: the raw take was about 38 s; the placed VO is 41.94 s inside 45.0 s. The first word is at 0.605 s, and there is ~1.5 s before the logo line.

## 5. Master clock
```bash
python3 scripts/vo_to_timeline.py --words audio/vo-placed.json --scenes video/src/data/scenes.json \
  --out-dir video/src/data --total-seconds 45 --fps 60
```
- `scenes.json` lists `{id, firstWord, transition, frames}` per scene. An optional `cut` overrides the auto cut after you've watched it.
- Output: `timeline.ts` and `captions.json` (@remotion/captions shape).
  - `timeline.ts` exports `WORDS`, `SCENES`, `scene()`, `wordAt(sceneId,i)` and `wordEnd()`.
- Scenes use `wordAt("<id>", i)` for every beat; never hard-code frames that come from the voice.
- Before the VO exists, use `--script "…" --wps 2.6` to get estimated timings so building can start. Re-run with the real words later and every beat moves with it.
- The cut sits at the midpoint of the silence between lines. Each transition is centred on its cut, so a scene's Sequence starts frames/2 before the cut.
- Verified: the script reproduces NearMatch's word frames exactly. Its auto cuts were within ±12 frames of the hand-tuned ones.
