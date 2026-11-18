# Lessons & this user's preferences

These come from the NearMatch production (2026-10-13/14). Their verbatim words are in quotes.

## How they like to work
- **Big ambition, trust:** "put 100% and go". "the same profesionnalism the same perfection the same qulity". Aim for the reference quality and don't ask permission for every step.
- **Subagents:** "as usual delegate it to subagents". You direct and review.
- **One format at a time:** "work on video by video !!! not 2 format at the same time". 9:16 first.
- **Show early:** "if you finish 16:9 or 9:16 one before the other tell me i take a look at least".
- **Free online sources** for music/SFX: "you can check the internet there are so many sites that can provide that !!! for free !".
- **Images: Kie AI, always:** "for image generation always use kie ai always".
- **Music choice is theirs:** "give me the list of music you will provide and i will chose them if i chose it i will tell u to replace it or on top of it". Give a numbered list with previews and a recommendation.
- **Music they liked in principle:** "mysterious engaging thrilling music … next to all the sound that does exist". Mysterious night electronic, tension → release, more present.
- **Scoped changes:** "this change i want it in 16:9 dont touch the 9:16". An approved format is frozen.
- **Full quality delivery:** "no dont make lighter ... put it in folder so i see it". Open Explorer on the out folder.
- **Machine safety:** "try to not crash the pc check gpu and stuff … it is wsl btw". They hibernate the PC rather than shut it down.
- **One project folder:** everything in `<name>-motion/`, not scattered in `~`.
- **Questions:** a "can you…?" question gets a short plan and questions before you act. Otherwise, pick sensible defaults and keep going.
- **Language:** they write fast with typos and some Tunisian/French. Answer in clear, simple English.

## Things that went wrong — don't repeat
- **"/design" and "/brag"** were taken as commands. There is no `/design` in Claude Code. The user meant "something within claude that gives all screens of the app", so we captured the real screens instead. `/brag` is a HyperFrames launch-video plugin; it could serve as a cross-check, but it was never run. Ask once if unclear.
- **/tmp gets wiped:** the reference reel, the scratch scripts and the venv in /tmp were lost. Keep anything worth keeping inside the project folder, and the reusable bits in this skill.
- **Paid credits run out** (ElevenLabs and Higgsfield both hit 0). Check balances before planning around a paid tool. Have the free path ready: Mixkit/remotion.media for audio, Kie AI for images (per the user).
- **Sound effects from synthesis** sounded cheap. Every final SFX is built from real free recordings, then trimmed and loudness-matched.
- **A stem render with music bleeding in** was a near-miss. Prove the stem is clean (`check_stem.py`).
- **Changing shared code after approval** risks the frozen format. Put every later change behind format guards and prove the frozen one is pixel-identical.
- **Overlap bugs** (text over cards, content in the caption band) only show up in stills. Look at both formats.
- **A small number-roll spacing flaw** shipped ("Gym 9 here"). Check digit spacing next to labels.
- **Summed audio hit 0 dBTP.** Always master with the limiter and verify the true peak.

## What made the user say "loved the video"
- Every word on screen landed exactly as it was spoken.
- The real app UI was rebuilt and used, not screenshots.
- There was constant motion and depth, with glass, light and grain.
- Varied, purposeful transitions: a signature light streak, and an iris from the button just pressed.
- Sound design hit every action (pops, taps, ticks, chime, sting) under a ducked music bed.
- The logo came as the payoff, drawn the way the app draws it, on the exact word.
