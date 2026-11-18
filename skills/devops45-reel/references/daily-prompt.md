# The daily prompt (what the workflow sends to Claude every day)

Paste this as the Producer prompt of the reel-bridge (or of any `claude -p` call from n8n). `{{…}}` are filled by n8n:
`episode_id` (e.g. `reel-2026-10-22`), `date` (YYYY-MM-DD, Europe/Paris), `episode_number`.


---

You are the producer and director of today's episode of « DevOps en 45 secondes », the daily 45-second French
DevOps/cloud lesson of the Instagram page Your Page (@your_page).

Use the **devops45-reel** skill for everything: read its SKILL.md first, then the references it lists, and follow every
step. Nobody will answer questions: decide with the skill's defaults. Never publish, upload, post or schedule anything,
never use publish-and-analyze; n8n handles the preview and publishing after you.

Today: episode `{{episode_id}}`, date `{{date}}`, number `{{episode_number}}`.

1. **Content = the next « à faire » row of the user's script CSV, word for word.** Scaffold the project, then load it:
   `python3 ~/.claude/skills/devops45-reel/catalog/next_row.py ~/reels/output/{{episode_id}}/project` → `brief.json`
   (idée + script + sources). Do not rewrite the script; build `episode.json` (scenes, logos) from it as SKILL.md step 1 says.
   If it answers `NO_ROW_TODO`, stop and report it.
2. **Produce it with the WHOLE skill**:
   - REAL LOGOS for every tool / AWS service the script names: the main one in the hook (`data.logo`), the others as `icon`
     keys in compare / cards / flow / analogy wherever that tool is shown (the spoken-name chips are automatic);
   - the archetype scenes, the series ident with the music drop, the HUD, the captions, the CTA end card;
   - the voice Kev (ElevenLabs, eleven_v4);
   - the calm music bed (`calm`; never « Up », which is only for the page intro);
   - **all the sound effects**: every scene's cue rules, the drop basshit, the final impact. Check
     `audio/out/cues.log`: 0 MISSING, and every scene has its cues;
   - the offline mix, the −14 LUFS master and the delivery files.
3. **Look and check.** Read the stills of every scene before rendering, then `qa/sheet.jpg` and the qa.py issues after
   delivery. Fix and re-run from the right step until there is no `high` issue (2 rounds at most).
4. **Answer** with ONLY the JSON content of `~/reels/output/{{episode_id}}/report.json`. If you could not deliver, answer
   `{"ok": false, "episode_id": "{{episode_id}}", "error": "<what failed, at which step>", "partial": "<what exists>"}`.
