# English voiceover for PearTeaser via Kokoro (open-source neural TTS, Apache-2.0) → public/vo/*.wav
#
# Setup (once):
#   python3 -m venv ~/.cache/kokoro/venv && ~/.cache/kokoro/venv/bin/pip install kokoro-onnx==0.4.7 soundfile
#   curl -L -o ~/.cache/kokoro/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
#   curl -L -o ~/.cache/kokoro/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
#   cp -R ~/.cache/kokoro/venv/lib/python3.*/site-packages/espeakng_loader/espeak-ng-data ~/.cache/kokoro/
#   (espeak-ng ignores data paths longer than ~160 chars, so the data lives under the short ~/.cache path)
#
# Usage: ~/.cache/kokoro/venv/bin/python scripts/gen-voiceover-kokoro.py [voice] [speed]   (default: af_sarah 0.85 — lower = slower)
#   voice: af_sarah (default) af_heart af_bella af_aoede am_michael am_fenrir am_puck
#          bf_emma bf_isabella bm_george bm_fable  (a* = US, b* = UK)
# Writes each line's length in frames to src/voiceover-frames.json, which the video reads for timing/ducking.
import json, math, os, subprocess, sys, tempfile

import soundfile as sf
from kokoro_onnx import EspeakConfig, Kokoro

VOICE = sys.argv[1] if len(sys.argv) > 1 else "af_sarah"
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 0.85
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "vo")
CACHE = os.path.expanduser("~/.cache/kokoro")

# file → (text, speed multiplier, frames available before the next line starts)
LINES = {
    "01-start": ("It all starts with one line.", 1.0, 200),
    "02-looking": ("Looking for a builder?", 1.05, 36),
    "03-problem": ("Every business problem deserves a real solution.", 1.0, 170),
    "04-meet": ("Meet Pear Tanchanok.", 1.0, 90),
    # roles: one sentence told across the path, each part starts as its dot lands (roles 1, 3, last)
    "05-roles-a": ("She can analyse the business, and the systems behind it,", 1.05, 102),
    "06-roles-b": ("design the experience, build the software, and make sure it's ready to ship,", 1.0, 141),
    # starts just before the last dot lands; must end before the roles scene exits (ROLE_FINAL.exit)
    "07-roles-c": ("all the way to deploying AI, as a forward deployed engineer.", 1.05, 128),
    "08-ide": ("From problem, to production.", 1.0, 94),
    "09-work": ("Real projects. Shipped, and running.", 1.0, 170),
    "10-next": ("And there's more to come.", 1.0, 90),
    "11-together": ("Let's build together.", 0.95, 62),
    "12-slogan": ("Your one-stop builder. End to end.", 1.0, 74),
}

kokoro = Kokoro(
    f"{CACHE}/kokoro-v1.0.onnx",
    f"{CACHE}/voices-v1.0.bin",
    espeak_config=EspeakConfig(data_path=f"{CACHE}/espeak-ng-data"),
)
lang = "en-gb" if VOICE.startswith("b") else "en-us"
os.makedirs(OUT, exist_ok=True)
frames = {}
with tempfile.TemporaryDirectory() as tmp:
    for name, (text, speed, slot) in LINES.items():
        audio, sr = kokoro.create(text, voice=VOICE, speed=SPEED * speed, lang=lang)
        raw = os.path.join(tmp, f"{name}.wav")
        sf.write(raw, audio, sr)
        dst = os.path.join(OUT, f"{name}.wav")
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af",
             "silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
             "silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
             "highpass=f=80,loudnorm=I=-16:TP=-1.5",
             "-ar", "48000", "-ac", "2", dst],
            check=True,
        )
        dur = float(subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst]))
        frames[name] = math.ceil(dur * 30)
        warn = "  ⚠ longer than its slot — overlaps the next line" if frames[name] > slot else ""
        print(f"{name:12s} {dur:5.2f}s  {frames[name]:3d}/{slot} frames{warn}")

with open(os.path.join(ROOT, "src", "voiceover-frames.json"), "w") as f:
    json.dump(frames, f, indent=2)
    f.write("\n")
print(f"voice: {VOICE} (speed {SPEED})")
