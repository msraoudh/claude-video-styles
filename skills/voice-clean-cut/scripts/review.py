"""Builds a page to check every cut by ear: the same few seconds before and after each cut.

    python review.py <raw audio> <clean.wav> <cuts.json> <out_dir>

Claude cannot hear. The trainer can, in two minutes: this page is the last word on every cut.
"""
import html
import json
import subprocess
import sys
from pathlib import Path

CONTEXT = 1.6


def clip(src, a: float, b: float, out: Path) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, a):.3f}", "-to", f"{b:.3f}", "-i", str(src), "-vn", "-ac", "1", "-c:a", "libmp3lame", "-q:a", "4", str(out)], check=True)


def main() -> None:
    raw, clean, cuts_path, out_dir = sys.argv[1:5]
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    data = json.loads(Path(cuts_path).read_text(encoding="utf8"))
    timeline = data["timeline"]
    rows = []
    for n, c in enumerate(data["cuts"], 1):
        clip(raw, c["a"] - CONTEXT, c["b"] + CONTEXT, out / f"{n:02d}-avant.mp3")
        # the join in the clean file is where the piece following this cut starts
        joined = next((p["t"] for p in timeline if p["a"] >= c["b"] - 0.001), None)
        if joined is None:
            continue
        clip(clean, joined - CONTEXT, joined + CONTEXT, out / f"{n:02d}-apres.mp3")
        rows.append(f"""<tr><td class="n">{n}</td><td class="t">{int(c['a'] // 60)}:{c['a'] % 60:04.1f}</td>
<td>{html.escape(c['before'])} <s>{html.escape(c['removed'])}</s> {html.escape(c['after'])}<div class="why">{html.escape(c['reason'])}</div></td>
<td><audio controls preload="none" src="{n:02d}-avant.mp3"></audio></td><td><audio controls preload="none" src="{n:02d}-apres.mp3"></audio></td></tr>""")
    (out / "index.html").write_text(f"""<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coupes à vérifier</title>
<style>:root{{--bg:#fff;--fg:#1b1b1b;--mut:#666;--line:#ddd;--cut:#b3261e}}@media (prefers-color-scheme:dark){{:root{{--bg:#161616;--fg:#eee;--mut:#aaa;--line:#333;--cut:#ff8a80}}}}
body{{background:var(--bg);color:var(--fg);font:16px/1.45 system-ui,sans-serif;margin:0;padding:24px 16px}}h1{{font-size:22px;margin:0 0 4px}}p{{color:var(--mut);margin:0 0 20px}}
.wrap{{overflow-x:auto}}table{{border-collapse:collapse;width:100%}}th{{text-align:left;color:var(--mut);font-weight:500;font-size:14px}}td,th{{border-bottom:1px solid var(--line);padding:10px 8px;vertical-align:middle}}
.n,.t{{color:var(--mut);white-space:nowrap}}s{{color:var(--cut)}}.why{{color:var(--mut);font-size:13px}}audio{{width:210px;height:36px}}</style>
<h1>Coupes à vérifier ({len(rows)})</h1><p>Écoutez « après » : si une coupe sonne mal, donnez son numéro. Le temps est celui de l'enregistrement brut.</p>
<div class="wrap"><table><tr><th>N°</th><th>Temps</th><th>Phrase (en rouge : retiré)</th><th>Avant</th><th>Après</th></tr>{''.join(rows)}</table></div></html>""", encoding="utf8")
    print(out / "index.html")


if __name__ == "__main__":
    main()
