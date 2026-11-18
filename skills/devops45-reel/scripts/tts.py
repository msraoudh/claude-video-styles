"""ElevenLabs voice for one episode through the HTTP API → audio/voice/take-raw.mp3 (+ take.mp3 if atempo is 1).
Voice « Kev - French - Dynamic » (<YOUR_ELEVENLABS_VOICE_ID>), model eleven_v4 — the series voice, approved by the user.
Text = episode.json voice.tts (the Showrunner's voiceover_tts, audio tags allowed) or the clean script.

Key: $ELEVENLABS_API_KEY or ~/.config/devops45/elevenlabs.key (never printed, never written anywhere else).
If there is no key, generate the take with the ElevenLabs connector tools instead (see SKILL.md step 3) and save it
as audio/voice/take-raw.mp3 — then run align.py as usual.
  ~/.venvs/audio/bin/python tts.py <project> [--model eleven_v3]
"""
import json
import os
import sys
import urllib.error
import urllib.request

import elib

P = elib.proj()
ep = elib.load_episode(P)
v = ep.get("voice", {})
text = (v.get("tts") or elib.clean_script(ep)).strip()
voice_id = v.get("voice_id", "<YOUR_ELEVENLABS_VOICE_ID>")
model = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else v.get("model", "eleven_v4")
key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
kf = os.path.expanduser("~/.config/devops45/elevenlabs.key")
if not key and os.path.exists(kf):
    key = open(kf).read().strip()
if not key:
    sys.exit("NO_KEY: no ElevenLabs API key — use the ElevenLabs connector tools (SKILL.md step 3) and save "
             f"{P}/audio/voice/take-raw.mp3")
os.makedirs(f"{P}/audio/voice", exist_ok=True)
body = {"text": text, "model_id": model,
        "voice_settings": {"stability": v.get("stability", 0.5), "similarity_boost": 0.8, "style": v.get("style", 0.3),
                           "use_speaker_boost": True}}
if "language_code" not in v:
    body["language_code"] = "fr"


def call(b):
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_192",
        data=json.dumps(b).encode(), headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    return urllib.request.urlopen(req, timeout=180).read()


try:
    audio = call(body)
except urllib.error.HTTPError as e:
    msg = e.read()[:300].decode("utf-8", "replace")
    if e.code in (400, 422) and model == "eleven_v4":
        print(f"eleven_v4 refused ({e.code}: {msg}) — retrying with eleven_v3")
        body["model_id"] = model = "eleven_v3"
        audio = call(body)
    else:
        sys.exit(f"ElevenLabs HTTP {e.code}: {msg}")
open(f"{P}/audio/voice/take-raw.mp3", "wb").write(audio)
print(f"take-raw.mp3 {len(audio) // 1024} KB · voice {voice_id} · model {model} · {len(text.split())} words")
