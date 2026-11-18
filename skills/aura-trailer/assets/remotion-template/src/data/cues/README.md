Sound cues, one file per part: `<part>.json` = `[{ "f": <GLOBAL frame of the visual event>, "sfx": "<name>", "gain": 0-1.5, "note": "why" }]`.
The offline mixer (scripts/mix.py) reads every `*.json` here; components never play audio. Names: see references/sound.md.
