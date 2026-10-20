"""Turn the ElevenLabs master clips into the game's voice files.

Reads  _handoff/voice/voice-script.json      (the lines, from tools/make_voice_script.py)
       _handoff/voice/raw-masters/<lang>/<id>.mp3   (downloaded from ElevenLabs, Eleven v4)
Writes assets/games/community-builders/voice/<lang>/<id>.mp3   (mono, 64 kbps, silence trimmed, loudness evened)
       assets/games/community-builders/voice/index.js        (on-screen text -> clip, and each clip's word timings)
       assets/games/community-builders/voice/provenance.json (who made the audio, with what, when)

Word timings (for the read-along highlight) are estimated, not transcribed: the pauses in each clip are measured with
ffmpeg, each pause is pinned to the punctuation mark it most likely belongs to, and the words between pauses share the
speaking time by their syllables. Good to a word or so, which is what a read-along needs.

    python tools/make_voice_assets.py
"""
import json, re, shutil, subprocess, sys
from pathlib import Path
from mutagen.mp3 import MP3

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
VS = ROOT / "_handoff/voice/voice-script.json"
RAW = ROOT / "_handoff/voice/raw-masters"
OUT = ROOT / "assets/games/community-builders/voice"
CAST = {   # speaker -> ElevenLabs Voice Library voice, chosen 11 Oct 2026
    "Lucia": "Kate - Playful Latina Storyteller", "Theo": "Teddy Twinkle - Cute Cartoon", "lee": "Deedee - Smooth, Warm, Caring",
    "johnson": "Brother Wayne - Warm Southern Preacher", "ana": "Ery - Latina woman, Motivational",
    "ruth": "Grandma Rachel - Wise Southern Senior", "patel": "Abhi - Friendly and Balanced", "jayden": "Valf - Young & Energetic",
}
ROLE = {"Lucia": "Lucía (guide)", "Theo": "Theo (guide)", "lee": "Ms. Lee", "johnson": "Mr. Johnson", "ana": "Mrs. Ana",
        "ruth": "Grandma Ruth", "patel": "Mr. Patel", "jayden": "Jayden"}
FILTER = ("silenceremove=start_periods=1:start_duration=0:start_threshold=-45dB:detection=peak,areverse,"
          "silenceremove=start_periods=1:start_duration=0:start_threshold=-45dB:detection=peak,areverse,"
          "apad=pad_dur=0.12,loudnorm=I=-18:TP=-2:LRA=11")
VOWELS = re.compile(r"[aeiouyáéíóúü]+", re.I)


def norm(t):
    return re.sub(r"\s+", " ", t).strip()


def weight(word):
    """Roughly how long a word takes to say: its syllables, plus a little for every word; numbers are said in full."""
    core = re.sub(r"[^0-9a-záéíóúüñ']", "", word.lower())
    if core.isdigit():
        return 1.0 + 1.1 * len(core)
    return 0.35 + max(1, len(VOWELS.findall(core)))


def pauses(path, dur):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "silencedetect=noise=-38dB:d=0.11", "-f", "null", "-"],
                       capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    ends += [dur] * (len(starts) - len(ends))
    return [(max(0.0, a), b) for a, b in zip(starts, ends)]


def word_starts(text, path):
    """Start time (ms) of every word of the spoken text, plus the end of speech as the last entry."""
    words = text.split()
    dur = MP3(path).info.length
    sil = pauses(path, dur)
    tail = [s for s in sil if s[1] >= dur - 0.02]                       # the padding at the end
    end = tail[0][0] if tail else dur
    inner = [s for s in sil if s[0] > 0.05 and s[1] < end - 0.02 and s[1] - s[0] >= 0.2]   # real pauses, not the gaps inside words
    speech = end - sum(b - a for a, b in inner)
    w = [weight(x) for x in words]; tot = sum(w)
    cum = [0.0]
    for x in w: cum.append(cum[-1] + x)
    frac = [c / tot for c in cum]                                        # word boundary k as a share of the speaking
    cand = [k for k in range(1, len(words)) if re.search(r"[.,;:?!…]$", words[k - 1])]
    anchors, last, gone = [(0, 0.0)], 0, 0.0                             # (boundary, speaking time at that boundary)
    for a, b in inner:
        p = a - gone; gone += b - a                                      # speaking time before this pause
        if not cand:
            continue
        k = min(cand, key=lambda k: abs(frac[k] - p / speech))           # the punctuation mark nearest this pause
        if k > last and abs(frac[k] - p / speech) <= 0.15:
            anchors.append((k, p)); last = k
    anchors.append((len(words), speech))
    st = [0.0] * (len(words) + 1)                                        # speaking time of each boundary
    for (k0, p0), (k1, p1) in zip(anchors, anchors[1:]):
        span = cum[k1] - cum[k0] or 1
        for k in range(k0, k1 + 1):
            st[k] = p0 + (p1 - p0) * (cum[k] - cum[k0]) / span
    pos, gone, marks = [], 0.0, []                                       # speaking time -> clock time, skipping each pause
    for a, b in inner:
        marks.append((a - gone, b - a)); gone += b - a
    for k in range(len(words) + 1):
        shift = sum(d for p, d in marks if p <= st[k] + 1e-6 and k > 0)
        pos.append(round((st[k] + shift) * 1000))
    return pos, len(anchors) - 2, len(inner)


def main():
    lines = json.load(open(VS, encoding="utf-8"))["lines"]
    missing = [f"{lang}/{l['id']}" for l in lines for lang in ("en", "es") if not (RAW / lang / (l["id"] + ".mp3")).exists()]
    if missing:
        sys.exit("missing masters: " + ", ".join(missing))
    if OUT.exists():                                                     # clear old files; keep the folders (OneDrive can hold them open)
        for p in OUT.rglob("*"):
            if p.is_file():
                p.unlink()
    index, clips, total, secs = {"en": {}, "es": {}}, {}, 0, 0.0
    pinned = found = 0
    for lang in ("en", "es"):
        (OUT / lang).mkdir(parents=True, exist_ok=True)
        li = 0 if lang == "en" else 1
        seen = {}
        for l in lines:
            src, dst = RAW / lang / (l["id"] + ".mp3"), OUT / lang / (l["id"] + ".mp3")
            r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-af", FILTER,
                                "-ac", "1", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "64k", str(dst)], capture_output=True, text=True)
            if r.returncode or not dst.exists():
                sys.exit(f"ffmpeg failed on {lang}/{l['id']}: {r.stderr[-300:]}")
            total += dst.stat().st_size; secs += MP3(dst).info.length
            f, spoken = f"{lang}/{l['id']}.mp3", norm(l[lang])
            parts = [norm(m[li]) for m in l["match"]]
            shown = " ".join(parts)
            head = len(spoken.split()) - len(shown.split()) if spoken.endswith(shown) else 0   # the spoken stop name before the shown words
            t, a, n = word_starts(spoken, dst); pinned += a; found += n
            short = [w for w, t0, t1 in zip(spoken.split(), t, t[1:]) if t1 - t0 < 60]
            if short:
                print(f"   check {f}: {len(short)} words under 60 ms ({' '.join(short[:6])})")
            clips[f] = {"s": spoken, "t": t, "h": head}
            kind = "nb" if l["id"].startswith("nb-") else "guide"
            keys = {" ".join(parts[i:j]) for i in range(len(parts)) for j in range(i + 1, len(parts) + 1)}   # each piece, and pieces shown together
            for key in keys:
                seen.setdefault(key, []).append({"f": f, "k": kind})
        shared = [k for k, v in seen.items() if len({x["f"] for x in v}) > 1]
        for k, v in seen.items():
            if k not in shared:
                index[lang][k] = v[0]
        print(f"{lang}: {len(lines)} clips, {len(index[lang])} screen texts" + (f"; {len(shared)} shared texts left out: " + " | ".join(s[:40] for s in shared) if shared else ""))
    index["clips"] = clips
    js = ("/* Community Builders voice index: the on-screen texts that start each clip, and each clip's spoken words with their start times (ms).\n"
          "   Generated by tools/make_voice_assets.py; do not edit. */\n"
          "window.CB_VOICE = " + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n")
    (OUT / "index.js").write_text(js, encoding="utf-8", newline="\n")
    prov = {
        "what": "Spoken lines for Community Builders of Pecan Grove (English and Spanish), the exact on-screen words of each line.",
        "made_with": "ElevenLabs Text to Speech (web app), model Eleven v4; voices from the ElevenLabs Voice Library",
        "made_by": "Generated by the project owner (Ali Keyvanfar) in his ElevenLabs account, 11 Oct 2026; encoded with ffmpeg (mono, 64 kbps, loudness -18 LUFS).",
        "credit": "Voices made with ElevenLabs AI.",
        "word_timing": "Estimated from the pauses in each clip and the syllables of each word (tools/make_voice_assets.py); used for the read-along highlight.",
        "cast": [{"role": ROLE[k], "voice": v} for k, v in CAST.items()],
        "clips": {"per_language": len(lines), "languages": ["en", "es"], "total_seconds": round(secs, 1), "total_bytes": total},
        "script": "_handoff/voice/voice-script.json (tools/make_voice_script.py)",
    }
    (OUT / "provenance.json").write_text(json.dumps(prov, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    print(f"wrote {2 * len(lines)} clips, {total / 1e6:.1f} MB, {secs / 60:.1f} min of speech; {pinned} of {found} pauses pinned to punctuation")


if __name__ == "__main__":
    main()
