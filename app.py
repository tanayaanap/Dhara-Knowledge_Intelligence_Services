from flask import Flask, render_template, request
import numpy as np
import joblib
import pytesseract
from PIL import Image
import fitz  # PyMuPDF for PDF support
import re
import io
import os

app = Flask(__name__)

# ── Tesseract path (Windows) ──────────────────────────────────
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ── Load trained model + encoder ─────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, "xgboost_model.pkl"))
le = joblib.load(os.path.join(BASE_DIR, "label_encoder.pkl"))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_file(file_bytes, filename):
    """Extract raw text from image or PDF using OCR."""
    ext = filename.rsplit(".", 1)[1].lower()
    if ext == "pdf":
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page = doc[0]
        pix = page.get_pixmap(dpi=200)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    else:
        img = Image.open(io.BytesIO(file_bytes))

    img = img.convert("L")  # grayscale → better OCR accuracy
    text = pytesseract.image_to_string(img)
    return text


def extract_best_number(segment):
    """
    Given a text segment, extract the best numeric value:
    - If a RANGE like '20-50' or '100–340' is found → return midpoint
    - If a single number → return it
    - Filters out junk values (<=0 or >=9999)
    """
    # Look for ranges: 20-50, 100–340, 6.3—7.0
    range_match = re.search(r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)", segment)
    if range_match:
        lo, hi = float(range_match.group(1)), float(range_match.group(2))
        if 0 < lo < 9999 and 0 < hi < 9999 and hi > lo:
            return round((lo + hi) / 2, 2)  # midpoint of range

    # Otherwise grab first standalone number
    nums = re.findall(r"[-+]?\d*\.?\d+", segment)
    nums = [float(n) for n in nums if 0 < float(n) < 9999]
    return nums[0] if nums else None


def find_number_after(text, *patterns):
    """
    Try multiple regex patterns. For each match:
    1. Scan the same line → use extract_best_number (handles ranges)
    2. Then scan next 80 chars
    Returns best float found, or None.
    """
    for pattern in patterns:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            # Same-line scan
            line_start = text.rfind('\n', 0, m.start()) + 1
            line_end = text.find('\n', m.end())
            if line_end == -1:
                line_end = len(text)
            line = text[line_start:line_end]

            val = extract_best_number(line)
            if val:
                return val

            # Next-chars scan (crosses lines)
            rest = text[m.end():m.end() + 80]
            val = extract_best_number(rest)
            if val:
                return val
    return None


def parse_soil_values(text):
    """
    Comprehensive soil report parser covering:
    - Standard labels (Nitrogen, Phosphorus, Potassium)
    - Short labels (N, P, K)
    - Mehlich / Bray / Olsen methods
    - P2O5 / K2O form → auto-convert to elemental
    - Water pH, salt pH, buffer pH
    - OCR noise (extra spaces, broken chars)
    - lbs/A, ppm, mg/kg units (raw value passed through)
    """
    results = {}
    sources = {}

    # ── Nitrogen ─────────────────────────────────────────────
    n = find_number_after(text,
        r"nitrate[- ]?N",
        r"NO3[- ]?N",
        r"nitrogen[^\n]{0,10}\(N\)",
        r"\bnitrogen\b",
        r"\bN\s*[:\-\|]",
        r"organic\s*N",
        r"total\s*N",
    )
    results["N"] = n
    sources["N"] = "extracted" if n else None

    # ── Phosphorus ───────────────────────────────────────────
    p = find_number_after(text,
        r"phosphorus[^\n]{0,15}\(P\)",
        r"phosphorus[^\n]{0,15}mehlich",
        r"phosphorus[^\n]{0,15}bray",
        r"phosphorus[^\n]{0,15}olsen",
        r"\bphosphorus\b",
        r"\bP\s*[:\-\|]",
        r"avail\w*\s*P",
        r"P\s*ppm",
        r"P\s*lbs",
    )
    if p is None:
        # Try P2O5 → convert to elemental P
        p2o5 = find_number_after(text, r"P2O5", r"P2 ?O5", r"P₂O₅")
        if p2o5:
            p = round(p2o5 * 0.436, 2)
            sources["P"] = f"converted from P₂O₅ ({p2o5}) × 0.436"
    results["P"] = p
    if "P" not in sources:
        sources["P"] = "extracted" if p else None

    # ── Potassium ────────────────────────────────────────────
    k = find_number_after(text,
        r"potassium[^\n]{0,15}\(K\)",
        r"potassium[^\n]{0,15}mehlich",
        r"potassium[^\n]{0,15}bray",
        r"\bpotassium\b",
        r"\bK\s*[:\-\|]",
        r"avail\w*\s*K",
        r"K\s*ppm",
        r"K\s*lbs",
    )
    if k is None:
        k2o = find_number_after(text, r"K2O", r"K2 ?O", r"K₂O")
        if k2o:
            k = round(k2o * 0.830, 2)
            sources["K"] = f"converted from K₂O ({k2o}) × 0.830"
    results["K"] = k
    if "K" not in sources:
        sources["K"] = "extracted" if k else None

    # ── pH ────────────────────────────────────────────────────
    ph = find_number_after(text,
        r"pH\s*in\s*water",
        r"water\s*pH",
        r"pH[s₅e]?\s*\(salt",
        r"soil\s*pH",
        r"\bpH\b",
    )
    # Sanity: pH must be 2–14
    if ph and not (2.0 <= ph <= 14.0):
        ph = None
    # Fallback to buffer pH
    if ph is None:
        ph = find_number_after(text, r"buffer\s*pH", r"buf\w*\s*pH")
        if ph and not (2.0 <= ph <= 14.0):
            ph = None
        if ph:
            sources["ph"] = "extracted (buffer pH)"
    results["ph"] = ph
    if "ph" not in sources:
        sources["ph"] = "extracted" if ph else None

    # ── Temperature ───────────────────────────────────────────
    temp = find_number_after(text,
        r"temp(?:erature)?",
        r"°\s*[CF]",
        r"avg\s*temp",
    )
    if temp and not (0 <= temp <= 60):
        temp = None
    results["temperature"] = temp
    sources["temperature"] = "extracted" if temp else None

    # ── Humidity ──────────────────────────────────────────────
    hum = find_number_after(text,
        r"humid(?:ity)?",
        r"relative\s*humidity",
        r"RH\s*[:\-\|]",
    )
    if hum and not (0 <= hum <= 100):
        hum = None
    results["humidity"] = hum
    sources["humidity"] = "extracted" if hum else None

    # ── Rainfall ──────────────────────────────────────────────
    rain = find_number_after(text,
        r"rain(?:fall)?",
        r"precipitation",
        r"annual\s*rain",
        r"avg\s*rain",
    )
    results["rainfall"] = rain
    sources["rainfall"] = "extracted" if rain else None

    return results, sources


def apply_smart_defaults(parsed, sources):
    """
    Fill ALL missing values so prediction always runs.
    Strategy:
    - Temperature, humidity, rainfall → Indian regional averages
    - N → estimate from P (N:P ≈ 2:1) or safe default
    - P → estimate from K or safe default
    - K → estimate from P or safe default
    - pH → neutral (6.5) default
    """
    used_defaults = []

    # ── Temperature ──────────────────────────────────────────
    if parsed["temperature"] is None:
        parsed["temperature"] = 25.0
        used_defaults.append("Temperature → 25°C (India avg)")

    # ── Humidity ─────────────────────────────────────────────
    if parsed["humidity"] is None:
        parsed["humidity"] = 70.0
        used_defaults.append("Humidity → 70% (India avg)")

    # ── Rainfall ─────────────────────────────────────────────
    if parsed["rainfall"] is None:
        parsed["rainfall"] = 100.0
        used_defaults.append("Rainfall → 100mm (India avg)")

    # ── Nitrogen ─────────────────────────────────────────────
    if parsed["N"] is None:
        if parsed["P"] is not None:
            parsed["N"] = round(parsed["P"] * 2.0, 1)
            used_defaults.append(f"N → {parsed['N']} (estimated: P × 2)")
        else:
            parsed["N"] = 50.0
            used_defaults.append("N → 50 (safe default)")

    # ── Phosphorus ───────────────────────────────────────────
    if parsed["P"] is None:
        if parsed["K"] is not None:
            parsed["P"] = round(parsed["K"] * 0.4, 1)
            used_defaults.append(f"P → {parsed['P']} (estimated: K × 0.4)")
        elif parsed["N"] is not None:
            parsed["P"] = round(parsed["N"] * 0.5, 1)
            used_defaults.append(f"P → {parsed['P']} (estimated: N × 0.5)")
        else:
            parsed["P"] = 30.0
            used_defaults.append("P → 30 (safe default)")

    # ── Potassium ────────────────────────────────────────────
    if parsed["K"] is None:
        if parsed["P"] is not None:
            parsed["K"] = round(parsed["P"] * 2.5, 1)
            used_defaults.append(f"K → {parsed['K']} (estimated: P × 2.5)")
        else:
            parsed["K"] = 50.0
            used_defaults.append("K → 50 (safe default)")

    # ── pH ───────────────────────────────────────────────────
    if parsed["ph"] is None:
        parsed["ph"] = 6.5
        used_defaults.append("pH → 6.5 (neutral default)")

    return parsed, used_defaults


# ─── Routes ──────────────────────────────────────────────────

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        N = float(request.form["N"])
        P = float(request.form["P"])
        K = float(request.form["K"])
        temperature = float(request.form["temperature"])
        humidity = float(request.form["humidity"])
        ph = float(request.form["ph"])
        rainfall = float(request.form["rainfall"])

        sample = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
        #prediction = model.predict(sample)

        probs = model.predict_proba(sample)[0]
        # Get top 5 indices
        top_indices = np.argsort(probs)[-5:][::-1]
        # Convert to crop names
        top_crops = le.inverse_transform(top_indices)
        # Pair with probabilities

        results = [(crop, round(probs[i]*100, 2)) for crop, i in zip(top_crops, top_indices)]
        
        #crop = le.inverse_transform(prediction)
        return render_template("index.html", top_results=results)

    except Exception as e:
        return render_template("index.html", prediction="Error: " + str(e))


@app.route("/upload", methods=["POST"])
def upload():
    if "report" not in request.files:
        return render_template("index.html", upload_error="No file uploaded.")

    file = request.files["report"]
    if file.filename == "":
        return render_template("index.html", upload_error="No file selected.")
    if not allowed_file(file.filename):
        return render_template("index.html", upload_error="Invalid file. Use PNG, JPG, or PDF.")

    try:
        file_bytes = file.read()
        raw_text = extract_text_from_file(file_bytes, file.filename)

        parsed, sources = parse_soil_values(raw_text)
        parsed, used_defaults = apply_smart_defaults(parsed, sources)

        # Prediction always runs — no missing values possible after defaults
        sample = np.array([[
            parsed["N"], parsed["P"], parsed["K"],
            parsed["temperature"], parsed["humidity"],
            parsed["ph"], parsed["rainfall"]
        ]])
        
        probs = model.predict_proba(sample)[0]
        top_indices = np.argsort(probs)[-5:][::-1]
        top_crops = le.inverse_transform(top_indices)
        results = [(crop, round(probs[i]*100, 2)) for crop, i in zip(top_crops, top_indices)]

        



        return render_template("index.html",
            upload_results=results,
            extracted=parsed,
            sources=sources,
            used_defaults=used_defaults,
            raw_text=raw_text[:1200],
        )

    except Exception as e:
        return render_template("index.html", upload_error=f"Processing error: {str(e)}")


if __name__ == "__main__":
    app.run(debug=True)
