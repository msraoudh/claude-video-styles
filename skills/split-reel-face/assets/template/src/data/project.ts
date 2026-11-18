/**
 * EVERYTHING SPECIFIC TO ONE VIDEO lives here (split-motion-reel skill). The engine in src/edit/ reads it.
 * Times are seconds of the source cut (the user's CapCut export); frames = round(s × 30).
 * Example values = « Kifech na3mel el reels hedhom » (2026-10-21), the reel the skill was built from.
 */
export type Mode = "face" | "split" | "gfx" | "wall";

export const PROJECT = {
  title: "Kifech na3mel el reels hedhom",
  handle: "@yourhandle",
  fps: 30,
  durationFrames: 3451, // 115.03 s — ffprobe nb_frames of the source
  /** media in public/ (re-encoded with a keyframe every second — see scripts/ingest.sh) */
  video: "footage/talk-v1.mp4",
  voice: "footage/voice-v1-master.wav",

  /**
   * Where the face sits in the 1080×1920 source (measure it on analysis/grid.jpg):
   * split shows source y [splitSy, splitSy + seam]; pushIn centre (cx, cy) ≈ between the eyes and the mouth;
   * pip = square crop (sx, sy, sw) for the small face circle in gfx mode.
   */
  face: { splitSy: 270, cx: 560, cy: 760, pip: { sx: 150, sy: 280, sw: 860 } },
  /** layout seam (face panel 0–seam, stage below) and caption baselines per mode */
  seam: 880,
  captionY: { split: 1508, face: 1240, gfx: 1508 },

  /** layout schedule: [start second, mode] — face / split / gfx / wall (the user's shot as the centre card) */
  modes: [
    [0, "face"],
    [0.6, "wall"],
    [2.62, "face"],
    [9.62, "split"],
    [67.0, "gfx"],
    [72.6, "split"],
    [98.0, "gfx"],
    [100.44, "face"],
    [103.26, "split"],
    [113.42, "face"],
  ] as [number, Mode][],
  /** the user's shot as a 9:16 card during "wall" */
  wallTile: { x: 345, y: 520, w: 390, h: 693 },

  /** progress bar: [start second, step number] (0 = hidden, steps.length + 1 = BONUS) */
  stepAt: [
    [0, 0],
    [9.62, 1],
    [19.86, 2],
    [39.08, 3],
    [55.28, 4],
    [86.52, 5],
    [103.26, 6],
  ] as [number, number][],
  stepCount: 5,
  bonusLabel: "BONUS",
  /** step titles under the progress bar: [text, accent?] — accent = Latin keyword in coral serif italic */
  titles: {
    1: [["نلوّج على "], ["reel", true], [" تعجبني"]],
    2: [["نعطيها لـ "], ["Claude", true], [" يحلّلها"]],
    3: [["نفس الـ "], ["style", true], ["، نفس الـ "], ["motion", true]],
    4: [["Claude", true], [" يخدم… وأنا نتفرّج"]],
    5: [["الـ "], ["rendering", true], [" والـ vidéo حاضرة"]],
    6: [["اعمللي "], ["skill", true]],
  } as Record<number, [string, boolean?][]>,
  /** caption / title direction: "rtl" for Tunisian/Arabic letters, "ltr" for French/English/3arbizi */
  dir: "rtl" as "rtl" | "ltr",

  /** scene ranges (seconds) — one scene file per range in src/scenes/ (see EDIT-PLAN.md) */
  scenes: {
    hook: [0, 9.62],
    step1: [9.62, 19.86],
    step2: [19.86, 39.08],
    step3: [39.08, 55.28],
    step4a: [55.28, 67.0],
    agents: [67.0, 72.6],
    step4b: [72.6, 86.52],
    step5: [86.52, 98.0],
    reveal: [98.0, 100.44],
    easy: [100.44, 103.26],
    bonus: [103.26, 113.42],
    outro: [113.42, 115.03],
  } as Record<string, [number, number]>,
};

/** Instagram cover (composition « CoverIG »): face frame in public/cover/face.png + the title in the video's language. */
export const COVER = {
  face: "cover/face.png",
  kicker: "0 LOGICIEL DE MONTAGE",
  line1: "كيفاش نعمل",
  line2: [["الـ vidéos "], ["هذوما", true], [" ؟"]] as [string, boolean?][],
  brand: { word: "Claude", prefix: "بـ" },
  chips: ["5 étapes", "ffmpeg", "Remotion", "ElevenLabs", "agents"],
};
