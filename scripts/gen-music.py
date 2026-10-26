# Synthesises the PearTeaser music bed (120 BPM, beat grid anchored at the pear launch 5.2s).
# Usage: python3 scripts/gen-music.py /tmp/music_raw.wav  (needs numpy), then normalise to -16 LUFS:
#   ffmpeg -i /tmp/music_raw.wav -af "volume=<-16 - measured LUFS>dB,alimiter=limit=0.89:level=false" -b:a 192k public/music.mp3
# Scene times below mirror AT in src/PearTeaser.tsx — regenerate if the timeline moves.
import sys, wave
import numpy as np

SR = 48000
DUR = 50.9
N = int(DUR * SR)
rng = np.random.default_rng(7)

T0 = 174 / 30          # pear fully covers the screen (AT.prompt + 22) → drop
ROLES = 511 / 30       # roles scene → add arp + clap
IDE = 887 / 30
SHOW = 1027 / 30
OUTRO = 1325 / 30      # bright wipe → impact, beat stops
IDEA = 338 / 30        # "solution" → mini impact
BEAT = 0.5
BAR = 2.0

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)

# Am9, Fmaj7, Cadd9, G6
CHORDS = [
    (45, [57, 60, 64, 67, 71]),
    (41, [53, 57, 60, 64]),
    (48, [60, 64, 67, 74]),
    (43, [55, 59, 62, 64]),
]

def chord_at(t):
    return CHORDS[int(np.floor((t - T0) / BAR)) % 4]

pad = np.zeros((N, 2))
drums = np.zeros((N, 2))
bass = np.zeros(N)
arp = np.zeros((N, 2))
fx = np.zeros((N, 2))

def add(buf, start, sig, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    sig = sig[: N - i]
    if buf.ndim == 1:
        buf[i : i + len(sig)] += sig
    else:
        buf[i : i + len(sig), 0] += sig * (1 - max(pan, 0))
        buf[i : i + len(sig), 1] += sig * (1 + min(pan, 0))

def saw(freq, n, harmonics=9):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, harmonics + 1):
        if freq * k > 9000:
            break
        out += np.sin(2 * np.pi * freq * k * t + k) / k
    return out

# ---------- pad: one chord per bar, detuned saws, slow attack, overlapping release
bar_starts = np.arange(T0 - 3 * BAR, DUR, BAR)
for bs in bar_starts:
    root, notes = chord_at(bs + 0.01)
    length = BAR + 0.6
    n = int(length * SR)
    t = np.arange(n) / SR
    env = np.minimum(1, t / 0.35) * np.clip((length - t) / 0.6, 0, 1)
    for j, note in enumerate(notes):
        for det, pan in ((-0.09, -0.6), (0.0, 0.0), (0.08, 0.6)):
            f = midi(note + det)
            add(pad, bs, saw(f, n, 6) * env * 0.035, pan)

# ---------- bass: 8th-note root pulse from the drop until the outro
t = T0
while t < OUTRO - 0.01:
    root, _ = chord_at(t + 0.01)
    n = int(0.24 * SR)
    tt = np.arange(n) / SR
    f = midi(root)
    sig = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.16) * np.minimum(1, tt / 0.004)
    add(bass, t, sig * (0.22 if t < ROLES else 0.28))
    t += BEAT / 2

# ---------- drums
def kick():
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    f = 46 + 110 * np.exp(-tt / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt / 0.22) + 0.25 * rng.standard_normal(n) * np.exp(-tt / 0.004)

def hat(decay=0.035):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    noise = np.diff(rng.standard_normal(n + 1))
    return noise * np.exp(-tt / decay) * 0.5

def clap():
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = noise - np.convolve(noise, np.ones(12) / 12, "same")  # drop the lows
    env = np.exp(-tt / 0.11)
    for d in (0.0, 0.011, 0.022):
        env = env + 0.6 * np.exp(-np.maximum(tt - d, 0) / 0.006) * (tt >= d)
    return noise * env * 0.22

kick_times = []
b = T0
while b < OUTRO - 0.01:
    beat_i = int(round((b - T0) / BEAT))
    kick_times.append(b)
    add(drums, b, kick() * 0.55)
    add(drums, b + BEAT / 2, hat() * (0.28 if b < ROLES else 0.36), 0.25)
    if b >= ROLES:
        add(drums, b + BEAT / 4, hat(0.015) * 0.16, -0.3)
        add(drums, b + 3 * BEAT / 4, hat(0.015) * 0.16, -0.3)
        if beat_i % 2 == 1:
            add(drums, b, clap(), 0.0)
    b += BEAT

# intro: soft ticking hats under the typing
tk = 0.5
while tk < T0 - 0.6:
    add(drums, tk, hat(0.02) * 0.12, 0.4 if int(tk * 4) % 2 else -0.4)
    tk += BEAT / 2

# ---------- arp: 16th-note plucks over chord tones (roles → outro)
def pluck(f, length=0.22):
    n = int(length * SR)
    tt = np.arange(n) / SR
    sig = sum(np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (7 + 9 * k)) / k for k in range(1, 6))
    return sig * np.minimum(1, tt / 0.002)

step = 0
t = ROLES
while t < OUTRO - 0.01:
    _, notes = chord_at(t + 0.01)
    seq = [notes[0], notes[2], notes[-1], notes[1]]
    note = seq[step % 4] + 12 + (12 if t >= SHOW and step % 8 >= 6 else 0)
    add(arp, t, pluck(midi(note)) * 0.09, -0.5 if step % 2 else 0.5)
    step += 1
    t += BEAT / 4

# intro plucks: sparse, quiet, sets the motif
for i, tt0 in enumerate(np.arange(0.4, T0 - 0.8, BEAT)):
    _, notes = chord_at(tt0 + 0.01)
    add(arp, tt0, pluck(midi(notes[i % len(notes)] + 12), 0.5) * 0.05, 0.3 if i % 2 else -0.3)

# ---------- risers and impacts
def riser(length, gain):
    n = int(length * SR)
    tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    y = 0.0
    a = 0.01 + 0.5 * (tt / length) ** 2
    for i in range(n):
        y += a[i] * (noise[i] - y)
        out[i] = y
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / length) ** 2) / SR) * 0.25
    return (out + sweep) * (tt / length) ** 2 * gain

def impact(gain, length=1.6):
    n = int(length * SR)
    tt = np.arange(n) / SR
    f = 30 + 50 * np.exp(-tt / 0.15)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.5)
    hiss = rng.standard_normal(n) * np.exp(-tt / 0.25) * 0.25
    return (boom + hiss) * gain

add(fx, T0 - 1.8, riser(1.8, 0.5))
add(fx, T0, impact(0.55))
add(fx, IDEA - 1.0, riser(1.0, 0.25))
add(fx, IDEA, impact(0.3, 1.0))
add(fx, IDE - 1.0, riser(1.0, 0.25))
add(fx, OUTRO - 2.0, riser(2.0, 0.55))
add(fx, OUTRO, impact(0.7, 2.4))

# ---------- sidechain pump on pad + bass
duck = np.ones(N)
for k in kick_times:
    i = int(k * SR)
    n = min(int(0.4 * SR), N - i)
    tt = np.arange(n) / SR
    duck[i : i + n] = np.minimum(duck[i : i + n], 1 - 0.55 * np.exp(-tt / 0.11))

# ---------- reverb (decaying-noise IR) on pad + arp
def reverb(x, seconds=2.2, mix=0.35):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-tt / (seconds / 5))
        ir /= np.sqrt(np.sum(ir**2))
        size = 1 << int(np.ceil(np.log2(len(x) + n)))
        wet = np.fft.irfft(np.fft.rfft(x[:, ch], size) * np.fft.rfft(ir, size), size)[: len(x)]
        out[:, ch] = x[:, ch] + mix * wet
    return out

# intro pad is filtered softer, opens up at the drop
open_env = np.clip((np.arange(N) / SR - (T0 - 1.5)) / 1.5, 0.45, 1.0)
pad_bus = reverb(pad * open_env[:, None]) * duck[:, None]
arp_bus = reverb(arp, 1.6, 0.4)
mix = pad_bus + arp_bus + drums + fx + (bass * duck)[:, None]

# outro: beat gone, pad + reverb tail, fade the final 1.6s
tsec = np.arange(N) / SR
mix *= np.clip((DUR - tsec) / 1.6, 0, 1)[:, None]
mix *= np.clip(tsec / 0.3, 0, 1)[:, None]

mix = np.tanh(mix * 1.4) / 1.4
mix /= np.max(np.abs(mix)) * 1.12
pcm = (mix * 32767).astype("<i2")
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", N / SR)
