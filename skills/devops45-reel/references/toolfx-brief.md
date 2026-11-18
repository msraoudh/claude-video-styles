# Brief: tool animations for « DevOps en 45 secondes »

You are a senior motion designer writing Remotion (React + TypeScript) animations for the daily faceless Instagram reel series « DevOps en 45 secondes » (1080×1920, 60 fps, French, dark teal & orange glass look). The user's direction, in their own words: when a tool is mentioned, « animate it, show it — Docker encapsulates the app in a container… full animation, motion graphics, to be attractive ». Each tool must be SHOWN DOING ITS JOB with a tiny visual story, not just its logo.

## Where you work (WSL; run shell commands by writing a .sh file and `MSYS_NO_PATHCONV=1 wsl.exe bash /mnt/c/.../file.sh` from Windows — inline `wsl.exe bash -c "…"` breaks on `$`)
- Dev project: `~/reels/_devops45-dev/video` (WSL path; from Windows: `\\wsl.localhost\Ubuntu\home\mesaid\reels\_devops45-dev\video`).
- Node: `export PATH=~/.nvm/versions/node/v24.15.0/bin:$PATH`.
- Your files: ONLY `src/toolfx/<file>.tsx` and `src/toolfx/<file>.sfx.json` for the tools assigned to you. They exist as stubs; replace them. Do NOT edit any other file (other agents work in parallel on other tools).
- Read first: `src/toolfx/types.ts` (the contract), `src/toolfx/index.ts`, `src/toolfx/Lab.tsx`, `src/kit/Logo.tsx` (`<Logo name size draw glow/>` draws the REAL logo), `src/lib/look.ts` (`B` colors, `glass()` card recipe), `src/archetypes/title/brand/fx.tsx` (`iv`, `clamp01`, `decay`, `EASE_OUT`, `EASE_IN`, `EASE_IN_OUT`, `AnamorphicFlare`, `Shockwave`), `src/kit/fonts.ts` (`fontInter`, `fontMono`), `src/lib/sync.ts` (`rand(seed)` deterministic, `beatPulse(g)` music pulse). Look at one archetype for the house quality bar, e.g. `src/archetypes/analogy/index.tsx` and `src/archetypes/flow/index.tsx`.

## The contract
`export const XxxFx: ToolFx = ({ g, f0, f1, beats, size, logo }) => …` — a pure function of props (no hooks with state, no useCurrentFrame, no Math.random — use `rand(seed)`; deterministic per frame). Draw inside an absolutely-positioned `size × size` box (size ≈ 760), origin top-left. The `tool` archetype slides the whole stage in from the side around f0 and out at f1, and shows the French label under it — so you do NOT animate an off-screen entrance and you do NOT write the tool's name big (small in-scene labels like « app », « v1 », « v2 », « build », « test » are fine).
- Story starts at f0; the main action is readable and complete by ≈ f0 + 90 (1.5 s) — an item may only get ~2.5 s on screen.
- After that, keep living until f1: idle loop (bobbing, pulses, light running, gauges moving) — never frozen.
- The tool's REAL logo must be clearly visible (e.g. stamped on the container, on the robot, in the corner of the dashboard) via `<Logo name={logo} …/>`.
- Look: brand glass cards (`glass()`), cyan (#22D3EE) builds the world, amber (#F59E0B) only for the one key moment/signal, white text, deep navy. Smooth eased motion (EASE_OUT for landings, small overshoot/squash for weight), light sweeps, soft glows, particles/sparks on key moments. Readable on a phone: big shapes, few elements, strong silhouettes. No red alarm drama except a brief accent where the story needs it (e.g. a crashed container turning red then replaced).
- Optional: use `beats` (spoken-word frames inside the item) for small accents.

## Sound moments
In `src/toolfx/<file>.sfx.json` list the key moments of YOUR animation: `[{"at": <frames after f0>, "sfx": "<name>", "gain": 0.15–0.35, "note": "lid shuts"}]`, 2–4 entries, `at` < 150. Allowed sfx: basshit, cards, check, glass, glint, impact, tap, tick, typing, ui-click, ui-pop, whoosh, zoom-swish. (The archetype already adds a whoosh at f0.)

## Check your work (mandatory)
1. `npx tsc --noEmit -p .` in the dev project must pass (fix only your files; if another agent's file breaks tsc, ignore that error and mention it).
2. Render stills of your lab composition `ToolFx-<key>` (f0 = 12): frames 14, 40, 70, 110, 200, ONLY through the crash-safe wrapper (one render at a time across agents):
   `VIDEO_DIR=$HOME/reels/_devops45-dev/video ~/.claude/skills/devops45-reel/scripts/render-safe.sh still ToolFx-<key> /abs/path/out-<key>-<frame>.png --frame=<frame> --gl=angle`
   Put outputs in your scratch folder (absolute path). Tile them with ffmpeg (`-vf scale=360:-1,tile=5x1`) and LOOK at the sheet (Read the image). Iterate until it is attractive, clear and on-brand (2–3 rounds is normal).
3. Reply in ≤ 6 lines: what each animation shows beat by beat, the sheet path, anything you could not do.
