// Health Maxxing – Profil
function renderProfil(){
  const p=state.profile, t=targets();
  return `<div class="scroll pad">
    <div class="topbar"><div><h1>Profil</h1><div class="sub">Gespeichert auf diesem Gerät</div></div></div>
    <div class="card">
      <div class="row"><div class="avatar">${esc((p.name||"F").slice(0,1).toUpperCase())}</div>
        <div class="grow"><h2>${esc(p.name||"Ohne Name")}</h2><div class="sub">${goalName()}</div></div></div>
      <div class="kpi">
        <div><span>Gewicht</span><b>${de(lastWeight(),1)}</b><span>kg</span></div>
        <div><span>Ziel</span><b>${de(p.target,1)}</b><span>kg</span></div>
        <div><span>Richtwert</span><b>${de(t.kcal)}</b><span>kcal</span></div>
      </div>
    </div>
    ${safetyNote()}
    <div class="section"><h2>Körper</h2></div>
    <div class="group">
      <button class="g-row" data-act="open" data-type="goal"><span class="bubble">🎯</span><div class="grow"><b>Ziel</b><div class="sub">${goalName()}</div></div><span class="chev">›</span></button>
      <button class="g-row" data-act="open" data-type="body"><span class="bubble">📏</span><div class="grow"><b>Körperdaten</b><div class="sub">${p.height} cm · ${p.age} Jahre · ${!p.trainFreq?"Training offen":p.trainFreq==="Gar nicht"?"kein Training":"Training "+p.trainFreq.replace(" pro Woche","")+"/Woche"}</div></div><span class="chev">›</span></button>
      <button class="g-row" data-act="open" data-type="weigh"><span class="bubble">⚖️</span><div class="grow"><b>Gewicht</b><div class="sub">${de(lastWeight(),1)} kg · Ziel ${de(p.target,1)} kg</div></div><span class="chev">›</span></button>
      <button class="g-row" data-act="ob-redo"><span class="bubble">📝</span><div class="grow"><b>Fragebogen</b><div class="sub">Antworten ändern, Plan neu berechnen</div></div><span class="chev">›</span></button>
      <div class="g-row"><span class="bubble">🍽️</span><div class="grow"><b>Richtwert</b><div class="sub">${de(t.kcal)} kcal · ${t.protein} g Protein</div></div></div>
    </div>
    <div class="section"><h2>Ernährung & Haut</h2></div>
    <div class="group">
      ${PREFS.map(([t,k,icon,label])=>`<button class="g-row" data-act="open" data-type="pref" data-id="${t}:${k}"><span class="bubble">${icon}</span><div class="grow"><b>${label}</b><div class="sub">${esc(prefTxt(t,k))}</div></div><span class="chev">›</span></button>`).join("")}
    </div>
    <div class="section"><h2>App</h2></div>
    <div class="group">
      <div class="g-row"><div class="grow"><b>Darstellung</b></div>
        <div class="seg seg-theme" role="radiogroup" aria-label="Darstellung">${[["light","Hell"],["dark","Dunkel"],["system","System"]].map(([v,l])=>`<button class="${(p.theme||"system")===v?"on":""}" role="radio" aria-checked="${(p.theme||"system")===v}" data-act="theme" data-v="${v}">${l}</button>`).join("")}</div></div>
      <button class="g-row" data-act="open" data-type="lang"><div class="grow"><b>Sprache</b></div><span class="sub notr">${LANGS[LANG]}</span><span class="chev">›</span></button>
      <button class="g-row" data-act="toggle" data-k="calories"><div class="grow"><b>Kalorien im Tagebuch</b></div>${tog(p.calories)}</button>
      ${PARTNERS_ENABLED?`<button class="g-row" data-act="toggle" data-k="affiliates"><div class="grow"><b>Partnerlinks</b><div class="sub">Anzeige, Score bleibt unabhängig</div></div>${tog(p.affiliates)}</button>`:""}
    </div>
    <div class="section"><h2>Konto</h2></div>
    <div class="group">
      <button class="g-row" data-act="open" data-type="privacy"><span class="bubble">🔒</span><div class="grow"><b>Datenschutz</b><div class="sub">Deine Daten bleiben auf dem Gerät</div></div><span class="chev">›</span></button>
      <button class="g-row" data-act="open" data-type="legal"><div class="grow"><b>Hinweise</b></div><span class="chev">›</span></button>
      <button class="g-row" data-act="open" data-type="impressum"><div class="grow"><b>Impressum</b></div><span class="chev">›</span></button>
      <button class="g-row" data-act="backup"><span class="bubble">⬇️</span><div class="grow"><b>Daten exportieren</b><div class="sub">${state.workouts.length} Trainings · ${state.weights.length} Wiegepunkte · als Datei</div></div></button>
      <button class="g-row" data-act="import-pick"><span class="bubble">⬆️</span><div class="grow"><b>Daten importieren</b><div class="sub">Aus einer gesicherten Datei wiederherstellen</div></div></button>
      <button class="g-row" data-act="reset"><div class="grow"><b class="t-bad">Alles löschen</b><div class="sub">Mit Sicherheitsabfrage</div></div></button>
    </div>
  </div>`;
}

// Ernährung & Haut: fließt in jede Lebensmittel-Bewertung ein
const PREFS=[["gesundheit","stil","🥗","Ernährung"],["gesundheit","meiden","🚫","Meiden"],["gesundheit","intol","⚠️","Unverträglichkeiten"],["haut","stoert","💧","Haut-Probleme"]];
function prefTxt(t,k){
  const v=((state.coach.answers||{})[t]||{})[k], arr=[].concat(v||[]).filter(x=>!["Nichts","Nein, alles okay","Nichts Bestimmtes"].includes(x));
  if(k==="stil") return v?String(v).replace("Alles","Nichts Bestimmtes").replace("Wenig Fleisch","Ausgewogen"):"Nichts Bestimmtes";
  return arr.length?arr.join(", "):"Keine";
}
function prefSheet(id){
  const [t,k]=String(id).split(":"), q=coachQuiz(t).find(x=>x.k===k); if(!q) return "";
  const cur=((state.coach.answers||{})[t]||{})[k], on=o=>q.multi?[].concat(cur||[]).includes(o):cur===o;
  const title={stil:"Ernährung",meiden:"Was willst du meiden?",intol:"Unverträglichkeiten",stoert:"Haut-Probleme"}[k]||q.q;
  return `<h2>${esc(title)}</h2><p class="sub">${q.multi?"Mehrere möglich. ":""}Jede Bewertung richtet sich danach.</p><div class="gap"></div>
    ${q.opts.map(o=>`<button class="choice pref ${on(o)?"on":""}" data-act="pref" data-id="${t}:${k}" data-v="${esc(o)}"><span>${(q.emo||{})[o]||""}</span><div class="grow"><b>${esc(o)}</b>${(q.desc||{})[o]?`<div class="sub">${esc(q.desc[o])}</div>`:""}</div>${on(o)?"<i>✓</i>":""}</button>`).join("")}
    <div class="gap"></div><button class="pill primary" data-act="close">Fertig</button>`;
}
function prefSet(id,v){
  const [t,k]=String(id).split(":"), q=coachQuiz(t).find(x=>x.k===k); if(!q) return;
  const A=state.coach.answers[t]||(state.coach.answers[t]={});
  A[k]=q.multi?toggleMulti(A[k],v,q.none,q.pick):v; save();
}
