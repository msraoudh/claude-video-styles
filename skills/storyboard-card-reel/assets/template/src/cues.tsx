import React from "react";
import { at, DURATION, end, w, LINES } from "./lib/time";
import {
  AnswerCard, Bars, BigWord, Brackets, Bubble, ChatBar, CheckBar, ClaudeLogo, CountUp, Draw, FilmStrip, Flash, Gauge, GlowRing,
  IconTile, Label, LightSweep, WaveOut, bigWordWaveY, NumTile, Page, People, Phone, Photo, Pop, ReelOnly, Sparkle, Stack, Stamp, Stars, Target, Type, UserCard, Venn, VideoCard,
} from "./fx/fx";

import { TRANSITIONS } from "./parts/Camera";
import type { Shot } from "./parts/Footage";

/**
 * Beat sheet v4: an animated element on every phrase (2–6 words), black + red + white (red = accent), see-through glass,
 * real-colour photos, no borders.
 * layer: behind = between the wall and the user (big words HIGH, y≈145: only their bottom ~20 % behind his hair),
 *        front = over him (free walls + chest), page = full screen (≤2.5 s),
 *        screen = Showcase CANVAS coordinates (1080×1920, full size, outside the card): the bold moments.
 * Zones (1080×1920): head ≈ x 300–760 (close: 247–825), y 220–880 (close: 100–940).
 *   RW = right wall, centre x 945, ≤220 wide · LW = left wall, centre x 135, ≤220 wide · y 300–820
 *   TOP = above the hair y 120–340 (big words) · CAP = caption bar y≈1290 · CH = chest y 1380–1645 (rows, charts, chat)
 */
export type Sfx = { src: string; at: number; vol?: number };
export type Cue = { from: number; dur: number; layer: "behind" | "front" | "page" | "screen"; el: (dur: number) => React.ReactNode; sfx?: Sfx[] };

const cues: Cue[] = [];
const add = (from: number, to: number, layer: Cue["layer"], el: Cue["el"], sfx: Sfx[] = []) =>
  cues.push({ from, dur: Math.max(4, to - from), layer, el, sfx });
const S = (name: string, t: number, vol = 1): Sfx => ({ src: `audio/sfx/${name}.wav`, at: t, vol });

const RW = 945, LW = 135, WALL_Y = 540, CH = 1505;
/** chest rows: 3 slots */
const ROW_Y = 1355, ROW_GAP = 98;
const HEAD = { x: 290, y: 190, w: 480, h: 700 } as const;

/* ---------- "screen" layer = Showcase CANVAS (1080×1920), full size. Card = x 372–1040, y 300–1488 (Reel × 0.6185),
 * storyboard card x 28–448, y 500–1260. Keep off his face (x 560–850, y 420–780) and the caption zone (y 1540–1690). */
const SC = { x: 600, w: 820, size: 54, top3: 1108, top2: 1170, gap: 112, colL: 50, colR: 548, colW: 480 } as const;
/** a bold moment: the in-card version stays in the full-screen Reel; Showcase draws it on the canvas at full size instead */
const both = (from: number, to: number, layer: "front" | "page", reelEl: Cue["el"], screenEl: Cue["el"], sfx: Sfx[] = []) => {
  add(from, to, layer, (d) => <ReelOnly>{reelEl(d)}</ReelOnly>, sfx);
  add(from, to, "screen", screenEl, []);
};

/* ======================= HOOK ======================= */
// « كان إنتي من العباد » → red face brackets lock on him, tag « إنتي »
add(at("hook"), w("hook", "تعلّمو"), "front", (d) => <Brackets {...HEAD} dur={d} tag="إنتي" />, [S("click-soft", at("hook") + 1, 0.45)]);
// « تعلّمو يتمنّشو بـClaude » → a red ring arcs round his head (behind), the Claude mark lands on the right wall
add(w("hook", "تعلّمو"), end("hook"), "behind", (d) => <GlowRing cx={530} cy={520} r={410} dur={d} frames={16} start={-20} />, [S("whoosh-soft-1", w("hook", "تعلّمو") - 2, 0.45)]);
both(w("hook", "بـClaude") - 3, end("hook") + 8, "front", (d) => (
  <>
    <Pop x={RW} y={420} size={190} dur={d} float={false}><ClaudeLogo size={170} /></Pop>
    <Label text="Claude" x={RW} y={575} size={40} red dur={d} delay={5} />
  </>
), (d) => (
  // canvas: the Claude mark lands big on the left, half over the storyboard card, ring + name
  <>
    <GlowRing cx={235} cy={560} r={160} width={10} dur={d} frames={14} />
    <Pop x={235} y={560} size={250} dur={d} float={false}><ClaudeLogo size={230} /></Pop>
    <Type text="Claude" x={235} y={790} size={92} font="cap" tone="white" delay={5} dur={d} />
    <Sparkle x={420} y={400} size={70} delay={8} color="#FFFFFF" />
    <Sparkle x={60} y={720} size={52} delay={11} />
  </>
), [S("hit-reveal", w("hook", "بـClaude") - 3, 0.5)]);
// « ومكش عارف تعمل كيف هاذي » → a question tile on the left wall, an arrow draws to « this »
add(w("hook", "ومكش"), end("hook") + 2, "front", (d) => (
  <>
    <IconTile icon="question" x={LW} y={470} size={170} dur={d} label="كيف ؟" />
    <Draw dur={d} frames={9} delay={w("hook", "كيف") - w("hook", "ومكش")} width={10} d={["M150,700 C190,820 260,880 330,880", "M300,850 L334,882 L292,900"]} />
  </>
), [S("pop-light", w("hook", "ومكش"), 0.45), S("scribble-write", w("hook", "كيف"), 0.4)]);

/* ======================= LIK ======================= */
// « الـvideo هاذي » → a glass video card slides in left; « ليك » → LIK slams at the top
add(at("lik"), end("lik"), "front", (d) => <VideoCard x={LW + 10} y={600} w={210} dur={d} />, [S("whoosh-soft-2", at("lik") - 2, 0.45)]);
add(w("lik", "هاذي"), end("lik"), "behind", (d) => <BigWord text="LIK" dur={d} x={225} spacing={34} sparkles={false} />, [S("pop-hard", w("lik", "ليك"), 0.6)]);

/* ======================= CROWD (page) ======================= */
add(at("crowd"), end("crowd") + 2, "page", (d) => {
  const t = (k: string) => w("crowd", k) - at("crowd");
  return (
    <Page dur={d}>
      <Type text="برشا" y={400} size={230} tone="white" delay={t("برشا")} />
      <Photo src="crowd.jpg" x={540} y={880} w={820} h={700} dur={d} rotate={-2} pos="50% 40%" />
      <Type text="عباد" x={600} y={1240} size={220} delay={t("عباد")} rotate={-2} />
      <Label text="تعلّمو يتمنّشو" x={540} y={1420} size={50} dur={d} delay={t("تعلّمو")} />
      <Pop x={360} y={1580} size={140} dur={d} delay={t("بـClaude")} float={false}><ClaudeLogo size={120} bare /></Pop>
      <Type text="Claude" x={620} y={1580} size={110} font="cap" tone="white" delay={t("بـClaude") + 2} />
      <Sparkle x={140} y={360} size={80} delay={t("برشا") + 4} color="#FFFFFF" />
      <Sparkle x={950} y={1300} size={64} delay={t("تعلّمو")} />
    </Page>
  );
}, [S("paper-slide", at("crowd") - 3, 0.55), S("pop-light", w("crowd", "عباد"), 0.4), S("pop-light", w("crowd", "بـClaude"), 0.45)]);

/* ======================= DELIVER ======================= */
// one glass row per thing delivered, on its word (2 columns on the chest)
add(at("deliver"), end("deliver"), "front", (d) => <IconTile icon="arrowUp" x={RW} y={WALL_Y - 40} size={160} dur={d} delay={w("deliver", "وينجّمو") - at("deliver")} label="livrer" />,
  ["يـlivriw", "برشا", "حاجات", "بيه"].map((k) => S("data-tick-snap", w("deliver", k), 0.4)));
both(at("deliver"), end("deliver"), "front", (d) => {
  const t = (k: string) => w("deliver", k) - at("deliver");
  const bar = (k: string, label: string) => ({ node: <CheckBar text={label} at={t(k)} width={480} size={46} />, at: t(k) });
  return (
    <>
      <Stack x={40} y={ROW_Y} dur={d} gap={ROW_GAP + 6} items={[bar("يـlivriw", "posts"), bar("حاجات", "images")]} />
      <Stack x={560} y={ROW_Y} dur={d} gap={ROW_GAP + 6} items={[bar("برشا", "code"), bar("بيه", "vidéos")]} />
    </>
  );
}, (d) => {
  const t = (k: string) => w("deliver", k) - at("deliver");
  const bar = (k: string, label: string) => ({ node: <CheckBar text={label} at={t(k)} width={SC.colW} size={56} />, at: t(k) });
  return (
    <>
      <Stack x={SC.colL} y={SC.top2} dur={d} gap={SC.gap + 6} items={[bar("يـlivriw", "posts"), bar("حاجات", "images")]} />
      <Stack x={SC.colR} y={SC.top2} dur={d} gap={SC.gap + 6} items={[bar("برشا", "code"), bar("بيه", "vidéos")]} />
    </>
  );
});

/* ======================= MINORITY ======================= */
// a crowd of 36 people on glass; on « minorité » they dim and only three glow red; « la différence » lands on them
add(at("minority"), end("minority"), "front", (d) => {
  const t = (k: string) => w("minority", k) - at("minority");
  return (
    <>
      <People x={540} y={CH + 10} dur={d} hiAt={t("minorité")} />
      <Label text="la différence" x={540} y={CH + 10} size={58} red dur={d} delay={t("la différence")} rotate={-3} />
    </>
  );
}, [S("pop-light", at("minority") + 2, 0.35), S("node-blip-3", w("minority", "minorité"), 0.5), S("pop-light", w("minority", "la différence"), 0.45)]);
add(w("minority", "minorité"), end("minority"), "front", (d) => <Label text="minorité" x={RW - 10} y={420} size={36} dur={d} rotate={-4} />, []);

/* ======================= UNCLEAR6 « … هاذي الكل معاها » ======================= */
// the difference gauge swings to the max
add(at("unclear6"), end("unclear6"), "front", (d) => (
  <>
    <Gauge x={RW - 5} y={WALL_Y} r={80} dur={d} start={w("unclear6", "هاذي") - at("unclear6")} land={w("unclear6", "معاها") - at("unclear6")} label="الفرق" />
    <LightSweep delay={w("unclear6", "الكل") - at("unclear6")} />
    <Sparkle x={LW} y={420} size={70} delay={w("unclear6", "الكل") - at("unclear6")} />
  </>
), [S("count-tick", w("unclear6", "هاذي"), 0.35), S("pop-light", w("unclear6", "معاها"), 0.4)]);

/* ======================= TWO ======================= */
add(at("two"), w("two", "ما"), "front", (d) => <Brackets {...HEAD} dur={d} tag="personnellement" />, [S("click-soft", at("two") + 1, 0.45)]);
add(w("two", "ما"), w("two", "زوز"), "front", (d) => <IconTile icon="eye" x={LW} y={WALL_Y} size={170} dur={d} />, [S("pop-light", w("two", "ما"), 0.4)]);
add(w("two", "زوز") - 2, end("two"), "behind", (d) => <BigWord text="ZOUZ" dur={d} />, [S("pop-hard", w("two", "زوز") - 2, 0.65)]);
add(w("two", "زوز"), end("two"), "front", (d) => <NumTile x={LW} y={WALL_Y + 40} n={2} dur={d} size={130} label="حاجات" />, []);
add(w("two", "la différence"), end("two"), "front", (d) => <Label text="≠" x={RW} y={WALL_Y - 40} size={90} red dur={d} />, [S("pop-light", w("two", "la différence"), 0.4)]);
// « les AI users » → the two user cards slide in from the sides (they come back on « زوز users »)
const CARD = { w: 220, h: 300, y: 560, xl: 128, xr: 952 } as const;
add(w("two", "les AI users"), end("two"), "front", (d) => (
  <>
    <UserCard label="USER A" x={CARD.xl} y={CARD.y + 330} w={CARD.w} h={CARD.h} dur={d} rotate={-3} from="left" />
    <UserCard label="USER B" x={CARD.xr} y={CARD.y + 330} w={CARD.w} h={CARD.h} dur={d} delay={3} rotate={3} from="right" />
  </>
), [S("whoosh-soft-1", w("two", "les AI users") - 2, 0.45)]);

/* ======================= CREA_INT (page) ======================= */
add(at("crea_int"), end("crea_int"), "page", (d) => {
  const t = (k: string) => w("crea_int", k) - at("crea_int");
  return (
    <Page dur={d}>
      <Type text="la" y={560} size={80} font="cap" tone="red" italic />
      <Type text="CRÉATIVITÉ" y={720} size={190} tone="white" delay={2} from="left" />
      <IconTile icon="bulb" x={190} y={940} size={150} dur={d} delay={4} rotate={-6} />
      <Type text="&" y={900} size={150} tone="white" delay={t("و")} />
      <IconTile icon="search" x={890} y={940} size={150} dur={d} delay={t("l'intelligence")} rotate={6} />
      <Type text="INTELLIGENCE" y={1080} size={180} delay={t("l'intelligence")} from="right" />
      <Sparkle x={150} y={600} size={90} delay={6} color="#FFFFFF" />
      <Sparkle x={940} y={1220} size={70} delay={t("l'intelligence") + 4} />
    </Page>
  );
}, [S("paper-slide", at("crea_int") - 2, 0.55), S("pop-light", w("crea_int", "l'intelligence"), 0.55)]);

/* ======================= EXPLAIN ======================= */
add(at("explain"), end("explain"), "front", (d) => <Bubble text="نفسّرلك" x={540} y={CH - 30} dur={d} size={56} typing={7} />, [S("notif-pop", at("explain"), 0.45)]);

/* ======================= SAME TOOL, TWO USERS ======================= */
add(w("same", "users") - 2, end("same"), "front", (d) => {
  const t = (k: string) => w("same", k) - w("same", "users") + 2;
  return (
    <>
      <UserCard label="USER A" x={CARD.xl} y={CARD.y} w={CARD.w} h={CARD.h} dur={d} rotate={-3} logoAt={t("Claude،")} from="left" />
      <UserCard label="USER B" x={CARD.xr} y={CARD.y} w={CARD.w} h={CARD.h} dur={d} delay={3} rotate={3} logoAt={t("Claude،") + 3} from="right" />
    </>
  );
}, [S("whoosh-soft-1", w("same", "users") - 3, 0.45), S("data-tick-snap", w("same", "نفس"), 0.4), S("data-tick-snap", w("same", "الـmodèle،"), 0.4), S("pop-light", w("same", "Claude،"), 0.45), S("data-tick-snap", w("same", "كل"), 0.4)]);

both(w("same", "users") - 2, end("same"), "front", (d) => {
  const t = (k: string) => w("same", k) - w("same", "users") + 2;
  return (
    <Stack x={540} y={ROW_Y} align="center" dur={d} gap={ROW_GAP} items={[
      { node: <CheckBar text="نفس الـoutil" at={t("نفس")} width={720} size={48} />, at: t("نفس") },
      { node: <CheckBar text="نفس الـmodèle" at={t("الـmodèle،")} width={720} size={48} />, at: t("الـmodèle،") },
      { node: <CheckBar text="كل شي = نفس الشي" at={t("كل")} width={720} size={48} />, at: t("كل") },
    ]} />
  );
}, (d) => {
  const t = (k: string) => w("same", k) - w("same", "users") + 2;
  return (
    <Stack x={SC.x} y={SC.top3} align="center" dur={d} gap={SC.gap} items={[
      { node: <CheckBar text="نفس الـoutil" at={t("نفس")} width={SC.w} size={SC.size} />, at: t("نفس") },
      { node: <CheckBar text="نفس الـmodèle" at={t("الـmodèle،")} width={SC.w} size={SC.size} />, at: t("الـmodèle،") },
      { node: <CheckBar text="كل شي = نفس الشي" at={t("كل")} width={SC.w} size={SC.size} />, at: t("كل") },
    ]} />
  );
});

/* ======================= CLASSIC (page) ======================= */
add(at("classic"), end("classic"), "page", (d) => {
  const t = (k: string) => w("classic", k) - at("classic");
  return (
    <Page dur={d}>
      <Label text="USER A" x={540} y={250} size={48} red dur={d} delay={2} />
      <Type text="CLASSIQUE" y={420} size={180} tone="white" delay={Math.min(8, t("classique،") - 3)} />
      <Photo src="sleep.jpg" x={540} y={930} w={800} h={820} dur={d} rotate={2} delay={3} />
      <ReelOnly><Stamp text="déjà vu" x={720} y={1380} dur={d} delay={t("déjà vu")} size={96} /></ReelOnly>
      <Type text="zzz" x={250} y={1450} size={90} font="cap" tone="white" italic delay={t("déjà vu") + 4} />
    </Page>
  );
}, [S("paper-slide", at("classic") - 3, 0.55), S("pop-light", w("classic", "classique،"), 0.4), S("impact-soft", w("classic", "déjà vu"), 0.5)]);

add(at("classic"), end("classic"), "screen", (d) => <Stamp text="déjà vu" x={800} y={1290} dur={d} delay={w("classic", "déjà vu") - at("classic")} size={150} rotate={-9} />);

/* ======================= SATISFIED ======================= */
add(at("satisfied"), end("satisfied"), "front", (d) => (
  <>
    <UserCard label="USER A" x={CARD.xl} y={CARD.y} w={CARD.w} h={CARD.h} dur={d} rotate={-3} photo="thumbs.jpg" pos="45% 22%" logoAt={-30} />
    <UserCard label="USER B" x={CARD.xr} y={CARD.y} w={CARD.w} h={CARD.h} dur={d} delay={-30} rotate={3} logoAt={-30} dimAt={0} />
    <Stars x={540} y={CH - 40} size={72} dur={d} delay={w("satisfied", "satisfait") - at("satisfied")} />
  </>
), [S("pop-light", at("satisfied"), 0.4), S("data-tick-snap", w("satisfied", "satisfait") + 4, 0.4)]);

/* ======================= OTHER ======================= */
add(at("other"), end("other"), "front", (d) => {
  const t = (k: string) => w("other", k) - at("other");
  return (
    <>
      <UserCard label="USER A" x={CARD.xl} y={CARD.y} w={CARD.w} h={CARD.h} dur={d} delay={-30} rotate={-3} photo="thumbs.jpg" photoAt={-30} pos="45% 22%" dimAt={0} />
      <UserCard label="USER B" x={CARD.xr} y={CARD.y} w={CARD.w} h={CARD.h} dur={d} delay={-30} rotate={3} logoAt={-30} photo="bulb.jpg" pos="50% 25%" photoAt={t("بشكل")} redAt={t("créatif")} flipAt={t("بشكل") - 4} />
      <Sparkle x={CARD.xr - 90} y={CARD.y - 170} size={70} delay={t("جديد،")} />
      <Sparkle x={CARD.xr + 80} y={CARD.y + 150} size={54} delay={t("جديد،") + 3} />
      <Label text="بشكل جديد" x={540} y={ROW_Y + 30} size={50} dur={t("créatif") + 2} delay={t("بشكل")} />
      <ReelOnly><Type text="CRÉATIF" y={CH + 60} size={150} delay={t("créatif")} /></ReelOnly>
    </>
  );
}, [S("pop-light", w("other", "بشكل"), 0.45), S("hit-reveal", w("other", "créatif"), 0.45)]);
add(w("other", "créatif"), end("other"), "screen", (d) => (
  <>
    <Type text="CRÉATIF" x={600} y={1290} size={250} />
    <Sparkle x={130} y={1180} size={80} delay={3} color="#FFFFFF" />
    <Sparkle x={1000} y={1390} size={60} delay={6} />
  </>
));

/* ======================= COMBINE ======================= */
add(at("combine"), end("combine"), "front", (d) => {
  const t = (k: string) => w("combine", k) - at("combine");
  return (
    <>
      <Venn x={540} y={CH} r={140} dur={d} a="concept A" b="concept B" bAt={t("des concepts،")} mergeAt={t("des concepts،") + 8} result="jamais vu" resultAt={t("يـexpérimenti")} />
      <IconTile icon="flask" x={RW} y={WALL_Y} size={170} dur={d} delay={t("يـexpérimenti")} label="test" />
    </>
  );
}, [S("whoosh-soft-2", at("combine"), 0.4), S("whoosh-soft-2", w("combine", "des concepts،"), 0.4), S("pop-light", w("combine", "يـexpérimenti"), 0.5)]);

/* ======================= RESULTS ======================= */
add(at("results"), end("results"), "front", (d) => {
  const t = (k: string) => w("results", k) - at("results");
  const r0 = t("des résultats");
  return <Bars x={540} y={CH} dur={d} bars={[{ v: 0.3, at: r0 }, { v: 0.45, at: r0 + 3 }, { v: 0.38, at: r0 + 6 }, { v: 0.55, at: r0 + 9 }, { v: 1.45, at: t("تتصوّر"), label: "?!" }]} />;
}, [S("tech-slide", w("results", "des résultats"), 0.4), S("swoosh-zoom", w("results", "تتصوّر"), 0.45)]);
add(w("results", "ماملية"), end("results"), "behind", (d) => <BigWord text="INIMAGINABLE" dur={d} />, [S("pop-hard", w("results", "ماملية"), 0.6)]);

/* ======================= EXAMPLE + THE 6 CREATIVE ITEMS ======================= */
add(at("example"), at("ideas"), "front", (d) => <Label text="par exemple" x={540} y={150} size={50} red dur={d + 4} />, [S("write-fast", at("example"), 0.4)]);
const ITEMS: [string, string, string | null][] = [
  ["ideas", "les idées", "bulb.jpg"],
  ["concept", "le concept", "think.jpg"],
  ["story", "storytelling", "clap.jpg"],
  ["angles", "angles caméra", "camera.jpg"],
  ["transitions", "transitions", null],
  ["vfx", "effets visuels", null],
];
both(at("ideas"), end("vfx"), "front", (d) => {
  const L = (id: string) => at(id) - at("ideas");
  const bar = (id: string, label: string) => ({ node: <CheckBar text={label} at={L(id)} width={505} size={44} />, at: L(id) });
  return (
    <>
      <Stack x={25} y={ROW_Y} dur={d} gap={ROW_GAP} items={[bar("ideas", "les idées"), bar("story", "storytelling"), bar("transitions", "transitions")]} />
      <Stack x={550} y={ROW_Y} dur={d} gap={ROW_GAP} items={[bar("concept", "le concept"), bar("angles", "angles caméra"), bar("vfx", "effets visuels")]} />
    </>
  );
}, (d) => {
  const L = (id: string) => at(id) - at("ideas");
  const bar = (id: string, label: string) => ({ node: <CheckBar text={label} at={L(id)} width={SC.colW} size={50} />, at: L(id) });
  return (
    <>
      <Stack x={SC.colL} y={SC.top3} dur={d} gap={SC.gap} items={[bar("ideas", "les idées"), bar("story", "storytelling"), bar("transitions", "transitions")]} />
      <Stack x={SC.colR} y={SC.top3} dur={d} gap={SC.gap} items={[bar("concept", "le concept"), bar("angles", "angles caméra"), bar("vfx", "effets visuels")]} />
    </>
  );
}, ITEMS.map(([id]) => S("data-tick-snap", at(id), 0.4)));
// a counter on the left wall (01 → 06), the real object on the right wall, on each item
ITEMS.forEach(([id, , photo], i) => {
  const next = i < ITEMS.length - 1 ? at(ITEMS[i + 1][0]) : end("vfx");
  add(at(id), next, "front", (d) => (
    <>
      <NumTile x={LW} y={WALL_Y - 40} n={i + 1} dur={d} size={120} />
      {photo ? <Photo src={photo} x={RW} y={WALL_Y} w={220} h={290} dur={d} rotate={i % 2 ? 5 : -5} from="right" /> : null}
      {id === "transitions" ? <IconTile icon="film" x={RW} y={WALL_Y} size={180} dur={d} /> : null}
      {id === "vfx" ? <IconTile icon="spark" x={RW} y={WALL_Y} size={180} dur={d} /> : null}
    </>
  ), photo ? [S("pop-light", at(id) + 1, 0.3)] : []);
});
add(at("transitions"), at("transitions") + 6, "page", () => <Flash frames={6} />, [S("whoosh-fast-1", at("transitions") - 2, 0.55)]);
add(at("vfx"), at("vfx") + 8, "page", () => <Flash frames={8} />, []);
add(at("vfx"), end("vfx"), "front", () => (
  <>
    <Sparkle x={LW + 40} y={300} size={80} delay={2} color="#FFFFFF" />
    <Sparkle x={RW - 30} y={300} size={60} delay={5} />
    <Sparkle x={RW + 40} y={800} size={50} delay={8} />
  </>
), []);

/* ======================= TELL ======================= */
add(at("tell"), end("tell"), "front", (d) => {
  const t = (k: string) => w("tell", k) - at("tell");
  return (
    <>
      <FilmStrip y={CH + 20} dur={d} photos={["clap.jpg", "camera.jpg", "bulb.jpg", "think.jpg", "mirror.jpg"]} step={9} />
      <IconTile icon="book" x={RW} y={WALL_Y} size={170} dur={d} delay={t("l'histoire")} label="l'histoire" />
    </>
  );
}, [S("tech-slide", at("tell"), 0.4), S("write-fast", w("tell", "l'histoire"), 0.45)]);

/* ======================= NEEDS ======================= */
add(at("needs"), end("needs"), "front", (d) => <Stars x={540} y={CH} n={6} size={70} shape="check" step={2} dur={d} />, ["الكل"].map((k) => S("data-flow-tick", w("needs", k), 0.4)));
add(w("needs", "الـcréativité") - 3, end("needs"), "behind", (d) => <BigWord text="CRÉATIVITÉ" dur={d} />, [S("pop-hard", w("needs", "الـcréativité") - 3, 0.6)]);

/* ======================= SECOND: INTELLIGENCE ======================= */
add(at("second"), at("second") + 6, "page", () => <Flash frames={6} />, [S("whoosh-fast-1", at("second") - 3, 0.5)]);
add(w("second", "للحاجة"), end("second"), "front", (d) => <NumTile x={LW} y={WALL_Y + 60} n={2} dur={d} size={130} label="الثانية" />, [S("count-tick", w("second", "للحاجة"), 0.35)]);
add(w("second", "l'intelligence") - 3, end("second"), "behind", (d) => <BigWord text="INTELLIGENCE" dur={d} />, [S("pop-hard", w("second", "l'intelligence") - 3, 0.6)]);
add(w("second", "l'intelligence"), end("second"), "front", (d) => <IconTile icon="search" x={RW} y={WALL_Y + 60} size={160} dur={d} />, []);

/* ======================= NOT ENOUGH ======================= */
{
  const t = (k: string) => w("notenough", k) - at("notenough");
  const rows = (x: number, y: number, wd: number, size: number, gap: number) => (d: number) => (
    <Stack x={x} y={y} align="center" dur={d} gap={gap} items={[
      { node: <CheckBar text="la créativité" at={t("الـcréativité")} width={wd} size={size} />, at: t("الـcréativité") },
      { node: <CheckBar text="وحدها ما تكفيش" at={t("وحدها")} width={wd} size={size} mark="cross" />, at: t("وحدها") },
    ]} />
  );
  both(at("notenough"), end("notenough"), "front", rows(540, ROW_Y, 720, 50, ROW_GAP + 10), rows(SC.x, SC.top2, SC.w, 58, SC.gap + 10));
}
add(at("notenough"), end("notenough"), "front", (d) => {
  const t = (k: string) => w("notenough", k) - at("notenough");
  return <Gauge x={RW - 5} y={WALL_Y} r={80} dur={d} start={t("الـcréativité")} land={t("تكفيش")} value={0.48} label="50 %" />;
}, [S("data-tick-snap", w("notenough", "الـcréativité"), 0.45), S("node-blip-3", w("notenough", "وحدها"), 0.5)]);

/* ======================= ACADEMIC ======================= */
add(at("academic"), end("academic"), "front", (d) => {
  const t = (k: string) => w("academic", k) - at("academic");
  return (
    <>
      <Photo src="grad.jpg" x={RW} y={WALL_Y - 20} w={220} h={290} dur={d} rotate={6} pos="50% 20%" from="right" />
      <Draw dur={d} frames={8} delay={t("مانيش")} width={16} d={["M860,400 L1030,640", "M1030,400 L860,640"]} />
      <Label text="académique" x={RW - 10} y={WALL_Y + 170} size={34} dur={d} delay={t("l'intelligence académique")} rotate={-4} />
      <ReelOnly><Stamp text="مانيش" x={540} y={CH} dur={d} delay={t("مانيش")} size={90} rotate={-6} /></ReelOnly>
    </>
  );
}, [S("pop-light", at("academic"), 0.45), S("scribble-write", w("academic", "مانيش"), 0.5)]);
add(at("academic"), end("academic"), "screen", (d) => <Stamp text="مانيش" x={660} y={1260} dur={d} delay={w("academic", "مانيش") - at("academic")} size={150} rotate={-6} />);

/* ======================= CAPACITY (page) ======================= */
add(at("capacity") - 2, end("capacity") + 2, "page", (d) => {
  const t = (k: string) => w("capacity", k) - at("capacity") + 2;
  return (
    <Page dur={d}>
      <Type text="CAPACITÉ" y={560} size={210} tone="white" delay={3} />
      <Type text="باش تفهم" y={760} size={100} font="cap" tone="red" delay={t("باش")} />
      <Draw dur={d} frames={22} delay={t("un problème") - 8} width={11}
        d={["M160,1060 C220,940 300,1180 360,1040 C410,920 470,1160 520,1030 C560,940 600,1110 640,1040", "M640,1040 L900,1040", "M860,1010 L905,1040 L860,1070"]} />
      <IconTile icon="search" x={540} y={1290} size={170} dur={d} delay={t("باش") + 4} />
      <Type text="un problème" y={1480} size={96} font="cap" tone="white" italic delay={t("un problème")} />
    </Page>
  );
}, [S("paper-slide", at("capacity") - 4, 0.55), S("scribble-write", w("capacity", "un problème") - 6, 0.45)]);

/* ======================= ASK / STEER / CHALLENGE ======================= */
add(at("ask"), end("ask"), "front", (d) => (
  <>
    <ChatBar text="شنوّة نسأل ؟" x={540} y={CH} dur={d} cps={1.2} sendAt={d - 6} />
    <IconTile icon="question" x={RW} y={WALL_Y} size={170} dur={d} />
  </>
), [S("typing-soft", at("ask") + 2, 0.35)]);
add(at("steer"), end("steer"), "front", (d) => (
  <>
    <ChatBar text="ركّز على الـcontexte" x={540} y={CH} dur={d} cps={1.6} sendAt={d - 6} />
    <IconTile icon="steer" x={RW} y={WALL_Y} size={170} dur={d} rotate={0} />
  </>
), [S("click-ui-1", at("steer"), 0.45)]);
add(at("challenge"), end("challenge"), "front", (d) => {
  const t = (k: string) => w("challenge", k) - at("challenge");
  return (
    <>
      <Bubble text="are you sure ? prouve-le." x={1030} y={ROW_Y + 20} dur={d} mine anchor="right" size={44} typing={4} />
      <Bubble text="…ok, je vérifie" x={50} y={ROW_Y + 160} dur={d} delay={t("الـréponse")} anchor="left" size={44} typing={10} />
      <IconTile icon="cross" x={LW} y={WALL_Y} size={150} dur={d} delay={t("تـchallengiha")} />
    </>
  );
}, [S("notif-pop", at("challenge"), 0.45), S("notif-pop", w("challenge", "الـréponse"), 0.4)]);

/* ======================= JUDGE ======================= */
add(at("judge"), end("judge"), "front", (d) => <IconTile icon="search" x={RW} y={WALL_Y} size={170} dur={d} label="تعرف ؟" />, [S("click-soft", w("judge", "كيفاش"), 0.35), S("data-tick-snap", w("judge", "الـrésultat"), 0.4), S("node-blip-3", w("judge", "ينجح"), 0.45), S("node-blip-3", w("judge", "ينجحش"), 0.45)]);

{
  const t = (k: string) => w("judge", k) - at("judge");
  const rows = (x: number, y: number, wd: number, size: number, gap: number) => (d: number) => (
    <Stack x={x} y={y} align="center" dur={d} gap={gap} items={[
      { node: <CheckBar text="الـrésultat" at={t("الـrésultat")} width={wd} size={size} mark="dot" hot={false} />, at: t("الـrésultat") },
      { node: <CheckBar text="ينجح ؟" at={t("ينجح")} width={wd} size={size} />, at: t("ينجح") },
      { node: <CheckBar text="ولا ما ينجحش ؟" at={t("ينجحش")} width={wd} size={size} mark="cross" />, at: t("ينجحش") },
    ]} />
  );
  both(at("judge"), end("judge"), "front", rows(540, ROW_Y, 720, 48, ROW_GAP), rows(SC.x, SC.top3, SC.w, SC.size, SC.gap));
}

/* ======================= PERFECT-LOOKING, BUT WRONG (page) ======================= */
add(at("perfect"), w("wrong", "غالطة") + 22, "page", (d) => {
  const t = (id: string, k: string) => w(id, k) - at("perfect");
  return (
    <Page dur={d}>
      <Type text="الـAI تعطيك réponse" y={360} size={74} font="cap" tone="white" delay={t("perfect", "الـAI")} />
      <AnswerCard x={540} y={820} scale={1.75} okAt={t("perfect", "parfaite")} wrongAt={t("wrong", "غالطة") - 2} />
      <Type text="t'ban PARFAITE…" y={1240} size={110} tone="white" delay={t("perfect", "تبان")} />
      <Type text="techniquement" y={1420} size={70} font="cap" tone="red" italic delay={t("wrong", "techniquement")} />
      <ReelOnly><Stamp text="غالطة" x={620} y={1580} dur={d} delay={t("wrong", "غالطة") - 2} size={110} /></ReelOnly>
    </Page>
  );
}, [S("paper-slide", at("perfect") - 3, 0.55), S("typing-soft", at("perfect") + 4, 0.3), S("data-tick-snap", w("perfect", "parfaite"), 0.45), S("impact-soft", w("wrong", "غالطة") - 2, 0.65)]);
add(w("wrong", "غالطة") - 2, w("wrong", "غالطة") + 22, "screen", (d) => <Stamp text="غالطة" x={760} y={1380} dur={d} size={170} rotate={-8} />);

/* ======================= RECUL / JUGER ======================= */
add(w("recul", "عندكش"), end("recul"), "front", (d) => <Label text="ما عندكش" x={RW - 10} y={WALL_Y - 120} size={38} red dur={d} rotate={-4} />, [S("write-fast", w("recul", "عندكش"), 0.4)]);
{
  const t = (id: string, k: string) => w(id, k) - w("recul", "le recul");
  const rows = (x: number, y: number, wd: number, size: number, gap: number) => (d: number) => {
    const bar = (id: string, k: string, label: string) => ({ node: <CheckBar text={label} at={t(id, k)} width={wd} size={size} mark="cross" />, at: t(id, k) });
    return <Stack x={x} y={y} align="center" dur={d} gap={gap} items={[bar("recul", "le recul", "le recul"), bar("recul", "l'expérience", "l'expérience"), bar("juger", "de juger", "juger le résultat")]} />;
  };
  both(w("recul", "le recul"), end("juger"), "front", rows(540, ROW_Y, 720, 48, ROW_GAP), rows(SC.x, SC.top3, SC.w, SC.size, SC.gap),
    [S("node-blip-3", w("recul", "le recul"), 0.4), S("node-blip-3", w("recul", "l'expérience"), 0.4), S("node-blip-3", w("juger", "de juger"), 0.4)]);
}
add(at("juger"), end("juger"), "front", (d) => <Gauge x={RW - 5} y={WALL_Y} r={80} dur={d} start={0} land={w("juger", "de juger") - at("juger")} value={0.12} label="capacité" />, [S("count-tick", at("juger"), 0.3)]);

/* ======================= RISK (page) ======================= */
add(at("risk"), end("risk"), "page", (d) => {
  const t = (k: string) => w("risk", k) - at("risk");
  return (
    <Page dur={d}>
      <Type text="tu risques de produire" y={300} size={72} font="cap" tone="white" italic />
      <Photo src="trash.jpg" x={540} y={760} w={820} h={640} dur={d} rotate={-2} pos="55% 50%" delay={t("de produire") - 4} />
      <Type text="VALEUR" x={540} y={1120} size={100} tone="white" delay={t("برشا")} />
      <ReelOnly>
        <CountUp from={100} to={0} suffix="%" x={540} y={1330} size={250} dur={d} start={t("برشا")} land={t("sans valeur")} />
        <Type text="SANS VALEUR" y={1560} size={140} delay={t("sans valeur")} />
      </ReelOnly>
    </Page>
  );
}, [S("paper-slide", at("risk") - 3, 0.55), S("count-tick", w("risk", "برشا"), 0.35), S("pop-hard", w("risk", "sans valeur"), 0.5)]);
add(at("risk"), end("risk"), "screen", (d) => {
  const t = (k: string) => w("risk", k) - at("risk");
  return (
    <>
      <CountUp from={100} to={0} suffix="%" x={640} y={1215} size={340} dur={d} start={t("برشا")} land={t("sans valeur")} />
      <Stamp text="SANS VALEUR" x={600} y={1440} dur={d} delay={t("sans valeur")} size={120} rotate={-4} />
    </>
  );
});

/* ======================= THE DIFFERENCE ======================= */
add(w("diff", "exactement"), w("diff", "la différence"), "front", (d) => <Target x={540} y={CH} r={95} dur={d} />, [S("click-ui-1", w("diff", "exactement"), 0.4)]);
add(w("diff", "la différence"), end("smart"), "front", (d) => {
  const t = (id: string, k: string) => w(id, k) - w("diff", "la différence");
  return (
    <>
      <UserCard label="USER A" x={CARD.xl} y={CARD.y} w={CARD.w} h={CARD.h} dur={d} rotate={-3} photo="thumbs.jpg" pos="45% 22%" tag="عاديين" tagAt={t("normal", "العاديين")} dimAt={t("smart", "l'intelligence")} from="left" />
      <UserCard label="USER B" x={CARD.xr} y={CARD.y} w={CARD.w} h={CARD.h} dur={d} delay={3} rotate={3} photo="bulb.jpg" pos="50% 25%" redAt={t("smart", "l'intelligence")} tag="intelligent" tagAt={t("smart", "l'intelligence")} from="right" />
      <ReelOnly><Type text="VS" y={CH} size={200} delay={t("normal", "les users")} /></ReelOnly>
      <Label text="+ créatif" x={CARD.xr} y={CARD.y + CARD.h / 2 + 140} size={38} red dur={d} delay={t("smart", "les créatifs")} rotate={-3} />
    </>
  );
}, [S("whoosh-soft-2", w("diff", "la différence") - 2, 0.4), S("pop-hard", w("normal", "les users"), 0.4), S("hit-reveal", w("smart", "l'intelligence"), 0.45), S("pop-light", w("smart", "les créatifs"), 0.4)]);

add(w("normal", "les users"), end("smart"), "screen", (d) => <Type text="VS" x={706} y={1250} size={330} dur={d} />);

/* ======================= A PRODUCT REFLECTS YOU ======================= */
add(at("see"), end("product"), "front", (d) => {
  const t = (id: string, k: string) => w(id, k) - at("see");
  return (
    <>
      <Phone x={RW} y={WALL_Y} dur={d} delay={t("see", "نشوف")} scale={0.95} />
      <IconTile icon="eye" x={LW} y={WALL_Y} size={150} dur={d} />
      <Label text="made with AI" x={540} y={CH - 20} size={56} red dur={d} delay={t("product", "مصنوع")} />
    </>
  );
}, [S("swoosh-zoom", w("see", "نشوف"), 0.45), S("pop-light", w("product", "مصنوع"), 0.4)]);
add(at("reflect"), w("reflect", "نشوفو"), "behind", (d) => <BigWord text="REFLET" dur={d} />, [S("pop-hard", at("reflect"), 0.55)]);
add(w("reflect", "الـcréativité"), w("reflect", "نشوفو"), "front", (d) => {
  const t = (k: string) => w("reflect", k) - w("reflect", "الـcréativité");
  return (
    <>
      <Label text="créativité" x={290} y={CH - 20} size={54} red dur={d} rotate={-3} />
      <Label text="intelligence" x={790} y={CH + 60} size={54} red dur={d} delay={t("l'intelligence")} rotate={3} />
    </>
  );
}, [S("pop-light", w("reflect", "الـcréativité"), 0.4), S("pop-light", w("reflect", "l'intelligence"), 0.4)]);
add(w("reflect", "نشوفو"), end("reflect"), "front", (d) => <Brackets {...HEAD} dur={d} delay={0} tag="إنتي" tagSide="top" />, [S("click-soft", w("reflect", "نشوفو"), 0.4)]);
add(w("reflect", "نشوفو"), end("reflect"), "front", (d) => <IconTile icon="mirror" x={RW} y={WALL_Y} size={170} dur={d} delay={4} />, []);

add(at("think"), end("think"), "front", (d) => (
  <>
    <Photo src="think.jpg" x={LW} y={WALL_Y + 40} w={220} h={290} dur={d} rotate={-6} pos="50% 25%" from="left" />
    <IconTile icon="bulb" x={LW} y={WALL_Y - 210} size={120} dur={d} delay={w("think", "تخمّم") - at("think")} />
  </>
), [S("pop-light", at("think"), 0.4)]);
// in → out: what you think becomes the result
const inOut = (id: string, a: string, b: string, good: boolean, x: number, y: number, wd: number, size: number, gap: number) => (d: number) => {
  const t0 = w(id, "تخمّم") - at(id);
  const t1 = w(id, "résultat") - at(id);
  return (
    <Stack x={x} y={y} align="center" dur={d} gap={gap} items={[
      { node: <CheckBar text={a} at={t0} width={wd} size={size} mark="dot" hot={false} />, at: t0 },
      { node: <CheckBar text={b} at={t1} width={wd} size={size} mark={good ? "check" : "cross"} />, at: t1 },
    ]} />
  );
};
const inOutIcon = (id: string, good: boolean) => (d: number) => <IconTile icon={good ? "check" : "cross"} x={RW} y={WALL_Y} size={170} dur={d} delay={w(id, "résultat") - at(id)} hot={good} />;
add(at("good"), end("good"), "front", inOutIcon("good", true), [S("data-tick-snap", w("good", "تخمّم"), 0.4), S("data-tick-snap", w("good", "résultat"), 0.45)]);
both(at("good"), end("good"), "front", inOut("good", "تخمّم بالباهي", "résultat باهية", true, 540, ROW_Y, 720, 50, ROW_GAP + 20), inOut("good", "تخمّم بالباهي", "résultat باهية", true, SC.x, SC.top2, SC.w, 58, SC.gap + 14));
add(at("bad"), end("bad"), "front", inOutIcon("bad", false), [S("data-tick-snap", w("bad", "تخمّم"), 0.4), S("node-blip-3", w("bad", "résultat"), 0.45)]);
both(at("bad"), end("bad"), "front", inOut("bad", "تخمّم بالخايب", "résultat خايبة", false, 540, ROW_Y, 720, 50, ROW_GAP + 20), inOut("bad", "تخمّم بالخايب", "résultat خايبة", false, SC.x, SC.top2, SC.w, 58, SC.gap + 14));

/* ======================= CONCRET ======================= */
add(at("concret"), end("concret"), "front", (d) => {
  const t = (k: string) => w("concret", k) - at("concret");
  const c = t("تـconcrétisi");
  return (
    <>
      <Draw dur={c + 6} frames={12} width={9} d={["M945,330 C875,330 865,420 910,460 C925,474 923,505 945,505 C967,505 965,474 980,460 C1025,420 1015,330 945,330", "M927,530 L963,530"]} />
      <GlowRing cx={RW} cy={430} r={105} width={9} dur={d} delay={c} frames={12} />
      <Pop x={RW} y={430} size={160} dur={d} delay={c + 2} float={false}><ClaudeLogo size={130} /></Pop>
      <Label text="concrétisi" x={RW - 10} y={600} size={36} red dur={d} delay={c + 4} rotate={-4} />
      <IconTile icon="bulb" x={LW} y={WALL_Y} size={160} dur={d} delay={t("les idées")} label="les idées" />
      <Label text="finalement…" x={540} y={ROW_Y + 10} size={48} dur={t("الـrésultat") + 2} delay={t("finalement")} />
      <Target x={540} y={CH + 20} r={90} dur={d} delay={t("الـrésultat") - 2} />
    </>
  );
}, [S("scribble-write", at("concret"), 0.4), S("hit-reveal", w("concret", "تـconcrétisi"), 0.5), S("pop-light", w("concret", "les idées"), 0.35), S("click-ui-1", w("concret", "الـrésultat") - 2, 0.4)]);

/* ======================= MIRROR ======================= */
const reflects = LINES.find((x) => x.id === "mirror")!.words.filter((x) => x.text === "ça reflète").map((x) => Math.round(x.s * 30));
add(at("mirror"), w("mirror", "في"), "front", (d) => <Phone x={RW} y={WALL_Y} dur={d} delay={w("mirror", "un produit") - at("mirror") - 8} scale={0.95} rotate={-5} sub="ton produit" />, [S("swoosh-zoom", w("mirror", "un produit") - 8, 0.4)]);
add(w("mirror", "l'intelligence"), reflects[0], "front", (d) => {
  const t = (k: string) => w("mirror", k) - w("mirror", "l'intelligence");
  return <Venn x={540} y={CH} r={140} dur={d} a="intelligence" b="créativité" bAt={t("créativité")} mergeAt={t("الـrésultat،") - 4} result="résultat" resultAt={t("الـrésultat،")} />;
}, [S("whoosh-soft-2", w("mirror", "l'intelligence"), 0.4), S("whoosh-soft-2", w("mirror", "créativité"), 0.4), S("pop-light", w("mirror", "الـrésultat،"), 0.45)]);
add(w("mirror", "في"), end("mirror"), "front", (d) => (
  <>
    <Photo src="mirror.jpg" x={RW} y={WALL_Y} w={220} h={290} dur={d} rotate={-4} pos="20% 50%" from="right" />
    <Label text="= toi" x={RW} y={WALL_Y + 190} size={46} red dur={d} delay={reflects[0] - w("mirror", "في")} rotate={-4} />
  </>
), [S("pop-light", w("mirror", "في"), 0.4)]);
{
  const t = (k: number) => reflects[k] - reflects[0];
  const rows = (x: number, y: number, wd: number, size: number, gap: number) => (d: number) => (
    <Stack x={x} y={y} align="center" dur={d} gap={gap} items={[
      { node: <CheckBar text="شنوّة تخمّم" at={t(0)} width={wd} size={size} />, at: t(0) },
      { node: <CheckBar text="شكون وليت" at={t(1)} width={wd} size={size} />, at: t(1) },
      { node: <CheckBar text="créatif ولا لا ؟" at={t(2)} width={wd} size={size} />, at: t(2) },
    ]} />
  );
  both(reflects[0], end("mirror"), "front", rows(540, ROW_Y, 720, 48, ROW_GAP), rows(SC.x, SC.top3, SC.w, SC.size, SC.gap), reflects.map((fr) => S("data-tick-snap", fr, 0.4)));
}

/* ======================= THE LINE (page) ======================= */
add(at("dont") - 2, end("dont") + 1, "page", (d) => {
  const t = (k: string) => w("dont", k) - at("dont") + 2;
  return (
    <Page dur={d} sweepAt={t("just learn")}>
      <ReelOnly>
        <Type text="DON'T" y={640} size={240} tone="white" />
        <Type text="JUST" y={860} size={240} tone="white" delay={t("just learn")} />
        <Draw dur={d} frames={7} delay={t("just learn") + 8} width={24} d="M290,870 L800,830" />
        <Type text="LEARN AI" y={1080} size={240} delay={t("just learn") + 6} />
      </ReelOnly>
    </Page>
  );
}, [S("riser-hook", at("dont") - 50, 0.3), S("hit-deep", at("dont") - 2, 0.65)]);
// Showcase: the punch spans the whole canvas (his face is not on screen during the page)
add(at("dont") - 2, end("dont") + 1, "screen", (d) => {
  const t = (k: string) => w("dont", k) - at("dont") + 2;
  return (
    <>
      <LightSweep delay={t("just learn")} frames={16} />
      <Type text="DON'T" y={560} size={330} tone="white" />
      <Type text="JUST" y={880} size={330} tone="white" delay={t("just learn")} />
      <Draw dur={d} frames={7} delay={t("just learn") + 8} width={30} d="M200,900 L880,850" />
      <Type text="LEARN AI" y={1200} size={250} delay={t("just learn") + 6} stagger={2} />
      <Sparkle x={110} y={420} size={90} delay={4} color="#FFFFFF" />
      <Sparkle x={980} y={1390} size={80} delay={t("just learn") + 10} />
    </>
  );
});
add(at("around"), w("around", "smart around"), "front", (d) => <Type text="learn how to be" y={230} size={92} font="cap" tone="red" italic dur={d} stagger={4} />, [S("write-fast", at("around"), 0.4)]);
add(w("around", "smart around"), end("around"), "behind", (d) => <BigWord text="SMART" dur={d} />, [S("pop-hard", w("around", "smart around"), 0.55)]);
add(w("around", "smart around") + 6, end("around"), "front", (d) => (
  <>
    <Label text="around AI" x={RW - 10} y={WALL_Y + 60} size={38} red dur={d} rotate={-4} />
    <Pop x={RW} y={WALL_Y - 110} size={140} dur={d} delay={w("around", "AI") - w("around", "smart around") - 8} float={false}><ClaudeLogo size={120} /></Pop>
  </>
), []);

/* ======================= FINAL ======================= */
add(at("final"), w("final", "créatif"), "front", (d) => <Pop x={RW} y={WALL_Y - 40} size={150} dur={d} float><ClaudeLogo size={130} /></Pop>, [S("data-tick-snap", at("final"), 0.4), S("data-tick-snap", w("final", "تعلّم"), 0.4), S("data-tick-snap", w("final", "تكون") - 4, 0.35)]);
{
  const t = (k: string) => w("final", k) - at("final");
  const rows = (x: number, y: number, wd: number, size: number, gap: number) => (d: number) => (
    <Stack x={x} y={y} align="center" dur={d} gap={gap} items={[
      { node: <CheckBar text="استعمل الـAI" at={0} width={wd} size={size} />, at: 0 },
      { node: <CheckBar text="تعلّم الـAI" at={t("تعلّم")} width={wd} size={size} />, at: t("تعلّم") },
      { node: <CheckBar text="تعلّم تكون…" at={t("تكون") - 4} width={wd} size={size} mark="dot" />, at: t("تكون") - 4 },
    ]} />
  );
  both(at("final"), w("final", "créatif"), "front", rows(540, ROW_Y, 720, 48, ROW_GAP), rows(SC.x, SC.top3, SC.w, SC.size, SC.gap));
}
add(w("final", "وفي"), Math.min(end("final") + 40, DURATION - 60), "front", (d) => <Brackets {...HEAD} dur={d} />, [S("click-soft", w("final", "وفي"), 0.35)]);
both(w("final", "créatif"), Math.min(end("final") + 40, DURATION - 60), "front", (d) => {
  const t = (k: string) => w("final", k) - w("final", "créatif");
  return (
    <>
      <Type text="CRÉATIF" y={1450} size={170} tone="white" />
      <Type text="& INTELLIGENT" y={1600} size={110} delay={t("intelligent")} />
      <Sparkle x={150} y={1420} size={80} delay={4} color="#FFFFFF" />
      <Sparkle x={930} y={1600} size={64} delay={t("intelligent") + 3} />
    </>
  );
}, (d) => {
  const t = (k: string) => w("final", k) - w("final", "créatif");
  return (
    <>
      <Type text="CRÉATIF" x={600} y={1160} size={270} tone="white" />
      <Type text="& INTELLIGENT" x={600} y={1390} size={170} delay={t("intelligent")} />
      <Sparkle x={90} y={1060} size={100} delay={4} color="#FFFFFF" />
      <Sparkle x={1010} y={1300} size={80} delay={t("intelligent") + 3} />
      <Sparkle x={330} y={1480} size={60} delay={t("intelligent") + 7} color="#FFFFFF" />
    </>
  );
}, [S("pop-light", w("final", "créatif"), 0.5), S("impact-soft", w("final", "intelligent"), 0.5)]);

/* ---------- card layout break-outs (only visible OUTSIDE 0–1080, i.e. around the card in Showcase) ---------- */
// every big word's red wave runs on past the card onto the canvas
const BIG: [string, number, number][] = [
  ["LIK", w("lik", "هاذي"), end("lik")],
  ["ZOUZ", w("two", "زوز") - 2, end("two")],
  ["INIMAGINABLE", w("results", "ماملية"), end("results")],
  ["CRÉATIVITÉ", w("needs", "الـcréativité") - 3, end("needs")],
  ["INTELLIGENCE", w("second", "l'intelligence") - 3, end("second")],
  ["REFLET", at("reflect"), w("reflect", "نشوفو")],
  ["SMART", w("around", "smart around"), end("around")],
];
BIG.forEach(([txt, a, b]) => add(a, b, "front", (d) => <WaveOut y={bigWordWaveY(txt)} dur={d} />, []));
// (v4: the hook's Claude mark and the closing line now live on the "screen" layer, at full canvas size)

/* ---------- a whoosh on each camera transition (Camera.ts), except the ones that already carry a hit ---------- */
{
  const SOUND: Record<string, [string, number]> = { whipL: ["whoosh-fast-1", 0.55], whipR: ["whoosh-fast-1", 0.55], whipU: ["whoosh-fast-1", 0.55], zoom: ["swoosh-zoom", 0.5], flash: ["whoosh-soft-1", 0.45], redflash: ["whoosh-soft-1", 0.45], spinL: ["whoosh-soft-2", 0.45] };
  for (const t of TRANSITIONS) {
    const k = t.kinds.find((x) => SOUND[x]);
    if (!k || t.at === at("second") || t.at === at("dont") - 2) continue;
    const [name, vol] = SOUND[k];
    add(t.at - 3, t.at + 3, "front", () => null, [S(name, t.at - 3, vol)]);
  }
}

export const CUES = cues;
export const PAGES: [number, number][] = cues.filter((c) => c.layer === "page" && c.dur > 10).map((c) => [c.from, c.from + c.dur]);

/* ---------- camera (v5, engine in parts/Camera.ts): base framing still hard-cuts wide ↔ close on each line (the face-anchored
 *  graphics were placed on it), and every shot now MOVES: move = slow push (+) / pull (−), drift = lateral px, punch = snap zoom
 *  on the stressed word, jump cuts inside a line re-frame (±7 %). Big-word lines stay wide, pinned to the top (a zoom pushes his
 *  hair DOWN, the word behind it keeps reading). mirror ends on a ramp push that snaps into DON'T. Transitions: Camera.ts ---------- */
const WIDE = 1.035, CLOSE = 1.28;
const bigLines = new Set(["lik", "two", "results", "needs", "second", "reflect", "around"]);
const scales = LINES.map((_, i) => (i % 2 ? CLOSE : WIDE));
LINES.forEach((l, i) => {
  if (!bigLines.has(l.id)) return;
  scales[i] = WIDE;
  if (i > 0 && !bigLines.has(LINES[i - 1].id)) scales[i - 1] = CLOSE;
  if (i < LINES.length - 1 && !bigLines.has(LINES[i + 1].id)) scales[i + 1] = CLOSE;
});
/** [move, punches [word, amount, frame offset?]] per line; pages (crowd, crea_int, classic, capacity, perfect, risk, dont) hold */
const CAM: Record<string, [number, [string, number, number?][]]> = {
  hook: [0.05, [["بـClaude", 0.08]]], lik: [-0.03, [["ليك", 0.04]]], deliver: [0.05, [["حاجات", 0.07]]],
  minority: [-0.05, [["minorité", 0.08]]], unclear6: [0.04, []], two: [0.03, [["زوز", 0.045, -2]]],
  explain: [0.06, []], same: [-0.05, [["نفس", 0.06]]], satisfied: [0.05, [["satisfait", 0.05]]], other: [0.05, [["créatif", 0.09]]],
  combine: [-0.05, [["concepts", 0.05]]], results: [0.03, [["ماملية", 0.045]]], example: [0.04, []], ideas: [0.04, []],
  concept: [-0.04, []], story: [0.05, []], angles: [0.03, [["caméra", 0.06]]], transitions: [-0.04, []], vfx: [0.05, []],
  tell: [0.05, [["l'histoire", 0.07]]], needs: [-0.03, [["الـcréativité", 0.04, -3]]], second: [0.03, [["l'intelligence", 0.045, -3]]],
  notenough: [0.07, [["تكفيش", 0.08]]], academic: [-0.05, [["académique", 0.07]]], ask: [0.04, [["تسأل", 0.07]]],
  steer: [0.04, [["توجّهها", 0.07]]], challenge: [0.04, [["تـchallengiha", 0.08]]], judge: [0.08, [["ينجح", 0.04], ["ينجحش", 0.06]]],
  recul: [0.05, [["l'expérience", 0.07]]], juger: [-0.05, [["juger", 0.06]]], diff: [0.06, [["la différence", 0.08]]], normal: [0.04, []],
  smart: [-0.05, [["les créatifs", 0.06]]], see: [0.04, []], product: [0.04, []], reflect: [-0.03, []], think: [0.05, [["تخمّم", 0.06]]],
  good: [0.05, [["باهية", 0.07]]], bad: [0.05, [["خايبة", 0.08]]], concret: [-0.05, [["تـconcrétisi", 0.05]]], mirror: [0.04, []],
  around: [0.03, [["smart around", 0.045]]], final: [-0.05, [["intelligent", 0.07]]],
};
export const SHOTS: Shot[] = LINES.map((l, i) => {
  const [move, punches] = CAM[l.id] ?? [0, []];
  const big = bigLines.has(l.id);
  return {
    from: Math.round(l.s * 30), scale: scales[i], move, drift: (scales[i] > 1.1 ? 14 : 10) * (i % 2 ? 1 : -1),
    punch: punches.map(([word, amt, off]) => [w(l.id, word) + (off ?? 0), amt] as [number, number]),
    alt: big ? 0.04 : 0.07, pinTop: big, ramp: l.id === "mirror" ? [at("dont") - 42, 0.18] : undefined,
  };
});
