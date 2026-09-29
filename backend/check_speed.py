"""
Run:  python check_speed.py              (tests network + Gemini)
      python check_speed.py soilcard.jpg (also tests Tesseract on your image)
Tells you WHICH service is slow. Takes ~30s worst case.
"""
import os, sys, time
from dotenv import load_dotenv
load_dotenv()

def t(label, fn):
    t0 = time.perf_counter()
    try:
        out = fn()
        print(f"OK   {label:32} {time.perf_counter()-t0:6.2f}s  {out or ''}")
    except Exception as e:
        print(f"FAIL {label:32} {time.perf_counter()-t0:6.2f}s  {type(e).__name__}: {str(e)[:150]}")

import requests
t("Open-Meteo geocoding", lambda: requests.get(
    "https://geocoding-api.open-meteo.com/v1/search", params={"name": "Pune", "count": 1}, timeout=20).status_code)
t("Open-Meteo archive (1 year)", lambda: requests.get(
    "https://archive-api.open-meteo.com/v1/archive",
    params={"latitude": 18.5, "longitude": 73.8, "start_date": "2025-09-01", "end_date": "2026-09-01",
            "daily": "temperature_2m_mean", "timezone": "auto"}, timeout=30).status_code)

def gemini():
    from google import genai
    c = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return c.interactions.create(model=os.getenv("GEMINI_MODEL", "gemini-3.6-flash"), input="Say hi in 3 words").output_text
t("Gemini (model in app.py)", gemini)

if len(sys.argv) > 1:
    from PIL import Image
    import pytesseract
    p = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(p):
        pytesseract.pytesseract.tesseract_cmd = p
    img = Image.open(sys.argv[1]); print("image size:", img.size)
    t("Tesseract ORIGINAL size", lambda: len(pytesseract.image_to_string(img.convert("L"), config="--oem 3 --psm 6", timeout=120)))
    from fast_helpers import prep_for_ocr
    t("Tesseract SHRUNK (2000px)", lambda: len(pytesseract.image_to_string(prep_for_ocr(img), config="--oem 1 --psm 6", timeout=120)))