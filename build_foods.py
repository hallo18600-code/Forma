"""Baut foods.json aus Open Food Facts (deutsche Produkte, beliebteste zuerst).
Spalten: Code, Name, Marke, kcal, Protein, Carbs, Fett, Zucker, Ballaststoffe, Salz, ges. Fett, NOVA (negativ = geschätzt), [1 = Kalorien unstimmig]
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

# ---------- Kalorien prüfen ----------
# Passen Kalorien und Makros (Protein/Carbs 4, Fett 9, Ballaststoffe 2 kcal/g) nicht zusammen, ist einer der Werte falsch.
#  - kcal-Feld enthält eigentlich kJ (häufiger Tippfehler): umrechnen
#  - kJ-Angabe passt zu den Makros, kcal nicht: kcal aus kJ nehmen
#  - sonst unklar, welcher Wert stimmt: Produkt bleibt, wird aber markiert (App zeigt „bitte mit Packung vergleichen“)
# Rückgabe: (kcal, Markierung 0/1)
def pruefe_kcal(name, brand, kcal, kj, p, c, f, fi):
    if None in (p, c, f) or SKIP.search(f"{name} {brand}"): return kcal, 0
    calc = p * 4 + c * 4 + f * 9 + (fi or 0) * 2
    nah = lambda a, b, rel, absol: abs(a - b) <= max(absol, rel * max(a, b))
    if calc < 30 and kcal < 60 or nah(kcal, calc, 0.2, 40): return kcal, 0
    # kJ im kcal-Feld: nur bei eindeutigem Verhältnis (≈ 4,184) und genug Kalorien, sonst zu unsicher
    if kcal >= 120 and calc >= 30 and 3.8 <= kcal / calc <= 4.6: return round(kcal / 4.184), 0
    if kj and kj > 0 and calc >= 30:
        kk = kj / 4.184
        if nah(kk, calc, 0.12, 20) and not nah(kk, kcal, 0.12, 20): return round(kk), 0
    return kcal, 1

# ---------- Verarbeitungsgrad (NOVA) schätzen ----------
# Rund ein Drittel der Produkte hat keinen NOVA-Wert. Ein kleines lernendes Modell (Naive Bayes) schätzt ihn aus
# Name, Marke und Nährwerten – gelernt an den Produkten MIT Wert. Gespeichert wird die Schätzung nur, wenn das Modell
# sehr sicher ist (Wahrscheinlichkeit ab NOVA_SICHER), und zwar als negative Zahl (-4 = „geschätzt 4“).
# Die Treffsicherheit wird bei jedem Build per Kreuzvalidierung gemessen und ausgegeben.
import math, unicodedata, collections, random
NOVA_SICHER = 0.85
def _norm(t):
    t = unicodedata.normalize("NFD", (t or "").lower())
    return "".join(ch for ch in t if unicodedata.category(ch) != "Mn").replace("ß", "ss")
def _merkmale(x):
    f = {"w:" + w for w in re.split(r"[^a-z0-9]+", _norm(x[1])) if len(w) >= 3 and not w.isdigit()}
    b = _norm(x[2]).strip()
    if b: f.add("b:" + b)
    stufe = lambda v, grenzen: "na" if v is None else str(sum(v >= g for g in grenzen))
    for k, i, g in (("kc", 3, (50, 150, 300, 450)), ("pr", 4, (3, 8, 15, 25)), ("fa", 6, (1, 5, 15, 30)), ("su", 7, (1, 5, 15, 30)), ("fi", 8, (1, 3, 6)), ("sa", 9, (0.1, 0.5, 1.2, 2))):
        f.add(k + ":" + stufe(x[i], g))
    return f
def _lerne(daten):
    zahl = {k: collections.Counter() for k in (1, 2, 3, 4)}; prior = collections.Counter()
    for f, y in daten:
        prior[y] += 1; zahl[y].update(f)
    return zahl, prior, set().union(*zahl.values())
def _rate(m, f):
    zahl, prior, vok = m; n = sum(prior.values()); lp = {}
    for k in (1, 2, 3, 4):
        if not prior[k]: continue
        lp[k] = math.log(prior[k] / n) + sum(math.log((zahl[k][t] + 0.5) / (prior[k] + 1)) for t in f if t in vok)
    mx = max(lp.values()); z = sum(math.exp(v - mx) for v in lp.values())
    k = max(lp, key=lp.get); return k, math.exp(lp[k] - mx) / z
def schaetze_nova(rows):
    for x in rows:                       # alte Schätzungen verwerfen, nur echte Werte lernen
        if x[11] is not None and x[11] < 0: x[11] = None
    daten = [(_merkmale(x), x[11]) for x in rows if x[11]]
    if len(daten) < 2000: return
    random.Random(7).shuffle(daten)
    test, lern = daten[::5], [d for i, d in enumerate(daten) if i % 5]
    m = _lerne(lern); sicher = [(k, y) for k, p, y in ((*_rate(m, f), y) for f, y in test) if p >= NOVA_SICHER]
    if sicher:
        treffer = sum(k == y for k, y in sicher) / len(sicher)
        als4 = [y for k, y in sicher if k == 4]
        print(f"NOVA-Schätzung (Test an {len(test)} Produkten mit Wert): sicher bei {len(sicher)/len(test):.0%}, davon richtig {treffer:.1%}, "
              f"„stark verarbeitet“ richtig {sum(y == 4 for y in als4)/max(1, len(als4)):.1%}")
        if treffer < 0.85: print("Treffsicherheit zu niedrig – keine NOVA-Schätzung gespeichert"); return
    m = _lerne(daten); n = 0
    for x in rows:
        if not x[11]:
            k, p = _rate(m, _merkmale(x))
            if p >= NOVA_SICHER: x[11] = -k; n += 1
    print(n, "fehlende NOVA-Werte geschätzt")

def fertig(rows):
    """Gemeinsamer letzter Schritt: Kalorien-Markierung (Spalte 12, nur wenn 1) und NOVA-Schätzung."""
    schaetze_nova(rows)
    print(sum(1 for x in rows if len(x) > 12 and x[12]), "Produkte mit unstimmigen Kalorien markiert")
# Zucker ist Teil der Kohlenhydrate, gesättigte Fette Teil des Fetts: Tippfehler in den Daten auf das Ganze kürzen
kuerze = lambda teil, ganz: teil if None in (teil, ganz) else min(teil, ganz)
rows = []
if NUR_PRUEFEN:
    alt = json.load(open("foods.json", encoding="utf-8"))
    for x in alt["rows"]:
        del x[12:]
        x[3], warn = pruefe_kcal(x[1], x[2] or "", x[3], None, x[4], x[5], x[6], x[8])
        if warn: x.append(1)
    rows = [x for x in alt["rows"] if plausible(x[1], x[2] or "", x[3], x[4], x[5], x[6], x[7], x[8], x[9], x[10])]
    for x in rows: x[7] = kuerze(x[7], x[5]); x[10] = kuerze(x[10], x[6])
    print(len(alt["rows"]) - len(rows), "fehlerhafte Einträge entfernt")
    fertig(rows)
    with open("foods.json", "w", encoding="utf-8") as fh:
        json.dump({**alt, "rows": rows}, fh, ensure_ascii=False, separators=(",", ":"))
    sys.exit(0)
import duckdb
for code, name, brands, kcal, kj, p, c, f, s, fi, sa, sf, nova in duckdb.connect().execute(sql).fetchall():
    kcal, warn = pruefe_kcal(name, brands or "", kcal, kj, p, c, f, fi)
    if not plausible(name, brands or "", kcal, p, c, f, s, fi, sa, sf): continue
    row = [code, name.strip()[:70], (brands or "").split(",")[0].strip()[:30], round(kcal), r(p), r(c), r(f), r(kuerze(s, c)), r(fi), r(sa), r(kuerze(sf, f)), nova if nova and 1 <= nova <= 4 else None]
    if warn: row.append(1)
    rows.append(row)
fertig(rows)

if len(rows) < 1000:
    sys.exit(f"Zu wenige Produkte ({len(rows)}). Spalten oder Filter prüfen.")
with open("foods.json", "w", encoding="utf-8") as fh:
    json.dump({"v": 1, "src": "Open Food Facts (ODbL 1.0)", "built": datetime.date.today().isoformat(), "rows": rows}, fh, ensure_ascii=False, separators=(",", ":"))
print(len(rows), "Produkte,", round(os.path.getsize("foods.json") / 1e6, 1), "MB")
