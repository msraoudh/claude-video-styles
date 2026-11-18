/**
 * Brand system — « DevOps en 45 secondes » / Your Page (@your_page).
 * Dark technical: deep navy/black, ONE electric cyan accent, white text, warm amber only for small highlights.
 * Glass-morphism cards, monospaced code font, clean bold sans titles. Faceless. No logos / trademarks of
 * Docker, Kubernetes, AWS, Linux… — tool names are plain text only. Tone: confident, warm, direct. No red
 * alarms, no "service down" drama — energy comes from motion and music, not fear.
 */
/*
 * DIRECTOR'S CALL (art direction v2): cyan-on-navy alone = "Tailwind dark-mode template". The identity is a
 * CINEMATIC TEAL & ORANGE pair: electric cyan builds the world (UI, rims, lines, light), warm amber is the SIGNAL —
 * every « 45 » (the brand IS 45 seconds), the `$` prompt, the cursor and the one action (the Abonne-toi pill).
 * Background is never flat: deep ink with a blue depth gradient + light behind the glass.
 */
export const B = {
  ink: "#04070F", // page background (deep ink, slightly bluer than black)
  ink2: "#0B1530", // depth gradient centre / light plates
  bg: "radial-gradient(120% 80% at 50% 38%, #0D1A3A 0%, #070D1E 45%, #04070F 100%)",
  navy: "#0F1D36",
  line: "rgba(148,190,255,0.14)",
  white: "#F8FAFC",
  text2: "rgba(226,236,250,0.72)",
  text3: "rgba(226,236,250,0.46)",
  cyan: "#22D3EE", // THE accent
  cyanSoft: "rgba(34,211,238,0.18)",
  cyanGlow: "rgba(34,211,238,0.55)",
  amber: "#F59E0B", // THE SIGNAL: every « 45 », the `$` prompt, cursors, the Abonne-toi pill. Never big fills elsewhere.
  amberGlow: "rgba(245,158,11,0.55)",
  signal: "#F59E0B", // alias of amber — use for the brand number « 45 »
  ok: "#34D399", // pods turning healthy, checks (sparingly)
  grey: "rgba(203,213,225,0.45)", // struck-through "pas de…"
};

/** glass card recipe (his series' liquid glass, tuned cyan) */
export const glass = (accent = "34,211,238", strength = 1) => ({
  background: "linear-gradient(140deg, rgba(255,255,255,0.085), rgba(255,255,255,0.02))",
  border: "1px solid rgba(255,255,255,0.11)",
  backdropFilter: "blur(18px) saturate(140%)",
  boxShadow: [
    "0 0 0 0.5px rgba(255,255,255,0.16)",
    "0 8px 22px rgba(0,0,0,0.5)",
    "0 40px 90px rgba(0,0,0,0.5)",
    `0 0 ${80 * strength}px rgba(${accent},${0.18 * strength})`,
    "inset 0 0.6px 0 rgba(255,255,255,0.5)",
    "inset 0 16px 28px -16px rgba(255,255,255,0.18)",
    "inset 0 -0.6px 0 rgba(0,0,0,0.5)",
  ].join(", "),
  borderRadius: 34,
});

/**
 * Safe areas (px, 1080x1920): important elements ≥ 220 from top, ≥ 340 from bottom, ≥ 60 from the left.
 * RIGHT side: ≥ 60 above y 1000, but ≥ 140 below y 1000 — Instagram's like/comment/share/sound column sits there.
 */
export const SAFE = { top: 220, bottom: 1580, left: 60, right: 1020, rightLow: 940, rightLowFromY: 1000 };
/** Caption band (owned by components/Captions.tsx). Scenes keep cards/terminals OUT of it while captions show. */
export const CAPTION_BAND = { top: 1300, bottom: 1540 };
