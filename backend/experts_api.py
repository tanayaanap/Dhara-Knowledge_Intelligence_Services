"""
Expert consultation API (Flask blueprint)
=========================================
Farmers browse APPROVED experts and request a paid-by-the-minute consultation.
Experts have their own login and a dashboard. An admin (X-Admin-Key header)
approves experts before they become visible.

Payment is a DEMO: the farmer picks a method on a pretend payment window and a receipt is
created. No real money moves and no card or UPI details are collected.

Billing: minutes = elapsed time rounded UP (minimum 1) x the rate that applied when
the farmer made the request. The clock starts only when the FARMER presses Start
(consent to billing) and stops when either side ends the session, after 20 idle
minutes, or at the 120-minute cap. The amount is recorded
on the consultation; the demo payment step then marks it paid.
"""

import datetime
import hmac
import math
import os
import re
import secrets

from flask import Blueprint, jsonify, request, session
from sqlalchemy.exc import IntegrityError

from models import db, User, Expert, Consultation, ChatMessage, Payment

bp = Blueprint("experts", __name__)

EXPERTISE_AREAS = [
    "Crop Management", "Soil Health", "Plant Pathology", "Pest Management",
    "Irrigation & Water", "Organic Farming", "Horticulture", "Dairy & Livestock",
    "Agri Economics & Schemes", "Post-harvest", "Fertilizers & Nutrients", "Farm Mechanization",
]
LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Kannada", "Telugu", "Tamil", "Punjabi"]
MIN_RATE, MAX_RATE = 1, 500          # INR per minute
IDLE_LIMIT_MIN = 20                  # auto-end an active session after this much silence
MAX_SESSION_MIN = 120
MAX_OPEN_PER_FARMER = 5
PAY_METHODS = ("upi", "card", "netbanking")
OPEN_STATES = ("requested", "accepted", "active")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ── helpers ──────────────────────────────────────────────────────────────────
def _now():
    return datetime.datetime.utcnow()


def _iso(dt):
    return dt.isoformat() + "Z" if dt else None


def _err(msg, code=400):
    return jsonify({"success": False, "error": msg}), code


def _current_expert():
    eid = session.get("expert_id")
    return Expert.query.get(eid) if eid else None


def _admin_check():
    """Returns an error response, or None if the admin key is valid."""
    key = os.getenv("ADMIN_KEY")
    if not key:
        return _err("Admin key not configured. Add ADMIN_KEY=... to backend/.env and restart.", 503)
    supplied = request.headers.get("X-Admin-Key", "")
    if not hmac.compare_digest(supplied.encode(), key.encode()):
        return _err("Invalid admin key.", 401)
    return None


def _role_in(c):
    if session.get("user_id") and session["user_id"] == c.farmer_id:
        return "farmer"
    if session.get("expert_id") and session["expert_id"] == c.expert_id:
        return "expert"
    return None


def _bill(c, end_time, ended_by):
    """Close an active consultation and compute the amount."""
    secs = max(0, (end_time - c.started_at).total_seconds())
    secs = min(secs, MAX_SESSION_MIN * 60)
    c.ended_at = c.started_at + datetime.timedelta(seconds=secs)
    c.status = "completed"
    c.ended_by = ended_by
    c.minutes_billed = max(1, math.ceil(secs / 60))
    c.amount = round(c.minutes_billed * c.rate_snapshot, 2)


def _last_activity(c):
    last = ChatMessage.query.filter_by(consultation_id=c.id).order_by(ChatMessage.id.desc()).first()
    return max(c.started_at, last.created_at) if last else c.started_at


def _auto_end(c):
    """Lazily end sessions that were abandoned, so nobody is billed for forgetting to hang up."""
    if c.status != "active" or not c.started_at:
        return
    now = _now()
    if (now - c.started_at).total_seconds() >= MAX_SESSION_MIN * 60:
        _bill(c, c.started_at + datetime.timedelta(minutes=MAX_SESSION_MIN), "limit")
    else:
        last = _last_activity(c)
        if (now - last).total_seconds() >= IDLE_LIMIT_MIN * 60:
            _bill(c, last, "idle")
        else:
            return
    db.session.commit()


def _payment_dict(p):
    if not p:
        return None
    return {"paid": p.status == "paid", "receipt_no": p.receipt_no, "method": p.method,
            "amount": p.amount, "paid_at": _iso(p.paid_at)}


def _consultation_dict(c, role):
    expert = Expert.query.get(c.expert_id)
    farmer = User.query.get(c.farmer_id)
    elapsed = None
    if c.status == "active" and c.started_at:
        elapsed = int((_now() - c.started_at).total_seconds())
    return {
        "id": c.id, "role": role, "topic": c.topic, "message": c.message, "status": c.status,
        "rate_per_minute": c.rate_snapshot, "created_at": _iso(c.created_at),
        "started_at": _iso(c.started_at), "ended_at": _iso(c.ended_at), "ended_by": c.ended_by,
        "minutes_billed": c.minutes_billed, "amount": c.amount, "elapsed_seconds": elapsed,
        "expert_name": expert.name if expert else "",
        "expert_qualification": expert.qualification if expert else "",
        "farmer_name": (farmer.name or "Farmer") if farmer else "Farmer",
        "idle_limit_minutes": IDLE_LIMIT_MIN,
        "payment": _payment_dict(Payment.query.filter_by(consultation_id=c.id).first()),
    }


# ── public: directory ────────────────────────────────────────────────────────
@bp.route("/api/experts/meta")
def experts_meta():
    return jsonify({"expertise": EXPERTISE_AREAS, "languages": LANGUAGES,
                    "min_rate": MIN_RATE, "max_rate": MAX_RATE})


@bp.route("/api/experts")
def list_experts():
    q = Expert.query.filter_by(status="approved")
    expertise = request.args.get("expertise", "").strip()
    language = request.args.get("language", "").strip()
    text = request.args.get("q", "").strip().lower()
    available_only = request.args.get("available") == "1"

    experts = q.all()
    out = []
    for e in experts:
        d = e.public_dict()
        if available_only and not d["available"]:
            continue
        if expertise and expertise not in d["expertise"]:
            continue
        if language and language not in d["languages"]:
            continue
        if text:
            hay = " ".join([d["name"], d["qualification"], d["bio"], d["location"],
                            " ".join(d["expertise"])]).lower()
            if text not in hay:
                continue
        out.append(d)
    out.sort(key=lambda d: (not d["available"], -d["experience_years"], d["name"]))
    return jsonify({"success": True, "experts": out})


# ── expert account ───────────────────────────────────────────────────────────
@bp.route("/api/expert/register", methods=["POST"])
def expert_register():
    d = request.get_json(silent=True) or {}
    name = str(d.get("name", "")).strip()
    email = str(d.get("email", "")).strip().lower()
    password = str(d.get("password", ""))
    phone = re.sub(r"[^\d+]", "", str(d.get("phone", "")))
    qualification = str(d.get("qualification", "")).strip()
    expertise = [x for x in d.get("expertise", []) if x in EXPERTISE_AREAS] if isinstance(d.get("expertise"), list) else []
    languages = [x for x in d.get("languages", []) if x in LANGUAGES] if isinstance(d.get("languages"), list) else []
    bio = str(d.get("bio", "")).strip()
    location = str(d.get("location", "")).strip()
    try:
        years = int(d.get("experience_years", 0))
        rate = round(float(d.get("rate_per_minute", 0)), 2)
    except (TypeError, ValueError):
        return _err("Experience and rate must be numbers.")

    if len(name) < 2 or len(name) > 100:
        return _err("Please enter your full name.")
    if not EMAIL_RE.match(email):
        return _err("Please enter a valid email.")
    if len(password) < 8:
        return _err("Password must be at least 8 characters.")
    if not 10 <= len(re.sub(r"\D", "", phone)) <= 15:
        return _err("Please enter a valid phone number (used only for verification, never shown to farmers).")
    if not 3 <= len(qualification) <= 200:
        return _err("Please enter your qualification (for example: M.Sc. Agronomy).")
    if not 1 <= len(expertise) <= 5:
        return _err("Choose 1 to 5 areas of expertise.")
    if not languages:
        return _err("Choose at least one language.")
    if not 0 <= years <= 60:
        return _err("Experience must be between 0 and 60 years.")
    if not MIN_RATE <= rate <= MAX_RATE:
        return _err(f"Rate must be between ₹{MIN_RATE} and ₹{MAX_RATE} per minute.")
    if len(bio) > 600:
        return _err("Bio must be 600 characters or fewer.")
    if Expert.query.filter_by(email=email).first():
        return _err("This email is already registered.", 409)

    e = Expert(name=name, email=email, phone=phone, qualification=qualification,
               expertise=", ".join(expertise), languages=", ".join(languages),
               experience_years=years, rate_per_minute=rate, bio=bio, location=location[:100],
               status="pending", available=True)
    e.set_password(password)
    db.session.add(e)
    db.session.commit()
    return jsonify({"success": True, "message": "Registered. You will appear to farmers after admin approval."})


@bp.route("/api/expert/login", methods=["POST"])
def expert_login():
    d = request.get_json(silent=True) or {}
    email = str(d.get("email", "")).strip().lower()
    e = Expert.query.filter_by(email=email).first()
    if not e or not e.check_password(str(d.get("password", ""))):
        return _err("Invalid email or password.", 401)
    session["expert_id"] = e.id
    return jsonify({"success": True, "expert": e.private_dict()})


@bp.route("/api/expert/logout", methods=["POST"])
def expert_logout():
    session.pop("expert_id", None)
    return jsonify({"success": True})


@bp.route("/api/expert/me", methods=["GET", "PUT"])
def expert_me():
    e = _current_expert()
    if not e:
        return jsonify({"authenticated": False})
    if request.method == "PUT":
        d = request.get_json(silent=True) or {}
        # qualification / expertise are NOT editable here: changing them would bypass approval
        if "available" in d:
            e.available = bool(d["available"])
        if "rate_per_minute" in d:
            try:
                rate = round(float(d["rate_per_minute"]), 2)
            except (TypeError, ValueError):
                return _err("Rate must be a number.")
            if not MIN_RATE <= rate <= MAX_RATE:
                return _err(f"Rate must be between ₹{MIN_RATE} and ₹{MAX_RATE} per minute.")
            e.rate_per_minute = rate
        if "bio" in d:
            if len(str(d["bio"])) > 600:
                return _err("Bio must be 600 characters or fewer.")
            e.bio = str(d["bio"]).strip()
        db.session.commit()
    return jsonify({"authenticated": True, "expert": e.private_dict()})


@bp.route("/api/expert/consultations")
def expert_consultations():
    e = _current_expert()
    if not e:
        return _err("Please log in as an expert.", 401)
    rows = Consultation.query.filter_by(expert_id=e.id).order_by(Consultation.id.desc()).limit(100).all()
    for c in rows:
        _auto_end(c)
    return jsonify({"success": True, "consultations": [_consultation_dict(c, "expert") for c in rows]})


# ── farmer side ──────────────────────────────────────────────────────────────
@bp.route("/api/consultations", methods=["POST"])
def request_consultation():
    uid = session.get("user_id")
    if not uid or not User.query.get(uid):
        return _err("Please log in to request a consultation.", 401)
    d = request.get_json(silent=True) or {}
    try:
        expert = Expert.query.get(int(d.get("expert_id")))
    except (TypeError, ValueError):
        expert = None
    topic = str(d.get("topic", "")).strip()[:120]
    message = str(d.get("message", "")).strip()[:1000]

    if not expert or expert.status != "approved":
        return _err("Expert not found.", 404)
    if not expert.available:
        return _err("This expert is not available right now.")
    if len(topic) < 3:
        return _err("Please enter a short topic.")
    if len(message) < 5:
        return _err("Please describe your problem in a sentence or two.")

    open_rows = Consultation.query.filter(Consultation.farmer_id == uid,
                                          Consultation.status.in_(OPEN_STATES)).all()
    for c in open_rows:
        _auto_end(c)
    open_rows = [c for c in open_rows if c.status in OPEN_STATES]
    if any(c.expert_id == expert.id for c in open_rows):
        return _err("You already have an open request with this expert.", 409)
    if len(open_rows) >= MAX_OPEN_PER_FARMER:
        return _err("You have too many open requests. Finish or cancel one first.", 429)

    c = Consultation(farmer_id=uid, expert_id=expert.id, topic=topic, message=message,
                     rate_snapshot=expert.rate_per_minute, status="requested")
    db.session.add(c)
    db.session.commit()
    return jsonify({"success": True, "consultation": _consultation_dict(c, "farmer")})


@bp.route("/api/my-consultations")
def my_consultations():
    uid = session.get("user_id")
    if not uid:
        return _err("Please log in.", 401)
    rows = Consultation.query.filter_by(farmer_id=uid).order_by(Consultation.id.desc()).limit(100).all()
    for c in rows:
        _auto_end(c)
    return jsonify({"success": True, "consultations": [_consultation_dict(c, "farmer") for c in rows]})


# ── shared: one consultation ─────────────────────────────────────────────────
def _load(cid):
    c = Consultation.query.get(cid)
    if not c:
        return None, None, _err("Consultation not found.", 404)
    role = _role_in(c)
    if not role:
        return None, None, _err("Not allowed.", 403)
    _auto_end(c)
    return c, role, None


@bp.route("/api/consultations/<int:cid>/poll")
def poll(cid):
    c, role, err = _load(cid)
    if err:
        return err
    try:
        after = int(request.args.get("after", 0))
    except ValueError:
        after = 0
    msgs = (ChatMessage.query.filter(ChatMessage.consultation_id == c.id, ChatMessage.id > after)
            .order_by(ChatMessage.id).limit(200).all())
    return jsonify({
        "success": True, "consultation": _consultation_dict(c, role),
        "messages": [{"id": m.id, "sender": m.sender, "text": m.text, "created_at": _iso(m.created_at)} for m in msgs],
    })


@bp.route("/api/consultations/<int:cid>/messages", methods=["POST"])
def send_message(cid):
    c, role, err = _load(cid)
    if err:
        return err
    if c.status != "active":
        return _err("Chat is open only while the consultation is active.", 409)
    text = str((request.get_json(silent=True) or {}).get("text", "")).strip()
    if not text:
        return _err("Message is empty.")
    if len(text) > 1000:
        return _err("Message is too long (1000 characters max).")
    m = ChatMessage(consultation_id=c.id, sender=role, text=text)
    db.session.add(m)
    db.session.commit()
    return jsonify({"success": True, "id": m.id})


@bp.route("/api/consultations/<int:cid>/action", methods=["POST"])
def consultation_action(cid):
    c, role, err = _load(cid)
    if err:
        return err
    action = str((request.get_json(silent=True) or {}).get("action", ""))
    now = _now()

    if action in ("accept", "decline"):
        if role != "expert" or c.status != "requested":
            return _err("Not allowed in the current state.", 409)
        expert = Expert.query.get(c.expert_id)
        if expert.status != "approved":
            return _err("Your profile is not approved yet.", 403)
        c.status = "accepted" if action == "accept" else "declined"
        c.responded_at = now
    elif action == "start":
        if role != "farmer" or c.status != "accepted":
            return _err("Not allowed in the current state.", 409)
        c.status = "active"
        c.started_at = now
    elif action == "end":
        if c.status != "active":
            return _err("This consultation is not active.", 409)
        _bill(c, now, role)
    elif action == "cancel":
        if c.status not in ("requested", "accepted"):
            return _err("Only a pending or accepted request can be cancelled.", 409)
        c.status = "cancelled"
        c.responded_at = now
    else:
        return _err("Unknown action.")

    db.session.commit()
    return jsonify({"success": True, "consultation": _consultation_dict(c, role)})


# ── demo payment + receipt ───────────────────────────────────────────────────
@bp.route("/api/consultations/<int:cid>/pay", methods=["POST"])
def pay_consultation(cid):
    c, role, err = _load(cid)
    if err:
        return err
    if role != "farmer":
        return _err("Only the farmer can pay for a consultation.", 403)
    if c.status != "completed":
        return _err("You can pay after the consultation has ended.", 409)
    if Payment.query.filter_by(consultation_id=c.id).first():
        return _err("This consultation is already paid.", 409)
    method = str((request.get_json(silent=True) or {}).get("method", ""))
    if method not in PAY_METHODS:
        return _err("Please choose a payment method.")
    if not c.amount or c.amount <= 0:
        return _err("Nothing to pay for this consultation.", 409)

    now = _now()
    p = Payment(consultation_id=c.id, farmer_id=c.farmer_id, expert_id=c.expert_id,
                amount=c.amount, method=method, status="paid", paid_at=now,
                receipt_no=f"DHR-{now:%Y%m%d}-{c.id:05d}",
                reference="DEMO" + secrets.token_hex(5).upper())
    db.session.add(p)
    try:
        db.session.commit()
    except IntegrityError:          # two clicks at once: the unique constraint stops the second
        db.session.rollback()
        return _err("This consultation is already paid.", 409)
    return jsonify({"success": True, "payment": _payment_dict(p),
                    "consultation": _consultation_dict(c, role)})


@bp.route("/api/consultations/<int:cid>/receipt")
def receipt(cid):
    c, role, err = _load(cid)
    if err:
        return err
    p = Payment.query.filter_by(consultation_id=c.id).first()
    if not p:
        return _err("No payment found for this consultation.", 404)
    expert = Expert.query.get(c.expert_id)
    farmer = User.query.get(c.farmer_id)
    return jsonify({"success": True, "receipt": {
        "receipt_no": p.receipt_no, "reference": p.reference, "method": p.method,
        "amount": p.amount, "status": p.status, "paid_at": _iso(p.paid_at),
        "topic": c.topic, "minutes_billed": c.minutes_billed, "rate_per_minute": c.rate_snapshot,
        "started_at": _iso(c.started_at), "ended_at": _iso(c.ended_at),
        "expert_name": expert.name if expert else "", "expert_qualification": expert.qualification if expert else "",
        "farmer_name": (farmer.name or "Farmer") if farmer else "Farmer",
        "role": role,
    }})


# ── admin ────────────────────────────────────────────────────────────────────
@bp.route("/api/admin/experts")
def admin_list():
    bad = _admin_check()
    if bad:
        return bad
    status = request.args.get("status", "pending")
    q = Expert.query
    if status in ("pending", "approved", "rejected"):
        q = q.filter_by(status=status)
    rows = q.order_by(Expert.id.desc()).all()
    return jsonify({"success": True, "experts": [e.private_dict() for e in rows]})


@bp.route("/api/admin/experts/<int:eid>/review", methods=["POST"])
def admin_review(eid):
    bad = _admin_check()
    if bad:
        return bad
    e = Expert.query.get(eid)
    if not e:
        return _err("Expert not found.", 404)
    d = request.get_json(silent=True) or {}
    action = d.get("action")
    if action not in ("approve", "reject"):
        return _err("Unknown action.")
    e.status = "approved" if action == "approve" else "rejected"
    e.review_note = str(d.get("note", "")).strip()[:300]
    e.reviewed_at = _now()
    db.session.commit()
    return jsonify({"success": True, "expert": e.private_dict()})
