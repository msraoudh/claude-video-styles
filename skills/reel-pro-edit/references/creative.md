# Creative direction

## Who this is for
the user: tech / cloud / AI creator, talking-head reels in French (sometimes English/Tunisian), vertical 1080×1920, handheld phone or 4K camera, a USB mic in hand, blue wall + orange gaming chair, often a black tank top. Reads his script from a screen at the top-left. Style reference: @itsbahahaouas "edited by Claude" reels (analysis in WSL `~/nearmatch-motion/research/REFERENCE-ANALYSIS.md`; that folder also has a Remotion UI kit, Mixkit SFX and music candidates).

## What he asked for (and confirmed)
- **Zero pauses, retakes removed, stutters removed** even mid-phrase.
- **No visible script reading.** Any glance at the screen is cut or patched.
- **Blur the armpit** whenever an arm goes up.
- **Pro motion graphics tied to the words.** Text behind him, 3D, SFX on the words, music with a drop.
- **Cinematic but SUBTLE.** He found the full grade with colored light leaks "too much". Keep strength 0.5 and no leaks.
- **Decide yourself, then explain every decision.** Don't ask at each step. The script's [bracket] directions are only loose ideas.

## The beat sheet (write it before any code)
For each line of the final cut, write: time · line · what the viewer sees · camera · SFX. Rules of thumb:
- **Hook (0–3 s):** snap zoom, one bold behind-the-head word, a small UI card with a payoff on the key word.
- **One visual idea per line, landing ON the word.** Cues go on the word's start; card entrances start 3–6 frames before.
- **Mirror the story arc in everything:** problem = colder, flatter, muffled music, slow push-ins; turning point = light, build, riser; drop = the loudest visual and audio moment, aligned to the frame; outro = warm and confident.
- **Comedy beats** get a hard stop: record scratch + music cut + punch-in + shake, error pop-ups, a stuck loading bar, a screen crack.
- **CTA:** a follow card where a cursor clicks "S'abonner", then the button turns into "Abonné ✓".
- **Mix the motion vocabulary:** kinetic word stacks with blur-in, glass UI cards (progress, chat, notifications, polls), number rolls, behind-subject text, orbiting chips (half behind the head), fan-out cards, full-screen cutaways, light streak wipes, 3D objects, a before/after wipe.
- **Never cover the face.** Cards go on the chest area.

## Look
- **Palette:** pick the accent as the complement of the set (blue wall → warm orange #FF7A3D; Claude coral #D97757). Glass cards are dark with a white 22 % border.
- **Fonts:** Anton (big words), Instrument Serif italic (accents and names), Inter 800–900 (UI and captions), JetBrains Mono (numbers), Noto Color Emoji.
- **Grade:** CSS gradeAt (warm by default, muted saturation in the struggle sections, darker before the drop) plus CinematicLayer at 0.5. Skin must stay natural.

## Sound
- **Voice first:** about −16 LUFS master. The music sits about 19 dB under it.
- **Music:** Mixkit (free, no credit). Choose by structure (music_analyze.py), not just the tags. Align the drop to the key line. Muffle the music with a low-pass in "stuck" sections. Cut to silence on the suspense line before the drop.
- **SFX** (`assets/sfx/`, plus https://remotion.media/<name>.wav, see the remotion-best-practices sfx.md list):
  - whoosh/whip on entrances and transitions;
  - pop on chips;
  - tick on checklists;
  - keypad on typing;
  - ding/success on payoffs;
  - shutter for "rendu";
  - record-scratch for "autre histoire";
  - windows-xp-error for errors;
  - page-turn for stacking cards;
  - bone-crack or vine-boom for "💀" moments (keep at 0.25–0.3);
  - notification for reminders;
  - riser into the reveal or drop;
  - sting on the drop;
  - mouse-click on the CTA.
  Typical volumes 0.3–0.7. Run a final Whisper pass on the mix to prove the voice stays intelligible.

## Report to the user (every version)
Say what changed, the length, and the loudness. Give the exact file path. List any decision that needs his ears (patched mouths, darkness level). Ask about open facts (name spelling, @handle). Keep it short. He writes informal English, so reply in simple English.
