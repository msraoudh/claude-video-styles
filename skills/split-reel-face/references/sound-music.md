# Sound design + music

## Voice
`ingest.sh` masters the user's own voice to −16 LUFS (highpass 75, compressor, presence +2 dB at 3.5 kHz). The final
master (render.sh) brings the mix to −14 LUFS, true peak ≤ −1.5 dBTP.

## SFX (the user wants a lot)
Library `assets/sfx/` (copied to `public/audio/sfx/`): anime-wow bone-crack ding dissolve flash keypad loading-lag match
mouse-click page-turn pop record-scratch riser shutter-modern snapchat-notification sting success swipe switch tap tick
vine-boom whip whoosh windows-xp-error. Each scene exports `Cue[] = [{ f, sfx, vol, note, trimFrames? }]` on its visual
events: whoosh/whip on entrances and layout changes, pop on chips, tick on counters/checklists, keypad on typing,
mouse-click on clicks, ding/success on payoffs, shutter on « render », record-scratch + windows-xp-error on a « no »,
riser into a reveal, sting/vine-boom on the big hit. Volumes 0.12–0.5, trim long files.
- `Sound.tsx` ducks every SFX to 62 % while a word is spoken (from the caption timings): a cue never buries a word.
- After the agents: one transition sound per scene boundary. Two agents each add a whoosh at the same cut → delete one
  (first reel: 7 doubles found).

## Music
- Royalty-free stock only (Mixkit Stock Music Free License: social OK, no attribution, never Content ID). No AI music,
  no commercial songs. The music agent measures ~30 tracks and makes 5 previews ON the user's voice; the user picks
  by ear (you can't hear: say so).
- Start point = the user's call. First reel: they first wanted it « from the first frame », then « at 3 sec » → the
  first 808 hit placed exactly on « والصوت » (« and this sound ») at 3.03 s. Look for a word that justifies the entrance.
- `scripts/music_bed.py` builds the bed with bar-aligned splices (skip a break with no bass, loop the groove) up to the
  end + fade. Level: fixed, ≈ 18 dB under the voice (−11.7 LUFS bed → volume 0.085), like both references (no pumping).
- If the bed has a strong grid, hand the beat (BPM, first beat) to the hook agent so visuals pulse on it.
