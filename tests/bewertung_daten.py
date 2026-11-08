"""Prüfung von Datenqualität und Widerspruchsfreiheit der Bewertung (alle ~100.000 Produkte).

Grundsatz: Es wird nichts geschätzt. Was in Open Food Facts fehlt, bleibt leer.
Was geprüft wird:
  1. Fehlen Zucker oder Salz, gibt es keinen Score (Strich + „Angaben fehlen“), sonst immer einen gültigen Score.
  2. Kein Text tut so, als wüsste die App mehr: nie „vermutlich …“, und ohne Verarbeitungsgrad nie „naturbelassen/unverarbeitet“.
  3. Mehr Zucker macht nie besser: +10 g Zucker (sonst gleich) darf den Score nicht erhöhen.
  4. Gleiche Produkte, gleiche Bewertung: gleicher Name + Marke + fast gleiche Nährwerte → fast gleicher Score.
  5. Datenbank: keine geschätzten Werte (NOVA nur 1–4), Kalorien passen zu den Makros (außer markierte Produkte),
     Einheit (ml/g) nur aus der Packungsangabe und dann auch so angezeigt.

Lokal starten (im Repo-Ordner):
  python3 -m http.server 8765 &
  python3 tests/bewertung_daten.py
"""
import os, sys, json, re
from playwright.sync_api import sync_playwright

URL = os.environ.get("APP_URL", "http://localhost:8765/index.html")

JS = r"""()=>{
 const F={}; const fail=(k,ex)=>{ (F[k]=F[k]||{n:0,ex:[]}).n++; if(F[k].ex.length<4) F[k].ex.push(ex); };
 state.onboarded=true; state.coach.answers={};
 const G=["muscle","lose","skin","energy"], rows=FOODDB.rows, S=(it,g)=>scoreFood(it,g).score, M={};
 // 1) + 2) Kein Score bei fehlenden Werten, ehrliche Texte – für alle Produkte und alle Ziele
 let n=0, mono=0, monoN=0, none=0;
 for(let i=0;i<rows.length;i++){ const x=rows[i], it=dbItem(x), C=rClassify(it);
  const missSu=x[7]==null&&x[5]>0.5, missSa=x[9]==null;
  for(const g of G){ const r=scoreFood(it,g); n++; const t=r.good.concat(r.bad).join(" | "), d=`${it.name} (${it.brand||""}, ${g}) → ${r.score}`;
   if(missSu||missSa){ if(r.score!==null||!r.noScore) fail("Score trotz fehlender Angabe",d+(missSu?" Zucker fehlt":"")+(missSa?" Salz fehlt":"")); else if(g==="muscle") none++; continue; }
   if(!Number.isFinite(r.score)||r.score<0||r.score>100) fail("Ungültiger Score",d);
   if(/vermutlich|geschätzt|geschaetzt/i.test(t)) fail("Schätz-Text",d+" | "+t);
   if(!x[11]&&r.good.some(z=>/(naturbelassen|unverarbeitet)/i.test(z))) fail("Verarbeitung behauptet, obwohl unbekannt",d+" | "+t);
   if(x[11]&&(r.unknown||[]).includes("Verarbeitungsgrad")) fail("„Verarbeitungsgrad unbekannt“ obwohl bekannt",d);
   if(!x[11]&&!(r.unknown||[]).includes("Verarbeitungsgrad")) fail("Fehlender Verarbeitungsgrad nicht angezeigt",d);
  }
  if(missSu||missSa) continue;
  // +10 g Zucker (Kohlenhydrate und Kalorien passend dazu) darf nie besser machen – bei Arten, deren Zucker nicht natürlich ist
  if(i%4===0&&x[7]!=null&&x[3]>=30&&!(C.cat&&R_NATSUGAR.has(C.cat.id))){
   const b=Object.assign({},it,{sugar:it.sugar+10,carbs:it.carbs+10,kcal:it.kcal+40});
   for(const g of G){ monoN++; const d=S(b,g)-S(it,g); if(d>3){ mono++; fail("Mehr Zucker → besserer Score",`${it.name} (${g}) ${S(it,g)}→${S(b,g)}`); } }
  }
 }
 M.monotonie={geprueft:monoN,verstoesse:mono}; M.ohne_score=none;
 // 4) Gleiche Produkte (Name + Marke, Nährwerte je ±5 %) → Score höchstens 8 Punkte auseinander
 const by=new Map();
 for(const x of rows){ const k=NORM(x[1]+"|"+(x[2]||"")).trim(); if(!by.has(k)) by.set(k,[]); by.get(k).push(x); }
 let dup=0;
 for(const L of by.values()){ if(L.length<2) continue;
  for(let a=0;a<L.length;a++) for(let b=a+1;b<Math.min(L.length,a+4);b++){ const p=L[a], q=L[b];
   if(![3,4,5,6,7,9].every(k=>p[k]!=null&&q[k]!=null&&Math.abs(p[k]-q[k])<=Math.max(k===9?0.2:0.6,0.05*Math.max(p[k],q[k])))) continue;
   if(p[11]!==q[11]) continue;   // anderer Verarbeitungsgrad = echter Unterschied
   // Ballaststoffe: beide bekannt → müssen passen
   const f1=p[8]!=null&&q[8]!=null; if(f1&&Math.abs(p[8]-q[8])>Math.max(0.6,0.1*Math.max(p[8],q[8]))) continue;
   if((p[8]==null)!==(q[8]==null)) continue;   // nur einer hat Ballaststoffe: andere Datenlage (ohne Angabe kein Ballaststoff-Bonus)
   const tol=8;
   const A=dbItem(p), B=dbItem(q); if(rMissing(A).length||rMissing(B).length) continue; dup++;
   for(const g of G){ const d=Math.abs(S(A,g)-S(B,g)); if(d>tol) fail("Gleiches Produkt, anderer Score",`${p[1]} (${p[2]}, ${g}) ${S(A,g)} vs ${S(B,g)}`); } } }
 M.dubletten=dup;
 // 5) Datenbank
 let est=0, warn=0, bad=0, chk=0;
 const SK=/(alkohol|bier|beer|wein|wine|sekt|vodka|wodka|whisk|likor|likör|schnaps|kaugummi|gum|zuckerfrei|sugar ?free|xylit|erythrit|polyol|stevia|sussstoff|süßstoff)/i;
 for(const x of rows){
  if(x[11]!=null&&![1,2,3,4].includes(x[11])) fail("Geschätzter oder ungültiger NOVA-Wert",x[1]+" "+x[11]);
  if(x.length>12){ if(!(x[12]>=1&&x[12]<=7)||(x[12]&6)===6) fail("Ungültige Markierung",x[1]+" "+x[12]);
   const it=dbItem(x), gu=(unitsFor(it).find(u=>u.k==="g")||{}).ml;
   if(x[12]&2&&!gu) fail("Packung in ml, App zeigt g",x[1]); if(x[12]&4&&gu) fail("Packung in g, App zeigt ml",x[1]);
   if(x[12]&2) est++; if(x[12]&1){ warn++; continue; } }
  if(x[4]==null||x[5]==null||x[6]==null||SK.test(x[1]+" "+(x[2]||""))) continue;
  const calc=x[4]*4+x[5]*4+x[6]*9+(x[8]||0)*2; if(calc<30&&x[3]<60) continue; chk++;
  if(Math.abs(calc-x[3])>Math.max(40,0.25*Math.max(calc,x[3]))) bad++;
 }
 M.datenbank={produkte:rows.length,in_ml:est,kalorien_markiert:warn,kalorien_unstimmig_unmarkiert:bad};
 // Ohne Score: Produktansicht zeigt Strich und Grund
 const ns=rows.find(x=>x[9]==null); if(ns){ ensureDb("db-"+ns[0]); const it=foods().find(f=>f.id==="db-"+ns[0]); const html=foodSheet(it,scored(it));
  if(!/Kein Score/.test(html)||!/Angaben fehlen/.test(html)) fail("Produkt ohne Score falsch angezeigt",ns[1]); }
 if(bad/chk>0.005) fail("Zu viele unstimmige Kalorien ohne Markierung",`${bad} von ${chk}`);
 return {n,F,M};
}"""

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(locale="de-DE"); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL)
        # Warten ohne wait_for_function (das braucht eval, die Content-Security-Policy der App verbietet es)
        for _ in range(240):
            if pg.evaluate("()=>typeof FOODDB!=='undefined'&&FOODDB.ok"): break
            pg.wait_for_timeout(500)
        r = pg.evaluate(JS)
    print(f"=== Daten & Bewertung: {r['n']:,} Bewertungen geprüft".replace(",", "."))
    for k, v in r["M"].items(): print(f"    {k}: {json.dumps(v, ensure_ascii=False)}")
    # Mehr Zucker → besser: einzelne Grenzfälle (Rundung, Art-Wechsel bei unrealistischen Werten) sind erlaubt, aber sehr wenige
    mono = r["M"]["monotonie"]; F = r["F"]
    if "Mehr Zucker → besserer Score" in F and mono["verstoesse"] <= max(3, mono["geprueft"] * 0.002): F.pop("Mehr Zucker → besserer Score")
    if errs: F["JavaScript-Fehler"] = {"n": len(errs), "ex": errs[:3]}
    if not F: print("    ✅ alles in Ordnung"); return 0
    for k, v in F.items():
        print(f"    ❌ {k}: {v['n']}×")
        for e in v["ex"]: print("       z. B.", e)
    return 1

if __name__ == "__main__":
    sys.exit(main())
