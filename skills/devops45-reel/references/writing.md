# Writing today's episode — « DevOps en 45 secondes »

Every day the workflow's Claude writes ONE episode for the faceless Instagram page **Your Page**
(@your_page) — one 45-second French DevOps/cloud lesson — and produces it with this skill.
**Today's topic comes from the syllabus** `catalog/plan.json` (90 topics in learning order, from 2026-10-21; episode n
airs on 2026-10-21 + n−1 days = n8n's `episode_number`; also readable as `catalog/catalog.csv`). Take that entry's
topic, segment and module, and write the script, hook, scenes and caption yourself, following this page. Past n = 90
(or if the brief brings an explicit `topic_override`), pick a new topic in the same spirit, never one already done.
Validate with `python3 catalog/catalog_check.py <project>/episode.json` (it knows the segment of each number).

## The user's direction (2026-10-21) — read twice
- The viewers are mostly **career switchers and beginners** (~70 %), plus juniors (~30 %). They must UNDERSTAND:
  what a thing is, why it exists (the problem before it), what a tool is for, who uses it and when, how it fits with
  the rest. **No tutorials, no flag lists, no sysadmin details.** One big idea per episode, told so a beginner gets it
  in 45 s and remembers it thanks to one visual / analogy.
- The catalog is a **progressive path** (`plan.json` order = air order, from 2026-10-21). An episode may assume the
  ideas of earlier episodes (server, cloud, container…) but never says « comme vu hier » — it must stand alone.
- Each episode keeps the series promise from the pinned intro (« une commande à copier, à tester le jour même ») in a
  VERY simple form — **le geste du jour**: ONE beginner-level thing to try, shown on screen near the end of the body:
  a short command (`git status`, `docker run hello-world`, `nslookup google.com`, `aws s3 ls`, `uname -a`), at most
  one or two options, or a concrete click (« Console AWS → Billing → Budgets → crée une alerte à 5 € » as a `steps`
  scene with `"try": true`), or for career episodes an action (« ajoute ton projet sur GitHub avec un README »).
- **AWS only** for cloud. CI examples: GitHub Actions and GitLab CI both appear (each has its own episode).

## Segments (title.kicker = the segment name, exactly)
| segment (kicker) | what it is | typical archetypes |
|---|---|---|
| `C'EST QUOI ?` | a concept + an everyday analogy + why it exists | hook · analogy · flow/cards · steps or terminal (geste) · cta |
| `OUTIL DU JOUR` | a tool: the problem it solves, what it does, who/when, where it sits in the chain, the geste | hook · compare (avant/après l'outil) or analogy · flow or cards · terminal · cta |
| `ÇA A CASSÉ` | a REAL famous outage, told calmly: what happened, why (simply), the lesson for the viewer | hook · incident · flow (what broke) · myth or cards (the lesson) · terminal/steps (geste) · cta |
| `AWS EN 45 S` | one AWS service: what for, the analogy, the beginner trap | hook · analogy · cards/flow · myth (the trap) · terminal/steps · cta |
| `A OU B ?` | two tools / approaches; when to pick which; the decision rule in one sentence | hook · compare (vs, with verdict) · cards or flow · terminal/steps · cta |
| `LE MÉTIER` | the job & switching careers in France: reality, roles, market, certifications, steps | hook · cards/steps/stat · compare · steps (geste = an action) · cta |
| `LE MOT DU JOUR` | one jargon word decoded (« la prod », « un rollback »…) so they're not lost in meetings | hook · analogy · cards or flow · myth/steps · terminal/steps · cta |

Outages (`ÇA A CASSÉ`): use the company's official postmortem / status page or a reputable report as sources; keep
numbers exact (dates, durations, money) and only those in `facts`; no blame, no mockery — the tone is « ça peut
arriver à tout le monde, voilà comment l'éviter ». `incident` timeline = 2–4 key moments.
Career (`LE MÉTIER`): French market (ESN, CDI, freelance/TJM, Île-de-France vs régions), only sourced and dated
numbers (APEC, Malt, Free-Work, Hays/Michael Page/Silkhom guides 2025–2026), « environ », honest and encouraging, no
promises. Certifications: check current official names/prices.

## Read first
- `C:\Users\YOU\.claude\skills\devops45-reel\references\episode-schema.md` — schema and rules.
- `C:\Users\YOU\.claude\skills\devops45-reel\assets\fixture\episode.json` — every archetype's `data` fields
  (the fixture's content is too technical for this catalog — copy its FIELDS, not its depth).
- `C:\Users\YOU\.claude\skills\devops45-reel\catalog\plan.json` — the syllabus: number, date, weekday, module,
  segment, topic, file name. Keep the topic and its place; sharpen the wording if useful.

## Script (the voice-over, read by an ElevenLabs French voice, « Kev »)
- **100–120 words in total**, CTA included (≈ 45 s). Count them; the checker enforces it.
- Sentence 1–2 = the **hook** (≤ 4 s spoken): a surprising fact, a question the viewer has, a mistake, a « tu as
  déjà entendu X sans comprendre ? ». Never « Bonjour », « dans cette vidéo », « aujourd'hui on va voir ». Copy it to `hook`.
- Then 3–6 body scenes, one idea each, 1–3 short spoken sentences per scene. Simple French, tutoiement, warm and
  direct; tech words in English as French engineers say them. Explain every tech word the first time in plain words.
- Last scene `cta`, `say` EXACTLY: « Abonne-toi à Your Page. Une leçon par jour, en quarante-cinq secondes. »
- Commands in speech are said simply (« tape git status »). Numbers that matter are written as they are spoken.
- `voice.tts` = the same words with 2–4 ElevenLabs tags among `[confident]`, `[warmly]`, `[softly]`, `[pause]`.
  Never phonetic respellings or IPA. `voice_id` `<YOUR_ELEVENLABS_VOICE_ID>`, `model` `eleven_v4`.

## Screen (scene `data`)
- Use the archetypes and their exact field names (fixture). Pick archetypes that SHOW the idea; 3–5 different ones
  per episode; the analogy archetype is your best friend for concepts, flow for « where it sits / how it travels ».
- On-screen text is short: labels ≤ 20 chars, lines ≤ 40 (hard limit 60), terminal output ≤ 75 chars per line and
  ≤ 4 lines, code ≤ 8 lines. The screen shows the THING (the analogy, the diagram, the number, the command).
- `terminal.command` ≤ 40 chars, ≤ 2 options. Realistic, short output (or none).
- `on` = a word of THAT scene's `say` (prefix ok, accents ignored) where the item appears. Every item gets one, in order.
- Icons (Phosphor): Terminal, Database, Cloud, Shield, Lock, Key, Globe, Cpu, HardDrives, GitBranch, GitMerge, Package,
  Cube, Stack, Gear, Bell, ChartLine, Clock, Warning, CheckCircle, Bug, Lightning, Users, User, FileText, Folder, Rocket,
  ArrowsClockwise, Funnel, Eye, Plugs, Door, House, Truck, Plug, Broadcast, Code, Robot, Wallet, Briefcase,
  GraduationCap, Certificate, Target, MagnifyingGlass, ShieldCheck, ShieldWarning, Storefront, ForkKnife, Car, Phone,
  Book, Envelope, MapPin, Fire, Buildings, Handshake, Lightbulb, Trophy, CurrencyEur.
- `title` = `{kicker: <segment name exactly>, line: ≤ 34 chars, command?: ≤ 40 chars (the geste, if it's a command)}`.

## Truth (non-negotiable)
- Everything must be correct for current versions/today. When not 100 % sure, check official docs or reputable sources
  with WebSearch/WebFetch. `facts`: ≥ 2 items `{claim, source}` (https URL). Only numbers in `facts` may appear on
  screen or in the script. Simplify, but never say something false.
- The geste is safe for a beginner (read-only or harmless: no `rm -rf`, no `chmod 777`, no secrets, nothing that costs
  money except an explicitly free-tier step).

## Other fields
`id` "ep-NNN-<slug>", `number`, `date`, `weekday`, `module`, `segment`, `series` "DevOps en 45 secondes", `category`
(= segment), `level` (= number), `format` (segment description from plan.json), `topic`, `hook`, `music`
{"track": "up"}, `caption` (French Instagram caption, 400–900 chars: hook line, the idea in 2–3 short lines, the geste,
then 5–8 hashtags), `hashtags` (array), `facts`, `cover` {"scene": "title"}, `status` "ready".

## Done = valid
Write  (UTF-8, real accents) and validate it:
 → fix until ✓.
Then reread the script as a beginner: clear? one idea? would they follow the page? In the report, say which syllabus
entry you used and any fact you could not verify.
