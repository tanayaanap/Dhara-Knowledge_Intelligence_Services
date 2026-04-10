import re

# ---------- Knowledge Base ----------

RESPONSES = {
    "greeting": {
        "keywords": ["hello", "hi", "hey", "namaste", "good morning", "good evening"],
        "response": "Hello! 👋 I'm DHARA Assistant. I can help you with crop recommendations, soil health, fertilizers, and weather tips. What would you like to know?"
    },
    "crop_recommendation": {
        "keywords": ["which crop", "what crop", "best crop", "suggest crop", "recommend crop", "crop for", "grow what", "which plant"],
        "response": "To recommend the best crop, I need to know your soil type and local climate. You can use our **Crop Recommendation** tool by entering your soil nutrients (N, P, K), temperature, humidity, pH, and rainfall. Common choices:\n\n🌾 High N soil → Maize, Wheat\n🍚 Waterlogged areas → Rice\n🌱 Dry regions → Millets, Sorghum\n🍇 Well-drained → Grapes, Cotton"
    },
    "soil_ph": {
        "keywords": ["soil ph", "ph level", "acidic soil", "alkaline soil", "ph value", "ph of soil"],
        "response": "🧪 **Soil pH Guide:**\n\n• pH < 6 (Acidic) → Add lime to neutralize. Good for tea, blueberries.\n• pH 6–7 (Neutral) → Ideal for most crops like wheat, maize, vegetables.\n• pH > 7 (Alkaline) → Add sulfur or organic matter. Suitable for barley, cotton.\n\nTip: Test your soil pH every season for best results!"
    },
    "fertilizer": {
        "keywords": ["fertilizer", "fertiliser", "npk", "nitrogen", "phosphorus", "potassium", "urea", "manure", "compost"],
        "response": "🌿 **Fertilizer Tips:**\n\n• **Nitrogen (N)** → Promotes leaf growth. Use urea or ammonium nitrate.\n• **Phosphorus (P)** → Root development. Use DAP (Di-ammonium phosphate).\n• **Potassium (K)** → Fruit quality & disease resistance. Use MOP (Muriate of Potash).\n• **Organic** → Compost and farmyard manure improve soil structure long-term.\n\nAlways do a soil test before applying fertilizers!"
    },
    "irrigation": {
        "keywords": ["irrigation", "water", "watering", "drip", "sprinkler", "flood irrigation", "moisture"],
        "response": "💧 **Irrigation Tips:**\n\n• **Drip irrigation** → Best for water conservation (vegetables, fruits).\n• **Sprinkler** → Good for uneven terrain and field crops.\n• **Flood irrigation** → Suitable for rice paddies.\n\nWater crops early morning to reduce evaporation. Check soil moisture before irrigating — overwatering causes root rot!"
    },
    "weather": {
        "keywords": ["weather", "rain", "rainfall", "temperature", "humidity", "climate", "monsoon", "drought", "frost"],
        "response": "🌦️ **Weather & Farming Tips:**\n\n• **High rainfall** → Grow rice, jute, sugarcane.\n• **Low rainfall / drought** → Grow millets, sorghum, groundnut.\n• **High humidity** → Watch for fungal diseases; ensure good air circulation.\n• **Frost risk** → Cover crops or use frost-resistant varieties.\n• **Monsoon** → Ideal for kharif crops (rice, maize, cotton).\n• **Winter (Rabi)** → Wheat, mustard, peas thrive."
    },
    "pest": {
        "keywords": ["pest", "insect", "disease", "fungus", "blight", "worm", "aphid", "locust", "spray", "pesticide"],
        "response": "🐛 **Pest & Disease Management:**\n\n• Inspect crops regularly for early detection.\n• Use **neem oil** as a natural pesticide for most insects.\n• **Aphids** → Use insecticidal soap or introduce ladybugs.\n• **Fungal diseases** → Improve drainage; use copper-based fungicides.\n• **Crop rotation** helps break pest cycles naturally.\n• Avoid overuse of chemical pesticides to preserve soil health."
    },
    "rice": {
        "keywords": ["rice", "paddy", "chawal"],
        "response": "🍚 **Rice Farming Tips:**\n\n• Grows best in warm, humid climates with heavy rainfall (150–200 cm).\n• Ideal soil: Clay or loamy soil with good water retention.\n• pH range: 5.5–6.5\n• Key nutrients: High nitrogen demand.\n• Watch out for: Blast disease, brown planthopper.\n• Season: Kharif (June–November) in India."
    },
    "wheat": {
        "keywords": ["wheat", "gehu", "gehun"],
        "response": "🌾 **Wheat Farming Tips:**\n\n• Grows best in cool, dry climate (10–25°C).\n• Ideal soil: Well-drained loamy soil.\n• pH range: 6–7.5\n• Key nutrients: Nitrogen and phosphorus are critical.\n• Watch out for: Rust disease, aphids.\n• Season: Rabi (October–March) in India."
    },
    "maize": {
        "keywords": ["maize", "corn", "makka", "makkai"],
        "response": "🌽 **Maize Farming Tips:**\n\n• Grows best in warm climate (21–27°C) with moderate rainfall.\n• Ideal soil: Well-drained sandy loam.\n• pH range: 5.8–7.0\n• Key nutrients: High nitrogen requirement.\n• Watch out for: Fall armyworm, stem borer.\n• Season: Kharif and spring seasons."
    },
    "cotton": {
        "keywords": ["cotton", "kapas", "kapas"],
        "response": "🌿 **Cotton Farming Tips:**\n\n• Grows best in warm climate (21–35°C), requires long frost-free period.\n• Ideal soil: Deep black (regur) soil or sandy loam.\n• pH range: 6–8\n• Key nutrients: NPK balanced; potassium important for fibre quality.\n• Watch out for: Bollworm, whitefly.\n• Season: Kharif (April–December)."
    },
    "soil_types": {
        "keywords": ["soil type", "type of soil", "black soil", "red soil", "alluvial", "loamy", "sandy soil", "clay soil"],
        "response": "🪨 **Types of Soil in India:**\n\n• **Alluvial soil** → Most fertile; good for wheat, rice, sugarcane (Indo-Gangetic plains).\n• **Black soil** → Rich in clay; retains moisture; great for cotton (Deccan plateau).\n• **Red soil** → Low nutrients; needs fertilizers; good for millets, groundnut.\n• **Loamy soil** → Balanced texture; ideal for most vegetables and fruits.\n• **Sandy soil** → Poor retention; needs frequent irrigation and organic matter."
    },
    "composting": {
        "keywords": ["compost", "composting", "organic farming", "organic matter", "green manure", "vermicompost"],
        "response": "♻️ **Composting & Organic Farming:**\n\n• Compost improves soil structure, water retention, and microbial activity.\n• **Vermicompost** (worm compost) is nutrient-rich and easy to make at home.\n• **Green manure** → Grow legumes (like dhaincha) and plow them back into soil.\n• Benefits: Reduces chemical fertilizer dependency, improves long-term soil health.\n• Compost is ready in 6–8 weeks with proper turning and moisture."
    },
    "farewell": {
        "keywords": ["bye", "goodbye", "thanks", "thank you", "see you", "ok thanks", "that's all"],
        "response": "Thank you for using DHARA Assistant! 🌱 Happy farming! Feel free to come back anytime with your questions. 👋"
    }
}

DEFAULT_RESPONSE = (
    "🤔 I'm not sure about that. I can help you with:\n\n"
    "• 🌾 Crop recommendations\n"
    "• 🧪 Soil pH and types\n"
    "• 🌿 Fertilizers (NPK, organic)\n"
    "• 💧 Irrigation methods\n"
    "• 🌦️ Weather & climate advice\n"
    "• 🐛 Pest & disease management\n"
    "• 🍚 Specific crops: Rice, Wheat, Maize, Cotton\n\n"
    "Try asking something like: *'Which crop is best for black soil?'* or *'How do I manage aphids?'*"
)

# ---------- Core Matching Logic ----------

def get_response(user_message: str) -> str:
    """
    Match user message against keyword sets and return appropriate response.
    Falls back to DEFAULT_RESPONSE if no match found.
    """
    message = user_message.lower().strip()
    message = re.sub(r"[^\w\s]", " ", message)  # remove punctuation

    for intent, data in RESPONSES.items():
        for keyword in data["keywords"]:
            if keyword in message:
                return data["response"]

    return DEFAULT_RESPONSE
