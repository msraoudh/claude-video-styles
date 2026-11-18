"""Master timing plan of a trailer. The music is the clock.

Reads trailer.json + the music analysis (music_prep.sh output) and writes:
  plan/plan.json                 everything resolved to trailer frames (the mixer, voice builder and QA read it)
  video/src/data/beats.ts        BEATS, DOWNBEATS, HITS (808 onsets), BIG_HITS, SUB_ENV, KEY, MUSIC
  video/src/data/voice.ts        LINES (the subject's own voice lines + per-word frames), line(id)
  video/src/data/sections.ts     SECTIONS, PARTS (which agent owns which sections), section(id)
  video/src/data/fx.ts           TrailerFX settings: letterbox curves, flash frames, grain
Re-run it after every change to trailer.json (cheap, ~1 s), then rebuild the voice (build_voice.py).
Run in the project folder: ~/.venvs/audio/bin/python ~/.claude/skills/aura-trailer/scripts/plan.py
"""
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402

C = tlib.config()
FPS = C.get("fps", 60)
DUR_F = int(round(C["duration_s"] * FPS))
M = C["music"]
OFFSET = float(M["offset_s"])  # song second (processed file) playing at trailer frame 0


def T2F(t):
    return int(round(t * FPS))


def S2F(song_t):  # song seconds -> trailer frame
    return T2F(song_t - OFFSET)


am = json.load(open(tlib.path(M.get("beatmap", "music/audiomap.json"))))
bass = json.load(open(tlib.path(M.get("bass", "music/bass.json"))))

# ---------------------------------------------------------------- named moments
keys = {}
for k, v in C.get("key", {}).items():
    if "song" in v:
        x = v["song"]
        keys[k] = [S2F(s) for s in x] if isinstance(x, list) else S2F(x)
    elif "t" in v:
        x = v["t"]
        keys[k] = [T2F(s) for s in x] if isinstance(x, list) else T2F(x)
    elif "f" in v:
        keys[k] = v["f"]
    else:
        raise SystemExit(f"key {k}: give song / t / f seconds or frames")
keys["start"], keys["end"] = 0, DUR_F - 1


def ref(v):
    return tlib.frame(v, keys, FPS, OFFSET)


# ---------------------------------------------------------------- voice lines
VS = C["voice"]["sources"]
pools = {sid: tlib.load_words(s["words"]) for sid, s in VS.items() if s.get("words")}
lines = []
for L in C["lines"]:
    lid, src, a, b, at, text = L["id"], L["src"], float(L["in"]), float(L["out"]), float(L["at"]), L["text"]
    words = []
    for w, s, e in pools.get(src, []):
        if s >= a - 0.05 and s < b - 0.05:
            ws, we = max(s, a), min(e, b)
            words.append({"w": w.strip(), "f": T2F(at + ws - a), "e": T2F(at + we - a)})
    lines.append({"id": lid, "src": src, "clip": VS[src].get("clip", ""), "srcIn": a, "srcOut": b, "at": at,
                  "from": T2F(at), "durationInFrames": T2F(b - a), "text": text, "words": words})


# ---------------------------------------------------------------- music grid in trailer frames
def keep(fs):
    return [f for f in fs if 0 <= f < DUR_F]


bsec = am["grid"]["beats_sec"]
beats = keep([S2F(t) for t in bsec])
downbeats = keep([S2F(t) for t in am["grid"]["downbeats_sec"]])
# the analyzer stops tracking the grid near the end of a song: extend it at the measured period
n = min(40, len(bsec))
if n >= 8:
    period = (bsec[-1] - bsec[-n]) / (n - 1)
    t = bsec[-1]
    while S2F(t + period) < DUR_F:
        t += period
        beats.append(S2F(t))
bh = M.get("big_hit", {})
hits = [{"f": S2F(h["t"]), "rise": h["rise_db"], "level": h["level_db"]} for h in bass["hits"]]
hits = [h for h in hits if 0 <= h["f"] < DUR_F]
big = [h for h in hits if h["rise"] >= bh.get("min_rise_db", 6) and h["level"] > bh.get("min_level_db", -12)]
start = int(round(OFFSET * FPS))
env = bass["sub_env"][start:start + DUR_F]
env += [0.0] * (DUR_F - len(env))

sections = [{"id": s["id"], "from": T2F(s["from_s"]), "to": T2F(s["to_s"]), "what": s.get("what", "")} for s in C["sections"]]
parts = C.get("parts") or [{"id": s["id"], "from": s["id"], "to": s["id"]} for s in C["sections"]]

FX = C.get("fx", {})
live_until = ref(FX.get("live_until", "key:end"))
letterbox = [[[ref(a), float(px)] for a, px in curve] for curve in FX.get("letterbox", [])]
flash = sorted({h["f"] for h in big if h["f"] < live_until} | {ref(x) for x in FX.get("flash_extra", [])})

music_static = "music/" + os.path.basename(M["file"])
plan = {
    "fps": FPS, "durationInFrames": DUR_F, "musicOffset": OFFSET,
    "music": M["file"], "musicCredit": M.get("credit", ""),
    "sections": sections, "parts": parts,
    "lines": lines,
    "beats": beats, "downbeats": downbeats, "hits": hits, "bigHits": big,
    "keyFrames": keys,
    "fx": {"letterbox": letterbox, "flash": flash, "liveUntil": live_until, "grain": FX.get("grain", 0.11)},
}
os.makedirs(tlib.path("plan"), exist_ok=True)
json.dump(plan, open(tlib.path("plan/plan.json"), "w"), ensure_ascii=False, indent=1)

# the Studio preview plays the processed song from public/
pub = tlib.path(f"video/public/{music_static}")
if not os.path.exists(pub) and os.path.exists(tlib.path(M["file"])):
    os.makedirs(os.path.dirname(pub), exist_ok=True)
    shutil.copy(tlib.path(M["file"]), pub)

D = tlib.path("video/src/data")
os.makedirs(D, exist_ok=True)
hdr = "// GENERATED by aura-trailer/scripts/plan.py from trailer.json — do not edit by hand.\n"
bpm = am.get("tempo", "")
bpm = bpm.get("bpm", "") if isinstance(bpm, dict) else bpm
with open(f"{D}/beats.ts", "w") as fh:
    fh.write(hdr)
    fh.write(f"export const FPS = {FPS};\nexport const DURATION = {DUR_F};\n")
    fh.write(f"/** every beat of the song ({bpm} BPM), trailer frames */\nexport const BEATS: number[] = {json.dumps(beats)};\n")
    fh.write(f"/** bar starts */\nexport const DOWNBEATS: number[] = {json.dumps(downbeats)};\n")
    fh.write("/** sub-bass (808) onsets: f = frame, rise = dB jump, level = dB after the hit (0 = loudest) */\n")
    fh.write(f"export const HITS: {{f: number; rise: number; level: number}}[] = {json.dumps(hits)};\n")
    fh.write("/** the heavy 808 accents — put the biggest visual punches here */\n")
    fh.write(f"export const BIG_HITS: number[] = {json.dumps([h['f'] for h in big])};\n")
    fh.write("/** sub-bass loudness per frame, 0..1 (drive shake / glow / zoom with it) */\n")
    fh.write(f"export const SUB_ENV: number[] = {json.dumps(env)};\n")
    fh.write(f"export const KEY = {json.dumps(keys)} as const;\n")
    fh.write("/** the processed song (public/) and the song frame that plays at trailer frame 0 */\n")
    fh.write(f"export const MUSIC = {json.dumps({'file': music_static, 'offsetFrames': start, 'credit': M.get('credit', '')}, ensure_ascii=False)} as const;\n")
with open(f"{D}/voice.ts", "w") as fh:
    fh.write(hdr)
    fh.write("export type Word = {w: string; f: number; e: number};\n")
    fh.write("export type Line = {id: string; src: string; clip: string; srcIn: number; srcOut: number; at: number; from: number; durationInFrames: number; text: string; words: Word[]};\n")
    fh.write(f"export const LINES: Line[] = {json.dumps(lines, ensure_ascii=False, indent=1)};\n")
    fh.write("export const line = (id: string) => LINES.find((l) => l.id === id)!;\n")
with open(f"{D}/sections.ts", "w") as fh:
    fh.write(hdr)
    fh.write(f"export const SECTIONS = {json.dumps(sections, ensure_ascii=False, indent=1)} as const;\n")
    fh.write("export const section = (id: string) => SECTIONS.find((s) => s.id === id)!;\n")
    fh.write("/** one scene agent per part; a part spans sections from..to (inclusive) */\n")
    fh.write(f"export const PARTS: {{id: string; from: string; to: string}}[] = {json.dumps(parts, ensure_ascii=False)};\n")
with open(f"{D}/fx.ts", "w") as fh:
    fh.write(hdr)
    fh.write("/** letterbox bar height (px): each curve is [frame, px] points, interpolated and clamped; the max wins */\n")
    fh.write(f"export const LETTERBOX: [number, number][][] = {json.dumps(letterbox)};\n")
    fh.write("/** white flash frames (big hits before FX_LIVE_UNTIL + the extra ones from trailer.json) */\n")
    fh.write(f"export const FLASH_FRAMES: number[] = {json.dumps(flash)};\n")
    fh.write("/** after this frame the music is dead (tape stop): no more flashes / fringe */\n")
    fh.write(f"export const FX_LIVE_UNTIL = {live_until};\nexport const GRAIN = {FX.get('grain', 0.11)};\n")

for l in lines:
    print(f"{l['id']:4s} {l['from']:5d}-{l['from'] + l['durationInFrames']:5d}  {l['text']}")
print("beats", len(beats), "downbeats", len(downbeats), "hits", len(hits), "big", [h["f"] for h in big])
print("key", keys)
