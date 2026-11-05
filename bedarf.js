// Health Maxxing – Kalorienbedarf lernt mit (Idee wie bei MacroFactor).
// Die Formel im Fragebogen ist nur eine Schätzung. Aus dem, was jemand wirklich isst, und wie sich das Gewicht
// dabei verändert, sieht man den echten Verbrauch:
//   echter Verbrauch ≈ Durchschnitt gegessen − Gewichtsänderung pro Tag × 7.700 kcal
// Einmal pro Woche (montags) wird neu gerechnet. Gespeichert wird nur ein Faktor (z. B. 1,06 = 6 % mehr als die Formel).
// So passt er auch, wenn sich Gewicht, Ziel oder Training später ändern.
//
// Sicherheit:
//  - erst ab genug Daten: mind. 10 vollständig eingetragene Tage und 6 Wiegungen über mind. 14 Tage (letzte 4 Wochen)
//  - Tage mit sehr wenig (unter 50 % der Formel) oder unrealistisch viel (über 250 %) Essen zählen nicht – meist vergessen
//  - Faktor bleibt zwischen 0,85 und 1,15, ändert sich pro Woche um höchstens 0,05
//  - alle bisherigen Regeln (Mindest-Kalorien, kein Defizit bei Untergewicht …) gelten danach unverändert in targets()

const AD_WIN=28, AD_MIN_DAYS=10, AD_MIN_WEIGHS=6, AD_MIN_SPAN=14, AD_LO=0.85, AD_HI=1.15, AD_STEP=0.05, KCAL_PER_KG=7700;

// Verbrauch nach Formel (ohne Ziel-Plus/-Minus) – gleiche Rechnung wie in targets()
function tdeeFormula(p){
  p=p||state.profile; const w=+p.weight||70, h=+p.height||175;
  const bmr=10*w+6.25*h-5*(+p.age||30)+(p.sex==="m"?5:-161);
  return bmr*(PAL_ALLTAG[p.activity]||p.activity||1.375)+trainKcal(p);
}
// Faktor, mit dem targets() rechnet. 1 = reine Formel.
function adaptRatio(){
  if(state.profile.adaptive===false) return 1;
  const a=state.adapt, r=a&&+a.ratio;
  return Number.isFinite(r)&&r>=AD_LO&&r<=AD_HI?r:1;
}

// Kalorien eines Tages, ohne leere Tage anzulegen (day() würde sie anlegen)
function adDayKcal(d,map){
  if(!d||!Array.isArray(d.meals)) return 0;
  return d.meals.reduce((n,m)=>{ const p=m&&map.get(m.id); return n+(p&&m.portion>0?line(p,m.portion).kcal:0); },0);
}
// Steigung (kg pro Tag) einer Geraden durch die Wiegepunkte
function adSlope(pts){
  const n=pts.length, mx=pts.reduce((a,p)=>a+p.x,0)/n, my=pts.reduce((a,p)=>a+p.y,0)/n;
  let num=0, den=0; pts.forEach(p=>{ num+=(p.x-mx)*(p.y-my); den+=(p.x-mx)**2; });
  return den?num/den:0;
}

// Rechnet aus den letzten 4 Wochen (bis gestern, heute ist noch nicht fertig). Ändert nichts am Zustand.
function adaptAnalyze(today){
  today=today||todayIso();
  const from=addDays(today,-AD_WIN), to=addDays(today,-1), formula=tdeeFormula();
  const map=new Map(foods().map(f=>[f.id,f]));
  const kc=[];
  for(let s=from;s<=to;s=addDays(s,1)){ const k=adDayKcal(state.days[s],map); if(k>=formula*0.5&&k<=formula*2.5) kc.push(k); }
  // Mehrere Wiegungen am selben Tag: die letzte zählt
  const byDay={}; (state.weights||[]).forEach(w=>{ if(w&&w.date>=from&&w.date<=today&&Number.isFinite(+w.kg)&&w.kg>0) byDay[w.date]=+w.kg; });
  const dates=Object.keys(byDay).sort(), t0=dates.length?parseIso(dates[0]).getTime():0;
  const pts=dates.map(d=>({x:(parseIso(d).getTime()-t0)/864e5, y:byDay[d]}));
  const span=pts.length?pts[pts.length-1].x:0;
  const res={ formula:Math.round(formula), days:kc.length, weighs:pts.length, span:Math.round(span) };
  if(kc.length<AD_MIN_DAYS||pts.length<AD_MIN_WEIGHS||span<AD_MIN_SPAN) return Object.assign(res,{ok:false});
  const intake=kc.reduce((a,b)=>a+b,0)/kc.length, slope=adSlope(pts), obs=intake-slope*KCAL_PER_KG;
  if(!Number.isFinite(obs)||obs<=0) return Object.assign(res,{ok:false});
  return Object.assign(res,{ ok:true, intake:Math.round(intake), kgWeek:+(slope*7).toFixed(2), obs:Math.round(obs), raw:obs/formula });
}

// Neuer Faktor aus der Analyse: vorsichtig – je mehr Daten, desto mehr Vertrauen, pro Woche höchstens ±5 %
function adaptNext(prev,an){
  if(!an.ok) return prev;
  const raw=Math.min(AD_HI,Math.max(AD_LO,an.raw));
  const conf=Math.min(1,an.days/21)*Math.min(1,an.weighs/10);
  const want=1+conf*(raw-1);
  const r=prev+Math.max(-AD_STEP,Math.min(AD_STEP,want-prev));
  return Math.round(Math.min(AD_HI,Math.max(AD_LO,r))*1000)/1000;
}

// Wöchentlicher Check (läuft beim Öffnen). Rechnet höchstens einmal pro Woche.
function adaptCheck(){
  if(!state.onboarded||state.profile.adaptive===false) return false;
  const wk=weekStart(todayIso()), a=state.adapt||{};
  if(a.week===wk) return false;
  const prev=adaptRatio(), an=adaptAnalyze(), ratio=adaptNext(prev,an);
  const k=r=>{ const t=state.adapt; state.adapt={ratio:r}; const v=targets().kcal; state.adapt=t; return v; };
  const before=k(prev), after=k(ratio);
  state.adapt={ week:wk, ratio, ok:an.ok, days:an.days, weighs:an.weighs, span:an.span, obs:an.obs||null, kgWeek:an.ok?an.kgWeek:null, from:before, to:after, seen:Math.abs(after-before)<20 };
  save(); return true;
}

// Text für Profil und Erklärung
function adaptStatus(){
  const p=state.profile, a=state.adapt||{}, r=adaptRatio(), base=Math.round(tdeeFormula()), diff=Math.round(base*r)-base;
  // short = Text, delta = Änderung in kcal (wird getrennt angezeigt, damit + und − beim Übersetzen nicht stören)
  if(p.adaptive===false) return { k:"off", short:"Aus – fester Wert aus dem Fragebogen" };
  if(r!==1||(a.ok&&a.obs)) return { k:"on", short:r===1?"Aktiv – Formel passt zu dir":"Aktiv – angepasst um", delta:r===1?null:diff, obs:a.ok?a.obs:null, base, kgWeek:a.ok?a.kgWeek:null };
  return { k:"learn", short:"Lernt noch – braucht mehr Einträge" };
}
// Zahl mit Vorzeichen, z. B. „+140 kcal“ / „−0,21 kg“ (nicht übersetzt)
function adSigned(v,unit,dec){ return `<span class="notr">${v>0?"+":v<0?"−":"±"}${de(Math.abs(v),dec||0)} ${unit}</span>`; }

function detailsSheet(){
  const t=targets(), st=adaptStatus(), p=state.profile, an=adaptAnalyze();
  const need=`<div class="adneed"><div><b>${Math.min(an.days,AD_MIN_DAYS)} / ${AD_MIN_DAYS}</b><span>Tage mit Essen</span></div><div><b>${Math.min(an.weighs,AD_MIN_WEIGHS)} / ${AD_MIN_WEIGHS}</b><span>Wiegungen</span></div></div>`;
  const body=st.k==="off"?`<p class="sub">Der Richtwert bleibt fest bei der Formel aus dem Fragebogen.</p>`
    : st.k==="learn"?`<p class="sub">Die App vergleicht, was du isst, mit deinem Gewichtsverlauf. So findet sie deinen echten Bedarf. Dafür braucht sie in den letzten 4 Wochen:</p>${need}<p class="sub">Trag möglichst alles ein, was du isst, und wieg dich morgens nüchtern.</p>`
    : `<div class="adneed"><div><b>${de(st.obs||Math.round(st.base*adaptRatio()))}</b><span>kcal echter Verbrauch</span></div><div><b>${de(st.base)}</b><span>kcal laut Formel</span></div></div>${st.kgWeek!=null?`<p class="sub">Gewicht pro Woche zuletzt: ${adSigned(st.kgWeek,"kg",2)}</p>`:""}<p class="sub">Einmal pro Woche passt die App deinen Richtwert vorsichtig an (höchstens 5 % pro Woche).</p>`;
  return `<h2>Richtwert</h2>
    <p class="sub">${de(t.kcal)} kcal · ${t.protein} g Protein. Berechnet aus Körper, Alltag, Training pro Woche und Ziel. Kein ärztlicher Wert.</p>
    <div class="group mt-3"><button class="g-row" data-act="adapt-toggle"><div class="grow"><b>Bedarf lernt mit</b><div class="sub">${esc(st.short)}${st.delta!=null?" "+adSigned(st.delta,"kcal"):""}</div></div>${tog(p.adaptive!==false)}</button></div>
    <div class="gap"></div>${body}
    <div class="gap"></div><button class="pill primary" data-act="close">OK</button>`;
}

// Kleiner Hinweis im Tagebuch, wenn sich der Richtwert in dieser Woche geändert hat (wegtippbar)
function adaptNote(){
  const a=state.adapt;
  if(!a||a.seen||!showKcal()||state.profile.adaptive===false||state.date!==todayIso()||a.week!==weekStart(todayIso())) return "";
  if(!Number.isFinite(a.from)||!Number.isFinite(a.to)||Math.abs(a.to-a.from)<20) return "";
  return `<div class="adnote"><button class="grow adnote-go" data-act="open" data-type="details"><span aria-hidden="true">${a.to>a.from?"📈":"📉"}</span><span class="grow"><b>Richtwert angepasst</b><span class="sub notr">${de(a.from)} → ${de(a.to)} kcal</span></span><span class="chev">›</span></button><button class="x" data-act="adapt-seen" aria-label="Hinweis schließen">×</button></div>`;
}
