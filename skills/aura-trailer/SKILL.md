---
name: aura-trailer
description: Make a cinematic "aura" / thriller trailer ABOUT A PERSON (the user, a creator, a friend, a team, a personal brand) — a 60 s 9:16 hype edit cut on the bass of a song the user supplies, built from their own Instagram/TikTok reels and their own voice lines, with dark motion graphics, 3D, text behind the subject, dark trailer SFX, music ducked under the voice and a mastered mix. The proven pipeline of the « NO MORE EXCUSES » trailer for @yourhandle (Remotion on WSL, scene subagents, offline mixer, GPU render). Use this skill WHENEVER the user wants a trailer / hype video / aura edit / phonk edit / "a video that represents me" about themselves or someone, edited on the beat or the bass of a song (ACIDO, phonk, a trending TikTok sound, slowed), says "like the trailer you made me", "like NO MORE EXCUSES", "the video with aura and music", "edit it on the bass", "lower the music when I speak", or asks to download/scrape their reels to make a trailer about them — even if they never say the word trailer. Not for app/product teasers with a voiceover (cinematic-motion-teaser), cleaning up one raw talking-head video (reel-pro-edit) or faceless explainers.
---

# Aura Trailer

You are the **director**. This skill is everything that made « NO MORE EXCUSES », the 60 s trailer about the user (@yourhandle), cut on the bass of ACIDO III slowed to 0.85: the user's own reels downloaded from Instagram, nine of their own French lines, four scene agents, an offline mixer that ducks the song under every word, dark SFX, a GPU render.

The finished production is the quality bar:
- the delivered video: `Desktop\reel-project\me-trailer\out\no-more-excuses-9x16-v1.mp4`
- the full project: WSL `~/me-trailer`
- its config, scenes, cues and agent brief: `examples/no-more-excuses/`

The scripts here are that project's scripts, made config-driven. Replaying the original `trailer.json` through them rebuilds the same timing plan, a bit-identical voice and mix, and the same frames.

## Read first (what's where)

| Need | File |
|---|---|
| Every command, in order, from an empty folder to the delivered mp4 | `references/pipeline.md` |
| `trailer.json` / `footage.json`: every field, the frame-reference syntax | `references/config.md` |
| The craft: the arc, choosing lines, cutting on the bass, signature moments, motion vocabulary | `references/editing.md` |
| Song prep, the automation recipes (low-pass wall, holes, dips, tape stop), ducking, SFX, mastering | `references/sound.md` |
| What went wrong last time, and how this user likes to work | `references/lessons.md` |
| The rules every scene agent reads (copied into each project as `brief/agent-common.md`) | `references/agent-brief-template.md` |

What you copy, don't rewrite:
- `scripts/` (run from the project folder in WSL as `~/.claude/skills/aura-trailer/scripts/…`):
  - `new_trailer.sh` scaffolds a project.
  - `ig_*` + `transcribe.py` handle Instagram: list the reels, download them, contact sheets, transcripts.
  - `music_prep.sh` + `bass.py` analyse the song.
  - `plan.py` builds the timing plan.
  - `vocals.sh`, `snap_cuts.py`, `find_in.py`, `build_voice.py` and `qa_lines.py` make the voice track.
  - `footage.py` cuts the shot library.
  - `get_sfx.py` + `sfx_stats.py` fetch and pick SFX.
  - `mix.py` mixes; `render.sh` and `wait_render.sh` render; `deliver.sh` masters and delivers.
  - `qa_mix.py`, `motion_qa.py`, `review.py` and `verify_delivery.py` are the QA tools.
  - Whisper scripts run through `wpy.sh`.
- `assets/remotion-template/`, the video project:
  - the Trailer and Root compositions with per-part QA compositions;
  - `Shot`, `Matte`, `LipShot`/`LipMatte` and `TrailerFX`;
  - the music-sync library `beat.ts`, the look `look.ts`, and the motion kit with its fonts;
  - a Placeholder part, so the trailer renders before any scene exists.
- `assets/sfx/dark/`: the 11 dark trailer SFX (braam, subdrop, metalhit, heartbeat, reverse, drone, glitch, whoosh, titleslam ×2, powerdown).
- `assets/sfx/kit/`: the 47-file UI and cinematic kit.
- `examples/no-more-excuses/sections/`: 3D dossier name reveal, glass-shard title, slice wall, glass-card carousel, text behind the subject, CRT end card. Read these before briefing the agents.

Also follow `remotion-best-practices`: everything frame-driven, `staticFile`, `premountFor`, `ThreeCanvas`.

## The non-negotiables (and why)

1. **The music is the clock.**
   - Every cut lands on a beat or an 808 onset from `beats.ts`.
   - Every key word ends just before the hit that follows it.
   - The arc follows the song's own drops, drop-outs and silences.
   - A trailer cut on the bass is what reads as "real editing". A cut that floats off the grid reads as amateur.
2. **The song comes from the user.** Trending TikTok and phonk tracks are copyrighted: I can't download them, and music sites geo-block them.
   - Ask for the file (or a link they download themselves). CapCut's library is the fallback.
   - Always also deliver a version without music, so they can put the licensed sound on in the app.
3. **Their own voice, always understood.**
   - The lines are cut from their reels: on measured energy valleys, with Demucs when music is under them.
   - The song ducks under every word: −20 dB broadband, a dynamic 1–4 kHz dip, and a low-pass glide toward 850 Hz.
   - SFX drop to 0.15 while they speak.
   - Target: the voice leads music + SFX by ≥ 10 dB on every line, in both bands.
   - A blind Whisper pass on the final mix must hear every line word for word.
4. **Lip-sync or nothing.** While a line plays, the only talking face on screen is that line's own source (`<LipShot>`). Other face clips appear only between lines, as 2–6 frame strobes, or slowed to ≤ 0.35 or frozen. A moving mouth that isn't saying what we hear breaks the spell instantly.
5. **Dark, cold, premium, readable.**
   - Near-black world `#03060d`, cold grades, one danger / one tech / one action accent, liquid glass.
   - Grain, vignette, letterbox and hit flashes are global (`TrailerFX`).
   - Each part has ONE signature moment. Black frames and silence are tools.
   - Use their real work as the content: their screens, their episodes, their slogans. Never invented achievements.
6. **You can't hear, so measure, and say so.**
   - Song structure: `analyze-beatgrid` + `bass.py`.
   - Cut points: loudness strips + Whisper.
   - SFX picks: spectral stats.
   - The mix: lead dB + blind transcript.
   - Motion: `motion_qa.py` + review sheets.
   - Tell the user plainly that the mix is verified by measurement.
7. **The laptop must not crash.**
   - One render at a time through `render-safe.sh` (the cinematic-motion-teaser lock), on the GPU with `--gl=angle`. The full render takes about 10 min instead of 80; patch ranges with `A=… B=… render.sh`.
   - Agents take stills only through the lock, and never render video or open the Studio.
8. **Deterministic.** Use `rand(seed)` only, never `Math.random`/`Date`, and no CSS animations. 3D is frame-driven.

## The pipeline (details and exact commands: `references/pipeline.md`)

**0. Intake.** Keep it short; this user hates question floods. Find out:
- whose trailer it is and their Instagram handle;
- which song (ask for the file);
- length (default 60 s), language (default French);
- which reels count (face reels, motion-graphics episodes, screen recordings).

Decide the rest yourself and say so. They want you to act as the expert editor and explain your decisions.

**1. Scaffold:** `new_trailer.sh ~/<slug> <slug>`.

**2. Know the person.**
1. They log in to Instagram in the browser themselves; never type credentials.
2. Collect the reel codes with `ig_codes.js` and download them with `ig_download.sh` (yt-dlp, public reels, 4 s apart).
3. Make sheets with `ig_sheets.py` and transcripts with `transcribe.py`; read them with `ig_txt.py`.
4. Write down their look, recurring formats, best-performing reels, slogans, and the lines that could carry a story.

**3. The song.**
1. Ask for the file, then run `music_prep.sh music/<song> 0.85`. Slowing is a choice; 0.85 gave ACIDO its menace.
2. Read the grid, the drops and the 808 strip.
3. Choose `music.offset_s` so that the bass enters at ~4 s, drop 1 lands at ~12–13 s, a song silence falls at ~47–51 s and a big 808 lands on the title.
4. Name those moments in `key`.

**4. The story in their own words.** Choose 6–10 lines, each 1–4 s: hook → who → the dream → the excuse → the realisation → the decision → CTA (`references/editing.md`).
1. Isolate voices with `vocals.sh` where music is under them.
2. Place each line in a drop-out, a dip or the silence, with its last key word just before a hit.
3. Snap the cuts with `snap_cuts.py` + `find_in.py`.
4. Build with `plan.py` + `build_voice.py`, then check with `qa_lines.py`.

**5. Shot library.**
1. List clips in `footage.json`, with a description of each, from the dense sheets.
2. The lip-sync masters start at the second their audio starts.
3. Make a matte of the main master for text behind them (reel-pro-edit's RVM `matte.py`).
4. Run `footage.py` and read `qa/footage-sheet.jpg`.

**6. Plan check.** Run `plan.py`. The Placeholder parts already render the grid and the lines, so check the timing in the Studio or with stills before any scene work.

**7. Scenes by subagents.**
1. Fill `brief/agent-common.md`, including one "Your part" section per agent. Four parts worked: open, hero, escalate, climax.
2. Run the agents in parallel. Each owns `src/sections/<part>/` + `src/data/cues/<part>.json` only.
3. Meanwhile you own the mix curves in `trailer.json` and the director cues.
4. Register the parts in `src/sections/index.ts`.

**8. Assemble and look.**
1. Type-check.
2. Take stills at every part boundary, line start/end and big hit; put them on contact sheets and Read them.
3. Fix whatever looks off: TrailerFX flashes over the end card, a face hidden in the cold open, a lip-sync violation.
4. Then render with `render.sh`.

**9. Sound.**
1. Run `mix.py`, then `wpy.sh qa_mix.py`.
2. Fix any line below 10 dB lead (deeper duck, shorter reverse, lower SFX gain), and trim cue overload.
3. The drop lands just AFTER the word, never on it.

**10. Deliver.**
1. `v=v1 SKIP_RENDER=1 deliver.sh` produces both versions at −14 LUFS, true peak ≤ −1 dBTP, AAC 256k, video stream copied.
2. Run `motion_qa.py` and `review.py` on the delivered file, plus `verify_delivery.py`.
3. Open the Desktop folder in Explorer.
4. Report: paths, what you decided, the measurements, and what you couldn't verify.

## Numbers that worked (60 fps, ACIDO III slowed 0.85 = 112.3 BPM, a beat = 32 frames)

**Arc (60 s):**
- cold open 0–4 s (black, drone + heartbeat, hook line alone);
- world 4–12.6 (low-passed song opening up; a drop-out carries the intro line);
- drop 1 at 12.6 (name reveal);
- escalate 30–47.6 (strobes, text behind the subject);
- song silence 47.6–51.8 (the confession lines alone);
- big 808 at 51.8 (title slam), finale 54–57.9;
- tape stop at 57.9, then the end card + the last line.

**Cut pace:** 1 cut per 2 beats in the world → 1 per beat after the drop → half-beats in the strobes. A cut is held ≥ 30 frames unless it is a strobe.

**Music automation:**
- cold open low-pass at 320 Hz;
- the wall opens 650 → 18 kHz over 6 s;
- a 1-frame mute before the bass enters, and a 12-frame hole before drop 1;
- 400–600 Hz "behind the wall" under drop-out lines;
- a dip of −5 dB and 1.1 kHz under a line;
- the silence fades to −24/−30 dB, then an 8-frame −60 dB hole before the big drop;
- the tape stop is 34 frames, rate (1−t)^1.6, darkened to 2.5 kHz, plus powerdown.

**Mix:**
- duck −20 dB plus a −10 dB 1–4 kHz dip; voice +2.5 dB; music × 0.92;
- SFX master 0.55, SFX 0.15 under the voice, reverse swells trimmed to 0.7 s;
- −1 dBFS safety limiter, then the master at −14 LUFS with a 4× oversampled true-peak limiter at −3 dBFS.

**Footage:**
- punch-in on beats +6 %, bass shake 6–14 px;
- freeze frames in mono on a camera-shutter;
- face strobes 2–6 frames;
- slow-mo ≤ 0.35 reads as "not talking".

**Type:**
- Big words: Inter 800 uppercase, −0.04 em. Labels: JetBrains Mono caps, 0.3–0.5 em tracking.
- Safe area: x 90–990, y 220–1540, and x ≤ 940 below y 1000.

## Working with this user

Full list with reasons: `references/lessons.md`.

- **They choose the song.** Give them a numbered list of ideas, then ask for the file. Never claim you downloaded a copyrighted track.
- **You are the expert editor.** Make the creative calls (lines, arc, shots, sound) and explain them; don't ask at every step.
- **Delegate scenes to subagents**, and review their stills yourself.
- **Use every skill they have:** glass-shard-title, wireframe-portal-title, code-slice-hero, cuboid-carousel, orbit-card, adaptive-glass, and their series' liquid-glass card. Port the looks into Remotion; say which you used.
- **Full quality only.** Open the out folder in Explorer, and never send compressed copies. When they just ask where something is, answer with the path and don't run tools.
- **Be honest:** say what you measured instead of heard, and report failures plainly.
