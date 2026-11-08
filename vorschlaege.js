// Life Maxxing – Schlaue Vorschläge beim Essen-Eintragen (wie bei Yazio).
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

// Menge für „+“ ohne Verlauf: übliche Portion (1 Ei, 1 Scheibe …), sonst 100 g
function sugDefault(p){ const d=unitsFor(p).find(x=>x.d); return d?{portion:d.g,u:d.k,q:1}:{portion:100}; }
function sugRow(p,amt){
  const sc=scored(p).score, kc=line(p,amt.portion).kcal, fav=favOn(p.id);
  return `<div class="yrow"><button class="grow ynm" data-act="open" data-type="product" data-id="${p.id}"><b>${fav?`<i class="yfav-dot" aria-hidden="true">★</i>`:""}${esc(p.name)}</b><div class="sub notr">${esc(amtTxt(p,amt))}</div></button>${showKcal()?`<span class="ykc">${kc} kcal</span>`:""}${scoreChip(sc)}<button class="yplus" data-act="sug-add" data-id="${p.id}" aria-label="${esc(p.name)} hinzufügen">+</button></div>`;
}

// ---------- Favoriten ----------
function favs(){ return Array.isArray(state.favs)?state.favs:[]; }
function favOn(id){ return favs().includes(id); }
function favToggle(id){
  ensureDb(id); const p=foods().find(x=>x.id===id); if(!p) return false;
  state.favs=favOn(id)?favs().filter(x=>x!==id):[id].concat(favs()).slice(0,200);
  save(); return favOn(id);
}
function favList(){ return favs().map(sugFood).filter(Boolean); }

// ---------- Filter oben im „+“-Blatt (nur ohne Suchtext): Alle · ★ Favoriten ----------
// Bei beiden steht darunter immer die normale Liste „Alle Lebensmittel“ – es wirkt also nie leer.
function scanFilter(){ return ui.scanTab==="fav"?"fav":"alle"; }
function scanTabs(){
  const t=scanFilter(), n=favList().length;
  const chip=(k,inner)=>`<button class="${t===k?"on":""}" role="tab" aria-selected="${t===k}" data-act="scan-tab" data-v="${k}">${inner}</button>`;
  return `<div class="yfilter" role="tablist">${chip("alle","Alle")}${chip("fav",`<i class="yf-star" aria-hidden="true">★</i><span>Favoriten</span>${n?`<em class="yf-n notr">${n}</em>`:""}`)}</div>`;
}
// Favoriten-Bereich (mit der zuletzt gegessenen Menge, sonst der üblichen Portion)
function favBlock(){
  const slot=ui.addSlot||"snack", L=favList();
  const body=L.length?L.map(p=>sugRow(p,lastAmount(p.id,slot)||sugDefault(p))).join("")
    :`<div class="yfav-empty"><span class="yfav-big" aria-hidden="true">☆</span><div><b>Noch keine Favoriten</b><div class="sub">Öffne ein Lebensmittel und tippe oben auf ☆.</div></div></div>`;
  return `<div class="ylabel">Deine Favoriten</div>${body}<div class="ylabel">Alle Lebensmittel</div>`;
}
// Oberer Bereich je nach Filter und welche Lebensmittel darin schon stehen (damit unten nichts doppelt ist)
function scanTop(){ return scanFilter()==="fav"?favBlock():sugBlock(); }
function scanTopIds(){ return scanFilter()==="fav"?new Set(favList().map(p=>p.id)):sugIds(); }

// Filter „Alle“: Vorschläge oben (nur ohne Suchtext)
function sugBlock(){
  const slot=ui.addSlot||"snack", list=foodSuggest(slot);
  if(!list.length) return "";
  return `<div class="ylabel">Oft gegessen</div>${list.map(s=>sugRow(s.food,s.amt)).join("")}<div class="ylabel">Alle Lebensmittel</div>`;
}
// IDs, die schon oben vorgeschlagen werden (damit sie in der Liste darunter nicht doppelt stehen)
function sugIds(){ return new Set(foodSuggest(ui.addSlot||"snack").map(s=>s.food.id)); }
