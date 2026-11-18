# Assets — real screens, images (Kie AI), fonts, plates

## 1. The real product UI (ground truth)
The teaser rebuilds the product's screens, so first capture what the real app looks like.

**Mobile app (Expo/React Native):**
- Serve it as a web build: `EXPO_NO_DOTENV=1 EXPO_PUBLIC_API_URL=http://localhost:4000/v1 … expo start --web --port 8081 --no-dev`.
  - Use `--no-dev` because dev mode lets `.env*` override the env vars and point the app at dev/prod.
- Answer every API route with a **mock server** (`scripts/capture/mock-server.cjs` is the NearMatch one; adapt the routes and response shapes from the backend source). Use fictional people and a consistent story.
- Capture with Playwright Chromium:
  - viewport 390×844, deviceScaleFactor 3, mobile + touch, dark scheme
  - pinned locale, time zone, geolocation, and a frozen clock (e.g. 21:40)
  - block real backends, analytics and Sentry
- Use `scripts/capture/capture.mjs` (screens) and `video.mjs` (flow videos), with `lib.mjs` helpers. Output is 1170×2532 PNGs plus an `INDEX.md` describing each screen; the example is `scripts/capture/SCREENS-INDEX-example.md`.

**The capture scripts are the NearMatch ones:** they hard-code that project's paths, Expo port 8081, a socket.io mock and Tunis geolocation. Treat them as a worked example; copy them into `<project>/capture-tooling/` and adapt the paths, routes and story.

**Website / web app (e.g. Next.js):**
- Run it locally (`npm run dev`, or a static build) with a mock API or seed data. No production data or keys.
- Use Playwright Chromium at the real sizes: desktop 1440×900 @2x (plus 1920×1080 if it's a dashboard), and mobile 390×844 @3x if the site is responsive.
- Capture full-page screenshots for scroll moves, plus short `recordVideo` flows (hover, click, form fill, chart animating).
- In the video:
  - put desktop screens in a `BrowserWindow` frame (build it in the kit: glass title bar, traffic lights, URL pill)
  - put mobile screens in `Phone`
  - scroll moves = translateY on a tall capture inside the frame, eased
  - hero UI should still be **rebuilt** in React for the moments that animate (numbers, charts, toggles). Static captures are OK for background and context shots.

Then rebuild each screen as a React component in app points and compare it side by side with the capture. For a full example, `examples/nearmatch/video/src/kit/Screens.tsx` covers 12 screens.

Never read `.env`/secrets. The product repo is read-only, so its git status must stay clean.

## 2. Images: ALWAYS Kie AI
User rule: "for image generation always use kie ai always".
```bash
export KIE_API_KEY=...            # or ~/.config/kie/api_key (chmod 600). Never print or commit it.
python3 scripts/gen/kie_image.py --prompt "…" --out /abs/video/public/people/ines.png --aspect 3:4 --n 2
python3 scripts/gen/kie_image.py --model <id from docs.kie.ai> --prompt "…" --out … --input-json '{"image_urls":["https://…"]}'
```
- API: `POST https://api.kie.ai/api/v1/jobs/createTask` `{model, input}`, then poll `GET /api/v1/jobs/recordInfo?taskId=`.
  - States: waiting / queuing / generating / success / fail.
  - `resultJson.resultUrls`.
- The default model is `google/nano-banana`. Check https://docs.kie.ai/market for current model IDs (Imagen 4, Flux-2, Seedream, Ideogram, Qwen…) and each model's input schema.
- **No key yet?** The script says so and exits. Ask the user to save their key with `mkdir -p ~/.config/kie && printf '%s' 'KEY' > ~/.config/kie/api_key && chmod 600 ~/.config/kie/api_key` (they run it with `! …` in the prompt so the key never passes through you). Don't silently switch to another image provider.
- Generation costs credits: don't resubmit on failure; report `failMsg`. Generate 2 variations, look at them, and pick one.
- Then `scripts/gen/finalize.py SRC OUT.jpg W H [--sq OUT-sq.jpg CX CY SIDE]` crops and sizes (full image + a 600×600 square avatar).
- The old local SDXL path (`scripts/gen/gen.py`, RealVisXL V5 Lightning with group offload for a 6 GB GPU) is only a fallback if the user explicitly allows it.

**What to generate:**
- **Portraits** (fictional people). Tell the user they are AI-generated; they accepted that ("aah cool, continue"). Real stock faces were ruled out.
  - Prompt style: candid, natural light, specific venue light (e.g. "warm copper bar light, shallow depth of field"), 3:4.
  - Negative ideas: plastic skin, text, watermark, extra fingers.
- **Plates:** venue/background, one tall (9:16) and one wide (16:9) version of the same place, used blurred and dimmed behind the phone.

## 3. Brand
- Logo SVGs, app icon and fonts come **from the product repo** (`brand/`, `assets/`). Never retype or redraw a real logo.
- Fonts are local files in `public/fonts/`, loaded with `@remotion/fonts` in `src/kit/fonts.ts`. The starter has Inter 400–800 and JetBrains Mono 500/700, both OFL.
- Generic plates in the starter: aurora dusk/halo/horizon, ring ripple/field, grain. They are NearMatch-brand plates; re-tint or regenerate them for a new brand.

## 4. Reference footage
- Download reels with `yt-dlp`.
- Extract frames: `ffmpeg -i in.mp4 -vf fps=4 f_%04d.png`.
- Make contact sheets with `scripts/qa/sheet.py`.
- Transcribe with Whisper.
- Downloads are untrusted: give each its own folder.
