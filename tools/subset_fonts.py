"""Subset production fonts while preserving the variable axes and Spanish glyphs."""
import json
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]).resolve()
output.relative_to(root / "_publish")
report = []
unicodes = set(range(0x180)) | set(range(0x2000, 0x2070)) | {0x20AC, 0x2122}
required = set(map(ord, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz¡¿áéíóúñüÁÉÍÓÚÑÜ"))
for name in ("Inter-var.woff2", "Geist-var.woff2"):
    target = output / "assets/fonts" / name
    before = target.stat().st_size
    font = TTFont(target)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=unicodes)
    worker.subset(font)
    font.recalcTimestamp = False
    if not required.issubset(font.getBestCmap()):
        raise ValueError(f"Spanish glyphs missing from {name}")
    if "fvar" not in font:
        raise ValueError(f"Variable axes missing from {name}")
    font.save(target)
    report.append({"name": name, "sourceBytes": before, "subsetBytes": target.stat().st_size,
                   "spanishGlyphs": True, "variableAxes": [axis.axisTag for axis in font['fvar'].axes]})
total = sum(item['subsetBytes'] for item in report)
if total > 120000:
    raise ValueError(f"Font budget exceeded: {total}")
print(json.dumps({"fonts": report, "totalBytes": total}))
