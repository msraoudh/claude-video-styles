"""Download the ElevenLabs SFX generations of a flow run into audio/sfx-gen/<name>-<n>.mp3.
Save the flow-run-status JSON (creative_get_flow_run_status result) to a file first, then:
  python3 ~/.claude/skills/aura-trailer/scripts/get_sfx.py run-status.json [prompts.json]
A generation gets the name of the first sound in prompts.json (default: sfx_prompts.json) whose "match" words appear
in its prompt. If WSL has no internet (Windows VPN), download the content_url files from PowerShell instead."""
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402

d = json.load(open(sys.argv[1]))
pj = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "sfx_prompts.json")
names = [(s["match"].lower(), s["name"]) for s in json.load(open(pj))["sounds"]]
out_dir = tlib.path("audio/sfx-gen")
os.makedirs(out_dir, exist_ok=True)
count = {}
for g in d["generations"]:
    name = next((n for k, n in names if k in g["prompt"].lower()), None)
    if name is None:
        print("no name for prompt:", g["prompt"][:80])
        continue
    count[name] = count.get(name, 0) + 1
    out = f"{out_dir}/{name}-{count[name]}.mp3"
    urllib.request.urlretrieve(g["content_url"], out)
    print(out, os.path.getsize(out), g.get("duration_secs"))
