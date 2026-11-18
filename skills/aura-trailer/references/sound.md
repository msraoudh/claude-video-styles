# Sound: the song, the automation, ducking, SFX, mastering

## The song
- **The user supplies it.** Trending TikTok and phonk tracks are copyrighted. I can't download them from rips, and streaming sites geo-block them (Audiomack blocked ACIDO III).
  - Offer a numbered list of ideas: dark phonk, "aura" edits, slowed versions.
  - Ask the user to send the mp3; CapCut's library is the in-app fallback.
  - Always deliver `<slug>-9x16-v1-sans-musique.mp4` too: voice + SFX, mastered on its own, so they can add the licensed sound in Instagram, TikTok or CapCut.
- **Slowing:** `asetrate=<sr>*0.85,aresample=48000` lowers tempo AND pitch together, the "slowed" edit sound: heavier 808s, more menace. At 0.85 ACIDO III went to 112.3 BPM, so a beat = 32 frames at 60 fps.
- **Reading the analysis** (`music_prep.sh` output):
  - `analyze-beatgrid.py` prints BPM, the downbeat phase, key moments (drops, builds), hard stops (where everything cuts out: perfect for black frames), silences and energy phases.
  - `bass.py` lists the 808 onsets with their rise and level in dB (rise ≥ 6 and level > −12 = BIG_HITS).
  - Choose `offset_s` and the `key` moments from both (`pipeline.md` §3).
- The grid stops being tracked near the end of a song, so `plan.py` extends it at the measured period.

## Automation recipes (`trailer.json` mix), the ones that worked
Song low-pass (`lowpass_hz`), as `[ref, Hz]`:
- **Cold open "behind the wall":** 320 Hz from 0 to `bassIn-4`. The song is a far-away rumble under the hook line.
- **The wall opens:** `bassIn` 650 Hz → +3 s 1400 → +5.3 s 4500 → +6.5 s 18 kHz.
- **Drop-out under a line:** at `dropout[0]-1` the low-pass closes to 600 Hz in 14 frames, holds, goes to 400 Hz on the last frame before the drop, then opens to 20 kHz exactly on `drop1`.
- **Dip under a line:** 1100 Hz from `dip[0]-2` to `dipHit-5`, and wide open on `dipHit`.

Song gain (`music_gain_db`), as `[ref, dB]`:
- −8 dB in the cold open, then a **1-frame −40 dB mute** at `bassIn-1`, so the 808 enters on silence.
- **12-frame hole before drop 1:** −2 dB until `drop1-20`, −40 dB from `drop1-12` to `drop1-1`, 0 dB on `drop1`.
- Dip: −5 dB from `dip[0]-27` to `dipHit+1`.
- **The silence:** from `silence[0]-1` fade −4 → −24 → −30 dB, then **−60 dB for the 8 frames before `bigDrop`**: black + silence, then the biggest hit.
- **Tape stop** (`tape_stop`): from `tapeStop`, playback rate (1−t)^1.6 over 34 frames, faded, low-passed to 2.5 kHz, then silence. Add a `powerdown` director cue on it. The last line plays over the dead silence after it.

Ducking under the voice (automatic, from the voice track's activity: 25 ms attack, 260 ms release, 30 ms look-ahead):
- broadband `duck_db` −20;
- a dynamic 1–4 kHz dip of `band_dip_db` −10 on top;
- the song's low-pass glides toward `voice_lowpass_hz` 850 Hz while a word is spoken;
- SFX fall to `sfx_under_voice` 0.15.

## SFX
- **Dark set** (`assets/sfx/dark/` → project `audio/sfx-pick/`): ElevenLabs Sound Effects, 2 variants each, picked by `sfx_stats.py`. Prompts are in `scripts/sfx_prompts.json`.
  - `braam` (4.5 s), `subdrop` (start-aligned, sustained), `metalhit`, `heartbeat` (start), `reverse` (peak on the cue frame, trimmed to its last 0.7 s), `drone` (8 s bed), `glitch`, `whoosh`, `titleslam`, `titleslam-alt`, `powerdown`.
- **Kit** (`audio/sfx-kit/`): `sub-impact`, `impact`, `riser`, `metallic-riser`, `whoosh-cinematic`, `whoosh-short`, `zoom-swish`, `camera-shutter`, `ui-pop`, `ui-click`, `typing`, `keypad`, `glitch-1..3` and 30 more.
- **Alignment:** impacts, whooshes, risers and reverses land with their PEAK on the cue frame; beds, heartbeats and UI sounds land with their START (`SFX_DEF` in mix.py, or override with `mix.sfx_defaults`).
- **Cue the special moments, not every cut.** The song already hits on every beat. About 10–20 cues per part is plenty; more is mud.
- **Director cues** for the structure: `sub-impact` on each drop's low end, `powerdown` on the tape stop.
- **New mood?** Generate with ElevenLabs:
  1. Create a creative flow (`creative_create_flow`).
  2. Add one `sfx` node per sound (model `eleven_text_to_sound_v2`, the prompt and duration from sfx_prompts.json, 2 variants) and run them.
  3. Save the run status JSON, then run `get_sfx.py run.json` and `sfx_stats.py`.
  - Music is NOT generated with ElevenLabs. The user rejected that: music comes from the user, or from free stock for brand videos.

## Targets and checks (`qa_mix.py`)
- **Voice lead on spoken frames:** ≥ 10 dB over music + SFX, broadband AND 1–4 kHz. Last time the lowest lines were 10.3 / 11.8 dB.
- A **blind Whisper** pass on the mastered mix (no language, no prompt) hears every line. A tail swallowed by a hit means moving the hit after the word or ducking it.
- **Master:** −14 LUFS integrated (two-pass loudnorm), then a 4× oversampled true-peak limiter at −3 dBFS. That keeps the AAC encode at about −1 to −2 dBTP; plain loudnorm left −0.3 dBTP after AAC.
- Delivered: AAC-LC 256 kb/s 48 kHz stereo, `+faststart`, video stream copied from the render.
- You can't hear it. Say the mix is verified by these measurements, and offer the user a listen-and-tweak pass.
