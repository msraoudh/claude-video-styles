# Archetypes — what each scene type shows, its data, its limits, its sound

Components live in `assets/template/video/src/archetypes/<type>/` (copied into every episode). Every field is
optional-safe (missing → sensible fallback, unknown icon → fallback glyph). `on` = a word spoken in THAT scene (prefix
match, accents ignored) where the beat lands; without it, beats spread over the scene's speech. Sounds come from
`scripts/cues.py` (same timing rules as the components) — you never cue archetypes by hand.
Layout: content stays in y 240–1262 (HUD above, captions below), right edge ≤ 940 below y 1000.

## Series pieces (fixed every day)
- **hook** (first scene, captions on): `{line ≤ 60 (on-screen hook, 3 lines max), accent? (a word of line → amber when
  spoken), sub? (mono kicker, default title.kicker), icon? (Phosphor name)}`. Glass icon tile flies in from frame 0,
  line words land on the spoken words, radar rings on the beat, CRT suck-in into the ident.
  Sound: whoosh (tile), glint (land), glint (accent), suckin END on the cut.
- **title** (auto-inserted series ident, 1.15 s silence, music DROP on its first frame): reads `title {kicker, line ≤ 34,
  command? ≤ 40}` + `number`. 3D glass « DEVOPS EN 45 SECONDES » lockup, cyan ring + amber 45, episode chip, title line,
  command typed. Sound: director basshit on the drop, glass (+5), glint (+13), typing, whoosh out.
- **HUD** (global, body scenes only): small ring counting 45 → 00 top-left + chip « ÉP. N · KICKER ». No sound.
- **cta** (last scene, captions off): « Abonne-toi » amber pill on « abonne », tap on « -toi », ring + « Cloud DevOps MSR
  Community » on « cloud », handle typed, « Une leçon par jour · 45 secondes » word by word, recap chip (`$ command` or
  title line; `data.recap` overrides). Ring completes on the final hit (director impact). Sound: whoosh, tap, whoosh,
  typing, ui-pop (45), riser END on the final hit, glass.
- **Cover** (Instagram cover still): the episode's title big (part after « : » in cyan) + up to 6 logos of its tools +
  the handle — NO series lockup (user, 2026-10-22). All inside the central 1080×1080.
- **Hook tools**: every tool NAMED in the hook's speech (≤ 4, not the tile's logo) flies in from the left/right on its
  word — spin, motion trail, overshoot, shockwave + sparks — and parks around the tile. Automatic. Sound: whoosh + ui-pop.

## Body archetypes
- **tool** — THE way to say what a tool does (the user's rule: every tool animated doing its job). `{heading? ≤ 24,
  items: [{tool: "<logo key>", label? ≤ 34 (what it does, French), on? (its spoken name)}] (1–3)}`. Each item's
  animation from `video/src/toolfx/` (docker, kubernetes, git, github, vscode, githubactions/jenkins/gitlab = CI robot,
  terraform, prometheus, grafana — add more with `references/toolfx-brief.md`) flies in on its word, from the right
  (items 1, 3) or the left (item 2), with motion blur, trail, streak, flare and sparks; the previous one is thrown out.
  Under it: logo chip + tool name (mono cyan) + the label word by word. Give each item ≥ 1.8 s of speech.
  CONCEPT keys (no logo, same archetype): culture, automation, measure, sharing, recipe (`toolfx` CONCEPT_FX).
  `beats: ["<word>", …]` = the animation's phase words (e.g. measure: ["site", "livraisons", "chiffres"]) — set it
  when an animation has phases, so each phase lands on its spoken word. Sound: whoosh
  + glass per item, then the animation's own moments (`toolfx/<file>.sfx.json`).
- **terminal** — the « geste » command. `{command ≤ 40 for this series (wraps with « \ » if longer), on? (typing start),
  enter_on?, output?: [string | {text ≤ 75, tone: dim|ok|warn|accent, on?}] (0–4 lines here), commands?: [{command, on,
  enter_on, output}] (max 2), note?: {text, on?, line?} (amber callout on an output line), copy? (default true: « copier »
  click + « copié ✓ »), copy_on?, tab? (default « toi@serveur: ~ »), shell?}`. Give at least one output line (an empty
  terminal is a thin strip). Sound: whoosh, typing, ui-click Enter, ui-pop per `on` line, tap + glint on copy, ui-pop note.
- **code** — a config file. `{file, lang (yaml|hcl|dockerfile|conf|json|bash, guessed from file), lines: string[] (≤ 8
  here, 18 max, ~48 chars), highlight?: [{line (1-based), on?, fix?, fix_on?}] (1–3)}`. Amber band on the highlighted line;
  with `fix` the old line is struck and the new one typed, green check « ✓ corrigé ». Sound: whoosh, cards, glint per
  highlight, typing + check on a fix.
- **steps** — numbered checklist / click path / action plan. `{heading? ≤ 28, items: [{text ≤ 40, on?, sub? ≤ 44}] (2–5),
  try?: true (marks it as the geste du jour)}`. Ghost slots from the start, each step lands on its word, checks, progress
  « n/N ». Sound: whoosh, ui-pop per step, check + glint at the end.
- **cards** — 1–5 key ideas / flags / parts. `{heading?, items: [{icon?, label ≤ 16 ideal, detail? ≤ 28, on?}]}`. Layout
  by count (1 hero, 2 side by side, 3 rows, 4 grid, 5 slim rows); a command heading types with `$` and lights each flag.
  Sound: cards, typing (command heading), whoosh + glass per card.
- **compare** — `{mode: "vs" | "before_after", left: {label ≤ 20, points: [≤ 30] (1–3), icon?, on?, tag?}, right: {…},
  verdict?: {text, on?, accent?}}`. Stacked panels; before_after = grey struck AVANT → cyan checked MAINTENANT; vs = cyan vs
  periwinkle with a VS badge; verdict pill with ONE amber key word. Sound: whoosh, ui-pop, zoom-swish, taps/checks,
  basshit + glint on the verdict.
- **myth** — `{myth ≤ 60, fact ≤ 60, on? (the strike), accent?}`. Myth condenses from a blurred wall of clichés, glitches
  and is struck on `on`, the fact rises « EN VRAI » with a cyan check. Sound: suckin END on the strike, basshit, whoosh,
  check + glint.
- **analogy** — `{thing: {icon, label}, like: {icon, label}, because? (short line), on?}`. Tech card (cyan, « CÔTÉ TECH »)
  ↔ everyday object (amber, « DANS LA VRAIE VIE »); the icon flies and morphs on `on`; « = » becomes « ≈ comme » on the
  spoken « comme »; doors open, bulbs light. Best friend of concept episodes. Sound: ui-pop, ui-click (comme), whoosh,
  glass, glint.
- **flow** — a path / pipeline / architecture. `{nodes: [{label ≤ 18, sub?, icon?, on?}] (2–6), direction?: "down" |
  "right", packet? (default true), loop?, heading?}`. Ghost chips, a light packet draws each link and arrives on the word,
  the node turns amber. Sound: glass (first node), whoosh + ui-pop per node, glint on the final sweep.
- **stat** — one big sourced number. `{value (number | "99.9" | "p99"), unit?, prefix?, label ≤ 40, on?, context?
  (source line), series?: number[] (sparkline)}`. Slot-machine digits land on `on`. Sound: riser END on landing, basshit,
  impact, glint (context).
- **incident** — a calm outage timeline. `{timeline: [{time?, text ≤ 36, tone: warn|ok|info, on?}] (2–4), lesson?: {text,
  on?} | string, title? (default « Incident »), where? (default « prod »)}`. An `ok` row after warn rows heals them (green
  wave, « résolu ✓ »); the lesson lands as « À RETENIR ». Give the lesson its own word, with ≥ 1 s of speech after it.
  Sound: ui-pop/tap per row, check + glass on the fix, cards + glint on the lesson.
- **custom** — `{component: <key in src/scenes/index.ts CUSTOM>}`; only when nothing above can show the idea; write its
  cues in `video/src/data/cues/<id>.json`.

**Logos first:** any `icon` (and the hook's `logo`) set to a logo key of `kit/logos.ts` — `docker`, `kubernetes`, `git`,
`githubactions`, `gitlab`, `jenkins`, `terraform`, `ansible`, `argocd`, `prometheus`, `grafana`, `nginx`, `linux`, `aws`,
`ec2`, `s3`, `iam`, `vpc`, `rds`, `elb`, `autoscaling`, `lambda`, `cloudwatch`, `route53`, `eks`, `devops`… (aliases work:
« Docker », « k8s », « Amazon EC2 ») — draws the REAL logo. A label that names a tool also gets its logo via
`catalog/assign_logos.py`.

Icons: the archetypes carry ~80 line glyphs with aliases (Globe, Database, Server, Plugs, Door, Shield, Key, Cloud,
GitBranch, Package, Rocket, Bell, ChartLine, Users, Briefcase, GraduationCap, Certificate, Lightbulb…) + the kit's
Phosphor set; anything unknown falls back cleanly.
