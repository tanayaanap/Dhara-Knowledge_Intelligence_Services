"""
fast_helpers.py — drop next to app.py.  Speed-ups for DharaAI.

  timed(label)                     -> prints how long a step takes (find the real bottleneck)
  start_climate_fetch(loc, fn)     -> runs the weather API call in the background + caches it
  ocr_image(img, pytesseract)      -> downsizes big photos before Tesseract (biggest OCR win)
"""
import os
import json
import time
import datetime
import threading
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

_executor = ThreadPoolExecutor(max_workers=8)          # weather only
_gemini_executor = ThreadPoolExecutor(max_workers=4)   # Gemini only -- a hung Gemini call can never block weather


# ── 1. Timing ────────────────────────────────────────────────────────────────
@contextmanager
def timed(label: str):
    t0 = time.perf_counter()
    try:
        yield
    finally:
        print(f"[TIMING] {label}: {time.perf_counter() - t0:.2f}s", flush=True)


# ── 2. Climate: cache + run in background ────────────────────────────────────
_CLIMATE_CACHE = {}
_CACHE_LOCK = threading.Lock()


_CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "climate_cache.json")
_LAST_GOOD = {}          # location -> last successful climate result (survives restarts)
try:
    with open(_CACHE_FILE, encoding="utf-8") as _f:
        _LAST_GOOD = json.load(_f)
except Exception:
    _LAST_GOOD = {}


def _save_last_good():
    try:
        with open(_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_LAST_GOOD, f)
    except Exception as e:
        print("[Climate] could not save cache file:", e, flush=True)


def _fetch_with_variants(location: str, fetch_fn):
    """Try the location as typed, then just the part before the first comma
    ("Pune, Maharashtra" -> "Pune"; Open-Meteo geocoding often finds nothing for the full string)."""
    variants = [location]
    first = location.split(",")[0].strip()
    if first and first != location:
        variants.append(first)
    result = None
    for v in variants:
        result = fetch_fn(v)
        if result.get("location_used"):
            return result
    return result


def _cached_climate(location: str, fetch_fn):
    loc_key = (location or "").strip().lower()
    key = (loc_key, datetime.date.today().isoformat())
    with _CACHE_LOCK:
        hit = _CLIMATE_CACHE.get(key)
    if hit is not None:
        return hit

    result = _fetch_with_variants((location or "").strip(), fetch_fn) if loc_key else fetch_fn(location)

    if result.get("location_used"):
        with _CACHE_LOCK:
            _CLIMATE_CACHE[key] = result
            _LAST_GOOD[loc_key] = result
        _save_last_good()
        return result

    # Live fetch failed -> reuse the last good value for this location (even from an
    # earlier day / earlier run) instead of showing neutral defaults.
    stale = _LAST_GOOD.get(loc_key) if loc_key else None
    if stale:
        print(f"[Climate] live fetch failed for '{location}' -> using last saved values", flush=True)
        out = dict(stale)
        out["stale"] = True
        return out
    if loc_key:
        print(f"[Climate] could not get weather for '{location}' (geocoding/API failed) -> defaults", flush=True)
    return result


def start_climate_fetch(location: str, fetch_fn):
    """Returns a Future. Call .result() when you actually need the climate.
    NOTE: read `location` from the Flask session BEFORE calling this
    (threads don't have access to the request/session)."""
    return _executor.submit(_cached_climate, location, fetch_fn)


# ── 3. OCR: shrink the image first ───────────────────────────────────────────
def prep_for_ocr(img: Image.Image, max_side: int = 2000) -> Image.Image:
    img = img.convert("L")
    w, h = img.size
    scale = max_side / max(w, h)
    if scale < 1:
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    return img


def ocr_image(img: Image.Image, pytesseract, max_side: int = 2000) -> str:
    with timed("tesseract"):
        return pytesseract.image_to_string(
            prep_for_ocr(img, max_side),
            config="--oem 1 --psm 6",
            timeout=40,           # never hang the request forever
        )


# ── 4. Hard time limits (a slow API can never hang a request again) ──────────
def call_with_timeout(fn, seconds: float, *args, **kwargs):
    """Run fn in a worker thread; raise TimeoutError if it takes longer than `seconds`."""
    fut = _gemini_executor.submit(fn, *args, **kwargs)
    return fut.result(timeout=seconds)


CLIMATE_DEFAULTS = {"temperature": 25.0, "humidity": 70.0, "rainfall": 100.0,
                    "location_used": None}


def climate_or_default(future, timeout: float = 20.0) -> dict:
    """Wait at most `timeout` seconds for the weather; otherwise use neutral defaults."""
    try:
        return future.result(timeout=timeout)
    except Exception as e:
        print(f"[Climate] gave up after {timeout}s -> using defaults ({type(e).__name__})", flush=True)
        return dict(CLIMATE_DEFAULTS)


# ── 5. Gemini circuit breaker ────────────────────────────────────────────────
# After a timeout / rate-limit (429) / quota error, stop calling Gemini for a
# while so requests answer instantly from the offline fallback instead of waiting.
_gemini_block_until = 0.0


_gemini_last_error = {"message": None, "at": None}


def _record_error(msg: str):
    _gemini_last_error["message"] = msg[:400]
    _gemini_last_error["at"] = datetime.datetime.now().strftime("%H:%M:%S")


def gemini_status() -> dict:
    remaining = max(0, int(_gemini_block_until - time.time()))
    return {
        "available": remaining == 0,
        "blocked_for_seconds": remaining,
        "last_error": _gemini_last_error["message"],
        "last_error_at": _gemini_last_error["at"],
    }


def reset_gemini_breaker():
    global _gemini_block_until
    _gemini_block_until = 0.0


def gemini_available() -> bool:
    return time.time() >= _gemini_block_until


def _trip_gemini(seconds: float, reason: str):
    global _gemini_block_until
    _gemini_block_until = time.time() + seconds
    print(f"[GEMINI] disabled for {int(seconds)}s ({reason})", flush=True)


def safe_gemini(fn, timeout: float, *args, **kwargs):
    """Call a Gemini function with a hard time cap + circuit breaker."""
    if not gemini_available():
        raise RuntimeError("Gemini temporarily disabled (cooldown after an earlier failure)")
    try:
        return call_with_timeout(fn, timeout, *args, **kwargs)
    except Exception as e:
        msg = f"{type(e).__name__}: {e}"
        low = msg.lower()
        if "429" in low or "rate limit" in low or "quota" in low or "resource_exhausted" in low:
            _record_error(msg)
            _trip_gemini(3600, "rate limit / daily quota")
        elif type(e).__name__ in ("TimeoutError", "Timeout") or "timed out" in low:
            _record_error(f"TimeoutError: no answer within {timeout}s")
            _trip_gemini(30, f"no answer within {timeout}s")   # short pause only
        else:
            _record_error(msg)
        raise