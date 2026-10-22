"""Baut foods.json aus Open Food Facts (deutsche Produkte, beliebteste zuerst).
Daten: Open Food Facts, (c) Open Food Facts-Mitwirkende, ODbL 1.0."""
import duckdb, json, os, re, shutil, sys, urllib.request, datetime

URL = "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"
SRC = os.environ.get("OFF_CSV", "off.csv.gz")
LIMIT = int(os.environ.get("LIMIT", "100000"))

if not os.path.exists(SRC):
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
# (Makros zusammen über 100 g, oder Kalorien passen klar nicht zu den Makros).
# Alkohol (7 kcal/g) und Zuckeralkohole (Kaugummi, zuckerfrei) haben andere Kalorien, die bleiben drin.
SKIP = re.compile(r"(alkohol|bier|beer|wein|wine|sekt|prosecco|vodka|wodka|whisk|rum\b|gin\b|likör|likor|schnaps|spritz|cider|radler|champagne|lillet|aperol|bowle|pils|lager|kaugummi|gum|airwaves|wrigley|zuckerfrei|sugar ?free|xylit|erythrit|polyol)", re.I)
def plausible(name, brand, kcal, p, c, f):
    if None in (p, c, f): return True          # unvollständig: nicht beurteilbar
    if p + c + f > 100.5: return False
    if SKIP.search(f"{name} {brand}"): return True
    calc = p * 4 + c * 4 + f * 9
    return not (max(kcal, calc) > 60 and abs(calc - kcal) > 80 and abs(calc - kcal) / max(kcal, calc) > 0.4)

r = lambda v: None if v is None else round(v, 1)
rows = []
for code, name, brands, kcal, p, c, f, s, fi, sa, sf, nova in duckdb.connect().execute(sql).fetchall():
    if not plausible(name, brands or "", kcal, p, c, f): continue
    rows.append([code, name.strip()[:70], (brands or "").split(",")[0].strip()[:30], round(kcal), r(p), r(c), r(f), r(s), r(fi), r(sa), r(sf), nova])

if len(rows) < 1000:
    sys.exit(f"Zu wenige Produkte ({len(rows)}). Spalten oder Filter prüfen.")
with open("foods.json", "w", encoding="utf-8") as fh:
    json.dump({"v": 1, "src": "Open Food Facts (ODbL 1.0)", "built": datetime.date.today().isoformat(), "rows": rows}, fh, ensure_ascii=False, separators=(",", ":"))
print(len(rows), "Produkte,", round(os.path.getsize("foods.json") / 1e6, 1), "MB")
