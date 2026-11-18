# Sound: voice master, music bed, SFX, master

All offline in Python (`scripts/audiolib.py`: BS.1770 metering, true peak; ffmpeg ebur128 as referee). The reel
plays one file, `public/audio/mix-v3.wav` (`Sound.tsx` `MIX_FILE`); Studio shows the same mix as the render.

## Voice (`scripts/master_voice.py`)
His phone-mic voice was boxy (400–500 Hz hump), with a harsh 8 kHz capsule peak and nothing above 12 kHz.
v2 (cut 320 Hz, +2.5 dB at 3.2 kHz, fast 3:1 compression) sounded thin, « phone »: **rejected**. v3, approved:
1. high-pass 70 Hz (his f0 median ≈ 123 Hz stays untouched);
2. **DeepFilterNet 3**, attenuation capped at 12 dB (room stays natural; it changes the speech by only −28.7 dB,
   no musical noise, **no delay**). ffmpeg `afftdn` delays by 25 ms → the voice was 25 ms late in v2: if you use
   it, re-align (cross-correlation);
3. light split-band de-ess (2:1, max 3 dB; a 4:1 slope only for mouth clicks);
4. EQ: low shelf +2.5 dB @150 Hz, +1 dB @220 Hz, −1.5 dB @450 Hz, +1 dB @3 kHz, −1.5 dB @8 kHz, no air shelf;
5. compressor 2:1, soft knee 8 dB, attack 12 ms, release 150 ms (~1.9 dB average);
6. limiter −0.5 dBFS on the stem → −16 LUFS stem.
Measure before choosing: per-band levels, noise floor, tilt (the script prints them). Whisper CER is a sanity check
only (large-v3 is weak on Derja: compare versions, not absolute values). `ab_clips.py` = equal-loudness A/B clips.

## Music (`scripts/mix.py`)
**He chooses the track.** Analyse it (BPM, bars, phrase hits, the drop) and arrange on bar lines:
- music from the first frame (no fade-in), +4 dB until the voice starts, settling in 0.4 s;
- bed **≈ 13 LU under the voice while he talks** (measured after the duck; 22 LU was inaudible on phones),
  duck 3.5 dB (attack 15 ms, release 300 ms);
- EQ: −3 dB @2.8 kHz (his presence band), −1.5 dB @250 Hz (room for his body), +2 dB shelf @10 kHz (air the
  phone voice lacks: the music shines there without masking). Bass-heavy tracks vanish on phone speakers: check
  the music/voice ratio with everything under 250 Hz removed;
- fade out (equal power) ~1.6 s before the climax line, silence during it, back on the exact frame after it on the
  track's drop + an impact hit; 1.5 s fade at the end.

## SFX
Free files only (Mixkit, Pixabay, the kit in `public/audio/sfx/`), **never ElevenLabs, never a « glass » sound**.
Placed per cue in `cues.tsx` with `S(name, frame, vol)`; `mix.py` re-dumps them on every run, scales by the cue
volume and **caps each one ≥ 8 LU under the voice** around it (it reports « capped » ones). ~130 events in a
1:49 reel is fine at these levels. Quiet ticks on list items, pops on reveals, whooshes on moves and transitions,
one or two hits (hook reveal, climax return).

## Master
Mix → −14 LUFS integrated, true peak ≤ −1 dBTP, LRA ~3 LU. The render script re-measures and applies plain gain +
limiter only if needed. Re-run `python -I scripts/mix.py` after ANY cue change, before every preview.
