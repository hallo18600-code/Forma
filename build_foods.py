"""Baut foods.json aus Open Food Facts (deutsche Produkte, beliebteste zuerst).
Spalten: Code, Name, Marke, kcal, Protein, Carbs, Fett, Zucker, Ballaststoffe, Salz, ges. Fett, NOVA, [Bits: 1 = Kalorien unstimmig, 2 = ml, 4 = g]
Es wird nichts geschätzt: fehlt ein Wert in Open Food Facts, bleibt er leer.
Ausnahme ohne Schätzung: fehlt Salz, steht aber Natrium da, gilt Salz = Natrium × 2,5 (so ist „Salz“ in der LMIV definiert).
Fehlen Protein, Kohlenhydrate oder Fett ganz, kommt das Produkt nicht in die Liste (sonst stünde dort fälschlich 0 g).
Daten: Open Food Facts, (c) Open Food Facts-Mitwirkende, ODbL 1.0."""
import json, os, re, shutil, sys, urllib.request, datetime

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
  {N('energy-kcal_100g')} kcal, coalesce({N('energy-kj_100g')}, {N('energy_100g')}) kj, {N('proteins_100g')} p, {N('carbohydrates_100g')} c, {N('fat_100g')} f,
  {N('sugars_100g')} s, {N('fiber_100g')} fi, {N('salt_100g')} sa, {N('sodium_100g')} na, {N('saturated-fat_100g')} sf,
  TRY_CAST(nova_group AS INTEGER) nova, quantity
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
    if None in (p, c, f): return False         # Protein, Kohlenhydrate oder Fett fehlen: Die App müsste 0 g anzeigen – lieber weglassen als schätzen
    if p + c + f > 100.5: return False
    # Protein (4 kcal/g) und Fett (9 kcal/g) liefern sicher Energie: deutlich weniger Kalorien sind unmöglich (Platzhalter- oder Tippfehler)
    if kcal < 0.5 * (p * 4 + f * 9) - 5: return False
    if SKIP.search(txt): return True
    calc = p * 4 + c * 4 + f * 9
    if kcal == 0 and calc >= 20: return False   # 0 kcal, aber deutlich Nährstoffe: Kalorien fehlen
    return not (max(kcal, calc) > 60 and abs(calc - kcal) > 80 and abs(calc - kcal) / max(kcal, calc) > 0.4)

r = lambda v: None if v is None else round(v, 1)

# ---------- Kalorien prüfen ----------
# Passen Kalorien und Makros (Protein/Carbs 4, Fett 9, Ballaststoffe 2 kcal/g) nicht zusammen, ist einer der Werte falsch.
#  - kJ-Angabe passt zu den Makros, kcal nicht: kcal aus kJ nehmen
#  - sonst unklar, welcher Wert stimmt: Produkt bleibt, wird aber markiert (App zeigt „bitte mit Packung vergleichen“)
# Rückgabe: (kcal, Markierung 0/1)
def pruefe_kcal(name, brand, kcal, kj, p, c, f, fi):
    if None in (p, c, f): return kcal, 0
    # Weniger Kalorien, als allein Protein und Fett liefern: sicher ein Fehler (gilt auch für Alkohol und Süßstoff-Produkte)
    if kcal < 0.75 * (p * 4 + f * 9) - 5: return kcal, 1
    if SKIP.search(f"{name} {brand}"): return kcal, 0
    calc = p * 4 + c * 4 + f * 9 + (fi or 0) * 2
    nah = lambda a, b, rel, absol: abs(a - b) <= max(absol, rel * max(a, b))
    if calc < 30 and kcal < 60 or nah(kcal, calc, 0.2, 40): return kcal, 0
    # Nur echte Angaben verwenden: passt die kJ-Angabe der Packung zu den Makros, die kcal-Angabe aber nicht, gilt die kJ-Angabe
    if kj and kj > 0 and calc >= 30:
        kk = kj / 4.184
        if nah(kk, calc, 0.12, 20) and not nah(kk, kcal, 0.12, 20): return round(kk), 0
    return kcal, 1

# ---------- Einheit: Milliliter oder Gramm ----------
# Aus der Packungsangabe („500 ml“, „1,5 l“, „250 g“) – nicht aus dem Namen geraten.
ML = re.compile(r"\d\s*(ml|cl|dl|l|ltr|liter|litre)\b", re.I)
GR = re.compile(r"\d\s*(g|gr|kg|gramm)\b", re.I)
def einheit(menge):
    """2 = Milliliter, 4 = Gramm, 0 = unbekannt (Bits in Spalte 12)"""
    m = (menge or "").lower()
    if ML.search(m): return 2
    if GR.search(m): return 4
    return 0

def fertig(rows):
    """Gemeinsamer letzter Schritt: nur echte Werte (alte Schätzungen weg), Spalte 12 nur wenn nicht 0."""
    for x in rows:
        if x[11] is not None and x[11] < 0: x[11] = None
        if len(x) > 12 and not x[12]: del x[12:]
    print(sum(1 for x in rows if len(x) > 12 and x[12] & 1), "Produkte mit unstimmigen Kalorien markiert,",
          sum(1 for x in rows if len(x) > 12 and x[12] & 2), "in ml,", sum(1 for x in rows if len(x) > 12 and x[12] & 4), "in g")
# Zucker ist Teil der Kohlenhydrate, gesättigte Fette Teil des Fetts: Tippfehler in den Daten auf das Ganze kürzen
kuerze = lambda teil, ganz: teil if None in (teil, ganz) else min(teil, ganz)
rows = []
if NUR_PRUEFEN:
    alt = json.load(open("foods.json", encoding="utf-8"))
    for x in alt["rows"]:
        bits = (x[12] if len(x) > 12 else 0) & 6          # Einheit behalten (kommt nur aus dem großen Build)
        del x[12:]
        x[3], warn = pruefe_kcal(x[1], x[2] or "", x[3], None, x[4], x[5], x[6], x[8])
        x.append(bits | (1 if warn else 0))
    rows = [x for x in alt["rows"] if plausible(x[1], x[2] or "", x[3], x[4], x[5], x[6], x[7], x[8], x[9], x[10])]
    for x in rows: x[7] = kuerze(x[7], x[5]); x[10] = kuerze(x[10], x[6])
    print(len(alt["rows"]) - len(rows), "fehlerhafte Einträge entfernt")
    fertig(rows)
    with open("foods.json", "w", encoding="utf-8") as fh:
        json.dump({**alt, "rows": rows}, fh, ensure_ascii=False, separators=(",", ":"))
    sys.exit(0)
import duckdb
for code, name, brands, kcal, kj, p, c, f, s, fi, sa, na, sf, nova, menge in duckdb.connect().execute(sql).fetchall():
    # Salz fehlt, Natrium steht drauf: Salz = Natrium × 2,5 (gesetzliche Definition, LMIV Anhang I Nr. 11) – keine Schätzung
    kcal, warn = pruefe_kcal(name, brands or "", kcal, kj, p, c, f, fi)
    if sa is None and na is not None and na >= 0 and plausible(name, brands or "", kcal, p, c, f, s, fi, na * 2.5, sf): sa = na * 2.5
    if not plausible(name, brands or "", kcal, p, c, f, s, fi, sa, sf): continue
    row = [code, name.strip()[:70], (brands or "").split(",")[0].strip()[:30], round(kcal), r(p), r(c), r(f), r(kuerze(s, c)), r(fi), r(sa), r(kuerze(sf, f)), nova if nova and 1 <= nova <= 4 else None]
    row.append((1 if warn else 0) | einheit(menge))
    rows.append(row)
fertig(rows)

if len(rows) < 1000:
    sys.exit(f"Zu wenige Produkte ({len(rows)}). Spalten oder Filter prüfen.")
with open("foods.json", "w", encoding="utf-8") as fh:
    json.dump({"v": 1, "src": "Open Food Facts (ODbL 1.0)", "built": datetime.date.today().isoformat(), "rows": rows}, fh, ensure_ascii=False, separators=(",", ":"))
print(len(rows), "Produkte,", round(os.path.getsize("foods.json") / 1e6, 1), "MB")
