# The reference look, decoded

These are the videos that set the quality bar. They were analysed frame by frame, transcribed with Whisper large-v3, and spectrograms were checked. Use this when the user says "like those reels" or "same quality", and as a checklist of moves.

## Sources
- **Reel:** https://www.instagram.com/reel/DeZ10EbNbn3/
  - By @itsbahahaouas, 63 s, 1080×1920, 60 fps, Tunisian Derja.
  - An ad for his course "تعلّم منتج بكلود في أقل من ساعة" ("Learn to edit with Claude in under an hour").
  - Re-download: `yt-dlp -o reel.mp4 <url>` (the local copy was lost when /tmp was wiped).
- **Masterclass intro:** https://odd-grass-9a6a.justbahahaouas.workers.dev/assets/intro.mp4
  - 53 s, 16:9, captioned "this whole video was edited by Claude".
  - Local copy: `examples/nearmatch/research/reference-intro.mp4`.
- **Course page:** https://odd-grass-9a6a.justbahahaouas.workers.dev/ (149 TND promo / 299 TND).

## How he actually makes them (the "prompt engineering")
The intro shows his prompt box:
- the raw footage attached
- a pasted document, **"نظام التوجيه الإبداعي" — the Creative Direction System**
- one line: **"اعملي المونتاج الكل، كيف ما في البرومبت"** ("do the whole edit, as in the prompt")

So the method is a **reusable style bible + raw material + one instruction**. Claude Code builds it in Remotion:
- `npx create-video@latest`
- `npx skills add remotion-dev/skills` (12 official skills: best-practices router, create, markup, captions, multimedia, render, studio, maps, interactivity, docs, saas, upgrade)

Our equivalent of his style bible is `brief/creative-direction.md` (template: `creative-direction-template.md`).

## The 6 skills his course teaches
1. **Prompt** — the creative direction system.
2. **Montage** — cuts, order and transitions, described in words.
3. **Motion graphics.**
4. **Captions** — word by word.
5. **3D.**
6. **Sound.**

Tools he uses but doesn't mention, inferred from the frames:
- Whisper word timings
- Three.js via `@remotion/three`
- AI-generated stills
- person segmentation (text behind the subject)
- an SFX library
- Arabic fonts Alexandria / IBM Plex Sans Arabic
- 60 fps everywhere

## Reel structure (a proven ad arc: hook → problem → promise → steps → agitate → offer → CTA)
- **0–7 s:**
  - kinetic "Video / *Editor* (serif italic) / وبديت جديد"
  - a "$0 → $98 → $100K → +1M" number roll
  - a 3D card-flip from a dark scene to a light one
- **7–15 s:**
  - a client sends a reference → a "this isn't just about STYLE" card
  - "Style match 46% → 12%", then "Deal lost"
  - text behind his head ("Client")
- **15–22 s:**
  - "any style" phone cards fan out
  - "in a quarter hour" with a 15:00 → 07:49 rolling timer
  - final_edit.mp4 exported; a timeline with "0 cuts"
- **22–33 s:**
  - Claude for Windows → Claude Code → a "motion project" folder
  - CMD typing the two npx commands → 12 skills ticking 0/12 → 12/12
- **33–42 s:**
  - "90%" huge behind his head
  - progress bars: 90% hear / 10% apply
  - YouTube "no clear answer"
- **42–63 s:**
  - masterclass glass dashboard, a phone showing the landing page
  - an "auto" toggle → "Claude", a circular face PIP
  - PROMO countdown 11:10:50, an Instagram profile mock, "link in bio"

## Intro video beats
- Coffee cup while Claude renders 29% → 100%.
- An invoice "montage / motion / captions / sound design" counting 0 → 150 TND.
- A low-poly magic lamp in 3D.
- A staged "live" talk with Claude (LIVE card, check mark).
- Split screen: him on the right, motion on the left.
- An "EP 01 next" card, then "Peace".

## Motion vocabulary extracted (what to reuse)
- kinetic word stacks with blur in/out
- slot-machine number rolls
- 3D card flip / fly-away
- **diagonal light-streak wipe**
- whip push with motion blur
- circle iris reveal
- text behind the subject
- glass UI cards: notifications, progress bars, toggles, timelines, terminals
- fake UI interaction: typing, ticking checklists, cursor clicks
- floating 3D icons with depth blur
- a phone-card fan-out
- split screen / circular PIP
- word-by-word captions with accent keywords
- a music bed + riser + UI pops/dings timed to events

## What we changed for a product teaser (NearMatch) and why
- **No talking head:** the product UI is the hero. It is rebuilt in React and "used" on a 3D phone.
- **Voiceover (ElevenLabs)** instead of on-camera speech. The VO timing drives everything.
- **Brand system on top:** the app's own palette, type and motion DNA replace his gold/serif look. Colour has a meaning (NearMatch: rose = live, green = presence).
- **The logo is the payoff at the end,** never the opener.
