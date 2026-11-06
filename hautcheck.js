// Health Maxxing – Hautbild: im Tagebuch unter „Dein Tag“ die Haut von 1 bis 10 bewerten, nach 7 Einträgen zeigt der Verlauf die Hautanalyse.
// Verglichen wird nur mit eigenen Einträgen: Zucker, Fast Food, Milchprodukte und Wasser vom Vortag, Schlaf der letzten Nacht.
// Wichtig: Es sind Auffälligkeiten in den eigenen Daten, keine Ursachen und keine Diagnose.

const SK_MIN=7;            // ab so vielen Einträgen gibt es die Analyse
const SK_SUGAR=50;         // ab so viel Gramm Zucker am Tag gilt der Tag als „viel Zucker“
const SK_CAT=new Map();    // Lebensmittel-Art pro Produkt merken (schneller)

function skinVal(s){ const v=(state.days[s]||{}).skin; return Number.isFinite(v)&&v>=1&&v<=10?v:null; }
function skinCat(p){ if(!SK_CAT.has(p.id)){ let c=null; try{ c=typeof foodCat==="function"?foodCat(p):null; }catch(e){} SK_CAT.set(p.id,c); } return SK_CAT.get(p.id); }
function skinItems(s){
  const d=state.days[s]; if(!d||!Array.isArray(d.meals)||!d.meals.length) return null;
  const out=[]; d.meals.forEach(m=>{ if(!m||!(m.portion>0)) return; const p=foods().find(x=>x.id===m.id); if(p&&!p.hidden&&p.type!=="sup"&&p.type!=="care") out.push({p,g:m.portion}); });
  return out.length?out:null;
}
// Jede Frage gibt pro Tag ja / nein / null (keine Daten) zurück
const SK_FACTORS=[
  {id:"sugar", emo:"🍬", txt:"Nach Tagen mit viel Zucker", f:s=>{ const it=skinItems(addDays(s,-1)); if(!it) return null;
    return it.reduce((a,x)=>a+(Number.isFinite(x.p.sugar)?x.p.sugar*x.g/100:0),0)>=SK_SUGAR; }},
  {id:"fastfood", emo:"🍔", txt:"Nach Tagen mit Fast Food", f:s=>{ const it=skinItems(addDays(s,-1)); if(!it) return null;
    return it.some(x=>(skinCat(x.p)||{}).id==="fastfood"); }},
  {id:"dairy", emo:"🥛", txt:"Nach Tagen mit Milchprodukten", f:s=>{ const it=skinItems(addDays(s,-1)); if(!it) return null;
    return it.some(x=>(skinCat(x.p)||{}).d===1); }},
  {id:"sleep", emo:"😴", txt:"Nach Nächten mit 7 h Schlaf oder mehr", f:s=>{ const v=(state.days[s]||{}).sleep; return v==null?null:v>=7; }},
  {id:"water", emo:"💧", txt:"Nach Tagen mit genug Wasser", f:s=>{ const d=state.days[addDays(s,-1)]; if(!d||!(d.water>0)) return null;
    return d.water>=(state.profile.waterTarget||8); }}
];
function skinDays(){ return Object.keys(state.days).filter(s=>skinVal(s)!=null).sort(); }
function skinAvg(list){ return list.length?list.reduce((a,b)=>a+b,0)/list.length:null; }
// Auffälligkeiten: Unterschied im Schnitt zwischen „ja“- und „nein“-Tagen, mind. 2 Tage je Gruppe, mind. 0,5 Punkte
function skinInsights(){
  const all=skinDays(); if(all.length<SK_MIN) return [];
  return SK_FACTORS.map(fc=>{
    const yes=[], no=[];
    all.forEach(s=>{ const r=fc.f(s); if(r===true) yes.push(skinVal(s)); else if(r===false) no.push(skinVal(s)); });
    if(yes.length<2||no.length<2) return null;
    const diff=Math.round((skinAvg(yes)-skinAvg(no))*10)/10;
    return Math.abs(diff)>=0.5?{fc,diff,n:yes.length}:null;
  }).filter(Boolean).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff)).slice(0,3);
}
function skinTone(v){ return v<=4?"bad":v<=6?"warn":"ok"; }
function skinScale(cur,act){
  return `<div class="skscale">${Array.from({length:10},(_,i)=>i+1).map(v=>`<button class="sk-${skinTone(v)} ${cur===v?"on":""}" data-act="${act||"skin-rate"}" data-v="${v}" aria-label="Haut ${v} von 10">${v}</button>`).join("")}</div>
    <div class="skends"><span>schlecht</span><span>sehr gut</span></div>`;
}
function skinProgress(n){
  const left=Math.max(0,SK_MIN-n);
  return `<div class="skprog"><div class="skdots">${Array.from({length:SK_MIN},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("")}</div>
    <span class="sub">${left?`Analyse in ${left} ${left===1?"Tag":"Tagen"}`:"Analyse ist bereit"}</span></div>`;
}

// Verlauf: Karte „Haut“ mit Verlauf, Durchschnitt und Auffälligkeiten
function skinCard(){
  const cur=skinVal(state.date), all=skinDays(), n=all.length;
  const pts=Array.from({length:30},(_,i)=>addDays(state.date,i-29)).map((s,i)=>({s,i,v:skinVal(s)}));
  const v30=pts.map(q=>q.v).filter(v=>v!=null), v7=pts.slice(23).map(q=>q.v).filter(v=>v!=null);
  const fmt=v=>v==null?"–":de(v,1);
  const W=300,H=96,P=6,step=(W-2*P)/30,bw=step-3, Y=v=>H-14-(v/10)*(H-22);
  const col={bad:tc("bad"),warn:tc("warn"),ok:tc("accent")};
  const bars=pts.map(q=>{ const x=(P+q.i*step).toFixed(1);
    return q.v==null?`<rect x="${x}" y="${H-17}" width="${bw.toFixed(1)}" height="3" rx="1.5" fill="${tc("track")}"/>`
      :`<rect x="${x}" y="${Y(q.v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(H-14-Y(q.v)).toFixed(1)}" rx="3" fill="${col[skinTone(q.v)]}" ${q.s===state.date?`stroke="${tc("ink")}" stroke-width="1.2"`:""}/>`; }).join("");
  const svg=`<svg class="chart" viewBox="0 0 ${W} ${H}">${bars}
    <text x="${P}" y="${H-1}" font-size="12" fill="${tc("ink-2")}">${parseIso(pts[0].s).getDate()}.${parseIso(pts[0].s).getMonth()+1}.</text>
    <text x="${W-P}" y="${H-1}" text-anchor="end" font-size="12" fill="${tc("ink-2")}">${labelDate(state.date)}</text></svg>`;
  const ins=skinInsights();
  const edit=cur==null||ui.skinEdit;
  const analysis=n<SK_MIN?`<div class="skbox">${skinProgress(n)}<div class="sub mt-2">Danach siehst du hier, was dir auffällt: Zucker, Fast Food, Milchprodukte, Schlaf und Wasser.</div></div>`
    :ins.length?`<div class="skins">${ins.map(x=>`<div class="skin-row"><div class="bubble">${x.fc.emo}</div><div class="grow">${x.fc.txt}</div><span class="skdelta ${x.diff<0?"down":"up"}">${x.diff>0?"+":"−"}${de(Math.abs(x.diff),1)}</span></div>`).join("")}</div>
      <div class="sub mt-2">Unterschied deiner Haut im Schnitt (Punkte). Zeigt Auffälligkeiten in deinen Einträgen, keine Ursachen.</div>`
    :`<div class="skbox sub">Noch keine klaren Muster. Je mehr Tage du einträgst, desto genauer wird es.</div>`;
  return `<div class="section"><h2>Hautanalyse</h2><span class="sub">Ø ${fmt(skinAvg(v30))} · 30 Tage</span></div>
  <div class="card">
    <div class="row space"><div><b>${labelDate(state.date)}</b><div class="sub">Wie ist deine Haut?</div></div>
      ${edit?"":`<button class="row gap-2" data-act="skin-edit"><span class="skbig sk-${skinTone(cur)}">${cur}</span><span class="sub">/ 10 ›</span></button>`}</div>
    ${edit?`<div class="mt-3">${skinScale(cur)}</div>`:""}
    <div class="mt-3">${v30.length?svg:`<div class="sub li">Bewerte deine Haut, dann erscheint hier der Verlauf.</div>`}</div>
    <div class="kpi"><div><span>Ø 7 Tage</span><b>${fmt(skinAvg(v7))}</b></div><div><span>Ø 30 Tage</span><b>${fmt(skinAvg(v30))}</b></div><div><span>Einträge</span><b>${n}</b></div></div>
    <div class="skhead">Auffälligkeiten</div>
    ${analysis}
  </div>`;
}
