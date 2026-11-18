# Lessons — what went wrong before (brand intro, NO MORE EXCUSES, earlier reels)

- **Voice cuts:** cutting at Whisper word ends truncated « Linux » and « monitoring ». Cut at the middle of the longest
  measured pause between two phrases (`place_voice.py` does it). Keep ~0.12 s of air before an onset and ~0.18 s after.
- **Whisper lag:** word starts run ≈ 0.17 s early on Kev; the first word of a phrase = the measured audible onset.
- **Captions** never light a word before the phrase's audible onset.
- **Final hit** right AFTER the last word, never on it (its attack masks the word).
- **TTS text:** no IPA / phonetic respellings (take B of the brand intro turned « AWS » into « à WS »).
- **Music:** the user rejected ElevenLabs music ("for music not eleven labs, search internet"). Royalty-free stock
  only, picked by the user from measured candidates; trending songs are copyrighted (never download them).
- **SFX never cover the voice:** ducked to 0.18 under words; long textures trimmed (`max_s`).
- **Rendering:** always `--gl=angle` (8 min instead of ~80; nvidia-smi shows 0 % even when ANGLE works — time a still to
  check). One render at a time through `render-safe.sh`.
- **Remotion drops symlinked files in `public/`:** copy or hard-link media (node_modules are hard-linked, fine).
- **WSL:** wsl.exe mangles `$` in inline `bash -lc "…"` → write .sh files; `MSYS_NO_PATHCONV=1` from Git Bash.
  WSL has no internet while the user's VPN is on (downloads from Windows PowerShell instead).
- **The user** hates over-eager tool calls when they only ask where something is: answer with the path.
- **Delivery:** full quality only, tell them the folder; never send compressed copies.
- **Voice lead < 8 dB after delivery (2026-10-22, ep. 3: 7.2 dB — the tool/concept animations add many SFX):** no
  re-render needed. Set `"mix": {"music_db": -11, "sfx_master": 0.45}` in episode.json (defaults −9 and 0.6;
  `voice_db` too) and re-run `deliver.sh` — ep. 3 went to 9.2 dB, no issues.
