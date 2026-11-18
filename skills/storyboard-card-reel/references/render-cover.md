# Render and cover

## Previews (1080p)
Render `Showcase` muted with TEMP inside `out/` (see `pipeline.md` step 9), mux the mix, compress to < 30 MB
(`-crf 27 -maxrate 2.2M`), send with `SendUserFile`. 1:49 at 1080p ≈ 20 MB. A 30.4 MB file did NOT reach his phone.

## Final 4K (only when he says « render »)
1. `Footage.tsx` → `FACE_FILE = "footage/talk-clean-vN.mp4"` (the 4K face).
2. `bash $SK/scripts/render_parallel.sh <reel> <version> <mix.wav> [workers=2] [concurrency=1] [scale=2]`:
   chunks of 300 frames, one browser per chunk on the RTX (`--gl=angle`, `SHIM_MCCOMPAT=0x800000001` for this
   process only), `--scale 2` → 2160×3840, x264 CRF 17 (NVENC is refused by driver 581.95), concat, mix muxed with
   gain to −14 LUFS, phone copy, GPU log.
3. **RAM:** 4 workers × concurrency 2 decoding the 4K face crashed 5 of 11 chunks (32 GB, « memory allocation
   failed » / « Chrome ran out of memory »). 2 × 1 is safe. `render_resume.sh` re-renders only the missing chunks
   and finishes the job.
4. Pass absolute paths (the scripts resolve them, but check). Verify: frame count = `DURATION`, 2160×3840, −14 LUFS,
   true peak ≤ −1, frames at chunk joins (every 10 s), then send the phone copy.
5. Switch `FACE_FILE` back to `-small` for any later Studio work.
Measured on the example: 3276 frames, chunks 6–11 in ~10 min at 4×2 before the crash; the 5 missing chunks in
697 s at 2×1. Expect ~25–35 min for a 2-minute reel at 2×1.

If he asks to shut the PC down after the render: `shutdown /s /t 120` after sending the file (he can cancel with
`shutdown /a`).

## Cover (`src/Cover.tsx`, Still « Cover »)
A quick job: one good version straight away (« it's a cover photo, don't complicate this »).
- Frame: a strong direct-look frame of the cutout (`ffmpeg -c:v libvpx-vp9 -ss T -i public/footage/cutout-vN.webm
  -frames:v 1 public/cover/said.png`; the `-c:v libvpx-vp9` before `-i` keeps the alpha).
- Layout: red→black gradient + top glow; the core big word in metal right above / slightly behind his head; him
  large; lower body faded to black; the second word (« + INTELLIGENCE »), the hook line with a red underline,
  `@MS_YOURNAME`. All text grey metal; everything inside y 240–1680 (the 3:4 profile-grid crop).
- `npx remotion still src/index.ts Cover ../out/cover-v1.png`, look at it, send it.
