---
name: devops45-reel
description: Produce one episode of « DevOps en 45 secondes », the daily faceless 45 s French DevOps / cloud lesson Reel of the Instagram page Your Page (@your_page), in the exact look and sound of the approved brand intro — teal & orange glass, the 00:45 ring timer, the series ident, real tool & AWS logos, word-synced captions, the ElevenLabs voice Kev, a calm music bed, the brand SFX and the offline mix, rendered in Remotion on WSL. Each episode is a brief (topic, French script, scenes) turned into ready-made scene archetypes (tool, terminal, code, steps, cards, compare, myth, analogy, flow, stat, incident) filled with that day's data, every tool animated doing its job (Docker packing the app into a container, Kubernetes running the boxes…), built with parallel subagents. Use this skill WHENEVER a DevOps / cloud / Linux / AWS / Kubernetes / monitoring / CI-CD / Terraform / security lesson reel or short is requested for this page or series, when the n8n « Daily DevOps Reel Factory » Producer runs (profile producer, a Showrunner brief JSON), or the user says "make today's episode", "same style as the DevOps reel", "reel factory", "épisode du jour", "DevOps en 45 secondes" — even if they don't name the skill. Not for the aura trailer about the user (aura-trailer), raw talking-head edits (reel-pro-edit) or product teasers (cinematic-motion-teaser).
---

# DevOps en 45 secondes — one episode

You are the **producer/director** of one episode. The series look was set by the brand intro the user approved
(`~/reels/output/brand-intro/final.mp4`, source in `~/reels/output/brand-intro/project/`). Every episode must look and
sound like it: same palette, ident, HUD, captions, CTA, voice, music, SFX, mix and loudness. Only the topic, the words
and the data inside the archetypes change. Consistency is the product: a viewer must recognise the series in 1 s.

All paths below are in WSL. The skill lives at `~/.claude/skills/devops45-reel` (a symlink to
`C:\Users\YOU\.claude\skills\devops45-reel`). Scripts: `SK=~/.claude/skills/devops45-reel/scripts`,
Python `PY=~/.venvs/audio/bin/python`. From Windows: write a .sh file and run `MSYS_NO_PATHCONV=1 wsl.exe bash file.sh`
(wsl.exe mangles `$` in inline `bash -lc "…"`).

## Read first

| Need | File |
|---|---|
| Write `episode.json` from a brief (fields, rules, examples) | `references/episode-schema.md` |
| Every archetype: what it shows, its data fields, limits, sound | `references/archetypes.md` |
| Brand, layout, voice, music, mix numbers | `references/brand-and-sound.md` |
| Running headless for n8n (Producer contract, report JSON, failures) | `references/n8n-producer.md` |
| The exact prompt the workflow sends every day | `references/daily-prompt.md` |
| What went wrong before and must not again | `references/lessons.md` |
| A full valid episode with every archetype | `assets/fixture/episode.json` |
| How to write today's episode (audience, segments, script, geste, truth) | `references/writing.md` |
| The reel scripts, in the user's order (one row per reel, statut à faire / dans Studio / fait) | Desktop `reel-project\devops45-catalog.csv` (`catalog/next_row.py`; sources in `catalog/sources.json`) |

## Non-negotiables (and why)

1. **Never publish, upload, post or schedule anything.** The skill delivers files into `~/reels/output/<episode_id>/`; n8n
   sends the preview to the user on Telegram and publishing is n8n's decision (`auto_publish`). Never use
   `publish-and-analyze`. The user's standing rule.
2. **The voice is the master clock.** Every visual beat lands on its spoken word (`on` fields). The voice is placed by
   `place_voice.py` at the take's real pauses — never at Whisper word ends (they truncate words).
3. **Archetypes first, custom last.** Use the archetype components as they are and put the creativity into the data
   (short punchy on-screen text, the right `on` words, the right archetype per idea). A custom scene only when no archetype
   can show the idea, built from the kit with `lib/look.ts`. This is what keeps 365 episodes consistent and reliable.
4. **Series grammar is fixed:** hook (2.5–5 s) → series ident on the music drop (1.15 s silence) → 4–7 body scenes →
   CTA end card with the final hit right AFTER the last word. Duration 40–50 s (n8n rejects < 38 or > 52).
5. **Concepts first, one simple « geste du jour ».** The audience is mostly career switchers: explain what a thing is,
   why it exists, what a tool is for — no flag lists. Each episode keeps the intro's promise with ONE easy thing to try
   (a short command, a console click, an action) — `references/writing.md`.
6. **True and sourced.** Never invent numbers, flags or output; only numbers in `facts` (with sources) appear. Shown
   output must be realistic for that command. If something in the brief looks wrong, fix it and say so in the report.
7. **The music is always royalty-free and user-approved.** Episodes use the CALM bed `assets/music/calm/` (no drop,
   steady under the voice). « Up » (Mixkit 549, the big drop) is ONLY for the brand intro — never in an episode. No AI music,
   no commercial songs, no ElevenLabs music (the user rejected it). SFX come only from `assets/sfx/`.
8. **Use the WHOLE skill, every episode** (the user's explicit rule): the archetype scenes, the series ident with the
   music drop, the HUD, captions, the CTA end card, the voice Kev, the calm bed, the real logos, **all the sound effects** (every
   scene's cue rules from `cues.py` + the director's drop basshit and final impact; a custom scene writes its own
   `video/src/data/cues/<id>.json`), the offline mix, the master and the QA. `qa.py` fails an episode whose SFX stem is
   silent or whose cues are missing, and flags any scene without a cue. Never skip a step to save time.
9. **The PC must not crash:** renders/stills only through `render-safe.sh` (one at a time, RAM floor), always `--gl=angle`.
10. **Look at what you ship.** Stills of every scene before the render, the QA contact sheet after. You can't hear: trust
   `qa.py` measurements (voice lead, blind transcript) and say so.
11. **Every tool is ANIMATED doing its job** (the user's direction 2026-10-22: « when mentioning git, docker, k8s… animate
   it, from the left or the right, full motion graphics, to be attractive »). A scene that says what a tool does uses the
   `tool` archetype: the tool's own mini motion graphic from `video/src/toolfx/` (Docker packs the app into a container,
   Kubernetes' wheel runs the boxes and replaces a crashed one, Git stacks versions on a timeline, the CI robot builds and
   tests on a conveyor, Terraform's blueprint materialises servers, Prometheus streams metrics, Grafana draws the
   dashboard…) flying in from the side on its spoken word. Tools named in the hook fly in around the tile automatically;
   spoken tool names elsewhere pop a flying logo chip; every logo spins in with a glint. A tool with no animation yet →
   build one first (contract `src/toolfx/types.ts`, brief `references/toolfx-brief.md`), register it in `toolfx/index.ts`.
12. **Always multi-agent** (the user's rule): fan the work out to parallel subagents — one per new tool animation or
   custom scene, and a reviewer for the stills sheet — while you direct (script → scenes, voice, mix, QA). Each agent
   owns its own files; renders/stills still go one at a time through `render-safe.sh`.
13. **The cover is the episode's own title + the logos of its tools** (no « DevOps en 45 secondes » lockup — the user
   dropped it 2026-10-22). `archetypes/Cover.tsx` builds it from the title and the scenes' logos.

## Pipeline

**0. Scaffold** — `bash $SK/new_episode.sh <episode_id> [brief.json]` → `P=~/reels/output/<episode_id>/project`.
Save the brief as `$P/brief.json` if it came inline (n8n passes it as a JSON string).

**1. Today's script = the next row of the user's CSV** (since 2026-10-22). The user keeps ONE file of reel scripts:
`Desktop\reel-project\devops45-catalog.csv` (WSL `/mnt/c/Users/YOU/Desktop/reel-project/devops45-catalog.csv`),
columns `n ; idée ; script ; skill ; statut` — only the idea and the script, nothing else. The order is the user's
(bases → one reel per tool → cloud → networking → rotating formats: mot du jour, panne célèbre, mythe, X contre Y, carrière).
When they hand you the CSV (« make the next one »), take the first row whose statut is « à faire »:
`python3 $SK/../catalog/next_row.py $P` (or `--row <n> $P`) → `$P/brief.json` (number, idée, script, sourced facts).
The script is the user's: do NOT rewrite a word. Your job is the video. Write `$P/episode.json` with
`references/episode-schema.md`: meta, `title`, `voice.tts` = the script with `[confident]` at the start, `[pause]` before
« Ton geste du jour » and `[warmly]` before the CTA, and `scenes[]` = `{id, type, say, data}` where `say` is the EXACT text
covered by that scene (all `say` joined = the script) and `data` fills the archetype, with real logos (`icon: "<key>"`,
hook `data.logo`) wherever a tool or AWS service is named. First scene `hook`, last `cta`. `facts` = the brief's facts.
Once the video is built and open in Studio: `python3 $SK/../catalog/next_row.py --mark <n> studio` (writes
`devops45-reel` in `skill`, « dans Studio » in `statut`). After the user says render and the files are delivered:
`--mark <n> fait`. Never render before that « render ». (`CSV_LOCKED` = the file is open in Excel: ask them to close it.)
The old jargon-first catalog (rejected by the user) is archived in `catalog/v1-ancien/`; it is not a source of scripts.
Validate: `$PY $SK/plan_episode.py $P --check` (exit 1 lists the problems — fix them).

**2. Visual draft (optional but fast)** — `$PY $SK/place_voice.py $P --synthetic && bash $SK/prep.sh $P` then stills
(step 5) to check data/layout before spending TTS credits.

**3. Voice** — ElevenLabs, voice Kev `<YOUR_ELEVENLABS_VOICE_ID>`, model `eleven_v4`, French, text = `voice.tts`.
- API key present → `$PY $SK/tts.py $P` → `audio/voice/take-raw.mp3`.
- No key (`NO_KEY`) → use the ElevenLabs connector tools if this session has them (speech generation with that voice id
  and model), download the result to `$P/audio/voice/take-raw.mp3`.
- Neither → stop and report `{"ok": false, "error": "no ElevenLabs access"}` — never ship another voice (Chatterbox and
  stock French voices sound English-accented: rejected).
Make **2 takes** (one often mangles a word) and keep the one Whisper hears best:
`bash $SK/wpy.sh $SK/pick_take.py $P take-1.mp3 take-2.mp3` (it writes take.mp3 + word timings; with a single take,
`bash $SK/wpy.sh $SK/align.py $P` does the same). Then `$PY $SK/place_voice.py $P`. WSL has no internet while the
user's VPN is on: download the takes from Windows (PowerShell `Invoke-WebRequest`) into a folder WSL can read.
If it warns the episode is too long, set `voice.atempo` (≤ 1.10) in episode.json and re-run align + place_voice; if
still too long, shorten the script (tell the Showrunner's brief what you cut in the report).

**4. Plan + mix** — `bash $SK/prep.sh $P` (scene ranges → music drop on the ident → SFX cues → mix → tsc).

**5. Look** — stills of every scene at its key beats:
`$P/video/stills.sh Part-<sceneId> <frame> …` (global frames; ranges in `$P/plan/scenes.json`) → `$P/qa/stills/`.
Tile them (`ffmpeg … -vf tile=`) and READ the sheet. Fix data (shorter text, better `on` words, another archetype),
re-run `prep.sh`, repeat. Check: nothing under the captions band (y 1300–1540) in captioned scenes, nothing in the
right 140 px below y 1000, text readable, no placeholder (« MISSING ARCHETYPE »).

**6. Render** — `bash $SK/render.sh $P` (≈ 8 min on the GPU; run it in the background and wait, don't poll fast).

**7. Deliver + QA** — `bash $SK/deliver.sh $P` → `~/reels/output/<episode_id>/`: `final.mp4` (≤ 44 MB), `cover.jpg`,
`captions.srt`, `caption.txt`, `alt_text.txt`, stems, `report.json`; `qa.py` runs inside and writes the issues.
READ `$P/qa/sheet.jpg`. A `high` issue = fix and re-run from the right step (max 2 rounds), else report `ok: false`.

**8. Answer** — interactive: tell the user where the files are (Windows: `\\wsl.localhost\Ubuntu\home\mesaid\reels\output\<id>\`),
what you decided and why, and what QA can't verify (you can't hear). Headless (n8n): print ONLY the report JSON
(see `references/n8n-producer.md`).

## Numbers that make it the series

- 1080×1920, 60 fps, H.264 CRF 18 (stream-copied into the final), AAC-LC 256k 48 kHz, −14 LUFS, true peak ≤ −1 dBTP.
- Voice at −17 dB voiced RMS per phrase, +1 dB in the mix; music ducked −16 dB × sidechain + 1–4 kHz carve −12 dB;
  SFX × 0.6, ducked to 0.18 under words. Voice lead target ≥ 10 dB (QA fails < 8).
- Timeline: hook starts 0.20 s · ident gap 1.15 s (drop on its first frame, 0.25 s music hole before) · pauses 0.20–0.45 s
  inside a scene, 0.30–0.60 s between scenes · final hit +0.03 s after the last word · 1.1 s tail.
- Script 105–120 words ≈ 45 s with Kev. Cuts land 8 frames before the scene's first word.

## Working with this user

- They want pro results and decisions made for them; explain each decision in a line. Short answers, no question floods.
- When they only ask where something is, answer with the path. Don't run tools.
- Full-quality files only; tell them the folder.
- French on screen with real accents and French spacing; tech terms stay in English (« un pod », « le state Terraform »).
