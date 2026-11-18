# Analyse du reel de référence DemwzTPJK6J — « Monter une vidéo avec Claude »

Source : https://www.instagram.com/p/DemwzTPJK6J/ (compte « SIMPLIF.IA », filigrane visible en haut à droite)
Fichier : `refs/DemwzTPJK6J.mp4` · transcript Whisper : `refs/DemwzTPJK6J-transcript.json` · images : `refs/DemwzTPJK6J-frames/`

## 0. Mesures techniques

| Mesure | Valeur |
|---|---|
| Format | 1080×1920, 9:16, VP9, **30 fps**, 1200 frames, **40,0 s** |
| Débit | ≈ 200 kb/s vidéo (fichier 1,2 Mo) : fond plat et éléments statiques, donc très compressible |
| Audio | AAC 48 kHz stéréo, **L = R (mono)** (la différence L−R mesurée est −inf dB) |
| Loudness | **−14,2 LUFS intégré**, true peak **−1,5 dBTP**, LRA **1,7 LU** (très compressé, régulier) |
| Langue | Français (Whisper large-v3, p = 0,9995), voix masculine (F0 médian ≈ 98 Hz) |
| Débit de parole | 128 mots en 39,1 s, soit **3,3 mots/s** (≈ 195 mots/min, rapide) |
| Plans | **14 plans** en 40 s, soit **0,35 coupe/s**, durée moyenne 2,9 s (de 0,7 à 5,6 s) |
| Changements visuels | 1 mot de sous-titre nouveau toutes les ~0,3 s et 1 élément graphique nouveau toutes les ~0,7 s : jamais plus de ~0,5 s sans rien qui bouge |

ffmpeg `select='gt(scene,0.3)'` ne trouve **aucune** coupe, et même à 0,1 il n'en trouve qu'**une** (17,93 s). Tous les plans partagent le même fond crème, donc les coupes ne se « voient » pas pour le détecteur. Le relevé des plans ci-dessous a été fait à la main sur des bandes à 30 fps.

## 1. Hook (0–3 s)

- **Vu, dès la frame 0** (aucun fondu d'ouverture, la 1re frame sert de couverture) : un kicker « TUTO POUR DÉBUTANTS » (sans-serif capitales, interlettrage large, terracotta) puis un titre serif condensé sur 3 lignes, « Monter une / vidéo avec / *Claude* ✳ ». « Claude » est en italique terracotta, suivi de l'astérisque-soleil de Claude. Dessous, un **motif de timeline de montage** : 4 blocs-clips terracotta (#D58A73) et une **tête de lecture noire qui glisse en linéaire** sur les 4 clips pendant 2,27 s (≈ 240 px/s). C'est le seul mouvement, et il dit « montage vidéo » sans un mot.
- **Entendu** : la voix attaque à 0,00 s, sans musique ni intro : « Comment monter une vidéo avec Claude ? » (0,00–1,82).
- **Écrit** : le sous-titre défile mot par mot (« Comment » → « Comment *monter* » → « *monter* une vidéo » → « vidéo avec *Claude* »).
- 2,27 s : coupe sèche sur « C'est super simple » (« Super *simple.* » centré). À 3,43 s, le bloc saute d'un coup de ~300 px vers le haut pour laisser place à « seulement » (petit gris), à un **« 7 » géant** (~440 px de haut, terracotta) qui pop à 3,70 s, puis à « étapes ».
- **Mécanique** : la promesse est **chiffrée** (« seulement 7 étapes »), ce qui ouvre une boucle (le spectateur compte les étapes) et la barre de progression la matérialise ensuite.

## 2. Structure plan par plan

Le timecode de coupe est la frame où l'image change. Chaque coupe tombe **0 à 2 frames après la reprise de la voix**, à la fin d'une pause de 0,3 à 0,5 s (pauses mesurées avec `silencedetect` à −60 dB).

| # | In–out (s) | Écran | Voix (Whisper) |
|---|---|---|---|
| 1 | 0,00–2,27 | Hook : kicker + titre 3 lignes + timeline 4 clips avec tête de lecture | « Comment monter une vidéo avec Claude ? » |
| 2 | 2,27–3,43 | « Super *simple.* » centré | « C'est super simple, » |
| 3 | 3,43–4,83 | Re-layout en saut, « seulement », **7** géant (pop 3,70), « étapes » | « seulement sept étapes. » |
| 4 | 4,83–6,37 | **Étape 1 « Ouvre *Claude* »** : fenêtre Claude vide, puis « ✳ On monte quoi aujourd'hui ? » qui apparaît sur le mot « ouvre » (5,8 s) | « Un. Ouvre Claude. » |
| 5 | 6,37–10,35 | **Étape 2 « Guide de *style* »** : carte « MA MARQUE / GUIDE DE STYLE » (en-tête terracotta, 5 lignes cochées) qui entre sur « guide » (7,2 s) ; puis, sur « vidéos de référence » (8,5–9,0), les cartes **Réf. 1 / 2 / 3** (vignettes de reels) arrivent de la droite **en éventail**, et la dernière déborde du cadre à droite | « Deux. Prépare ton guide de style, ou les vidéos de référence que tu veux. » |
| 6 | 10,35–13,55 | **Étape 3 « Skill de *montage* »** : carte `SKILL.md` avec badge « installée » ; le YAML et les étapes se **tapent** (`name: montage-video` / `description: monte tes rushs en suivant ton guide de style` / `1. Lis le guide de style` / `2. Suis la vidéo de référence` / `3. Coupe à chaque phrase` / `4. Musique…`) avec une barre de surlignage sur la ligne en cours | « Trois. Si tu as une skill de montage vidéo, ajoute-la aussi. » |
| 7 | 13,55–17,93 | **Étape 4 « Prépare tes *rushs* »** : grille 3×2 de vignettes en cascade (14,1 → 14,9), puis carte « Photos » sur « photos » (16,0) et carte « Son » avec waveform terracotta sur « son » (16,6) | « Quatre. Prépare tes rushs et tes éléments, comme des photos ou du son. » |
| 8 | 17,93–20,23 | **Étape 5 « Envoie *tout* »** : fenêtre Claude dont les pièces jointes (chips) arrivent une à une toutes les ~0,25 s : 📘 Guide de style · 🎨 Réfs de style · 📄 SKILL.md · 🎬 Rushs ×6 · 🖼️ Photos + son | « Cinq. Envoie tout à Claude. » |
| 9 | 20,23–25,83 | **Étape 6 « Demande à Claude de *monter* »** : le prompt « Monte ça en suivant mon guide de style » se tape dans l'input (20,9 → 23,6 s, ~14 caractères/s), le chip « ⚡ montage-video » s'attache sur « skill » (24,0), l'envoi crée la bulle utilisateur (24,4), et la réponse « ✳ Je lis ton guide de style… » arrive à 25,0 | « Six. Demande à Claude de monter la vidéo, en suivant ton guide de style, ou la skill que tu as installée. » |
| 10 | 25,83–29,87 | **Étape 7 « Attends le *résultat* »** : anneau vide « en général … minutes », puis **comptage 0 → 30** avec l'arc qui se remplit (26,3 → 27,5, ease-in-out : 4 à 26,5 s, 27 à 27,0 s) ; pills « Opus / Sonnet / Haiku » en cascade sur « modèle » (28,5–29,0) | « Sept. Attends, en général une trentaine de minutes, selon le modèle. » |
| 11 | 29,87–32,93 | **Bonus** (barre de progression grisée, pas de « Étape N ») « Une retouche ? *Redemande* » : bulle « Fais une intro plus rapide » (30,4), barre de rendu qui se remplit (31,0 →), réponse « ✳ C'est fait. Intro coupée à 2 secondes ✓ » (31,3) avec un **ding** | « Besoin d'une retouche ? Redemande, tout simplement. » |
| 12 | 32,93–33,63 | **Récap « C'est *tout* · 7 étapes »** : checklist des 7 étapes, une ligne toutes les 2 frames, chaque ligne avec rond numéroté et ✓ (clics SFX) | « C'est tout. » |
| 13 | 33,63–36,07 | **CTA 1 « Enregistre. »** + signet terracotta en fondu (pâle → plein en 5 frames), « pour ne pas oublier » (34,5) | « Enregistre cette vidéo pour ne pas l'oublier. » |
| 14 | 36,07–40,00 | **CTA 2 « Commente MONTAGE »** (pill terracotta, sans-serif noir très gras, blanc), « Je te les envoie en privé 📩 », chips « 📘 Guide de style » sur « guide » (37,9) et « ⚡ La skill » sur « skill » (39,0, ding). **Pas de sous-titre sur cet écran** | « Commente "Montage" et je t'envoie le guide de style et la skill. » |

Whisper ajoute un faux « 8. » à 29,02 s (probabilité 0,0) : la voix ne le dit pas, la retouche est un bonus hors numérotation.

## 3. Layout

**100 % faceless, plein cadre, une seule « scène » éditoriale.** Pas de speaker, pas de split, pas de PiP, pas de B-roll filmé et pas de vraie capture d'écran : tout est de l'UI **reconstruite en vectoriel** (fenêtre Claude, carte SKILL.md, cartes). La seule « vidéo » visible, ce sont les vignettes de reels de l'auteur (Réf. 1–3, grille des rushs).

Grille verticale fixe des écrans « étape » (frame 1080×1920) :

| Zone | y (px) | Contenu |
|---|---|---|
| Marge haute (UI Instagram) | 0–210 | vide |
| Barre de progression | **≈ 232** | 7 segments de 120×4 px, gouttière 14 px, x = 81 → 1001 ; actif #D07258, inactif #E2E2D8 |
| Kicker | ≈ 262–290 | « Étape N » (terracotta, ~26 px, à gauche x = 81) · « S I M P L I F . I A » (gris #A9A59C, ~18 px, tracking ~0,4 em, aligné à droite x = 1000) |
| Titre | ≈ 305–395 | serif ~100 px, **aligné à gauche** x = 81, noir + mot-clé italique terracotta |
| Respiration | 400–720 | vide (la lueur du fond est là) |
| **Scène graphique** | **≈ 720–1370** | un objet centré par étape, ~780–820 px de large (fenêtre 150 → 930) |
| Sous-titre | **centre ≈ 1443** (75 % de la hauteur) | 1 ligne centrée |
| Marge basse (UI Instagram) | 1500–1920 | vide |

Les écrans hook, « Super simple », Enregistre et CTA sont des **compositions centrées** (titre au centre vertical ≈ y 650–1000) et n'ont ni barre de progression ni kicker. Le bonus et le récap gardent la barre mais **toute grise** : on sort du compte.

## 4. Vocabulaire motion design

**Éléments :**
- **Fenêtre « Claude » style macOS** : carte blanche #FCFFFF, rayon ~28 px, filet de 1 px, ombre douce et large (~0 20 px 60 px, noir à ~8 %). Barre de titre avec feux tricolores (#FF5F57 / #FEBC2E / #28C840), « ✳ Claude » gris centré, séparateur. Accueil « ✳ On monte quoi aujourd'hui ? » (sans gras ~30 px). Input pill #F7F8F3 « Écris à Claude… » avec bouton d'envoi carré arrondi (beige quand l'input est vide, terracotta quand du texte est tapé). Bulle utilisateur #F8E4DB alignée à droite. Chips de pièces jointes #FBDED9 avec texte terracotta et emoji. Réponse de Claude avec l'astérisque terracotta à gauche.
- **Carte fichier `SKILL.md`** : en-tête avec icône fichier + nom en mono, badge « installée » (pill rose pâle) ; corps en monospace ~22 px, clés YAML en terracotta, valeurs en gris, étapes en noir ; **surlignage beige de la ligne en cours**.
- **Carte « Guide de style »** : en-tête plein terracotta #CF6F56 avec « MA MARQUE » (petit, tracking) et « GUIDE DE STYLE » (sans-serif noir très gras, blanc) ; liste à puces avec cases ✓ en rose pâle.
- **Cartes vignettes** en éventail superposé (Réf. 1/2/3) et grille 3×2 avec rayon ~16 px et ombres.
- **Cartes « Photos » (illustration plate : dôme terracotta #BE513C, soleil #EFDB60, dégradé #ECBBA8) et « Son » (waveform en barres terracotta).**
- **Anneau de compteur** (Ø ~460 px, trait ~20 px, piste #E8E3DA, arc terracotta), gros chiffre serif ~170 px, « en général » au-dessus et « minutes » en gras dessous ; pills blanches à ombre (Opus/Sonnet/Haiku).
- **Barre de rendu** dans la fenêtre (piste beige, remplissage terracotta), **checklist récap** (ronds numérotés terracotta, ✓ à droite), **icône signet** plein terracotta, **pill CTA** (rayon ~28 px).
- Pas de 3D, pas de flèches, pas de glassmorphism, pas de glow coloré, pas de particules. Le style est **papier / éditorial**, la profondeur vient seulement des ombres portées douces.

**Entrées et sorties (mesurées frame à frame à 30 fps) :**
- **Changement d'étape = coupe sèche**, sans transition ni whoosh. Le titre apparaît en **fondu de 2 à 3 frames** (~80–100 ms), quasi instantané.
- **Objet principal de la scène** : opacité 0→1, **scale ~0,96→1**, translateY ~+12 px→0 et **flou ~6 px→0** en **5–6 frames** (~180 ms), ease-out, sans rebond visible.
- **Les sous-éléments arrivent sur le mot prononcé** (le mot qui les nomme) : pas de « build » décoratif, chaque apparition est motivée par la voix.
- Groupes en **stagger** : cartes Réf. ~5 frames (glissent de la droite ~60 px avec fondu), grille ~4 frames (pop scale ~0,9→1 avec la couleur qui « sature » en entrant), checklist récap **2 frames** par ligne (entrée floutée, voir `strip-recap-cascade.jpg`), chips des pièces jointes ~7 frames.
- **Typewriter** : prompt de chat ≈ **14 caractères/s** (rythme humain) ; code `SKILL.md` ≈ **50 caractères/s** (rapide).
- **Compteur** 0→30 en ~36 frames, ease-in-out, synchronisé avec l'arc.
- **Re-layout « en saut »** à 3,43 s : le titre saute de ~300 px en 1 frame. C'est le seul détail « brut » du reel.
- **Sorties : aucune.** Tout disparaît sur la coupe suivante. Sur les CTA, le plan entier entre en fondu de ~5–6 frames (fade-through du fond crème) avec un léger scale ~0,92→1 sur la pill.
- **Caméra : zéro mouvement.** Pas de zoom punch, pas de pan, pas de shake ni de parallaxe. Le fond est **statique** (PSNR 55 dB entre les frames 10 et 1190 sur la bande basse).

**Couleurs (échantillonnées) :**

| Rôle | Hex |
|---|---|
| Fond crème | #F6F6EC (bords), lueur centrale #FDFEF9, bas chaud #F3F0E7, coin bas-gauche #E9DFD3, coin bas-droit #F0ECE1 |
| Terracotta (accent unique) | **#CF6F56 / #D07258** (≈ la couleur de marque de Claude) ; variante claire des clips du hook #D58A73 |
| Encre | noir chaud ~#1C1B18 ; gris secondaire ~#8A877F ; gris filigrane ~#A9A59C |
| Surfaces | carte #FCFFFF, input #F7F8F3, bulle #F8E4DB, chip #FBDED9, segment inactif #E2E2D8 |

Le fond est un **dégradé radial ovale vertical** (lueur blanche centrée vers y ≈ 33 %, ~60 % L × 55 % H), avec des taches chaudes floues en bas à gauche et en bas à droite et de très légers arcs concentriques à ~3 % de contraste (visibles en contraste poussé : `bg-contrast.jpg`).

**Typographie :**
- **Display** : serif condensé à fort contraste, romain noir + **italique terracotta pour le mot-clé**. C'est très probablement **Instrument Serif** (Google Fonts) ; alternatives : Editorial New, Tiempos Headline Condensed. Tailles : hook ~140 px (hauteur de capitale ~97 px, interligne ~1,05) ; titres d'étape ~100 px ; « Super simple. » ~120 px ; « 7 » ~440 px de haut ; « 30 » ~170 px.
- **UI / sous-titres** : grotesque neutre, probablement **Inter** (Semibold/Bold) ou SF Pro. Sous-titre ~46 px bold (capitale ~33 px).
- **Impact** (« MONTAGE », « GUIDE DE STYLE ») : grotesque noire très grasse, type **Inter Black / Archivo Black**, en capitales.
- **Mono** (`SKILL.md`) : JetBrains Mono ou SF Mono, ~22 px.
- Système à 2 voix : **serif = le « quoi »** (titre), **sans = la parole** (sous-titre, UI).

**Sous-titres (relevés toutes les 3 frames, `caps-0-12.png` et `caps-12-36.png`) :**
- **1 ligne, centrée, y ≈ 1443**, sans gras ~46 px, noir, **sans fond, sans contour, sans ombre**.
- **Fenêtre glissante des 3 derniers mots** de la phrase : « Comment » → « Comment monter » → « Comment monter une » → « monter une vidéo » → « une vidéo avec » → « vidéo avec Claude ». **Remise à zéro à chaque nouvelle phrase** (« C'est » seul).
- Le mot apparaît **au début du mot prononcé**, en pop sec (pas d'anim, pas de scale, pas de karaoké).
- **Mot-clé en terracotta**, et c'est presque toujours le même que l'italique du titre : monter, Claude, simple, guide de style, référence, skill, rushs, photos, son, tout, attends, trentaine, modèle, retouche, simplement, Enregistre, l'oublier.
- Le sous-titre double la voix ; le titre résume l'étape ; l'UI la montre. La **redondance est triple**, et le reel se comprend en muet.

## 5. Transitions, caméra, B-roll

- **0 transition** (coupe sèche partout), sauf les 2 CTA en fondu court depuis le fond. Comme le fond est le même partout, les coupes semblent n'être que des changements d'état d'une seule page.
- **0 mouvement de caméra** et **0 B-roll filmé**. Pas d'enregistrement d'écran réel : les « captures » sont des mockups vectoriels nets, donc lisibles même compressés à 200 kb/s.
- Les vignettes de reels (Réf. 1–3, grille des rushs) font la **pub des autres contenus** de l'auteur.

## 6. Sound design

- **Voix seule, mono, aucune musique** (les silences entre phrases sont du **silence numérique** à −120 dB sur le spectrogramme, sans aucun lit sonore). Ça ressemble à une voix TTS (type ElevenLabs) ou à une VO très gatée : pas de ton de pièce, énergie très constante (RMS par tranche de 2 s entre −13,1 et −15,8 dB).
- Pauses : 0,09–0,52 s, et **~0,45–0,52 s avant chaque nouvelle étape**. La coupe tombe à la reprise de la voix, comme si l'image « répondait » à la voix.
- **Seulement 3 SFX, tous dans les 10 dernières secondes**, tous discrets (~20 dB sous la voix ; le ding final crête à −18 dBFS, RMS −36 dBFS) :
  1. 31,2–31,75 s : **ding sinus doux ~1,8 kHz** (+ partiel ~4,4 kHz) à la réponse « C'est fait » de Claude ;
  2. 32,9–33,45 s : **rafale de petits clics à hauteur montante** pendant la cascade de la checklist récap ;
  3. 39,1–40,0 s : **ding ~1,8 kHz** à l'apparition du chip « La skill » / fin.
- Pas de whoosh sur les coupes, pas de riser, pas de drop ni de ducking (rien à ducker). Mix fort mais propre : −14 LUFS, −1,5 dBTP.

## 7. Pourquoi ça retient

1. **1re frame = couverture lisible** (pas de fondu), avec une promesse précise et la marque Claude : on sait en 0,5 s de quoi il s'agit et que c'est « pour débutants ».
2. **Promesse chiffrée « seulement 7 étapes »** avec un 7 géant, puis une **barre de progression façon stories** : le spectateur voit combien il en reste, ce qui réduit l'abandon.
3. **Une étape = un titre court « verbe + *mot-clé* »** : lisible en muet, et le scroll s'arrête sur une idée par écran.
4. **Micro-changement permanent** : un mot toutes les ~0,3 s, un élément toutes les ~0,7 s, des coupes toutes les ~3 s ; l'œil a toujours quelque chose de neuf.
5. **Démo de produit « crédible »** : la vraie grammaire de l'UI de Claude (prompt tapé, pièces jointes, « Je lis ton guide de style… », « C'est fait ✓ »), donc *show, don't tell*.
6. **Le bonus hors compte** (« Une retouche ? Redemande ») sur-délivre juste avant la fin.
7. **Récap éclair** (7 lignes en 0,7 s avec des ✓) : effet « checklist à garder », ce qui déclenche l'**enregistrement**.
8. **Double CTA** : d'abord *Enregistre* (signet), puis *Commente MONTAGE* avec un **lead magnet** nommé et montré (guide de style + skill en DM, type ManyChat). Les commentaires boostent la distribution.
9. **Esthétique premium et calme** (crème, serif, une seule couleur d'accent, zéro musique) : ça tranche avec les reels criards du fil, et ça emprunte la crédibilité de la marque Claude.
10. **40 s et une VO rapide** (3,3 mots/s), sans temps mort.

## 8. « À copier pour notre reel » (et comment le faire en Remotion)

Contexte : notre reel montre le speaker face caméra (workflow « reel → analyse ffmpeg/Whisper → skills → script + voix ElevenLabs → motion Remotion → agents en parallèle → rendu »). On garde la **grammaire** de cette référence, et le visage vient en plus : speaker plein cadre sur le hook et le CTA, et les étapes en **cutaways plein cadre** sous sa voix (L-cuts), ou avec le visage en **pastille ronde** (~220 px) placée hors des zones titre et scène.

1. **Grille fixe « page éditoriale »** : composant `<StepFrame step={n} total={7} kicker="Étape n" title="Analyse" accent="ffmpeg">` aux y exacts (barre 232, kicker 275, titre 345, scène 720–1370, sous-titre 1443, marges IG 0–210 et 1500–1920). Tout se place en `position:absolute` depuis un objet `LAYOUT` partagé par tous les agents de scène, ce qui garantit la cohérence quand plusieurs agents produisent en parallèle.
2. **Barre de progression façon stories** : `<StepBar n total>` avec 7 `<div>` de 120×4 px, gap 14, le segment `i < n` en accent ; le segment courant se remplit via `interpolate(frame,[0,6],[0,1])` sur `scaleX` (origin left). Sur les écrans bonus/récap, tous les segments passent en gris.
3. **Coupe sèche calée sur la reprise de la voix** : `<Series>` dont chaque `<Series.Sequence>` démarre à `Math.round(onset*30)` (onset = fin du silence `silencedetect -60dB:d=0.08`, ou `start` Whisper du mot-numéro). On laisse ~0,45 s de pause dans la VO ElevenLabs avant chaque étape : avec Kev, insérer des pauses SSML/`<break time="0.45s"/>` ou couper les silences dans `mix.py`. Pas de whoosh.
4. **Titre serif + mot-clé italique accent** : `Instrument Serif` via `@remotion/google-fonts/InstrumentSerif`, romain ~100 px et `<em>` italique couleur accent. Entrée en opacité sur 3 frames (`interpolate(f,[0,3],[0,1])`), sans slide.
5. **Entrée standard « blur-in »** pour tout objet : hook `useEnter(start)` qui renvoie `{opacity, transform: translateY(12→0) scale(0.96→1), filter: blur(6→0px)}` sur 6 frames avec `Easing.out(Easing.cubic)`. Un seul preset réutilisé partout : c'est ce qui donne l'unité.
6. **Builds synchronisés sur le mot** : un helper `at("skill")` renvoie la frame du mot dans le JSON Whisper (word timestamps) ; chaque sous-élément a `start = at(mot)`. Règle : **un élément n'apparaît que quand la voix le nomme**.
7. **Sous-titres « 3 derniers mots »** : à partir des mots Whisper, regrouper par phrase, afficher `words.slice(max(0,i-2), i+1)` où `i` = dernier mot commencé ; police Inter Bold 46 px noire, sans fond, centrée y 1443 ; un `Set` de mots-clés passe en accent (le même mot que l'italique du titre). Pop sec, sans animation. (Composant custom plutôt que `createTikTokCaptions`, car il faut la fenêtre glissante et le reset par phrase.)
8. **Mockups d'UI reconstruits, pas filmés** : `<ClaudeWindow>` (feux tricolores, « ✳ Claude », input, chips, bulles), `<FileCard name="SKILL.md" badge="installée">`, `<Terminal>` pour nos commandes ffmpeg/Whisper. **Typewriter** : `text.slice(0, Math.floor((f-start)*cps/30))` avec caret clignotant, `cps = 14` pour un prompt « humain » et `50` pour du code/YAML ; barre de surlignage sur la ligne en cours. Pour nous : prompt « Analyse ce reel… », SKILL.md de `aura-trailer` / `reel-pro-edit`, sortie ffprobe tapée.
9. **Cascades et éventails** : `items.map((it,i)=> <Card style={useEnter(start + i*5)} />)` ; éventail Réf. 1/2/3 en `translateX(60→0)` + `rotate` léger, la dernière carte qui déborde du cadre à droite (ça crée de la profondeur sans 3D). Pour nous : les **agents en parallèle** en cartes qui arrivent en stagger de 4–5 frames, chacune avec un statut qui passe de « … » à ✓.
10. **Compteur + anneau** : SVG `<circle strokeDasharray={C} strokeDashoffset={C*(1-p)}>` avec `p = interpolate(f,[s,s+36],[0,1],{easing: Easing.inOut(Easing.cubic)})` et le chiffre `Math.round(p*N)` en serif géant. Pour nous : « 30 min de rendu », « 4 agents », « 12 s d'analyse ».
11. **Récap éclair + double CTA** : checklist des étapes, une ligne toutes les 2 frames avec un tick SFX dont le pitch monte (`<Audio playbackRate={1+i*0.06} volume={0.25}>`), puis « Enregistre. » + signet, puis « Commente *MOT* » en pill accent avec les chips du lead magnet qui poppent sur les mots (« le guide », « la skill »). À brancher sur notre automatisation DM (n8n/ManyChat).
12. **Sound design minimal et « UI »** : VO ElevenLabs Kev au premier plan, mastering −14 LUFS / −1,5 dBTP comme la référence, **aucun SFX sur les coupes**, 2–3 micro-sons seulement sur les moments de récompense (réponse de Claude « C'est fait », cascade récap, chip final), ~20 dB sous la voix. Si on garde une musique, un lit très bas qui ne masque jamais la voix (cf. nos leçons de mix).
13. **Hook = couverture** : 1re frame complète (pas de fondu), kicker capitales + titre serif 3 lignes + un motif qui *montre* le sujet (ici la timeline et la tête de lecture). Pour nous : une timeline Remotion (ou un waveform Whisper) avec une tête de lecture qui défile sous « Monter un reel avec *Claude* ✳ ». Puis la promesse chiffrée « seulement N étapes » avec un chiffre géant.

**À ne pas copier** : le saut de re-layout à 3,43 s (on le remplace par un ressort de 8 frames) ; le fond 100 % faceless (notre force est le visage du speaker, à intercaler).
