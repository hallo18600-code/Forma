"""Baut foods.json aus Open Food Facts (deutsche Produkte, beliebteste zuerst).
Daten: Open Food Facts, (c) Open Food Facts-Mitwirkende, ODbL 1.0."""
import duckdb, json, os, re, shutil, sys, urllib.request, datetime

URL = "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"
SRC = os.environ.get("OFF_CSV", "off.csv.gz")
LIMIT = int(os.environ.get("LIMIT", "100000"))
# NUR_PRUEFEN=1: vorhandene foods.json nur neu filtern (ohne Download)
NUR_PRUEFEN = os.environ.get("NUR_PRUEFEN") == "1"

if not NUR_PRUEFEN and not os.path.exists(SRC):
    req = urllib.request.Request(URL, headers={"User-Agent": "FORMA-foodbuilder/1.0 (Hobbyprojekt, GitHub Actions)"})
    with urllib.request.urlopen(req) as r, open(SRC, "wb") as f:
        shutil.copyfileobj(r, f)

N = lambda c: f'TRY_CAST("{c}" AS DOUBLE)'
sql = f"""
SELECT code, product_name, brands,
  {N('energy-kcal_100g')} kcal, {N('proteins_100g')} p, {N('carbohydrates_100g')} c, {N('fat_100g')} f,
  {N('sugars_100g')} s, {N('fiber_100g')} fi, {N('salt_100g')} sa, {N('saturated-fat_100g')} sf,
  TRY_CAST(nova_group AS INTEGER) nova
FROM read_csv('{SRC}', delim='\t', header=true, all_varchar=true, quote='', escape='', ignore_errors=true)
WHERE countries_tags LIKE '%en:germany%'
  AND regexp_matches(code, '^[0-9]{{8,14}}$')
  AND product_name IS NOT NULL AND trim(product_name) <> ''
  AND {N('energy-kcal_100g')} BETWEEN 0 AND 950
  AND coalesce({N('proteins_100g')},0) + coalesce({N('carbohydrates_100g')},0) + coalesce({N('fat_100g')},0) <= 105
ORDER BY coalesce(TRY_CAST(unique_scans_n AS INTEGER),0) DESC
LIMIT {LIMIT}
"""

# Plausibilitäts-Check: offensichtlich falsche Einträge aus Open Food Facts aussortieren
# (Makros zusammen über 100 g, Kalorien passen klar nicht zu den Makros, Teilwerte größer als das Ganze,
# unmögliche Salz-/Ballaststoffwerte, Nicht-Lebensmittel).
# Alkohol (7 kcal/g) und Zuckeralkohole/Süßstoffe (Erythrit, Xylit, Allulose) haben andere Kalorien, die bleiben drin.
SKIP = re.compile(r"(alkohol|bier|beer|wein|wine|sekt|prosecco|vodka|wodka|whisk|rum\b|gin\b|likör|likor|schnaps|spritz|cider|radler|champagne|lillet|aperol|bowle|pils|lager|kaugummi|gum|airwaves|wrigley|zuckerfrei|sugar ?free|xylit|erythrit|polyol|allulos|stevia|süßstoff|sweetener)", re.I)
SALZIG = re.compile(r"(salz|\bsel\b|\bsal\b|\bsale\b|salt|zout|brühe|bouillon|stock|cube|würfel|fond|caldo|suppe|aromat|würz|gewürz|spice|seasoning|rub\b|bbq|topping|mix|mischung|garšviela|ételízesítő|gusto|backpulver|bakepulver|natron|soja|soy|miso|fisch|fish|maggi|ankerkraut|just spices|ostmann|fuchs|kotányi|santa maria|club house|süßstoff|süssstoff|elektrolyt|boillon)", re.I)
FASER = re.compile(r"(flavour|flohsamen|psyllium|inulin|ballast|fiber|faser|kleie|chia|lein)", re.I)
KEIN_ESSEN = re.compile(r"(kosmetiktüch|taschentüch|küchentüch|spülmittel|waschmittel|windeln|shampoo|duschgel|zahnpasta)", re.I)
def plausible(name, brand, kcal, p, c, f, s=None, fi=None, sa=None, sf=None):
    txt = f"{name} {brand}"
    if KEIN_ESSEN.search(txt): return False
    if sa is not None and (sa > 100 or (sa > 25 and not SALZIG.search(txt))): return False
    if fi is not None and fi > 50 and not FASER.search(txt): return False
    if None in (p, c, f): return True          # unvollständig: nicht beurteilbar
    if p + c + f > 100.5: return False
    if SKIP.search(txt): return True
    calc = p * 4 + c * 4 + f * 9
    if kcal == 0 and calc >= 20: return False   # 0 kcal, aber deutlich Nährstoffe: Kalorien fehlen
    return not (max(kcal, calc) > 60 and abs(calc - kcal) > 80 and abs(calc - kcal) / max(kcal, calc) > 0.4)

r = lambda v: None if v is None else round(v, 1)
# Zucker ist Teil der Kohlenhydrate, gesättigte Fette Teil des Fetts: Tippfehler in den Daten auf das Ganze kürzen
kuerze = lambda teil, ganz: teil if None in (teil, ganz) else min(teil, ganz)
rows = []
if NUR_PRUEFEN:
    alt = json.load(open("foods.json", encoding="utf-8"))
    rows = [x for x in alt["rows"] if plausible(x[1], x[2] or "", x[3], x[4], x[5], x[6], x[7], x[8], x[9], x[10])]
    for x in rows: x[7] = kuerze(x[7], x[5]); x[10] = kuerze(x[10], x[6])
    print(len(alt["rows"]) - len(rows), "fehlerhafte Einträge entfernt")
    with open("foods.json", "w", encoding="utf-8") as fh:
        json.dump({**alt, "rows": rows}, fh, ensure_ascii=False, separators=(",", ":"))
    sys.exit(0)
for code, name, brands, kcal, p, c, f, s, fi, sa, sf, nova in duckdb.connect().execute(sql).fetchall():
    if not plausible(name, brands or "", kcal, p, c, f, s, fi, sa, sf): continue
    rows.append([code, name.strip()[:70], (brands or "").split(",")[0].strip()[:30], round(kcal), r(p), r(c), r(f), r(kuerze(s, c)), r(fi), r(sa), r(kuerze(sf, f)), nova])

if len(rows) < 1000:
    sys.exit(f"Zu wenige Produkte ({len(rows)}). Spalten oder Filter prüfen.")
with open("foods.json", "w", encoding="utf-8") as fh:
    json.dump({"v": 1, "src": "Open Food Facts (ODbL 1.0)", "built": datetime.date.today().isoformat(), "rows": rows}, fh, ensure_ascii=False, separators=(",", ":"))
print(len(rows), "Produkte,", round(os.path.getsize("foods.json") / 1e6, 1), "MB")
