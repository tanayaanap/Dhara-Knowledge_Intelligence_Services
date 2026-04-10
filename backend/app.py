from flask_cors import CORS
from flask import Flask, request, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from models import db, User
from chatbot import get_response
import numpy as np
import joblib
import os


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

# ---------------- CORS FIX (IMPORTANT FOR REACT) ----------------
CORS(app, supports_credentials=True)

# ---------------- HEALTH CHECK ----------------
@app.route("/")
def home():
    return jsonify({"status": "backend running"})

# ---------------- CROP PREDICT ----------------
@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        sample = np.array([[
            float(data["N"]),
            float(data["P"]),
            float(data["K"]),
            float(data["temperature"]),
            float(data["humidity"]),
            float(data["ph"]),
            float(data["rainfall"])
        ]])

        probs = model.predict_proba(sample)[0]
        top_indices = np.argsort(probs)[-5:][::-1]
        top_crops = le.inverse_transform(top_indices)

        results = [
            {"crop": str(crop), "probability": round(probs[i] * 100, 2)}
            for crop, i in zip(top_crops, top_indices)
        ]

        return jsonify({"success": True, "results": results})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# ---------------- CHAT ----------------
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    msg = data.get("message", "")
    reply = get_response(msg)
    return jsonify({"reply": reply})

# ---------------- LOGIN (simple API version) ----------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        session["user_id"] = user.id
        return jsonify({"success": True, "user": user.email})

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

# ---------------- USER ----------------
@app.route("/api/user")
def user():
    if "user_id" not in session:
        return jsonify({"authenticated": False})

    u = User.query.get(session["user_id"])
    return jsonify({"authenticated": True, "email": u.email})


if __name__ == "__main__":
    app.run(debug=True, port=5000)