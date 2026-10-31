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
 const P0=JSON.parse(JSON.stringify(state.profile)), A0=JSON.parse(JSON.stringify(state.coach.answers||{})); let n=0;
 state.coach.answers={};
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
  // Muskulös (KFA selbst niedrig angegeben, z. B. Bodybuilder): Überschuss erlaubt, Protein nach echtem Gewicht
  if(bmi>=30&&age<=50&&w%20===0){
   state.profile=Object.assign({},P0,base,{goal:"muscle"}); state.coach.answers={aussehen:{kfa:kfaOpts()[0]}};
   const tl=targets(); state.coach.answers={}; state.profile=Object.assign({},P0,base,{goal:"energy"}); const k0=targets().kcal;
   if(tl.kcal<=k0) fail("Muskulös mit hohem BMI bekommt keinen Überschuss",d);
   if(tl.protein<1.6*w) fail("Muskulös: Protein nicht nach echtem Gewicht",d+" "+tl.protein+" g");
  }
 }
 state.profile=P0; state.coach.answers=A0; return {n,F};
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
 // Texte dürfen den Nährwerten nicht widersprechen
 for(const it of FOODDB.rows.slice(0,20000).map(dbItem)){
  const C=rClassify(it), kc=C.nut.kc, pr=+it.protein||0, fa=+it.fat||0, su=+it.sugar||0, sup=rSupKind(it,C.h,C.cat);
  if(sup) continue;
  for(const g of ["muscle","lose","skin","energy"]){ const r=scoreFood(it,g), good=r.good.join(" | "), bad=r.bad.join(" | ");
   if(/kaum Fett/.test(good)&&fa>5) fail("Text 'kaum Fett' bei fettem Produkt",it.name);
   if(/(Viel Protein|Proteinreich)/.test(good)&&pr<8) fail("Text 'Viel Protein' bei wenig Protein",it.name);
   if(/Wenig Zucker/.test(good)&&su>10) fail("Text 'Wenig Zucker' bei viel Zucker",it.name);
   if(r.score<35&&!r.bad.length) fail("Schlechter Score ohne Begründung",`${it.name} (${g}) → ${r.score}`);
   if(/Viel Zucker/.test(bad)&&su<12) fail("Text 'Viel Zucker' bei wenig Zucker",it.name);
   if(/^(Kein|Kaum) Protein/.test(r.bad[0]||"")&&pr>=8) fail("Text 'Kein Protein' bei viel Protein",it.name);
   if(/(wenig|kaum) Kalorien(?! pro Stück)|Nur \d+ kcal/.test(good)&&kc>120) fail("Text 'wenig Kalorien' bei vielen Kalorien",it.name+" "+kc);
  }
 }
 // Feste Beispiele, die nie wieder falsch werden dürfen (Name/Marke als Suchmuster, Prüfung auf Art und Score)
 const ALL=foods().concat(FOODDB.rows.map(dbItem)), S=it=>["muscle","lose","skin","energy"].map(g=>scoreFood(it,g).score);
 const GOLD=[
  ["^Coca-Cola$","Coca-Cola", (s,c)=>Math.max(...s)<=20, "Cola höchstens 20"],
  ["leberk[aä]s","", (s,c)=>c!=="organ", "Leberkäse ist keine Innerei"],
  ["eiwei(ß|ss) ?-?brot","", (s,c)=>c!=="egg", "Eiweißbrot ist kein Ei"],
  ["","^(beyond meat|beyond burger|planted)", (s,c)=>["ersatz","plantmilk"].includes(c)||!c, "Beyond/Planted sind Ersatzprodukte"],
  ["sonnenblumen ?hack","", (s,c)=>c==="ersatz", "Sonnenblumen-Hack ist Ersatz"],
  ["^Haferflocken( |,|$)(?!.*(geb[äa]ck|keks|riegel|cookie))","", (s,c)=>s[0]>=75&&s[3]>=80, "Haferflocken: Muskeln ≥75, Energie ≥80"],
  ["^(Bio-)?Raps(öl|kernöl)$","", (s,c)=>Math.max(...s)<=30, "Rapsöl höchstens 30"],
  ["^Natives Olivenöl","", (s,c)=>s[2]>=80, "Olivenöl: Haut ≥80"],
  ["^Skyr$|^Skyr Natur","", (s,c,it)=>(+it.sugar||0)>5||s[0]>=78, "Skyr natur (ohne Zucker): Muskeln ≥78"],
  ["Goldb[äa]ren","Haribo", (s,c)=>Math.max(...s)<=15, "Gummibärchen höchstens 15"],
  ["^Apfelchips","", (s,c)=>c==="driedfruit", "Apfelchips sind Trockenobst"],
  ["Konfit[üu]re","", (s,c)=>Math.max(...s)<=30, "Konfitüre höchstens 30"],
  ["alkoholfrei","^(Krombacher|Erdinger|Bitburger|Clausthaler|Jever)", (s,c)=>c!=="alcohol", "Alkoholfreies Bier ist kein Alkohol"],
  ["Bl[äa]tterteig|p[âa]te feuillet","", (s,c)=>c!=="tea", "Blätterteig ist kein Tee"],
  ["Schlemmer.?filet","", (s,c)=>!["leanfish","fattyfish","veg","skinveg"].includes(c), "Schlemmerfilet nicht wie reiner Fisch"],
  ["^Coca[- ]?Cola Zero","", (s,c,it)=>(+it.kcal||0)>=10||s[1]>=45&&s[1]<=65, "Cola Zero beim Abnehmen 45–65 (besser als Cola, schlechter als Wasser)"],
  ["Konjac|Shirataki","", (s,c)=>!["refined","wholewheat"].includes(c), "Konjak-Nudeln sind kein Weißmehl"],
  ["Limonade","", (s,c,it)=>Math.max(...s)<=((+it.sugar||0)<1&&(+it.kcal||0)<10?60:30), "Limonade höchstens 30 (Zero höchstens 60)"],
  ["^(Bio[ -])?Agaven ?dicksaft$","", (s,c,it)=>(+it.sugar||0)<40||Math.max(...s)<=20, "Agavendicksaft höchstens 20"],
  ["Kr[äa]uterquark","", (s,c)=>c!=="spice", "Kräuterquark ist kein Gewürz"],
  ["^Pringles|^Chipsfrisch","", (s,c)=>Math.max(...s)<=25, "Chips höchstens 25"],
  ["^Butterkeks","", (s,c)=>c!=="butter", "Butterkeks ist keine Butter"],
  ["Paniert|Panade|Backfisch","", (s,c)=>!["poultry","leanfish","fattyfish","redmeat"].includes(c), "Paniertes ist kein reines Fleisch/Fisch"],
  ["^H[äa]hnchenbrust$","", (s,c)=>s[0]>=85, "Hähnchenbrust: Muskeln ≥85"],
  ["^Brokkoli$","", (s,c)=>s[1]>=85, "Brokkoli: Abnehmen ≥85"],
  ["^Ei$","", (s,c)=>s[0]>=85, "Ei: Muskeln ≥85"],
 ];
 for(const [nm,br,ok,txt] of GOLD){
  const rn=nm?new RegExp(nm,"i"):null, rb=br?new RegExp(br,"i"):null;
  const L=ALL.filter(it=>(!rn||rn.test(it.name||""))&&(!rb||rb.test(it.brand||""))&&(!/^\^(H|Ei\$)/.test(nm)||it.type==="food")).slice(0,60);
  if(!L.length){ fail("Beispiel nicht gefunden: "+txt,nm+" "+br); continue; }
  for(const it of L){ const c=rClassify(it).cat, sc=S(it); n++; if(!ok(sc,c?c.id:"",it)) fail("Beispiel verletzt: "+txt,`${it.name} (${it.brand||""}) → ${c?c.id:"–"} ${sc}`); }
 }
 return {n,F};
}"""

# ---------- 4) Passt alles zur Person? (Ernährung, Unverträglichkeiten, Ziel, Geschlecht) ----------
PASST = r"""()=>{
 const F={}; const fail=(k,ex)=>{ (F[k]=F[k]||{n:0,ex:[]}).n++; if(F[k].ex.length<3) F[k].ex.push(ex); };
 const rnd=a=>a[Math.floor(Math.random()*a.length)], areas=["haut","haare","schlaf","aussehen","gesundheit"];
 const P0=JSON.parse(JSON.stringify(state.profile)), A0=JSON.parse(JSON.stringify(state.coach.answers||{})), D0=state.date; let n=0;
 for(let i=0;i<8000;i++){
  const sex=rnd(["m","w"]), h=150+Math.floor(Math.random()*50), w=Math.round((17+Math.random()*20)*(h/100)**2), goal=rnd(["muscle","lose","skin","energy"]);
  state.profile=Object.assign({},P0,{sex,age:18+Math.floor(Math.random()*60),height:h,weight:w,target:w+rnd([-10,-4,0,3]),activity:rnd([1.3,1.4,1.55,1.7]),goal,
   trainFreq:rnd(["Gar nicht","1–2× pro Woche","3–4× pro Woche","5× oder öfter"]),trainType:rnd(["Krafttraining","Ausdauer","Beides"]),fish:rnd(["oft","wenig"])});
  state.coach.answers={};
  for(const ar of areas){ const a={}; state.coach.answers[ar]=a;
   for(const q of (coachQuiz(ar)||[])){ if(q.skip&&q.skip(a)) continue;
    a[q.k]=q.multi?[...q.opts.filter(x=>x!==q.none)].sort(()=>Math.random()-.5).slice(0,1+Math.floor(Math.random()*(q.pick||3))):rnd(q.opts); } }
  const e=state.coach.answers.gesundheit, st=e.stil, intol=e.intol||[], mei=e.meiden||[];
  const vegan=st==="Vegan", veg=vegan||st==="Vegetarisch";
  // Alle Texte, die die Person zu Essen/Supplements sieht
  const T=[]; for(const ar of areas){ const r=coachAdvice(ar); T.push(JSON.stringify(r.items||[]), JSON.stringify(r.routine||{})); }
  T.push(JSON.stringify(coachToday()), proteinFoods(4), JSON.stringify(coachPlans().essen.steps));
  const txt=T.join(" "), rec=recommendStack().map(x=>x.id); n++;
  const d=`${sex} ${goal} ${st} intol=${intol} meiden=${mei}`;
  if(vegan&&/(Skyr|Quark|Milch|Käse|Eier|Ei,|Hähnchen|Fisch|Honig|Whey)/.test(txt.replace(/Milchsäure|Milchprodukte|laktosefrei/g,""))) fail("Vegan: tierische Empfehlung",d+" | "+(txt.match(/(Skyr|Quark|Milch|Käse|Eier|Ei,|Hähnchen|Fisch|Honig|Whey)/)||[])[0]);
  if(st==="Vegetarisch"&&/(Hähnchen|Fisch,|Fisch oder|Lachs|Thunfisch)/.test(txt)) fail("Vegetarisch: Fleisch/Fisch empfohlen",d);
  if((intol.includes("Laktose")||mei.includes("Milchprodukte"))&&/(\bSkyr\b(?<!laktosefreier Skyr)|Quark|Milch, Ei|Whey\.)/.test(txt.replace(/laktosefreier Skyr/g,""))&&!(intol.includes("Laktose")&&!mei.includes("Milchprodukte")&&!/Whey\./.test(txt)&&!/Quark|Milch, Ei/.test(txt))) fail("Milch empfohlen trotz Laktose/Meiden",d);
  if(mei.includes("Soja")&&/Tofu|Tempeh|Soja/.test(txt)) fail("Soja empfohlen trotz Meiden",d);
  if(intol.includes("Nüsse")&&/(Nüsse|Erdnüsse|Mandel)/.test(txt.replace(/Nüsse meiden/g,""))) fail("Nüsse empfohlen trotz Unverträglichkeit",d);
  if(intol.includes("Gluten")&&/(Hafer|Vollkornbrot|Nudeln)/.test(txt)) fail("Gluten-Lebensmittel empfohlen trotz Unverträglichkeit",d);
  if(mei.includes("Koffein")&&/Letzter Kaffee|Kaffee bis/.test(txt)) fail("Kaffee-Zeit trotz Koffein meiden",d);
  if((vegan&&rec.includes("whey"))||(veg&&rec.includes("col"))) fail("Tierisches Supplement vorgeschlagen",d+" "+rec);
  if((intol.includes("Laktose")||mei.includes("Milchprodukte"))&&rec.includes("whey")) fail("Whey vorgeschlagen trotz Laktose/Meiden",d);
  if(sex==="m"&&/(Pony|Schwangerschaft|Stillzeit|Pixie)/.test(txt)) fail("Frauen-Tipp bei Mann",d);
  if(sex==="w"&&/(Fade|Seiten kürzer|Seiten länger)/.test(txt)) fail("Männer-Tipp bei Frau",d);
  if(goal==="muscle"&&/Kalorien auf .* senken/.test(txt)&&kfaLevel(state.coach.answers.aussehen)<3) fail("Muskelziel: Defizit trotz mittlerem KFA",d);
  const bmi=w/(h/100)**2; if(bmi<18.5&&/senken|Defizit halten/.test(txt)) fail("Untergewicht: Defizit empfohlen",d);
  const t=targets(), keep=kcalFor("energy");
  if(goal==="lose"&&bmi>=18.5&&t.kcal>=keep&&keep>(sex==="m"?1500:1200)+20) fail("Abnehmen ohne Defizit",d);
  if(goal==="muscle"&&(bmi<30)&&t.kcal<=keep&&keep>(sex==="m"?1500:1200)) fail("Muskeln ohne Plus",d);
  const gw=goalWeeks();
  if(gw!=null&&goal==="lose"&&(w-state.profile.target)/gw>0.01*w+0.05) fail("Zieldatum zu schnell (über 1 %/Woche)",d+" "+gw);
 }
 state.profile=P0; state.coach.answers=A0; state.date=D0; return {n,F};
}"""

def main():
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(locale="de-DE"); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(1500)
        for name, js in [("Richtwerte", RICHTWERTE), ("Coach", COACH), ("Passt zur Person", PASST), ("Lebensmittel", ESSEN)]:
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
