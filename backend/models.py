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