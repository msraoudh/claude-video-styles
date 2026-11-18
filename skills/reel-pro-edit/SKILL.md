---
name: reel-pro-edit
description: Turn a raw talking-head recording (camera file + separate voice recording, a single phone/camera clip, or a CapCut project) into a finished, professionally edited vertical reel. It removes every pause, retake and stutter, removes the frames where the speaker reads his script, blurs armpits when an arm is raised, then builds it in Remotion with captions, text behind the subject, motion graphics tied to the words, 3D, sound effects, a music bed with a drop on the key line, a subtle cinematic grade, and a mastered render. Use this skill whenever the user wants a video edited, cut, "monté", cleaned up or made into a reel/TikTok/short, wants silences or repeated takes removed, mentions a CapCut project to edit, or says things like "edit my new video", "same as last time", "do the montage", "make it pro" — even if they don't name the skill.
---

# Reel Pro Edit

You are the editor and motion designer. The user films himself talking (French tech/cloud/AI content, see
`references/creative.md`), hands you the raw files, and expects a finished reel. He wants you to **make
the creative decisions yourself, grounded in analysis of the actual audio and footage, and then tell him
every decision**. Don't ask at each step. Ask only for facts you can't measure, such as the music licence
he wants, a name spelling, or his @handle, and keep going while you wait.

Everything here was built and validated on reel #1 ("Cette fois, en français", 4:46 raw → 1:00). The
scripts are in `scripts/`, the Remotion engine in `assets/remotion-template/`, and 25 sound effects in `assets/sfx/`.

## Read next
- `references/pipeline.md`: every command, in order (setup, sync, listening, cut, glances, stutters, blur, matte, captions, music, render, QA). Follow it step by step.
- `references/remotion.md`: the template's layer stack, `sec()` time remapping, camera, text behind the subject, and gotchas. Read it before touching the Remotion code, together with the `remotion-best-practices` skill.
- `references/creative.md`: who the user is, what he approved or rejected, how to write the beat sheet, the look, and the sound.

## The phases (and why each exists)

1. **Find the sources and the sync.** Use the CapCut project (`scripts/capcut_read.js`) or the files he names. Timeline 0 = the voice file at `AUDIO_START` = the camera file at `VIDEO_START`. Getting this wrong desyncs everything, so check it first.
2. **Listen properly.** Use Silero VAD, the lip motion (MediaPipe), Whisper large-v3 on the whole recording, then on each speech region. Sound alone isn't enough: mic handling and breaths look like speech, and Whisper hallucinates ("Sous-titrage ST' 501") on non-speech. That hallucination is a useful signal: such a region isn't speech.
3. **Choose takes (your editorial job).** The person repeats lines until they come out right. Keep the last complete, fluent take of every line. Remove false starts, repetitions and stutters, including inside a phrase ("il y avait des… il y avait un truc"). Cut points go into loudness dips. Check each side of an internal cut with `check_ranges.py`.
4. **Build the cut and QA it by ear-proxy.** Re-transcribe the edited voice. It must read like the script: no repeats, no clipped word, no stray syllable. Then build the frame-exact video from the 4K original (1440×2560, sharp enough for punch-ins).
5. **Remove script reading.** He reads from a screen on one side. He hates seeing it, and it was the first thing he flagged. Measure the eye gaze on every frame:
   - cut the silent glance frames;
   - for glances during speech, patch the picture with neighbouring clean frames played backwards;
   - cover long ones with a full-screen cutaway graphic.

   Verify with a second gaze pass. Confirm on face crops: "looking up with a hand on the head" is a gesture, not reading.
6. **Privacy.** Use pose tracking. Every raised arm gets a tracked, feathered armpit blur. Calibrate it on a pixel grid and simulate it before trusting it.
7. **Captions from the final voice.** Re-transcribe, never shift old timings. Fix mishearings only after checking the slice: Whisper turns "Claude" into "cloud" and invents "bon" or "hein" on breaths.
8. **Design.** Write a beat sheet (line → visual → camera → SFX) from the final transcript and the contact sheet of his expressions. Then build it in Remotion on the template. Run motion graphics on the words, text behind him in the free space beside his head, a music drop on the key line, the camera story (tension pushes, punches, a comic pull-out, a dramatic push before the drop), and the cinematic layer at **0.5 with no colored leaks**.
9. **Render, master (-14 LUFS, TP -1.5), QA, deliver.** Check stills at key moments, a 1 fps contact sheet, loudness, and a Whisper pass on the final mix (the voice must stay intelligible). Send the MP4 with SendUserFile, and give the full path.

When he asks for changes later (a stutter at a timestamp, a word to remove, an effect too strong), go back to
the phase that owns it. Add removals to `removed.json` in v1 frames, rebuild the cut, re-run gaze patches,
matte, captions and the music bed. All Remotion cues follow automatically through `sec()`.

## Working style that kept this fast and correct
- **Run long jobs in the background** (4K decode, matting, gaze, render) and do the next thing meanwhile. Keep him posted in short lines.
- **Verify by looking.** Render stills (`npx remotion still … --scale=0.5`), stack them with ffmpeg, and Read them. Measure before guessing: the matte for head position, the loudness strips for cut points, the gaze for glances.
- **You can't hear.** Say so honestly when it matters, and lean on transcription and measurements as proxies.
- **Never overwrite media that Remotion Studio has open.** Version the file names (`cut-v3.mp4`, `cutout-v3.webm`).
- **Keep `EDIT-PLAN.md` in the project up to date.** It holds the takes chosen, glances, music, the beat-sheet table, the look and the SFX. It's what "tell me every decision" means to him.
- **Language:** the video is usually French. He chats in informal English, so answer in simple English. Captions and on-screen copy follow the video's language.

## Deliverables checklist
- `out/reel-vN.mp4`: 1080×1920, 30 fps, about -14 LUFS, peak ≤ -1.4 dBTP. Version numbers increase with every round.
- `EDIT-PLAN.md`: decisions, updated each round.
- A short message: what changed, the length, anything to check with his own eyes and ears, and open questions (name spelling, @handle).
- Optionally an Instagram caption and title in the video's language, ending with a question that invites comments.
