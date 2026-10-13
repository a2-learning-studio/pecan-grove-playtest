"""Read-only packaged MP3 integrity/timing checks, plus FFmpeg decode verification."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess


def mp3_frames(path):
    data = path.read_bytes()
    pos = 0
    if data[:3] == b'ID3':
        if len(data) < 10 or any(x & 128 for x in data[6:10]):
            raise ValueError('Invalid ID3 header')
        size = sum(v << shift for v, shift in zip(data[6:10], (21, 14, 7, 0)))
        pos = 10 + size + (10 if data[5] & 16 else 0)
    end = len(data) - (128 if data[-128:-125] == b'TAG' else 0)
    count = 0
    seconds = 0
    formats = set()
    while pos < end:
        if pos + 4 > end:
            raise ValueError(f'Truncated header at {pos}')
        h = int.from_bytes(data[pos:pos + 4], 'big')
        version, layer, br, sr, pad = (h >> 19) & 3, (h >> 17) & 3, (h >> 12) & 15, (h >> 10) & 3, (h >> 9) & 1
        if h & 0xffe00000 != 0xffe00000 or version == 1 or layer != 1 or br in (0, 15) or sr == 3:
            raise ValueError(f'Invalid MPEG Layer III header at {pos}')
        rates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320] if version == 3 else [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
        sample_rate = [44100, 48000, 32000][sr] // (1 if version == 3 else 2 if version == 2 else 4)
        length = (144000 if version == 3 else 72000) * rates[br] // sample_rate + pad
        if pos + length > end:
            raise ValueError(f'Truncated frame at {pos}')
        count += 1
        seconds += (1152 if version == 3 else 576) / sample_rate
        formats.add((sample_rate, 1 if (h >> 6) & 3 == 3 else 2))
        pos += length
    if not count:
        raise ValueError('No audio frames')
    return {'frames': count, 'seconds': round(seconds, 6), 'formats': sorted(formats), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    voice = args.root / 'assets/games/community-builders/voice'
    text = (voice / 'index.js').read_text(encoding='utf-8')
    match = re.fullmatch(r'\s*(?:/\*[\s\S]*?\*/\s*)?window\.CB_VOICE\s*=\s*(\{[\s\S]*\})\s*;\s*', text)
    if not match:
        raise ValueError('Voice index is not a single JSON assignment')
    index = json.loads(match.group(1))
    clips = index['clips']
    failures = []
    results = {}
    for name, meta in sorted(clips.items()):
        path = voice / name
        try:
            result = mp3_frames(path)
            result['last_timing_ms'] = meta['t'][-1]
            result['end_margin_ms'] = round(result['seconds'] * 1000 - meta['t'][-1], 3)
            if meta['t'][-1] > result['seconds'] * 1000 + 1:
                raise ValueError('Read-along end exceeds MP3 duration')
            results[name] = result
        except Exception as exc:
            failures.append(f'{name}: {exc}')
    inventories = {lang: sorted({x['f'] for x in index[lang].values()}) for lang in ('en', 'es')}
    for lang, names in inventories.items():
        for name in names:
            if not name.startswith(lang + '/') or name not in clips:
                failures.append(f'{lang}: invalid mapped clip {name}')
    en_ids = {Path(x).name for x in inventories['en']}
    es_ids = {Path(x).name for x in inventories['es']}
    if en_ids != es_ids:
        failures.append('English/Spanish indexed clip identities differ')
    packaged = {x.relative_to(voice).as_posix() for x in voice.rglob('*.mp3')}
    if packaged != set(clips):
        failures.append('Packaged MP3 inventory differs from clip metadata')
    ffmpeg = shutil.which('ffmpeg')
    decode = {'available': bool(ffmpeg), 'passed': False}
    if ffmpeg and not failures:
        listing = Path(__file__).resolve().parent / 'audio-release-clips.ffconcat'
        listing.write_text('ffconcat version 1.0\n' + ''.join("file '" + (voice / name).resolve().as_posix().replace("'", "'\\''") + "'\n" for name in sorted(clips)), encoding='utf-8')
        proc = subprocess.run([ffmpeg, '-hide_banner', '-v', 'error', '-xerror', '-f', 'concat', '-safe', '0', '-i', str(listing), '-map', '0:a', '-f', 'null', '-'], capture_output=True, text=True, timeout=180)
        decode.update(passed=proc.returncode == 0, returncode=proc.returncode, stderr=proc.stderr.strip())
        if proc.returncode or proc.stderr.strip():
            failures.append('FFmpeg concat decode reported an error')
    elif not ffmpeg:
        failures.append('FFmpeg unavailable: decode test incomplete')
    report = {'source': str(args.root.resolve()), 'languages': {k: len(v) for k, v in inventories.items()}, 'clips': len(clips), 'total_seconds': round(sum(x['seconds'] for x in results.values()), 3), 'total_frames': sum(x['frames'] for x in results.values()), 'decode': decode, 'failures': failures, 'files': results}
    if args.output:
        args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k != 'files'}, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == '__main__':
    main()
