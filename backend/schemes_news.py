"""
Agricultural schemes news
=========================
1. Fetch REAL recent headlines from Google News RSS (no API key needed).
2. Ask Gemini to (a) keep only headlines about farm schemes / subsidies / MSP /
   insurance / credit, (b) translate them, (c) tag the scheme name, (d) write a
   short overview using ONLY those headlines.

Why not just ask Gemini "what are the latest schemes?"  Because an LLM answers
from training data, so it would invent or repeat stale news.  Here Gemini never
supplies facts, links, sources or dates: those always come from the RSS feed.
It only filters, translates and summarises what the feed returned.

If Gemini is unavailable the caller still gets the original headlines.
"""

import json
import re
import threading
import time
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from urllib.parse import quote

import requests

LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "mr": "Marathi"}

# topic key -> Google News search query
TOPICS = {
    "all": '(farmers OR agriculture) (scheme OR yojana OR subsidy) India',
    "pmkisan": '"PM-KISAN" OR "PM Kisan Samman Nidhi"',
    "insurance": '"Pradhan Mantri Fasal Bima Yojana" OR "crop insurance" India',
    "credit": '"Kisan Credit Card" OR "agriculture loan" OR "farm loan waiver"',
    "msp": '"minimum support price" OR MSP kharif OR rabi',
    "maharashtra": 'Maharashtra farmers scheme OR subsidy OR yojana',
}

HEADLINES_TTL = 15 * 60      # seconds: how long fetched headlines are reused
RESULT_TTL = 30 * 60         # seconds: how long a finished (translated) result is reused
MAX_FETCH = 12               # headlines sent to Gemini
MAX_SHOW = 8                 # headlines shown to the user

_lock = threading.Lock()
_headline_cache: dict = {}   # topic -> (timestamp, [headlines])
_result_cache: dict = {}     # (topic, lang) -> (timestamp, result)


# ── 1. RSS ──────────────────────────────────────────────────────────────────
def _rss_url(query: str) -> str:
    return ("https://news.google.com/rss/search?q=" + quote(query + " when:14d")
            + "&hl=en-IN&gl=IN&ceid=IN:en")


def parse_rss(xml_bytes: bytes) -> list:
    root = ET.fromstring(xml_bytes)
    items, seen = [], set()
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        src_el = it.find("source")
        source = (src_el.text or "").strip() if src_el is not None and src_el.text else ""
        if not title or not link.startswith(("http://", "https://")):
            continue
        # Google appends " - Publisher" to every title
        if source and title.endswith(" - " + source):
            title = title[: -len(source) - 3].strip()
        key = re.sub(r"\W+", " ", title.lower()).strip()
        if key in seen:
            continue
        seen.add(key)
        published = ""
        try:
            published = parsedate_to_datetime(it.findtext("pubDate")).date().isoformat()
        except Exception:
            pass
        items.append({"title": title, "link": link, "source": source, "date": published})
    return items


def fetch_headlines(topic: str, http_get=requests.get) -> list:
    if topic not in TOPICS:
        raise ValueError("Unknown topic")
    now = time.time()
    with _lock:
        hit = _headline_cache.get(topic)
        if hit and now - hit[0] < HEADLINES_TTL:
            return hit[1]
    resp = http_get(_rss_url(TOPICS[topic]), timeout=8,
                    headers={"User-Agent": "Mozilla/5.0 (DharaAI news fetcher)"})
    resp.raise_for_status()
    items = parse_rss(resp.content)[:MAX_FETCH]
    with _lock:
        _headline_cache[topic] = (now, items)
    return items


# ── 2. Gemini: filter + translate + tag + overview ─────────────────────────
def build_prompt(headlines: list, lang_code: str) -> str:
    lang = LANGUAGE_NAMES.get(lang_code, "English")
    numbered = "\n".join(f"{i}. {h['title']}  [{h['source']}]" for i, h in enumerate(headlines))
    return f"""You help Indian farmers follow news about agricultural schemes.
Below are news headlines. Use ONLY these headlines; do not add facts, dates,
amounts or eligibility rules that are not written in them.

{numbered}

Return ONLY a JSON object:
{{
  "items": [{{"i": <number of the headline>, "title": "headline in {lang}", "tag": "scheme name if the headline names one, else empty"}}],
  "overview": "2-3 simple sentences in {lang} summarising what these headlines say"
}}

Rules:
- Keep only headlines about farm schemes, subsidies, MSP, crop insurance, farm credit
  or farmer-welfare policy. Drop everything else (politics, protests, stock news...).
- At most {MAX_SHOW} items, most useful for farmers first.
- Translate faithfully into simple {lang}. Keep scheme names such as PM-KISAN as written.
- If nothing is relevant, return {{"items": [], "overview": ""}}.
- No markdown, nothing outside the JSON.
"""


def _extract_json(text: str) -> dict:
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", (text or "").strip(), flags=re.I)
    a, b = text.find("{"), text.rfind("}")
    if a == -1 or b == -1:
        raise ValueError("Gemini did not return JSON")
    return json.loads(text[a:b + 1])


def localize(headlines: list, lang_code: str, generate_json) -> dict:
    """Run inside safe_gemini. Raises on any Gemini failure."""
    lang_code = lang_code if lang_code in LANGUAGE_NAMES else "en"
    data = _extract_json(generate_json(build_prompt(headlines, lang_code)))
    out, used = [], set()
    for row in data.get("items", []):
        try:
            i = int(row["i"])
        except (KeyError, TypeError, ValueError):
            continue
        if not 0 <= i < len(headlines) or i in used:
            continue
        used.add(i)
        h = headlines[i]
        # link / source / date always come from the feed, never from Gemini
        out.append({
            "title": str(row.get("title") or h["title"]).strip(),
            "tag": str(row.get("tag") or "").strip(),
            "link": h["link"], "source": h["source"], "date": h["date"],
        })
        if len(out) >= MAX_SHOW:
            break
    return {"items": out, "overview": str(data.get("overview") or "").strip()}


def raw_result(headlines: list) -> dict:
    """Fallback when Gemini is unavailable: original headlines, untranslated."""
    return {
        "items": [{"title": h["title"], "tag": "", "link": h["link"],
                   "source": h["source"], "date": h["date"]} for h in headlines[:MAX_SHOW]],
        "overview": "",
    }


# ── result cache helpers (used by the endpoint) ─────────────────────────────
def cached_result(topic: str, lang: str):
    with _lock:
        hit = _result_cache.get((topic, lang))
        if hit and time.time() - hit[0] < RESULT_TTL:
            return hit[1]
    return None


def store_result(topic: str, lang: str, result: dict) -> None:
    with _lock:
        _result_cache[(topic, lang)] = (time.time(), result)
