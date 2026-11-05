"""Automatische Prüfung der neuen Funktionen: Vorschläge, Bedarf lernt mit, Tages-Score, Erinnerungen.

Teil 1 rechnet tausende zufällige Tagebücher durch (Logik).
Teil 2 klickt die App wie ein Mensch durch (Knöpfe, Blätter, Sprachen, Dunkelmodus) und meldet jeden JavaScript-Fehler.

Lokal starten (im Repo-Ordner):
  python3 -m http.server 8765 &
  python3 tests/funktionen.py
"""
import os, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get("APP_URL", "http://localhost:8765/index.html")

# Gemeinsame Helfer im Browser
HELP = r"""
window.F={}; window.fail=(k,ex)=>{ (F[k]=F[k]||{n:0,ex:[]}).n++; if(F[k].ex.length<3) F[k].ex.push(ex); };
window.rnd=a=>a[Math.floor(Math.random()*a.length)];
window.ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
window.newState=()=>{ state=fresh(); state.onboarded=true; state.profile.adult=true; state.profile.termsOk=TERMS_V; state.date=todayIso();
  Object.assign(state.profile,{sex:"m",age:30,height:180,weight:80,activity:1.55,trainFreq:"3–4× pro Woche",trainType:"Krafttraining",goal:"energy"}); };
"""

# ---------- 1) Vorschläge ----------
VORSCHLAEGE = r"""()=>{ F={}; let n=0;
 const pool=foods().filter(p=>!p.hidden), T0=todayIso(), slots=SLOTS.map(s=>s.id);
 for(let it=0;it<3000;it++){
  newState();
  // Zufällige Gewohnheiten: einige Lebensmittel fest zu einer Mahlzeit, dazu Zufälliges
  const habit=pool.slice().sort(()=>Math.random()-.5).slice(0,ri(0,4)).map(p=>({p,slot:rnd(slots),every:ri(1,3)}));
  const days=ri(0,70);
  for(let i=days;i>=0;i--){ const s=addDays(T0,-i); if(Math.random()<.15) continue; const d=state.days[s]=blankDay();
   habit.forEach(h=>{ if(i%h.every===0){ const us=unitsFor(h.p), u=rnd(us), q=rnd([1,2,0.5]); const e={uid:uid(),id:h.p.id,slot:h.slot,portion:u.k==="g"?ri(20,400):Math.round(u.g*q)}; if(u.k!=="g"){ e.u=u.k; e.q=q; } d.meals.push(e); } });
   for(let k=ri(0,4);k>0;k--) d.meals.push({uid:uid(),id:rnd(pool).id,slot:rnd(slots),portion:ri(10,500)});
   if(Math.random()<.05) d.meals.push({uid:uid(),id:"geloescht-"+uid(),slot:"lunch",portion:100});   // gelöschtes Lebensmittel
  }
  if(Math.random()<.1){ const s=addDays(T0,-ri(0,days)); state.days[s]=state.days[s]||blankDay(); state.days[s].meals.push(null,{x:1}); state.days[addDays(T0,-ri(0,days))]={meals:"kaputt"}; state=normalize(JSON.parse(JSON.stringify(state))); }   // kaputte Einträge → beim Laden bereinigt
  if(Math.random()<.3){ state.customs.push({id:"q-x",type:"custom",hidden:true,name:"Schnell",kcal:500,protein:0,carbs:0,fat:0}); state.days[addDays(T0,-1)]=state.days[addDays(T0,-1)]||blankDay(); state.days[addDays(T0,-1)].meals.push({uid:uid(),id:"q-x",slot:"lunch",portion:100}); }
  for(const slot of slots){ n++;
   ui.addSlot=slot; let list;
   try{ list=foodSuggest(slot); }catch(e){ fail("Absturz foodSuggest",String(e)); continue; }
   const d0=`Durchlauf ${it} ${slot}`;
   if(list.length>SUG_MAX) fail("Zu viele Vorschläge",d0);
   const ids=list.map(s=>s.food.id); if(new Set(ids).size!==ids.length) fail("Vorschlag doppelt",d0);
   list.forEach(s=>{ if(!foods().some(f=>f.id===s.food.id)||s.food.hidden) fail("Vorschlag ohne gültiges Lebensmittel",d0+" "+s.food.id);
    if(!(s.amt.portion>0)||!Number.isFinite(s.amt.portion)) fail("Ungültige Menge",d0+" "+JSON.stringify(s.amt));
    if(s.amt.u&&!unitsFor(s.food).some(u=>u.k===s.amt.u)) fail("Einheit gibt es nicht",d0+" "+s.amt.u);
    if(!/^(oft|gestern|vor \d+ Tagen|letzte Woche|vor \d+ Wochen)$/.test(sugWhen(s))) fail("Komischer Zeit-Text",sugWhen(s)); });
   // Feste Gewohnheit (jeden Tag zur gleichen Mahlzeit, mind. 10 Tage) steht unter den Vorschlägen dieser Mahlzeit
   habit.filter(h=>h.slot===slot&&h.every===1&&days>=20).forEach(h=>{ if(!ids.includes(h.p.id)&&list.length<SUG_MAX) fail("Tägliche Gewohnheit fehlt",d0+" "+h.p.name); });
   // HTML baut ohne Fehler, keine Doppelten zwischen Vorschlägen und Liste darunter
   let html=""; ui.query=""; try{ html=scanResults(); }catch(e){ fail("Absturz scanResults",String(e)); }
   const plus=[...html.matchAll(/data-act="(?:sug-add|quick-add)" data-id="([^"]+)"/g)].map(m=>m[1]);
   if(new Set(plus).size!==plus.length) fail("Lebensmittel doppelt im Plus-Blatt",d0);
   if(/undefined|NaN/.test(html)) fail("undefined/NaN im Plus-Blatt",d0);
   // Wie gestern: nur wenn heute leer, kopiert genau die Einträge
   const rep=mealRepeat(slot), today=(state.days[T0]||{meals:[]}).meals.filter(m=>m&&m.slot===slot);
   if(rep&&today.length) fail("Wie gestern trotz Einträgen",d0);
   if(rep){ const before=day().meals.length, k=rep.kcal, c=addRepeat(slot); const added=day().meals.slice(before);
    if(c!==rep.items.length||added.length!==c) fail("Wie gestern kopiert falsch",d0);
    const k2=added.reduce((a,m)=>a+line(foods().find(f=>f.id===m.id),m.portion).kcal,0); if(k2!==k) fail("Wie gestern: kcal stimmen nicht",d0+` ${k} vs ${k2}`);
    if(mealRepeat(slot)) fail("Wie gestern bleibt nach dem Kopieren",d0); }
  }
 }
 // Gezielt: Reihenfolge und letzte Menge
 newState(); const T=todayIso(), ei=foods().find(x=>x.id==="ei"), hf=foods().find(x=>x.id==="hafer"), la=foods().find(x=>x.id==="lachs");
 for(let i=1;i<=14;i++){ const d=state.days[addDays(T,-i)]=blankDay(); d.meals.push({uid:uid(),id:"hafer",slot:"breakfast",portion:i===1?65:50}); d.meals.push({uid:uid(),id:"lachs",slot:"dinner",portion:150}); }
 state.days[addDays(T,-30)]={...blankDay(),meals:[{uid:uid(),id:"ei",slot:"breakfast",portion:120,u:"stueck",q:2}]};
 [2,4,6].forEach(i=>state.days[addDays(T,-i)].meals.push({uid:uid(),id:"skyr",slot:"breakfast",portion:200}));
 let L=foodSuggest("breakfast"); n++;
 if(!L.length||L[0].food.id!=="hafer") fail("Täglich zum Frühstück steht nicht oben",JSON.stringify(L.map(s=>s.food.id)));
 if(L[0]&&L[0].amt.portion!==65) fail("Letzte Menge falsch",JSON.stringify(L[0]&&L[0].amt));
 // 3× Frühstück in der letzten Woche schlägt täglich Abendessen
 if(L.findIndex(s=>s.food.id==="lachs")<L.findIndex(s=>s.food.id==="skyr")) fail("Abendessen-Lebensmittel steht beim Frühstück über Frühstücks-Lebensmittel",JSON.stringify(L.map(s=>s.food.id)));
 const le=lastAmount("ei","breakfast"); if(!le||le.u!=="stueck"||le.q!==2) fail("lastAmount mit Einheit falsch",JSON.stringify(le));
 if(lastAmount("lachs","breakfast").portion!==150) fail("lastAmount andere Mahlzeit falsch","");
 if(lastAmount("banane","breakfast")!==null) fail("lastAmount ohne Verlauf nicht null","");
 // Der bearbeitete Tag zählt nicht (sonst springt die Liste beim Tippen)
 day().meals.push({uid:uid(),id:"cola",slot:"breakfast",portion:330}); L=foodSuggest("breakfast"); if(L.some(s=>s.food.id==="cola")) fail("Heutiger Eintrag wird schon vorgeschlagen","");
 // Suche mit Text bleibt gleich wie ohne Verlauf
 ["ei","hähnchen","skyr","brot","cola","xyzq"].forEach(q=>{ ui.query=q; const a=scanResults(); const keep=state.days; state.days={}; const b=scanResults(); state.days=keep; if(a!==b) fail("Suche verändert durch Verlauf",q); });
 // Leerer Zustand: kein Vorschlag, keine Überschrift
 newState(); ui.query=""; ui.addSlot="breakfast"; if(sugBlock()!=="") fail("Vorschlagsblock ohne Verlauf","");
 return {n,F};
}"""

# ---------- 2) Bedarf lernt mit ----------
BEDARF = r"""()=>{ F={}; let n=0; const T0=todayIso();
 function sim(o){
  newState(); Object.assign(state.profile,o.prof||{});
  const f=tdeeFormula(), trueT=f*o.tf; let kg=+state.profile.weight;
  state.customs.push({id:"c-t",type:"custom",name:"T",kcal:100,protein:5,carbs:12,fat:3});
  for(let i=o.days;i>=1;i--){ const s=addDays(T0,-i), eat=f*o.ef*(1+(Math.random()-.5)*o.var);
   const logged=Math.random()<o.log;
   if(logged){ state.days[s]=blankDay(); state.days[s].meals=[{uid:uid(),id:"c-t",portion:Math.round(eat),slot:"lunch"}]; }
   else if(Math.random()<.5){ state.days[s]=blankDay(); state.days[s].meals=[{uid:uid(),id:"c-t",portion:Math.round(eat*0.3),slot:"lunch"}]; }  // halb vergessener Tag
   kg+=(eat-trueT)/7700;
   if(Math.random()<o.weigh) state.weights.push({date:s,kg:+(kg+(Math.random()-.5)*o.noise).toFixed(1)});
  }
  return {f,trueT};
 }
 for(let it=0;it<4000;it++){ n++;
  const o={tf:.75+Math.random()*.55, ef:.7+Math.random()*.6, days:ri(0,45), var:Math.random()*.3, log:rnd([1,1,.9,.6,.3]), weigh:rnd([1,.8,.5,.25,.1]), noise:rnd([0,.4,.8,1.5]),
   prof:{sex:rnd(["m","w"]),age:ri(18,80),height:ri(150,200),weight:ri(45,140),activity:rnd([1.3,1.4,1.55,1.7]),goal:rnd(["muscle","lose","skin","energy"])}};
  const r=sim(o), an=adaptAnalyze(), d=JSON.stringify(o).slice(0,160);
  if(an.ok){
   if(!Number.isFinite(an.obs)||!Number.isFinite(an.raw)) fail("Ungültige Zahl in Analyse",d);
   if(an.days<AD_MIN_DAYS||an.weighs<AD_MIN_WEIGHS||an.span<AD_MIN_SPAN) fail("Analyse ok trotz zu wenig Daten",d);
   // Bei vollständigem Eintragen und normalem Rauschen nah an der Wahrheit
   if(o.log===1&&o.noise<=.8&&o.days>=28&&o.weigh>=.8&&Math.abs(an.obs-r.trueT)/r.trueT>.1) fail("Echter Verbrauch zu ungenau (>10 %)",d+` obs ${an.obs} true ${Math.round(r.trueT)}`);
  }
  // Mehrere Wochen-Checks hintereinander: Faktor bleibt in den Grenzen, Schritte ≤ 5 %
  let prev=1; for(let w=0;w<10;w++){ const nx=adaptNext(prev,an); if(!(nx>=AD_LO&&nx<=AD_HI)) fail("Faktor außerhalb 0,85–1,15",d+" "+nx); if(Math.abs(nx-prev)>AD_STEP+1e-9) fail("Wochenschritt über 5 %",d); if(!an.ok&&nx!==prev) fail("Faktor ändert sich ohne Daten",d); prev=nx; }
  // Mit Faktor gelten alle Sicherheitsregeln weiter
  state.adapt={ratio:prev}; const t=targets(), p=state.profile, bmiv=p.weight/((p.height/100)**2);
  if(![t.kcal,t.protein,t.carbs,t.fat].every(x=>Number.isFinite(x)&&x>=0)) fail("Ungültiger Richtwert mit Faktor",d);
  if(t.kcal<(p.sex==="m"?1500:1200)) fail("Unter Mindest-Kalorien mit Faktor",d);
  if(p.goal==="lose"&&bmiv<18.5){ const g=p.goal; p.goal="energy"; const k=targets().kcal; p.goal=g; if(t.kcal<k) fail("Defizit bei Untergewicht mit Faktor",d); }
  // Ausschalten → reine Formel
  p.adaptive=false; const off=targets().kcal; state.adapt=null; p.adaptive=true; const fo=targets().kcal; if(off!==fo) fail("Ausgeschaltet nicht reine Formel",d);
 }
 // Wochen-Check: nur einmal pro Woche, speichert sauber
 newState(); n++;
 if(!adaptCheck()) fail("Erster Check läuft nicht","");
 if(adaptCheck()) fail("Check läuft zweimal in einer Woche","");
 if(!state.adapt||state.adapt.week!==weekStart(T0)||state.adapt.ratio!==1) fail("Check speichert falsch",JSON.stringify(state.adapt));
 state.profile.adaptive=false; state.adapt.week="2000-01-03"; if(adaptCheck()) fail("Check läuft trotz Aus","");
 // Kaputte Daten dürfen nichts kaputt machen
 newState(); state.days[addDays(T0,-2)]={meals:null}; state.days[addDays(T0,-3)]={meals:[null,{id:"weg",portion:100},{id:"skyr",portion:"x"}]};
 state.weights=[{date:addDays(T0,-1),kg:"abc"},null,{date:"kaputt",kg:70},{date:addDays(T0,-1),kg:-5}];
 try{ const a=adaptAnalyze(); if(a.ok) fail("Kaputte Daten ergeben ok",""); adaptCheck(); detailsSheet(); adaptNote(); }catch(e){ fail("Absturz bei kaputten Daten",String(e)); }
 // Alle Wiegungen am selben Tag → Spanne 0 → nicht ok
 newState(); for(let i=0;i<20;i++){ state.weights.push({date:addDays(T0,-1),kg:80}); state.days[addDays(T0,-i-1)]={...blankDay(),meals:[{uid:uid(),id:"skyr",portion:3000,slot:"lunch"}]}; }
 if(adaptAnalyze().ok) fail("Gleicher Tag ergibt ok","");
 // Import mit kaputtem Faktor wird bereinigt
 for(const bad of ['"x"','{"ratio":"abc"}','{"ratio":null}','5']){ const d=checkImport('{"app":"Health Maxxing","data":{"profile":{},"adapt":'+bad+'}}'); n++; if(d&&d.adapt) fail("Kaputter Faktor nach Import",bad); }
 const ok=checkImport('{"app":"Health Maxxing","data":{"profile":{},"adapt":{"ratio":1.1,"week":"2026-01-05"}}}'); if(!ok||!ok.adapt||ok.adapt.ratio!==1.1) fail("Gültiger Faktor geht beim Import verloren","");
 state.adapt={ratio:5}; if(adaptRatio()!==1) fail("Faktor 5 wird benutzt",""); state.adapt={ratio:"1.1"}; if(adaptRatio()!==1.1) fail("Faktor als Text nicht gelesen","");
 return {n,F};
}"""

# ---------- 3) Tages-Score ----------
TAGESSCORE = r"""()=>{ F={}; let n=0; const pool=foods().filter(p=>!p.hidden).concat(FOODDB.ok?FOODDB.rows.slice(0,500).map(dbItem):[]);
 for(let it=0;it<20000;it++){ n++;
  newState(); state.profile.goal=rnd(["muscle","lose","skin","energy"]); state.customs=pool.filter(p=>String(p.id).startsWith("db-"));
  state.customs.push({id:"q-1",type:"custom",hidden:true,name:"Schnell",kcal:700,protein:0,carbs:0,fat:0});
  const d=day(), k=ri(0,8);
  for(let i=0;i<k;i++) d.meals.push({uid:uid(),id:Math.random()<.1?"q-1":rnd(pool).id,slot:rnd(SLOTS).id,portion:rnd([0,1,5,30,100,250,600])});
  const ds=dayScore(), real=d.meals.filter(m=>m.portion>0&&!String(m.id).startsWith("q-"));
  const row=dayScoreRow();
  if(!real.length){ if(ds) fail("Score ohne echte Lebensmittel",JSON.stringify(d.meals)); if(row) fail("Zeile ohne Lebensmittel sichtbar",""); continue; }
  if(!ds){ fail("Kein Score trotz Lebensmitteln",JSON.stringify(real)); continue; }
  if(!row||!row.includes(">"+ds.score+"<")) fail("Zeile fehlt oder falsche Zahl","");
  // Nachrechnen (unabhängig): Summe je Lebensmittel, Gewicht = max(20, kcal)
  const agg={}; real.forEach(m=>{ const p=foods().find(x=>x.id===m.id); const kc=line(p,m.portion).kcal; const a=agg[m.id]||(agg[m.id]={s:scored(p).score,k:0,w:0}); a.k+=kc; a.w+=Math.max(20,kc); });
  const v=Object.values(agg), want=Math.round(v.reduce((a,x)=>a+x.s*x.w,0)/v.reduce((a,x)=>a+x.w,0));
  if(ds.score!==want) fail("Rechenfehler im Tages-Score",`${ds.score} statt ${want}`);
  if(!(ds.score>=0&&ds.score<=100)) fail("Score außerhalb 0–100",ds.score);
  const mn=Math.min(...v.map(x=>x.s)), mx=Math.max(...v.map(x=>x.s));
  if(ds.score<mn||ds.score>mx) fail("Score liegt nicht zwischen bestem und schlechtestem Lebensmittel",`${ds.score} [${mn},${mx}]`);
  if(v.length===1&&ds.score!==v[0].s) fail("Ein Lebensmittel: Score ungleich seinem Score","");
  if(ds.best.score!==mx) fail("Top ist nicht das beste","");
  if(ds.worst&&ds.worst.score!==mn) fail("Schwächste Wahl ist nicht die schlechteste","");
  if(ds.worst&&ds.worst.p.id===ds.best.p.id) fail("Top und Schwächste gleich","");
  if(/undefined|NaN/.test(row+dayScoreSheet())) fail("undefined/NaN in Tages-Score","");
 }
 // Leerer und fremder Tag
 newState(); if(dayScore()!==null||dayScoreRow()!=="") fail("Leerer Tag zeigt Score",""); n++;
 if(dayScore("1999-01-01")!==null) fail("Unbekannter Tag zeigt Score","");
 if(state.days["1999-01-01"]) fail("dayScore legt leere Tage an","");
 return {n,F};
}"""

# ---------- 4) Erinnerungen ----------
ERINNERUNGEN = r"""async ()=>{ F={}; let n=0; const T0=todayIso();
 // Uhrzeiten
 [["23:30",30,"00:00"],["00:00",-30,"23:30"],["08:00",30,"08:30"],["12:15",-30,"11:45"]].forEach(([a,d,w])=>{ n++; const r=remHHMM(remMin(a)+d); if(r!==w) fail("Uhrzeit falsch",`${a}${d}→${r}`); });
 newState(); state.profile.rem={essen:true,t:{breakfast:"25:00",lunch:"abc",dinner:null,wiegen:"07:3",sups:"09:00"}};
 const c=remCfg(); if(c.t.breakfast!=="08:00"||c.t.lunch!=="12:30"||c.t.dinner!=="19:00"||c.t.wiegen!=="07:30") fail("Kaputte Uhrzeiten nicht bereinigt",JSON.stringify(c.t));
 state.profile.rem="kaputt"; try{ remCfg(); remSheet(); remSubTxt(); }catch(e){ fail("Absturz bei kaputten Einstellungen",String(e)); }
 // Nur wenn offen
 for(let it=0;it<5000;it++){ n++;
  newState(); state.stack=rnd([[],["crea"],["crea","d3"]]); state.profile.waterTarget=ri(4,14);
  state.profile.rem={essen:Math.random()<.7,wasser:Math.random()<.7,wiegen:Math.random()<.7,sups:Math.random()<.7};
  const d=day(); SLOTS.forEach(s=>{ if(Math.random()<.5) d.meals.push({uid:uid(),id:"skyr",slot:s.id,portion:100}); });
  d.water=ri(0,14); if(Math.random()<.5) state.weights.push({date:T0,kg:80}); state.stack.forEach(id=>{ if(Math.random()<.5) d.taken[id]=1; });
  const L=remList(T0), cf=remCfg();
  L.forEach(r=>{
   if(r.id.startsWith("m-")){ const has=d.meals.some(m=>m.slot===r.id.slice(2)); if(r.open===has) fail("Essen-Erinnerung falsch",r.id); }
   if(r.id.startsWith("w-")){ const h=+r.id.slice(2), want=Math.floor(state.profile.waterTarget*(h-8)/12); if(r.open!==(d.water<want)) fail("Wasser-Erinnerung falsch",`${h} ${d.water}/${want}`); }
   if(r.id==="g"&&r.open===state.weights.some(w=>w.date===T0)) fail("Wiegen-Erinnerung falsch","");
   if(r.id==="s"&&r.open!==state.stack.some(id=>!d.taken[id])) fail("Supplement-Erinnerung falsch","");
   if(!r.title||!r.body&&r.id!=="s"||/undefined|NaN/.test(r.title+r.body)) fail("Erinnerung ohne Text",r.id);
  });
  if(!cf.essen&&L.some(r=>r.id.startsWith("m-"))) fail("Ausgeschaltet trotzdem da","essen");
  if(!cf.wasser&&L.some(r=>r.id.startsWith("w-"))) fail("Ausgeschaltet trotzdem da","wasser");
  if(!state.stack.length&&L.some(r=>r.id==="s")) fail("Supplements ohne Stack","");
  if(state.days[addDays(T0,1)]) fail("remList legt Tage an","");
  remList(addDays(T0,3)); if(state.days[addDays(T0,3)]) fail("remList legt künftige Tage an","");
 }
 // Zeitfenster: höchstens 60 Minuten nach der Uhrzeit, nicht doppelt
 newState(); state.profile.rem={essen:true,wasser:false,wiegen:false,sups:false}; localStorage.removeItem(REM_FIRED);
 const at=(h,m)=>{ const x=new Date(); x.setHours(h,m,0,0); return x; };
 if(remDue(at(7,59)).length) fail("Zu früh fällig",""); if(remDue(at(8,0)).map(r=>r.id).join()!=="m-breakfast") fail("Pünktlich nicht fällig",JSON.stringify(remDue(at(8,0))));
 if(!remDue(at(8,59)).length) fail("Nach 59 Min. nicht mehr fällig",""); if(remDue(at(9,0)).length) fail("Nach 60 Min. noch fällig","");
 remMark("m-breakfast"); if(remDue(at(8,30)).length) fail("Zweimal am Tag","");
 day().meals.push({uid:uid(),id:"skyr",slot:"lunch",portion:100}); if(remDue(at(12,40)).length) fail("Mittag trotz Eintrag","");
 localStorage.removeItem(REM_FIRED); n+=6;
 // Store-App: Planung mit nachgebautem Plugin
 const mk=()=>{ const M={pend:[{id:42,title:"fremd"},{id:7003,title:"alt"}],sched:[],canceled:[],
   getPending:async()=>({notifications:M.pend.slice()}), cancel:async o=>{ M.canceled.push(...o.notifications.map(x=>x.id)); M.pend=M.pend.filter(p=>!o.notifications.some(x=>x.id===p.id)); },
   schedule:async o=>{ M.sched=o.notifications; M.pend.push(...o.notifications); }, requestPermissions:async()=>({display:"granted"}), addListener:()=>{} }; return M; };
 const keepCap=window.Capacitor;
 for(let it=0;it<300;it++){ n++;
  const M=mk(); window.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:M}};
  newState(); state.stack=rnd([[],["crea"]]); state.profile.rem={essen:Math.random()<.8,wasser:Math.random()<.8,wiegen:Math.random()<.8,sups:Math.random()<.8};
  if(Math.random()<.5) day().meals.push({uid:uid(),id:"skyr",slot:"dinner",portion:100});
  const ok=await remPlanNative(); if(!ok) fail("Planung schlägt fehl","");
  if(!M.canceled.includes(7003)||M.canceled.includes(42)) fail("Löscht falsche Mitteilungen",JSON.stringify(M.canceled));
  const now=Date.now(), ids=M.sched.map(x=>x.id);
  if(M.sched.length>60) fail("Mehr als 60 geplant",M.sched.length);
  if(new Set(ids).size!==ids.length) fail("Doppelte IDs","");
  if(M.sched.some(x=>!(x.schedule.at.getTime()>now))) fail("Mitteilung in der Vergangenheit","");
  if(M.sched.some(x=>x.id<REM_ID0||x.id>=REM_ID0+1000)) fail("ID außerhalb des Bereichs","");
  if(M.sched.some(x=>!x.title||/undefined|NaN/.test(x.title+x.body))) fail("Mitteilung ohne Text","");
  const t=parseIso(T0).getTime()+864e5;
  if(day().meals.some(m=>m.slot==="dinner")&&M.sched.some(x=>x.schedule.at.getTime()<t&&x.title==="Abendessen eintragen")) fail("Heute erledigt, trotzdem geplant","");
  if(!remAny()&&M.sched.length) fail("Alles aus, trotzdem geplant","");
 }
 window.Capacitor=keepCap;
 return {n,F};
}"""

# ---------- 5) Klick-Test wie ein Mensch ----------
def klicktest(b):
    probleme = []
    for lang in ["de", "en", "fr"]:
        for theme in ["light", "dark"]:
            ctx = b.new_context(locale="de-DE", viewport={"width": 390, "height": 844})
            ctx.grant_permissions(["notifications"], origin=URL.split("/index")[0])
            pg = ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
            pg.goto(URL); pg.wait_for_timeout(400)
            pg.evaluate(f"()=>{{ seedDemo(); state.profile.termsOk=TERMS_V; state.profile.lang='{lang}'; state.profile.theme='{theme}'; save(); }}")
            pg.reload(); pg.wait_for_timeout(600)
            def ev(js): return pg.evaluate("()=>{" + js + "}")
            def click(sel):
                el = pg.locator(sel).first
                if el.count() == 0: probleme.append(f"[{lang}/{theme}] nicht gefunden: {sel}"); return False
                el.click(); pg.wait_for_timeout(120); return True
            def check(cond, msg):
                if not cond: probleme.append(f"[{lang}/{theme}] {msg}")
            # Tagebuch: ohne Einträge heute kein Tages-Score
            check(pg.locator(".dsrow").count() == 0, "Tages-Score sichtbar ohne Einträge")
            # Frühstück: Plus → Vorschläge → + mit letzter Menge
            click('[data-type="scan"][data-slot="breakfast"]')
            check(pg.locator('[data-act="sug-add"]').count() > 0, "keine Vorschläge im Plus-Blatt")
            check(pg.locator('.yrep').count() == 1, "„Wie gestern“ fehlt")
            first = pg.locator('[data-act="sug-add"]').first.get_attribute("data-id")
            want = ev(f"return lastAmount('{first}','breakfast').portion")
            click('[data-act="sug-add"]')
            got = ev("const m=day().meals[day().meals.length-1]; return [m.id,m.portion,m.slot]")
            check(got == [first, want, "breakfast"], f"Vorschlag falsch eingetragen {got} statt {first},{want}")
            check(pg.locator('.yrep').count() == 0, "„Wie gestern“ bleibt trotz Eintrag")
            # Lebensmittel-Blatt übernimmt letzte Menge
            click('.yrow [data-act="open"][data-type="product"]')
            pid = ev("return ui.modal&&ui.modal.payload")
            la = ev(f"const a=lastAmount('{pid}','breakfast'); return a&&a.portion")
            if la: check(ev("return ui.portion") == la, "Blatt zeigt nicht die letzte Menge")
            click('[data-act="log-food"]')
            check(ev("return ui.modal") is None, "Blatt schließt nach Hinzufügen nicht")
            # Jetzt Tages-Score sichtbar und Zahl richtig
            check(pg.locator(".dsrow").count() == 1, "Tages-Score fehlt nach Eintrag")
            if pg.locator(".dsrow").count():
                shown = pg.locator(".dsrow .score").inner_text().strip()
                check(shown == str(ev("return dayScore().score")), "Tages-Score Zahl falsch")
                click(".dsrow"); check(ev("return ui.modal&&ui.modal.type") == "dayscore", "Tages-Score-Blatt öffnet nicht")
                click('.sheet-card [data-act="close"]')
            # Snacks: Wie gestern geht nicht (gestern keine Snacks) → kein Fehler
            click('[data-type="scan"][data-slot="snack"]'); click('.sheet-card [data-act="close"]')
            # Alles löschen per Eintrag → Score verschwindet
            ev("day().meals=[]; save(); render();"); check(pg.locator(".dsrow").count() == 0, "Score bleibt nach Löschen")
            # Profil: Richtwert-Blatt, Schalter aus/an
            click('[data-act="tab"][data-v="profil"]')
            k0 = ev("return targets().kcal")
            click('[data-type="details"]'); click('[data-act="adapt-toggle"]')
            check(ev("return state.profile.adaptive") is False, "Bedarf lässt sich nicht ausschalten")
            click('[data-act="adapt-toggle"]'); check(ev("return state.profile.adaptive") is True, "Bedarf lässt sich nicht einschalten")
            check(ev("return targets().kcal") == k0, "Richtwert nach Aus/An verändert")
            click('.sheet-card [data-act="close"]')
            # Erinnerungen: alle an, Uhrzeit ändern, aus
            click('[data-type="rem"]')
            for k in ["essen", "wasser", "wiegen", "sups"]:
                click(f'[data-act="rem-tog"][data-k="{k}"]'); pg.wait_for_timeout(150)
                check(ev(f"return remCfg().{k}") is True, f"Erinnerung {k} geht nicht an")
            click('[data-act="rem-time"][data-k="breakfast"][data-d="30"]')
            check(ev("return remCfg().t.breakfast") == "08:30", "Uhrzeit + geht nicht")
            for _ in range(3): click('[data-act="rem-time"][data-k="breakfast"][data-d="-30"]')
            check(ev("return remCfg().t.breakfast") == "07:00", "Uhrzeit − geht nicht")
            click('[data-act="rem-tog"][data-k="wasser"]'); pg.wait_for_timeout(150)
            check(ev("return remCfg().wasser") is False, "Erinnerung geht nicht aus")
            # Mitteilung im Hintergrund wirklich zeigen (Browser-Weg)
            n_shown = ev("let c=0; const o=remShow; remShow=r=>{c++;}; localStorage.removeItem(REM_FIRED); const d=new Date(), c0=remCfg(); c0.t.breakfast=remHHMM(d.getHours()*60+d.getMinutes()); c0.essen=true; remSave(c0); day().meals=day().meals.filter(m=>m.slot!=='breakfast'); Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); Object.defineProperty(Notification,'permission',{value:'granted',configurable:true}); remTick(); remTick(); delete document.visibilityState; delete Notification.permission; remShow=o; return c;")
            check(n_shown == 1, f"Mitteilung im Hintergrund {n_shown}× statt 1×")
            click('.sheet-card [data-act="close"]')
            # Bedarf-Hinweis im Tagebuch: erscheint bei Änderung, × schließt ihn
            ev("state.adapt={week:weekStart(todayIso()),ratio:1.05,ok:true,obs:3000,from:2900,to:3050,seen:false}; state.tab='heute'; state.date=todayIso(); save(); render();")
            check(pg.locator(".adnote").count() == 1, "Bedarf-Hinweis fehlt")
            click('[data-act="adapt-seen"]'); check(pg.locator(".adnote").count() == 0, "Bedarf-Hinweis geht nicht weg")
            # Alte Funktionen: alle Tabs und Blätter öffnen
            for tab in ["heute", "coach", "sport", "verlauf", "profil"]:
                click(f'[data-act="tab"][data-v="{tab}"]')
            for t in ["goal", "body", "weigh", "steps", "entries", "stack", "legal", "privacy", "impressum", "lang", "gym", "custom", "details", "rem", "dayscore"]:
                ev(f"openModal('{t}')"); pg.wait_for_timeout(60); ev("closeModal()")
            ev("state.tab='heute'; render();")
            click('[data-act="water-add"]'); check(ev("return day().water") >= 1, "Wasser + geht nicht mehr")
            click('[data-type="scan"][data-slot="lunch"]')
            pg.locator('input[data-act="query"]').fill("ei"); pg.wait_for_timeout(200)
            check(pg.locator('[data-act="quick-add"]').count() > 0, "Suche findet nichts mehr")
            check(pg.locator('[data-act="sug-add"]').count() == 0, "Vorschläge trotz Suchtext")
            click('[data-act="quick-add"]'); click('.sheet-card [data-act="close"]')
            check(ev("return day().meals.some(m=>m.slot==='lunch')"), "Suche + trägt nicht ein")
            # Neu laden: alles gespeichert, keine Fehler
            pg.reload(); pg.wait_for_timeout(500)
            check(ev("return remCfg().essen&&remCfg().t.breakfast") is not None, "Erinnerungen nicht gespeichert")
            for e in errs: probleme.append(f"[{lang}/{theme}] JS-Fehler: {e}")
            ctx.close()
    return probleme

def main():
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(locale="de-DE"); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(1500)
        pg.evaluate("()=>{" + HELP + "}")
        pg.evaluate("()=>new Promise(r=>{ const t=setInterval(()=>{ if(FOODDB.ok){ clearInterval(t); r(); } },200); setTimeout(()=>{ clearInterval(t); r(); },15000); })")
        for name, js in [("Vorschläge", VORSCHLAEGE), ("Bedarf lernt mit", BEDARF), ("Tages-Score", TAGESSCORE), ("Erinnerungen", ERINNERUNGEN)]:
            r = pg.evaluate(js)
            print(f"\n=== {name}: {r['n']:,} Fälle geprüft".replace(",", "."))
            if not r["F"]: print("    ✅ alles in Ordnung")
            for k, v in r["F"].items():
                bad += 1; print(f"    ❌ {k}: {v['n']}×")
                for e in v["ex"]: print("       z. B.", e)
        if errs: bad += 1; print("\n❌ JavaScript-Fehler:", errs[:5])
        print("\n=== Klick-Test (3 Sprachen × hell/dunkel)")
        pr = klicktest(b)
        if not pr: print("    ✅ alles in Ordnung")
        for x in pr: bad += 1; print("    ❌", x)
        b.close()
    print("\nERGEBNIS:", "❌ Probleme gefunden" if bad else "✅ Alle Prüfungen bestanden")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
