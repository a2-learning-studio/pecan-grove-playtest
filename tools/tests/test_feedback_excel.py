"""Read the browser's actual workbook using an independent Excel reader."""
import base64
import io
import json
from pathlib import Path
import shutil
import subprocess
import unittest
import zipfile
import xml.etree.ElementTree as ET

try:
    import openpyxl
except ImportError:
    openpyxl = None

ROOT = Path(__file__).resolve().parents[2]


class FeedbackExcelTests(unittest.TestCase):
    def workbook(self):
        entry = {"sessionId": "anonymous-session-1234", "entryId": "feedback-entry-12345",
                 "kind": "feedback", "stop": 3, "language": "es", "build": "test-build",
                 "createdAt": "2026-10-12T20:00:00.000Z", "updatedAt": "2026-10-12T20:01:00.000Z",
                 "revision": 2, "rating": "good", "category": "spanish",
                 "worked": "Español & voz <clara> \U0001F333\nsegunda línea",
                 "fix": '=HYPERLINK("https://example.invalid","text")', "score": 90,
                 "phase": "result", "ackRevision": 2, "sessionEnded": False}
        script = ("const api=require('./assets/playtest/feedback.js');"
                  "process.stdout.write(Buffer.from(api.excel(" + json.dumps([entry]) + ", api.WORDS.es.excelCheck)).toString('base64'));" )
        result = subprocess.run([shutil.which("node") or r"C:\Program Files\nodejs\node.exe", "-e", script],
                                cwd=ROOT, check=True, text=True, capture_output=True)
        return base64.b64decode(result.stdout), entry

    def test_valid_ooxml_archive_and_literal_comments(self):
        data, entry = self.workbook()
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            self.assertIsNone(archive.testzip())
            for name in archive.namelist():
                ET.fromstring(archive.read(name))
            sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
            ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            # Row 1 asks to check the file before sharing; the headers are row 2 and the notes start in row 3.
            self.assertTrue(sheet.find("s:sheetData/s:row[@r='1']/s:c[@r='A1']/s:is/s:t", ns).text.startswith("Revisa antes de compartir."))
            self.assertEqual(sheet.find("s:sheetData/s:row[@r='2']/s:c[@r='L2']/s:is/s:t", ns).text, "What worked")
            self.assertEqual(sheet.find("s:sheetData/s:row[@r='3']/s:c[@r='L3']/s:is/s:t", ns).text, entry["worked"])
            # Every note has the scrub a sent note has: the link in this formula-like text is removed.
            self.assertEqual(sheet.find("s:sheetData/s:row[@r='3']/s:c[@r='M3']/s:is/s:t", ns).text, '=HYPERLINK("[quitado]')
            self.assertEqual(sheet.findall(".//s:f", ns), [])

    @unittest.skipUnless(openpyxl, "optional independent Excel reader is unavailable")
    def test_excel_reader_opens_multilingual_feedback_without_formula_execution(self):
        data, entry = self.workbook()
        book = openpyxl.load_workbook(io.BytesIO(data))
        sheet = book.active
        self.assertTrue(sheet["A1"].value.startswith("Revisa antes de compartir."))
        self.assertEqual(sheet["L3"].value, entry["worked"])
        self.assertEqual(sheet["M3"].value, '=HYPERLINK("[quitado]')
        self.assertEqual(sheet["M3"].data_type, "s")
        self.assertEqual(sheet.freeze_panes, "A3")
        self.assertEqual(sheet.auto_filter.ref, "A2:R3")
        self.assertEqual(sheet["D3"].value, 3)
        self.assertEqual(sheet["I3"].value, 2)
        self.assertEqual(sheet["N3"].value, 90)


if __name__ == "__main__":
    unittest.main()
