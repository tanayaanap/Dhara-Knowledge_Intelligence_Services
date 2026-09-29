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
    "seasons": {
        "keywords": ["kharif", "rabi", "zaid", "season", "seasonal", "summer crop", "winter crop", "monsoon crop"],
        "response": "🗓️ **Crop Seasons in India:**\n\n• **Kharif (June–October, monsoon):** rice, maize, cotton, soybean, groundnut, bajra, jowar, tur (arhar), moong.\n• **Rabi (October–March, winter):** wheat, barley, mustard, chickpea (gram), peas, lentil.\n• **Zaid (March–June, summer):** watermelon, muskmelon, cucumber, fodder crops, moong.\n\nTip: match the crop to both the season and your soil — use the **Crop Recommendation** tool for a data-based suggestion."
    },
    "millets": {
        "keywords": ["millet", "jowar", "bajra", "ragi", "sorghum", "bajri"],
        "response": "🌾 **Millets (Jowar, Bajra, Ragi):**\n\n• Hardy, drought-tolerant crops suited to low-rainfall areas.\n• Grow well in light, well-drained soils, even low-fertility ones.\n• Mostly sown in Kharif; need little water and fertilizer.\n• Nutritious, and in growing demand.\n• Watch out for: shoot fly, downy mildew (bajra), blast (ragi)."
    },
    "pulses": {
        "keywords": ["pulse", "dal", "lentil", "chickpea", "gram", "moong", "urad", "tur", "arhar", "legume"],
        "response": "🫘 **Pulses (Moong, Tur, Chickpea, Lentil):**\n\n• Legumes fix nitrogen from the air, improving the soil for the next crop.\n• Need well-drained soil; waterlogging harms them.\n• Need little nitrogen; phosphorus (DAP/SSP) matters more.\n• Kharif: tur (arhar), moong, urad. Rabi: chickpea (gram), lentil, peas.\n• Excellent in rotation with cereals."
    },
    "vegetables": {
        "keywords": ["vegetable", "tomato", "potato", "onion", "brinjal", "chilli", "okra"],
        "response": "🍅 **Vegetable Farming Tips:**\n\n• Prefer well-drained loamy soil rich in organic matter (pH 6–7).\n• Drip irrigation saves water and reduces leaf diseases.\n• Use compost or FYM along with balanced NPK.\n• Watch out for: aphids, whitefly, fruit borer, wilt diseases.\n• Rotate crops (e.g. tomato → legume) to break pest cycles."
    },
    "sugarcane": {
        "keywords": ["sugarcane", "sugar cane", "ganna"],
        "response": "🎋 **Sugarcane Tips:**\n\n• Needs a warm, humid climate and plenty of water; a long crop of about 10–12 months.\n• Ideal soil: deep, well-drained loam or clay loam; pH 6.5–7.5.\n• High nitrogen and potassium demand.\n• Watch out for: red rot, early shoot borer, whitefly.\n• Ratoon crops can cut replanting cost."
    },
    "soybean": {
        "keywords": ["soybean", "soya", "soyabean"],
        "response": "🌱 **Soybean Tips:**\n\n• A Kharif crop, sown with the monsoon (June–July).\n• Ideal soil: well-drained loam or black soil; pH 6–7.5.\n• A legume — fixes nitrogen; needs phosphorus and sulphur.\n• Avoid waterlogging.\n• Watch out for: stem fly, girdle beetle, yellow mosaic virus."
    },
    "soil_ph": {
        "keywords": ["soil ph", "ph level", "acidic soil", "alkaline soil", "ph value", "ph of soil"],
        "response": "🧪 **Soil pH Guide:**\n\n• pH < 6 (Acidic) → Add lime to neutralize. Good for tea, blueberries.\n• pH 6–7 (Neutral) → Ideal for most crops like wheat, maize, vegetables.\n• pH > 7 (Alkaline) → Add sulfur or organic matter. Suitable for barley, cotton.\n\nTip: Test your soil pH every season for best results!"
    },
    "fertilizer": {
        "keywords": ["fertilizer", "fertiliser", "npk", "nitrogen", "phosphorus", "potassium", "urea", "manure"],
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
    "soil_erosion": {
        "keywords": ["soil erosion", "erosion", "topsoil", "land degradation"],
        "response": "🏞️ **Soil Erosion:**\n\nSoil erosion is the wearing away of fertile topsoil by water, wind, or poor farming practices. It reduces yield and washes away nutrients.\n\n**How to prevent it:**\n• Contour ploughing and terracing on slopes\n• Mulching and cover crops to protect bare soil\n• Windbreaks / tree belts in dry, windy areas\n• Crop rotation and minimum tillage\n• Avoid leaving fields bare after harvest"
    },
    "crop_rotation": {
        "keywords": ["crop rotation", "rotate crops", "rotation", "intercropping", "mixed cropping"],
        "response": "🔄 **Crop Rotation:**\n\nGrowing different crops in sequence on the same field.\n\n• Breaks pest and disease cycles\n• Legumes (moong, chickpea, soybean) add nitrogen to the soil\n• Improves soil structure and reduces fertilizer need\n• Example: Rice → Wheat → Moong, or Cotton → Soybean"
    },
    "mulching": {
        "keywords": ["mulch", "mulching", "cover crop", "cover crops"],
        "response": "🍂 **Mulching:**\n\nCovering soil with straw, leaves, or plastic film.\n\n• Retains soil moisture and cuts irrigation need\n• Suppresses weeds\n• Protects soil from erosion and temperature extremes\n• Organic mulch also adds humus as it decomposes"
    },
    "soil_health": {
        "keywords": ["soil health", "soil health card", "shc", "soil test", "soil testing", "soil fertility"],
        "response": "🌱 **Soil Health:**\n\nA Soil Health Card (SHC) reports pH, EC, organic carbon, N, P, K and micronutrients (Zn, Fe, Mn, Cu, B, S).\n\n• Test soil every 1–2 seasons\n• Upload your SHC in DHARA's **OCR Scan** to get crop suggestions automatically\n• Add organic matter to improve fertility over time"
    },
    "about_dhara": {
        "keywords": ["what is dhara", "about dhara", "what can you do", "how to use", "how does this app work", "your features"],
        "response": "🌾 **About DHARA:**\n\nDHARA is an AI farming assistant that offers:\n• Crop recommendation (manual or by scanning a Soil Health Card)\n• Plant disease detection from a leaf photo\n• Fertilizer recommendation\n• Weather-based climate data\n• This chatbot for farming questions"
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

# Greetings / farewells only count when the message is short, so
# "thanks, which crop suits black soil?" is NOT treated as a goodbye.
_SHORT_INTENTS = {"greeting", "farewell"}
_MAX_SHORT_WORDS = 6


def _normalize(text: str) -> str:
    text = text.lower().strip()
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", text)).strip()


def _compile_patterns():
    compiled = {}
    for intent, data in RESPONSES.items():
        # Normalize keywords the same way as the message ("that's all" -> "that s all"),
        # and match on WORD boundaries so "hi" no longer matches "which"/"this".
        # Keywords of 4+ letters also match simple plurals ("aphid" -> "aphids").
        alts = "|".join(
            re.escape(n) + ("(?:e?s)?" if len(n) >= 4 else "")
            for n in (_normalize(k) for k in sorted(data["keywords"], key=len, reverse=True))
        )
        compiled[intent] = re.compile(rf"\b(?:{alts})\b")
    return compiled


_PATTERNS = _compile_patterns()


def match_intent(user_message: str):
    """Return (intent, response) or (None, None) if nothing matched."""
    message = _normalize(user_message)
    n_words = len(message.split())
    for intent, data in RESPONSES.items():
        if intent in _SHORT_INTENTS and n_words > _MAX_SHORT_WORDS:
            continue
        if _PATTERNS[intent].search(message):
            return intent, data["response"]
    return None, None


def get_response(user_message: str) -> str:
    """Keyword answer, or DEFAULT_RESPONSE if nothing matches."""
    _, response = match_intent(user_message)
    return response or DEFAULT_RESPONSE