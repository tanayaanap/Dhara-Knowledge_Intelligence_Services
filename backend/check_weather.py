"""
Run from your backend folder:   python check_weather.py            (uses the location saved in your DB)
                                python check_weather.py "Pune"      (test a specific location)
Shows exactly where the weather lookup breaks: no saved location, geocoding, or the weather API.
"""
import sys, os, time, glob, sqlite3, datetime, requests

# 1) What location does each user have saved?
print("== Saved locations in the database ==")
dbs = glob.glob("instance/*.db") + glob.glob("*.db")
locs = []
for db in dbs:
    try:
        rows = sqlite3.connect(db).execute("SELECT email, location FROM user").fetchall()
        for email, loc in rows:
            print(f"  {db}: {email!r:35} location={loc!r}")
            if loc: locs.append(loc)
    except Exception as e:
        print(f"  {db}: (no user table) {e}")
if not dbs:
    print("  no .db file found here -- run this from the backend folder")

targets = [sys.argv[1]] if len(sys.argv) > 1 else (locs[:2] or ["Pune"])

def geocode(name):
    t = time.perf_counter()
    r = requests.get("https://geocoding-api.open-meteo.com/v1/search",
                     params={"name": name, "count": 1, "language": "en", "format": "json"}, timeout=20)
    res = (r.json().get("results") or [None])[0]
    print(f"   geocode {name!r}: {time.perf_counter()-t:.2f}s ->",
          f"{res['name']}, {res.get('admin1')}, {res.get('country')} ({res['latitude']}, {res['longitude']})" if res else "NO RESULT")
    return (res["latitude"], res["longitude"]) if res else (None, None)

for loc in targets:
    print(f"\n== Testing location {loc!r} ==")
    lat, lon = geocode(loc)
    if lat is None and "," in loc:
        print("   full string failed, trying the part before the comma...")
        lat, lon = geocode(loc.split(",")[0].strip())
    if lat is None:
        print("   >>> GEOCODING FAILED: this is why you see defaults. Save a simpler location (just the city name) in Profile.")
        continue
    end = datetime.date.today(); start = end - datetime.timedelta(days=365)
    t = time.perf_counter()
    r = requests.get("https://archive-api.open-meteo.com/v1/archive", params={
        "latitude": lat, "longitude": lon, "start_date": str(start), "end_date": str(end),
        "daily": "temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum", "timezone": "auto"}, timeout=40)
    body = r.json()
    print(f"   archive: HTTP {r.status_code} in {time.perf_counter()-t:.2f}s")
    if body.get("error"):
        print("   >>> WEATHER API ERROR:", body.get("reason")); continue
    d = body.get("daily", {})
    temps = [x for x in d.get("temperature_2m_mean") or [] if x is not None]
    hums  = [x for x in d.get("relative_humidity_2m_mean") or [] if x is not None]
    rains = [x for x in d.get("precipitation_sum") or [] if x is not None]
    print(f"   days with data: temp={len(temps)} humidity={len(hums)} rain={len(rains)}")
    if temps:
        print(f"   RESULT  temp={sum(temps[-30:])/len(temps[-30:]):.1f}C  "
              f"humidity={(sum(hums[-30:])/len(hums[-30:])) if hums else 'n/a'}  rain={sum(rains):.0f}mm/yr")