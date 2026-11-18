# trailer.json and footage.json

One `trailer.json` per project drives everything: `plan.py` (timing), `build_voice.py`, `mix.py`, `deliver.sh`, and through the generated data, the Remotion project. Paths are relative to the project folder unless absolute. Keys starting with `_` are comments. The complete real example is `examples/no-more-excuses/trailer.json`.

## Frame references
Anything that names a moment (mix curves, director cues, fx) takes either a frame number or a reference:

| Write | Means |
|---|---|
| `757` | frame 757 |
| `"key:drop1"` | the named moment `drop1` from `key` |
| `"key:drop1-12"` | 12 frames before it (use `+n` for after) |
| `"key:dip[1]+4"` | the 2nd value of a list-valued key, +4 frames |
| `"t:57.9"` | trailer second 57.9 |
| `"song:58.75"` | song second 58.75 in the processed file (offset applied) |
| `"key:start"` / `"key:end"` | frame 0 / the last frame (always defined) |

Write curves with key references. Then when you move `music.offset_s` or re-time a key, the mutes, holes, letterbox and cues all follow.

## trailer.json
| Field | What |
|---|---|
| `title`, `slug` | trailer title; slug = file names (`<slug>-9x16-v1.mp4`) |
| `subject` | `name`, `handle`, `who`: for the brief and the end card |
| `language` | Whisper language for the line checks (`fr`) |
| `fps`, `duration_s` | 60, 60 |
| `music.source` | the user's original file (kept for the record) |
| `music.rate` | slow-down used by music_prep.sh (1 = none) |
| `music.file` | the processed song (music_prep.sh output); also copied to `video/public/music/` for the Studio preview |
| `music.offset_s` | the song second playing at trailer frame 0 |
| `music.beatmap`, `music.bass` | analysis files (`music/audiomap.json`, `music/bass.json`) |
| `music.credit` | artist, title, slowed or not (for the caption) |
| `music.big_hit` | `min_rise_db` (6), `min_level_db` (−12): which 808 onsets count as BIG_HITS (flashes, signature punches) |
| `voice.sources.<id>` | `audio` (the lines are cut from it), `words` (its transcript: transcribe.py JSON or a flat `[[w,s,e]]` list), `clip` (its lip-sync clip id in footage.json) |
| `voice.rms_dbfs`, `fade_in_ms`, `fade_out_ms`, `peak_max` | line levelling (−18, 8, 40, 0.89) |
| `lines[]` | `id`, `src` (a voice source id), `in`/`out` (source seconds), `at` (trailer second), `text` (exactly what is said: QA compares to it) |
| `sections[]` | `id`, `from_s`, `to_s`, `what` (agents read `what`) |
| `parts[]` | `id`, `from`, `to`: one scene agent each, spanning sections from..to |
| `key.<name>` | `{"song": s}` or `{"song": [s, s]}` (song seconds), `{"t": s}` (trailer seconds) or `{"f": n}`. Exposed as `KEY` in beats.ts |
| `fx.letterbox` | list of curves `[[ref, px], ...]`, interpolated and clamped; the max wins. Close in on drop-outs and the silence, open on the drops |
| `fx.flash_extra` | flash frames on top of the BIG_HITS (e.g. `"key:drop1"`) |
| `fx.live_until` | no flash or fringe after this (the tape stop) |
| `fx.grain` | grain opacity (0.11) |
| `mix.lowpass_hz` | `[[ref, Hz], ...]` low-pass automation of the song (20000 = open) |
| `mix.music_gain_db` | `[[ref, dB], ...]` song gain automation, before ducking |
| `mix.duck_db`, `band_dip_db`, `voice_lowpass_hz` | ducking under the voice (−20, −10, 850) |
| `mix.voice_gain_db`, `voice_highpass_hz`, `music_level` | 2.5, 80, 0.92 |
| `mix.tape_stop` | `{"at": ref, "frames": 34, "lowpass_hz": 2500}`; omit for no tape stop |
| `mix.sfx_master`, `sfx_under_voice`, `reverse_max_s` | 0.55, 0.15, 0.7 |
| `mix.sfx_dirs` | search order for cue names (`audio/sfx-pick`, `audio/sfx-kit`) |
| `mix.sfx_defaults` | override `{name: [gain, "peak"/"start"]}` per sound |
| `mix.director_cues` | `[{f: ref, sfx, gain, note}]`: structural hits (drops, tape stop) |
| `mix.limiter_db` | safety limiter ceiling (−1) |
| `deliver.desktop_dir` | where deliver.sh copies the two mp4s (a `/mnt/c/...` path) |

## footage.json
```json
{"presets": {"full": "scale=1080:1920:flags=lanczos,setsar=1", "screen": "crop=1080:860:0:940,scale=1080:-2:flags=lanczos,setsar=1"},
 "clips": [{"id": "master-v4", "kind": "master", "src": "...mp4", "start": 0, "dur": 59.9, "vf": "full",
            "matte": "...cutout.webm", "sheet_t": 20, "desc": "talking to camera, blue wall … lip-sync source of voice v4"},
           {"id": "f01", "kind": "face", "src": "source/DeFHsJoIH04.mp4", "start": 21.0, "dur": 3, "vf": "full", "desc": "glasses + grey hoodie, explaining"},
           {"id": "m01", "kind": "reel", "fps": 60, "src": "...", "start": 2.4, "dur": 2.5, "vf": "full", "desc": "..."}]}
```
- `vf` is a preset name or a raw ffmpeg filter chain.
- `fps` defaults to 30; use 60 for the user's own 60 fps renders.
- `sheet_t` is the second shown on the contact sheet.
- A lip-sync clip starts at the same source second as its voice source's audio. Then `line.srcIn` is also the clip time, which is what `<LipShot>` uses.
- Kinds used: `master`, `card` (lip-sync crops), `face`, `screen`, `episode`, `reel`.
