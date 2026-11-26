"""
Seed 14 DEMO experts (12 approved, 2 pending) into dhara.db.

    cd backend
    py seed_experts.py

Safe to run more than once (skips emails that already exist).
Every demo expert logs in with password:  Expert@123
Demo emails look like  anita@dhara.example  (see the list printed at the end).
Remove them later with:  py seed_experts.py --remove
"""
import sys
from flask import Flask
from models import db, Expert

app = Flask(__name__)                      # same app root as app.py -> same instance/dhara.db
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///dhara.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

PASSWORD = "Expert@123"

# name, email, qualification, expertise, years, languages, rate, location, bio, available, status
DEMO = [
    ("Dr. Anita Deshmukh", "anita@dhara.example", "Ph.D. Plant Pathology",
     "Plant Pathology, Pest Management", 14, "English, Hindi, Marathi", 12, "Pune, Maharashtra",
     "Diagnoses fungal and bacterial leaf diseases in vegetables and fruit crops. Practical, low-cost control plans.", True, "approved"),
    ("Rajesh Patil", "rajesh@dhara.example", "M.Sc. Agronomy",
     "Crop Management, Fertilizers & Nutrients", 11, "Marathi, Hindi", 8, "Nashik, Maharashtra",
     "Helps with sowing time, spacing and fertilizer schedules for sugarcane, onion and soybean.", True, "approved"),
    ("Dr. Meera Iyer", "meera@dhara.example", "Ph.D. Soil Science",
     "Soil Health, Fertilizers & Nutrients", 16, "English, Tamil, Hindi", 15, "Coimbatore, Tamil Nadu",
     "Reads soil test reports and builds balanced nutrient plans. Specialises in saline and acidic soils.", True, "approved"),
    ("Suresh Kulkarni", "suresh@dhara.example", "B.Sc. Agriculture, M.Sc. Horticulture",
     "Horticulture, Post-harvest", 9, "Marathi, English", 7, "Satara, Maharashtra",
     "Orchard and vegetable growers: pruning, flowering management, grading and storage.", True, "approved"),
    ("Dr. Harpreet Singh", "harpreet@dhara.example", "Ph.D. Agricultural Engineering",
     "Irrigation & Water, Farm Mechanization", 18, "Punjabi, Hindi, English", 14, "Ludhiana, Punjab",
     "Drip and sprinkler design, water budgeting and choosing the right farm machinery.", False, "approved"),
    ("Kavita Joshi", "kavita@dhara.example", "M.Sc. Organic Agriculture",
     "Organic Farming, Soil Health", 7, "Hindi, Marathi, English", 6, "Nagpur, Maharashtra",
     "Transition to organic: compost, bio-inputs, certification basics and pest control without chemicals.", True, "approved"),
    ("Dr. Imran Shaikh", "imran@dhara.example", "B.V.Sc. & A.H., M.V.Sc.",
     "Dairy & Livestock", 12, "Hindi, Marathi, English", 10, "Kolhapur, Maharashtra",
     "Cattle and buffalo health, feed planning and milk-yield improvement for small dairy farms.", True, "approved"),
    ("Lakshmi Narayan", "lakshmi@dhara.example", "M.Sc. Entomology",
     "Pest Management, Crop Management", 10, "Telugu, English, Hindi", 9, "Guntur, Andhra Pradesh",
     "Integrated pest management for cotton, chilli and paddy. Identifies pests from photos and symptoms.", True, "approved"),
    ("Prof. Vikram Rathod", "vikram@dhara.example", "M.Sc. Agricultural Economics",
     "Agri Economics & Schemes, Post-harvest", 20, "Hindi, Marathi, English", 11, "Chhatrapati Sambhajinagar, Maharashtra",
     "Explains government schemes, subsidies, crop insurance and market pricing so farmers can plan income.", True, "approved"),
    ("Dr. Sunita Gowda", "sunita@dhara.example", "Ph.D. Horticulture",
     "Horticulture, Organic Farming", 13, "Kannada, English, Hindi", 13, "Dharwad, Karnataka",
     "Fruit, flower and spice crops: nursery raising, grafting and high-density planting.", False, "approved"),
    ("Amit Bhosale", "amit@dhara.example", "Diploma in Agriculture",
     "Crop Management, Irrigation & Water, Farm Mechanization", 15, "Marathi, Hindi", 5, "Baramati, Maharashtra",
     "Hands-on farmer-advisor: drip setup, mulching and low-cost mechanisation for 2 to 10 acre farms.", True, "approved"),
    ("Dr. Pooja Mehta", "pooja@dhara.example", "Ph.D. Agronomy",
     "Crop Management, Soil Health", 8, "Gujarati, Hindi, English", 12, "Anand, Gujarat",
     "Crop planning and yield improvement for groundnut, cotton and wheat; weed and water management.", True, "approved"),
    # pending: lets you try the admin approval flow
    ("Nitin Jadhav", "nitin@dhara.example", "M.Sc. Plant Pathology",
     "Plant Pathology", 5, "Marathi, Hindi", 6, "Solapur, Maharashtra",
     "Early-career pathologist focused on grape and pomegranate diseases.", True, "pending"),
    ("Farida Khan", "farida@dhara.example", "M.Sc. Agricultural Extension",
     "Agri Economics & Schemes", 6, "Hindi, English", 7, "Jalgaon, Maharashtra",
     "Helps farmers apply for schemes and loans and prepare the paperwork.", True, "pending"),
]

with app.app_context():
    db.create_all()
    if "--remove" in sys.argv:
        n = Expert.query.filter_by(is_demo=True).delete()
        db.session.commit()
        print(f"Removed {n} demo experts.")
        sys.exit(0)

    added = 0
    for (name, email, qual, exp, yrs, langs, rate, loc, bio, avail, status) in DEMO:
        if Expert.query.filter_by(email=email).first():
            continue
        e = Expert(name=name, email=email, phone="9000000000", qualification=qual, expertise=exp,
                   experience_years=yrs, languages=langs, rate_per_minute=rate, location=loc,
                   bio=bio, available=avail, status=status, is_demo=True)
        e.set_password(PASSWORD)
        db.session.add(e)
        added += 1
    db.session.commit()
    print(f"Added {added} demo experts ({len(DEMO) - added} already existed).")
    print(f"Password for all: {PASSWORD}")
    for d in DEMO:
        print(f"  {d[1]:<24} {d[0]:<22} {d[10]}")
