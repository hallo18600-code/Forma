// Health Maxxing – Verlauf: Gewicht, Schritte, Schlaf, Maße
function weightView(){
  const all = state.weights.slice().sort((a,b)=>a.date<b.date?-1:1);
  const days = ui.wrange==="7"?7:ui.wrange==="30"?30:ui.wrange==="90"?90:ui.wrange==="365"?365:9999;
  const from = addDays(todayIso(), -days+1);
  const ws = days>3000 ? all : all.filter(w=>w.date>=from);
  const last = lastWeight();
  const start = all[0] ? all[0].kg : last;
  const startDate = all[0] ? all[0].date : todayIso();
  const goal = +state.profile.target;
  const span = Math.abs(goal-start) || 1;
  const moved = start<=goal ? Math.max(0, last-start) : Math.max(0, start-last);
  const pct = Math.max(0, Math.min(1, moved/span));
  const dir = goal>=start ? 1 : -1;
  const next = +(last + dir*0.5).toFixed(1);
  const avg = ws.length ? ws.reduce((n,w)=>n+w.kg,0)/ws.length : last;
  const C = 2*Math.PI*70;
  const off = C*(1-pct);
  const vals = (ws.length?ws:[{kg:last}]).map(w=>w.kg);
  const min = Math.min(...vals, goal)-0.8, max = Math.max(...vals, goal)+0.8;
  const W=320,H=120,pad=8;
  const pts = vals.map((v,i)=>{
    const x = pad + (vals.length===1? W/2 : i*((W-2*pad)/(vals.length-1)));
    const y = H-pad - ((v-min)/(max-min))*(H-2*pad);
    return [x,y];
  });
  const line = pts.map(p=>p.join(",")).join(" ");
  const sel = ui.wpick ? ws.findIndex(w=>w.date===ui.wpick) : -1;
  const selW = sel>=0 ? ws[sel] : null;
  const hits = ws.length ? pts.map((p,i)=>{ const x0 = i===0 ? 0 : (pts[i-1][0]+p[0])/2; const x1 = i===pts.length-1 ? W : (p[0]+pts[i+1][0])/2; return `<rect x="${x0}" y="0" width="${Math.max(1,x1-x0)}" height="${H}" fill="transparent" data-act="w-pick" data-v="${ws[i].date}"/>`; }).join("") : "";
  const dots = pts.map((p,i)=>i===sel ? "" : `<circle cx="${p[0]}" cy="${p[1]}" r="2.2" fill="${tc("accent")}"/>`).join("");
  // Ausgewählter Eintrag: senkrechte Linie + hohler Punkt (wie ein "Fadenkreuz")
  const selMark = (selW && pts[sel]) ? `<line x1="${pts[sel][0]}" y1="0" x2="${pts[sel][0]}" y2="${H}" stroke="${tc("accent")}" stroke-width="1.5"/><circle cx="${pts[sel][0]}" cy="${pts[sel][1]}" r="6" fill="${tc("surface")}" stroke="${tc("accent")}" stroke-width="3"/>` : "";
  const dirTxt = (d,label)=>{ if(d===null) return `<div class="wdelta"><b>–</b><span class="sub">${label}</span></div>`; const s=d>0?"+":""; const w=d>0.05?"zugenommen":d<-0.05?"abgenommen":"unverändert"; return `<div class="wdelta"><b>${s}${de(d,1)} kg</b><span class="sub">${label.replace("X",w)}</span></div>`; };
  const weightAt = dd => { const c=all.filter(w=>w.date<=dd); return c.length? c[c.length-1].kg : null; };
  const b30 = weightAt(addDays(todayIso(),-30)), b90 = weightAt(addDays(todayIso(),-90));
  const d30 = (all.length && b30!==null) ? +(last-b30).toFixed(1) : null;
  const d90 = (all.length && b90!==null) ? +(last-b90).toFixed(1) : null;
  const picked = ws.length ? "" : `<div class="sub">Noch keine Einträge</div>`;
  const hm = state.profile.height/100;
  const head = selW
    ? `<div class="row baseline"><b class="t-l">${de(selW.kg,1)} kg</b><span class="sub">BMI ${de(selW.kg/(hm*hm),1)} · <b style="color:var(--accent)">${selW.date.split("-").reverse().join(".")}</b></span></div>`
    : `<div class="row baseline"><b class="t-l">${de(avg,1)} kg</b><span class="sub">BMI ${de(bmi(),1)} · Schnitt</span></div>`;
  const area = pts.length ? `M${pts[0][0]},${H-pad} L${line.replace(/ /g," L")} L${pts[pts.length-1][0]},${H-pad} Z` : "";
  const gy = H-pad - ((goal-min)/(max-min))*(H-2*pad);
  return `<div class="card">
    <div class="row space"><div class="bubble">⚖️</div><b>Gewicht</b><button class="link" data-act="open" data-type="entries">Einträge</button></div>
    <div class="wgrid">
      <div class="wside"><span class="sub">BMI</span><b>${de(bmi(),1)}</b><span class="sub">${bmiLabel(bmi())}</span></div>
      <div class="wring">
        <svg viewBox="0 0 168 168">
          <circle cx="84" cy="84" r="70" fill="none" stroke="${tc("track")}" stroke-width="12"/>
          <circle cx="84" cy="84" r="70" fill="none" stroke="${tc("accent")}" stroke-width="12" stroke-linecap="round" transform="rotate(-90 84 84)" stroke-dasharray="${C}" stroke-dashoffset="${off}"/>
        </svg>
        <div class="mid"><span class="sub">Fortschritt ${Math.round(pct*100)} %</span><b>${de(last,1)}</b><span class="sub">kg · ${labelDate(all.length?all[all.length-1].date:todayIso())}</span></div>
      </div>
      <div class="wside"><span class="sub">Weiter</span><b>${de(next,1)}</b><span class="sub">kg</span></div>
    </div>
    <div class="row space mt-2">
      <div><span class="sub">Start</span><b class="d-block">${de(start,1)} kg</b><span class="sub">${startDate.split("-").reverse().join(".")}</span></div>
      <div class="t-r"><span class="sub">Ziel</span><b class="d-block">${de(goal,1)} kg</b><button class="link" data-act="open" data-type="goaldate">${state.profile.goalDate?state.profile.goalDate.split("-").reverse().join("."):"Datum festlegen"}</button></div>
    </div>
    <div class="gap"></div>
    <button class="pill primary" data-act="open" data-type="weigh">Gewicht erfassen</button>
  </div>
  <div class="gap"></div>
  <div class="card">
    <div class="row space"><h2>Gewichtsfortschritt</h2><span class="sub">${(last-start>=0?"+":"")+de(last-start,1)} kg</span></div>
    <div class="seg my-3">
      ${[["7","Tage"],["30","Wochen"],["90","Monate"],["365","Jahre"]].map(([id,l])=>`<button class="${ui.wrange===id?"on":""}" data-act="wrange" data-v="${id}">${l}</button>`).join("")}
    </div>
    ${head}
    <svg class="spark tall" viewBox="0 0 ${W} ${H}">
      <path d="${area}" fill="${tc("accent")}" opacity=".12"/>
      <line x1="8" y1="${gy}" x2="312" y2="${gy}" stroke="${tc("accent")}" stroke-dasharray="4 4" stroke-width="1"/>
      <polyline fill="none" stroke="${tc("accent")}" stroke-width="3" points="${line}"/>
      ${dots}${selMark}${hits}
    </svg>
    ${picked}
    <div class="wdeltas">${dirTxt(d30,"In 30 Tagen X")}${dirTxt(d90,"In 90 Tagen X")}</div>
    <p class="sub">Richtwert ${weightSpan().low}–${weightSpan().high} kg. Die Linie ist der Verlauf, kein Versprechen.</p>
  </div>`;
}
function dayKcal(s){
  const meals=((state.days[s]||{}).meals)||[];
  return meals.reduce((n,m)=>{ const food=foods().find(x=>x.id===m.id); return n+(food?line(food,m.portion).kcal:0); },0);
}
function stepsSheet(){
  const goal=state.profile.stepGoal||10000, n=day().steps||0;
  return `<h2>Schritte</h2><p class="sub">${labelDate(state.date)} · Ziel ${goal.toLocaleString(LOC)}</p>
    <div class="field"><label>Schritte</label><input id="st-input" type="number" inputmode="numeric" value="${n||""}" placeholder="z. B. 8500"></div>
    <div class="opts">${[500,1000,2500].map(v=>`<button class="chip" data-act="steps-add" data-v="${v}">+${v}</button>`).join("")}</div>
    <button class="pill primary w-full" data-act="steps-save">Speichern</button>
    <div class="field"><label>Tagesziel</label></div>
    <div class="opts">${[6000,8000,10000,12000].map(v=>`<button class="chip ${goal===v?"on":""}" data-act="step-goal" data-v="${v}">${v/1000}k</button>`).join("")}</div>`;
}
function stepsCard(){
  const goal=state.profile.stepGoal||10000, fmt=v=>Math.round(v).toLocaleString(LOC);
  const sel=(state.days[state.date]||{}).steps||0, pct=Math.min(1,sel/goal);
  const pts=Array.from({length:14},(_,i)=>addDays(state.date,i-13)).map((s,i)=>({s,i,v:(state.days[s]||{}).steps||0}));
  const last7=pts.slice(7).filter(q=>q.v>0), avg=last7.length?last7.reduce((a,q)=>a+q.v,0)/last7.length:0;
  const best=Math.max(0,...pts.map(q=>q.v));
  let streak=0, d=todayIso(); const got=x=>((state.days[x]||{}).steps||0)>=goal;
  if(!got(d)) d=addDays(d,-1); while(got(d)&&streak<400){ streak++; d=addDays(d,-1); }
  const R=34, C=2*Math.PI*R;
  const ring=`<svg viewBox="0 0 84 84" width="84" height="84"><circle cx="42" cy="42" r="${R}" fill="none" stroke="${tc("track")}" stroke-width="9"/><circle cx="42" cy="42" r="${R}" fill="none" stroke="${tc("accent")}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(C*pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 42 42)"/><text x="42" y="47" text-anchor="middle" font-size="16" font-weight="700" fill="${tc("ink")}">${Math.round(pct*100)}%</text></svg>`;
  const W=300,H=120,P=16,L=18, mx=Math.max(goal*1.15,...pts.map(q=>q.v)), step=(W-2*P)/14, bw=step-5, Y=v=>H-L-(v/mx)*(H-L-8);
  const bars=pts.map(q=>{ const h=Math.max(0,H-L-Y(q.v)), on=q.v>=goal&&q.v>0, cur=q.s===state.date, x=P+q.i*step;
    return `<rect x="${x.toFixed(1)}" y="${Y(q.v).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${on?tc("accent"):(q.v?tc("accent-mid"):tc("track"))}" ${cur?`stroke="${tc("on-accent-soft")}" stroke-width="1.5"`:""}/><text x="${(x+bw/2).toFixed(1)}" y="${H-5}" text-anchor="middle" font-size="12" fill="${cur?tc("ink"):tc("ink-2")}" font-weight="${cur?700:400}">${weekday(q.s)[0]}</text>`; }).join("");
  const svg=`<svg class="chart" viewBox="0 0 ${W} ${H}"><line x1="${P-4}" x2="${W-P+4}" y1="${Y(goal).toFixed(1)}" y2="${Y(goal).toFixed(1)}" stroke="${tc("line-strong")}" stroke-dasharray="4 4"/><text x="${W-P+4}" y="${(Y(goal)-4).toFixed(1)}" text-anchor="end" font-size="12" fill="${tc("ink-2")}">Ziel ${fmt(goal)}</text>${bars}</svg>`;
  const left=goal-sel;
  return `<div class="section"><h2>Schritte</h2><span class="sub">${labelDate(state.date)}</span></div>
  <div class="card">
    <div class="row gap-4">${ring}<div class="grow"><b class="t-xl">${fmt(sel)}</b><div class="sub">${sel>=goal?"Ziel erreicht ✓":"noch "+fmt(left)+" bis "+fmt(goal)}</div></div></div>
    <div class="mt-4">${svg}</div>
    <div class="kpi"><div><span>Ø 7 Tage</span><b>${avg?fmt(avg):"–"}</b></div><div><span>Bester Tag</span><b>${best?fmt(best):"–"}</b></div><div><span>Serie</span><b>${streak} ${streak===1?"Tag":"Tage"}</b></div></div>
    <button class="pill primary mt-3" data-act="open" data-type="steps">Schritte eintragen</button>
  </div>`;
}
function sleepCard(){
  const h=day().sleep, fmt=v=>String(v).replace(".",",")+" h";
  const pts=Array.from({length:14},(_,i)=>addDays(state.date,i-13)).map((s,i)=>({s,i,v:(state.days[s]||{}).sleep||0}));
  const W=300,H=120,P=16,mn=4,mx=10, X=i=>P+i*(W-2*P)/13, Y=v=>H-P-(Math.max(mn,Math.min(mx,v))-mn)/(mx-mn)*(H-2*P);
  const tp=pts.filter(q=>q.v>0), path=tp.map((q,j)=>(j?"L":"M")+X(q.i).toFixed(1)+" "+Y(q.v).toFixed(1)).join(" ");
  const avg=tp.length?(tp.reduce((a,q)=>a+q.v,0)/tp.length).toFixed(1).replace(".",","):"–";
  const svg=`<svg class="chart" viewBox="0 0 ${W} ${H}">
    <line x1="${P}" x2="${W-P}" y1="${Y(7)}" y2="${Y(7)}" stroke="${tc("line-strong")}" stroke-dasharray="4 4"/>
    <text x="${W-P}" y="${Y(7)-4}" text-anchor="end" font-size="12" fill="${tc("ink-2")}">7 h</text>
    ${tp.length>1?`<path d="${path}" fill="none" stroke="${tc("accent")}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`:""}
    ${tp.map(q=>`<circle cx="${X(q.i).toFixed(1)}" cy="${Y(q.v).toFixed(1)}" r="${q.s===state.date?4.5:3}" fill="${q.s===state.date?tc("accent"):tc("surface")}" stroke="${tc("accent")}" stroke-width="2"/>`).join("")}
    <text x="${P}" y="${H-2}" font-size="12" fill="${tc("ink-2")}">${weekday(pts[0].s)} ${parseIso(pts[0].s).getDate()}.</text>
    <text x="${W-P}" y="${H-2}" text-anchor="end" font-size="12" fill="${tc("ink-2")}">${weekday(state.date)} ${parseIso(state.date).getDate()}.</text>
  </svg>`;
  return `<div class="section"><h2>Schlaf</h2><span class="sub">Ø ${avg} h · 14 Tage</span></div>
  <div class="card">
    <div class="row space">
      <div><b>${labelDate(state.date)}</b><div class="sub">Wie lange hast du geschlafen?</div></div>
      <div class="row">
        <button class="pill ghost icon" data-act="sleep-adj" data-v="-0.5" aria-label="Eine halbe Stunde weniger">−</button>
        <b class="num-w">${h==null?"–":fmt(h)}</b>
        <button class="pill ghost icon" data-act="sleep-adj" data-v="0.5" aria-label="Eine halbe Stunde mehr">+</button>
      </div>
    </div>
    <div class="mt-3">${tp.length?svg:`<div class="sub li">Trag deine Stunden ein, dann erscheint hier der Verlauf.</div>`}</div>
  </div>
`;
}
function renderVerlauf(){
  const start=weekStart(state.date);
  const days=Array.from({length:7},(_,i)=>addDays(start,i));
  const d=day();
  const t=targets();
  const kcal=dayKcal(state.date);
  const wo=state.workouts.filter(w=>w.date===state.date);
  const routine=state.coach.routine||[];
  const weekDone=days.reduce((n,s)=>n+routine.filter(r=>routineOn(r.id,s)).length,0);
  return `<div class="scroll pad">
    <div class="topbar"><div><h1>Verlauf</h1><div class="sub">Diese Woche</div></div></div>
    <div class="weekdays">${days.map(s=>`<button class="daydot ${s===state.date?"on":""}" data-act="pick-day" data-v="${s}"><span>${weekday(s)}</span><b>${parseIso(s).getDate()}</b></button>`).join("")}</div>
    <div class="gap"></div>
    ${routineBlock()}
    <div class="section"><h2>Gewicht</h2></div>
    ${weightView()}
    ${sleepCard()}
    ${stepsCard()}
  </div>`;
}
function renderMeasures(){
  const last=state.measures[state.measures.length-1]||{};
  const fields=[["chest","Brust"],["waist","Taille"],["arm","Arm"],["hip","Hüfte"],["thigh","Bein"]];
  return `<div class="calhead"><button class="navd" data-act="dash-close" aria-label="Zurück">‹</button><h2>Messungen</h2><span class="tap-sp"></span></div>
    <div class="card">${fields.map(([k,l])=>`<div class="field"><label>${l} cm</label><input id="m-${k}" value="${last[k]||""}"></div>`).join("")}
      <div class="gap"></div><button class="pill primary" data-act="save-measure">Speichern</button>
    </div>
    <div class="section"><h2>Verlauf</h2></div>
    ${(state.measures||[]).slice().reverse().map(m=>`<div class="card mb-2"><b>${labelDate(m.date)}</b><div class="sub">${fields.map(([k,l])=>m[k]?l+" "+m[k]:"").filter(Boolean).join(" · ")}</div></div>`).join("")||`<div class="card sub">Noch keine Messung.</div>`}`;
}
function weighSheet(){
  const span=weightSpan();
  return `<h2>Waage</h2>
    <div class="sub">${labelDate(state.date)}</div>
    <div class="t-c py-2"><div class="bigw">${de(ui.draftKg,1)}</div><div class="sub">kg</div></div>
    <div class="stepper"><button class="plus" data-act="draft" data-d="-0.1">−</button><span class="sub">0,1 kg</span><button class="plus" data-act="draft" data-d="0.1">+</button></div>
    <div class="kpi"><div><span>BMI</span><b>${de(bmi(),1)}</b></div><div><span>Richtwert</span><b>${span.low}–${span.high}</b></div><div><span>Ziel</span><b>${state.profile.target}</b></div></div>
    <div class="gap"></div><button class="pill primary" data-act="save-weight">Speichern</button>`;
}
// Einen Wiegepunkt bearbeiten oder löschen
function weightEditSheet(date){
  const w=state.weights.find(x=>x.date===date);
  if(!w) return `<h2>Eintrag</h2><p class="sub">Nicht gefunden.</p><div class="gap"></div><button class="pill primary" data-act="close">OK</button>`;
  const when=date.split("-").reverse().join(".");
  if(ui.confirmDel) return `<h2>Eintrag löschen?</h2>
    <p class="sub">${when}: <b>${de(w.kg,1)} kg</b> wird gelöscht. Das lässt sich nicht rückgängig machen.</p>
    <div class="gap"></div><button class="pill danger" data-act="w-del-go">Ja, löschen</button>
    <div class="gap"></div><button class="pill ghost w-full" data-act="del-cancel">Abbrechen</button>`;
  return `<h2>Gewicht bearbeiten</h2>
    <div class="sub">${when}</div>
    <div class="field"><label for="w-edit-kg">Gewicht in kg</label><input id="w-edit-kg" data-act="w-kg" type="number" inputmode="decimal" step="0.1" min="35" max="220" value="${Number(ui.draftKg).toFixed(1)}"></div>
    <div class="stepper"><button class="plus" data-act="w-edit-step" data-d="-0.1">−</button><span class="sub">0,1 kg</span><button class="plus" data-act="w-edit-step" data-d="0.1">+</button></div>
    <div class="gap"></div><button class="pill primary" data-act="w-save" data-v="${date}">Speichern</button>
    <div class="gap"></div><button class="pill ghost w-full t-bad" data-act="w-del-ask">Eintrag löschen</button>`;
}
