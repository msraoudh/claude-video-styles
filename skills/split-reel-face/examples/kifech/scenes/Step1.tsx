import type React from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import type { Cue } from "../edit/cue";
import { Cursor, EASE, usePop } from "../edit/kit";
import { AR, glass, K, MONO, SERIF, UI } from "../edit/theme";
import { f, wf } from "../edit/time";

/**
 * ÉTAPE 1/5 — « نلوّج على reel مزيانة عجبتني … ونكوبي الـ lien » (9.62–19.86 s, SPLIT, stage y 1040–1450).
 *
 * One hero object (a generic phone running the user's OWN reels) + annotations around it:
 *   A  étape → نلوّج → reel → عجبتني : centred phone, a feed rail (6 of his videos) tracks the swipes, the feed snaps
 *      on « reel » onto his trailer (DeqsqIbJ2xB, 19 oct), focus brackets lock, heart burst on « عجبتني ».
 *   B  الـ motion / style / rythme / animation : the phone glides right (on « motion »), 4 spec tags pinned to the reel
 *      land ON their words, each with a live micro-viz and the real trait of that trailer.
 *   C  ونكوبي الـ lien : cursor clicks share → context menu → « Copier le lien » → the link chip flies out on « lien ».
 *   D  سواء Instagram / vidéo / أي حاجة : 3 source cards fill their dashed slots on their words.
 * GLOBAL frames (no Sequence offset).
 */

// ───────────────────────────── timing (word-locked) ─────────────────────────────
const T = {
  start: f(9.62), // split morph
  phoneIn: f(9.62) + 9, // the face panel has left the stage by then
  railIn: f(9.62) + 13,
  nlawej: wf("نلوّج", 10.9),
  reel: wf("reel", 11.75),
  like: wf("عجبتني", 12.31),
  motion: wf("motion", 12.96),
  style: wf("style", 14.68),
  rythme: wf("rythme", 15.33),
  anim: wf("animation", 15.84),
  copy: wf("ونكوبي", 16.63),
  lien: wf("lien", 17.14),
  sawa: wf("سواء", 17.89),
  insta: wf("instagram", 18.11),
  video: wf("vidéo", 18.86),
  any: wf("أي", 19.37),
  end: f(19.86),
};
const GLIDE = T.motion - 11; // phone glides right, lands as « motion » starts
const SHARE_CLICK = T.copy; // cursor clicks share on « ونكوبي »
const MENU_IN = SHARE_CLICK + 2;
const COPY_CLICK = T.lien - 3; // « Copier le lien » click, the chip leaves on « lien »
const TAGS_OUT = SHARE_CLICK - 5;

/** Swipes of the feed: [start frame, duration]. Accelerating flicks from « نلوّج », the last one snaps on « reel ». */
const SWIPES: [number, number][] = [
  [T.phoneIn + 11, 9],
  [T.nlawej - 2, 8],
  [T.nlawej + 7, 7],
  [T.nlawej + 14, 6],
  [T.reel - 7, 10],
];

// ───────────────────────────── helpers ─────────────────────────────
const c01 = (t: number) => Math.min(1, Math.max(0, t));
const io = (t: number) => {
  const x = c01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const outBack = (t: number, c1 = 1.5) => {
  const x = c01(t);
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** House entrance (blur 6→0, scale .96→1, rise) with an optional exit. */
const inOut = (frame: number, at: number, len = 7, out?: number, outLen = 6) => {
  const p = EASE((frame - at) / len);
  const q = out === undefined ? 0 : EASE((frame - out) / outLen);
  return { p, q, v: p * (1 - q) };
};
const house = (p: number, q = 0, rise = 14, dx = 0): React.CSSProperties => ({
  opacity: p * (1 - q),
  transform: `translate(${(1 - p) * dx - q * 24}px, ${(1 - p) * rise}px) scale(${0.96 + 0.04 * p - 0.04 * q})`,
  filter: p < 1 || q > 0 ? `blur(${(1 - p) * 6 + q * 7}px)` : undefined,
});

// ───────────────────────────── the feed (the user's own videos) ─────────────────────────────
type Item = { video?: string; img?: string; trim?: number; handle: string; label: string; caption: string };
const FEED: Item[] = [
  { video: "thumbs/ig-4.mp4", trim: 180, handle: "yourhandle", label: "14 oct", caption: "On tente en français…" },
  { img: "intro-1", handle: "cloud_devops_msr", label: "DevOps 45", caption: "DevOps en 45 secondes" },
  { video: "thumbs/ig-3.mp4", trim: 600, handle: "yourhandle", label: "15 oct", caption: "299 000 postes…" },
  { img: "ep1-3", handle: "cloud_devops_msr", label: "ép. 1", caption: "La boucle DevOps" },
  { video: "thumbs/ig-2.mp4", trim: 60, handle: "yourhandle", label: "17 oct", caption: "T'as peur que l'IA…" },
  { video: "thumbs/ig-1.mp4", trim: 1020, handle: "yourhandle", label: "19 oct", caption: "NO MORE EXCUSES." },
];
const CHOSEN = FEED.length - 1;
/** frame from which item i is (partly) on screen */
const visibleFrom = (i: number) => (i === 0 ? T.phoneIn - 2 : SWIPES[i - 1][0] - 1);

const feedPos = (frame: number) =>
  SWIPES.reduce((s, [at, d], i) => s + (i === SWIPES.length - 1 ? outBack((frame - at) / d, 1.3) : io((frame - at) / d)), 0);

// ───────────────────────────── phone geometry ─────────────────────────────
const PW = 214;
const PH = 400;
const BEZ = 7;
const SW = PW - 2 * BEZ; // 200
const SH = PH - 2 * BEZ; // 386
const PX_CENTER = 540 - PW / 2;
const PX_RIGHT = 712;
const PY = 1045;

const phoneBox = (frame: number) => {
  const g = io((frame - GLIDE) / 13);
  const x = lerp(PX_CENTER, PX_RIGHT, g);
  const fy = Math.sin((frame / 30) * ((2 * Math.PI) / 4.2)) * 3;
  const lift = io((frame - (SHARE_CLICK - 2)) / 6) * (1 - io((frame - (T.lien + 6)) / 10));
  const scale = 1 + 0.035 * lift;
  return { x, y: PY + fy, g, lift, scale };
};
/** global position of a point given in screen coordinates (ignores the small 3D tilt) */
const screenPt = (frame: number, sx: number, sy: number) => {
  const b = phoneBox(frame);
  const cx = b.x + PW / 2;
  const cy = b.y + PH / 2;
  const lx = b.x + BEZ + sx;
  const ly = b.y + BEZ + sy;
  return { x: cx + (lx - cx) * b.scale, y: cy + (ly - cy) * b.scale };
};

// ───────────────────────────── icons ─────────────────────────────
const HEART = "M12 21.2s-7.6-4.7-9.7-9.4C.8 8.4 3 4.6 6.8 4.6c2.1 0 3.6 1.2 4.4 2.5.8-1.3 2.3-2.5 4.4-2.5 3.8 0 6 3.8 4.5 7.2-2.1 4.7-9.7 9.4-9.7 9.4z";
const IconHeart: React.FC<{ s: number; fill?: string; stroke?: string; sw?: number }> = ({ s, fill = "none", stroke = "#fff", sw = 2 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d={HEART} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
  </svg>
);
const IconComment: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.4L3.3 20.6l1.5-4.6A8.4 8.4 0 1 1 20.5 11.6z" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);
const IconSend: React.FC<{ s: number; color?: string }> = ({ s, color = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M21.5 3 10 14.2M21.5 3l-6.8 18-4.7-6.8L3 9.6z" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
const IconDots: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    {[5, 12, 19].map((x) => (
      <circle key={x} cx={x} cy={12} r={2} fill="#fff" />
    ))}
  </svg>
);
const IconLink: React.FC<{ s: number; color?: string; sw?: number }> = ({ s, color = K.coral, sw = 2.2 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path
      d="M10 13.5a4.6 4.6 0 0 0 6.6.4l3-3a4.6 4.6 0 0 0-6.5-6.5l-1.6 1.6M14 10.5a4.6 4.6 0 0 0-6.6-.4l-3 3a4.6 4.6 0 0 0 6.5 6.5l1.6-1.6"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
    />
  </svg>
);
const IconShare: React.FC<{ s: number; color?: string }> = ({ s, color = K.cream }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M4.5 12.5v6.2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6.2M16 7l-4-4-4 4M12 3v12" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconBookmark: React.FC<{ s: number; color?: string }> = ({ s, color = K.cream }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M6.5 3.5h11v17.2L12 16.6l-5.5 4.1z" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
  </svg>
);
const IconCheck: React.FC<{ s: number; color?: string }> = ({ s, color = K.ok }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ───────────────────────────── feed media ─────────────────────────────
const Media: React.FC<{ it: Item; from: number; frozen?: boolean }> = ({ it, from, frozen }) => {
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
  if (it.img) return <Img src={staticFile(`thumbs/${it.img}.jpg`)} style={style} />;
  if (frozen)
    return (
      <Freeze frame={0}>
        <OffthreadVideo src={staticFile(it.video!)} trimBefore={it.trim} muted style={style} />
      </Freeze>
    );
  return (
    <Sequence from={from} layout="none">
      <OffthreadVideo src={staticFile(it.video!)} trimBefore={it.trim} muted style={style} />
    </Sequence>
  );
};

/** generic reel UI over the video (no logo) */
const ReelUI: React.FC<{ it: Item; liked: number; likePop: number; sharePress: number }> = ({ it, liked, likePop, sharePress }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 70, background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, background: "linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0))" }} />
    <div style={{ position: "absolute", left: 12, top: 30, fontFamily: UI, fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.01em" }}>Reels</div>
    {/* right column */}
    <div style={{ position: "absolute", right: 8, top: 196, width: 26, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ transform: `scale(${1 + 0.45 * likePop})` }}>
        <IconHeart s={22} fill={liked > 0.5 ? K.coral : "none"} stroke={liked > 0.5 ? K.coral : "#fff"} />
      </div>
      <IconComment s={21} />
      <div style={{ transform: `scale(${1 - 0.18 * sharePress})`, borderRadius: 8, background: sharePress > 0 ? `rgba(217,119,87,${0.5 * sharePress})` : undefined, padding: 2 }}>
        <IconSend s={20} />
      </div>
      <div style={{ height: 4 }} />
      <IconDots s={18} />
    </div>
    {/* bottom-left */}
    <div style={{ position: "absolute", left: 10, bottom: 34, display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: `linear-gradient(135deg, ${K.coralLight}, ${K.coralDeep})`, border: "1.5px solid #fff" }} />
      <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 11, color: "#fff" }}>{it.handle}</div>
      <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 8.5, color: "#fff", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 5, padding: "1px 4px" }}>Suivre</div>
    </div>
    <div style={{ position: "absolute", left: 10, bottom: 16, fontFamily: UI, fontWeight: 500, fontSize: 9.5, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>{it.caption}</div>
    {/* progress line */}
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 6, height: 2, background: "rgba(255,255,255,0.25)" }} />
  </>
);

// ───────────────────────────── the phone ─────────────────────────────
const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const b = phoneBox(frame);
  const enter = inOut(frame, T.phoneIn, 10);
  const pos = feedPos(frame);
  const vel = Math.abs(pos - feedPos(frame - 1));
  const liked = frame >= T.like ? 1 : 0;
  const likePop = frame >= T.like ? Math.max(0, 1 - (frame - T.like) / 10) : 0;
  const shareP = frame >= SHARE_CLICK - 1 && frame < SHARE_CLICK + 8 ? 1 - (frame - SHARE_CLICK + 1) / 9 : 0;
  // 3D: enters turned, settles at a light tilt facing the annotations, flattens on the long-press
  const ry = lerp(lerp(-24, -9, enter.p), 0, b.lift) + Math.sin(frame / 40) * 1.2;
  const rx = lerp(10, 3, enter.p) * (1 - b.lift);
  const tiltY = lerp(ry, ry + 14, 1 - b.g); // centred: faces the viewer more
  const focus = inOut(frame, T.reel, 6, GLIDE + 2, 8);
  const focusSpread = (1 - EASE((frame - T.reel) / 6)) * 34;
  return (
    <div
      style={{
        position: "absolute",
        left: b.x,
        top: b.y,
        width: PW,
        height: PH,
        perspective: 1300,
        ...house(enter.p, 0, 60),
      }}
    >
      {/* coral floor glow */}
      <div style={{ position: "absolute", left: -80, right: -80, top: 60, bottom: -40, borderRadius: "50%", background: K.coralGlow, filter: "blur(70px)", opacity: 0.35 + 0.35 * b.lift + 0.2 * (liked ? Math.max(0, 1 - (frame - T.like) / 25) : 0) }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${b.scale}) rotateY(${tiltY}deg) rotateX(${rx}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 42,
            background: "linear-gradient(150deg, #3A2C25 0%, #1A120F 45%, #0C0807 100%)",
            border: `1.5px solid rgba(255,236,220,${0.22 + 0.25 * b.lift})`,
            boxShadow: [
              "0 34px 70px rgba(0,0,0,0.7)",
              "inset 0 0 0 2px rgba(0,0,0,0.65)",
              "inset 0 1px 0 rgba(255,236,220,0.35)",
              `0 0 ${40 + 30 * b.lift}px rgba(217,119,87,${0.18 + 0.4 * b.lift})`,
            ].join(", "),
          }}
        />
        {/* side buttons */}
        <div style={{ position: "absolute", left: -3, top: 92, width: 3, height: 34, borderRadius: 2, background: "#3A2C25" }} />
        <div style={{ position: "absolute", right: -3, top: 120, width: 3, height: 54, borderRadius: 2, background: "#3A2C25" }} />
        {/* screen */}
        <div style={{ position: "absolute", left: BEZ, top: BEZ, width: SW, height: SH, borderRadius: 35, overflow: "hidden", background: "#000" }}>
          <div style={{ position: "absolute", inset: 0, filter: vel > 0.04 ? `blur(${Math.min(3.2, vel * 7)}px)` : undefined }}>
            {FEED.map((it, i) => {
              const off = i - pos;
              if (Math.abs(off) >= 1.02) return null;
              const kb = it.img ? 1.04 + 0.04 * c01((frame - visibleFrom(i)) / 60) : 1;
              return (
                <div key={i} style={{ position: "absolute", left: 0, top: off * SH, width: SW, height: SH, overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, transform: `scale(${kb})` }}>
                    <Media it={it} from={visibleFrom(i)} />
                  </div>
                  <ReelUI it={it} liked={i === CHOSEN ? liked : 0} likePop={i === CHOSEN ? likePop : 0} sharePress={i === CHOSEN ? shareP : 0} />
                </div>
              );
            })}
          </div>
          <HeartBurst />
          <TouchDot pos={pos} />
          <CopiedToast />
          {/* glass glare */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)" }} />
          {/* dynamic island */}
          <div style={{ position: "absolute", left: SW / 2 - 30, top: 8, width: 60, height: 17, borderRadius: 9, background: "#000" }} />
        </div>
      </div>
      {/* focus brackets on « reel » */}
      {focus.v > 0.01 ? (
        <div style={{ position: "absolute", inset: -14 - focusSpread, opacity: focus.v }}>
          {[
            [0, 0, 0],
            [1, 0, 90],
            [1, 1, 180],
            [0, 1, 270],
          ].map(([rx2, ry2, rot]) => (
            <div
              key={rot}
              style={{
                position: "absolute",
                left: rx2 ? undefined : 0,
                right: rx2 ? 0 : undefined,
                top: ry2 ? undefined : 0,
                bottom: ry2 ? 0 : undefined,
                width: 34,
                height: 34,
                transform: `rotate(${rot}deg)`,
                borderTop: `4px solid ${K.coral}`,
                borderLeft: `4px solid ${K.coral}`,
                borderTopLeftRadius: 14,
                filter: `drop-shadow(0 0 8px ${K.coralGlow})`,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** finger-touch dot dragging up on each swipe */
const TouchDot: React.FC<{ pos: number }> = () => {
  const frame = useCurrentFrame();
  const sw = SWIPES.find(([at, d]) => frame >= at - 3 && frame < at + d + 2);
  if (!sw) return null;
  const [at, d] = sw;
  const t = c01((frame - at) / d);
  const o = Math.min(c01((frame - at + 3) / 3), 1 - c01((frame - at - d) / 2));
  return (
    <div
      style={{
        position: "absolute",
        left: SW / 2 - 18,
        top: lerp(292, 120, io(t)) - 18,
        width: 36,
        height: 36,
        borderRadius: 18,
        background: "rgba(255,255,255,0.35)",
        border: "2px solid rgba(255,255,255,0.75)",
        boxShadow: "0 0 18px rgba(255,255,255,0.35)",
        opacity: o,
      }}
    />
  );
};

/** double-tap heart + ring + sparks on « عجبتني » */
const HeartBurst: React.FC = () => {
  const frame = useCurrentFrame();
  const s = usePop(T.like, 8);
  const t = frame - T.like;
  if (t < 0 || t > 30) return null;
  const fade = 1 - c01((t - 16) / 10);
  const ring = c01(t / 14);
  return (
    <div style={{ position: "absolute", left: SW / 2, top: SH * 0.46, width: 0, height: 0 }}>
      <div style={{ position: "absolute", left: -70 * ring - 10, top: -70 * ring - 10, width: 140 * ring + 20, height: 140 * ring + 20, borderRadius: "50%", border: `3px solid ${K.coralLight}`, opacity: (1 - ring) * 0.9 }} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const r = 30 + 52 * EASE(t / 13);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.cos(a) * r - 4,
              top: Math.sin(a) * r - 4,
              width: i % 2 ? 6 : 9,
              height: i % 2 ? 6 : 9,
              borderRadius: "50%",
              background: i % 2 ? K.cream : K.coralLight,
              opacity: 1 - c01((t - 4) / 10),
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: -46, top: -44, transform: `scale(${s * (1 + 0.15 * (1 - fade))}) rotate(${-8 + 8 * s}deg)`, opacity: fade, filter: `drop-shadow(0 6px 18px rgba(217,119,87,0.8))` }}>
        <svg width={92} height={92} viewBox="0 0 24 24">
          <defs>
            <linearGradient id="s1heart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={K.coralLight} />
              <stop offset="1" stopColor={K.coral} />
            </linearGradient>
          </defs>
          <path d={HEART} fill="url(#s1heart)" stroke="#fff" strokeWidth={0.9} />
        </svg>
      </div>
    </div>
  );
};

/** « Lien copié » toast inside the phone */
const CopiedToast: React.FC = () => {
  const frame = useCurrentFrame();
  const a = inOut(frame, COPY_CLICK + 2, 6, T.lien + 40, 6);
  if (a.v <= 0.01) return null;
  return (
    <div style={{ position: "absolute", left: 14, right: 14, bottom: 58, display: "flex", justifyContent: "center", ...house(a.p, a.q, 10) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 10, background: "rgba(28,22,19,0.92)", border: "1px solid rgba(255,236,220,0.2)", fontFamily: UI, fontWeight: 700, fontSize: 10.5, color: "#fff" }}>
        <IconCheck s={12} />
        Lien copié
      </div>
    </div>
  );
};

/** small hearts floating up beside the phone after the like */
const FloatingHearts: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = T.like + 2;
  if (frame < t0 || frame > t0 + 60) return null;
  const like = screenPt(frame, SW - 21, 207);
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => {
        const t = frame - t0 - i * 4;
        if (t < 0 || t > 34) return null;
        const k = t / 34;
        const x = like.x + 18 + Math.sin(k * 5 + i) * 12 + i * 5;
        const y = like.y - k * 150;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, opacity: Math.min(1, t / 4) * (1 - k), transform: `scale(${0.6 + 0.5 * Math.min(1, t / 6)}) rotate(${Math.sin(i) * 20}deg)` }}>
            <IconHeart s={i % 2 ? 22 : 30} fill={i % 3 === 1 ? K.cream : K.coral} stroke="none" />
          </div>
        );
      })}
    </>
  );
};

// ───────────────────────────── phase A: feed rail + swipe hint ─────────────────────────────
const RAIL_X = 318;
const RAIL_TOP = 1052;
const R_H = 58;
const R_W = 33;
const R_GAP = 7;
const Rail: React.FC = () => {
  const frame = useCurrentFrame();
  const out = GLIDE - 3;
  if (frame < T.railIn - 2 || frame > out + 12) return null;
  const pos = feedPos(frame);
  const hy = RAIL_TOP + Math.min(pos, CHOSEN) * (R_H + R_GAP);
  const lockP = EASE((frame - T.reel) / 5);
  const hl = inOut(frame, T.railIn + 4, 6, out, 6);
  return (
    <>
      {FEED.map((it, i) => {
        const a = inOut(frame, T.railIn + i * 2, 7, out + (FEED.length - 1 - i), 6);
        const active = Math.max(0, 1 - Math.abs(pos - i));
        const dimChosen = lockP > 0 && i !== CHOSEN ? 1 - 0.55 * lockP : 1;
        return (
          <div key={i} style={{ position: "absolute", left: RAIL_X - 150, top: RAIL_TOP + i * (R_H + R_GAP), width: 150 + R_W, height: R_H, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end", ...house(a.p, a.q, 10, 20) }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, color: active > 0.5 ? K.coral : K.muted, opacity: (0.7 + 0.3 * active) * dimChosen, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              {it.label}
            </div>
            <div style={{ width: R_W, height: R_H, borderRadius: 7, overflow: "hidden", border: `1.5px solid ${K.stroke}`, opacity: (0.6 + 0.4 * active) * dimChosen, flex: "none", boxShadow: "0 6px 14px rgba(0,0,0,0.5)" }}>
              <Media it={it} from={0} frozen />
            </div>
          </div>
        );
      })}
      {/* the moving highlight frame */}
      <div
        style={{
          position: "absolute",
          left: RAIL_X - 4,
          top: hy - 4,
          width: R_W + 8,
          height: R_H + 8,
          borderRadius: 10,
          border: `2.5px solid ${K.coral}`,
          boxShadow: `0 0 ${14 + 16 * lockP}px ${K.coralGlow}`,
          opacity: hl.v,
          transform: `scale(${1 + 0.12 * lockP * (1 - EASE((frame - T.reel - 5) / 8))})`,
        }}
      />
      {/* connector rail → phone */}
      <div style={{ position: "absolute", left: RAIL_X + R_W + 10, top: hy + R_H / 2 - 1, width: PX_CENTER - (RAIL_X + R_W + 10) - 10, height: 2, background: `linear-gradient(90deg, ${K.coral}, rgba(217,119,87,0))`, opacity: hl.v * 0.8 }} />
    </>
  );
};

/** right of the centred phone: swipe hint during the scroll, then « ♥ 19 oct » meta after the snap */
const SwipeHint: React.FC = () => {
  const frame = useCurrentFrame();
  const a = inOut(frame, SWIPES[0][0] - 4, 7, T.reel - 1, 5);
  const m = inOut(frame, T.reel + 2, 7, GLIDE - 4, 6);
  const x = PX_CENTER + PW + 46;
  return (
    <>
      {a.v > 0.01 ? (
        <div style={{ position: "absolute", left: x, top: 1160, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, ...house(a.p, a.q, 10, -16) }}>
          {[0, 1, 2].map((i) => {
            const ph = ((frame + (2 - i) * 4) % 18) / 18;
            return (
              <svg key={i} width={40} height={24} viewBox="0 0 40 24" style={{ opacity: 0.25 + 0.75 * Math.max(0, Math.sin(ph * Math.PI)) }}>
                <path d="M6 18 L20 6 L34 18" fill="none" stroke={K.coral} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
          })}
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: "0.2em", color: K.muted, marginTop: 8 }}>SCROLL</div>
        </div>
      ) : null}
      {m.v > 0.01 ? (
        <div style={{ position: "absolute", left: x - 6, top: 1150, ...house(m.p, m.q, 12, -16) }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 17, letterSpacing: "0.16em", color: K.coral }}>REEL · 19 OCT</div>
          <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 30, color: K.cream, marginTop: 6 }}>@yourhandle</div>
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 19, color: K.muted, marginTop: 6 }}>DeqsqIbJ2xB</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, opacity: frame >= T.like ? 1 : 0.35 }}>
            <div style={{ transform: `scale(${frame >= T.like ? 1 + 0.35 * Math.max(0, 1 - (frame - T.like) / 8) : 1})` }}>
              <IconHeart s={28} fill={frame >= T.like ? K.coral : "none"} stroke={frame >= T.like ? K.coral : K.muted} />
            </div>
            <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 22, color: frame >= T.like ? K.cream : K.muted }}>J'aime</div>
          </div>
        </div>
      ) : null}
    </>
  );
};

// ───────────────────────────── phase B: spec tags pinned to the reel ─────────────────────────────
type TagDef = { word: string; at: number; detail: string; viz: "motion" | "style" | "rythme" | "anim"; pin: [number, number] };
const TAGS: TagDef[] = [
  { word: "motion", at: T.motion, detail: "whip · push-in", viz: "motion", pin: [48, 58] },
  { word: "style", at: T.style, detail: "dark · bold type", viz: "style", pin: [86, 138] },
  { word: "rythme", at: T.rythme, detail: "cut on the bass", viz: "rythme", pin: [44, 238] },
  { word: "animation", at: T.anim, detail: "3D · text behind", viz: "anim", pin: [84, 326] },
];
const TAG_X = 92;
const TAG_W = 556;
const TAG_H = 84;
const TAG_Y0 = 1050;
const TAG_STEP = 100;

const MotionViz: React.FC<{ frame: number }> = ({ frame }) => {
  const pts = Array.from({ length: 21 }, (_, i) => {
    const t = i / 20;
    return [8 + 44 * t, 32 - 16 * Math.sin(t * Math.PI * 1.6 - 0.4)] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const at = (t: number) => {
    const u = c01(t);
    return [8 + 44 * u, 32 - 16 * Math.sin(u * Math.PI * 1.6 - 0.4)];
  };
  const t = io(((frame % 36) + 0) / 30);
  return (
    <svg width={60} height={60} viewBox="0 0 60 60">
      <path d={d} fill="none" stroke="rgba(255,236,220,0.28)" strokeWidth={2} strokeDasharray="3 4" />
      {[0.16, 0.08, 0].map((lag, i) => {
        const [x, y] = at(t - lag);
        return <circle key={i} cx={x} cy={y} r={i === 2 ? 6 : 4 - i} fill={K.coral} opacity={i === 2 ? 1 : 0.25 + i * 0.25} />;
      })}
    </svg>
  );
};
const StyleViz: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ width: 60, height: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
    <div style={{ fontFamily: UI, fontWeight: 900, fontSize: 26, lineHeight: 1, color: K.cream, letterSpacing: "-0.04em" }}>
      A<span style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 28, color: K.coral }}>a</span>
    </div>
    <div style={{ display: "flex", gap: 4 }}>
      {[K.bg0, K.coral, K.cream].map((c, i) => {
        const on = Math.floor(frame / 10) % 3 === i;
        return <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c, border: "1px solid rgba(255,236,220,0.35)", transform: `translateY(${on ? -2 : 0}px)` }} />;
      })}
    </div>
  </div>
);
const RythmeViz: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
    {[0.55, 0.9, 0.7, 1, 0.6].map((b, i) => {
      const beat = Math.exp(-((frame + i * 2) % 15) / 4);
      return <div key={i} style={{ width: 6, height: 10 + 32 * b * (0.35 + 0.65 * beat), borderRadius: 3, background: i === 3 ? K.coral : K.coralLight, opacity: i === 3 ? 1 : 0.75 }} />;
    })}
  </div>
);
const AnimViz: React.FC<{ frame: number }> = ({ frame }) => {
  const t = (frame % 40) / 40;
  const ph = 8 + 44 * t;
  const keys = [12, 30, 48];
  const sq = io(c01((t - 0.1) / 0.8));
  return (
    <svg width={60} height={60} viewBox="0 0 60 60">
      <rect x={6 + 36 * sq} y={10} width={12} height={12} rx={3} fill={K.coral} transform={`rotate(${sq * 90} ${12 + 36 * sq} 16)`} />
      <line x1={6} y1={42} x2={54} y2={42} stroke="rgba(255,236,220,0.3)" strokeWidth={2} />
      {keys.map((x) => (
        <rect key={x} x={x - 4} y={38} width={8} height={8} transform={`rotate(45 ${x} 42)`} fill={ph >= x ? K.coral : "none"} stroke={ph >= x ? K.coral : "rgba(255,236,220,0.55)"} strokeWidth={1.6} />
      ))}
      <line x1={ph} y1={32} x2={ph} y2={52} stroke={K.cream} strokeWidth={2} />
    </svg>
  );
};

const Tag: React.FC<{ d: TagDef; i: number }> = ({ d, i }) => {
  const frame = useCurrentFrame();
  const out = TAGS_OUT + (TAGS.length - 1 - i) * 2;
  const a = inOut(frame, d.at - 1, 7, out, 6);
  if (a.v <= 0.005 && frame > d.at) return null;
  if (frame < d.at - 1) return null;
  const fresh = 1 - c01((frame - d.at - 6) / 14);
  const y = TAG_Y0 + i * TAG_STEP;
  return (
    <div
      style={{
        position: "absolute",
        left: TAG_X,
        top: y,
        width: TAG_W,
        height: TAG_H,
        ...glass(fresh > 0.3),
        background: "linear-gradient(150deg, rgba(255,236,220,0.12), rgba(255,236,220,0.03) 60%), rgba(38,27,22,0.86)",
        borderRadius: 24,
        padding: "0 22px 0 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: `0 18px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,236,220,0.22), 0 0 ${40 * fresh}px rgba(217,119,87,${0.5 * fresh})`,
        ...house(a.p, a.q, 0, 46),
      }}
    >
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 17, color: K.coral, width: 24 }}>{`0${i + 1}`}</div>
      <div style={{ width: 60, height: 60, borderRadius: 14, background: "rgba(255,236,220,0.06)", border: `1px solid ${K.stroke}`, flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {d.viz === "motion" ? <MotionViz frame={frame} /> : d.viz === "style" ? <StyleViz frame={frame} /> : d.viz === "rythme" ? <RythmeViz frame={frame} /> : <AnimViz frame={frame} />}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 54, lineHeight: 1, color: K.coral, marginTop: -4 }}>{d.word}</div>
      <div style={{ flex: 1 }} />
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 18, color: "rgba(245,238,228,0.68)", whiteSpace: "nowrap" }}>{d.detail}</div>
    </div>
  );
};

/** pins on the reel + leader lines to the tags (stage coordinates, follow the phone) */
const Leaders: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.motion - 2 || frame > TAGS_OUT + 16) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {TAGS.map((d, i) => {
        if (frame < d.at - 2) return null;
        const out = TAGS_OUT + (TAGS.length - 1 - i) * 2;
        const draw = EASE((frame - d.at) / 6);
        const q = EASE((frame - out) / 5);
        const pin = screenPt(frame, d.pin[0], d.pin[1]);
        const ty = TAG_Y0 + i * TAG_STEP + TAG_H / 2;
        const x0 = TAG_X + TAG_W;
        const xm = x0 + 26;
        const len = Math.hypot(pin.x - xm, pin.y - ty) + 26;
        const pp = popAt(frame, d.at - 2);
        const pulse = 0.5 + 0.5 * Math.sin((frame - d.at) / 5);
        return (
          <g key={i} opacity={1 - q}>
            <path
              d={`M${x0} ${ty} L${xm} ${ty} L${pin.x} ${pin.y}`}
              fill="none"
              stroke={K.coral}
              strokeWidth={2.2}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - draw)}
              opacity={0.85}
            />
            <circle cx={x0} cy={ty} r={3.5 * draw} fill={K.coral} />
            <circle cx={pin.x} cy={pin.y} r={13 + 5 * pulse} fill="none" stroke={K.coral} strokeWidth={2} opacity={0.45 * pp * (1 - pulse * 0.5)} />
            <circle cx={pin.x} cy={pin.y} r={7 * pp} fill={K.coral} stroke="#fff" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
};
/** spring-ish 0→1 without hooks (usable inside map) */
const popAt = (frame: number, at: number) => {
  const t = frame - at;
  if (t <= 0) return 0;
  return outBack(t / 6, 2.2);
};

// ───────────────────────────── phase C: share → « Copier le lien » ─────────────────────────────
const MENU = { x: 364, y: 1172, w: 330, row: 70 };
const MENU_ITEMS: { label: string; icon: "link" | "share" | "save" }[] = [
  { label: "Copier le lien", icon: "link" },
  { label: "Partager…", icon: "share" },
  { label: "Enregistrer", icon: "save" },
];
const ContextMenu: React.FC = () => {
  const frame = useCurrentFrame();
  const s = usePop(MENU_IN, 13);
  const closeAt = T.lien + 3;
  if (frame < MENU_IN - 1 || frame > closeAt + 10) return null;
  const q = EASE((frame - closeAt) / 7);
  const hover = c01((frame - (COPY_CLICK - 4)) / 3);
  const press = frame >= COPY_CLICK && frame < COPY_CLICK + 5 ? 1 : 0;
  const flash = frame >= COPY_CLICK ? Math.max(0, 1 - (frame - COPY_CLICK) / 8) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: MENU.x,
        top: MENU.y,
        width: MENU.w,
        ...glass(true),
        borderRadius: 24,
        padding: 10,
        transformOrigin: "100% 60%",
        transform: `translateX(${(1 - Math.min(1, s)) * 60 + q * 40}px) scale(${(0.7 + 0.3 * s) * (1 - 0.25 * q)})`,
        opacity: Math.min(1, s * 1.4) * (1 - q),
        filter: q > 0 || s < 0.9 ? `blur(${(1 - Math.min(1, s)) * 5 + q * 6}px)` : undefined,
      }}
    >
      {MENU_ITEMS.map((m, i) => {
        const on = i === 0;
        const bg = on ? (press ? K.coral : `rgba(217,119,87,${0.24 * hover + 0.45 * flash})`) : "transparent";
        const col = on && press ? "#1A0F0B" : K.cream;
        return (
          <div key={i}>
            {i > 0 ? <div style={{ height: 1, background: K.stroke, margin: "0 12px" }} /> : null}
            <div style={{ height: MENU.row, display: "flex", alignItems: "center", gap: 14, padding: "0 16px", borderRadius: 16, background: bg, transform: on && press ? "scale(0.97)" : undefined }}>
              {m.icon === "link" ? <IconLink s={31} color={on && press ? "#1A0F0B" : K.coral} /> : m.icon === "share" ? <IconShare s={29} /> : <IconBookmark s={29} />}
              <div style={{ fontFamily: UI, fontWeight: on ? 700 : 600, fontSize: 29, color: col, whiteSpace: "nowrap" }}>{m.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CURSOR_IN = SHARE_CLICK - 16;
const CursorRig: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < CURSOR_IN || frame > T.lien + 20) return null;
  const share = screenPt(Math.min(frame, SHARE_CLICK), SW - 21, 300);
  const copy = { x: MENU.x + 150, y: MENU.y + 10 + MENU.row / 2 + 4 };
  const start = { x: 300, y: 1470 };
  let p = start;
  if (frame < SHARE_CLICK - 2) {
    const t = io((frame - CURSOR_IN) / (SHARE_CLICK - 2 - CURSOR_IN));
    p = { x: lerp(start.x, share.x, t), y: lerp(start.y, share.y, t) - Math.sin(t * Math.PI) * 60 };
  } else if (frame < MENU_IN + 1) {
    p = share;
  } else if (frame < COPY_CLICK - 2) {
    const t = io((frame - MENU_IN - 1) / (COPY_CLICK - 2 - MENU_IN - 1));
    p = { x: lerp(share.x, copy.x, t), y: lerp(share.y, copy.y, t) - Math.sin(t * Math.PI) * 30 };
  } else {
    const t = EASE((frame - COPY_CLICK - 4) / 12);
    p = { x: copy.x + 40 * t, y: copy.y + 70 * t };
  }
  const o = c01((frame - CURSOR_IN) / 4) * (1 - c01((frame - T.lien - 8) / 8));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <Cursor x={p.x - 9} y={p.y - 5} clickAt={frame >= COPY_CLICK - 1 ? COPY_CLICK : SHARE_CLICK} />
    </div>
  );
};

// ───────────────────────────── link chip + source cards ─────────────────────────────
const CHIP = { x: 88, y: 1052, h: 80 };
const LinkChip: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = T.lien - 1;
  if (frame < t0) return null;
  const fly = c01((frame - t0) / 10);
  const k = outBack(fly, 1.2);
  const from = { x: MENU.x + 20, y: MENU.y + 14 };
  const x = lerp(from.x, CHIP.x, k);
  const y = lerp(from.y, CHIP.y, k) - Math.sin(fly * Math.PI) * 14;
  const sc = lerp(0.55, 1, k);
  const blur = (1 - fly) * 5;
  const pulse = frame >= T.insta ? Math.max(0, 1 - (frame - T.insta) / 14) : 0;
  const sheen = c01((frame - (t0 + 14)) / 16);
  const copied = inOut(frame, t0 + 10, 6);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        height: CHIP.h,
        transformOrigin: "0 50%",
        transform: `scale(${sc})`,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        opacity: c01(fly * 3),
        ...glass(true),
        borderRadius: 999,
        padding: "0 26px 0 12px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        overflow: "hidden",
        boxShadow: `0 18px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,236,220,0.25), 0 0 ${50 + 40 * pulse}px rgba(217,119,87,${0.4 + 0.4 * pulse})`,
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 28, background: `linear-gradient(180deg, ${K.coralLight}, ${K.coral})`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <IconLink s={30} color="#1A0F0B" sw={2.6} />
      </div>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 25, color: K.muted, whiteSpace: "nowrap" }}>
        instagram.com/reel/<span style={{ color: K.cream, fontWeight: 700 }}>DeqsqIbJ2xB</span>
      </div>
      <div style={{ opacity: copied.p, transform: `scale(${0.6 + 0.4 * copied.p})`, marginLeft: 2 }}>
        <IconCheck s={26} />
      </div>
      {sheen > 0 && sheen < 1 ? (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${-30 + 140 * sheen}%`, width: "22%", background: "linear-gradient(100deg, transparent, rgba(255,240,230,0.22), transparent)", transform: "skewX(-18deg)" }} />
      ) : null}
    </div>
  );
};

const CARD = { y: 1166, w: 180, h: 244, gap: 20 };
const cardX = (i: number) => CHIP.x + i * (CARD.w + CARD.gap);
const SourceIcon: React.FC<{ kind: number; frame: number; at: number }> = ({ kind, frame, at }) => {
  const fl = Math.sin((frame - at) / 9) * 3;
  if (kind === 0)
    return (
      <svg width={70} height={86} viewBox="0 0 70 86" style={{ transform: `translateY(${fl}px)` }}>
        <rect x={16} y={4} width={38} height={70} rx={9} fill="rgba(217,119,87,0.12)" stroke={K.coral} strokeWidth={3} />
        <rect x={29} y={9} width={12} height={3} rx={1.5} fill={K.coral} />
        <path d="M30 30 L44 39 L30 48 Z" fill={K.coral} />
        <circle cx={56} cy={68} r={13} fill={K.bg1} stroke={K.coralLight} strokeWidth={2.5} />
        <g transform="translate(47.5 59.5) scale(0.72)">
          <path d="M10 13.5a4.6 4.6 0 0 0 6.6.4l3-3a4.6 4.6 0 0 0-6.5-6.5l-1.6 1.6M14 10.5a4.6 4.6 0 0 0-6.6-.4l-3 3a4.6 4.6 0 0 0 6.5 6.5l1.6-1.6" fill="none" stroke={K.coralLight} strokeWidth={2.6} strokeLinecap="round" />
        </g>
      </svg>
    );
  if (kind === 1) {
    const roll = ((frame - at) * 0.9) % 14;
    return (
      <svg width={86} height={86} viewBox="0 0 86 86" style={{ transform: `translateY(${fl}px)` }}>
        <defs>
          <clipPath id="s1film">
            <rect x={6} y={16} width={74} height={54} rx={8} />
          </clipPath>
        </defs>
        <rect x={6} y={16} width={74} height={54} rx={8} fill="rgba(217,119,87,0.12)" stroke={K.coral} strokeWidth={3} />
        <g clipPath="url(#s1film)">
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <rect x={4 + i * 14 - roll} y={20} width={7} height={6} rx={1.5} fill={K.coral} opacity={0.8} />
              <rect x={4 + i * 14 - roll} y={60} width={7} height={6} rx={1.5} fill={K.coral} opacity={0.8} />
            </g>
          ))}
        </g>
        <path d="M36 33 L52 43 L36 53 Z" fill={K.cream} />
      </svg>
    );
  }
  // anything: 4 mini glyphs popping in turn
  const g = [0, 1, 2, 3].map((i) => outBack((frame - at - i * 2) / 5, 2));
  const hi = Math.floor((frame - at) / 8) % 4;
  const box = (i: number, x: number, y: number, el: React.ReactNode) => (
    <g key={i} transform={`translate(${x} ${y}) scale(${g[i]})`} opacity={c01(g[i])}>
      <rect x={-17} y={-17} width={34} height={34} rx={9} fill={hi === i ? "rgba(217,119,87,0.3)" : "rgba(255,236,220,0.07)"} stroke={hi === i ? K.coral : K.stroke} strokeWidth={1.8} />
      {el}
    </g>
  );
  return (
    <svg width={86} height={86} viewBox="0 0 86 86">
      {box(0, 24, 24, <path d="M-6 1.5a4 4 0 0 0 5.7.3l2.6-2.6a4 4 0 0 0-5.6-5.6l-1.4 1.4M2 -1.5a4 4 0 0 0-5.7-.3l-2.6 2.6a4 4 0 0 0 5.6 5.6l1.4-1.4" fill="none" stroke={K.coralLight} strokeWidth={2.2} strokeLinecap="round" />)}
      {box(1, 62, 24, <path d="M-8 7 L-2 -1 L2 4 L5 0 L9 7 Z M3 -6 a2.5 2.5 0 1 0 0.1 0" fill={K.coralLight} />)}
      {box(2, 24, 62, <g stroke={K.coralLight} strokeWidth={2.4} strokeLinecap="round"><line x1={-8} y1={-5} x2={8} y2={-5} /><line x1={-8} y1={1} x2={8} y2={1} /><line x1={-8} y1={7} x2={2} y2={7} /></g>)}
      {box(3, 62, 62, <g fill={K.coralLight}>{[-7, -3.5, 0, 3.5, 7].map((x, k) => <rect key={x} x={x - 1.2} y={-[4, 8, 5, 9, 3][k]} width={2.4} height={[4, 8, 5, 9, 3][k] * 2} rx={1.2} />)}</g>)}
    </svg>
  );
};

const SOURCES = [
  { at: T.insta, label: "Instagram", sub: "/reel/ · lien", rtl: false },
  { at: T.video, label: "vidéo", sub: ".mp4 · .mov", rtl: false },
  { at: T.any, label: "أي حاجة", sub: "YouTube · …", rtl: true },
];
const SourceCards: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.sawa - 4) return null;
  const slots = inOut(frame, T.sawa - 3, 8);
  return (
    <>
      {SOURCES.map((s, i) => {
        const x = cardX(i);
        const filled = frame >= s.at - 1;
        const sp = popAt(frame, s.at - 1);
        const fresh = 1 - c01((frame - s.at - 4) / 16);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: CARD.y, width: CARD.w, height: CARD.h }}>
            {/* dashed slot (appears on the first « سواء ») */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 26, border: `2px dashed rgba(255,236,220,${0.34 * (1 - c01(sp))})`, opacity: slots.p, transform: `scale(${0.96 + 0.04 * slots.p})` }} />
            {filled ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  ...glass(fresh > 0.25),
                  borderRadius: 26,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "10px 8px",
                  opacity: c01(sp * 2),
                  transform: `translateY(${(1 - c01(sp)) * 26}px) scale(${0.7 + 0.3 * sp})`,
                  boxShadow: `0 18px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,236,220,0.22), 0 0 ${46 * fresh}px rgba(217,119,87,${0.55 * fresh})`,
                }}
              >
                <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", transform: "scale(1.22)" }}>
                  <SourceIcon kind={i} frame={frame} at={s.at} />
                </div>
                <div dir={s.rtl ? "rtl" : undefined} style={{ fontFamily: s.rtl ? AR : UI, fontWeight: 800, fontSize: s.rtl ? 32 : i === 0 ? 29 : 32, color: K.cream, lineHeight: 1.1, whiteSpace: "nowrap", letterSpacing: s.rtl ? 0 : "-0.01em" }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 16, color: K.muted, whiteSpace: "nowrap" }}>{s.sub}</div>
              </div>
            ) : null}
          </div>
        );
      })}
      {/* « ou » separators between the slots */}
      {[0, 1].map((i) => {
        const o = slots.p * 0.9;
        return (
          <div key={i} style={{ position: "absolute", left: cardX(i) + CARD.w + CARD.gap / 2 - 14, top: CARD.y + CARD.h / 2 - 14, width: 28, height: 28, borderRadius: 14, background: K.bg1, border: `1.5px solid ${K.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 19, color: K.coralLight, opacity: o }}>
            ou
          </div>
        );
      })}
      {/* the copied link IS the Instagram source: a short connector */}
      {frame >= T.insta ? (
        <div style={{ position: "absolute", left: cardX(0) + CARD.w / 2 - 1, top: CHIP.y + CHIP.h + 2, width: 2, height: (CARD.y - CHIP.y - CHIP.h - 4) * EASE((frame - T.insta) / 5), background: K.coral, opacity: 0.8 }} />
      ) : null}
    </>
  );
};

// ───────────────────────────── scene ─────────────────────────────
export const Step1: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.start || frame > T.end + 10) return null;
  const q = EASE((frame - T.end) / 8);
  // slow push 1→1.03 + tiny camera punches on the snap, the heart and the copy click
  const punch = (at: number, amt: number) => (frame >= at && frame < at + 12 ? amt * Math.sin((Math.PI * (frame - at)) / 12) : 0);
  const push = 1 + 0.03 * c01((frame - T.phoneIn) / (T.end - T.phoneIn)) + punch(T.reel, 0.012) + punch(T.like, 0.018) + punch(COPY_CLICK, 0.012);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "540px 1245px",
          transform: `scale(${push * (1 - 0.04 * q)}) translateY(${q * -20}px)`,
          opacity: 1 - q,
          filter: q > 0 ? `blur(${q * 8}px)` : undefined,
        }}
      >
        <Rail />
        <SwipeHint />
        {TAGS.map((d, i) => (
          <Tag key={d.word} d={d} i={i} />
        ))}
        <SourceCards />
        <Phone />
        <Leaders />
        <FloatingHearts />
        <ContextMenu />
        <LinkChip />
        <CursorRig />
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────────── sound ─────────────────────────────
export const step1Cues: Cue[] = [
  { f: SWIPES[0][0], sfx: "swipe", vol: 0.26, note: "feed swipe 1" },
  { f: SWIPES[1][0], sfx: "swipe", vol: 0.3, note: "feed swipe 2 (نلوّج)" },
  { f: SWIPES[2][0], sfx: "swipe", vol: 0.22, note: "feed swipe 3" },
  { f: SWIPES[4][0], sfx: "swipe", vol: 0.2, note: "feed swipe 5 (snap)" },
  { f: T.reel, sfx: "tap", vol: 0.45, note: "snap on the reel" },
  { f: T.reel + 1, sfx: "tick", vol: 0.25, note: "focus brackets lock" },
  { f: T.like, sfx: "pop", vol: 0.5, note: "heart burst (عجبتني)" },
  { f: T.like + 2, sfx: "snapchat-notification", vol: 0.18, note: "like" },
  { f: GLIDE, sfx: "whoosh", vol: 0.2, note: "phone glides right", trimFrames: 14 },
  { f: T.motion, sfx: "pop", vol: 0.36, note: "tag motion" },
  { f: T.style, sfx: "pop", vol: 0.36, note: "tag style" },
  { f: T.rythme, sfx: "pop", vol: 0.36, note: "tag rythme" },
  { f: T.anim, sfx: "pop", vol: 0.4, note: "tag animation" },
  { f: TAGS_OUT, sfx: "whip", vol: 0.16, note: "tags clear" },
  { f: SHARE_CLICK, sfx: "mouse-click", vol: 0.45, note: "click share" },
  { f: MENU_IN, sfx: "switch", vol: 0.22, note: "menu opens" },
  { f: COPY_CLICK, sfx: "mouse-click", vol: 0.5, note: "Copier le lien" },
  { f: T.lien - 1, sfx: "whoosh", vol: 0.32, note: "link chip flies out", trimFrames: 14 },
  { f: T.lien + 9, sfx: "tick", vol: 0.3, note: "link chip lands" },
  { f: T.insta, sfx: "pop", vol: 0.38, note: "source Instagram" },
  { f: T.video, sfx: "pop", vol: 0.38, note: "source vidéo" },
  { f: T.any, sfx: "pop", vol: 0.42, note: "source أي حاجة" },
  { f: T.any + 6, sfx: "tap", vol: 0.2, note: "mini glyphs" },
];
