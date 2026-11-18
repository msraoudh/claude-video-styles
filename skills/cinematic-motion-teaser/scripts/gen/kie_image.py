#!/usr/bin/env python3
"""Image generation via Kie AI (https://kie.ai) — the user's REQUIRED image provider ("for image
generation always use kie ai always"). Portraits, venue/background plates, product stills, textures.

Auth: export KIE_API_KEY=...   (or put the key alone in ~/.config/kie/api_key, chmod 600).
      Never print, log, commit or paste the key. Get one at https://kie.ai/api-key.

Usage:
  python3 kie_image.py --prompt "..." --out /abs/people/ines.png [--model google/nano-banana]
         [--aspect 9:16] [--format png] [--n 2] [--set key=value ...] [--input-json '{"image_urls":[...]}']

  --n        how many separate tasks (variations to choose from); files get _1, _2 … suffixes
  --set      extra input fields for models with other schemas (e.g. --set resolution=2K)
  --input-json  raw JSON merged into "input" (lists, e.g. image_urls for edit/reference models)

API (docs: https://docs.kie.ai — check the model's page for its exact id + input schema):
  POST https://api.kie.ai/api/v1/jobs/createTask  {"model": ..., "input": {...}}  -> data.taskId
  GET  https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...  -> data.state in
       waiting|queuing|generating|success|fail ; data.resultJson = '{"resultUrls": [...]}'
Generation costs the user's Kie credits: don't loop retries on failure — report failMsg instead.
"""
import argparse
import json
import os
import pathlib
import sys
import time
import urllib.request

API = "https://api.kie.ai/api/v1"


def key():
    k = os.environ.get("KIE_API_KEY")
    if not k:
        p = pathlib.Path.home() / ".config/kie/api_key"
        if p.exists():
            k = p.read_text().strip()
    if not k:
        sys.exit("No Kie AI key: export KIE_API_KEY=... or save it to ~/.config/kie/api_key (ask the user).")
    return k


def call(method, url, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": f"Bearer {key()}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def coerce(v):
    try:
        return json.loads(v)
    except ValueError:
        return v


def run_one(model, inp, out, timeout_s):
    r = call("POST", f"{API}/jobs/createTask", {"model": model, "input": inp})
    if r.get("code") != 200:
        sys.exit(f"createTask failed: {r.get('code')} {r.get('msg')}")
    tid = r["data"]["taskId"]
    print(f"task {tid} ({model}) queued", flush=True)
    t0 = time.time()
    while True:
        time.sleep(4)
        d = call("GET", f"{API}/jobs/recordInfo?taskId={tid}").get("data") or {}
        st = d.get("state")
        if st == "success":
            urls = json.loads(d.get("resultJson") or "{}").get("resultUrls") or []
            if not urls:
                sys.exit(f"task {tid}: success but no resultUrls")
            paths = []
            for j, u in enumerate(urls):
                p = out if len(urls) == 1 else out.with_name(f"{out.stem}-{j + 1}{out.suffix}")
                p.parent.mkdir(parents=True, exist_ok=True)
                urllib.request.urlretrieve(u, p)
                paths.append(str(p))
            print(f"task {tid}: {d.get('costTime')} s, credits {d.get('creditsConsumed')} -> {', '.join(paths)}")
            return paths
        if st == "fail":
            sys.exit(f"task {tid} failed: {d.get('failCode')} {d.get('failMsg')}")
        if time.time() - t0 > timeout_s:
            sys.exit(f"task {tid}: still '{st}' after {timeout_s}s — check https://kie.ai logs, don't resubmit blindly")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--out", required=True, help="absolute output path (.png/.jpg)")
    ap.add_argument("--model", default="google/nano-banana")
    ap.add_argument("--aspect", default="9:16", help="1:1 9:16 16:9 3:4 4:3 3:2 2:3 5:4 4:5 21:9")
    ap.add_argument("--format", default="png", choices=["png", "jpeg"])
    ap.add_argument("--n", type=int, default=1)
    ap.add_argument("--set", action="append", default=[])
    ap.add_argument("--input-json", default=None)
    ap.add_argument("--timeout", type=int, default=600)
    a = ap.parse_args()

    inp = {"prompt": a.prompt, "aspect_ratio": a.aspect, "output_format": a.format}
    for kv in a.set:
        k, v = kv.split("=", 1)
        inp[k] = coerce(v)
    if a.input_json:
        inp.update(json.loads(a.input_json))
    out = pathlib.Path(a.out)
    for i in range(a.n):
        o = out if a.n == 1 else out.with_name(f"{out.stem}_{i + 1}{out.suffix}")
        run_one(a.model, inp, o, a.timeout)


if __name__ == "__main__":
    main()
