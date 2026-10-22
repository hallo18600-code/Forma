"""Automatische Sicherheitsprüfung für Health Maxxing.

Rechnet sehr viele Profile, Coach-Antworten und alle Lebensmittel durch und prüft feste Regeln
(keine kaputten Zahlen, Mindestgrenzen, kein Defizit bei Untergewicht, keine Abstürze …).
Bricht etwas, endet das Skript mit Fehler – GitHub zeigt den Lauf dann rot an.

Lokal starten (im Repo-Ordner):
  python3 -m http.server 8765 &
  pip install playwright && python3 -m playwright install chromium
  python3 tests/pruefung.py
"""
import os, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get("APP_URL", "http://localhost:8765/index.html")

# ---------- 1) Richtwerte: Raster über alle Eingaben ----------
RICHTWERTE = r"""()=>{
 const F={}; const fail=(k,ex)=>{ (F[k]=F[k]||{n:0,ex:[]}).n++; if(F[k].ex.length<3) F[k].ex.push(ex); };
 const P0=JSON.parse(JSON.stringify(state.profile)); let n=0;
 const goals=["muscle","lose","skin","energy"], freqs=["Gar nicht","1–2× pro Woche","3–4× pro Woche","5× oder öfter"];
 for(const sex of ["m","w"]) for(const age of [18,25,35,50,65,80,90]) for(let h=140;h<=220;h+=10) for(let w=35;w<=220;w+=5)
 for(const act of [1.3,1.4,1.55,1.7]) for(const fr of freqs) for(const ty of (fr==="Gar nicht"?[undefined]:["Krafttraining","Ausdauer","Beides"])){
  const m=h/100, bmi=w/(m*m); if(bmi<14||bmi>60) continue;
  const base={sex,age,height:h,weight:w,activity:act,trainFreq:fr,trainType:ty,target:w}, T={};
  const d=`${sex} ${age}J ${h}cm ${w}kg BMI ${bmi.toFixed(1)} ${act} ${fr} ${ty||""}`;
  for(const g of goals){ state.profile=Object.assign({},P0,base,{goal:g}); T[g]=targets(); n++; const t=T[g];
   if(![t.kcal,t.protein,t.carbs,t.fat].every(x=>Number.isFinite(x)&&x>=0)) fail("Ungültige Zahl",d+" "+g);
   if(Math.abs(t.protein*4+t.carbs*4+t.fat*9-t.kcal)/t.kcal>0.03) fail("Makros ergeben nicht die Kalorien",d+" "+g);
   if(t.kcal<(sex==="m"?1500:1200)) fail("Unter der Kalorien-Mindestgrenze",d+" "+g+" "+t.kcal);
  }
  const keep=T.energy.kcal;
  if(T.lose.kcal>keep) fail("Abnehmen ergibt mehr Kalorien als Halten",d);
  if(bmi<18.5&&T.lose.kcal<keep) fail("Defizit trotz Untergewicht",d+` ${T.lose.kcal} statt ${keep}`);
  if((keep-T.lose.kcal)*7/7700>0.01*w) fail("Abnehmen schneller als 1 % pro Woche",d);
  if(T.muscle.kcal-keep>300) fail("Muskel-Überschuss über 300 kcal",d);
  if(bmi>=30&&T.muscle.kcal>keep) fail("Überschuss trotz BMI ab 30",d);
  if(bmi<18.5){ state.profile=Object.assign({},P0,base,{goal:"lose"}); if(!/Untergewicht/.test(safetyNote())) fail("Keine Warnung bei Untergewicht + Abnehmen",d); }
 }
 state.profile=P0; return {n,F};
}"""

# ---------- 2) Coach: viele zufällige Profile und Antworten ----------
COACH = r"""()=>{
 const F={}; const fail=(k,ex)=>{ (F[k]=F[k]||{n:0,ex:[]}).n++; if(F[k].ex.length<3) F[k].ex.push(ex); };
 const rnd=a=>a[Math.floor(Math.random()*a.length)], areas=["haut","haare","schlaf","aussehen","gesundheit"];
 const P0=JSON.parse(JSON.stringify(state.profile)), A0=JSON.parse(JSON.stringify(state.coach.answers||{})); let n=0;
 for(let i=0;i<15000;i++){
  const sex=rnd(["m","w"]), h=140+Math.floor(Math.random()*81), w=Math.round((15+Math.random()*30)*(h/100)**2);
  state.profile=Object.assign({},P0,{sex,age:18+Math.floor(Math.random()*73),height:h,weight:w,activity:rnd([1.3,1.4,1.55,1.7]),goal:rnd(["muscle","lose","skin","energy"]),
   trainFreq:rnd(["Gar nicht","1–2× pro Woche","3–4× pro Woche","5× oder öfter"]),trainType:rnd(["Krafttraining","Ausdauer","Beides"]),fish:rnd(["oft","wenig"])});
  state.coach.answers={};
  for(const ar of areas){ const a={}; state.coach.answers[ar]=a;
   for(const q of (coachQuiz(ar)||[])){ if(q.skip&&q.skip(a)) continue; if(Math.random()<0.07) continue;
    a[q.k]=q.multi?[...q.opts.filter(x=>x!==q.none)].sort(()=>Math.random()-.5).slice(0,1+Math.floor(Math.random()*(q.pick||2))):rnd(q.opts); } }
  const bmi=w/(h/100)**2;
  for(const ar of areas){ let r; try{ r=coachAdvice(ar); n++; }catch(e){ fail("Absturz im Coach ("+ar+"): "+e.message,""); continue; }
   const s=JSON.stringify(r);
   for(const b of ["undefined","NaN","Infinity","[object"]) if(s.includes(b)) fail(`'${b}' im Coach-Text (${ar})`,s.slice(0,160));
   if(/Minoxidil|Ketoconazol|Rosazea/.test(s)) fail("Arzneimittel/Diagnose im Coach ("+ar+")",s.slice(0,160));
   if(ar==="aussehen"&&bmi<18.5&&/senken|Defizit/.test(s)) fail("Coach rät Untergewichtigen zum Defizit",`BMI ${bmi.toFixed(1)}`);
   if(sex==="m"&&/Schwangerschaft|Stillzeit/.test(s)) fail("Schwangerschafts-Hinweis bei Männern ("+ar+")","");
  }
  try{ coachToday(); }catch(e){ fail("Absturz in coachToday: "+e.message,""); }
 }
 state.profile=P0; state.coach.answers=A0; return {n,F};
}"""

# ---------- 3) Alle Lebensmittel × alle Ziele ----------
ESSEN = r"""async ()=>{
 await loadFoodDb(); const F={}; const fail=(k,ex)=>{ (F[k]=F[k]||{n:0,ex:[]}).n++; if(F[k].ex.length<3) F[k].ex.push(ex); };
 const items=allItems().concat(FOODDB.rows.map(dbItem)); let n=0;
 if(FOODDB.rows.length<1000) fail("Produktdatenbank fehlt oder ist zu klein",String(FOODDB.rows.length));
 for(const it of items){
  if((+it.protein||0)+(+it.carbs||0)+(+it.fat||0)>100.5) fail("Datenfehler: Makros über 100 g",it.name);
  for(const g of ["muscle","lose","skin","energy"]){ let r; n++;
   try{ r=scoreFood(it,g); }catch(e){ fail("Absturz bei Bewertung: "+e.message,it.name); continue; }
   if(!Number.isFinite(r.score)||r.score<0||r.score>100) fail("Ungültiger Score",it.name);
   const s=JSON.stringify(r); for(const b of ["undefined","NaN","Infinity","[object"]) if(s.includes(b)) fail(`'${b}' in Bewertung`,it.name);
   const c=rClassify(it), id=c.cat?c.cat.id:"";
   // Zuckerprodukte dürfen nicht gut abschneiden. Ausnahmen (bewusst): Trockenobst und Honig (naturbelassen),
   // zuckerfreie Supplements wie Magnesium-Brausetabletten.
   const sup=rSupKind(it,c.h,c.cat), sugary=["softdrink","sugar"].includes(id)||(+it.sugar||0)>=50;
   if(sugary&&!sup&&!["driedfruit","honey"].includes(id)&&r.score>=70) fail("Zuckerprodukt mit Score ab 70",`${it.name} (${it.brand||""}) → ${r.score}`);
   if(sup&&(+it.sugar||0)>=50) fail("Zuckerprodukt als Supplement bewertet",`${it.name} (${it.brand||""})`);
  }
 }
 return {n,F};
}"""

def main():
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(1500)
        for name, js in [("Richtwerte", RICHTWERTE), ("Coach", COACH), ("Lebensmittel", ESSEN)]:
            r = pg.evaluate(js)
            print(f"\n=== {name}: {r['n']:,} Fälle geprüft".replace(",", "."))
            if not r["F"]: print("    ✅ alles in Ordnung")
            for k, v in r["F"].items():
                bad += 1; print(f"    ❌ {k}: {v['n']}×")
                for e in v["ex"]: print("       z. B.", e)
        if errs:
            bad += 1; print("\n❌ JavaScript-Fehler:", errs[:5])
        b.close()
    print("\nERGEBNIS:", "❌ Probleme gefunden" if bad else "✅ Alle Prüfungen bestanden")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
