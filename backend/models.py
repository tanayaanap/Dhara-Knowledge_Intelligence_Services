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