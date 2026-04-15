from flask_cors import CORS
from flask import Flask, request, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from models import db, User
from google import genai
import numpy as np
import joblib
import os
import fitz
import pytesseract
from PIL import Image
import io
import re

#genai.configure(api_key="AIzaSyAOLcvL7ZTC5e4hB2zAD1e2CUsrVRNOgB8")

client = genai.Client(api_key="AIzaSyAgAQMm36VUjgdQqixbzYUSnxjs1GMhjc8")

#model = genai.GenerativeModel("gemini-1.5-flash")

models = client.models.list()

for m in models:
    print(m.name)


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

app.secret_key = "dhara_secret_123"

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dhara.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

# ---------------- MODEL LOAD ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, "ml/xgboost_model.pkl"))
le = joblib.load(os.path.join(BASE_DIR, "ml/label_encoder.pkl"))

# ---------------- TESSERACT ----------------
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ---------------- HEALTH ----------------
@app.route("/")
def home():
    return jsonify({"status": "backend running"})

# ---------------- SAFE FLOAT ----------------
def safe_float(val, default=0):
    try:
        return float(val)
    except:
        return default

# ---------------- MODEL PREDICT ----------------
def predict_crop(N, P, K, ph, temperature, humidity, rainfall):
    try:
        features = np.array([[N, P, K, temperature, humidity, ph, rainfall]])

        probs = model.predict_proba(features)[0]
        top_indices = np.argsort(probs)[-4:][::-1]

        results = []
        for i in top_indices:
            results.append({
                "crop": str(le.inverse_transform([i])[0]), 
                "probability": float(round(float(probs[i]) * 100, 2))  
            })

        return results

    except Exception as e:
        print("Prediction error:", e)
        return []


# ---------------- MANUAL PREDICT ----------------
@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        print("Incoming data:", data)  

        N = safe_float(data.get("N"))
        P = safe_float(data.get("P"))
        K = safe_float(data.get("K"))
        ph = safe_float(data.get("ph"))
        temperature = safe_float(data.get("temperature"))
        humidity = safe_float(data.get("humidity"))
        rainfall = safe_float(data.get("rainfall"))

        results = predict_crop(N, P, K, ph, temperature, humidity, rainfall)

        return jsonify({"results": results})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 400

# ---------------- OCR PARSER ----------------
def parse_soil_report(text):
    t = text.lower()
    result = {}

    field_patterns = {
        'nitrogen':    [r'nitrogen\D{0,15}(\d+\.?\d*)', r'(?<![a-z])n\s*[:\-=]\s*(\d+\.?\d*)'],
        'phosphorus':  [r'phosphorus\D{0,15}(\d+\.?\d*)', r'(?<![a-z])p\s*[:\-=]\s*(\d+\.?\d*)'],
        'potassium':   [r'potassium\D{0,15}(\d+\.?\d*)', r'(?<![a-z])k\s*[:\-=]\s*(\d+\.?\d*)'],
        'ph':          [r'ph\s*[:\-=]?\s*(\d+\.?\d*)'],
        'temperature': [r'temp(?:erature)?\s*[:\-=]?\s*(\d+\.?\d*)'],
        'humidity':    [r'humidity\s*[:\-=]?\s*(\d+\.?\d*)'],
        'rainfall':    [r'rainfall\s*[:\-=]?\s*(\d+\.?\d*)'],
    }

    for key, pats in field_patterns.items():
        for pat in pats:
            m = re.search(pat, t)
            if m:
                try:
                    result[key] = float(m.group(1))
                except:
                    pass
                break

    return result

# ---------------- OCR + PREDICT ----------------
@app.route('/api/ocr-scan', methods=['POST'])
def ocr_scan():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400

    file = request.files['file']
    filename = (file.filename or '').lower()

    try:
        text = ""

        if filename.endswith('.pdf'):
            pdf_bytes = file.read()
            doc = fitz.open(stream=pdf_bytes, filetype='pdf')

            for page in doc:
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                text += pytesseract.image_to_string(img)

        else:
            img = Image.open(file.stream)
            text = pytesseract.image_to_string(img)

        extracted = parse_soil_report(text)

        # ✅ DEFAULTS (IMPORTANT)
        N = extracted.get("nitrogen") or 50
        P = extracted.get("phosphorus") or 30
        K = extracted.get("potassium") or 50
        ph = extracted.get("ph") or 6.5
        temperature = extracted.get("temperature") or 25
        humidity = extracted.get("humidity") or 70
        rainfall = extracted.get("rainfall") or 100

        results = predict_crop(N, P, K, ph, temperature, humidity, rainfall)

        print("Processed values:", N, P, K, ph, temperature, humidity, rainfall)


        return jsonify({
            'success': True,
            'extracted': extracted,
            'results': results   
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ---------------- CHAT ----------------


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_message = data.get("message", "")

        prompt = f"""
        You are an AI assistant for farmers.
        Help with crops, soil, fertilizers, weather, and farming advice.

        User: {user_message}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return jsonify({
            "reply": response.text
        })

    except Exception as e:
        print("Gemini ERROR:", e)   # 🔥 IMPORTANT
        return jsonify({
            "reply": "Error: " + str(e)
        })



# ---------------- LOGIN (simple API version) ----------------
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    

    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        session['user_id'] = user.id
        session['email'] = user.email

        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        })

    return jsonify({"success": False, "error": "Invalid credentials"}), 401

# ---------------- REGISTER ----------------
@app.route("/api/register", methods=["POST"])
def register():
    data = request.json

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"success": False, "error": "Email exists"}), 409

    user = User(
        name=data["name"],
        email=data["email"]
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return jsonify({"success": True})

# ---------------- STATS ----------------
@app.route("/api/stats")
def stats():
    user_count = User.query.count()
    return jsonify({
        "total": user_count,
        "crop": 0,
        "disease": 0,
        "fertilizer": 0
    })


# ---------------- USER ----------------
@app.route("/api/user")
def user():
    if "user_id" not in session:
        return jsonify({"authenticated": False})

    u = User.query.get(session["user_id"])
    return jsonify({
        "authenticated": True,
        "email": u.email,
        "name": u.name
    })


# ---------------- PROFILE ----------------
@app.route('/api/profile', methods=['GET'])
def get_profile():
    if 'user_id' not in session:
        return jsonify({'authenticated': False}), 401
    u = User.query.get(session['user_id'])
    return jsonify({
        'name': u.name or '',
        'email': u.email,
        'location': u.location or '',
        'land_size': u.land_size or ''
    })


@app.route('/api/profile', methods=['PUT'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    u = User.query.get(session['user_id'])
    data = request.get_json()
    if 'name' in data:
        u.name = data['name']
    if 'location' in data:
        u.location = data['location']
    if 'land_size' in data:
        u.land_size = data['land_size']
    db.session.commit()
    return jsonify({'success': True})


# ---------------- LOGOUT ----------------
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})


if __name__ == "__main__":
    app.run(debug=True, port=5000)