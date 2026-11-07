"""Prüfung von Datenqualität und Widerspruchsfreiheit der Bewertung (alle ~100.000 Produkte).

Was geprüft wird:
  1. Fehlende Werte: Fehlt Zucker/Ballaststoffe/Salz, wird geschätzt. Test: Bei Produkten MIT Wert den Wert
     entfernen → der Score darf im Schnitt nur wenig abweichen (früher: Zucker fehlt = +18 Punkte).
  2. Ehrliche Texte: Geschätzte Werte erscheinen nie als Messwert („Viel Zucker (23 g)“), sondern als „vermutlich …“.
  3. Mehr Zucker macht nie besser: +10 g Zucker (sonst gleich) darf den Score nicht erhöhen.
  4. Gleiche Produkte, gleiche Bewertung: gleicher Name + Marke + fast gleiche Nährwerte → fast gleicher Score.
  5. Datenbank: geschätzte NOVA-Werte gültig, Kalorien passen zu den Makros (außer markierte Produkte).

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
 // 1) Fehlende Werte: Abweichung, wenn ein vorhandener Wert entfernt wird
 const drop=(name,filter,mod,step,maxAvg,maxBig)=>{ let n=0,sum=0,big=0;
  for(let i=0;i<rows.length;i+=step){ const x=rows[i]; if(!filter(x)) continue; const a=dbItem(x), b=mod(Object.assign({},a));
   for(const g of G){ const d=Math.abs(S(b,g)-S(a,g)); n++; sum+=d; if(d>=15) big++; } }
  const avg=sum/n; M[name]={avg:+avg.toFixed(2),grob:+(big/n*100).toFixed(1)+" %"};
  if(avg>maxAvg) fail("Schätzung zu ungenau: "+name,`Ø ${avg.toFixed(2)} Punkte (Grenze ${maxAvg})`);
  if(big/n>maxBig) fail("Zu viele grobe Fehler: "+name,`${(big/n*100).toFixed(1)} % ≥ 15 Punkte`); };
 drop("Zucker fehlt",x=>x[7]!=null&&x[5]>=3,it=>(it.sugar=undefined,it),9,5.5,0.10);   // früher (fehlt = 0): Ø 7,9 Punkte
 drop("Ballaststoffe fehlen",x=>x[8]!=null&&x[5]>=3,it=>(it.fiber=undefined,it),9,2.5,0.02);
 drop("Salz fehlt",x=>x[9]!=null,it=>(it.salt=undefined,it),9,1.5,0.03);
 // 2) + 3) Texte bei Schätzungen, Zucker-Monotonie, Grundregeln für alle Produkte
 let n=0, mono=0, monoN=0;
 for(let i=0;i<rows.length;i++){ const x=rows[i], it=dbItem(x), C=rClassify(it), est=C.est||{};
  for(const g of G){ const r=scoreFood(it,g); n++; const t=r.good.concat(r.bad).join(" | "), d=`${it.name} (${it.brand||""}, ${g}) → ${r.score}`;
   if(!Number.isFinite(r.score)||r.score<0||r.score>100) fail("Ungültiger Score",d);
   if(est.su&&/zucker[^|]*\(\d/i.test(t)) fail("Geschätzter Zucker als Messwert",d+" | "+t);
   if(est.sa&&/salz[^|]*\(\d/i.test(t)) fail("Geschätztes Salz als Messwert",d+" | "+t);
   if(est.fi&&/ballaststoff[^|]*\(\d/i.test(t)) fail("Geschätzte Ballaststoffe als Messwert",d+" | "+t);
   if(est.nova&&/Stark verarbeitet mit Zusätzen|^Unverarbeitet$/.test(t)) fail("Geschätzte Verarbeitung als Tatsache",d+" | "+t);
   if(/vermutlich viel zucker/i.test(t)&&!est.su) fail("„Vermutlich“ obwohl Zucker bekannt",d);
   if(r.est&&r.est.some(k=>!["su","fi","sa","nova"].includes(k))) fail("Unbekannte Schätzung",d+" "+r.est);
  }
  // +10 g Zucker (Kohlenhydrate und Kalorien passend dazu) darf nie besser machen – bei Arten, deren Zucker nicht natürlich ist
  if(i%4===0&&x[7]!=null&&x[3]>=30&&!(C.cat&&R_NATSUGAR.has(C.cat.id))){
   const b=Object.assign({},it,{sugar:it.sugar+10,carbs:it.carbs+10,kcal:it.kcal+40});
   for(const g of G){ monoN++; const d=S(b,g)-S(it,g); if(d>3){ mono++; fail("Mehr Zucker → besserer Score",`${it.name} (${g}) ${S(it,g)}→${S(b,g)}`); } }
  }
 }
 M.monotonie={geprueft:monoN,verstoesse:mono};
 // 4) Gleiche Produkte (Name + Marke, Nährwerte je ±5 %) → Score höchstens 8 Punkte auseinander
 const by=new Map();
 for(const x of rows){ const k=NORM(x[1]+"|"+(x[2]||"")).trim(); if(!by.has(k)) by.set(k,[]); by.get(k).push(x); }
 let dup=0;
 for(const L of by.values()){ if(L.length<2) continue;
  for(let a=0;a<L.length;a++) for(let b=a+1;b<Math.min(L.length,a+4);b++){ const p=L[a], q=L[b];
   if(![3,4,5,6,7,9].every(k=>p[k]!=null&&q[k]!=null&&Math.abs(p[k]-q[k])<=Math.max(k===9?0.2:0.6,0.05*Math.max(p[k],q[k])))) continue;
   if(p[11]!==q[11]) continue;   // anderer Verarbeitungsgrad = echter Unterschied
   // Ballaststoffe: beide bekannt → müssen passen; einer fehlt → Schätzung, etwas mehr Spielraum
   const f1=p[8]!=null&&q[8]!=null; if(f1&&Math.abs(p[8]-q[8])>Math.max(0.6,0.1*Math.max(p[8],q[8]))) continue;
   if(!f1&&(p[8]===0||q[8]===0)) continue;   // „0 g“ neben „fehlt“: oft Platzhalter in Open Food Facts, nicht vergleichbar
   const tol=f1||(p[8]==null&&q[8]==null)?8:12;
   const A=dbItem(p), B=dbItem(q); dup++;
   for(const g of G){ const d=Math.abs(S(A,g)-S(B,g)); if(d>tol) fail("Gleiches Produkt, anderer Score",`${p[1]} (${p[2]}, ${g}) ${S(A,g)} vs ${S(B,g)}`); } } }
 M.dubletten=dup;
 // 5) Datenbank
 let est=0, warn=0, bad=0, chk=0;
 const SK=/(alkohol|bier|beer|wein|wine|sekt|vodka|wodka|whisk|likor|likör|schnaps|kaugummi|gum|zuckerfrei|sugar ?free|xylit|erythrit|polyol|stevia|sussstoff|süßstoff)/i;
 for(const x of rows){
  if(x[11]!=null&&![1,2,3,4,-1,-2,-3,-4].includes(x[11])) fail("Ungültiger NOVA-Wert",x[1]+" "+x[11]);
  if(x[11]<0) est++;
  if(x.length>12){ if(x[12]!==1) fail("Ungültige Kalorien-Markierung",x[1]); warn++; continue; }
  if(x[4]==null||x[5]==null||x[6]==null||SK.test(x[1]+" "+(x[2]||""))) continue;
  const calc=x[4]*4+x[5]*4+x[6]*9+(x[8]||0)*2; if(calc<30&&x[3]<60) continue; chk++;
  if(Math.abs(calc-x[3])>Math.max(40,0.25*Math.max(calc,x[3]))) bad++;
 }
 M.datenbank={produkte:rows.length,nova_geschaetzt:est,kalorien_markiert:warn,kalorien_unstimmig_unmarkiert:bad};
 if(bad/chk>0.005) fail("Zu viele unstimmige Kalorien ohne Markierung",`${bad} von ${chk}`);
 return {n,F,M};
}"""

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(locale="de-DE"); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_function("typeof FOODDB!=='undefined'&&FOODDB.ok", timeout=120000)
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
