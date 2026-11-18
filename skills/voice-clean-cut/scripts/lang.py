"""Language of the recording, shared by every script.

Set VC_LANG before running a script: "fr" (default), "en", or "tn" (Tunisian Derja: Whisper hears it as
Arabic, with French and English tech words in Latin letters).

    VC_LANG=en python hear.py raw.m4a _heard.json
"""
import os

LANG = os.environ.get("VC_LANG", "fr").strip().lower() or "fr"

_CONF = {
    "fr": {
        "whisper": "fr",
        "prompts": (
            "Alors, euh, le, le conteneur, euh, c'est, c'est une, une image. Une image, une image donne, euh, donne un conteneur.",
            "Euh, je, je pense que, que c'est, bon, c'est ça, on, on va voir.",
        ),
        "fillers": ("euh", "heu", "hum", "hmm", "mmh", "mh", "hm", "eh", "ah", "ben", "bah", "hein"),
        "asides": ("attends", "attendez", "pardon", "recommence", "recommencer", "reprends", "reprendre", "reprise",
                   "excusez", "merde", "putain", "oups"),
        "digits": "un deux trois quatre cinq six sept huit neuf",
        "leak": ("une image donne euh", "euh le le conteneur", "c'est c'est une", "je je pense", "on on va voir"),
        "halluc": ("sous-titrage", "sous-titres", "merci d'avoir regardé", "amara.org"),
    },
    "en": {
        "whisper": "en",
        "prompts": (
            "So, uh, the, the container, um, it's, it's an, an image. An image, an image gives, uh, gives a container.",
            "Um, I, I think that, that it's, well, that's it, we, we'll see.",
        ),
        "fillers": ("uh", "um", "uhm", "er", "erm", "hmm", "mm", "mmh", "mh", "hm", "ah", "eh"),
        "asides": ("sorry", "wait", "again", "restart", "redo", "oops", "damn", "shit"),
        "digits": "one two three four five six seven eight nine",
        "leak": ("an image gives uh", "uh the the container", "it's it's an", "i i think", "we we'll see"),
        "halluc": ("thanks for watching", "thank you for watching", "subtitles by", "amara.org"),
    },
    "tn": {
        "whisper": "ar",
        "prompts": (
            "إيه، ال، ال container، إيه، هو، هو image. Image، image تعطيك، إيه، تعطيك container.",
            "إمم، أنا، أنا نحسب، نحسب إلي، باهي، هكا، توا، توا نشوفو.",
        ),
        "fillers": ("إيه", "ايه", "اه", "آه", "إمم", "امم", "مم", "هم", "euh", "uh", "um", "hmm", "eh", "ah", "ben", "bon"),
        "asides": ("سامحني", "استنى", "نعاود", "نعاودها", "pardon", "oups", "attends"),
        "digits": "",
        "leak": ("image تعطيك ايه", "ال ال container", "أنا أنا نحسب", "توا توا نشوفو"),
        "halluc": ("اشتركوا في القناة", "ترجمة", "شكرا على المشاهدة", "amara.org"),
    },
}

if LANG not in _CONF:
    raise SystemExit(f"VC_LANG={LANG!r}: use fr, en or tn")
C = _CONF[LANG]
WHISPER_LANG = C["whisper"]
VERBATIM_PROMPT, VERBATIM_PROMPT_2 = C["prompts"]
