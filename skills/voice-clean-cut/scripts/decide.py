"""Decides what to cut: every stutter, repeated word, false start and retake. The LAST take is kept.

    python decide.py <heard.json> <out-decisions.json> [--script lesson.json|script.txt] [--cut 12-15,40] [--keep 33]

With a script: the verbatim transcript is aligned to it word by word. Between two takes the alignment
keeps the later one, at every scale (a syllable, a word, a phrase, a whole line). An extra word is only
cut with positive evidence that it is a repeat, a false start, a filler or an aside: an ad-lib is kept
and flagged, because cutting something good is worse than leaving it for a human to judge.
Without a script: repeats are found in the transcript itself.

--cut / --keep force a decision on word numbers (the numbers printed in the report).
"""
import argparse
import json
import re
import unicodedata
from difflib import SequenceMatcher
from functools import lru_cache
from pathlib import Path

from lang import C as LANG_CONF  # VC_LANG = fr (default) | en | tn
GAP_OPEN, GAP_EXT, SKIP_OPEN, SKIP_EXT = -2.0, -0.08, -2.0, -0.6
DIGITS = dict(zip("123456789", LANG_CONF["digits"].split()))
HALLUCINATIONS = LANG_CONF["halluc"]
ARABIC_FOLD = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ة": "ه", "ى": "ي", "ـ": None})


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def tokens_of(text: str) -> list[str]:
    text = strip_accents(text.lower().replace("’", "'").replace("`", "")).translate(ARABIC_FOLD)
    text = re.sub(r"(?<=[ء-ي])(?=[a-z0-9])|(?<=[a-z0-9])(?=[ء-ي])", " ", text)  # الcontainer -> ال container
    return [DIGITS.get(t, t) for t in re.split(r"[^a-z0-9ء-ي]+", text) if t]


FILLERS = {t for f in LANG_CONF["fillers"] for t in tokens_of(f)}
ASIDES = {t for f in LANG_CONF["asides"] for t in tokens_of(f)}
PROMPT_LEAK = tuple(" ".join(tokens_of(p)) for p in LANG_CONF["leak"])


@lru_cache(maxsize=200000)
def sim(a: str, b: str) -> float:
    if a == b:
        return 1.0
    if len(a) < 3 or len(b) < 3:
        return 0.0
    if a.startswith(b) or b.startswith(a):
        return 0.8
    r = SequenceMatcher(None, a, b).ratio()
    return r if r >= 0.72 else 0.0


def looped(words: list[dict]) -> bool:
    said = [w["w"].lower().strip(" ,.?!") for w in words]
    return any(len(set(said[i: i + k * 4])) <= k and len(said[i: i + k * 4]) == k * 4 for k in (1, 2) for i in range(len(said)))


def choose_pass(phrase: dict) -> list[dict]:
    """Keeps the pass that heard the most words, unless it invented them (prompt leak, loop, hallucination)."""
    def valid(words):
        joined = " ".join(tokens_of(" ".join(w["w"] for w in words)))
        text = " ".join(w["w"].lower() for w in words).replace(" -", "-")
        return not looped(words) and not any(p in joined for p in PROMPT_LEAK) and not any(h in text for h in HALLUCINATIONS)

    plain = phrase["plain"] if valid(phrase["plain"]) else []
    verbatim = phrase["verbatim"] if valid(phrase["verbatim"]) else []
    return verbatim if len(verbatim) >= len(plain) else plain


def flatten(heard: list[dict]) -> tuple[list[dict], list[dict]]:
    """All words of the recording, and their tokens (l'image = l + image, sharing the word's time).
    A phrase where nothing valid was heard is a noise (breath, mouth click): it is marked for removal."""
    words, toks = [], []
    for ph in heard:
        chosen = choose_pass(ph)
        if not chosen:
            words.append({"w": "(bruit)", "s": ph["a"], "e": ph["b"], "p": 0, "n": len(words), "reason": "bruit"})
        for w in chosen:
            parts = tokens_of(w["w"])
            if not parts:
                continue
            n = len(words)
            words.append({**w, "n": n, "reason": None})
            for t in parts:
                toks.append({"t": t, "word": n})
    return words, toks


def script_tokens(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf8")
    if path.suffix == ".json":
        lines = [l["say"] for l in json.loads(text)["lines"]]
    else:
        lines = [l for l in text.splitlines() if l.strip()]
    return [{"t": t, "line": i} for i, l in enumerate(lines) for t in tokens_of(l)]


def align(said: list[str], script: list[str]) -> list[int | None]:
    """Gotoh alignment (cuts open rarely, then extend cheaply). Returns, for each said token, its script
    token or None. The traceback runs from the end and prefers a match, so a later take beats an earlier one."""
    n, m = len(said), len(script)
    INF = -1e9
    M = [[INF] * (m + 1) for _ in range(n + 1)]  # last move: said[i-1] aligned with script[j-1]
    I = [[INF] * (m + 1) for _ in range(n + 1)]  # last move: said[i-1] is extra
    D = [[INF] * (m + 1) for _ in range(n + 1)]  # last move: script[j-1] was not said
    M[0][0] = 0.0
    for i in range(1, n + 1):
        I[i][0] = GAP_OPEN + GAP_EXT * i
    for j in range(1, m + 1):
        D[0][j] = SKIP_OPEN + SKIP_EXT * j
    for i in range(1, n + 1):
        Mi, Ii, Di, Mp, Ip, Dp = M[i], I[i], D[i], M[i - 1], I[i - 1], D[i - 1]
        s = said[i - 1]
        for j in range(1, m + 1):
            r = sim(s, script[j - 1])
            score = 2.0 * r if r else -1.0
            Mi[j] = score + max(Mp[j - 1], Ip[j - 1], Dp[j - 1])
            Ii[j] = max(Mp[j] + GAP_OPEN, Dp[j] + GAP_OPEN, Ip[j] + GAP_EXT)
            Di[j] = max(Mi[j - 1] + SKIP_OPEN, Ii[j - 1] + SKIP_OPEN, Di[j - 1] + SKIP_EXT)

    out: list[int | None] = [None] * n
    i, j = n, m
    state = max(("M", M[n][m]), ("I", I[n][m]), ("D", D[n][m]), key=lambda x: x[1])[0]
    while i > 0 or j > 0:
        if state == "M":
            out[i - 1] = j - 1
            r = sim(said[i - 1], script[j - 1])
            prev = M[i][j] - (2.0 * r if r else -1.0)
            i, j = i - 1, j - 1
            state = "M" if abs(M[i][j] - prev) < 1e-9 else "I" if abs(I[i][j] - prev) < 1e-9 else "D"
        elif state == "I":
            v = I[i][j]
            i -= 1
            state = "I" if abs(I[i][j] + GAP_EXT - v) < 1e-9 else "M" if abs(M[i][j] + GAP_OPEN - v) < 1e-9 else "D"
        else:
            v = D[i][j]
            j -= 1
            state = "D" if abs(D[i][j] + SKIP_EXT - v) < 1e-9 else "M" if abs(M[i][j] + SKIP_OPEN - v) < 1e-9 else "I"
    return out


def overlap_with_next(run: list[str], nxt: list[str]) -> float:
    """Share of the extra words that are said again right after: 'qui mène au | qui mène du code' = 2/3."""
    best = 0.0
    for start in range(len(run)):  # the restart may begin anywhere inside the extra words
        k = 0
        while start + k < len(run) and k < len(nxt) and sim(run[start + k], nxt[k]):
            k += 1
        if k:
            best = max(best, k / max(1, len(run) - start) * (1.0 if start == 0 else 0.9))
    return best


def classify(run: list[str], nxt: list[str], prev: list[str]) -> str | None:
    if all(t in FILLERS for t in run):
        return "hésitation"
    if any(t in ASIDES for t in run):
        return "aparté"
    if nxt and (nxt[0].startswith(run[-1]) or (len(run[-1]) >= 2 and nxt[0][:len(run[-1])] == run[-1])) and len(run) == 1:
        return "mot répété" if run[-1] == nxt[0] else "début de mot"
    same_start = 0  # words shared by the start of the extra words and what comes right after them
    while same_start < min(len(run), len(nxt)) and sim(run[same_start], nxt[same_start]):
        same_start += 1
    if overlap_with_next(run, nxt) >= 0.5 or same_start >= 2 or (same_start == 1 and len(run) <= 4):
        return "reprise"
    if prev and overlap_with_next(run, prev[-len(run):]) >= 0.99:
        return "répété juste avant"
    if len(run) >= 6:  # a garbled line of the script aligns as wrong words, not as extras: this is off-script talk
        return "hors script"
    if len(run) >= 2 and all(t in FILLERS or len(t) <= 3 for t in run) and any(sim(t, x) == 1.0 for t in run for x in nxt[:3]):
        return "faux départ"
    return None


def decide_with_script(words, toks, script):
    said = [t["t"] for t in toks]
    link = align(said, [t["t"] for t in script])
    flags = []
    i = 0
    while i < len(toks):
        if link[i] is not None:
            i += 1
            continue
        j = i
        while j + 1 < len(toks) and link[j + 1] is None:
            j += 1
        run = said[i: j + 1]
        reason = classify(run, said[j + 1: j + 1 + len(run) + 3], said[max(0, i - len(run) - 3): i])
        ids = sorted({toks[k]["word"] for k in range(i, j + 1)})
        if reason:
            for w in ids:
                # a word half made of aligned tokens stays: never cut part of a good word
                if all(link[k] is None for k in range(len(toks)) if toks[k]["word"] == w):
                    words[w]["reason"] = reason
        else:
            flags.append({"words": ids, "text": " ".join(words[w]["w"] for w in ids), "kind": "mot en plus, gardé"})
        i = j + 1

    # what the speaker said differently from the script (a slip with no second take: not cuttable)
    for k, t in enumerate(toks):
        if link[k] is not None and not sim(t["t"], script[link[k]]["t"]):
            flags.append({"words": [t["word"]], "text": words[t["word"]]["w"], "kind": f"dit à la place de « {script[link[k]]['t']} »"})
    matched = {x for x in link if x is not None}
    k = 0
    while k < len(script):
        if k in matched:
            k += 1
            continue
        e = k
        while e + 1 < len(script) and e + 1 not in matched:
            e += 1
        before = next((toks[x]["word"] for x in range(len(toks)) if link[x] is not None and link[x] > e), None)
        flags.append({"words": [before] if before is not None else [], "text": " ".join(script[x]["t"] for x in range(k, e + 1)), "kind": "du script, pas entendu"})
        k = e + 1
    return flags


def decide_without_script(words, toks):
    """Repeats in the transcript itself, longest first: A B C A B C, then A A, then partial words."""
    said = [t["t"] for t in toks]
    gone = [False] * len(said)
    for size in range(10, 0, -1):
        i = 0
        while i + 2 * size <= len(said):
            for skip in range(0, 4 if size >= 2 else 1):  # A B C (x y) A B C D : false start then restart
                a, b = said[i: i + size], said[i + size + skip: i + 2 * size + skip]
                if len(b) == size and all(sim(x, y) for x, y in zip(a, b)) and not any(gone[i: i + size]):
                    for k in range(i, i + size + skip):
                        gone[k] = True
                    break
            i += 1
    for k, t in enumerate(said):
        if t in FILLERS:
            gone[k] = True
        if k + 1 < len(said) and len(t) <= 4 and t != said[k + 1] and said[k + 1].startswith(t) and len(said[k + 1]) > 5:
            gone[k] = True
    for k, g in enumerate(gone):
        if g and all(gone[x] for x in range(len(toks)) if toks[x]["word"] == toks[k]["word"]):
            words[toks[k]["word"]]["reason"] = "hésitation" if said[k] in FILLERS else "reprise"
    return []


def parse_numbers(spec: str | None) -> set[int]:
    out = set()
    for part in (spec or "").split(","):
        if part.strip():
            a, _, b = part.partition("-")
            out.update(range(int(a), int(b or a) + 1))
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("heard")
    ap.add_argument("out")
    ap.add_argument("--script")
    ap.add_argument("--cut")
    ap.add_argument("--keep")
    ap.add_argument("--overrides", help='JSON {"cut": [[s, e]…], "keep": [[s, e]…]} in seconds of the raw file: survives a new transcription')
    args = ap.parse_args()

    words, toks = flatten(json.loads(Path(args.heard).read_text(encoding="utf8")))
    flags = decide_with_script(words, toks, script_tokens(Path(args.script))) if args.script else decide_without_script(words, toks)
    for n in parse_numbers(args.cut):
        words[n]["reason"] = "coupé à la main"
    for n in parse_numbers(args.keep):
        words[n]["reason"] = None
    spans = []  # exact pieces of audio to remove, for a sound smaller than a word: [start, end, why]
    if args.overrides:
        forced = json.loads(Path(args.overrides).read_text(encoding="utf8"))
        for key, reason in (("cut", "décision éditoriale"), ("keep", None)):
            for a, b in forced.get(key, []):
                for w in words:
                    if a <= (w["s"] + w["e"]) / 2 <= b:
                        w["reason"] = reason
        spans = forced.get("spans", [])
    Path(args.out).write_text(json.dumps({"words": words, "flags": flags, "spans": spans}, ensure_ascii=False, indent=0), encoding="utf8")

    # readable report: removed words in [brackets], with their numbers
    line, removed = [], 0
    for w in words:
        if w["reason"]:
            line.append(f"[{w['n']}:{w['w']}]")
            removed += 1
        else:
            line.append(w["w"])
    print(" ".join(line))
    print(f"\n{removed} mots coupés sur {len(words)}")
    for w in words:
        if w["reason"]:
            print(f"  {w['s']:7.2f}  #{w['n']:<4} {w['reason']:<20} {w['w']}")
    for f in flags:
        at = f"{words[f['words'][0]]['s']:7.2f}" if f["words"] else "      ?"
        print(f"  {at}  ⚠ {f['kind']} : {f['text']}")


if __name__ == "__main__":
    main()
