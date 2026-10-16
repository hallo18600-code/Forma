// Health Maxxing – Tagebuch: Heute-Ansicht, Mahlzeiten, Lebensmittel-Details
function renderHeute(){
  const t=targets(), tot=totals(), goalK=t.kcal, remain=Math.max(0, goalK-tot.kcal);
  const d=day();
  return `<div class="scroll pad">
    <div class="topbar center">
      <button class="navd" data-act="shift" data-d="-1" aria-label="Tag zurück">‹</button>
      <div class="t-c"><h1 class="t-l">${labelDate(state.date)}</h1><div class="sub">${state.date===todayIso()?parseIso(state.date).toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"short"})+" · ":""}${goalName()}${state.date!==todayIso()?` · <button class="link" data-act="today">zurück</button>`:""}</div></div>
      <button class="navd" data-act="shift" data-d="1" aria-label="Tag vor" ${state.date>=todayIso()?"disabled":""}>›</button>
    </div>
    <div class="card">
      <div class="sum">
        <div class="side"><div class="num">${showKcal()?tot.kcal.toLocaleString("de-DE"):"–"}</div><div class="lbl">Gegessen</div></div>
        <div class="ring">${ringSvg(goalK?tot.kcal/goalK:0)}<div class="mid"><b>${showKcal()?remain.toLocaleString("de-DE"):"–"}</b><span>${showKcal()?"Übrig":"Kalorien aus"}</span></div></div>
        <div class="side"><div class="num">${showKcal()?goalK.toLocaleString("de-DE"):"–"}</div><div class="lbl">Ziel</div></div>
      </div>
      <div class="macros">
        ${[["Kohlenhydrate", tot.carbs, t.carbs, "carbs"],["Eiweiß", tot.protein, t.protein, "protein"],["Fett", tot.fat, t.fat, "fat"]].map(([name,val,goal,col])=>`<div class="mac" style="--mc:var(--c-${col})"><span>${name}</span><div class="dotbar"><i style="width:${Math.min(100,goal?val/goal*100:0)}%"></i><b style="left:${Math.min(96,goal?val/goal*100:0)}%"></b></div><b>${Math.round(val)} / ${goal} g</b></div>`).join("")}
      </div>
    </div>
    <div class="section"><h2>Ernährung</h2><button class="link" data-act="open" data-type="custom">Mehr</button></div>
    <div class="card meals">
      ${SLOTS.map(slot=>{
        const items=d.meals.filter(m=>m.slot===slot.id);
        const k=items.reduce((n,m)=>{ const p=foods().find(x=>x.id===m.id); return n+(p?line(p,m.portion).kcal:0); },0);
        const goal=Math.round(goalK*slot.share);
        const marks={breakfast:"☕", lunch:"🍝", dinner:"🥗", snack:"🍎"};
        return `<div class="meal-row">
          <div class="bubble">${marks[slot.id]}</div>
          <button class="grow" data-act="meal-open" data-slot="${slot.id}">
            <div class="meal-name">${slot.name} <span class="chev">›</span></div>
            <div class="sub">${showKcal()?k.toLocaleString("de-DE")+" / "+goal.toLocaleString("de-DE")+" kcal":items.length+" Einträge"}</div>
            ${showKcal()?`<div class="mbar"><i style="width:${Math.min(100,goal?k/goal*100:0)}%"></i></div>`:""}
          </button>
          <button class="plus dark" data-act="open" data-type="scan" data-slot="${slot.id}" aria-label="${slot.name}: Essen hinzufügen">+</button>
        </div>`;
      }).join("")}
    </div>
    ${dayBlock()}
  </div>`;
}
// "Dein Tag": Wasser, Schritte, Schlaf, Training, Routine, Supplements an einem Ort
function dayBlock(){
  const d=day(), p=state.profile, stepGoal=p.stepGoal||10000;
  const wo=state.workouts.filter(w=>w.date===state.date);
  const rt=rDone(state.date), sups=state.stack.filter(x=>d.taken[x]).length;
  const sl=d.sleep, slTxt=sl==null?"Noch nicht eingetragen":de(sl,1)+" h"+(sl>=7?" ✓":"");
  const checks=[d.meals.length>0, d.water>=p.waterTarget, (d.steps||0)>=stepGoal, sl!=null&&sl>=7, rt.n>0&&rt.c===rt.n, state.stack.length>0&&sups===state.stack.length];
  const done=checks.filter(Boolean).length;
  const bar=pct=>`<div class="mbar"><i style="width:${Math.min(100,Math.max(0,pct*100))}%"></i></div>`;
  return `<div class="section"><h2>Dein Tag</h2><span class="sub">${done}/${checks.length} erledigt</span></div>
    <div class="card meals">
      <div class="meal-row">
        <div class="bubble">💧</div>
        <div class="grow"><div class="meal-name">Wasser</div><div class="sub">${d.water} / ${p.waterTarget} Gläser</div><div class="glasses">${Array.from({length:p.waterTarget},(_,i)=>`<i class="${i<d.water?"on":""}"></i>`).join("")}</div></div>
        <div class="row"><button class="plus" data-act="water-sub" aria-label="Ein Glas weniger" ${d.water>0?"":"disabled"}>−</button>
        <button class="plus dark" data-act="water-add" aria-label="Ein Glas mehr">+</button></div>
      </div>
      <div class="meal-row">
        <div class="bubble">👟</div>
        <div class="grow"><div class="meal-name">Schritte</div><div class="sub">${(d.steps||0).toLocaleString("de-DE")} / ${stepGoal.toLocaleString("de-DE")}</div>${bar((d.steps||0)/stepGoal)}</div>
        <button class="plus dark" data-act="open" data-type="steps" aria-label="Schritte eintragen">+</button>
      </div>
      <div class="meal-row">
        <div class="bubble">🌙</div>
        <div class="grow"><div class="meal-name">Schlaf</div><div class="sub">${slTxt}</div>${sl!=null?bar(sl/8):""}</div>
        <div class="row"><button class="plus" data-act="sleep-adj" data-v="-0.5" aria-label="Eine halbe Stunde weniger">−</button>
        <button class="plus dark" data-act="sleep-adj" data-v="0.5" aria-label="Eine halbe Stunde mehr">+</button></div>
      </div>
      <button class="meal-row" data-act="tab" data-v="sport">
        <div class="bubble">🏋️</div>
        <div class="grow"><div class="meal-name">Training</div><div class="sub">${wo.length?wo.map(w=>esc(w.name)+" · "+w.min+" min").join(", "):"Heute noch keins – Ruhetag ist auch okay"}</div></div>
        ${wo.length?`<span class="tagp on">Erledigt</span>`:""}<span class="chev">›</span>
      </button>
      <button class="meal-row" data-act="dash" data-id="routine">
        <div class="bubble">✅</div>
        <div class="grow"><div class="meal-name">Routine${rStreak()>=3?` <span class="rfire">🔥 ${rStreak()}</span>`:""}</div><div class="sub">${rt.n?rt.c+" / "+rt.n+" erledigt":"Noch keine Routine"}</div>${rt.n?bar(rt.c/rt.n):""}</div>
        <span class="chev">›</span>
      </button>
      <button class="meal-row" data-act="open" data-type="${state.stack.length?"stack":"area"}" data-id="sups-list">
        <div class="bubble">💊</div>
        <div class="grow"><div class="meal-name">Supplements</div><div class="sub">${state.stack.length?sups+" / "+state.stack.length+" genommen":"Noch kein Stack – Vorschlag ansehen"}</div>${state.stack.length?bar(sups/state.stack.length):""}</div>
        <span class="chev">›</span>
      </button>
    </div>`;
}
function renderMealPage(){
  const slot=SLOTS.find(x=>x.id===ui.addSlot)||SLOTS[0], d=day();
  const items=d.meals.filter(m=>m.slot===slot.id).map(m=>({m,p:foods().find(x=>x.id===m.id)})).filter(x=>x.p);
  const tot=items.reduce((a,{m,p})=>{ const l=line(p,m.portion); a.kcal+=l.kcal; a.protein+=l.protein; a.carbs+=l.carbs; a.fat+=l.fat; return a; },{kcal:0,protein:0,carbs:0,fat:0});
  const f=v=>(Math.round(v*10)/10).toString().replace(".",",")+" g";
  const marks={breakfast:"☕",lunch:"🍝",dinner:"🥗",snack:"🍎"};
  return `<div class="calhead"><button class="navd" data-act="dash-close" aria-label="Zurück">‹</button><b>${slot.name}</b></div>
    <div class="mealhero s-${slot.id}"><span>${marks[slot.id]}</span></div>
    <div class="mgrid"><div><b>${tot.kcal.toLocaleString("de-DE")} kcal</b><span>Kalorien</span></div><div><b>${f(tot.carbs)}</b><span>Kohlenhydrate</span></div><div><b>${f(tot.protein)}</b><span>Eiweiß</span></div><div><b>${f(tot.fat)}</b><span>Fett</span></div></div>
    ${items.map(({m,p})=>`<button class="mrow" data-act="meal-edit" data-uid="${m.uid}"><div class="grow"><b>${esc(p.name)}</b><div class="sub">${p.brand?esc(p.brand)+", ":""}${m.portion} g</div></div><span>${line(p,m.portion).kcal} kcal</span><i>›</i></button>`).join("")||`<p class="sub li">Noch nichts eingetragen.</p>`}
    <button class="yfertig" data-act="open" data-type="scan" data-slot="${slot.id}">Mehr hinzufügen</button>`;
}
function customSheet(){
  return `<h2>Eigenes Lebensmittel</h2>
    <div class="field"><label>Name</label><input id="c-name" placeholder="Overnight Oats"></div>
    <div class="field"><label>kcal / 100 g</label><input id="c-kcal" inputmode="numeric" value="100"></div>
    <div class="field"><label>Protein / 100 g</label><input id="c-p" inputmode="decimal" value="5"></div>
    <div class="field"><label>Kohlenhydrate / 100 g</label><input id="c-c" inputmode="decimal" value="12"></div>
    <div class="field"><label>Fett / 100 g</label><input id="c-f" inputmode="decimal" value="3"></div>
    <div class="gap"></div><button class="pill primary" data-act="save-custom">Speichern und eintragen</button>`;
}
function fv(x,g){ if(x==null) return "–"; return String(Math.round(x*(g/100)*10)/10).replace(".",",")+" g"; }
function fMacros(it,g){
  return [[Math.round((it.kcal||0)*g/100)+" kcal","Kalorien"],[fv(it.carbs||0,g),"Kohlenhydrate"],[fv(it.protein||0,g),"Eiweiß"],[fv(it.fat||0,g),"Fett"]].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join("");
}
function fTable(it,g){
  const row=(l,v,sub)=>`<div class="frow${sub?" sub2":""}"><span>${l}</span><b>${v}</b></div>`;
  return row("Kalorien",Math.round((it.kcal||0)*g/100)+" kcal")+row("Eiweiß",fv(it.protein||0,g))+row("Kohlenhydrate",fv(it.carbs||0,g))+row("davon Zucker",fv(it.sugar,g),1)+row("Ballaststoffe",fv(it.fiber,g),1)+row("Fett",fv(it.fat||0,g))+row("davon gesättigte Fettsäuren",fv(it.sat,g),1)+row("Salz",fv(it.salt,g));
}
function foodSheet(it,sc){
  const slot=SLOTS.find(s=>s.id===ui.addSlot), g=ui.portion||100;
  const src=it.src==="off"?"Quelle: Open Food Facts":it.type==="custom"?"Eigene Angaben":"Basisdaten";
  return `<div class="yhead"><button class="yback" data-act="${ui.editUid?"close":"back-scan"}">‹</button><b>${slot?slot.name:"Lebensmittel"}</b><span></span></div>
    <div class="ftitle"><h2>${esc(it.name)}</h2><div class="sub">${esc(it.brand||"")}</div></div>
    <div class="fmacros" id="fmacros">${fMacros(it,g)}</div>
    <div class="frate">
      <div class="top"><div class="score lg ${scoreClass(sc.score)}">${sc.score}</div>
        <div><b>Lebensmittelbewertung</b><div class="sub">Auf dich abgestimmt: ${esc(persoTags().slice(0,4).join(", "))}</div></div></div>
      <p class="sub">${sc.reasons.join(" ")}</p>
      ${((state.coach.answers.gesundheit||{}).intol||[]).some(x=>x!=="Nein, alles okay")?`<p class="sub">Erkannt nur am Namen. Bitte Zutaten prüfen.</p>`:""}
      ${(sc.parts||[]).length?`<div class="why">${sc.parts.map(([l,v],i)=>`<div><span>${l}</span><b class="${i?(v>0?"up":"dn"):""}">${i&&v>0?"+":""}${v}</b></div>`).join("")}</div>`:""}
    </div>
    <div class="sec">Nährwerte</div><div class="ftable" id="ftable">${fTable(it,g)}</div>
    <p class="sub">${src}</p>
    <div class="amt ${ui.amtOpen?"open":""}">
      <button class="amt-grab" data-act="amt-toggle" aria-label="Menge"></button>
      <button class="amt-compact" data-act="amt-open"><b id="amt-val">${g}</b><span>Gramm ⌄</span></button>
      <div class="amt-body">
        <div class="opts">${[50,100,150,200,250].map(n=>`<button class="chip ${g===n?"on":""}" data-act="portion-set" data-v="${n}">${n} g</button>`).join("")}</div>
        <div class="famt"><input id="portion" type="number" inputmode="decimal" value="${g}" data-act="portion-in" data-id="${it.id}"><span>Gramm</span></div>
        <p class="sub">Nach unten wischen, um Bewertung und Nährwerte zu sehen.</p>
      </div>
      ${ui.editUid?`<button class="yfertig static" data-act="save-meal">Speichern</button><button class="pill w-full t-bad" data-act="del-meal2">Eintrag löschen</button>`:`<button class="yfertig static" data-act="log-food" data-id="${it.id}">Hinzufügen</button>`}
    </div>`;
}
