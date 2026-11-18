# episode.json — what the producer writes from the Showrunner brief

One file per episode at `~/reels/output/<episode_id>/project/episode.json`. Everything the video needs comes from it;
the scripts generate the Remotion data (`video/src/data/{voice,episode,beats}.ts`) from it. Full example with every
archetype: `assets/fixture/episode.json` (a dev fixture — too long for a real episode).

```json
{
 "id": "reel-2026-10-22",                 // = n8n episode_id = the output folder name
 "number": 2,                             // episode number (n8n Plan Today → episode_number)
 "series": "DevOps en 45 secondes",
 "category": "AWS et cloud",              // n8n category
 "format": "Comparatif A vs B ...",       // n8n format_hint / brief.episode.format
 "topic": "Security group ou NACL ?",     // brief.episode.topic
 "title": { "kicker": "AWS", "line": "Security group ou NACL ?", "command": "aws ec2 describe-security-groups" },
 "voice": { "tts": "<brief.script.voiceover_tts>", "voice_id": "<YOUR_ELEVENLABS_VOICE_ID>", "model": "eleven_v4", "atempo": 1.0 },
 "music": { "track": "up" },
 "scenes": [ { "id": "s1", "type": "hook", "say": "…", "data": { … } }, …, { "id": "s7", "type": "cta", "say": "…", "data": {} } ],
 "caption": "<brief.caption.text>",
 "timing": { }                            // optional overrides of place_voice.py (title_gap_s, gap_max_s, max_s…)
}
```
(JSON has no comments — they are here for explanation only.)

## Rules

- **`say` is sacred.** Each scene's `say` is the exact consecutive text of `voiceover_clean` it covers; all `say` joined
  with spaces = the clean script, same words, same order (punctuation may differ). `place_voice.py` matches the take
  against it (it fails under 75 % match). One `say` = one or more whole sentences.
- **`voice.tts`** = the brief's `voiceover_tts` (it may carry ElevenLabs audio tags like `[confident]`, `[pause]`) — it must
  say the same words as the scenes' `say`. If the brief has no tts text, omit it (the clean script is used).
  Never put IPA or phonetic respellings in it (they broke « AWS » into « à WS » on the brand intro). Write acronyms as
  they should be heard only if Kev misreads them (« kube-control » no; « kubectl » is fine).
- **Scene count:** hook + 4–7 body scenes + cta. Body scenes of 4–8 s each; one idea per scene. The series ident
  (`title`) is inserted automatically after the hook — don't add it.
- **The hook** (first sentence(s), ≤ 4 s spoken) is the brief's `script.hook`: a claim, a problem or a surprising fact,
  never « Bonjour » or « Dans cette vidéo ». Its `data.line` is the on-screen version, shorter than the spoken one.
- **The CTA** (last scene) says the series line, e.g. « Abonne-toi à Your Page. Une leçon par jour. »
  — keep it ≤ 12 words; when n8n `course_cta` = yes the brief may add a course mention: keep it in `say`, the end card
  stays the same.
- **On-screen text is short.** Labels ≤ 20 chars, lines ≤ 40, never full sentences of the voice-over (captions already
  show the words). The screen shows the THING: the command, the config line, the number, the diagram.
- **`on` words** — every item with a visual beat gets `on`: a word (or its first letters) spoken in THAT scene, in order.
  Pick the noun that names the item (« tcp », « pare-feu », « chiffrée »). Matching ignores accents/case and
  matches a prefix: « ecoute » finds « l'écoute ». If unsure, leave `on` out: items then spread over the speech.
- **Commands and output must be real.** Exact syntax, realistic output columns and values for that tool. Prefer
  read-only / safe commands for « à copier » (no `rm -rf`, no `--force` on prod, no secrets in the command).
- **Mapping the n8n formats:**
  - Concept + analogy → `hook` · `analogy` · `flow` or `cards` · `terminal` · `cta`
  - Commande du jour → `hook` · `terminal` (big) · `cards` (flags) · `steps` or `myth` · `cta`
  - Erreur / mythe → `hook` · `myth` · `terminal` or `code` (the right way) · `steps` · `cta`
  - Avant / Après → `hook` · `compare` (before_after) · `code` (fix) · `terminal` · `cta`
  - A vs B → `hook` · `compare` (vs) · `cards` or `flow` · verdict in `compare` · `terminal` · `cta`
  - Mini-incident → `hook` · `incident` · `flow` (what broke) · `terminal` (detect) · `steps` (prevent) · `cta`
  `stat` fits anywhere a number carries the point (only sourced numbers from the brief's `facts`).

Validate after writing: `~/.venvs/audio/bin/python ~/.claude/skills/devops45-reel/scripts/plan_episode.py <project> --check`.
