---
name: voice-clean-cut
description: Cut a raw voice recording with surgical precision. Finds and removes every stutter, repeated word, false start, half-said word, "euh", aside and retake, always keeping the LAST good take (the second word, the second phrase), then proves nothing is left by listening again to the result. Works with a script (e-learning lessons, voiceovers) or without one (talking-head reels). Use this skill WHENEVER a person's own voice recording has to be cut, cleaned, integrated into a video or synced to a lesson, whenever the user mentions stuttering, "bégaiement", repeated words, retakes, "keep the second one", "cut my voice", "clean my recording", or hands over an m4a/mp3/wav they recorded, even if they don't name the skill. Run it before any pause trimming, captions, timing or rendering, because everything downstream depends on this cut. Not for AI-generated voices, which do not stutter.
---

# Voice Clean Cut

The speaker repeats themselves when a word comes out wrong, then carries on: « Et non, une ve… et non, une mini-VM ». The listener must only ever hear the good version. This is the speaker's top editing requirement, and they have had to repeat it, so treat a stutter left in the final voice as a failed job.

## Why the obvious way fails

Whisper tidies speech. On a long clip, and above all when given the script as a prompt, it silently drops repeats and writes what should have been said. A transcript that looks clean proves nothing. On lesson 1.3 of the Docker course, a script-prompted pass reported "no retakes" on a recording that held more than ten: all of them were still in the delivered voice. So:

- **Hear first, with no script.** The script is only used afterwards, to compare.
- **Never report "no stutter found" from a prompted transcript.**
- **Word times are off by up to 0.2 s, and the first word of a clip is pinned to its start.** They say roughly where to look. The loudness strip says where to cut.
- **Keep the denoiser gentle.** `afftdn=nf=-25` took 2.5 dB off the consonants and turned « Troisième mot » into nonsense for Whisper; `nf=-40` removed the same noise and lost only 0.3 dB. Words misheard only in the finished voice point to the processing, not the speaker.
- **You cannot hear.** Say so. The evidence is several transcriptions and the measurements, and the speaker's ear is the last word, which is why step 5 exists.

## The rule that decides every cut

Keep the last complete take, at every scale: a syllable, a word, a phrase, a whole line. A word is only removed with positive evidence that it is a repeat, a false start, a filler or an aside. An unexplained extra word stays and is flagged, because cutting something good is worse than leaving a doubt for the speaker to judge.

## Workflow

Scripts are in `scripts/`. They run in the WSL venv, from the scripts folder (they import each other):

```bash
export PATH="$HOME/.venvs/whisper/bin:$PATH"
cd /mnt/c/Users/YOU/.claude/skills/voice-clean-cut/scripts
```

**Language.** Every script reads `VC_LANG`: `fr` (default), `en`, or `tn` (Tunisian Derja; Whisper hears it as Arabic, tech words stay Latin). Prompts, fillers, asides and number words follow it (`scripts/lang.py`). Export it before step 1, e.g. `export VC_LANG=en`. Tunisian alignment is new and untested on a real recording: read its report with extra care.

From Git Bash, put the commands in an LF-ended `.sh` file and run `MSYS_NO_PATHCONV=1 wsl -d Ubuntu -- bash /mnt/c/.../file.sh`. Run long steps in the background: there is no GPU here, so Whisper uses the CPU, and large-v3 (`--big`) takes several minutes for a dozen short slices.

**1. Hear.** Splits the recording on its pauses and transcribes each phrase alone, with no prompt and with a stuttering-style prompt that Whisper imitates.
```bash
python hear.py "<raw audio>" _heard.json
```

**2. Decide.** Aligns the words to the script. The alignment prefers the later take, at every scale. Leave out `--script` when there is none: repeats are then found in the transcript itself.
```bash
python decide.py _heard.json _decisions.json --script lesson.json [--overrides cut-overrides.json]
```

**3. Be the editor: read the report line by line.** This is the step that makes it smart, and the script alone is not enough. Read every `⚠` and every phrase next to the script, looking for:
- a phrase far too long for its words: a hidden repeat;
- a word that makes no sense where a repeat would fit: « Donc un push » was « Docker push » misheard;
- a repeat Whisper split differently in each pass.

Check anything doubtful before deciding. Close listening prints what each model hears in the slice, and the loudness every 20 ms, where a word said twice shows as two bursts with a dip between them:
```bash
python listen.py "<raw audio>" 71.7-73.6 73.7-75.7 --big
python echoes.py "<raw audio>"
```
`echoes.py` finds repeats from the sound alone. It is a source of leads with many false alarms: legitimate repeats in the script and sustained vowels (lag under 0.3 s) show up too. Confirm each lead with `listen.py`.

Record the decisions in `cut-overrides.json`, in seconds of the raw file, so they survive a new transcription:
```json
{
  "cut": [[71.6, 73.6]],
  "keep": [[73.85, 74.5]],
  "spans": [[88.20, 88.50, "« qu'on l'on veut » : retiré « on »"]]
}
```
`cut` and `keep` act on whole words. `spans` removes exact audio, for a sound smaller than a word.

**4. Cut.** Finds the quietest point around each removal, snaps to a zero crossing and joins with an 8 ms crossfade. Natural pauses are left alone; only what was decided goes.
```bash
python cut.py "<raw audio>" _decisions.json _clean.wav _cuts.json
```

**5. Give the speaker the review page.** The same few seconds before and after every cut, so they can check them all by ear in two minutes and answer with a cut number.
```bash
python review.py "<raw audio>" _clean.wav _cuts.json _review
```

**6. Prove it.** Run hear and decide again on the finished voice. The second pass must find nothing left to cut. Read its output anyway, then fix and repeat if anything remains. Do not present the voice until this passes.
```bash
python hear.py voice.wav _heard-final.json --force
python decide.py _heard-final.json _decisions-final.json --script lesson.json
```

## Reporting

Say plainly: how many cuts, the length before and after, the result of the second pass, every cut you were unsure about with its time, and where the voice differs from the script with no second take to fall back on. Those slips can't be cut, only re-recorded, so give the exact sentence to re-record.

## In the Docker course

`videos/02-docker/tools/integrate.sh <slug>` already runs steps 1, 2, 4 and 5 before timing a lesson, using `recording/cut-overrides.json` if it exists. Step 3 (your editorial reading) and step 6 are still yours to do. Files land in `lessons/<slug>/recording/`, the review page in `recording/_review/index.html`.
