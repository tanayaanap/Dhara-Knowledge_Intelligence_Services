"""
Disease information via Gemini
===============================
Takes the class name predicted by the ResNet9 model (e.g. "Tomato___Late_blight")
and returns structured, farmer-friendly information in the user's language.

Design notes
------------
* The classifier answers instantly; this module runs as a SECOND step
  (/api/disease-info) so the UI can show the diagnosis right away and the
  Gemini details a moment later.
* Only class names the model can actually output are accepted. This stops
  anyone from using the endpoint as a free general-purpose Gemini proxy.
* Results are cached per (class, language) -- there are only 38 classes x 3
  languages = 114 possible answers, so after warm-up almost every request is
  free and instant, which also saves free-tier Gemini quota.
* Failures are never cached, and the caller gets a clean exception to turn
  into a "details unavailable" message.
"""

import json
import re
import threading

LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "mr": "Marathi"}

_cache: dict = {}
_cache_lock = threading.Lock()


def parse_class(raw_class: str):
    """'Tomato___Late_blight' -> ('Tomato', 'Late blight', is_healthy)."""
    parts = raw_class.split("___")
    plant = parts[0].replace("_", " ").strip()
    condition = parts[1].replace("_", " ").strip() if len(parts) > 1 else "Unknown"
    return plant, condition, "healthy" in condition.lower()


def build_prompt(raw_class: str, lang_code: str) -> str:
    plant, condition, healthy = parse_class(raw_class)
    lang = LANGUAGE_NAMES.get(lang_code, "English")

    if healthy:
        situation = (
            f"An image classifier found the {plant} leaf to be HEALTHY. "
            "Give brief care tips to keep the crop healthy. Leave 'symptoms' "
            "and 'treatment' as empty lists and set severity to 'none'."
        )
    else:
        situation = (
            f"An image classifier detected '{condition}' on a {plant} leaf. "
            "Explain this disease to a farmer."
        )

    return f"""You are DHARA, an agricultural assistant for Indian farmers.
{situation}

Write ALL text values in {lang} using simple, everyday words a farmer would
understand (avoid literary or heavily technical phrasing; keep a well-known
English or scientific term in brackets only if it helps).

Return ONLY a JSON object with exactly these keys:
{{
  "disease_name": "name of the condition in {lang}",
  "summary": "2-3 sentences: what it is and what it does to the crop",
  "severity": "none | low | medium | high  (keep these exact English words)",
  "severity_label": "the severity written in {lang}",
  "symptoms": ["3-5 short visible signs to look for"],
  "causes": ["2-4 short causes or conditions that spread it"],
  "treatment": ["3-5 short practical steps, organic/cultural methods first"],
  "prevention": ["3-5 short steps to stop it coming back"],
  "when_to_consult": "one sentence on when to contact a local agriculture officer or KVK"
}}

Rules:
- Do NOT give pesticide doses or mixing quantities. If chemicals are relevant,
  name only the general type and tell the farmer to follow the product label
  and local agriculture-officer advice.
- Do not invent facts. If unsure, say less.
- No markdown, no text outside the JSON.
"""


def _extract_json(text: str) -> dict:
    text = (text or "").strip()
    # strip ```json fences if the model added them anyway
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.IGNORECASE)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Gemini did not return JSON")
    return json.loads(text[start:end + 1])


def _as_list(value) -> list:
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _clean(data: dict) -> dict:
    severity = str(data.get("severity", "")).strip().lower()
    if severity not in ("none", "low", "medium", "high"):
        severity = "medium"
    return {
        "disease_name": str(data.get("disease_name", "")).strip(),
        "summary": str(data.get("summary", "")).strip(),
        "severity": severity,
        "severity_label": str(data.get("severity_label", "")).strip(),
        "symptoms": _as_list(data.get("symptoms")),
        "causes": _as_list(data.get("causes")),
        "treatment": _as_list(data.get("treatment")),
        "prevention": _as_list(data.get("prevention")),
        "when_to_consult": str(data.get("when_to_consult", "")).strip(),
    }


def get_disease_info(raw_class: str, lang_code: str, generate_json, valid_classes) -> dict:
    """
    generate_json(prompt) -> str   (your Gemini call; may raise)
    valid_classes                  (CLASS_NAMES from model.py)
    Raises ValueError for an unknown class, or whatever Gemini raises.
    """
    if raw_class not in valid_classes:
        raise ValueError("Unknown disease class")
    lang_code = str(lang_code).lower().replace("_", "-").split("-")[0]
    if lang_code not in LANGUAGE_NAMES:
        lang_code = "en"

    key = (raw_class, lang_code)
    with _cache_lock:
        if key in _cache:
            return _cache[key]

    info = _clean(_extract_json(generate_json(build_prompt(raw_class, lang_code))))
    if not info["summary"]:
        raise RuntimeError("Gemini returned an empty answer")

    with _cache_lock:
        _cache[key] = info
    return info
