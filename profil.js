// FORMA – Profil
function renderProfil(){
  const p=state.profile, t=targets();
  return `<div class="scroll pad">
    <div class="topbar"><div><h1>Profil</h1><div class="sub">Gespeichert auf diesem Gerät</div></div></div>
    <div class="card">
      <div class="row" style="gap:12px"><div class="avatar">${(p.name||"F").slice(0,1).toUpperCase()}</div>
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
      <button class="g-row" data-act="open" data-type="goal"><span class="bubble">🎯</span><div class="grow"><b>Ziel</b><div class="sub">${goalName()}</div></div><span class="sub">›</span></button>
      <button class="g-row" data-act="open" data-type="body"><span class="bubble">📏</span><div class="grow"><b>Größe & Alter</b><div class="sub">${p.height} cm · ${p.age} Jahre</div></div><span class="sub">›</span></button>
      <button class="g-row" data-act="open" data-type="weigh"><span class="bubble">⚖️</span><div class="grow"><b>Gewicht</b><div class="sub">${de(lastWeight(),1)} kg · Ziel ${de(p.target,1)} kg</div></div><span class="sub">›</span></button>
      <div class="g-row"><span class="bubble">🍽️</span><div class="grow"><b>Richtwert</b><div class="sub">${de(t.kcal)} kcal · ${t.protein} g Protein</div></div></div>
    </div>
    <div class="section"><h2>App</h2></div>
    <div class="group">
      <button class="g-row" data-act="toggle" data-k="calories"><div class="grow"><b>Kalorien im Tagebuch</b></div>${tog(p.calories)}</button>
      <button class="g-row" data-act="toggle" data-k="reminders"><div class="grow"><b>Erinnerungen</b><div class="sub">Nur Markierung, kein Push</div></div>${tog(p.reminders)}</button>
      ${PARTNERS_ENABLED?`<button class="g-row" data-act="toggle" data-k="affiliates"><div class="grow"><b>Partnerlinks</b><div class="sub">Anzeige, Score bleibt unabhängig</div></div>${tog(p.affiliates)}</button>`:""}
    </div>
    <div class="section"><h2>Konto</h2></div>
    <div class="group">
      <button class="g-row" data-act="open" data-type="legal"><div class="grow"><b>Hinweise</b></div><span class="sub">›</span></button>
      <button class="g-row" data-act="backup"><span class="bubble">⬇️</span><div class="grow"><b>Daten exportieren</b><div class="sub">${state.workouts.length} Trainings · ${state.weights.length} Wiegepunkte · als Datei</div></div></button>
      <button class="g-row" data-act="import-pick"><span class="bubble">⬆️</span><div class="grow"><b>Daten importieren</b><div class="sub">Aus einer FORMA-Datei wiederherstellen</div></div></button>
      <button class="g-row" data-act="reset"><div class="grow"><b style="color:#d93636">Alles löschen</b><div class="sub">Mit Sicherheitsabfrage</div></div></button>
    </div>
  </div>`;
}
