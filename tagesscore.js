// Health Maxxing – Tages-Score: wie gut (naturbelassen, passend zum Ziel) war das Essen an diesem Tag?
// Rechnung: Durchschnitt der Lebensmittel-Scores, gewichtet nach Kalorien – ein voller Teller zählt mehr als ein Teelöffel.
// Damit Getränke ohne Kalorien (Wasser, Zero) nicht ganz wegfallen, zählt jeder Eintrag mindestens wie 20 kcal.
// Gleiche Lebensmittel werden zusammengefasst. „Schnell hinzufügen“-Einträge (nur Kalorien, kein echtes Lebensmittel) zählen nicht.
// Angezeigt wird der Score erst, wenn mindestens ein Lebensmittel eingetragen ist.

const DS_MIN_W=20;

function dayScore(s){
  const d=state.days[s||state.date]; if(!d||!Array.isArray(d.meals)) return null;
  const by=new Map();
  d.meals.forEach(m=>{
    if(!m||!(m.portion>0)) return;
    const p=foods().find(x=>x.id===m.id); if(!p||p.hidden) return;
    const sc=+scored(p).score; if(!Number.isFinite(sc)) return;
    const k=Math.max(0,line(p,m.portion).kcal||0), e=by.get(p.id)||{p,score:Math.max(0,Math.min(100,sc)),kcal:0,w:0};
    e.kcal+=k; e.w+=Math.max(DS_MIN_W,k); by.set(p.id,e);
  });
  const items=[...by.values()]; if(!items.length) return null;
  const wsum=items.reduce((a,x)=>a+x.w,0), avg=items.reduce((a,x)=>a+x.score*x.w,0)/wsum;
  const score=Math.max(0,Math.min(100,Math.round(avg)));
  const sorted=items.slice().sort((a,b)=>b.score-a.score||b.kcal-a.kcal);
  return { score, items:sorted, best:sorted[0], worst:sorted.length>1&&sorted[sorted.length-1].score<sorted[0].score?sorted[sorted.length-1]:null };
}
function dsLabel(n){ return n>=85?"Sehr gut":n>=70?"Gut":n>=50?"Okay":n>=30?"Mäßig":"Schlecht"; }

// Schmale Zeile unter der Kalorien-Karte
function dayScoreRow(){
  const ds=dayScore(state.date); if(!ds) return "";
  return `<button class="dsrow" data-act="open" data-type="dayscore"><div class="score ${scoreClass(ds.score)}">${ds.score}</div><div class="grow"><b>Tages-Score · ${dsLabel(ds.score)}</b><div class="sub">Top: <span>${esc(ds.best.p.name)}</span>${ds.worst?` · Schwächste: <span>${esc(ds.worst.p.name)}</span>`:""}</div></div><span class="chev">›</span></button>`;
}
// Blatt: Ring + alle Lebensmittel des Tages mit ihrem Score
function dayScoreSheet(){
  const ds=dayScore(state.date);
  if(!ds) return `<h2>Tages-Score</h2><p class="sub">Noch nichts eingetragen.</p><div class="gap"></div><button class="pill primary" data-act="close">OK</button>`;
  return `<h2>Tages-Score</h2><p class="sub">${labelDate(state.date)} · ${goalName()}</p>
    <div class="dsring">${rateRing(ds.score)}</div>
    <p class="sub">Durchschnitt deiner Lebensmittel, gewichtet nach Kalorien. Die Bewertung passt sich deinem Ziel an.</p>
    <div class="gap"></div>
    ${ds.items.map(x=>`<button class="yrow w-full" data-act="open" data-type="product" data-id="${x.p.id}"><span class="grow ynm"><b>${esc(x.p.name)}</b><span class="sub">${showKcal()?x.kcal+" kcal":""}</span></span><div class="score ${scoreClass(x.score)}">${x.score}</div></button>`).join("")}
    <div class="gap"></div><button class="pill primary" data-act="close">OK</button>`;
}
