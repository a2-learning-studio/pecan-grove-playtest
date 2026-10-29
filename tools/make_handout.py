"""Build the bilingual panel handout from the spec "02 - Panel handout (EN-ES) - content and layout.md".

Outputs (in the plan folder, and copies in site/downloads/ for the /panel/ page):
  02 - Panel handout (EN-ES).docx / .pdf          two-sided sheet, Side A English, Side B Spanish
  02 - Panel handout (EN-ES) - large print.docx/.pdf
  02 - Panel handout (EN-ES) - plain text.txt
Checks: PDF has exactly 2 pages, smallest text >= 12 pt, headings >= 16 pt, both QR codes decode to the
exact payload, no unresolved {{ tokens.  Run:  python -I tools/make_handout.py

Hub-only: it reads the panel plan folder beside the hub site and needs python-docx and segno, which this repository does
not install. Nothing in this repository's build, tests, npm scripts or CI runs or imports it.
"""
import re
import shutil
import sys
from pathlib import Path

import segno
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

SITE = Path(__file__).resolve().parent.parent
PLAN = SITE.parent / "Fulton County Library Panel (27 Oct 2026)" / "Community Hub - Plan"
SPEC = PLAN / "02 - Panel handout (EN-ES) - content and layout.md"
WORK = SITE / "build" / "handout"
STEM = "02 - Panel handout (EN-ES)"

SITE_URL = "https://www.knowyourdatacenter.org"
TOKENS = {
    "{{SITE_URL}}": SITE_URL,
    "{{SITE_URL_ES}}": SITE_URL + "/es",
    "{{SITE_URL|display}}": "knowyourdatacenter.org",
    "{{SITE_URL_ES|display}}": "knowyourdatacenter.org/es",
    "{{SITE_NAME_ES}}": "Know Your Data Center",
    "{{ES_REVIEWER}}": "un hablante nativo",          # until the reviewer gives written consent to be named
    "{{LAST_UPDATED_EN}}": "20 Oct 2026",
    "{{LAST_UPDATED_ES}}": "20 oct. 2026",
    "{{EVENT_LINE_EN}}": "27 Oct 2026 panel · Louise Watley Library",
    "{{EVENT_LINE_ES}}": "Panel del 27 oct. 2026 · Biblioteca Louise Watley",
    # analytics may be added later, so use the safe wording (spec §2)
    "{{SCAN_LINE_EN}}": "Scan to explore – no sign-up, no personal data collected",
    "{{SCAN_LINE_ES}}": "Escanee para explorar: sin registro ni datos personales.",
}
QR = {"A": SITE_URL + "/questions-to-ask/", "B": SITE_URL + "/es/preguntas/"}
# Hard rule (blueprint): rows not backed by a primary source by 20 Oct use the spec's fallback rows (§6.3).
USE_FALLBACK = {"19": "T", "20": "W"}
# Overflow ladder (spec §10.2), applied to both sides identically. Step 1: list/bullet/body space-after 2 pt -> 0 pt.
LADDER_AFTER = 0

ACCENT = RGBColor(0x0B, 0x4F, 0x6C)
TINT = "E6EEF2"
FONT = "Arial"


# ── spec parsing ────────────────────────────────────────────────────────────
def spec_rows():
    text = SPEC.read_text(encoding="utf-8").replace("\\|", "\u0001")
    rows = {}
    for line in text.splitlines():
        m = re.match(r"^\|\s*([AB]-\d+[ab]?|[WT]-(?:EN|ES))\s*\|(.*)\|\s*$", line)
        if not m:
            continue
        cells = [c.strip().replace("\u0001", "|") for c in m.group(2).split("|")]
        rows[m.group(1)] = cells
    return rows


def resolve(t):
    for k, v in TOKENS.items():
        t = t.replace(k, v)
    if "{{" in t:
        raise ValueError("unresolved token")
    return t


# ── docx helpers ────────────────────────────────────────────────────────────
def set_lang(run, lang):
    rpr = run._element.get_or_add_rPr()
    el = rpr.find(qn("w:lang"))
    if el is None:
        el = OxmlElement("w:lang")
        rpr.append(el)
    el.set(qn("w:val"), lang)


def fmt(p, size=12, line=15, before=0, after=2, align=None, exact=True):
    pf = p.paragraph_format
    pf.space_before, pf.space_after = Pt(before), Pt(after)
    pf.line_spacing = Pt(line)
    pf.line_spacing_rule = WD_LINE_SPACING.EXACTLY if exact else WD_LINE_SPACING.AT_LEAST
    if align:
        p.alignment = align


def border(p, side, sz_eighths, color="000000", space=4):
    ppr = p._p.get_or_add_pPr()
    bdr = ppr.find(qn("w:pBdr"))
    if bdr is None:
        bdr = OxmlElement("w:pBdr")
        ppr.append(bdr)
    el = OxmlElement(f"w:{side}")
    el.set(qn("w:val"), "single")
    el.set(qn("w:sz"), str(sz_eighths))
    el.set(qn("w:space"), str(space))
    el.set(qn("w:color"), color)
    bdr.append(el)


def shade(elm_pr, fill):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    elm_pr.append(shd)


def runs(p, text, lang, size=12, bold=False, color=None):
    """Write marked-up text: **bold**, *italic*, {H}run-in 16pt bold{/H}."""
    for part in re.split(r"(\{H\}.*?\{/H\}|\*\*.*?\*\*|\*[^*]+?\*)", text):
        if not part:
            continue
        b, i, s = bold, False, size
        if part.startswith("{H}"):
            part, b, s = part[3:-4] + " ", True, 16
        elif part.startswith("**"):
            part, b = part[2:-2], True
        elif part.startswith("*"):
            part, i = part[1:-1], True
        r = p.add_run(part)
        r.font.name, r.font.size, r.bold, r.italic = FONT, Pt(s), b, i
        r._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), FONT)
        if color is not None:
            r.font.color.rgb = color
        set_lang(r, lang)


def para(container, text, style, lang, before=0):
    p = container.add_paragraph()
    if style == "Kicker":
        fmt(p, after=2, before=before); runs(p, text, lang)
    elif style == "Name":
        fmt(p, size=24, line=28, after=2, before=before); runs(p, text, lang, size=24, bold=True, color=ACCENT)
        p.paragraph_format.keep_with_next = True
    elif style == "Promise":
        fmt(p, after=6, before=before); runs(p, text, lang)
    elif style == "H":
        fmt(p, size=16, line=18, after=3, before=before); runs(p, text, lang, size=16, bold=True)
        border(p, "left", 32, "0B4F6C", 4); p.paragraph_format.keep_with_next = True
        p.style = container.part.document.styles["Heading 2"] if hasattr(container, "part") else p.style
        for r in p.runs:
            r.font.color.rgb = RGBColor(0, 0, 0)
    elif style in ("Bullet", "List"):
        fmt(p, after=LADDER_AFTER, before=before)
        p.paragraph_format.left_indent, p.paragraph_format.first_line_indent = Inches(0.25), Inches(-0.25)
        p.paragraph_format.tab_stops.add_tab_stop(Inches(0.25))
        runs(p, ("•" if style == "Bullet" else text.split("\u0002")[0]) + "\t", lang)
        runs(p, text.split("\u0002")[-1], lang)
    elif style == "RunIn":
        fmt(p, after=0, before=before, exact=False); runs(p, text, lang)
    elif style == "Pointer":
        fmt(p, after=4, before=before, align=WD_ALIGN_PARAGRAPH.CENTER); runs(p, text, lang, bold=True)
        for side in ("top", "left", "bottom", "right"):
            border(p, side, 12, "000000", 2)
        shade(p._p.get_or_add_pPr(), TINT)
    elif style == "URL":
        fmt(p, size=13, line=16, before=2, after=2, align=WD_ALIGN_PARAGRAPH.CENTER); runs(p, text, lang, size=13, bold=True)
    elif style == "Scan":
        fmt(p, after=0, before=before, align=WD_ALIGN_PARAGRAPH.CENTER); runs(p, text, lang)
    elif style == "Footer":
        fmt(p, after=0, before=before); runs(p, text, lang); border(p, "top", 6, "000000", 3)
    else:  # Body, Strip
        fmt(p, after=4 if style == "Strip" else LADDER_AFTER, before=before); runs(p, text, lang)
    return p


def no_borders(table):
    tblpr = table._tbl.tblPr
    b = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement(f"w:{side}"); e.set(qn("w:val"), "nil"); b.append(e)
    tblpr.append(b)


def cell_borders(cell, **sides):
    tcpr = cell._tc.get_or_add_tcPr()
    b = OxmlElement("w:tcBorders")
    for side, sz in sides.items():
        e = OxmlElement(f"w:{side}")
        e.set(qn("w:val"), "single" if sz else "nil")
        if sz:
            e.set(qn("w:sz"), str(sz)); e.set(qn("w:color"), "000000")
        b.append(e)
    tcpr.append(b)


def first_par(cell):
    p = cell.paragraphs[0]
    return p


def qr_png(side, scale=33):
    WORK.mkdir(parents=True, exist_ok=True)
    out = WORK / f"qr-{side}.png"
    segno.make(QR[side], error="q", boost_error=False, micro=False).save(
        str(out), kind="png", scale=scale, border=4, dark="#000000", light="#ffffff", dpi=600)
    return out


# ── the two-sided sheet ─────────────────────────────────────────────────────
STYLE_OF = {"KDC-Kicker": "Kicker", "KDC-Name": "Name", "KDC-Promise": "Promise", "KDC-H": "H",
            "KDC-Bullet": "Bullet", "KDC-RunIn": "RunIn", "KDC-Strip": "Strip", "KDC-Body": "Body",
            "KDC-URL": "URL", "KDC-Scan": "Scan", "KDC-Footer": "Footer"}


def style_of(cells):
    s = cells[-2]
    if "Pointer" in s:
        return "Pointer"
    if "KDC-List" in s:
        return "List"
    for k, v in STYLE_OF.items():
        if k in s:
            return v
    return "Body"


def build_side(doc, rows, X, lang):
    t = lambda i: resolve(rows[f"{X}-{i:02d}"][-1])
    # Band 1: two-column borderless table
    tb = doc.add_table(rows=1, cols=2)
    tb.alignment = WD_TABLE_ALIGNMENT.LEFT
    tb.autofit = False
    no_borders(tb)
    left, right = tb.rows[0].cells
    left.width, right.width = Inches(5.15), Inches(2.55)
    left._tc.remove(left.paragraphs[0]._p)
    right._tc.remove(right.paragraphs[0]._p)
    for i in range(1, 12):
        cells = rows[f"{X}-{i:02d}"]
        para(left, t(i), style_of(cells), lang)
    other = "es-US" if lang == "en-US" else "en-US"
    para(right, t(12), "Pointer", other)
    pq = right.add_paragraph(); fmt(pq, line=180, after=0, align=WD_ALIGN_PARAGRAPH.CENTER, exact=False)
    pq.add_run().add_picture(str(qr_png(X)), width=Inches(2.475))
    para(right, t(14), "URL", lang)
    para(right, t(15), "Scan", lang)

    # Band 2
    para(doc, t(16), "H", lang, before=6)
    para(doc, t(17), "Strip", lang)
    mt = doc.add_table(rows=3, cols=2)
    mt.autofit = False
    no_borders(mt)
    keys = []
    for n in ("18", "19", "20"):
        if n in USE_FALLBACK:
            fb = USE_FALLBACK[n] + ("-EN" if X == "A" else "-ES")
            keys.append((rows[fb][0], rows[fb][1]))
        else:
            keys.append((rows[f"{X}-{n}a"][-1], rows[f"{X}-{n}b"][-1]))
    for r_i, (a, b) in enumerate(keys):
        ca, cb = mt.rows[r_i].cells
        ca.width, cb.width = Inches(2.00), Inches(5.70)
        shade(ca._tc.get_or_add_tcPr(), TINT)
        top = 12 if r_i == 0 else 4
        bot = 12 if r_i == 2 else 4
        for c in (ca, cb):
            cell_borders(c, top=top, bottom=bot, left=0, right=0)
        for c, txt in ((ca, a), (cb, b)):
            p = c.paragraphs[0]; fmt(p, after=0); runs(p, resolve(txt), lang)

    # Band 3
    para(doc, t(21), "H", lang, before=6)
    para(doc, t(22), "Body", lang)
    for n, i in enumerate(range(23, 30), start=1):
        para(doc, f"{n}.\u0002" + t(i), "List", lang)

    # Band 4 + 5
    para(doc, t(30), "RunIn", lang, before=6)
    para(doc, t(31), "Footer", lang, before=6)


def new_doc(margin, title):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Inches(8.5), Inches(11)
    for side in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, side, Inches(margin))
    st = doc.styles["Normal"]
    st.font.name, st.font.size = FONT, Pt(12)
    st.element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), FONT)
    h2 = doc.styles["Heading 2"]
    h2.font.name, h2.font.size, h2.font.bold = FONT, Pt(16), True
    h2.font.color.rgb = RGBColor(0, 0, 0)
    doc.core_properties.title = title
    doc.core_properties.language = "en-US"
    return doc


def build_sheet(rows):
    doc = new_doc(0.40, "Know Your Data Center – panel handout (English/Español)")
    doc.paragraphs[0]._p.getparent().remove(doc.paragraphs[0]._p) if doc.paragraphs else None
    build_side(doc, rows, "A", "en-US")
    brk = doc.add_paragraph(); fmt(brk, line=2, after=0); brk.add_run().add_break(WD_BREAK.PAGE)
    build_side(doc, rows, "B", "es-US")
    out = PLAN / f"{STEM}.docx"
    doc.save(out)
    return out


# ── plain text + large print ────────────────────────────────────────────────
FALLBACK_TXT = {
    "en": ["2. Tax breaks could shrink the gain (at approval). What can help: limit local tax breaks. Where it was "
           "tried: Fulton County commissioners asked development authorities to stop (August 2026). Did it work? "
           "Not binding; too early to tell.",
           "3. Water use could be heavy (building and running). What can help: cooling with recycled water, not "
           "drinking water. Where it was tried: Quincy, Washington, funded by Microsoft. Did it work? In use for years."],
    "es": ["2. Las reducciones de impuestos podrían achicar la ganancia (en la aprobación). Qué puede ayudar: "
           "limitarlas. Dónde se probó: el condado de Fulton pidió a las autoridades de desarrollo dejar de darlas "
           "(agosto de 2026). ¿Funcionó? No es obligatorio; aún no se sabe.",
           "3. Podría usar mucha agua (obra y operación). Qué puede ayudar: enfriar con agua reciclada, no potable. "
           "Dónde se probó: Quincy, Washington, con fondos de Microsoft. ¿Funcionó? Lleva años en uso."],
}


def plain_blocks():
    text = SPEC.read_text(encoding="utf-8")
    sec = text[text.index("## 13. Plain-text version"):text.index("## 14.")]
    blocks = re.findall(r"```text\n(.*?)```", sec, re.S)
    out = []
    for lang, b in zip(("en", "es"), blocks):
        b = b.replace('{{SCAN_LINE_EN without the words "Scan to explore – "}}', "No sign-up, no personal data collected.")
        b = b.replace('{{SCAN_LINE_ES sin las palabras "Escanee para explorar: "}}', "Sin registro ni datos personales.")
        lines = b.splitlines()
        # swap example rows 2 and 3 for the primary-source fallback rows
        lines = [FALLBACK_TXT[lang][0] if l.startswith("2. ") and ("tax money" in l or "recauda" in l) else
                 FALLBACK_TXT[lang][1] if l.startswith("3. ") and ("sit empty" in l or "edificio vacío" in l) else l
                 for l in lines]
        out.append((lang, resolve("\n".join(lines)).strip()))
    return out


def sentence_case(h):
    keep = {"GEORGIA": "Georgia", "KNOW YOUR DATA CENTER": "Know Your Data Center"}
    if h in keep:
        return keep[h]
    s = h[:1] + h[1:].lower()
    return (s.replace("georgia", "Georgia").replace("¿quién", "¿Quién").replace("¿qui", "¿Qui")
             .replace("know your data center", "Know Your Data Center"))


def build_large(blocks):
    doc = new_doc(0.5, "Know Your Data Center – panel handout, large print (English/Español)")
    first = True
    for lang, block in blocks:
        tag = "en-US" if lang == "en" else "es-US"
        if not first:
            doc.add_section(WD_SECTION.ODD_PAGE)
        first = False
        lines = block.splitlines()
        # header row: name + event + pointer on the left, QR on the right
        tb = doc.add_table(rows=1, cols=2); tb.autofit = False; no_borders(tb)
        l, r = tb.rows[0].cells
        l.width, r.width = Inches(4.6), Inches(2.9)
        l._tc.remove(l.paragraphs[0]._p)
        name = lines[0].replace("KNOW YOUR DATA CENTER", "Know Your Data Center")
        p = l.add_paragraph(); fmt(p, size=30, line=34, after=6); runs(p, name, tag, size=30, bold=True, color=ACCENT)
        p = l.add_paragraph(); fmt(p, size=18, line=23, after=6); runs(p, lines[1], tag, size=18)
        pointer = "En español: hoja 2" if lang == "en" else "In English: sheet 1"
        p = l.add_paragraph(); fmt(p, size=18, line=23, after=6); runs(p, pointer, "es-US" if lang == "en" else "en-US", size=18, bold=True)
        side = "A" if lang == "en" else "B"
        rp = r.paragraphs[0]; fmt(rp, line=220, after=0, align=WD_ALIGN_PARAGRAPH.RIGHT, exact=False)
        n = segno.make(QR[side], error="q", boost_error=False, micro=False).symbol_size(border=0)[0]
        rp.add_run().add_picture(str(qr_png(side, scale=-(-2.5 * 600 // n))), width=Inches((n + 8) * (-(-2.5 * 600 // n)) / 600))
        for line in lines[2:]:
            if not line.strip():
                continue
            is_head = line.upper() == line and re.search(r"[A-ZÁÉÍÓÚÑ]{3}", line) and not line.startswith(("1.", "2."))
            p = doc.add_paragraph()
            if is_head:
                fmt(p, size=24, line=28, before=10, after=6); runs(p, sentence_case(line.strip()), tag, size=24, bold=True)
                p.paragraph_format.keep_with_next = True
            else:
                fmt(p, size=18, line=23, after=6)
                if re.match(r"^\d\. ", line):
                    p.paragraph_format.left_indent, p.paragraph_format.first_line_indent = Inches(0.35), Inches(-0.35)
                runs(p, line, tag, size=18)
    out = PLAN / f"{STEM} - large print.docx"
    doc.save(out)
    return out


# ── PDF export + checks ─────────────────────────────────────────────────────
def to_pdf(docx_path):
    import pythoncom
    import win32com.client
    pythoncom.CoInitialize()
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    pdf = docx_path.with_suffix(".pdf")
    try:
        d = word.Documents.Open(str(docx_path), ReadOnly=True, AddToRecentFiles=False)
        d.ExportAsFixedFormat(OutputFileName=str(pdf), ExportFormat=17, OpenAfterExport=False, OptimizeFor=0,
                              Range=0, IncludeDocProps=True, CreateBookmarks=1, DocStructureTags=True,
                              BitmapMissingFonts=True, UseISO19005_1=False)
        d.Close(False)
    finally:
        word.Quit()
    return pdf


def check_pdf(pdf, expect_pages, min_pt, qr_expected):
    import cv2
    import fitz
    import numpy as np
    problems = []
    doc = fitz.open(pdf)
    if expect_pages and doc.page_count != expect_pages:
        problems.append(f"{pdf.name}: {doc.page_count} pages (expected {expect_pages})")
    smallest = 99
    for page in doc:
        for b in page.get_text("dict")["blocks"]:
            for line in b.get("lines", []):
                for s in line["spans"]:
                    if s["text"].strip():
                        smallest = min(smallest, s["size"])
        if "{{" in page.get_text():
            problems.append(f"{pdf.name} p{page.number + 1}: unresolved token")
    if smallest < min_pt - 0.1:
        problems.append(f"{pdf.name}: smallest text {smallest:.1f} pt (< {min_pt})")
    found = []
    det = cv2.QRCodeDetector()
    for page in doc:
        for dpi in (150, 300):
            pix = page.get_pixmap(dpi=dpi, colorspace=fitz.csGRAY)
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width)
            ok, texts, _, _ = det.detectAndDecodeMulti(img)
            if ok:
                found += [t for t in texts if t]
    for want in qr_expected:
        if want not in found:
            problems.append(f"{pdf.name}: QR {want} not decoded")
    return problems, smallest, sorted(set(found))


def main():
    rows = spec_rows()
    sheet = build_sheet(rows)
    blocks = plain_blocks()
    txt = PLAN / f"{STEM} - plain text.txt"
    txt.write_text("\n\n\n".join(b for _, b in blocks) + "\n", encoding="utf-8")
    large = build_large(blocks)
    report = []
    for docx_path, pages, min_pt in ((sheet, 2, 12), (large, None, 18)):
        pdf = to_pdf(docx_path)
        probs, smallest, found = check_pdf(pdf, pages, min_pt, [QR["A"], QR["B"]])
        report.append((pdf.name, smallest, found, probs))
    dl = SITE / "downloads"
    dl.mkdir(exist_ok=True)
    shutil.copy2(PLAN / f"{STEM}.pdf", dl / "handout-en-es.pdf")
    shutil.copy2(PLAN / f"{STEM} - large print.pdf", dl / "handout-en-es-large-print.pdf")
    shutil.copy2(txt, dl / "handout-en-es.txt")
    bad = False
    for name, smallest, found, probs in report:
        print(f"{name}: smallest text {smallest:.1f} pt; QR decoded: {found}")
        for p in probs:
            print("  PROBLEM", p); bad = True
    print("copied to site/downloads/")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        sys.exit(f"HANDOUT FAILED: {type(e).__name__}: {e}")
