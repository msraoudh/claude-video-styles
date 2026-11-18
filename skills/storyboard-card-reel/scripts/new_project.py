"""Turn a published clean cut into a storyboard-card reel project: overlay the skill's Remotion engine on
<reel>/remotion-video (created by tunisian-clean-cut publish.py --scaffold), keeping the reel's own clean.json,
CleanCut.tsx, node_modules junction and public files. Never overwrites a file that already differs unless --force.

  python -I new_project.py -p <reel folder> --version 1
    -> src/ (engine + the example beat sheet to rewrite), scripts/ (audio, QA), public/audio/sfx, public/logos
    -> Footage.tsx points at footage/talk-clean-v<N>-small.mp4 (1080p) + footage/cutout-v<N>.webm
    -> master_voice.py reads public/audio/voice-clean-v<N>.wav
Then: make_cutout.py, build_captions.py, master_voice.py (see references/pipeline.md).
"""
import argparse
import filecmp
import re
import shutil
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
T = SKILL / "assets" / "template"
KEEP = {"src/data/clean.json", "src/CleanCut.tsx"}  # the reel's own, from publish.py


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("-p", required=True)
    ap.add_argument("--version", type=int, required=True, help="the approved clean-cut version (talk-clean-vN)")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    R = Path(a.p) / "remotion-video"
    if not (R / "src" / "data" / "clean.json").exists():
        raise SystemExit(f"{R}/src/data/clean.json missing: publish the clean cut first (tunisian-clean-cut publish.py --scaffold)")
    copied, kept = 0, []
    for f in T.rglob("*"):
        if f.is_dir():
            continue
        rel = f.relative_to(T).as_posix()
        dst = R / rel
        if rel in KEEP and dst.exists():
            continue
        if dst.exists() and not filecmp.cmp(f, dst, shallow=False) and not a.force:
            kept.append(rel)
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dst)
        copied += 1
    v = a.version
    fp = R / "src" / "parts" / "Footage.tsx"
    s = fp.read_text(encoding="utf8")
    s = re.sub(r'export const FACE_FILE = "[^"]*";[^\n]*', f'export const FACE_FILE = "footage/talk-clean-v{v}-small.mp4"; // natural, as shot (1080p for Studio/previews). Final 4K render: talk-clean-v{v}.mp4', s)
    s = re.sub(r'export const CUTOUT_FILE = "[^"]*";', f'export const CUTOUT_FILE = "footage/cutout-v{v}.webm";', s)
    fp.write_text(s, encoding="utf8")
    mv = R / "scripts" / "master_voice.py"
    s = mv.read_text(encoding="utf8")
    s = re.sub(r'SRC = ROOT / "public/audio/voice-clean-v\d+\.wav"', f'SRC = ROOT / "public/audio/voice-clean-v{v}.wav"', s)
    mv.write_text(s, encoding="utf8")
    for d in ("public/footage", "public/photos", "public/audio/music", "out"):
        (R / d).mkdir(parents=True, exist_ok=True)
    print(f"engine copied: {copied} files into {R}")
    if kept:
        print("kept (already different in the project, --force to overwrite):\n  " + "\n  ".join(kept))
    print("next: make_cutout.py, build_captions.py, master_voice.py, then rewrite src/cues.tsx + Storyboard pages (references/pipeline.md)")


if __name__ == "__main__":
    main()
