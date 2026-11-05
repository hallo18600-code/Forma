// Health Maxxing – Schlaue Vorschläge beim Essen-Eintragen (wie bei Yazio).
// Wer etwas öfter isst, sieht es beim „+“ direkt oben – passend zur Mahlzeit und mit der zuletzt gegessenen Menge.
// Alles wird nur aus dem eigenen Tagebuch auf dem Gerät berechnet.
//
// Punkte je Lebensmittel (letzte 60 Tage, ohne den Tag, der gerade bearbeitet wird):
//   Grundwert pro Tag mit dem Lebensmittel: wird mit dem Alter weniger (nach 3 Wochen ca. ein Drittel)
//   × 2,5 wenn es zur gleichen Mahlzeit gegessen wurde (Frühstück → Frühstück), × 0,4 bei anderer Mahlzeit
//   × 1,2 wenn es am gleichen Wochentag war (feste Wochen-Gewohnheiten)
// Pro Tag zählt ein Lebensmittel nur einmal (2 Eier in zwei Einträgen = ein Tag).

const SUG_DAYS = 60, SUG_MAX = 8;

// Gültiges, sichtbares Lebensmittel zu einer ID (gelöschte und „Schnell hinzufügen“-Einträge fallen weg)
function sugFood(id){ const p=foods().find(x=>x.id===id); return p&&!p.hidden?p:null; }

function foodSuggest(slot, limit){
  const base=state.date||todayIso(), wd=parseIso(base).getDay(), acc={};
  for(let i=1;i<=SUG_DAYS;i++){
    const s=addDays(base,-i), d=state.days[s];
    if(!d||!Array.isArray(d.meals)||!d.meals.length) continue;
    const decay=Math.exp(-(i-1)/21), sameWd=parseIso(s).getDay()===wd?1.2:1, best={};
    d.meals.forEach(m=>{
      if(!m||!m.id||!(m.portion>0)) return;
      const w=decay*sameWd*(m.slot===slot?2.5:0.4);
      if(!best[m.id]||w>best[m.id].w) best[m.id]={w,m};
    });
    Object.keys(best).forEach(id=>{
      const a=acc[id]||(acc[id]={id,score:0,days:0,slotDays:0,last:null,lastAny:null,age:i});
      a.score+=best[id].w; a.days++;
      // Menge: die letzte zur gleichen Mahlzeit, sonst die letzte überhaupt (Tage laufen von neu nach alt)
      const same=d.meals.filter(m=>m&&m.id===id&&m.slot===slot&&m.portion>0);
      if(same.length){ a.slotDays++; if(!a.last) a.last=same[same.length-1]; }
      if(!a.lastAny) a.lastAny=best[id].m;
    });
  }
  return Object.values(acc)
    .map(a=>Object.assign(a,{food:sugFood(a.id)}))
    .filter(a=>a.food)
    .sort((x,y)=>y.score-x.score||x.age-y.age||String(x.food.name).localeCompare(String(y.food.name)))
    .slice(0,limit||SUG_MAX)
    .map(a=>({ food:a.food, amt:sugAmt(a.food,a.last||a.lastAny), age:a.age, days:a.days, slotDays:a.slotDays }));
}

// Menge aus einem früheren Eintrag übernehmen. Gibt es die Einheit nicht mehr, nur die Gramm.
function sugAmt(p,m){
  const g=Math.max(1,Math.round(+m.portion||100)), us=unitsFor(p), u=m.u&&us.find(x=>x.k===m.u);
  return u&&u.k!=="g"?{portion:g,u:u.k,q:m.q||1}:{portion:g};
}

// Letzte Menge eines Lebensmittels (für das Lebensmittel-Blatt). Gleiche Mahlzeit zuerst, dann irgendeine.
function lastAmount(id, slot){
  const p=foods().find(x=>x.id===id); if(!p) return null;
  const base=state.date||todayIso();
  let any=null;
  for(let i=0;i<=SUG_DAYS;i++){
    const d=state.days[addDays(base,-i)]; if(!d||!Array.isArray(d.meals)) continue;
    // Am bearbeiteten Tag selbst nur Einträge, die schon da sind (gleiche Logik, neueste zuerst)
    const ms=d.meals.filter(m=>m&&m.id===id&&m.portion>0);
    if(!ms.length) continue;
    const same=ms.filter(m=>m.slot===slot);
    if(same.length) return sugAmt(p,same[same.length-1]);
    if(!any) any=sugAmt(p,ms[ms.length-1]);
  }
  return any;
}

// „Wie gestern“: die letzte Mahlzeit gleicher Art aus den letzten 7 Tagen – nur wenn heute dort noch nichts steht
function mealRepeat(slot){
  const base=state.date||todayIso(), today=state.days[base];
  if(today&&(today.meals||[]).some(m=>m&&m.slot===slot)) return null;
  for(let i=1;i<=7;i++){
    const s=addDays(base,-i), d=state.days[s]; if(!d||!Array.isArray(d.meals)) continue;
    const items=d.meals.filter(m=>m&&m.slot===slot&&m.portion>0).map(m=>({m,p:sugFood(m.id)})).filter(x=>x.p);
    if(items.length) return { date:s, items, kcal:items.reduce((n,x)=>n+line(x.p,x.m.portion).kcal,0) };
  }
  return null;
}
function repeatLabel(s){
  const base=state.date||todayIso();
  if(s===addDays(base,-1)) return "Wie gestern";
  return "Wie am "+parseIso(s).toLocaleDateString(LOC,{weekday:"long"});
}
function addRepeat(slot){
  const r=mealRepeat(slot); if(!r) return 0;
  r.items.forEach(({m})=>{ const e={uid:uid(),id:m.id,portion:m.portion,slot}; if(m.u&&m.q){ e.u=m.u; e.q=m.q; } day().meals.push(e); });
  return r.items.length;
}

// Wie lange her, kurz: „gestern“, „vor 3 Tagen“ – bei festen Gewohnheiten „oft“
function sugWhen(s){
  if(s.slotDays>=4||s.days>=6) return "oft";
  if(s.age===1) return "gestern";
  if(s.age<7) return "vor "+s.age+" Tagen";
  if(s.age<14) return "letzte Woche";
  return "vor "+Math.round(s.age/7)+" Wochen";
}

// Liste oben im „+“-Blatt (nur ohne Suchtext)
function sugBlock(){
  const slot=ui.addSlot||"snack", list=foodSuggest(slot), rep=mealRepeat(slot);
  if(!list.length&&!rep) return "";
  const names=rep?rep.items.map(x=>x.p.name):[];
  const repRow=rep?`<button class="yrep" data-act="sug-repeat"><span class="yrep-ic" aria-hidden="true">↺</span><span class="grow ynm"><b>${repeatLabel(rep.date)}</b><span class="sub">${names.slice(0,3).map(n=>`<span>${esc(n)}</span>`).join(", ")}${names.length>3?` <span class="notr">+${names.length-3}</span>`:""}</span></span>${showKcal()?`<span class="ykc">${rep.kcal} kcal</span>`:""}<span class="yplus" aria-hidden="true">+</span></button>`:"";
  const row=s=>{
    const p=s.food, sc=scored(p).score, kc=line(p,s.amt.portion).kcal;
    return `<div class="yrow"><button class="grow ynm" data-act="open" data-type="product" data-id="${p.id}"><b>${esc(p.name)}</b><div class="sub"><span class="notr">${esc(amtTxt(p,s.amt))}</span> · ${sugWhen(s)}</div></button>${showKcal()?`<span class="ykc">${kc} kcal</span>`:""}<div class="score ${scoreClass(sc)}">${sc}</div><button class="yplus" data-act="sug-add" data-id="${p.id}" aria-label="${esc(p.name)} hinzufügen">+</button></div>`;
  };
  return `${repRow}${list.length?`<div class="ylabel">Für dich</div>${list.map(row).join("")}<div class="ylabel">Alle Lebensmittel</div>`:""}`;
}
// IDs, die schon oben vorgeschlagen werden (damit sie in der Liste darunter nicht doppelt stehen)
function sugIds(){ return new Set(foodSuggest(ui.addSlot||"snack").map(s=>s.food.id)); }
