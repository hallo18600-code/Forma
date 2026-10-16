// Health Maxxing – Training: Übungen, Pläne, Live-Training, Kalender, Statistik

function exName(id){
  if(EX[id]) return EX[id].name;
  const c = (state.customEx||[]).find(x=>x.id===id);
  return c ? c.name : "Übung";
}
function lastSet(id){
  const past = [...state.workouts].reverse();
  for(const w of past){
    const hit = (w.exercises||[]).find(e=>e.id===id);
    if(hit && hit.sets && hit.sets.length){
      const s = [...hit.sets].reverse().find(x=>x.done) || hit.sets[hit.sets.length-1];
      return s.kg+" kg × "+s.reps;
    }
  }
  return "–";
}
function clock(t0){
  const s=Math.max(0, Math.floor((Date.now()-t0)/1000));
  return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60].map(n=>String(n).padStart(2,"0")).join(":");
}
function prevSet(id, index){
  for(const w of [...state.workouts].reverse()){
    const hit=(w.exercises||[]).find(e=>e.id===id);
    if(!hit) continue;
    const done=(hit.sets||[]).filter(s=>s.done);
    const s=done[index]||done[done.length-1];
    if(s) return s.kg+"×"+s.reps;
  }
  return "–";
}
function renderSport(){
  const plans=state.routines||[];
  const list=[...state.workouts].reverse().slice(0,6);
  const marks={stats:"📈", exercises:"🏋️", measures:"📏", calendar:"📅"};
  const start=weekStart(todayIso());
  const days=Array.from({length:7},(_,i)=>addDays(start,i));
  const week=state.workouts.filter(w=>w.date>=start);
  const vol=week.reduce((n,w)=>n+(w.volume||0),0);
  const maxV=Math.max(1, ...days.map(s=>state.workouts.filter(w=>w.date===s).reduce((n,w)=>n+(w.volume||0),0)));
  return `<div class="scroll pad">
    <div class="topbar"><div><h1>Training</h1><div class="sub">Diese Woche</div></div>
      <button class="plus dark" data-act="new-plan" aria-label="Neue Routine">+</button></div>
    <div class="card">
      <div class="kpi">
        <div><span>Einheiten</span><b>${week.length}</b><span>7 Tage</span></div>
        <div><span>Volumen</span><b>${de(vol)}</b><span>kg</span></div>
        <div><span>Routinen</span><b>${plans.length}</b><span>angelegt</span></div>
      </div>
      <div class="wbars">${days.map(s=>{
        const v=state.workouts.filter(w=>w.date===s).reduce((n,w)=>n+(w.volume||0),0);
        return `<div class="wbar ${v?"has":""} ${s===todayIso()?"on":""}"><i style="height:${Math.max(6, Math.round(v/maxV*78))}px"></i><span>${weekday(s)}</span></div>`;
      }).join("")}</div>
    </div>
    <div class="section"><h2>Routinen</h2><button class="link" data-act="new-plan">Neu</button></div>
    ${plans.map(r=>`<div class="card meals mb-3">
      <div class="row space py-2"><div class="meal-name">${esc(r.name)}</div><button class="link" data-act="edit-plan" data-id="${r.id}">Bearbeiten</button></div>
      ${(r.days||[]).map(d=>`<div class="meal-row">
        <div class="bubble">🏋️</div>
        <div class="grow"><div class="meal-name">${esc(d.name)}</div><div class="sub">${(d.exercises||[]).map(e=>(EX[e.id]&&EX[e.id].base)||exName(e.id)).slice(0,3).join(", ")||"Leer"}</div></div>
        <button class="plus dark" data-act="start-wo" data-rid="${r.id}" data-did="${d.id}" aria-label="${esc(d.name)} starten">›</button>
      </div>`).join("")}
    </div>`).join("")}
    <button class="pill ghost w-full" data-act="start-empty">Leeres Training</button>
    <div class="section"><h2>Dashboard</h2></div>
    <div class="dash">
      ${[["stats","Statistiken"],["exercises","Übungen"],["measures","Messungen"],["calendar","Kalender"]].map(([id,label])=>`<button data-act="dash" data-id="${id}"><span class="bubble">${marks[id]}</span>${label}</button>`).join("")}
    </div>
    <div class="section"><h2>Workouts</h2></div>
    <div class="card meals">${list.length?list.map(w=>`<button class="meal-row" data-act="open" data-type="wo-detail" data-id="${w.id}">
      <div class="bubble">✅</div>
      <div class="grow"><div class="meal-name">${esc(w.name)}</div><div class="sub">${labelDate(w.date)} · ${w.min} min · ${w.sets} Sätze</div></div>
    </button>`).join(""):`<div class="sub li">Noch kein gespeichertes Training.</div>`}</div>
  </div>`;
}
function renderPlan(){
  const plan=ui.plan;
  plan.days=plan.days||[];
  return `<div class="screen plain">
    <div class="scroll full">
      <div class="wo-head">
        <button class="x" data-act="cancel-plan" aria-label="Abbrechen">✕</button><b>Routine</b>
        <button class="pill primary sm" data-act="save-plan">Sichern</button>
      </div>
      <div class="field"><label>Routine</label><input data-act="plan-name" value="${esc(plan.name)}" placeholder="Push Pull Legs"></div>
      ${plan.days.map((d,di)=>`<div class="card plan-day">
        <div class="row space"><input class="input-plain grow" data-act="day-name" data-d="${di}" value="${esc(d.name)}" aria-label="Name des Trainingstags"><button class="x" data-act="del-day" data-d="${di}" aria-label="Trainingstag löschen">✕</button></div>
        ${(d.exercises||[]).map((e,ei)=>`<div class="plan-ex">
          <div class="row space"><button class="ex-open" data-act="exi-open" data-id="${e.id}">${exThumb(e.id)}<b>${exName(e.id)}</b></button><button class="x" data-act="plan-del-ex" data-d="${di}" data-e="${ei}" aria-label="Übung entfernen">✕</button></div>
          <div class="sub">${e.sets.map(s=>s.kg+"×"+s.reps).join(" · ")}</div>
        </div>`).join("")}
        <button class="pill ghost w-full mt-2" data-act="open-day-ex" data-d="${di}">+ Übung</button>
      </div>`).join("")}
      <div class="gap"></div>
      <button class="pill ghost w-full" data-act="add-day">+ Trainingstag</button>
      ${plan.id?`<div class="gap"></div><button class="pill ghost w-full" data-act="del-plan">Routine löschen</button>`:""}
    </div>
  </div>`;
}
function renderLive(){
  const w=ui.workout;
  const sets=w.exercises.reduce((n,e)=>n+e.sets.length,0);
  const done=w.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.done).length,0);
  const vol=w.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.done).reduce((a,s)=>a+s.kg*s.reps,0),0);
  const min=Math.max(1, Math.floor((Date.now()-w.t0)/60000));
  return `<div class="screen plain">
    <div class="scroll full">
      <div class="wo-head">
        <button class="x" data-act="cancel-wo" aria-label="Training abbrechen">✕</button>
        <div class="t-c"><div class="clock">${clock(w.t0)}</div><div class="sub">${esc(w.name)}</div></div>
        <button class="pill primary sm" data-act="finish-wo">Fertig</button>
      </div>
      <div class="stats">
        <div><b>${vol} kg</b><span>Volumen</span></div>
        <div><b>${done}/${sets}</b><span>Sätze</span></div>
        <div><b class="t-rest">${ui.rest||0}s</b><span>Pause</span></div>
      </div>
      ${ui.rest>0?`<div class="rest"><span>Pause ${ui.rest}s</span><button data-act="rest-skip">Überspringen</button></div>`:""}
      ${w.exercises.map((e,ei)=>{
        let n=0;
        return `<div class="wo-ex">
          <div class="row space"><button class="ex-open" data-act="exi-open" data-id="${e.id}">${exThumb(e.id)}<span><span class="ex-name">${exName(e.id)}</span><span class="sub">Zuletzt ${lastSet(e.id)}</span></span></button><button class="x" data-act="del-ex" data-e="${ei}" aria-label="Übung entfernen">✕</button></div>
          <table class="sets"><tr><th>SATZ</th><th>ZUVOR</th><th>KG</th><th>WDH</th><th></th></tr>
            ${e.sets.map((s,si)=>`<tr class="${s.done?"done":""}">
              <td>${++n}</td>
              <td class="muted">${prevSet(e.id, si)}</td>
              <td><input inputmode="decimal" data-act="set-kg" data-e="${ei}" data-s="${si}" value="${s.kg}"></td>
              <td><input inputmode="numeric" data-act="set-reps" data-e="${ei}" data-s="${si}" value="${s.reps}"></td>
              <td><button class="chk ${s.done?"on":""}" data-act="toggle-set" data-e="${ei}" data-s="${si}">${s.done?"✓":""}</button></td>
            </tr>`).join("")}
          </table>
          <button class="pill ghost w-full mt-2" data-act="add-set" data-e="${ei}">+ Satz</button>
        </div>`;
      }).join("")}
      <button class="pill ghost w-full" data-act="open" data-type="ex">Übung hinzufügen</button>
    </div>
  </div>`;
}
function exPicker(mode){
  return `<h2>Übung hinzufügen</h2>
    ${exFilterBar(mode)}
    <div class="excustom"><input id="custom-ex" placeholder="Eigene Übung anlegen" aria-label="Eigene Übung"><button class="plus" data-act="add-custom-ex" data-mode="${mode}" aria-label="Eigene Übung anlegen">+</button></div>
    <div id="exl-list">${exLibList(mode)}</div>`;
}
function woDetail(id){
  const w=state.workouts.find(x=>x.id===id);
  if(!w) return "<p>Nicht gefunden.</p>";
  return `<h2>${esc(w.name)}</h2><p class="sub">${labelDate(w.date)} · ${w.min} min · ${de(w.volume)} kg</p>
    ${(w.exercises||[]).map(e=>`<div class="li"><b>${exName(e.id)}</b><div class="sub">${(e.sets||[]).filter(s=>s.done).map(s=>s.kg+"×"+s.reps).join(" · ")||"keine Sätze"}</div></div>`).join("")}
    <div class="gap"></div><button class="pill primary" data-act="close">OK</button>
    <div class="gap"></div><div class="row"><button class="pill ghost grow" data-act="wo-edit" data-id="${w.id}">Bearbeiten</button><button class="pill ghost grow t-bad" data-act="wo-del-ask" data-id="${w.id}">Löschen</button></div>`;
}
// Gespeichertes Training bearbeiten (Kopie liegt in ui.woEdit, erst "Speichern" ändert die Daten)
function woEditSheet(){
  const w=ui.woEdit; if(!w) return "";
  const inp='class="inp-s"';
  return `<h2>Training bearbeiten</h2>
    <div class="field"><label for="wo-name">Name</label><input id="wo-name" data-act="wo-f" data-k="name" value="${esc(w.name)}"></div>
    <div class="field"><label for="wo-date">Datum</label><input id="wo-date" type="date" data-act="wo-f" data-k="date" max="${todayIso()}" value="${w.date}"></div>
    <div class="field"><label for="wo-min">Dauer in Minuten</label><input id="wo-min" type="number" inputmode="numeric" min="1" data-act="wo-f" data-k="min" value="${w.min}"></div>
    ${w.exercises.map((e,ei)=>`<div class="plan-ex">
      <b>${exName(e.id)}</b>
      ${e.sets.map((st,si)=>`<div class="row mt-2"><span class="sub set-lbl">Satz ${si+1}</span>
        <input ${inp} type="number" inputmode="decimal" data-act="wo-set" data-f="kg" data-e="${ei}" data-s="${si}" value="${st.kg}" aria-label="kg"><span class="sub">kg ×</span>
        <input ${inp} type="number" inputmode="numeric" data-act="wo-set" data-f="reps" data-e="${ei}" data-s="${si}" value="${st.reps}" aria-label="Wiederholungen"><span class="sub">Wdh.</span>
        <button class="x" data-act="wo-del-set" data-e="${ei}" data-s="${si}" aria-label="Satz entfernen">✕</button></div>`).join("")}
    </div>`).join("")}
    <div class="gap"></div><button class="pill primary" data-act="wo-save">Speichern</button>
    <div class="gap"></div><button class="pill ghost w-full" data-act="close">Abbrechen</button>`;
}
function woDelSheet(id){
  const w=state.workouts.find(x=>x.id===id); if(!w) return "";
  return `<h2>Training löschen?</h2>
    <p class="sub"><b>${esc(w.name)}</b> vom ${w.date.split("-").reverse().join(".")} (${w.sets} ${w.sets===1?"Satz":"Sätze"}) wird gelöscht. Das lässt sich nicht rückgängig machen.</p>
    <div class="gap"></div><button class="pill danger" data-act="wo-del-go" data-id="${w.id}">Ja, löschen</button>
    <div class="gap"></div><button class="pill ghost w-full" data-act="open" data-type="wo-detail" data-id="${w.id}">Abbrechen</button>`;
}
// Haken "Sport" am Tag passend setzen, nachdem Trainings geändert wurden
function syncSport(date){ if(state.days[date]) state.days[date].checks.sport = state.workouts.some(w=>w.date===date)?1:0; }

function workoutOn(date){
  return state.workouts.filter(w=>w.date===date);
}
function weekStreak(){
  let n=0, cursor=weekStart(todayIso());
  while(state.workouts.some(w=>w.date>=cursor && w.date<addDays(cursor,7))){
    n++; cursor=addDays(cursor,-7); if(n>80) break;
  }
  return n;
}
function restDays(){
  const start=weekStart(todayIso());
  let n=0;
  for(let i=0;i<7;i++){
    const s=addDays(start,i);
    if(s>todayIso()) break;
    if(!workoutOn(s).length) n++;
  }
  return n;
}
function monthBlock(year, month){
  const first=new Date(year, month, 1);
  const label=first.toLocaleDateString("de-DE",{month:"long", year:"numeric"});
  const pad=(first.getDay()+6)%7;
  const count=new Date(year, month+1, 0).getDate();
  const heads=["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=>`<div class="sub">${d}</div>`).join("");
  let cells=Array.from({length:pad},()=>`<div></div>`).join("");
  for(let d=1;d<=count;d++){
    const s=iso(new Date(year, month, d));
    const hits=workoutOn(s);
    const name=hits[0]?hits[0].name.split("·").pop().trim():"";
    cells+=`<button class="calcell" data-act="cal-day" data-v="${s}"><div class="cdot ${hits.length?"on":""} ${s===todayIso()?"today":""}">${d}</div><div class="cname">${esc(name)}</div></button>`;
  }
  return `<h2 class="month-h">${label}</h2><div class="calgrid">${heads}${cells}</div>`;
}
function renderCalendar(){
  const now=new Date();
  const modes=[["month","Monat"],["year","Jahr"],["multi","Verlauf"]];
  let body="";
  if(ui.cal==="month"){
    body=monthBlock(now.getFullYear(), now.getMonth())+monthBlock(now.getFullYear(), now.getMonth()-1);
  } else if(ui.cal==="year"){
    const y=now.getFullYear();
    body=`<h2>${y}</h2><div class="yeargrid">${Array.from({length:12},(_,m)=>{
      const first=new Date(y,m,1), pad=(first.getDay()+6)%7, count=new Date(y,m+1,0).getDate();
      let cells=Array.from({length:pad},()=>`<i class="sq empty"></i>`).join("");
      for(let d=1;d<=count;d++){
        const s=iso(new Date(y,m,d));
        cells+=`<i class="sq ${workoutOn(s).length?"on":""}"></i>`;
      }
      return `<div><div class="sub mb-1">${first.toLocaleDateString("de-DE",{month:"short"})}</div><div class="mini">${cells}</div></div>`;
    }).join("")}</div>`;
  } else {
    const years=[now.getFullYear(), now.getFullYear()-1];
    body=years.map(y=>{
      const start=new Date(y,0,1);
      const off=(start.getDay()+6)%7;
      const days=[];
      for(let i=0;i<off;i++) days.push("");
      for(let d=new Date(y,0,1); d.getFullYear()===y; d.setDate(d.getDate()+1)) days.push(iso(new Date(d)));
      return `<h2>${y}</h2><div class="sub months">Jan Feb Mär Apr Mai Jun Jul Aug Sep Okt Nov Dez</div>
        <div class="heat">${days.map(s=>`<i class="${s&&workoutOn(s).length?"on":""}"></i>`).join("")}</div>`;
    }).join("");
  }
  return `<div class="calhead">
      <button class="navd" data-act="dash-close" aria-label="Zurück">‹</button>
      <div class="seg grow">${modes.map(([id,l])=>`<button class="${ui.cal===id?"on":""}" data-act="cal-mode" data-v="${id}">${l}</button>`).join("")}</div>
    </div>
    <div class="card split">
      <div><b>${weekStreak()}-Wochen-Serie</b><div class="sub">Mindestens ein Training</div></div>
      <div><b>${restDays()} Ruhetage</b><div class="sub">Diese Woche bisher</div></div>
    </div>
    ${body}`;
}
function renderStats(){
  const week=state.workouts.filter(w=>w.date>=addDays(todayIso(),-6));
  const prev=state.workouts.filter(w=>w.date>=addDays(todayIso(),-13)&&w.date<addDays(todayIso(),-6));
  const vol=ws=>ws.reduce((n,w)=>n+(w.volume||0),0);
  const sets=state.workouts.reduce((n,w)=>n+(w.sets||0),0);
  const bars=Array.from({length:8},(_,i)=>{
    const from=addDays(weekStart(todayIso()), -(7-i)*7);
    return vol(state.workouts.filter(w=>w.date>=from && w.date<addDays(from,7)));
  });
  const max=Math.max(1,...bars);
  return `<div class="calhead"><button class="navd" data-act="dash-close" aria-label="Zurück">‹</button><h2>Statistiken</h2><span class="tap-sp"></span></div>
    <div class="kpi">
      <div><span>Serie</span><b>${weekStreak()}</b><span>Wochen</span></div>
      <div><span>Trainings</span><b>${state.workouts.length}</b><span>gesamt</span></div>
      <div><span>Sätze</span><b>${sets}</b><span>abgehakt</span></div>
    </div>
    <div class="gap"></div>
    <div class="card">
      <div class="row space"><b>Volumen</b><span class="sub">7 Tage ${vol(week)} kg</span></div>
      <div class="sub">Vorwoche ${vol(prev)} kg</div>
      <div class="vbars">${bars.map(v=>`<i style="height:${Math.max(4,v/max*72)}px"></i>`).join("")}</div>
      <div class="sub">8 Wochen, kg × Wiederholungen</div>
    </div>`;
}
function renderExercises(){
  return `<div class="calhead"><button class="navd" data-act="dash-close" aria-label="Zurück">‹</button><h2>Übungen</h2><span class="sub">${exAllIds().length}</span></div>
    ${exFilterBar("dash")}
    <div class="card exlist" id="exl-list">${exLibList("dash")}</div>`;
}
function exHist(id){
  const rows=[];
  state.workouts.forEach(w=>(w.exercises||[]).filter(e=>e.id===id).forEach(e=>{
    rows.push({date:w.date, name:w.name, sets:(e.sets||[]).filter(s=>s.done)});
  }));
  return `<h2>${exName(id)}</h2>${rows.reverse().map(r=>`<div class="li"><b>${labelDate(r.date)}</b><div class="sub">${r.sets.map(s=>s.kg+"×"+s.reps).join(" · ")||"keine Sätze"}</div></div>`).join("")||"<p class=sub>Kein Verlauf.</p>"}<div class="gap"></div><button class="pill primary" data-act="close">OK</button>`;
}
function startTick(){
  stopTick();
  ui.tick=setInterval(()=>{
    const was=ui.rest>0; if(ui.rest>0) ui.rest--;
    if(!ui.workout) return;
    const c=document.querySelector(".clock"); if(c&&ui.workout) c.textContent=clock(ui.workout.t0);
    if(was&&ui.rest===0){ render(); return; }
    const pb=document.querySelector(".t-rest"); if(pb) pb.textContent=(ui.rest||0)+"s";
    const rb=document.querySelector(".rest span"); if(rb) rb.textContent="Pause "+ui.rest+"s";
  }, 1000);
}
function stopTick(){ if(ui.tick){ clearInterval(ui.tick); ui.tick=null; } }
