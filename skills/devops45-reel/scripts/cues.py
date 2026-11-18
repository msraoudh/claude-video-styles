"""SFX cues of every archetype scene → plan/cues.json (mix.py reads it). The rules mirror the components' timing:
an item's beat = its `on` word (−2 frames) or an even spread over the scene's speech, exactly like
src/lib/episode.ts beatsFor(). Custom scenes write their own video/src/data/cues/<id>.json.
  ~/.venvs/audio/bin/python cues.py <project>
"""
import json

import elib

P = elib.proj()
vp = json.load(open(f"{P}/plan/voice.json", encoding="utf-8"))
sc = json.load(open(f"{P}/plan/scenes.json", encoding="utf-8"))
PH = {p["id"]: p for p in vp["phrases"]}


def words(s):
    return [w for pid in s["phrases"] for w in PH[pid]["words"]]


def span(s):
    w = words(s)
    return (w[0]["f"], w[-1]["fe"]) if w else (s["from"] + 10, s["to"] - 10)


def on_word(s, word, nth=0):
    want = elib.norm(word or "")
    if not want:
        return None
    hits = [w["f"] for w in words(s) if elib.norm(w["w"]).startswith(want) or (len(want) > 3 and want in elib.norm(w["w"]))]
    return hits[nth] if len(hits) > nth else None


def beat(s, item, i, n, lead=2):
    f = on_word(s, (item or {}).get("on"))
    if f is not None:
        return f - lead
    a, b = span(s)
    return round(a + (b - a) * i / max(1, n)) - lead


def beats(s, items, min_gap=6, lead=2):
    out = []
    for i, it in enumerate(items):
        f = beat(s, it, i, len(items), lead)
        out.append(max(f, out[-1] + min_gap) if out else max(f, s["from"] + 4))
    return out


def cue(f, sfx, gain, note, **kw):
    return dict(f=int(f), sfx=sfx, gain=gain, note=note, **kw)


# ------------------------------------------------------------------ logo keys + tool animations (src/kit/logos.ts, src/toolfx)
_ALIAS = None


def logo_key(w):
    """mirror of kit/Logo.tsx logoKey()"""
    global _ALIAS
    import re
    if _ALIAS is None:
        try:
            ts = open(f"{P}/video/src/kit/logos.ts", encoding="utf-8").read()
            _ALIAS = json.loads(re.search(r"LOGO_ALIAS: Record<string, LogoKey> = (\{.*?\}) as", ts, re.S).group(1))
        except (OSError, AttributeError):
            _ALIAS = {}
    k = re.sub(r"^logo[:\-_ ]+", "", str(w or "").strip(), flags=re.I)
    return _ALIAS.get(re.sub(r"[^a-z0-9]", "", elib.norm(k)))


def hook_tools(s, d):
    """mirror of archetypes/hook hookTools(): tools named in the hook, ≤ 4, not devops, not the tile's logo"""
    ws = words(s)
    tk = logo_key(d.get("logo") or d.get("icon"))
    out, i = [], 0
    while i < len(ws) and len(out) < 4:
        two = logo_key(ws[i]["w"] + ws[i + 1]["w"]) if i + 1 < len(ws) else None
        k = two or logo_key(ws[i]["w"])
        f = ws[i]["f"]
        i += 2 if two else 1
        if not k or k == "devops" or k == tk or any(o[0] == k for o in out):
            continue
        out.append((k, f))
    return out


def toolfx_sfx(key):
    """internal sound moments of a tool animation: video/src/toolfx/<file>.sfx.json (file from toolfx/index.ts FILE)"""
    import re
    try:
        idx = open(f"{P}/video/src/toolfx/index.ts", encoding="utf-8").read()
    except OSError:
        return None
    m = re.search(r"\b" + re.escape(key) + r': "([a-z0-9-]+)"', idx.split("export const FILE", 1)[-1])
    if not m:
        return None
    try:
        return json.load(open(f"{P}/video/src/toolfx/{m.group(1)}.sfx.json", encoding="utf-8"))
    except (OSError, ValueError):
        return []


def r_tool(s, d):
    """archetypes/tool: each item flies in on its word (lead 10, first ≤ from+24, ≥ 40 f apart); its animation's own
    sound moments follow (cut at the next item's arrival)"""
    items = [it for it in (d.get("items") or []) if isinstance(it, dict)][:3]
    raw = beats(s, items, min_gap=40, lead=10)
    starts = [min(b, s["from"] + 24) if i == 0 else b for i, b in enumerate(raw)]
    out = []
    for i, f0 in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else s["to"]
        key = logo_key(items[i].get("tool")) or str(items[i].get("tool") or "").strip().lower()
        out += [cue(f0 - 2, "whoosh", 0.32, f"tool {key} flies in"), cue(f0 + 14, "glass", 0.24, f"tool {key} lands")]
        for w in items[i].get("beats") or []:  # phase words: a pop on each (the animation's phase lands there)
            f = on_word(s, w)
            if f is not None and f0 < f < end - 6:
                out.append(cue(f - 2, "ui-pop", 0.2, f"{key}: phase on « {w} »"))
        for m in toolfx_sfx(key) or []:
            f = f0 + int(m.get("at", 0))
            if f < end - 6 and m.get("sfx"):
                out.append(cue(f, m["sfx"], float(m.get("gain", 0.25)), f"{key}: {m.get('note', '')}"))
    return out


# ------------------------------------------------------------------ rules per archetype (from the builders' reports)
def r_hook(s, d):
    out = [cue(s["from"] + 6, "whoosh", 0.35, "hook tile fly-in"), cue(s["from"] + 9, "glint", 0.25, "tile lands"),
           cue(s["to"] - 2, "suckin", 0.4, "CRT suck-in into the ident (END on to-2)")]
    acc = on_word(s, d.get("accent"))
    if acc is not None:
        out.append(cue(acc - 2, "glint", 0.2, "accent word lights amber"))
    for k, f in hook_tools(s, d):
        out += [cue(f - 10, "whoosh", 0.22, f"hook: {k} logo flies in"), cue(f + 6, "ui-pop", 0.2, f"hook: {k} logo lands")]
    return out


def r_title(s, d):
    # the director adds the drop basshit on s.from; the ident's panes lock at +5, the amber 45 closes the ring at +13
    return [cue(s["from"] + 5, "glass", 0.45, "glass panes lock"), cue(s["from"] + 13, "glint", 0.3, "amber 45 + ring closes"),
            cue(s["from"] + 14, "typing", 0.15, "command types in", max_s=0.2),
            cue(s["to"] - 7, "whoosh", 0.3, "panes blast out")]


def phrase_end_of(s, f):
    for pid in s["phrases"]:
        p = PH[pid]
        if p["from"] - 2 <= f <= p["to"]:
            return p["to"]
    return f + 30


def r_terminal(s, d):
    """mirrors archetypes/terminal: typing ~2.6 f/char (16–80 f) from `on` (else the speech start, ≤ from+30),
    Enter at the end of that phrase clamped to 8–48 f after typing, output lines on their `on` words, copy click."""
    cmds = d.get("commands") or [{"command": d.get("command", ""), "on": d.get("on"), "enter_on": d.get("enter_on"),
                                  "output": d.get("output", [])}]
    out = [cue(s["from"] + 1, "whoosh", 0.3, "terminal lands")]
    t0 = None
    for k, c in enumerate(cmds[:2]):
        start = on_word(s, c.get("on"))
        if start is None:
            start = min(span(s)[0], s["from"] + 30) if k == 0 else (t0 or s["from"]) + 60
        n = len(c.get("command", "").lstrip("$ "))
        dur = int(min(80, max(16, n * 2.6)))
        enter = on_word(s, c.get("enter_on"))
        if enter is None:
            enter = phrase_end_of(s, start)
        enter = int(min(max(enter, start + dur + 8), start + dur + 48))
        out.append(cue(start, "typing", 0.3, f"type `{c.get('command', '')[:30]}`", max_s=dur / 60))
        out.append(cue(enter, "ui-click", 0.3, "Enter"))
        for ln in c.get("output", []) or []:
            if isinstance(ln, dict) and ln.get("on"):
                f = on_word(s, ln["on"])
                if f is not None:
                    out.append(cue(f - 2, "ui-pop", 0.2, "output line"))
        if k == 0:
            t0 = start
            if d.get("copy", True) is not False:
                cp = on_word(s, d.get("copy_on"))
                if cp is None:
                    cp = start + dur + 8 if enter - (start + dur) >= 24 else min(span(s)[1] + 22, s["to"] - 40)
                out += [cue(cp, "tap", 0.3, "copier click"), cue(cp + 2, "glint", 0.25, "copied glint")]
    if d.get("note"):
        f = on_word(s, d["note"].get("on"))
        if f is not None:
            out.append(cue(f + 6, "ui-pop", 0.2, "note chip"))
    return out


def r_steps(s, d):
    items = d.get("items") or []
    bs = beats(s, [it if isinstance(it, dict) else {} for it in items])
    out = [cue(s["from"] + 1, "whoosh", 0.25, "steps in")] + [cue(f, "ui-pop", 0.3, f"step {i + 1}") for i, f in enumerate(bs)]
    out += [cue(span(s)[1] - 6, "check", 0.4, "last step checked"), cue(span(s)[1] - 4, "glint", 0.25, "all done")]
    return out


def r_items(name, sfx="whoosh", g=0.3, extra=None):
    def r(s, d):
        items = d.get("items") or d.get("nodes") or d.get("timeline") or []
        out = [cue(f, sfx, g, f"{name} item {i + 1}") for i, f in enumerate(beats(s, items))]
        if extra:
            out += [cue(f + extra[1], extra[0], extra[2], f"{name} {extra[0]}") for f in beats(s, items)]
        return out
    return r


def pct(s, x):
    a, b = span(s)
    return round(a + x * (b - a))


def second_phrase(s):
    return PH[s["phrases"][1]]["from"] if len(s["phrases"]) > 1 else None


CLI = ("kubectl", "docker", "git", "aws", "terraform", "ansible", "ss", "chmod", "curl", "ssh", "ls", "cd", "helm", "npm")


def r_cards(s, d):
    items = (d.get("items") or [])[:5]
    bs = [min(f, s["to"] - 34) for f in beats(s, items, 8, 2)]
    out = [cue(s["from"] + 2, "cards", 0.25, "slots draw")]
    h = (d.get("heading") or "").strip()
    if h and (h.split()[0] in CLI or " -" in h):
        out.append(cue(s["from"] + 3, "typing", 0.2, "command heading", max_s=0.45))
    for i, f in enumerate(bs):
        if i == 0:
            out.append(cue(f, "whoosh", 0.3, "first card"))
        out.append(cue(f + 1, "glass", 0.3, f"card {i + 1} lands"))
    return out


def r_compare(s, d):
    """archetypes/compare: left = on|speech start, right = on|2nd phrase|40 %, verdict = on|78 %, ≥ 24 f apart"""
    lB = on_word(s, (d.get("left") or {}).get("on"))
    lB = lB if lB is not None else span(s)[0]
    rB = on_word(s, (d.get("right") or {}).get("on"))
    rB = rB if rB is not None else (second_phrase(s) or pct(s, 0.4))
    rB = max(rB, lB + 24)
    out = [cue(s["from"] + 8, "whoosh", 0.3, "panels slide in"), cue(lB, "ui-pop", 0.25, "left lands"),
           cue(rB, "zoom-swish", 0.3, "right lands")]
    if d.get("mode") == "before_after":
        out += [cue(rB + 8 + k * 6, "tap", 0.15, "old point struck") for k in range(len((d.get("left") or {}).get("points", [])[:3]))]
        out += [cue(rB + 12 + k * 10, "check", 0.2, "new point ✓") for k in range(len((d.get("right") or {}).get("points", [])[:3]))]
    if d.get("verdict"):
        vB = on_word(s, d["verdict"].get("on"))
        vB = max(vB if vB is not None else pct(s, 0.78), rB + 26)
        out += [cue(vB + 1, "basshit", 0.35, "verdict"), cue(vB + 4, "glint", 0.25, "verdict key word")]
    return out


def r_myth(s, d):
    S = on_word(s, d.get("on"))
    S = S if S is not None else (second_phrase(s) or pct(s, 0.5))
    n = len((d.get("fact") or "").split())
    return [cue(S, "suckin", 0.3, "into the glitch (END on S)"), cue(S, "basshit", 0.35, "glitch + strike"),
            cue(S + 12, "whoosh", 0.25, "fact rises"), cue(S + 10 + n * 4 + 10, "check", 0.35, "fact ✓"),
            cue(S + 10 + n * 4 + 12, "glint", 0.2, "fact bloom")]


def r_analogy(s, d):
    comme = on_word(s, "comme")
    M = on_word(s, d.get("on"))
    M = M if M is not None else (comme + 30 if comme is not None else pct(s, 0.42))
    out = [cue(s["from"] + 10, "ui-pop", 0.2, "« = » pill")]
    if comme is not None:
        out.append(cue(comme - 2, "ui-click", 0.2, "« comme »"))
    out += [cue(M - 10, "whoosh", 0.3, "icon flies"), cue(M, "glass", 0.3, "lands in real life"),
            cue(M + 18, "glint", 0.25, "door opens / bulb lights")]
    return out


def r_stat(s, d):
    """archetypes/stat: digits land on `on` (else at 60 % of the speech)"""
    f = on_word(s, d.get("on"))
    if f is None:
        a, b = span(s)
        f = round(a + 0.6 * (b - a))
    out = [cue(f, "riser", 0.25, "digits spin up (END on landing)"), cue(f, "basshit", 0.45, "number lands"),
           cue(f, "impact", 0.3, "landing weight", align="peak")]
    if d.get("context"):
        out.append(cue(f + 12, "glint", 0.25, "context line"))
    return out


def r_flow(s, d):
    nodes = [n for n in (d.get("nodes") or []) if n.get("label")][:6]
    bs = beats(s, nodes)
    out = []
    for i, f in enumerate(bs):
        out.append(cue(f, "glass" if i == 0 else "whoosh", 0.3 if i == 0 else 0.28, f"node {i + 1} lights (packet arrives)"))
        out.append(cue(f, "ui-pop", 0.25, f"node {i + 1}"))
    if bs and bs[-1] + 10 + 24 < s["to"]:
        out.append(cue(bs[-1] + 10, "glint", 0.25, "final sweep along the path"))
    return out


def r_incident(s, d):
    tl = d.get("timeline") or []
    bs = beats(s, tl)
    out, last_warn = [], -99
    for ev, f in zip(tl, bs):
        tone = ev.get("tone", "info")
        if tone == "ok":
            out += [cue(f, "check", 0.4, "fix lands"), cue(f, "glass", 0.3, "heal wave")]
        elif tone == "warn" and f - last_warn < 40:
            out.append(cue(f, "tap", 0.25, "warn row (close to the previous)"))
        else:
            out.append(cue(f, "ui-pop", 0.2, f"{tone} row"))
        if tone == "warn":
            last_warn = f
    les = d.get("lesson")
    if les:
        lf = beat(s, les if isinstance(les, dict) else {}, len(tl), len(tl) + 1)
        lf = max(lf, (bs[-1] + 12) if bs else lf)
        out += [cue(lf - 4, "cards", 0.25, "lesson card"), cue(lf, "glint", 0.25, "« à retenir »")]
    return out


def r_code(s, d):
    out = [cue(s["from"] + 1, "whoosh", 0.25, "editor in"), cue(s["from"] + 6, "cards", 0.2, "lines cascade")]
    hl = d.get("highlight", []) or []
    for i, h in enumerate(hl):
        f = beat(s, h, i, max(1, len(hl)))
        out.append(cue(f, "glint", 0.3, f"highlight line {h.get('line')}"))
        if h.get("fix"):
            fx = on_word(s, h.get("fix_on"))
            fx = fx if fx is not None else f + 42
            n = len(h["fix"])
            out.append(cue(fx + 8, "typing", 0.2, "fix typed", max_s=min(1.2, n * 2.2 / 60)))
            out.append(cue(fx + 8 + int(n * 2.2), "check", 0.4, "fixed ✓"))
    return out


def r_cta(s, d):
    ab = on_word(s, "abonne")
    pill = (ab if ab is not None else s["from"] + 6) - 4
    toi = on_word(s, "toi")
    out = [cue(pill, "whoosh", 0.35, "Abonne-toi pill"),
           cue(toi if toi is not None else pill + 18, "tap", 0.35, "pill tap on « -toi »")]
    cl = on_word(s, "cloud")
    if cl is not None:
        out += [cue(cl, "whoosh", 0.25, "ring + wordmark land"), cue(cl + 20, "typing", 0.12, "handle typed", max_s=0.5)]
    q = on_word(s, "quarante")
    if q is None:
        q = on_word(s, "45")
    if q is not None:
        out.append(cue(q, "ui-pop", 0.2, "45"))
    fh = sc["key"]["finalHit"]
    out += [cue(fh, "riser", 0.3, "ring completes (END on the final hit)"), cue(fh, "glass", 0.35, "final flash")]
    return out


RULES = {
    "hook": r_hook, "title": r_title, "terminal": r_terminal, "code": r_code,
    "steps": r_steps, "cards": r_cards,
    "compare": r_compare, "myth": r_myth, "analogy": r_analogy,
    "flow": r_flow, "stat": r_stat, "incident": r_incident, "cta": r_cta, "tool": r_tool,
}


def logo_callouts():
    """mirror of video/src/components/LogoCallouts.tsx: a spoken tool / AWS name pops its logo chip → ui-pop on the word"""
    import re
    try:
        ts = open(f"{P}/video/src/kit/logos.ts", encoding="utf-8").read()
    except OSError:
        return []
    alias = json.loads(re.search(r"LOGO_ALIAS: Record<string, LogoKey> = (\{.*?\}) as", ts, re.S).group(1))

    def key(w):
        k = re.sub(r"[^a-z0-9]", "", elib.norm(w))
        return alias.get(k)

    out, last = [], {}
    for p in vp["phrases"]:
        ws = p["words"]
        i = 0
        while i < len(ws):
            two = key(ws[i]["w"] + ws[i + 1]["w"]) if i + 1 < len(ws) else None
            k = two or key(ws[i]["w"])
            f = ws[i]["f"]
            i += 2 if two else 1
            if not k or k == "devops":
                continue
            s = next((x for x in sc["scenes"] if x["from"] <= f < x["to"]), None)
            if not s or s["type"] in ("hook", "title", "cta") or any(f'"{f_}": "{k}"' in json.dumps(s.get("data", {}), ensure_ascii=False) for f_ in ("icon", "tool")):
                continue
            if k in last and f - last[k] < 480:
                continue
            last[k] = f
            out.append(cue(f - 2, "ui-pop", 0.22, f"logo chip {k}", src="logo-callout"))
    return out


cues = []
for s in sc["scenes"]:
    r = RULES.get(s["type"])
    if r:
        for c in r(s, s.get("data", {})):
            c["src"] = f"{s['id']}:{s['type']}"
            cues.append(c)
SFXCFG = (elib.load_episode(P).get("sfx") or {})
if SFXCFG.get("mode") == "custom":
    # hand-placed list in episode.json sfx.cues: [[frame, sfx, gain, note], …] (user hates the "glass" sound: never use it)
    def _src(f):  # tag each hand-placed cue with the scene it falls in (qa.py checks every scene has a sound)
        s_in = [s for s in sc["scenes"] if s["from"] <= f] or sc["scenes"][:1]
        return f"{s_in[-1]['id']}:{s_in[-1]['type']}"
    cues = [dict(cue(f, s_, g, n), src=_src(f)) for f, s_, g, n in SFXCFG["cues"] if s_ != "glass"]
elif SFXCFG.get("mode") == "minimal":
    # English / 60 s format (2026-11-09): few sounds. Per scene keep at most `per_scene` cues (loudest first),
    # at least `gap_f` frames apart, never the logo callouts, and at most `max` overall.
    per, gap, cap = SFXCFG.get("per_scene", 2), SFXCFG.get("gap_f", 90), SFXCFG.get("max", 16)
    keep = []
    for sid in dict.fromkeys(c["src"] for c in cues):
        mine = sorted((c for c in cues if c["src"] == sid), key=lambda c: -c["gain"])
        took = []
        for c in mine:
            if len(took) < per and all(abs(c["f"] - t["f"]) >= gap for t in took):
                took.append(c)
        keep += took
    cues = sorted(sorted(keep, key=lambda c: -c["gain"])[:cap], key=lambda c: c["f"])
else:
    cues += logo_callouts()
# 2026-11-09: the user hates the "glass" sound — never play it. Any rule that still asks for it gets a soft impact.
cues = [dict(c, sfx="impact", gain=round(c["gain"] * 0.7, 2), note=c["note"] + " (was glass)") if c["sfx"] == "glass" else c
        for c in cues]
elib.wjson(f"{P}/plan/cues.json", cues)
print(f"cues.json {len(cues)} cues over {len(sc['scenes'])} scenes")
