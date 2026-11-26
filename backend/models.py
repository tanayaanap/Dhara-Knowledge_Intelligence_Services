"""
DharaAI — SQLAlchemy Models
"""
import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "user"

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), default="")
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200))
    location      = db.Column(db.String(150), default="")   # used for weather API
    land_size     = db.Column(db.String(50),  default="")

    predictions   = db.relationship("PredictionHistory", backref="user", lazy=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class PredictionHistory(db.Model):
    __tablename__ = "prediction_history"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    timestamp   = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    source      = db.Column(db.String(20), default="manual")  # "manual" | "ocr"

    # Input parameters
    n           = db.Column(db.Float, default=0)
    p           = db.Column(db.Float, default=0)
    k           = db.Column(db.Float, default=0)
    ph          = db.Column(db.Float, default=6.5)
    temperature = db.Column(db.Float, default=25)
    humidity    = db.Column(db.Float, default=70)
    rainfall    = db.Column(db.Float, default=100)

    # Output
    top_crop    = db.Column(db.String(50), default="")
    top_prob    = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "id":          self.id,
            "timestamp":   self.timestamp.isoformat() if self.timestamp else "",
            "source":      self.source,
            "N":           self.n,
            "P":           self.p,
            "K":           self.k,
            "ph":          self.ph,
            "temperature": self.temperature,
            "humidity":    self.humidity,
            "rainfall":    self.rainfall,
            "top_crop":    self.top_crop,
            "top_prob":    self.top_prob,
        }


class DiseaseHistory(db.Model):
    """
    One row per completed disease-prediction call. user_id is nullable --
    unlike PredictionHistory, this logs every successful classification
    regardless of whether the person is logged in, so /api/stats reflects
    real total usage rather than only logged-in usage. (PredictionHistory
    itself still only logs for logged-in users -- see the note where it's
    written in app.py if you want that changed too; it wasn't touched here
    to avoid a schema migration on your existing dhara.db.)
    """
    __tablename__ = "disease_history"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    timestamp  = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    plant      = db.Column(db.String(80),  default="")
    disease    = db.Column(db.String(120), default="")
    confidence = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "id":         self.id,
            "timestamp":  self.timestamp.isoformat() if self.timestamp else "",
            "plant":      self.plant,
            "disease":    self.disease,
            "confidence": self.confidence,
        }


class FertilizerHistory(db.Model):
    """One row per completed fertilizer recommendation. user_id nullable -- see DiseaseHistory docstring."""
    __tablename__ = "fertilizer_history"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    timestamp  = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    crop_type       = db.Column(db.String(50),  default="")
    soil_type       = db.Column(db.String(50),  default="")
    fertilizer      = db.Column(db.String(80),  default="")
    confidence      = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "id":         self.id,
            "timestamp":  self.timestamp.isoformat() if self.timestamp else "",
            "crop_type":  self.crop_type,
            "soil_type":  self.soil_type,
            "fertilizer": self.fertilizer,
            "confidence": self.confidence,
        }


# ═══════════════════════════════════════════════════════════════════════════════
# EXPERT CONSULTATION
# New tables only -- db.create_all() adds them without touching existing ones.
# ═══════════════════════════════════════════════════════════════════════════════

class Expert(db.Model):
    """An agriculture expert. Separate login from farmers (session key 'expert_id')."""
    __tablename__ = "expert"

    id              = db.Column(db.Integer, primary_key=True)
    name            = db.Column(db.String(100), nullable=False)
    email           = db.Column(db.String(120), unique=True, nullable=False)
    password_hash   = db.Column(db.String(200))
    phone           = db.Column(db.String(20),  default="")     # private: admin verification only
    qualification   = db.Column(db.String(200), default="")
    expertise       = db.Column(db.String(300), default="")     # comma-separated
    experience_years = db.Column(db.Integer, default=0)
    languages       = db.Column(db.String(150), default="")     # comma-separated
    rate_per_minute = db.Column(db.Float, default=5)            # INR
    bio             = db.Column(db.Text, default="")
    location        = db.Column(db.String(100), default="")
    status          = db.Column(db.String(20), default="pending")   # pending | approved | rejected
    review_note     = db.Column(db.String(300), default="")
    available       = db.Column(db.Boolean, default=True)
    is_demo         = db.Column(db.Boolean, default=False)
    created_at      = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    reviewed_at     = db.Column(db.DateTime, nullable=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def _split(value):
        return [v.strip() for v in (value or "").split(",") if v.strip()]

    def public_dict(self):
        """What farmers may see. Never includes email, phone or password."""
        return {
            "id": self.id, "name": self.name, "qualification": self.qualification,
            "expertise": self._split(self.expertise), "experience_years": self.experience_years,
            "languages": self._split(self.languages), "rate_per_minute": self.rate_per_minute,
            "bio": self.bio, "location": self.location,
            "available": bool(self.available), "is_demo": bool(self.is_demo),
        }

    def private_dict(self):
        """For the expert themself and the admin."""
        d = self.public_dict()
        d.update({
            "email": self.email, "phone": self.phone, "status": self.status,
            "review_note": self.review_note,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else "",
        })
        return d


class Consultation(db.Model):
    """
    requested -> accepted (expert) -> active (farmer presses Start = consents to billing)
              -> completed (either side ends)
    requested/accepted -> declined (expert) / cancelled (farmer or expert)
    """
    __tablename__ = "consultation"

    id             = db.Column(db.Integer, primary_key=True)
    farmer_id      = db.Column(db.Integer, db.ForeignKey("user.id"),   nullable=False)
    expert_id      = db.Column(db.Integer, db.ForeignKey("expert.id"), nullable=False)
    topic          = db.Column(db.String(120), default="")
    message        = db.Column(db.Text, default="")
    status         = db.Column(db.String(20), default="requested")
    rate_snapshot  = db.Column(db.Float, default=0)      # rate when requested; later edits don't change it
    created_at     = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    responded_at   = db.Column(db.DateTime, nullable=True)
    started_at     = db.Column(db.DateTime, nullable=True)
    ended_at       = db.Column(db.DateTime, nullable=True)
    ended_by       = db.Column(db.String(20), default="")   # farmer | expert | idle | limit
    minutes_billed = db.Column(db.Integer, default=0)
    amount         = db.Column(db.Float, default=0)


class ChatMessage(db.Model):
    __tablename__ = "chat_message"

    id              = db.Column(db.Integer, primary_key=True)
    consultation_id = db.Column(db.Integer, db.ForeignKey("consultation.id"), nullable=False, index=True)
    sender          = db.Column(db.String(10), nullable=False)   # farmer | expert
    text            = db.Column(db.Text, nullable=False)
    created_at      = db.Column(db.DateTime, default=datetime.datetime.utcnow)
