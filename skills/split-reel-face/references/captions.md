# Captions

## The user's rule for Tunisian
**Arabic letters**, and technical / English / French words **stay in Latin**, like Tunisian reels do:
« كيفاش قاعد نعمل في الـ reels هذوما والـ motion graphics هذوما » · « Claude يهبّطها وحدو، ويناليزيها بالـ outils كيما ffmpeg ».
- French-derived verbs conjugated in Tunisian go in Arabic letters (« ويناليزيها », « يجينيري »); nouns/brands/tech in Latin.
- The article glues to the Latin word: write « الـ reels », « بـ Claude », « لـ Remotion » (build_captions.py keeps
  « الـ » + word together so it never shows alone).
- Prompts the user types to Claude on screen: 3arbizi Latin (« tfarrej fel vidéo hedhi w analysiha b détails »).
- Titles/cover in the same script as the captions (the user corrected a 3arbizi cover to Arabic letters).
French or English videos: `dir: "ltr"`, same pipeline with the `fr`/`en` timing pass.

## Writing lines.json
Whisper large-v3 can't write Tunisian properly (« الريز » for reels, « لزي تاب » for les étapes) nor 3arbizi. Run the
`ar` AND `fr` passes, read both, and write each line yourself, keeping Whisper's line bounds (`s`, `e`) and a `part`
(hook, step1…). Keep the user's exact words (no rewording, no added words). Example: `examples/kifech/lines.json`.
`build_captions.py` spreads each line's words over that line's Whisper words by character position → good enough
for 3-word pages; spot-check a few words in Studio.

## Rendering (Captions.tsx) — the bidi lessons
- Pages ≤ 3 words / ≤ 24 chars, reset at each line; active word coral and slightly bigger; unsaid words dimmed.
- Render the page as ONE inline text block with `dir` (not flex items): flex reverses consecutive Latin words
  (« graphics motion »); inline text lets the bidi algorithm keep « motion graphics » in reading order.
- Put the font size on the container too: the spaces between word spans are drawn at the container's size
  (default 16 px made « motiongraphics »).
- Pages are clamped to their scene's range so a caption never spills over a full-screen title or the end card.
