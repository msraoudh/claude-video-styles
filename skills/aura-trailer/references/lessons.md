# Lessons and how this user works

## What went wrong on « NO MORE EXCUSES » (don't repeat)
- **Trying to download the trending song.** It is copyrighted and was geo-blocked. The user found the file in a minute once asked. Ask first.
- **Cutting lines on Whisper's word times.** That truncated first and last words and leaked the next word's tail. Cut on the measured energy valleys (`snap_cuts.py`), then confirm the first word with `find_in.py`, then blind-check every line file (`qa_lines.py`).
- **Long reverse swells covered the lines:** a 2.4 s suck-in sat under a sentence. Trim it to its last 0.7 s (mix.py does it). The SFX duck went from 0.18 to 0.15.
- **A heavy hit on a word masked it.** Drops and impacts land just AFTER the key word.
- **Global flashes kept firing after the tape stop** and washed out the end card. `fx.live_until` stops them.
- **Shot.tsx produced invalid CSS** (`"none" + filter`); fixed with `cssFilter`.
- **The cold-open face was invisible at frame 0.** A thumbnail or first frame must show something: reveal from frame 0.
- **Symlinked media in `video/public/`** gave a 404 at render, because Remotion's bundle copy drops symlinks. Copy or hard-link instead.
- **Software GL in WSL** made renders take about 80 min. `--gl=angle` (D3D12 GPU) takes about 8–10 min with the same image. nvidia-smi shows 0 % even when ANGLE works.
- **wsl.exe mangles `$`** in inline commands, and one mangled sed silently restarted a render without the GPU. Always run .sh files.
- **`ffmpeg` inside a `while read` loop eats the loop's stdin.** Use `-nostdin` and `< /dev/null`.
- **WSL had no internet** while the Windows VPN was on: use PowerShell `Invoke-WebRequest` into the UNC path.
- **Instagram's web API rate-limits (429) within minutes.** Only scroll the grid; yt-dlp per reel with 4 s pauses.

## How this user works (from all their projects)
- They want **pro "real editing"**: motion graphics, 3D, text behind the subject, dark SFX, music lowered under their voice "then get it back". They say "act as expert motion graphic editor" and "it's all up to you". Make the calls, then explain every decision.
- They want **all their skills used**: Windows and WSL motion-graphics skills, their series' liquid glass, Three.js. Port the looks into Remotion and say which ones you used.
- **They hate question floods and over-eager tool calls.** "Where is X?" gets the path and nothing else. Ask only what blocks you (the song file, the handle), in one short message.
- **They follow along from their phone.** Send short status lines while working, and finish with a crisp summary.
- **Full quality only:** never compressed copies. Open the out folder in Explorer.
- **Delegate to subagents** ("as usual delegate it to subagents"). You direct, review their stills, and assemble.
- **Honesty:** you can't hear, so say the mix is verified by measurements. Report failures and unverified parts plainly.
- **Their content (the user, @yourhandle):** French/Tunisian tech creator: cloud, AI, n8n automation, Claude, IT-career tough love. Face reels at a desk with RGB lights, a cap, glasses, a mic in hand; split-screen reels with screen recordings at the bottom; motion-graphics episodes with their face in a glass card at the bottom. Slogans: "No more excuses", "Move on !!", "Adapt urself to ai", "focus on the value". Their pronouns are not stated: in prose, refer to them by name.
- **Never publish anything** (no posting or scheduling skills). They post themselves.
