# Running for n8n — the « Daily DevOps Reel Factory · Opus 5.5 » workflow

n8n (Docker) calls a local **reel-bridge** on `http://host.docker.internal:8788` (WSL) with three job profiles:
Showrunner (brief) → **Producer (this skill)** → QA director. The bridge runs Claude Code headless in WSL and serves the
episode's files at `/files/<episode_id>/<name>` from `~/reels/output/<episode_id>/`.

## What the Producer receives (vars from n8n « Build Producer Request »)
- `episode_id` (e.g. `reel-2026-10-22`, or `reel-2026-10-22-t1530` for test runs)
- `series_name` (« DevOps en 45 secondes »), `voice_mode` (`elevenlabs`), `engine_preference` (`auto` → Remotion),
  `duration_target_s` (45)
- `brief` — the Showrunner's JSON as a string: `episode {topic, format, …}`, `script {hook, voiceover_clean, voiceover_tts}`,
  `scenes[5–10]` (the Showrunner's scene plan: use it to choose archetypes and data; its wording may not be in
  archetype form — you translate it), `facts[≥2]` (the only numbers you may show), `caption {text}`, `cover {offset_ms}`.

The prompt to use is `references/daily-prompt.md`. Add `episode_number` and `date` from « Plan Today » to the Producer
request vars; the current « Build Producer Request » node doesn't pass them.

## What the Producer does
Exactly the SKILL.md pipeline, without asking anything (nobody is there to answer): scaffold with the episode_id,
save `brief.json`, write `episode.json`, voice, prep, stills (look at them), render, deliver. Decide sensible defaults.
Never publish; never touch Instagram, S3 or Telegram — n8n does that after QA.

## The syllabus (the user's choice, 2026-10-21)
Topics come from `catalog/plan.json` (90 in learning order; episode n = `Plan Today`'s `episode_number`, same start
date 2026-10-21). Claude writes each day's script with `references/writing.md`. Whoever writes (Showrunner or
Producer) uses entry n's topic and segment instead of inventing one; the Showrunner's prompt should say so.

## What n8n checks (« Parse Production »)
- The answer text contains ONE JSON object with `ok: true` (else the run fails with `error` / `partial`).
- The bridge's file list has `final.mp4` ≥ 200 KB and ≤ 48 MB.
- `duration_s` between 38 and 52.
- It stores `engine` and `skills_used` in the reel_episodes table.

## The final answer (headless) = report.json
Print exactly the content of `~/reels/output/<episode_id>/report.json` (written by `qa.py`), nothing else:
```json
{"ok": true, "episode_id": "reel-2026-10-22", "topic": "…", "duration_s": 45.6, "engine": "remotion",
 "skills_used": ["devops45-reel", "remotion-best-practices"], "deliverable": "/home/you/reels/output/…/final.mp4",
 "files": ["final.mp4", "cover.jpg", "captions.srt", "caption.txt", "alt_text.txt", "mix.wav", "voice.wav", "music.wav", "sfx.wav"],
 "format": {…}, "voice": {…}, "music": {…}, "scenes": ["s1:hook", "title:title", …], "issues": [], "qa_sheet": "…", "published": false}
```
On failure: `{"ok": false, "episode_id": "…", "error": "<one line: what failed, at which step>", "partial": "<what exists>"}`.

## Time budget
TTS ≈ 1 min, align ≈ 1 min, prep < 1 min, stills ≈ 3 min, render ≈ 8 min (GPU), deliver + QA ≈ 2 min → ~20 min.
Set the bridge's producer timeout to ≥ 45 min. Renders are serialised by `/tmp/remotion-render.lock`: never start two.

## Status (2026-10-21)
The workflow exists and is inactive. The reel-bridge on :8788 is NOT built yet (only the older claude-bridge on :8787,
used by the freelance agent, which answers Telegram prompts). The bridge must: accept `POST /jobs {profile, episode_id,
vars}`, run `claude -p` in WSL with a per-profile prompt (the producer prompt tells Claude to use the devops45-reel skill
and lists the vars), return `{job_id}`; `GET /jobs/<id>` → `{status: queued|running|done|error, result, error, files:[{name, bytes}]}`;
`GET /files/<id>/<name>` → the file; Bearer token auth; one producer job at a time.
