# Sound design — SFX, music, ducking, mastering

The user's rule: "for music and sounds and everything you can check the internet there are so many sites that can provide that !!! for free !". Use free, commercially usable sources; the full licence notes are in `sources.md`.

**Be honest:** you cannot hear. Rank and choose from measurements (spectrograms, loudness curves, onsets, voice-over-music ratio in the speech band) and library tags, and tell the user to trust their ears over your words.

## 1. The SFX library (ready to use)
The 13 files are in `templates/remotion-starter/public/audio/sfx/`: 48 kHz, 16-bit stereo, peaks ≤ −5.6 dBFS, each starting and ending on a zero sample.

Loudness is matched by peak 100 ms K-weighted loudness:
- UI sounds: −19
- movement sounds: −17.5
- hero sounds: −16
- sting: −15.5

"Sync" means where to line the sound up on the timeline.

| file | dur | sync | built from (Mixkit id "title" + layers) | use |
|---|---|---|---|---|
| riser.wav | 1.60 | hit @1.05 s | 792 "Cinematic fast raiser" + 2161 "Air in a hit" | frame 0 of the video (0.5) |
| whoosh.wav | 0.60 | peak @0.20 | 2627 "Fast swipe zoom" | lightStreak / cardFlyAway / blurDissolve (lead 10–12 f) |
| whip.wav | 0.40 | crack @0.08 | 3115 "Fast transitions swoosh" + remotion.media/whip.wav | whipPush (lead 8 f) |
| pop.wav | 0.20 | 0.005 | 2925 "Soap bubble sound" (first bubble) | chips, cards, bubbles, notifications, iris (0.28–0.4) |
| tap.wav | 0.12 | 0.005 | 3124 "Modern technology select" | finger taps on buttons (0.6) |
| swipe.wav | 0.45 | peak @0.10 | 1462 "Quick swoosh" | card flicked off a phone |
| match.wav | 1.40 | notes @0.02/0.21 | 2867 "Confirmation tone" + 2299 "Short bass hit" (sub) + 871 "Fairy magic sparkle" | the big emotional moment (C6→C7 + sub thump) |
| tick.wav | 0.15 | 0.005 | 1063 "Fast wall clock ticking" (one tick) | countdown ticks, checklist rows (0.4) |
| keypad.wav | 0.90 | taps @0.03/0.21/0.39/0.57 | 3124 re-pitched −13%, low-passed | typing a 4-digit code |
| success.wav | 1.20 | notes @0.05/0.17/0.29 | 951 "Positive notification" | verified / done / "You met" (0.55) |
| dissolve.wav | 1.40 | crumble @0.45 | 1085 "Rewind magic spell" + 882 "Thin icicles spell" + 867 "Fairy glitter" | something disappearing (particles) |
| sting.wav | 3.00 | boom @0.02 | 563 "Drum deep impact" (low-passed) + 870 "Sparkling fairy glow" | logo lands (0.6, ~10 f before) |
| flash.wav | 0.30 | 0.005 | 2585 "On or off light switch tap" + 3062 "Magic wand sparkle" | logo dots click / name punch-in |

- Mixkit files: `https://assets.mixkit.co/active_storage/sfx/<id>/<id>.wav`. Category pages: `https://mixkit.co/free-sound-effects/<category>/`.
- Remotion's free set: `https://remotion.media/{whoosh,whip,switch,mouse-click,ding,shutter-modern,page-turn}.wav`.
- Pixabay returns a Cloudflare 403 to scripted downloads, so skip it in automation.

**Need a new sound?**
1. Find it on Mixkit (category pages) or remotion.media.
2. Download it into its own folder.
3. Trim, fade, and resample to 48 kHz with ffmpeg.
4. Match loudness to the table above.
5. Peak ≤ −6 dBFS, zero-crossing start/end.
6. Look at the spectrogram for harsh top end; low-pass if needed.

## 2. How cues are placed (`templates/remotion-starter/src/components/SoundDesign.tsx`)
- Riser at frame 0 (0.5).
- **Transition SFX peak on the cut:** whoosh lead 12 f, whip 8 f, iris pop 2 f, dissolve whoosh 10 f.
- Each scene exports `SFX_CUES` in LOCAL frames. The director offsets them by `scene.from`.
- Typical volume 0.3–0.7. Don't stack more than ~3 sounds in one 10-frame window. UI pops at 0.28 when there are many.

## 3. Music: sourcing and choosing
**Sources** (free, commercial use OK):
- **Mixkit Stock Music** (no attribution):
  - https://mixkit.co/free-stock-music/
  - moods: `/mood/hypnotic/`, `/mood/dark/`, `/mood/mysterious/`, `/mood/tension/`
  - genres: `/techno/`, `/house/`, `/electronica/`, `/synthwave/`, `/chillout/`
  - file URL: `assets.mixkit.co/music/<id>/<id>.mp3`
- **Kevin MacLeod / incompetech** (CC BY 4.0, **credit required** or buy the standard licence): https://incompetech.com/music/royalty-free/

**Process** (what the user liked):
1. Agree the brief in words: vibe (e.g. "mysterious night electronic"), energy curve (e.g. "tension → release"), level ("more present"), and **where the release lands** (a word: NearMatch = "You met?" at 27.25 s, frame 1635).
2. An agent screens ~50 tracks by measurement:
   - BPM and key
   - energy curve
   - a lift/drop that can be placed on the release word
   - how clear the voice stays in the 1–4 kHz band
3. Cut a **(video length + 1 s) bed per candidate** so its drop lands exactly on the release word:
   - `DUR=<video s> scripts/audio/make_bed.sh <track.mp3> <start_s> <out.wav>`
   - Find the start with `windows.py` / `refine.py`; set env `LIFT_T` = the release word's time in seconds and `CUT_END` = the end-card cut.
   - All audio scripts honour `DUR`.
   - Processing: HP 30 Hz, −3 dB at 2.6 kHz (a pocket for the voice), 0.8 s fade-in, 2.5 s fade-out, −16 LUFS, limiter if TP > −1.5.
4. Render the **stem**: the video with `--props='{"noMusic":true}'` (voice + SFX only). Prove it has no music bleed (`check_stem.py`).
5. Make preview mixes per candidate (`scripts/audio/mix.sh <bed> <vo.wav> <stem.wav> <out.m4a>`), muxed onto the finished picture, numbered `01-…` to `08-…`.
6. Write `LIST.md`:
   - the ranking (top 3 + why)
   - per track: page/file URL, licence + credit text, BPM/key, a plain-words description, what happens on the timeline, voice clearance in dB
7. Open the folder. **Let the user choose** and say "replace" or "on top".

Example list: `examples/nearmatch/music-candidates-16x9.md`. NearMatch beds:
- 9:16 used Mixkit 609 "Moon Walk" (Eugenio Mininni, 98 BPM), offset 19 frames so its drop (26.94 s in the bed) lands on "You met?".
- The 16:9 candidates were:
  1. Swish Swed (Arulo, Mixkit 201) — recommended
  2. Ethernight Club (MacLeod, CC BY)
  3. Industrial Cinematic (MacLeod, CC BY)
  4. Dub Techno Groove (Mixkit 133)
  5. Electro Dreams (190)
  6. Minimal Techno 01 (162)
  7. Torn Threads (73)
  8. Spooky Night (1120)

## 4. Mix levels (Remotion volume callbacks)
- The bed ducks smoothly with a 10-frame ramp, based on distance to the nearest spoken word (pad 8 f before / 14 f after).
- Calm: **0.17 under the voice / 0.36 between lines**. "More present": **0.33 / 0.67**.
- Tail guard: fade over the last 0.8 s.
- **Per-format music:** keep `MUSIC.portrait` and `MUSIC.landscape` separate, so changing one format's bed can never change an approved one.

## 5. Mastering (every final)
Run `scripts/audio/master.sh raw.mp4 final.mp4`:
- `-c:v copy` (picture untouched)
- two-pass linear loudnorm to I = −14 LUFS, TP = −2
- 48 kHz, then `alimiter=limit=0.7`
- AAC 320k

Why: the summed VO + SFX + music reaches 0 dBTP on transients. NearMatch 9:16 came out at −15.9 LUFS / −3.0 dBTP. **Check that the true peak is ≤ −1.5 dBTP** before delivering. Keep the raw file next to the master (`*-raw.mp4`).
