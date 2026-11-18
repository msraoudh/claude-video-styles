# Analyse du reel de référence Deg4HQMBJY3

Source : https://www.instagram.com/p/Deg4HQMBJY3/ (créateur « AIS », Nate Herk). Sujet : « voici mon footage brut, et voici ce que Claude en a fait ». C'est **exactement le même sujet que notre reel** (le montage fait par Claude), donc on peut copier sa grammaire presque plan par plan.

Fichiers :
- vidéo : `refs/Deg4HQMBJY3.mp4`
- transcript Whisper large-v3 avec timings par mot : `refs/Deg4HQMBJY3-transcript.json`
- planches contact 2 fps, bandes 10 fps, images clés, spectrogramme : `refs/Deg4HQMBJY3-frames/`

Toutes les valeurs ci-dessous sont **mesurées** (ffprobe, ffmpeg scene/ebur128, Whisper, séparation Demucs voix/musique, échantillonnage de pixels, corrélation de phase). Quand c'est une estimation, je le dis.

---

## 1. Fiche technique

| Mesure | Valeur |
|---|---|
| Format | 1080×1920, 60 fps (contenu en 30 fps doublé : un score de scène sur deux est nul), VP9 + AAC 48 kHz stéréo |
| Durée | 43,46 s |
| Coupes franches (scène > 0,3) | **29**, plus 3 coupes dans le panneau du haut pendant le hook (3,72 / 3,93 / 4,15) |
| Rythme | **0,67 coupe/s**, plan moyen de 1,45 s (de 0,6 à 2,87 s). On voit un nouvel élément (caption, ligne, tampon) toutes les 0,3 à 0,5 s |
| Plans | **30** (le reel affiche lui-même `30 shots, 68 captions` dans son terminal : c'est vrai) |
| Parole | 203 mots en 43,3 s, soit **4,7 mots/s (~280 mots/min)**. Pause max 0,30 s, pause médiane 0. Montage serré au maximum |
| Langue | anglais (p = 0,99) |
| Loudness du mix | **−14,2 LUFS** intégré, LRA 1,2 LU, true peak −1,1 dBTP (après le ré-encodage Instagram ; le terminal annonce `master -13.9 LUFS`) |
| Voix seule (stem Demucs) | −14,4 LUFS |
| Musique + SFX (stem) | −28,5 LUFS. Écart RMS voix/musique pendant la parole : **−11,8 dB**, ce qui confirme le « −11,1 dB » affiché à l'écran |

---

## 2. Le hook (0 à 3 s), puis le « reveal » (2,87 à 4,3 s)

**0,00 à 2,87 s : « RAW FOOTAGE ».** Fond noir #0a0a0a, une interface de fichier :
- y≈393 : `raw.mov` à gauche et `3840 × 2160 · 30 fps` à droite, en mono grise.
- y 438 à 1048 : la vidéo brute en 16:9, pleine largeur, avec le badge `● RAW` rouge #f14128 en haut à gauche et un timecode qui défile `00:00:00:24` dans une puce #252728.
- y≈1110 à 1190 : le titre **RAW FOOTAGE** (Montserrat ExtraBold, ~105 px).
- dessous : le sous-titre gris #878688 « unedited · every pause and retake still in ».
- y 1320 à 1430 : la forme d'onde complète de la prise brute (0:00 à 0:58), avec une tête de lecture blanche qui avance.

Son : **la voix brute seule, sans musique** (stem musique à −54 dBFS). Il dit : « So this right here is the raw footage that I recorded for this video. »

**2,87 s : le reveal.** Coupe franche sur « And this is what Claude turned it into ». **La musique entre d'un coup sur la coupe, avec un sub-bass** : +33 dB dans le stem musique, onset basse fréquence le plus fort du morceau à 2,85 s. Le contraste « silence brut, puis drop » est le vrai hook.

**2,87 à 4,30 s : split.**
- En haut, d'abord un mur de ses reels (grille 6×3). Ensuite, **une bande-annonce du reel lui-même** : on voit défiler toutes les 0,2 à 0,4 s les graphiques qui vont arriver. Le tampon ✕ RETAKE (3,3 s), le triptyque REAL CLIP / SCREEN REC / AI VIDEO (3,7 s), le compteur « 50.8 s » (3,9 s), la pellicule image par image (4,2 s). C'est une boucle ouverte : le spectateur veut voir ce qu'il a entrevu.
- À 3,4 s, une tuile blanche avec le logo Claude (~150 px, coins arrondis) **pope sur la jointure**, au-dessus de la caption. Le SFX est « felt-thud », d'après la propre liste de cues du reel.
- Captions : « AND THIS IS », puis « WHAT **CLAUDE** » (teal), puis en serif « turned it into ».

**4,30 à 5,00 s :** punch-in en gros plan plein écran sur « I **NEVER** / HAD TO OPEN » (NEVER en rouge).

---

## 3. Structure plan par plan

| # | Temps (s) | Layout | Visuel | Texte à l'écran (caption) |
|---|---|---|---|---|
| 1 | 0,00–2,87 | graphique plein écran | carte « raw.mov » + forme d'onde + tête de lecture | RAW FOOTAGE |
| 2 | 2,87–3,30 | split | mur de reels 6×3 | AND THIS IS |
| 3 | 3,30–4,30 | split | montage d'aperçus des graphiques à venir + pop du logo Claude | WHAT CLAUDE / *turned it into* |
| 4 | 4,30–5,00 | gros plan plein écran | punch-in ~1,8× | I NEVER / HAD TO OPEN |
| 5 | 5,00–7,47 | graphique plein écran | terminal « Claude Code », les lignes apparaissent une par une | ANY SORT OF / VIDEO EDITING SOFTWARE (rouge) / FIRST (teal) / WHAT IT DOES IS |
| 6 | 7,47–8,87 | split | table « TRANSCRIPT · START → END (S) » de CE reel, les lignes s'ajoutent | IT TRANSCRIBES / EVERY SINGLE WORD |
| 7 | 8,87–10,00 | graphique plein écran | carte raw « take 1 » + forme d'onde, zone rouge DROPPED, **tampon ✕ RETAKE à 9,3 s** | AND IT CUTS OUT / THE RETAKES (rouge) |
| 8 | 10,00–12,00 | split | carte raw « take 2 », zone verte, **tampon ✓ KEPT à 10,2 s** | KEEPING THE LAST / CLEAN TAKE (lime) / *of each line* |
| 9 | 12,00–14,20 | graphique plein écran | **compteur 58,5 s → 43,4 s** en 0,9 s, les blocs rouges PAUSES + RETAKES s'effondrent, la forme d'onde rétrécit ; la pilule « VOICE SPEED 1.00× » flashe | IT TIGHTENED / EVERY PAUSE / WITHOUT / SPEEDING UP (rouge) / *my voice* |
| 10 | 14,20–16,60 | gros plan plein écran | punch-in | WHICH IS WHY / IT FEELS FAST (lime) / BUT IT STILL / *sounds like me* |
| 11 | 16,60–18,40 | graphique plein écran | « CAPTION TRACK — this reel, chunk by chunk » : ses propres captions avec leurs timecodes, en défilement | IT WROTE / THE CAPTIONS / 1 TO 3 / WORDS *at a time* |
| 12 | 18,40–19,63 | split | triptyque de B-roll avec pilules ● REAL CLIP / ● SCREEN REC / ● AI VIDEO | THE B-ROLL *itself* |
| 13 | 19,63–20,70 | B-roll plein écran | vrai clip (conférencier), fond flouté autour | WHETHER THAT BE / REAL CLIPS |
| 14 | 20,70–22,70 | split | screen recording d'un site, curseur et défilement | OR SCREEN RECORDINGS / OF THE SITES / THAT I'M MENTIONING |
| 15 | 22,70–24,23 | B-roll plein écran | vidéo IA de lui à son laptop, label ● AI VIDEO | AND IT ALSO / GENERATES AI VIDEO |
| 16 | 24,23–25,60 | split | vidéo IA (profil) | WHEN NOTHING / *real exists* |
| 17 | 25,60–27,17 | graphique plein écran | fond flouté + carte « AIS REBRAND FILM · ONE CONTINUOUS CAMERA MOVE » : globe 3D en points avec avatars, forme d'onde qui défile | THEN IT BUILT / IN THESE / MOTION GRAPHICS |
| 18 | 27,17–27,83 | split | timeline de mix bleu nuit, voix blanche / musique bleue, label « DUCKS UNDER THE VOICE » | MIXED THE MUSIC |
| 19 | 27,83–29,63 | graphique plein écran | « THIS REEL'S MIX », VOICE / MUSIC, gros « −11.1 dB » teal | ABOUT 11 / DECIBELS / *under my voice* |
| 20 | 29,63–30,97 | **inversion en clair** | fond #f2ede8, carte blanche « This reel's sound cues », lignes ajoutées en décalé | AND TIMED / A SOUND EFFECT (lime) |
| 21 | 30,97–31,80 | split | timeline des SFX : « DROPS OUT », marqueurs « pop · −9 dB », « keystroke · −25 dB » | TO EACH ACTION |
| 22 | 31,80–33,03 | gros plan plein écran | punch-in | AND THIS WHOLE / STYLE (teal) / THAT YOU'RE / *noticing* |
| 23 | 33,03–33,90 | split | « ● TOP REEL » : arbre Prompt → Claude → OpenRouter / Anthropic | IT LOOKS LIKE / MY STYLE |
| 24 | 33,90–34,50 | split | liste classée #1 / #2 sur fond clair, titres **pixelisés**, entrée en glissé avec un trait de lumière | MY STYLE / OF REELS |
| 25 | 34,50–36,93 | graphique plein écran | mur de ses 27 meilleurs reels (~4×5, tous en lecture) | BECAUSE / IT STUDIED / MY 27 BEST / PERFORMING REELS |
| 26 | 36,93–37,80 | graphique plein écran | pellicule « image par image », timecodes tous les 0,25 s, cadre de sélection teal qui glisse | FRAME BY FRAME (lime) |
| 27 | 37,80–39,07 | split | nuage de skills `/reel-edit /raw-reel-edit /long-to-short /motion-showreel…` sur un collage assombri | THAT INTO / A SKILL |
| 28 | 39,07–40,67 | screen rec plein écran | GitHub `EDITING-PLAYBOOK.md`, push-in continu | AND THAT SKILL / AND MY FULL / EDITING PLAYBOOK |
| 29 | 40,67–41,77 | split | liste des fichiers du repo GitHub | ARE IN OUR / FREE STUDENT KIT (lime) |
| 30 | 41,77–43,46 | gros plan plein écran | CTA | JUST COMMENT / "EDIT" / AND I'LL SEND IT / RIGHT OVER TO YOU |

Arc narratif :
- 0–4 s : preuve (avant/après).
- 4–31 s : chaque étape du pipeline, chacune avec SON graphique : transcription, coupe, resserrage, captions, B-roll, motion, mix, SFX.
- 31–39 s : le « pourquoi ça me ressemble » (il a étudié ses 27 meilleurs reels, puis en a fait une skill).
- 39–43 s : lead magnet et CTA par mot-clé.

---

## 4. Layout

Trois layouts seulement, alternés, et **toujours en coupe franche** (aucun fondu enchaîné) :

| Layout | Part du temps | Géométrie mesurée |
|---|---|---|
| Graphique ou B-roll plein écran (pas de visage) | **52 %** (22,7 s) | caption sous la carte, y≈1630–1700 ; ou au centre (y≈930–990) quand le graphique occupe tout l'écran |
| Split haut/bas | **34 %** (14,8 s) | **haut y 0–880 (45,8 %) = graphique / B-roll ; bas y 880–1920 (1040 px) = speaker** en cadrage taille-poitrine. La jointure est nette, sans dégradé ni flou |
| Gros plan visage plein écran | **14 %** (6,0 s) | punch-in d'environ 1,8× par rapport au cadrage du split, caption y≈1250–1410 (sous la bouche, sur le t-shirt) |

- **La caption est posée sur la jointure** en split : une ligne à y≈835–910, centrée sur y=880 ; deux lignes à 795–870 puis 880–955. L'œil reste au centre et voit en même temps le graphique au-dessus et le visage en dessous.
- Pas de glass, pas de PiP. Les graphiques sont des cartes opaques et plates. Le seul « verre » est l'opacité ~90 % de la pilule des captions.
- B-roll 16:9 dans un format vertical : la vidéo est recadrée au centre (y 245–1545) et une **copie floutée** remplit le haut et le bas (plans 13 et 17).
- Le visage n'est à l'écran que 48 % du temps. Le reel est porté par les graphiques.

---

## 5. Vocabulaire motion graphics

**Les éléments.** Ce sont tous des « vraies » interfaces d'outils de montage, remplies avec **les données de ce reel** :
- carte de fichier brut avec badge REC et timecode ;
- formes d'onde (barres verticales) avec tête de lecture et régions colorées ;
- terminal macOS « Claude Code » ;
- table de transcript mot → timings ;
- compteur géant avec chiffre décimal ;
- piste de captions avec timecodes ;
- timeline de mix voix/musique ;
- carte de cues SFX avec tags colorés ;
- arbre de nœuds (Prompt → Claude → fournisseurs) ;
- liste classée pixelisée ;
- murs de vignettes ;
- pellicule image par image ;
- nuage de pilules de skills ;
- screen recordings (site web, GitHub) ;
- un globe 3D ;
- tampons ✕/✓ ;
- pilules de label « ● REAL CLIP » (point vert), « ● SCREEN REC » (point teal), « ● AI VIDEO » (point orange), « ● TOP REEL ».

**Entrées et sorties** (bandes 10 fps) :
- La plupart des éléments arrivent **par la coupe elle-même** (le plan s'ouvre déjà rempli), puis le contenu **s'ajoute au rythme de la voix**. Les lignes du terminal apparaissent une par une toutes les 0,1 à 0,3 s, sans effet machine à écrire caractère par caractère. Les lignes de la table et de la carte de cues entrent en décalé d'environ 0,2 s, avec un léger fondu.
- **Tampons** : en 2 à 3 images (~70–100 ms), ils passent d'une échelle ~1,3 à 1,0 et d'une opacité 0 à 1, avec une rotation de −6° et une bordure de 6 px. Ils sont calés sur le SFX « felt-stop » et « glass-check ».
- **Compteur** : 58,5 → 43,4 en ~0,9 s (12,1 → 13,0 s). Les blocs rouges se réduisent à une largeur nulle et la forme d'onde se resserre. Ensuite la pilule VOICE SPEED flashe pendant ~0,2 s (teal plus lumineux) sur « without speeding up ».
- **Carte claire** (plan 20) : elle entre par un ressort ~150 ms (montée et agrandissement de quelques %). **Liste #1/#2** (plan 24) : les cartes glissent depuis la droite avec du motion blur et **un trait de lumière blanche** qui balaie.
- **Logo Claude** : pop avec un léger overshoot.
- **Mouvement de caméra permanent** (corrélation de phase) : un push-in lent sur presque tous les plans. Speaker en split 1,025× en 1,9 s, terminal 1,06× en 2,35 s, vrai clip 1,03× en 0,9 s, CTA 1,03× en 1,5 s, soit environ 1,3 à 3 %/s. Rien n'est jamais figé.
- Profondeur et effets : ombre portée douce sous les cartes claires, glow léger sous la pilule « Prompt », flou d'arrière-plan sur le B-roll 16:9. Pas de glow néon, pas de parallaxe 3D (sauf le globe).

**Couleurs** (échantillonnées au pixel) :

| Rôle | Hex |
|---|---|
| fond noir | `#0a0a0a` |
| carte terminal | `#141316` |
| pilule caption | `#1c1817` à ~90 % + bordure 1 px blanc ~15 % |
| **teal** = marque, positif (Claude, FIRST, TIGHTENED, 27 BEST, A SKILL, DECIBELS) | `#0fe2bc` (chiffres `#00ccc0`) |
| **rouge** = négatif (NEVER, VIDEO EDITING SOFTWARE, THE RETAKES, SPEEDING UP) | `#fb2929` |
| **lime** = validé, résultat (FEELS FAST, CLEAN TAKE, SOUND EFFECT, FRAME BY FRAME, FREE STUDENT KIT) | `#16fb17` |
| badge RAW / tampon retake / tampon kept | `#f14128` / `#fa3d26` / `#16bd1e` |
| terminal : ✓ vert / sorties grises / feux tricolores | `#4ed686` / `#a1a0a3` / `#ff5e55` `#fcb92c` `#25c53d` |
| data-viz bleu nuit (fond avec grille de points) | `#05111c` / `#041019` |
| labels cyan, pilule skill (fond / bordure) | `#478fb1`, `#103049` / `#447d9d` |
| mode clair : fond, carte | `#f2ede8`, `#ffffff` |
| tags (violet / bleu / vert / ambre) | `#815fe3` / `#4d7fe1` / `#25b28b` / `#e5a231` |
| texte gris secondaire | `#878688` |

**Typographie** (estimations à partir des glyphes) :
- Captions : **Montserrat ExtraBold/Black en capitales**, ~76 px (hauteur de capitale ~53 px), ~40 px par caractère, soit ≤ 22 caractères par ligne.
- Mots « doux » ou émotionnels : **serif didone noire en minuscules, Playfair Display Black** (~90 px). Exemples : « turned it into », « of each line », « my voice », « sounds like me », « at a time », « itself », « real exists », « under my voice », « noticing ».
- Gros chiffres : Montserrat ExtraBold ~170 px (« 58.1 s »), « −11.1 dB » ~150 px.
- Interface : Inter / SF Pro.
- Code et timecodes : **JetBrains Mono** (~46 px dans le terminal).

**Captions :**
- **1 à 3 mots par chunk** (203 mots pour 68 captions, ~3 mots en moyenne).
- Une pilule par ligne, centrée. Deux lignes au maximum : la 2ᵉ ligne apparaît quand son premier mot est prononcé (« I NEVER », puis « HAD TO OPEN » s'ajoute).
- Changement sec au début du mot : pas de karaoké mot par mot, pas d'animation d'échelle visible.
- Couleur sémantique sur le mot-clé (rouge, teal ou lime). Le serif minuscule remplace les capitales pour la fin de phrase émotionnelle.

---

## 6. Transitions, caméra, B-roll

- **Que des coupes franches.** Le « mouvement » vient de trois sources : l'alternance plein écran / split / gros plan, le push-in continu, et les éléments qui s'ajoutent.
- **Punch-ins** sur le speaker : 4 gros plans plein écran (4,3 / 14,2 / 31,8 / 41,8 s), placés sur les phrases à affirmation forte et sur le CTA. Petits recadrages (~1,08×) entre deux plans split consécutifs (33,9 s). La source est en 4K, ce qui permet ces crops.
- **B-roll** : jamais générique, toujours **étiqueté** (REAL CLIP / SCREEN REC / AI VIDEO / TOP REEL) pour dire au spectateur ce qu'il regarde. Les screen recordings ont un curseur visible et défilent ou zooment.

---

## 7. Sound design (stems Demucs + spectrogramme `Deg4HQMBJY3-frames/spec_music.png`)

- **0 à 2,85 s : aucune musique**, seulement la voix brute. **2,85 s : la musique entre sur la coupe du reveal avec un sub-bass** (+33 dB).
- Le morceau : beat trap/lo-fi chargé en basse (**82 % de l'énergie sous 120 Hz** : des 808), avec une mélodie de cloche ou de pluck (partiels ~600 Hz et ~1,1 kHz) et des hi-hats. **~140 BPM (half-time ~70).** Phrases de 4 mesures (~6,85 s), chacune finie par un **stop-down de ~0,5 à 0,7 s** : 8,9–9,4 / 15,8–16,4 / 22,6–23,4 / 29,5–30,2 / 36,3–37,1 s, puis un temps fort (9,7 / 16,6 / 23,4 / 30,3 / 37,1 s).
  - Le temps fort de 16,6 s tombe pile sur la coupe vers CAPTION TRACK.
  - Le tampon RETAKE (9,3 s) tombe **dans** le silence musical, donc il claque.
  - L'inversion en clair (29,6 s) arrive dans un stop.
- **Niveau** : la musique est à ~−12 dB RMS sous la voix (−14,4 contre −28,5 LUFS intégrés). **Pas de ducking rapide** : la musique est à −25,9 dB pendant les mots et −27,1 dB dans les micro-pauses. Le lit est statique et bas, assez bas pour ne jamais gêner une voix aussi dense.
- **SFX** : discrets et courts. D'après leur propre graphique : « pop −9 dB », « keystroke −25 dB ». Les cues annoncés dans le reel : felt-thud (logo Claude, 3,3 s), air-slide (terminal, 5,0 s), felt-stop (tampon retake, 9,3 s), glass-check (take gardée, 10,2 s).
  - Transitoires aigus mesurés sur les coupes à 4,30 / 5,00 / 16,60 / 25,60 / 31,80 / 36,93 / 37,80 / 39,07 / 40,67 s.
  - Pas de gros whoosh cinématographique : des « clics » de feutre et de verre, une palette d'interface.
- Master très compressé : LRA 1,2 LU, true peak −1,1 dBTP, environ −14 LUFS.

---

## 8. Pourquoi ça retient l'attention

1. **Avant/après en 3 s** avec preuve visuelle (interface brute) et un contraste sonore (aucune musique, puis un drop).
2. **Méta-preuve** : chaque graphique montre les vraies données de CE reel (son transcript, ses coupes 58,5 → 43,4 s, ses captions, son mix −11,1 dB, ses cues SFX, ses 30 plans). Le spectateur vérifie en direct, il revoit le reel, et il fait confiance.
3. **Bande-annonce du reel dans le hook** : le haut de l'écran fait défiler 4 graphiques à venir en 1 s. C'est une boucle ouverte.
4. Un changement visuel toutes les 0,3 à 1,5 s, et l'alternance de 3 layouts.
5. **Sémantique de couleur** constante : rouge = ancien ou douloureux, teal = Claude ou la marque, lime = résultat.
6. **Des chiffres concrets** et animés (58,5 → 43,4 s, −11,1 dB, 27 reels, 1 à 3 mots, 1.00×).
7. **Feedback ludique** : tampons ✕/✓, régions DROPPED/KEPT.
8. **Interruption de pattern** à 68 % de la durée : la seule scène claire du reel.
9. **Curiosité** : titres des tops pixelisés.
10. **Débit à 4,7 mots/s** sans aucune pause supérieure à 0,3 s.
11. **Valeur « système »** (liste de skills + GitHub), puis un **CTA par mot-clé en commentaire** (« comment EDIT ») avec un lead magnet gratuit.

---

## 9. À copier pour notre reel

Notre sujet : « je trouve un reel, Claude l'analyse (ffmpeg / Whisper), skills, script + voix ElevenLabs + motion Remotion + agents en parallèle, render ». C'est le même méta-récit, donc on garde la structure et on remplace chaque graphique par **nos** vraies données.

1. **Hook avant/après + drop musical.**
   - Contenu : ouvrir sur une carte `raw.mov` (notre rush brut, badge `● RAW`, timecode, forme d'onde complète, tête de lecture), avec la voix brute seule. Coupe franche vers ~2,8 s sur « et voilà ce que Claude en a fait », avec un sub-boom et l'entrée de la musique.
   - Remotion :
     - `<RawFileCard>` : un `OffthreadVideo` dans une carte 1080×608 à y=438 ;
     - timecode `HH:MM:SS:FF` calculé depuis `useCurrentFrame()` ;
     - forme d'onde en barres SVG depuis un JSON de pics (numpy, comme notre `refaudio.py`), avec playhead `x = frame/durationInFrames*W` ;
     - musique `<Sequence from={revealFrame}><Audio …/></Sequence>` et boom sur la même frame.

2. **Bande-annonce du reel dans le hook.**
   - Contenu : entre 3 et 4,3 s, le panneau du haut enchaîne 4 aperçus de 0,25 s de nos futurs graphiques (terminal, tampon, compteur, mur de reels). Le logo Claude pope sur la jointure avec un thud.
   - Remotion : un `<Series>` de 4 `<Series.Sequence durationInFrames={15}>` (60 fps) qui réutilisent les composants des scènes à un instant figé. Logo : `spring({damping: 12, mass: 0.6})` de 0,6 à 1.

3. **Split 880/1040 avec caption sur la jointure, et 3 layouts alternés.**
   - Contenu : haut y 0–880 = graphique, bas y 880–1920 = speaker. Viser à peu près la répartition mesurée : 50 % graphique plein écran, 35 % split, 15 % gros plan. Jamais deux fois le même layout de suite, et uniquement des coupes franches.
   - Remotion :
     - composant `<SplitLayout top={…} speakerSrc startFrom>` ;
     - bas : `OffthreadVideo` en `objectFit: cover` dans 1080×1040 ;
     - caption ancrée à `top: 835` en split, `top: 1250` en gros plan, `top: 1630` sous une carte plein écran.

4. **Captions « pilule par ligne » 1 à 3 mots, sémantique rouge / teal / lime, serif pour les fins émotionnelles.**
   - Contenu :
     - capitales en Montserrat 800, 76 px, blanc ;
     - pilule `rgba(28,24,23,.9)`, bordure `1px rgba(255,255,255,.15)`, rayon 10, padding 4×18 ;
     - mots-clés : `#fb2929` pour la douleur, `#0fe2bc` (ou le teal de notre marque) pour Claude, `#16fb17` (ou l'orange de notre marque) pour le résultat ;
     - fins de phrase en Playfair Display 900 minuscules ;
     - en français, ≤ 22 caractères par ligne.
   - Remotion :
     - découper le JSON Whisper / ElevenLabs en chunks de ≤ 3 mots ;
     - la 2ᵉ ligne apparaît à `word.start` ;
     - changement sec, sans animation (au plus un pop de 2 frames) ;
     - un `emphasis` map `{mot: 'red'|'teal'|'lime'|'serif'}` écrit dans le script.

5. **Graphiques méta : nos vraies données à l'écran.**
   - Notre transcript (table mot → timings) ;
   - notre compteur de coupe (ex. 92,4 s → 46,1 s, blocs rouges qui s'effondrent, pilule « VITESSE VOIX 1.00× ») ;
   - notre piste de captions ;
   - notre mix (« musique −12 dB sous la voix ») ;
   - notre liste de cues SFX ;
   - notre `scene > 0.3` sur LE reel de référence (« 29 coupes, 0,67 coupe/s »).
   - Remotion :
     - compteur : `interpolate(frame,[a,b],[92.4,46.1],{easing: Easing.out(Easing.cubic)}).toFixed(1)` ;
     - blocs : largeur animée vers 0 dans un flex, pour que la forme d'onde se resserre toute seule ;
     - les données sont lues depuis les JSON produits par le pipeline. C'est vrai, et c'est ce qui rend le reel crédible.

6. **Terminal « Claude Code » ligne par ligne, avec nos vraies commandes.**
   - Contenu : `yt-dlp …`, `ffmpeg -vf "select='gt(scene,0.3)'"`, `python transcribe.py → 203 mots`, `eleven tts → voix.wav`, `npx remotion render`, `✓ 4 agents en parallèle`. Pour illustrer les agents en parallèle : 3 ou 4 mini-terminaux en grille qui défilent ensemble.
   - Remotion : un tableau `{text, at}` ; chaque ligne apparaît avec opacité 0→1 et y +8→0 sur 4 frames. Carte `#141316`, rayon 36, feux tricolores, JetBrains Mono 46 px, sorties `#a1a0a3`, ✓ `#4ed686`. SFX « air-slide » à l'ouverture.

7. **Tampons ✕ / ✓ calés sur un stop-down de la musique.**
   - Contenu : ex. « ✕ PAUSE » / « ✓ GARDÉ » sur notre rush, ou « ✕ COPIÉ » / « ✓ ADAPTÉ » sur l'analyse du reel de référence.
   - Remotion : `spring({frame: f - at, config: {damping: 14, stiffness: 400}})` pour scale 1.3→1 et opacity 0→1 en ~3 frames, `rotate(-6deg)`, bordure 6 px, Montserrat 900. Couper la musique ~0,5 s autour (automation de `volume` ou dans notre mixer offline) pour que le SFX claque.

8. **Musique : lit statique à −12 dB, entrée sur le reveal, stop-downs avant les révélations.**
   - Contenu : un beat basse-lourd ~140/70 BPM (morceau fourni par l'utilisateur ou stock, voir mémoire), sans pompage sidechain. Placer 3 ou 4 silences de 0,5 s juste avant les moments clés (tampon, inversion en clair, mur de reels), suivis d'un temps fort sur la coupe. Master −14 LUFS, true peak −1 dBTP. SFX courts et doux (feutre, verre, pop) entre −9 et −25 dB. **Jamais par-dessus un mot important** (leçon de la mémoire).
   - Réalisation : dans le mixer offline existant (ffmpeg `volume` avec enable/expressions ou numpy). Vérification avec `ebur128` et `refaudio2.py` (écart voix/musique ≈ 11–12 dB).

9. **Caméra qui respire et punch-ins.**
   - Contenu : push-in lent permanent de 1,02 à 1,06× par plan (≈ 2 %/s) sur le speaker comme sur les graphiques. 3 ou 4 gros plans plein écran (~1,6–1,8× de crop) sur les phrases fortes et le CTA. Attention : en 1080p source, limiter le crop à ~1,4× ou filmer en 4K.
   - Remotion : `transform: scale(interpolate(f,[0,dur],[1,1.04]))` en `transformOrigin: '50% 40%'` sur chaque `Sequence`.

10. **Interruption de pattern « mode clair » à environ 2/3 du reel.**
    - Contenu : une seule scène sur fond `#f2ede8` avec une carte blanche (ex. « Les skills de ce reel » ou « Le brief envoyé aux agents »), des tags colorés (violet / bleu / vert / ambre) et des lignes en décalé de 0,2 s.
    - Remotion : la carte entre par un `spring` (y +40→0, scale 0.96→1, ~150 ms), ombre `0 30px 60px rgba(0,0,0,.08)`, Inter 600.

11. **Mur de preuve + pellicule image par image** (c'est notre étape « Claude analyse le reel »).
    - Contenu : une grille 4×5 de nos reels (épisodes DevOps45, trailer, etc.) qui jouent tous ensemble. Puis une pellicule des frames du reel de référence avec timecodes 0,25 s et un cadre teal qui saute de vignette en vignette (« image par image »).
    - Remotion : **pré-rendre** la grille en MP4 avec ffmpeg `xstack` (20 `OffthreadVideo` en parallèle, c'est lourd). Pellicule : nos planches 2 fps / 10 fps (le dossier `refs/Deg4HQMBJY3-frames/`), avec `translateX` animé et un cadre `border: 6px solid #0fe2bc` en `spring`.

12. **Nuage de skills + repo, puis CTA par mot-clé.**
    - Contenu : des pilules `/reel-pro-edit /devops45-reel /aura-trailer /cinematic-motion-teaser /embedded-captions …` qui popent sur un collage assombri (fond `#103049`, bordure `#447d9d`). Puis un screen recording du repo ou du SKILL.md en push-in. Fin en gros plan : « Commente « REEL » et je t'envoie le kit » avec le mot-clé en lime ou orange.
    - Remotion : chaque pilule entre en `spring` décalé de 2 frames. Screen recording en `OffthreadVideo` (ou une capture longue) avec `translateY` et `scale` animés.

**À ne pas copier tel quel :** leur jaune-vert lime (#16fb17) jure avec notre charte teal/orange. On garde la logique « une couleur = un sens » avec nos couleurs : teal = Claude / pipeline, orange = résultat, rouge = problème.
