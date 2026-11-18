"""Hand-written captions (Tunisian in Arabic letters, French/English words in Latin) timed on the clean voice.

One entry per line of work/keep.json, same order. A line's clean span comes from work/clean.json (pieces with the same
text). Words are spread over the voiced frames of the line by length, then each start snaps to the nearest loudness
onset within 0.14 s. Out: remotion-video/src/data/lines.json + captions.json.
  python -I build_captions.py -p <reel folder>

PER VIDEO: rewrite LINES below (one entry per kept line of work/keep.json, same order). The current LINES are the
example reel's, kept to show the format.
"""
import json
import wave
from pathlib import Path

import numpy as np

import sys
P = Path(sys.argv[sys.argv.index("-p") + 1]).resolve() if "-p" in sys.argv else Path.cwd()  # the reel folder
W = P / "work"
OUT = P / "remotion-video" / "src" / "data"

# id, caption text, red keyword (the word that gets the red handwriting)
LINES = [
    ("hook", "كان إنتي من العباد اللي تعلّمو يتمنّشو بـClaude ومكش عارف تعمل كيف هاذي", "Claude"),
    ("lik", "الـvideo هاذي ليك", "ليك"),
    ("crowd", "توّا برشا عباد تعلّمو يتمنّشو بـClaude", "برشا"),
    ("deliver", "وينجّمو يـlivriw برشا حاجات بيه", "حاجات"),
    ("minority", "أما فمّا كان minorité اللي فيها la différence", "minorité"),
    ("unclear6", "… هاذي الكل معاها", "الكل"),
    ("two", "وأنا personnellement ما نشوف كان زوز حاجات يعملو la différence بين les AI users", "زوز"),
    ("crea_int", "la créativité و l'intelligence", "l'intelligence"),
    ("explain", "نفسّرلك", "نفسّرلك"),
    ("same", "زوز users ينجّمو يستعملو نفس l'outil، نفس الـmodèle، Claude، كل شي", "نفس"),
    ("classic", "واحد يستعملو باش يخرّج حاجة classique، déjà vu", "déjà vu"),
    ("satisfied", "ويكون satisfait بالـrésultat", "satisfait"),
    ("other", "لاخر يستعملو بشكل جديد، يكون créatif", "créatif"),
    ("combine", "يـcombini des concepts، يـexpérimenti", "concepts"),
    ("results", "ويخرّج des résultats ماملية ما كنتش تتصوّر إنها توصلهم", "تتصوّر"),
    ("example", "par exemple", "exemple"),
    ("ideas", "les idées de vidéo اللي تقدّمها", "les idées"),
    ("concept", "le concept اللي تـdévelopih", "concept"),
    ("story", "le storytelling", "storytelling"),
    ("angles", "les angles de caméra", "caméra"),
    ("transitions", "les transitions", "transitions"),
    ("vfx", "les effets visuels", "effets"),
    ("tell", "حتّى الطريقة اللي تحكي بيها l'histoire في حدّ ذاتها", "l'histoire"),
    ("needs", "الكل يحتاج الـcréativité", "الـcréativité"),
    ("second", "ونُدخل للحاجة الثانية، اللي هي l'intelligence", "l'intelligence"),
    ("notenough", "خاطر الـcréativité وحدها ما تكفيش", "ما تكفيش"),
    ("academic", "وهوني راني مانيش نحكي على l'intelligence académique", "académique"),
    ("capacity", "نحكي على الـcapacité متاعك باش تفهم un problème", "un problème"),
    ("ask", "تعرف شنوّة تسأل؟", "تسأل؟"),
    ("steer", "كيفاش توجّهها؟", "توجّهها؟"),
    ("challenge", "كيفاش تـchallengiha في الـréponse متاعها؟", "تـchallengiha"),
    ("judge", "وsurtout كيفاش تعرف اللي الـrésultat اللي عطاتهولك ينجح ولا ما ينجحش", "ينجحش"),
    ("perfect", "خاطر الـAI تنجّم تعطيك réponse تبان parfaite", "parfaite"),
    ("wrong", "أما techniquement غالطة", "غالطة"),
    ("recul", "Donc كان إنتي ما عندكش le recul، l'expérience", "l'expérience"),
    ("juger", "ou la capacité de juger le résultat", "juger"),
    ("risk", "tu risques de produire برشا حاجات sans valeur", "sans valeur"),
    ("diff", "وهوني exactement وين تتلقى la différence بين", "la différence"),
    ("normal", "les users العاديين", "العاديين"),
    ("smart", "و les users … l'intelligence و les créatifs", "les créatifs"),
    ("see", "كي نشوف", "نشوف"),
    ("product", "produit مصنوع بالـIA", "produit"),
    ("reflect", "يعكس الـcréativité و l'intelligence متاعك، نشوفو فيه إنتي شنوّة تعمل", "يعكس"),
    ("think", "ونوليو نفهمو إنتي كيفاش تخمّم", "تخمّم"),
    ("good", "كي تخمّم بالباهي، تخرجلك résultat باهية", "باهية"),
    ("bad", "كي تخمّم بالخايب، تخرجلك résultat خايبة", "خايبة"),
    ("concret", "l'IA تعاونك باش تـconcrétisi les idées متاعك، mais finalement باش تخرّج الـrésultat اللي تحبّو", "تـconcrétisi"),
    ("mirror", "Donc كي نشوفو un produit، نشوفو l'intelligence و la créativité متاعك في الـrésultat، ça reflète إنتي شنوّة تخمّم، ça reflète إنتي شكون وليت، ça reflète إنتي créatif ولا", "créatif"),
    ("dont", "So don't just learn AI", "AI"),
    ("around", "Learn how to be smart around AI", "smart"),
    ("final", "استعمل الـAI، تعلّم الـAI، وفي نفس الوقت تعلّم تكون créatif و intelligent", "intelligent"),
]

GLUE = ["la différence", "les AI users", "déjà vu", "des concepts", "des résultats", "par exemple", "les idées", "de vidéo",
        "le concept", "le storytelling", "les angles", "de caméra", "les transitions", "les effets", "effets visuels",
        "un problème", "le recul", "la capacité", "de juger", "le résultat", "tu risques", "de produire", "sans valeur",
        "les users", "les créatifs", "les idées", "un produit", "ça reflète", "So don't", "just learn", "smart around",
        "l'intelligence académique"]

C = json.loads((W / "clean.json").read_text(encoding="utf8"))
pieces = C["pieces"]
texts = []
for p in pieces:
    if not texts or texts[-1] != p["text"]:
        texts.append(p["text"])
assert len(texts) == len(LINES), (len(texts), len(LINES))

with wave.open(str(W / "voice-clean.wav")) as w:
    sr = w.getframerate()
    y = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
HOP = 0.01
h = int(sr * HOP)
db = 20 * np.log10(np.sqrt((y[: len(y) // h * h].reshape(-1, h) ** 2).mean(1)) + 1e-9)
ref = np.percentile(db, 90)
voiced = db > ref - 24
onsets = [i * HOP for i in range(1, len(db)) if voiced[i] and not voiced[i - 1]]
for i in range(4, len(db)):
    if voiced[i] and db[i] - db[i - 4] > 8 and (not onsets or i * HOP - onsets[-1] > 0.08):
        onsets.append(i * HOP)
onsets = sorted(set(round(o, 2) for o in onsets))
NB = " "


def tokens(text):
    t = text
    for g in GLUE:
        t = t.replace(g, g.replace(" ", NB))
    return [w.replace(NB, " ") for w in t.split(" ") if w]


lines_out, caps = [], []
for (lid, text, key), what in zip(LINES, texts):
    ps = [p for p in pieces if p["text"] == what]
    s, e = ps[0]["t0"] / 30, (ps[-1]["t0"] + ps[-1]["n"]) / 30
    toks = tokens(text)
    wts = np.array([max(2, len(t.replace("الـ", "").replace("يـ", "").replace("تـ", ""))) for t in toks], float)
    i0, i1 = int(s / HOP), int(e / HOP)
    vt = np.cumsum(voiced[i0:i1].astype(float)) * HOP
    total_v = vt[-1] if len(vt) and vt[-1] > 0 else e - s
    starts, acc = [], 0.0
    for wgt in wts:
        target = acc / wts.sum() * total_v
        k = int(np.searchsorted(vt, target)) if len(vt) else 0
        t0 = s + k * HOP
        near = [o for o in onsets if abs(o - t0) <= 0.14 and s - 0.01 <= o < e]
        if near:
            t0 = min(near, key=lambda o: abs(o - t0))
        if starts and t0 <= starts[-1] + 0.06:
            t0 = starts[-1] + 0.06
        starts.append(t0)
        acc += wgt
    words = []
    for j, (tok, t0) in enumerate(zip(toks, starts)):
        t1 = starts[j + 1] if j + 1 < len(starts) else e
        words.append({"text": tok, "s": round(t0, 3), "e": round(t1, 3), "key": key in tok or tok in key})
        caps.append({"text": (" " if j else "") + tok, "startMs": round(t0 * 1000), "endMs": round(t1 * 1000),
                     "timestampMs": round((t0 + t1) / 2 * 1000), "confidence": None, "line": lid})
    lines_out.append({"id": lid, "s": round(s, 3), "e": round(e, 3), "text": text, "key": key, "words": words})

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "lines.json").write_text(json.dumps(lines_out, ensure_ascii=False, indent=1), encoding="utf8")
(OUT / "captions.json").write_text(json.dumps(caps, ensure_ascii=False, indent=0), encoding="utf8")
print(len(lines_out), "lines,", len(caps), "words, total", C["total"])
