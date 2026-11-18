# The craft: arc, lines, cutting on the bass, signature moments

## The arc (60 s, the one that worked)
The song's structure decides the exact seconds; these are the roles.

| Section | Time | Music | Picture | Voice |
|---|---|---|---|---|
| cold | 0–4 | far-away rumble (LP 320 Hz), drone + heartbeat | black → their face surfacing, letterboxed | the hook line, alone |
| world | 4–12.6 | bass enters on silence (1-frame mute), the wall opens | trailer cards + data hits, their episodes as evidence, 1 cut / 2 beats | a claim line; a **drop-out** carries the intro line |
| hero (drop 1) | 12.6–30 | 12-frame hole, then wide open | **signature: the name reveal**, face montage on every beat, what they build (screens in 3D) | the dream line on a freeze → unfreeze |
| escalate | 30–47.6 | the bass section | strobes, text behind them, their work as glass cards, half-beat cuts; a freeze stops it dead | a dip (−5 dB, 1.1 kHz) carries the excuse line |
| silence | 47.6–51.8 | the song goes silent (heartbeat only) | slow push, few cuts, the excuse turned around (« PLUS TARD → JAMAIS. ») | the realisation lines, alone |
| title | 51.8–54 | **the biggest 808** after 8 black frames | title slam (glass shards lock) | the decision line right after it |
| finale | 54–57.9 | big hits | strobe montage, handle, their work | — |
| end | 57.9–60 | tape stop → nothing | CRT power-down → end card with the handle + their glass card | the CTA line |

## Choosing the lines (their own voice)
Read every transcript (`ig_txt.py`). Pick lines that tell a story in about 9 beats:
- **hook:** a provocation in the 2nd person ("…mais elle pourrait te remplacer, toi.");
- **credibility:** "J'ai analysé plus de 40 métiers dans l'IT.";
- **who:** "Moi c'est the user, je bosse dans la tech…";
- **the dream:** "Dans ma tête, j'avais les idées de fou.";
- **the excuse:** "…je commencerais plus tard.";
- **the realisation:** "Sauf que ce fameux plus tard… ça n'arrivera jamais.";
- **the turn:** "Mais wesh… pourquoi j'attends encore ?";
- **the decision:** "Je me lance enfin.";
- **the CTA:** "Reste dans le coin."

Each line should meet these criteria:
- 1–4 s and self-contained;
- in a clean take (no music under it, or one that Demucs can separate);
- from a source whose face can be shown in sync;
- with no filler words at the cut points.

Prefer the line that says the trailer's title idea (their slogan) somewhere. The title itself comes from their own captions: "No more excuses".

## Cutting on the bass
- Cuts land only on `BEATS` or `HITS` frames. Strong moments go on `DOWNBEATS` / `BIG_HITS`. Use `snapToBeat(f)` and `hitsBetween(a, b)`.
- **Pace grows:** 1 cut per 2 beats (world) → 1 per beat (hero) → half-beats and 2–6 frame strobes (escalate, finale). Silence sections get 1 slow cut.
- A word on screen lands on its spoken frame (`line.words[i].f`), or on the beat just before it.
- The drop and the hit land just AFTER a key word, never on it, so the word stays clear and the hit punctuates it.
- Black frames before the big hits: 8–12 frames of black (and a music hole) make the hit 3× bigger.
- Freeze + mono + camera-shutter stops a strobe dead before a line, a classic trailer beat. Unfreeze on the first word.

## Lip-sync rule
- While a line plays, the only face with a moving mouth on screen is `<LipShot line="X">`.
- Cut away to screens, cards and text during a line, but keep the lip-synced face on screen for at least ~40 % of it.
- Other face clips go between lines, as 2–6 frame strobes, or at speed ≤ 0.35 or frozen. Then they read as "not talking".

## Signature moments that worked (examples/no-more-excuses/sections/)
- **Cold open** (`open/Cold.tsx`): their talking-head card surfacing from black, throbbing on the heartbeat. « TOI. » slams on the « t » of the word, then a hard cut to « EN 2026, » on the bass entry.
- **World** (`open/World.tsx`, `ui.tsx`): trailer cards (« L'IA RECRUTE. »), their episode as evidence (the scanned job grid), « …ET TOI ? » on the last hit before the drop-out.
- **Drop-out** (`open/Dropout.tsx`): an intimate push on them under the intro line, with letterbox closing in and a reverse sucking the frame into the drop.
- **Name reveal** (`hero/NameReveal.tsx`, `gl.tsx`): a 3D "dossier" slab hits on DROP 1, tiles flip into « MED YOURNAME », the handle types on, the slab turns over to the portrait, « SUJET IDENTIFIÉ » locks on, the camera dives into the portrait, and the photo comes alive.
- **What they build** (`hero/Builds.tsx`, `stage3d.tsx`): camera flights between 3D stations showing their real screens (n8n canvas, the AI secretary executions table with a SUCCESS chip, Blender dragon). Then a reel wall that turns over in a radial wave, and a reel counter.
- **Text behind them** (`escalate/Cutout.tsx`): « ADAPTE- » slammed behind the cut-out on the bass entry.
- **Slice wall** (`escalate/SliceWall.tsx`): « FOCUS » tiles; on the big 808 a shockwave flips the wall to « DOMINE. ».
- **Glass carousel** (`escalate/Carousel.tsx`, `GlassCard.tsx`): their episodes as liquid-glass cards flying in on whooshes.
- **The turn** (`climax/Silence.tsx`, `SwapWorld.tsx`): « PLUS TARD » in red; a portal tears open on « ça »; the letters hand off to « JAMAIS. » on the word; « JAMAIS. » rushes past the lens.
- **Title** (`climax/GlassTitle.tsx`, the glass-shard-title skill ported to R3F): shards fly in through fog and LOCK on the biggest 808, « NO MORE EXCUSES » ignites inside the glass, then the panes blast toward the lens into the decision line.
- **Finale + end** (`Finale.tsx`, `EndCard.tsx`): a strobe montage on the big hits, then the tape stop, a CRT power-down and black. The end card shows the handle, « NOUVEAUX ÉPISODES CHAQUE SEMAINE », and their liquid-glass talking-head card saying the CTA.

## Motion vocabulary
- **Punch-in on beats:** `<Shot punch={0.06}>`; zoom pulses from `beatPulse`.
- **Bass shake:** `<Shot shake={8}>`, driven by the sub envelope plus the 808 onsets.
- **Speed ramps:** `ramp(at, rampAt, 0.3)` gives real time and then slow-mo on the hit.
- **Freeze:** `speed={0}`, plus `grade="mono"` for flash frames.
- **Glitch slices / RGB split** on one shot (local), and a white flash on your own cut (local). The global flash is TrailerFX.
- **Kinetic type:** big Inter 800 uppercase at 140–260 px, tracking −0.04 em, landing with a 2–4 frame overshoot. Small labels are JetBrains Mono caps at 26–34 px, 0.3–0.5 em tracking, at 42–65 % white.
- **Liquid glass** for every panel or card: their series signature (`kit/Glass`).
- **3D:** `ThreeCanvas`, frame-driven camera paths, fog, few meshes. The 3D dossier and the glass title were the most "wow" moments.
- **Their skills, ported:** glass-shard-title, wireframe-portal-title (the PLUS TARD portal), code-slice-hero (the slice wall), cuboid-carousel, orbit-card, adaptive-glass. Say which ones you used.

## Text and safe areas
- On-screen words are in the trailer's language (tech words may stay English). Use few words, as trailer cards; no full subtitles.
- Hold ≥ 30 frames unless it's a strobe flash.
- Safe area: x 90–990, y 220–1540; below y 1000 keep x ≤ 940 (Instagram's icon column).
- Colour roles: `L.blood` = danger / the old world / « plus tard ». `L.violet` = AI. `L.acid` = action / « go ». Everything else is steel on ink.
