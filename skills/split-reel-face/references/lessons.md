# Lessons from the first reel (« Kifech na3mel el reels hedhom », 2026-10-21)

## The user
- **No render without their OK.** « dont render anything just work and advance in remotion … then if i like the video
  i tell u to render ». QA stills are fine; the full render only on « render ».
- **Never downgrade quality.** When the Studio preview stuttered I swapped the grain and plates for cheaper versions and
  added a « fluid » composition → « no dont make the video light and downgrade its quality … leave it like that with
  high things ». Reverted. Explain instead: the Studio is a live player, the render computes every frame.
- **« Last N reels » means the most recent ones, never the pinned reel** (« no not the fucking pinned on i was
  cleaaaaaaaaar »). On a profile grid the first tile may be pinned: check the dates.
- They want their own content on screen (their reels, their clips), and creativity « with the same vibe ».
- They decide the music by ear and where it starts; they changed it twice (from frame 0 → « start it at 3 sec »).
- Plain words with them: no « scene types », no jargon; say what you will do in one simple sentence.
- Cover in the caption script: they asked « tunisian rabiziiii arabic letterens » → Arabic letters, Latin tech words.

## Technical
| problem | fix |
|---|---|
| Render fails « Timeout while extracting frame at 5 s » | CapCut exports have a keyframe every 5 s. `ingest.sh` re-encodes with `-g 30` (thumbs/clips `-g 15`). Stop Studio before replacing a file (Windows lock). |
| Split crop cut the face at the eyes | measure on `grid.jpg`: first reel splitSy 270, seam 880, captions moved to 1508 (split) / 1240 (face). Early plan numbers (seam 800) were wrong. |
| Latin words reversed in Arabic captions (« graphics motion ») | inline text block with `dir`, not flex items |
| Words glued (« motiongraphics ») | font size on the caption container (spaces use it) + NBSP |
| SFX ducking « done » but not in code | it's in `Sound.tsx` now (62 % under words). Check claims in the code, not in reports. |
| 7 doubled transition sounds | two agents each put a whoosh on the same cut: keep one per boundary |
| Grain repeating-gradient moiré | SVG feTurbulence grain (kept, full quality) |
| Studio stutters (backdrop blur, feTurbulence, Pro-Mist) | normal: tell the user; the render is smooth |
| `sound.ts` vs `Sound.tsx` collide on Windows (case-insensitive) | the cue type lives in `cue.ts` |
| wsl.exe eats `$` in inline commands | .sh files + `MSYS_NO_PATHCONV=1 wsl.exe bash /mnt/c/…` |
| PyAV broken in the WSL Whisper venv | `transcribe.py` decodes with ffmpeg to a 16 kHz numpy array |
| ffmpeg glob patterns not on Windows | contact sheets via WSL PIL (`sheet.py`) |
| Whisper as QA of the final mix in Tunisian | inconclusive (0.57 match even raw vs raw): say so, check by eye in Studio |
| The cinematic layer (copied from the French reel) fired THAT video's timed cues in the first split reel: grade arc darkening 22–36 s, letterbox + blackout 42.4–43.9 s, orange burst 43.9 s | template fixed: one steady look (`SPLIT_WARM` in cinematic/looks.ts), `cues={false} letterbox={false}`. Never carry timed cues from another video. |
| SendUserFile limit 30 MB | the 190 MB master stays in the folder: give the full path; the cover (JPG) can be sent |

## Numbers of the first reel
1:55 · 3451 frames · 9 scenes · 8 scene agents · render 600 s on GPU (`--gl=angle`, CRF 16) · master −13.8 LUFS,
TP −1.7 dBTP · 190 MB · music Mixkit « Young Trizzy 02 » from 3.0 s at 0.085.
