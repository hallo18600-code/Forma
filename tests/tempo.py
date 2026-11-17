"""Prüft die Geschwindigkeits-Abkürzungen der App: Sie dürfen nie ein anderes Ergebnis liefern als die volle Rechnung.

- Produktsuche: Weiterfiltern beim Tippen (Buchstabe für Buchstabe) = komplette Suche
- Bewertung: gemerkte Bewertung = frisch gerechnete Bewertung, auch nach Ziel- oder Fragebogen-Änderung
- Art-Erkennung: gemerktes Ergebnis = frisch erkannt
- Hautanalyse: mit Zwischenspeicher gleiche Auffälligkeiten wie ganz frisch gerechnet
- Tages-Datum: addDays mit Zwischenspeicher = direkte Rechnung

Lokal starten (im Repo-Ordner):
  python3 -m http.server 8765 &
  python3 tests/tempo.py
"""
import os, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get("APP_URL", "http://localhost:8765/index.html")

CHECK = r"""()=>{
 const F=[]; const fail=(k,ex)=>F.push(k+": "+ex); let n=0;
 // 1) Suche: volle Suche ohne Abkürzungen
 function full(q,limit){ const ts=qTokens(q); if(!ts.length) return []; const res=[];
  for(let i=0;i<FOODDB.lc.length;i++){ const s=FOODDB.lc[i]; let sc=0, ok=true; for(const w of ts){ const p=s.indexOf(w); if(p<0){ ok=false; break; } sc+=p===0?3:(s[p-1]===" "?2:0); } if(!ok) continue;
   const nm=FOODDB.nm[i]; if(nm.startsWith(ts[0])) sc+=2; sc-=Math.min(nm.length,60)/60; const r=FOODDB.rows[i]; if((r[7]==null&&(r[5]||0)>0.5)||r[9]==null) sc-=1.5; res.push([sc,i]); }
  res.sort((x,y)=>y[0]-x[0]||x[1]-y[1]); return res.slice(0,limit||30).map(r=>FOODDB.rows[r[1]][0]).join(); }
 // Suchtexte gleich wie in der Datenbank aufbereitet?
 for(let i=0;i<FOODDB.rows.length;i+=97){ const x=FOODDB.rows[i]; n++;
  if(FOODDB.nm[i]!==NORM(x[1])||FOODDB.lc[i]!==NORM(x[1]+" "+(x[2]||""))) { fail("Suchtext anders aufbereitet",x[1]); break; } }
 const words=["haferflocken","skyr natur","coca cola zero","müsli","vollkornbrot","käse","milch 1,5","apfelsaft","ja! milch","über","äpfel","nutella","chips paprika","monster energy","rinderhack","haehnchen"];
 dbLast=null;
 for(const w of words){
  for(let k=1;k<=w.length;k++){ const q=w.slice(0,k); for(const lim of [30,60]){ n++; if(full(q,lim)!==dbSearch(q,lim).map(x=>x.bc).join()) fail("Suche beim Tippen anders als volle Suche",q+" ("+lim+")"); } }
  for(let k=w.length;k>=1;k--){ const q=w.slice(0,k); n++; if(full(q,30)!==dbSearch(q,30).map(x=>x.bc).join()) fail("Suche beim Löschen anders als volle Suche",q); }
 }
 // 2) Bewertung & Art-Erkennung: gemerkt = frisch
 const P0=JSON.parse(JSON.stringify(state.profile)), A0=JSON.parse(JSON.stringify(state.coach.answers||{}));
 const items=[...BASE_FOODS.slice(0,120)]; ["joghurt","cola","brot","wurst","magnesium","protein","saft","chips","lachs","tofu"].forEach(q=>dbSearch(q,25).forEach(x=>items.push(x)));
 const answers=[{}, {gesundheit:{stil:"Vegetarisch",meiden:["Zucker"]}}, {haut:{stoert:["Unreinheiten"]},gesundheit:{trink:"Täglich"}}];
 for(const g of ["muscle","lose","skin","energy"]) for(const A of answers){
  state.profile.goal=g; state.coach.answers=JSON.parse(JSON.stringify(A));
  for(const it of items){ n++;
   const a=JSON.stringify(scoreFood(it)); R_SC.clear(); const b=JSON.stringify(scoreFood(it)), c=JSON.stringify(scoreFood(it));
   if(a!==b||b!==c){ fail("Gemerkte Bewertung weicht ab",g+" "+it.name); }
   const r1=rClassify(it), r0=rClassify0(it);
   if((r1.cat&&r1.cat.id)!==(r0.cat&&r0.cat.id)||r1.heavy!==r0.heavy||JSON.stringify(r1.nut)!==JSON.stringify(r0.nut)) fail("Gemerkte Art-Erkennung weicht ab",it.name);
  }
 }
 // Ergebnis darf von außen verändert werden, ohne den Speicher zu verändern
 const it0=items[0]; scoreFood(it0); const s1=scoreFood(it0); s1.good.push("X"); s1.score=-1; if(scoreFood(it0).score===-1||scoreFood(it0).good.includes("X")) fail("Gemerkte Bewertung lässt sich von außen verändern",it0.name);
 state.profile=P0; state.coach.answers=A0;
 // 3) addDays
 for(let i=0;i<800;i++){ const s=addDays("2024-01-01",i), d=parseIso("2024-01-01"); d.setDate(d.getDate()+i); n++; if(s!==iso(d)) fail("addDays falsch","+"+i); if(addDays(s,-i)!=="2024-01-01") fail("addDays zurück falsch",s); }
 return {n,F};
}"""

# Hautanalyse: einfache Zufallsdaten mit eingebautem Muster (Schlaf), Ergebnis als Text zum Vergleichen
SKIN = r"""(seed)=>{ let a=seed; const R=()=>{ a=(a*1103515245+12345)%2147483648; return a/2147483648; };
  state.days={}; const ids=foods().filter(f=>!f.hidden&&f.type!=="sup"&&f.type!=="care").map(f=>f.id), t=todayIso(), N=[12,30,90][seed%3];
  for(let i=N;i>=0;i--){ const s=addDays(t,-i), d=state.days[s]=blankDay();
   const m=2+Math.floor(R()*5); for(let k=0;k<m;k++) d.meals.push({uid:uid(),id:ids[Math.floor(R()*ids.length)],portion:50+Math.floor(R()*300),slot:"lunch"});
   d.water=Math.floor(R()*12); if(R()<0.85) d.sleep=5+Math.floor(R()*8)/2;
   if(R()<0.85){ let v=6+Math.floor(R()*3); if(d.sleep&&d.sleep<6.5) v-=2+seed%2; d.skin=Math.max(1,Math.min(10,v+Math.floor(R()*2))); } }
  SK_MEMO.fp=null; SK_MEMO.key=null; const fast=JSON.stringify(skinInsights().map(x=>[x.f.id,x.diff,x.n,x.m1,x.m0]));
  return fast; }"""


def wait(pg, expr, sec=90):
    for _ in range(sec * 10):
        try:
            if pg.evaluate(f"()=>{{ try{{ return !!({expr}); }}catch(e){{ return false; }} }}"): return
        except Exception: pass
        pg.wait_for_timeout(100)
    raise RuntimeError("Zeitüberschreitung: " + expr)


def main():
    ok = True
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(locale="de-DE"); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); wait(pg, "typeof FOODDB!=='undefined'&&FOODDB.ok")
        pg.evaluate("()=>{ seedDemo(); }")
        r = pg.evaluate(CHECK)
        print("\n=== Abkürzungen (Suche, Bewertung, Datum): " + f"{r['n']:,}".replace(",", ".") + " Fälle geprüft")
        if r["F"]:
            ok = False
            for f in r["F"][:15]: print("    ❌", f)
        else: print("    ✅ alles in Ordnung")
        # Hautanalyse: mit gemerkten Bewertungen gleich wie ganz frisch gerechnet
        bad = 0
        for seed in range(1, 13):
            fast = pg.evaluate(SKIN, seed * 7919)
            slow = pg.evaluate("""()=>{ R_SC.clear(); R_CLS.clear(); SK_CAT.clear(); SK_MEMO.fp=null; SK_MEMO.key=null; return JSON.stringify(skinInsights().map(x=>[x.f.id,x.diff,x.n,x.m1,x.m0])); }""")
            if fast != slow: bad += 1
        print("\n=== Hautanalyse mit/ohne Zwischenspeicher: 12 Fälle geprüft")
        if bad: ok = False; print("    ❌ Ergebnis mit Zwischenspeicher anders:", bad)
        else: print("    ✅ alles in Ordnung")
        if errs: ok = False; print("    ❌ JavaScript-Fehler:", "; ".join(errs[:5]))
        b.close()
    print("\nERGEBNIS:", "✅ Alle Prüfungen bestanden" if ok else "❌ Fehler gefunden")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
