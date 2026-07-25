"""
DharaAI — Flask Backend
========================
Features:
  - /api/predict         Manual crop prediction (returns top-4 + insights)
  - /api/ocr-scan        OCR → real SHC field extraction + Open-Meteo climate
  - /api/chat            Gemini AI farming assistant
  - /api/history         Per-user prediction history (last 20)
  - /api/export-history  Download history as CSV
  - /api/stats           Dashboard statistics
  - Auth: register / login / logout / user / profile
"""

from flask import Flask, request, session, jsonify, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from models import db, User, PredictionHistory
from google import genai
import numpy as np
import joblib
import os
import re
import io
import csv
import json
import datetime
import requests

# ── optional OCR deps ────────────────────────────────────────────────────────
try:
    import fitz          # PyMuPDF
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# ── Gemini client ────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAgAQMm36VUjgdQqixbzYUSnxjs1GMhjc8")
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# ── App setup ────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)
app.secret_key = os.getenv("SECRET_KEY", "dhara_secret_123")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///dhara.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

with app.app_context():
    db.create_all()

# ── Tesseract path (Windows) ─────────────────────────────────────────────────
if OCR_AVAILABLE:
    TESSERACT_WIN = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(TESSERACT_WIN):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_WIN

# ── Load ML model ────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ml_model = joblib.load(os.path.join(BASE_DIR, "xgboost_model.pkl"))
le       = joblib.load(os.path.join(BASE_DIR, "label_encoder.pkl"))


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def safe_float(val, default=0.0):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


# ── OCR: real Soil Health Card field extraction ──────────────────────────────
def parse_soil_report(text: str) -> dict:
    """
    Robust extraction of Soil Health Card / soil test report parameters.

    Bugs fixed vs previous version:
      1. \\D{0,20} was too greedy — matched 'Mehlich 3' and returned '3' instead
         of the actual phosphorus value.  Now uses tighter non-digit lookaheads.
      2. Single-letter patterns (p:, k:) caused false positives; removed them.
      3. Range values ("6.3-7.0") were parsed as the actual pH. Added negative
         lookahead (?!\\s*[-]\\d) to skip desirable-range rows.
      4. OCR commonly drops decimal points: "6.3" → "63", "7.0" → "70".
         Post-processing sanity-checks pH (if >14 divide by 10).
      5. "Organic Matter" (OM) is NOT the same as Organic Carbon (OC).
         OC = OM / 1.724  — conversion applied automatically.
      6. O.C. abbreviation pattern escaped correctly.
      7. 'sulphur' pattern was matching random 's' tokens — tightened.
      8. Micronutrient abbreviations (Fe, Mn, Cu, Zn) had no word-boundary
         guards — now wrapped with \\b.

    Supported formats:
      - Indian Soil Health Card (English)
      - US extension service reports (lbs/A, Mehlich 3)
      - Lab printouts with ppm, kg/ha, meq/100g
    """
    t = text.lower()

    # ── Ordered pattern lists (first match wins) ─────────────────────────────
    # CRITICAL: patterns with negative lookahead (?!\\s*[-]\\d) skip range rows
    # like "pH  6.3-7.0" so we don't accidentally read the desirable range.
    PATTERNS = {
        # ── Macronutrients ────────────────────────────────────────────────────
        "nitrogen": [
            r"avail(?:able|\.)\s*n(?:itrogen)?\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"n\s*\(kg/ha\)\s*(\d+\.?\d*)",
            r"nitrogen\s*[^\n\d]{0,20}(\d+\.?\d*)(?!\s*[-]\d)",
            r"(?:^|\s)n\s+(\d{2,4}\.?\d*)(?:\s|$)",
        ],
        "phosphorus": [
            # Handles: "Phosphorus (P)   21 lbs/A"
            # Handles: "Phosphorus ( P )   21 lbs/A"  ← inner-space variant, was broken before
            # Handles: "Phosphorus (P) Mehlich 3   48 ppm"
            r"phosphorus\s*\(?\s*p\s*\)?\s*(?:mehlich\s*\d)?\s*[^\d\n]{0,3}(\d+\.?\d*)(?!\s*[-]\d)",
            r"avail(?:able|\.)\s*p(?:hosphorus)?\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"\bp\s*\(kg/ha\)\s*(\d+\.?\d*)",
            r"(?:^|\s)p\s+(\d+\.?\d*)(?:\s|$)",
        ],
        "potassium": [
            # "Potassium ( K )   239 lbs/A"  ← inner-space variant, was broken before
            r"potassium\s*\(?\s*k\s*\)?\s*(?:mehlich\s*\d)?\s*[^\d\n]{0,3}(\d+\.?\d*)(?!\s*[-]\d)",
            r"avail(?:able|\.)\s*k(?:potassium)?\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"k2o\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"\bk\s*\(kg/ha\)\s*(\d+\.?\d*)",
        ],

        # ── pH ────────────────────────────────────────────────────────────────
        # Pattern priority: "pH in water" > "soil pH" > "pH (salt/water)" > decimal > integer
        #
        # Key fixes:
        #   • (?![-\d]) after the number blocks range rows like "pH  6.3-7.0"
        #     (the '-' immediately follows the digit — no space)
        #   • Separate decimal vs integer patterns handle OCR decimal-drop:
        #     OCR reads "6.3" as "63" → integer pattern catches it → /10 fix applied
        #   • "buffer pH" rows are skipped because they follow "buffer" not word-boundary ph
        "ph": [
            r"phs?\s*\((?:salt|water|h2o)?[^)]*\)\s*(\d+\.?\d*)",
            r"ph\s+in\s+water\s*[:\-]?\s*(\d+\.?\d*)(?![\-\d])",
            r"ph\s*\((?:salt|water|h2o)[^)]*\)\s*[:\-]?\s*(\d+\.?\d*)(?![\-\d])",
            r"soil\s+ph\s*[:\-]?\s*(\d+\.?\d*)(?![\-\d])",
            r"soil\s+reaction\s*[:\-]?\s*(\d+\.?\d*)(?![\-\d])",
            r"\bph\b\s*[:\-]?\s*(\d+\.\d+)(?![\-\d])",   # decimal present — skip ranges
            r"\bph\b\s*[:\-]?\s*(\d+)(?![\-\d.])",        # integer only (OCR dropped decimal)
        ],

        # ── EC ────────────────────────────────────────────────────────────────
        "ec": [
            r"electrical\s+conductivity\s*[:\-]?\s*(\d+\.?\d*)",
            r"\be\.?c\.?\b\s*[:\-]?\s*(\d+\.?\d*)",
        ],

        # ── Organic Carbon / Organic Matter ───────────────────────────────────
        # NOTE: OC matched first; if "organic matter" hits, flag for OM→OC conv.
        "oc": [
            r"organic\s+carbon\s*[:\-]?\s*(\d+\.?\d*)",
            r"\bo\.?\s*c\.?\b\s*[:\-]?\s*(\d+\.?\d*)",    # O.C. / OC
            r"organic\s+matter\s*[:\-]?\s*(\d+\.?\d*)",   # OM → converted below
        ],

        # ── Secondary / Micronutrients ────────────────────────────────────────
        "sulphur": [
            r"sul[fp]h?ur\s*(?:\(so4[^)]*\))?\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"\bsulphur\b[^\d]{0,10}(\d+\.?\d*)",
            r"\bso4\b[^\d]{0,10}(\d+\.?\d*)",
        ],
        "zinc": [
            r"zinc\s*(?:\(zn\))?\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"\bzn\b\s*[:\-]?\s*(\d+\.?\d*)",
        ],
        "iron": [
            r"iron\s*(?:\(fe\))?\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"\bfe\b\s*[:\-]?\s*(\d+\.?\d*)",
        ],
        "manganese": [
            r"manganese\s*(?:\(mn\))?\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"\bmn\b\s*[:\-]?\s*(\d+\.?\d*)",
        ],
        "copper": [
            r"copper\s*(?:\(cu\))?\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"\bcu\b\s*[:\-]?\s*(\d+\.?\d*)",
        ],
        "boron": [
            r"boron\s*(?:\(b\))?\s*[:\-]?\s*(\d+\.?\d*)(?!\s*[-]\d)",
            r"\bb\s*[:\-]\s*(\d+\.?\d*)",
        ],
    }

    extracted   = {}
    om_detected = False   # track if we matched "organic matter" (not OC directly)

    for field, pats in PATTERNS.items():
        for pat in pats:
            m = re.search(pat, t, re.MULTILINE)
            if m:
                try:
                    val = float(m.group(1))
                except (ValueError, IndexError):
                    continue

                # ── Sanity fixes ──────────────────────────────────────────────

                # pH: OCR drops decimal → "6.3" becomes "63", "7.0" becomes "70"
                if field == "ph" and val > 14:
                    val = round(val / 10, 1)

                # pH: must be in valid range 0–14 after fix
                if field == "ph" and not (0 < val < 14):
                    continue

                # Organic Matter → Organic Carbon: OC = OM / 1.724
                if field == "oc" and "matter" in pat:
                    val = round(val / 1.724, 3)
                    om_detected = True

                # Skip zero values (OCR read a blank field)
                if val == 0:
                    continue

                extracted[field] = val
                break   # first matching pattern wins

    return extracted


# ── Fallback extraction: Gemini fills gaps the regex patterns miss ──────────
# The regex parser above is tuned for the standard Indian SHC layout and a
# few common lab-report variants. Real-world reports (random formats, odd
# abbreviations, table layouts OCR mangles) will still slip past it. Rather
# than writing an endless list of new regex patterns per format, we send the
# raw OCR text to Gemini as a fallback and let it do the flexible field
# matching — it generalizes across label wording far better than regex.
SOIL_FIELD_KEYS = [
    "nitrogen", "phosphorus", "potassium", "ph", "ec", "oc",
    "sulphur", "zinc", "iron", "manganese", "copper", "boron",
]


def gemini_extract_fields(raw_text: str) -> dict:
    """
    Ask Gemini to extract whatever soil parameters it can find in raw_text.
    Only called when regex extraction found too few fields. Returns a dict
    of {field: float} for fields Gemini was confident it found — anything
    it couldn't find is simply absent from the returned dict (never guessed).
    """
    if not raw_text.strip():
        return {}

    prompt = f"""You are extracting soil test values from OCR'd text of a soil
health report. The report format is unknown and may use any wording, table
layout, or units (kg/ha, ppm, mg/kg, meq/100g, lbs/A, etc).

Return ONLY a raw JSON object (no markdown fences, no explanation) with
exactly these keys: {', '.join(SOIL_FIELD_KEYS)}

Rules:
- Value = the plain number only, with units stripped (e.g. "45.2", not "45.2 kg/ha")
- If a parameter genuinely is not present in the text, use null for that key
- Never guess or estimate a value that isn't actually stated in the text
- If a row shows a range (e.g. "6.3-7.0") rather than a measured value, use null

OCR text:
---
{raw_text[:3000]}
---"""

    try:
        resp = gemini_client.models.generate_content(
            model="gemini-2.5-flash", contents=prompt
        )
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", resp.text.strip(), flags=re.MULTILINE)
        data = json.loads(cleaned)
        out = {}
        for k in SOIL_FIELD_KEYS:
            v = data.get(k)
            if v is not None:
                try:
                    out[k] = float(v)
                except (TypeError, ValueError):
                    pass
        return out
    except Exception as e:
        print("Gemini extraction fallback failed:", e)
        return {}


# ── Weather: Open-Meteo (free, no API key) ───────────────────────────────────
def geocode_location(location: str):
    """Return (lat, lon) for a location string using Open-Meteo geocoding."""
    try:
        r = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": location, "count": 1, "language": "en", "format": "json"},
            timeout=5
        )
        data = r.json()
        if data.get("results"):
            res = data["results"][0]
            return res["latitude"], res["longitude"]
    except Exception:
        pass
    return None, None


def fetch_climate_data(location: str) -> dict:
    """
    Fetch 30-day average temperature & humidity and 365-day rainfall total
    from Open-Meteo historical archive for a given location string.
    Falls back to neutral defaults if unavailable.
    """
    defaults = {"temperature": 25.0, "humidity": 70.0, "rainfall": 100.0,
                "location_used": None}

    if not location:
        return defaults

    lat, lon = geocode_location(location)
    if lat is None:
        return defaults

    try:
        end   = datetime.date.today()
        start = end - datetime.timedelta(days=365)

        r = requests.get(
            "https://archive-api.open-meteo.com/v1/archive",
            params={
                "latitude":  lat,
                "longitude": lon,
                "start_date": str(start),
                "end_date":   str(end),
                "daily": "temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum",
                "timezone": "auto",
            },
            timeout=8
        )
        body = r.json()

        # Open-Meteo returns HTTP 400 + {"error": true, "reason": "..."} on a
        # bad param instead of raising - surface that instead of silently
        # falling back to defaults, so a real API issue is visible in logs.
        if body.get("error"):
            print(f"[Climate] Open-Meteo error: {body.get('reason')}")
            return defaults

        d = body.get("daily", {})

        temps     = [x for x in (d.get("temperature_2m_mean") or []) if x is not None]
        hums      = [x for x in (d.get("relative_humidity_2m_mean") or []) if x is not None]
        rains     = [x for x in (d.get("precipitation_sum") or []) if x is not None]

        # Use last 30 days for temp/humidity, full year for rainfall
        return {
            "temperature":    round(float(np.mean(temps[-30:])), 2) if temps else 25.0,
            "humidity":       round(float(np.mean(hums[-30:])),  2) if hums  else 70.0,
            "rainfall":       round(float(np.sum(rains)),         2) if rains else 100.0,
            "location_used":  location,
        }
    except Exception as e:
        print(f"[Climate] fetch_climate_data failed: {e}")
        return defaults


# ── ML Prediction ────────────────────────────────────────────────────────────
def predict_crop(N, P, K, ph, temperature, humidity, rainfall, top_n=4):
    """Run XGBoost and return top-N crops with probabilities."""
    try:
        features = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
        probs    = ml_model.predict_proba(features)[0]
        top_idx  = np.argsort(probs)[-top_n:][::-1]
        return [
            {"crop": str(le.inverse_transform([i])[0]),
             "probability": round(float(probs[i]) * 100, 2)}
            for i in top_idx
        ]
    except Exception as e:
        print("Prediction error:", e)
        return []


# ── Soil Insights Engine (ICAR / SHC reference bands) ───────────────────────
INSIGHT_RULES = [
    # (parameter, low_thresh, high_thresh, unit, low_msg, ok_msg, high_msg)
    ("ph", 6.0, 7.5, "",
     "Soil is acidic (pH {v:.1f}). Consider adding agricultural lime (calcium carbonate) to raise pH before sowing.",
     "Soil pH ({v:.1f}) is in the ideal range (6.0–7.5) for most crops.",
     "Soil is alkaline (pH {v:.1f}). Apply gypsum or elemental sulphur to lower pH gradually."),

    ("ec", None, 2.0, "dS/m",
     None,
     "EC ({v:.2f} dS/m) — soil salinity is within safe limits.",
     "High EC ({v:.2f} dS/m) indicates salt stress risk. Flush soil with irrigation water and add organic matter."),

    ("oc", 0.5, 0.75, "%",
     "Organic Carbon is very low ({v:.2f}%). Add FYM, vermicompost, or green manure crops to improve soil health.",
     "Organic Carbon ({v:.2f}%) is in the medium range — maintain with periodic compost applications.",
     "Organic Carbon is high ({v:.2f}%) — excellent soil fertility base."),

    ("nitrogen", 280, 560, "kg/ha",
     "Available Nitrogen is low ({v:.0f} kg/ha). Apply basal dose of urea or DAP before transplanting.",
     "Available Nitrogen ({v:.0f} kg/ha) is adequate.",
     "High Nitrogen ({v:.0f} kg/ha) — reduce N-fertiliser dose; excess N causes lodging and pest susceptibility."),

    ("phosphorus", 10, 25, "kg/ha",
     "Available Phosphorus is low ({v:.1f} kg/ha). Apply SSP or DAP as basal fertiliser.",
     "Available Phosphorus ({v:.1f} kg/ha) is adequate.",
     "High Phosphorus ({v:.1f} kg/ha) — skip P-fertiliser this season."),

    ("potassium", 108, 280, "kg/ha",
     "Available Potassium is low ({v:.0f} kg/ha). Apply MOP (muriate of potash).",
     "Available Potassium ({v:.0f} kg/ha) is adequate.",
     "High Potassium ({v:.0f} kg/ha) — no K-fertiliser needed."),

    ("sulphur", None, 10.0, "ppm",
     None,
     "Sulphur ({v:.1f} ppm) is sufficient.",
     None),

    ("zinc", None, 0.6, "ppm",
     "Zinc deficient ({v:.2f} ppm). Apply zinc sulphate @ 25 kg/ha as basal dose.",
     "Zinc ({v:.2f} ppm) is adequate.",
     None),

    ("iron", None, 4.5, "ppm",
     "Iron deficient ({v:.2f} ppm). Foliar spray of ferrous sulphate (0.5%) recommended.",
     "Iron ({v:.2f} ppm) is sufficient.",
     None),

    ("manganese", None, 2.0, "ppm",
     "Manganese deficient ({v:.2f} ppm). Apply manganese sulphate as foliar spray.",
     "Manganese ({v:.2f} ppm) is sufficient.",
     None),

    ("copper", None, 0.2, "ppm",
     "Copper deficient ({v:.2f} ppm). Apply copper sulphate @ 5 kg/ha.",
     "Copper ({v:.2f} ppm) is adequate.",
     None),

    ("boron", None, 0.5, "ppm",
     "Boron deficient ({v:.2f} ppm). Apply borax @ 10 kg/ha or foliar spray (0.2% boric acid).",
     "Boron ({v:.2f} ppm) is adequate.",
     None),
]

NUTRIENT_STATUS = {
    "nitrogen":   [(0, 280, "Low"), (280, 560, "Medium"), (560, 9999, "High")],
    "phosphorus": [(0, 10,  "Low"), (10,  25,  "Medium"), (25,  9999, "High")],
    "potassium":  [(0, 108, "Low"), (108, 280, "Medium"), (280, 9999, "High")],
    "ph":         [(0, 6.0, "Acidic"), (6.0, 7.5, "Optimal"), (7.5, 14, "Alkaline")],
    "ec":         [(0, 1.0, "Safe"), (1.0, 2.0, "Marginal"), (2.0, 99, "Saline")],
    "oc":         [(0, 0.5, "Low"), (0.5, 0.75, "Medium"), (0.75, 99, "High")],
}


def classify_status(param, value):
    bands = NUTRIENT_STATUS.get(param)
    if bands:
        for lo, hi, label in bands:
            if lo <= value < hi:
                return label
        return bands[-1][2]
    return "Available" if value >= 0.5 else "Deficient"


def generate_soil_insights(extracted: dict) -> list:
    """
    Given extracted SHC values, return a list of dicts:
      { parameter, value, unit, status, advice }
    Only parameters that were actually extracted are returned.
    """
    insights = []
    for rule in INSIGHT_RULES:
        param, low_thresh, high_thresh, unit, low_msg, ok_msg, high_msg = rule
        v = extracted.get(param)
        if v is None:
            continue

        status = classify_status(param, v)

        # Choose advice message
        if low_thresh is not None and v < low_thresh:
            advice = (low_msg or ok_msg).format(v=v)
            severity = "warning"
        elif high_thresh is not None and v >= high_thresh:
            advice = (high_msg or ok_msg).format(v=v)
            severity = "warning" if high_msg else "good"
        else:
            advice = ok_msg.format(v=v)
            severity = "good"

        insights.append({
            "parameter": param.capitalize(),
            "value":     round(v, 3),
            "unit":      unit,
            "status":    status,
            "advice":    advice,
            "severity":  severity,   # "good" | "warning"
        })

    return insights


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/")
def health():
    return jsonify({"status": "DharaAI backend running"})


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"success": False, "error": "Email required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "Email already registered"}), 409
    u = User(name=data.get("name", ""), email=email)
    u.set_password(data.get("password", ""))
    db.session.add(u)
    db.session.commit()
    return jsonify({"success": True})


@app.route("/api/login", methods=["POST"])
def login():
    data  = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    pwd   = (data.get("password") or "").strip()
    user  = User.query.filter_by(email=email).first()
    if not user or not user.check_password(pwd):
        return jsonify({"success": False, "error": "Invalid credentials"}), 401
    session["user_id"] = user.id
    session["email"]   = user.email
    return jsonify({"success": True, "user": {"id": user.id, "email": user.email, "name": user.name}})


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/api/user")
def current_user():
    if "user_id" not in session:
        return jsonify({"authenticated": False})
    u = User.query.get(session["user_id"])
    if not u:
        return jsonify({"authenticated": False})
    return jsonify({"authenticated": True, "email": u.email, "name": u.name or ""})


@app.route("/api/profile", methods=["GET"])
def get_profile():
    if "user_id" not in session:
        return jsonify({"authenticated": False}), 401
    u = User.query.get(session["user_id"])
    return jsonify({"name": u.name or "", "email": u.email,
                    "location": u.location or "", "land_size": u.land_size or ""})


@app.route("/api/profile", methods=["PUT"])
def update_profile():
    if "user_id" not in session:
        return jsonify({"success": False, "error": "Not authenticated"}), 401
    u    = User.query.get(session["user_id"])
    data = request.get_json() or {}
    for field in ("name", "location", "land_size"):
        if field in data:
            setattr(u, field, data[field])
    db.session.commit()
    return jsonify({"success": True})


# ═══════════════════════════════════════════════════════════════════════════════
# PREDICTION ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Manual prediction.
    Accepts JSON with N, P, K, ph, temperature, humidity, rainfall.
    If temperature/humidity/rainfall are absent, fetches from Open-Meteo
    using the logged-in user's saved location.
    Returns: results, insights, climate (if fetched).
    """
    try:
        data = request.get_json() or {}

        N  = safe_float(data.get("N"))
        P  = safe_float(data.get("P"))
        K  = safe_float(data.get("K"))
        ph = safe_float(data.get("ph"), default=6.5)

        # Climate: use provided values or auto-fetch from Open-Meteo
        # Session user's saved location always takes priority over anything
        # the frontend might send, since the manual form has no location field.
        temp_provided   = data.get("temperature") is not None
        climate_fetched = None
        if temp_provided:
            temperature = safe_float(data.get("temperature"), 25.0)
            humidity    = safe_float(data.get("humidity"),    70.0)
            rainfall    = safe_float(data.get("rainfall"),   100.0)
        else:
            # Always read from user profile first
            location = ""
            if "user_id" in session:
                u = User.query.get(session["user_id"])
                if u:
                    location = (u.location or "").strip()
            # Allow fallback from request body if profile has no location
            if not location:
                location = (data.get("location") or "").strip()
            climate = fetch_climate_data(location)
            temperature     = climate["temperature"]
            humidity        = climate["humidity"]
            rainfall        = climate["rainfall"]
            climate_fetched = climate
            print(f"[Predict] Location: '{location}' → temp={temperature}, hum={humidity}, rain={rainfall}")

        results  = predict_crop(N, P, K, ph, temperature, humidity, rainfall)

        # Build minimal extracted dict for insight engine (manual entry)
        extracted_for_insights = {"nitrogen": N, "phosphorus": P, "potassium": K, "ph": ph}
        insights = generate_soil_insights(extracted_for_insights)

        # Save to history
        if "user_id" in session and results:
            h = PredictionHistory(
                user_id    = session["user_id"],
                source     = "manual",
                n=N, p=P, k=K, ph=ph,
                temperature=temperature, humidity=humidity, rainfall=rainfall,
                top_crop   = results[0]["crop"],
                top_prob   = results[0]["probability"],
            )
            db.session.add(h)
            db.session.commit()

        response = {"results": results, "insights": insights}
        if climate_fetched:
            response["climate"] = climate_fetched
        return jsonify(response)

    except Exception as e:
        print("Predict error:", e)
        return jsonify({"error": str(e)}), 400


@app.route("/api/ocr-scan", methods=["POST"])
def ocr_scan():
    """
    OCR pipeline:
      1. Extract text from uploaded PDF/image (Tesseract / PyMuPDF)
      2. Parse real SHC fields (N, P, K, pH, EC, OC, Zn, Fe, Mn, Cu, B, S)
      3. Fetch climate (temp/humidity/rainfall) from Open-Meteo using user location
      4. Run XGBoost prediction
      5. Generate soil insights
    """
    if not OCR_AVAILABLE:
        return jsonify({"success": False,
                        "error": "OCR libraries not installed (pytesseract, PyMuPDF, Pillow)"}), 500

    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file provided"}), 400

    file     = request.files["file"]
    filename = (file.filename or "").lower()

    try:
        # ── Step 1: Extract text ──────────────────────────────────────────────
        raw_text = ""
        if filename.endswith(".pdf"):
            pdf_bytes = file.read()
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                # Try native text first; fall back to OCR
                page_text = page.get_text("text")
                if page_text.strip():
                    raw_text += page_text
                else:
                    # 300 DPI + grayscale is the standard Tesseract accuracy
                    # sweet spot (higher than the default 72 DPI render).
                    pix = page.get_pixmap(dpi=300)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples).convert("L")
                    raw_text += pytesseract.image_to_string(img, config="--oem 3 --psm 6")
        else:
            img      = Image.open(file.stream).convert("L")
            raw_text = pytesseract.image_to_string(img, config="--oem 3 --psm 6")

        # ── Step 2: Parse SHC fields ─────────────────────────────────────────
        extracted = parse_soil_report(raw_text)

        # Fallback: a REQUIRED field is missing — let Gemini try the full text.
        # Previously this only fired when len(extracted) < 4 total fields, which
        # could skip Gemini even when nitrogen (a field the model needs) was
        # still missing, as long as 4 *other* fields (e.g. P, K, ph, zinc) had
        # matched. The prediction model specifically needs N/P/K/ph, so check
        # those directly. Gemini only fills keys regex missed; anything regex
        # already found wins, since the regex patterns include OCR-decimal-drop
        # and unit sanity checks that a general-purpose LLM extraction won't
        # reliably apply.
        REQUIRED_CORE_FIELDS = ["nitrogen", "phosphorus", "potassium", "ph"]
        gemini_filled = []
        if any(f not in extracted for f in REQUIRED_CORE_FIELDS):
            gemini_fields = gemini_extract_fields(raw_text)
            for k, v in gemini_fields.items():
                if k not in extracted:
                    extracted[k] = v
                    gemini_filled.append(k)
            if gemini_filled:
                print(f"[OCR] Gemini fallback filled: {gemini_filled}")

        # ── Step 3: Fetch climate from Open-Meteo ────────────────────────────
        # Priority: session user's saved location (most reliable).
        # The frontend FormData only contains the file — it never sends a
        # location field — so request.form.get("location") is always empty.
        # We therefore always read from the logged-in user's profile first.
        location = ""
        if "user_id" in session:
            u = User.query.get(session["user_id"])
            if u:
                location = (u.location or "").strip()

        # Fallback: allow an optional JSON body with location key
        if not location:
            location = (request.form.get("location") or "").strip()

        climate = fetch_climate_data(location)
        print(f"[OCR] Location used for climate: '{location}' → {climate}")

        # ── Step 4: Build model inputs ───────────────────────────────────────
        N           = extracted.get("nitrogen")   or 50.0
        P           = extracted.get("phosphorus") or 30.0
        K           = extracted.get("potassium")  or 50.0
        ph          = extracted.get("ph")         or 6.5
        temperature = climate["temperature"]
        humidity    = climate["humidity"]
        rainfall    = climate["rainfall"]

        used_defaults = [
            k for k, src in [
                ("nitrogen",   extracted.get("nitrogen")),
                ("phosphorus", extracted.get("phosphorus")),
                ("potassium",  extracted.get("potassium")),
                ("ph",         extracted.get("ph")),
            ] if src is None
        ]

        results  = predict_crop(N, P, K, ph, temperature, humidity, rainfall)
        insights = generate_soil_insights(extracted)

        # ── Step 5: Save to history ──────────────────────────────────────────
        if "user_id" in session and results:
            h = PredictionHistory(
                user_id    = session["user_id"],
                source     = "ocr",
                n=N, p=P, k=K, ph=ph,
                temperature=temperature, humidity=humidity, rainfall=rainfall,
                top_crop   = results[0]["crop"],
                top_prob   = results[0]["probability"],
            )
            db.session.add(h)
            db.session.commit()

        return jsonify({
            "success":      True,
            "extracted":    extracted,
            "used_defaults": used_defaults,
            "gemini_filled": gemini_filled,   # fields the regex missed but Gemini found
            "climate":      climate,
            "results":      results,
            "insights":     insights,
            "raw_text":     raw_text[:1500],  # first 1500 chars for debug
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
# HISTORY ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/history", methods=["GET"])
def get_history():
    if "user_id" not in session:
        return jsonify({"authenticated": False}), 401
    records = (PredictionHistory.query
               .filter_by(user_id=session["user_id"])
               .order_by(PredictionHistory.timestamp.desc())
               .limit(20).all())
    return jsonify([r.to_dict() for r in records])


@app.route("/api/export-history", methods=["GET"])
def export_history():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    records = (PredictionHistory.query
               .filter_by(user_id=session["user_id"])
               .order_by(PredictionHistory.timestamp.desc()).all())

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "timestamp", "source", "N", "P", "K", "ph",
        "temperature", "humidity", "rainfall", "top_crop", "top_prob"
    ])
    writer.writeheader()
    for r in records:
        d = r.to_dict()
        writer.writerow(d)

    csv_data = output.getvalue()
    output.close()

    response = make_response(csv_data)
    response.headers["Content-Disposition"] = "attachment; filename=dhara_history.csv"
    response.headers["Content-Type"] = "text/csv"
    return response


# ═══════════════════════════════════════════════════════════════════════════════
# STATS
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/stats")
def stats():
    total = PredictionHistory.query.count()
    crop  = PredictionHistory.query.filter_by(source="manual").count()
    ocr   = PredictionHistory.query.filter_by(source="ocr").count()
    users = User.query.count()
    return jsonify({"total": total, "crop": crop, "disease": 0,
                    "fertilizer": 0, "ocr": ocr, "users": users})


# ═══════════════════════════════════════════════════════════════════════════════
# CHAT (Gemini)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        msg = (request.get_json() or {}).get("message", "")
        prompt = (
            "You are DHARA, an expert AI assistant for Indian farmers. "
            "Answer questions about crops, soil health, fertilizers, pests, "
            "irrigation, and sustainable farming. Be concise and practical. "
            "When relevant, refer to ICAR/SHC recommendations.\n\n"
            f"User: {msg}"
        )
        resp = gemini_client.models.generate_content(
            model="gemini-2.5-flash", contents=prompt
        )
        return jsonify({"reply": resp.text})
    except Exception as e:
        print("Gemini error:", e)
        return jsonify({"reply": f"Sorry, the assistant is temporarily unavailable. ({e})"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)