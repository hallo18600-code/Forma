// FORMA – Coach: Pläne, Quiz, Routine, Produkte, Supplements, Haut
function coachPlans(){
  const skin = skinType();
  const sun = state.skin.sonne === "Täglich" ? "LSF behalten, auch bei Wolken." : "LSF in den Morgen, bevor du rausgehst.";
  return {
    haut: {
      title:"Haut", icon:"drop",
      lead: state.hautPlan ? `Hautbild ${skin}. ${sun}` : "Drei Fragen, dann ein fester Ablauf. Kein 10-Schritte-Regal.",
      why:"Die Haut reagiert auf zu viele neue Produkte schlechter als auf einen kurzen, gleichen Ablauf.",
      avoid:["Neues Serum und Säure am selben Abend","Duft, wenn die Haut brennt","Peeling täglich"],
      steps:[
        ["Morgens nur Wasser oder eine milde Reinigung", "Ein Durchgang reicht."],
        ["Creme ohne Duft, solange die Haut ruhig ist", "Ceramide oder einfache Basis."],
        [sun, "Wirksamer als jedes Serum."],
        ["Abends dasselbe, kein neues Produkt testen", "Ein neues Produkt pro 2 Wochen."]
      ]
    },
    haare: {
      title:"Haare", icon:"hair",
      lead:"Weniger Waschen, weniger Hitze. Das ist der ganze Plan.",
      why:"Trockenheit kommt oft vom Föhnen und vom täglichen Shampoo, nicht vom fehlenden Öl.",
      avoid:["Nass ins Bett","220 °C auf schon trockenes Haar","Fünf Leave-ins übereinander"],
      steps:[
        ["Nur waschen, wenn die Kopfhaut es braucht", "Oft sind 2–3 Mal die Woche genug."],
        ["Mild, ohne den Ansatz zu schrubben", "Spitzen, nicht die Kopfhaut ölen."],
        ["Hitze nur auf handtuchtrockenes Haar", "Eine Stufe runter."],
        ["Eine Pflege behalten, den Rest weglassen", "Mehr Produkt ist kein besserer Plan."]
      ]
    },
    koerper: {
      title:"Körper", icon:"body",
      lead:"Kurz duschen, eine Creme, fertig.",
      why:"Lange heiße Duschen trocknen die Haut aus. Danach fehlt nur eine einfache Schicht.",
      avoid:["Peeling täglich","Duft auf frisch rasierter Haut","Creme nur im Gesicht und nirgends sonst"],
      steps:[
        ["Dusche kurz und nicht brühend", "3–5 Minuten reichen."],
        ["Abtrocknen, dann Creme auf Beine und Arme", "Solange die Haut noch leicht feucht ist."],
        ["Deo erst auf trockener Haut", "Sonst reizt es."],
        ["Ein Produkt für den Körper behalten", "Nicht jede Woche die Marke wechseln."]
      ]
    },
    schlaf: {
      title:"Schlaf", icon:"moon",
      lead:"Gleiche Aufstehzeit schlägt jede Abendroutine.",
      why:"Der Rhythmus hängt am Morgen. Licht und Koffein sind die zwei Hebel, die du wirklich siehst.",
      avoid:["Ausschlafen bis 11 Uhr am Sonntag","Koffein nach 15 Uhr, wenn du schlecht einschläfst","Bildschirm direkt am Gesicht"],
      steps:[
        ["Aufstehzeit heute halten, auch am Wochenende", "Abweichung maximal 60 Minuten."],
        ["45 Minuten vor dem Bett Licht runter", "Lampe, nicht Deckenlicht."],
        ["Koffein prüfen", "Letzter Kaffee grob 8 Stunden vor dem Bett."],
        ["Handy aus dem Bett", "Liegt er woanders, bleibst du eher liegen."]
      ]
    },
    essen: {
      title:"Essen", icon:"leaf",
      lead:`${goalName()}. Protein-Richtwert ${targets().protein} g. Heute ${Math.round(totals().protein)} g.`,
      why:"Ein Teller mit Protein und etwas Unverarbeitetem schlägt ein Verbot. Der Score bestraft Fertiges, nicht einzelne Lebensmittel.",
      avoid:["Alles-oder-nichts nach einer Pizza","Kalorien ausblenden und dann raten","Nur Shakes statt Essen"],
      steps:[
        ["Protein auf mindestens zwei Mahlzeiten", "Skyr, Ei, Fisch, Hähnchen, Hülsenfrüchte."],
        ["Eine Mahlzeit ohne Fertigprodukt", "Nicht perfekt, nur eine."],
        ["Wasser vor dem Nachmittagskaffee", "Oft ist es Durst, nicht Hunger."],
        ["Abend nicht als Ausgleich hungern", "Der nächste Tag wird sonst lauter."]
      ]
    },
    sups: {
      title:"Supplements", icon:"cap",
      lead:"Maximal drei. Alles andere ist Regal, kein Plan.",
      why:"Creatin ist für Kraft klar. Der Rest nur, wenn Essen oder Sonne eine Lücke lassen.",
      avoid:["Fettverbrenner","Hochdosis ohne Grund","Kollagen vor Schlaf und LSF"],
      steps:[
        ["Stack auf den Vorschlag setzen", "Ziel, Protein heute, Fisch."],
        ["Morgens D3 zur Mahlzeit, falls im Stack", "Nicht nüchtern raten."],
        ["Creatin täglich 5 g, mit Wasser", "Nicht nur am Trainingstag."],
        ["Abends Magnesium nur wenn Schlaf das Thema ist", "Kein Abführ-Typ."]
      ]
    }
  };
}


function coachTopics(){
  return [
    {id:"haut", title:"Haut", icon:"drop", ask:"Was stört am Gesicht?"},
    {id:"haare", title:"Haare", icon:"hair", ask:"Was stört an den Haaren?"},
    {id:"schlaf", title:"Schlaf", icon:"moon", ask:"Was klappt am Schlaf nicht?"},
    {id:"koerper", title:"Körper", icon:"body", ask:"Was stört an der Haut am Körper?"},
    {id:"ernaehrung", title:"Ernährung", icon:"food", ask:"Wie isst du aktuell?"}
  ];
}
function coachQuiz(id){
  const q = {
    haut:[
      {k:"bild", q:"Wie fühlt sich die Haut an?", opts:["Trocken","Fettig","Gemischt","Sensibel"]},
      {k:"stoert", q:"Was stört dich am meisten?", opts:["Trockenheit","Unreinheiten","Rötung","Wirkt stumpf"]},
      {k:"sonne", q:"Wie oft trägst du Sonnenschutz?", opts:["Täglich","Manchmal","Selten"]},
      {k:"routine", q:"Was nutzt du aktuell?", opts:["Nichts","Nur Creme","Reinigung + Creme","Mehrere Produkte"]},
      {k:"empf", q:"Reagiert die Haut auf Duft oder neue Produkte?", opts:["Ja","Nein","Weiß nicht"]}
    ],
    haare:[
      {k:"wasch", q:"Wie oft wäschst du die Haare?", opts:["Täglich","2–3 mal","Seltener"]},
      {k:"hitze", q:"Wie oft kommt Hitze dran?", opts:["Fast immer","Manchmal","Selten"]},
      {k:"typ", q:"Haartyp?", opts:["Glatt","Wellig","Lockig"]},
      {k:"stoert", q:"Was stört dich?", opts:["Trocken","Fettig","Bricht","Nichts Konkretes"]}
    ],
    schlaf:[
      {k:"ein", q:"Wie ist das Einschlafen?", opts:["Geht schnell","Dauert","Wach in der Nacht"]},
      {k:"auf", q:"Ist die Aufstehzeit fest?", opts:["Ja, auch am Wochenende","Wechselt stark"]},
      {k:"kaffee", q:"Kaffee nach 15 Uhr?", opts:["Oft","Selten","Nie"]},
      {k:"stunden", q:"Wie viele Stunden schläfst du?", opts:["Unter 6","6–7","7–8","Über 8"]}
    ],
    ernaehrung:[
      {k:"stil", q:"Wie isst du?", opts:["Alles","Wenig Fleisch","Vegetarisch","Vegan"]},
      {k:"protein", q:"Kommt Protein zu jeder Mahlzeit?", opts:["Ja","Eher nicht"]},
      {k:"fertig", q:"Fertigprodukte und Fast Food?", opts:["Oft","Manchmal","Selten"]},
      {k:"trink", q:"Zuckergetränke?", opts:["Täglich","Manchmal","Nie"]}
    ],
    koerper:[
      {k:"dusche", q:"Wie duscht du?", opts:["Lang und heiß","Kurz","Eher lauwarm"]},
      {k:"haut", q:"Haut am Körper?", opts:["Trocken","Normal","Spannt nach der Rasur"]},
      {k:"creme", q:"Creme nach dem Duschen?", opts:["Immer","Manchmal","Nie"]}
    ]
  };
  return q[id]||[];
}
function ernAdvice(a){
  const g=state.profile.goal, t=targets(), veg=a.stil==="Vegan"||a.stil==="Vegetarisch", items=[];
  items.push({title:`Richtwert ${t.kcal} kcal, ${t.protein} g Protein`, detail:{muscle:"Moderater Überschuss, Protein bei jeder Mahlzeit.",lose:"Moderates Defizit, Protein hoch halten.",skin:"Zucker und Verarbeitetes runter.",energy:"Regelmäßig essen, nicht stark kürzen."}[g], product:null});
  if(a.protein==="Eher nicht") items.push({title:"Protein zu jeder Mahlzeit", detail:veg?"Tofu, Linsen, Quark.":"Skyr, Ei, Hähnchen, Thunfisch.", product:veg?"tofu":"skyr"});
  if(a.fertig==="Oft") items.push({title:"Fertigprodukte halbieren", detail:"Eine Mahlzeit am Tag selbst kochen reicht für den Start.", product:null});
  if(a.trink==="Täglich") items.push({title:"Zuckergetränke ersetzen", detail:"Wasser, Tee oder ungesüßt. Das spart schnell Kalorien.", product:null});
  return {lead:`Stil: ${a.stil||"–"}.`, items:items.slice(0,4)};
}
function skinType(){ const b=((state.coach.answers||{}).haut||{}).bild; return {Trocken:"trocken",Fettig:"fettig",Gemischt:"normal",Sensibel:"sensibel"}[b]||state.skin.typ||"normal"; }
function coachAdvice(id){
  const a = (state.coach.answers||{})[id]||{};
  if(id==="ernaehrung") return ernAdvice(a);
  if(id==="haut"){
    const items=[];
    if(a.routine==="Nichts") items.push({title:"Mit zwei Produkten starten", detail:"Creme abends, LSF morgens. Mehr nicht.", product:"cerave"});
    if(a.routine==="Mehrere Produkte"&&(a.stoert==="Rötung"||a.empf==="Ja")) items.push({title:"Produkte reduzieren", detail:"Alles außer Reinigung, Creme, LSF zwei Wochen pausieren.", product:null});
    if(a.empf==="Ja") items.push({title:"Nur duftfreie Produkte", detail:"Neues einzeln testen, nie zwei gleichzeitig.", product:null});
    if(a.sonne!=="Täglich") items.push({title:"LSF morgens", detail:"Wirksamer als ein Serum. Auch bei Wolken.", product:"spf"});
    if(a.bild==="Trocken"||a.stoert==="Trockenheit"||a.bild==="Sensibel") items.push({title:"Einfache Creme abends", detail:"Ohne Duft. Eine Schicht reicht.", product:"cerave"});
    if(a.stoert==="Unreinheiten"||a.bild==="Fettig") items.push({title:"Niacinamid, ein Produkt", detail:"Nicht zusammen mit einem neuen Peeling starten.", product:"nia"});
    if(a.stoert==="Rötung"||a.bild==="Sensibel") items.push({title:"Kein Gesichtswasser mit Alkohol", detail:"Menthol und Duft lassen die Rötung oft stehen.", product:null});
    if(!items.length) items.push({title:"Morgens und abends derselbe Ablauf", detail:"Reinigen, Creme, tagsüber LSF.", product:"cerave"});
    return {lead:a.bild?`Hautbild ${a.bild}, stört: ${a.stoert||"–"}.`:"Drei Antworten, dann ein Vorschlag.", items:items.slice(0,4)};
  }
  if(id==="haare"){
    const items=[];
    if(a.wasch==="Täglich") items.push({title:"Nicht jeden Tag waschen", detail:"2–3 mal reicht oft. Der Ansatz braucht keine zweite Runde.", product:null});
    if(a.hitze!=="Selten") items.push({title:"Hitze eine Stufe runter", detail:"Nur auf handtuchtrockenes Haar, nicht auf schon trockenes.", product:null});
    if(a.stoert==="Trocken"||a.stoert==="Bricht") items.push({title:"Eine Pflege an den Spitzen", detail:"Nicht fünf Öle. Nicht nass ins Bett.", product:null});
    if(a.stoert==="Fettig") items.push({title:"Ansatz waschen, Längen in Ruhe lassen", detail:"Mehr Shampoo macht den Ansatz nicht weniger fettig.", product:null});
    if(!items.length) items.push({title:"Weniger Waschen, weniger Hitze", detail:"Das ist der ganze Hebel.", product:null});
    return {lead:"Weniger Schritte, nicht mehr Produkte.", items:items.slice(0,4)};
  }
  if(id==="schlaf"){
    const items=[{title:"Aufstehzeit halten", detail:"Auch am Wochenende, Abweichung unter einer Stunde.", product:null}];
    if(a.kaffee==="Oft") items.push({title:"Letzter Kaffee vor 15 Uhr", detail:"Sonst landet er im Einschlafen.", product:null});
    if(a.stunden==="Unter 6") items.unshift({title:"Ziel: 7 Stunden", detail:"Eine Stunde früher ins Bett, nicht später aufstehen.", product:null});
    if(a.ein!=="Geht schnell") items.push({title:"Licht 45 Minuten vorher runter", detail:"Handy nicht neben dem Kopf.", product:"mg"});
    return {lead:a.ein?`Einschlafen: ${a.ein}.`:"Der Morgen steuert den Abend.", items:items.slice(0,4)};
  }
  const items=[];
  if(a.dusche==="Lang und heiß") items.push({title:"Dusche kürzer", detail:"3–5 Minuten, nicht brühend.", product:null});
  if(a.haut==="Trocken"||a.creme!=="Immer") items.push({title:"Eine Creme nach dem Duschen", detail:"Solange die Haut noch leicht feucht ist.", product:"cerave"});
  if(a.haut==="Spannt nach der Rasur") items.push({title:"Kein Duft auf frisch rasierter Haut", detail:"Erst abtrocknen, dann eine einfache Creme.", product:"cerave"});
  if(!items.length) items.push({title:"Ein Produkt behalten", detail:"Nicht jede Woche die Marke wechseln.", product:null});
  return {lead:"Kurz duschen, eine Schicht, fertig.", items:items.slice(0,4)};
}
function routineOn(id, s){
  const d = s? (state.days[s]||{}) : day();
  return !!(d.routine && d.routine[id]);
}
function topicMark(id){ return {haut:"💧", haare:"✂️", schlaf:"🌙", koerper:"🧴", ernaehrung:"🥗"}[id] || "•"; }
function renderCoach(){
  const routine = state.coach.routine||[];
  const done = routine.filter(r=>routineOn(r.id)).length;
  return `<div class="scroll pad">
    <div class="topbar"><div><h1>Coach</h1><div class="sub">Dein Vorschlag</div></div></div>
    <div class="card">
      <div class="kpi">
        <div><span>Themen</span><b>${coachTopics().filter(t=>state.coach.answers[t.id]).length}</b><span>beantwortet</span></div>
        <div><span>Routine</span><b>${routine.length}</b><span>Punkte</span></div>
        <div><span>Heute</span><b>${done}${routine.length?"/"+routine.length:""}</b><span>erledigt</span></div>
      </div>
    </div>
    <div class="gap"></div>
    ${routine.length?`<div class="card rcoach">
      <button class="rhead" data-act="c-toggle"><div class="row space"><b>Routine</b><span class="sub">${done}/${routine.length} heute ${ui.cOpen?"▴":"▾"}</span></div></button>
      ${ui.cOpen?`<div class="rlist">${routine.map(r=>`<button class="rbtn" data-act="routine-check" data-id="${r.id}"><span class="box ${routineOn(r.id)?"on":""}">${routineOn(r.id)?"✓":""}</span><div class="grow"><b>${esc(r.title)}</b>${r.detail?`<div class="sub">${esc(r.detail)}</div>`:""}</div></button>`).join("")}</div>`:""}
    </div>`:`<div class="card"><b>Noch keine Routine</b><div class="sub" style="margin-top:4px">Thema wählen, Fragen beantworten, Vorschlag in die Routine einbauen.</div></div>`}
    <div class="section"><h2>Themen</h2></div>
    <div class="card meals">
    ${coachTopics().map(t=>{
      const answered = state.coach.answers[t.id];
      const inRoutine = routine.some(r=>r.topic===t.id);
      return `<button class="meal-row" data-act="open" data-type="area" data-id="${t.id}">
        <div class="bubble">${topicMark(t.id)}</div>
        <div class="grow"><div class="meal-name">${t.title} →</div><div class="sub">${inRoutine?"In der Routine":answered?"Vorschlag bereit":t.ask}</div></div>
      </button>`;
    }).join("")}
    </div>
  </div>`;
}
function starterRoutine(){ return [["u-s1","Wasser trinken (2 Liter)"],["u-s2","10 Minuten bewegen"],["u-s3","Gesicht reinigen und Sonnenschutz"],["u-s4","Vor 23 Uhr ins Bett"]].map(([id,title])=>({id,topic:"eigen",title,detail:"",product:null})); }
function ensureRoutine(){ if(!state.routineSeeded){ state.routineSeeded=true; if(!(state.coach.routine||[]).length) state.coach.routine=starterRoutine(); if(!state.rStart) state.rStart=todayIso(); } }
function rDone(s){ const rt=state.coach.routine||[]; return {c:rt.filter(r=>routineOn(r.id,s)).length, n:rt.length}; }
function rState(s){ const x=rDone(s); if(!x.n) return ""; if(x.c===x.n) return "on"; if(x.c) return "part"; const st=state.rStart||(state.rStart=todayIso()); return (s<todayIso()&&s>=st)?"miss":""; }
function rStreak(){ let n=0, s=todayIso(); if(!(state.coach.routine||[]).length) return 0; if(rState(s)!=="on") s=addDays(s,-1); while(rState(s)==="on"&&n<400){ n++; s=addDays(s,-1); } return n; }
function routineBlock(){
  const rt=state.coach.routine||[], wk=weekStart(state.date), t=rDone(state.date), open=!!ui.rOpen&&rt.length>0;
  const when=state.date===todayIso()?"heute":labelDate(state.date);
  const list=open?`<div class="rlist">${rt.map(r=>{ const on=routineOn(r.id,state.date); return `<div class="rchk"><button class="rbtn" data-act="routine-check" data-id="${r.id}"><span class="box ${on?"on":""}">${on?"✓":""}</span><div class="grow"><b>${esc(r.title)}</b>${r.detail?`<div class="sub">${esc(r.detail)}</div>`:""}</div></button></div>`; }).join("")}
      <button class="link" data-act="dash" data-id="routine" style="margin-top:10px">Kalender, Serie &amp; eigene Punkte ›</button></div>`:"";
  return `<div class="card rprev"><button class="rhead" data-act="${rt.length?"r-toggle":"dash"}" ${rt.length?"":'data-id="routine"'}><div class="row space"><b>Routine${rStreak()>=3?` <span class="rfire">🔥 ${rStreak()}</span>`:""}</b><span class="sub">${rt.length?t.c+"/"+t.n+" "+when+" "+(open?"▴":"▾"):"Anlegen ›"}</span></div></button>
    <div class="rweek">${Array.from({length:7},(_,i)=>addDays(wk,i)).map(s=>`<i class="rd ${rState(s)} ${s===todayIso()?"today":""}">${weekday(s)}</i>`).join("")}</div>${list}</div>`;
}
function rMonth(y,mo){
  const first=new Date(y,mo,1), pad=(first.getDay()+6)%7, count=new Date(y,mo+1,0).getDate();
  const heads=["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=>`<div class="sub">${d}</div>`).join("");
  let cells="<div></div>".repeat(pad);
  for(let d=1;d<=count;d++){ const s=iso(new Date(y,mo,d)), r=rDone(s); cells+=`<button class="calcell" data-act="r-pick" data-v="${s}"><div class="cdot ${rState(s)} ${s===todayIso()?"today":""}">${d}</div><div class="cname">${r.c?r.c+"/"+r.n:""}</div></button>`; }
  return `<h2 style="margin:16px 0 8px">${first.toLocaleDateString("de-DE",{month:"long",year:"numeric"})}</h2><div class="calgrid">${heads}${cells}</div>`;
}
function renderRoutineDash(){
  const m=ui.rcal||"day", now=new Date(), rt=state.coach.routine||[], tdy=rDone(todayIso());
  const modes=[["day","Tag"],["month","Monat"],["year","Jahr"]];
  let body="";
  if(m==="day"){
    const n=rDone(state.date);
    body=`${state.rHint?"":`<div class="insight" style="margin-bottom:4px"><b>Was ist das?</b><span>Das ist deine Basis-Routine als Beispiel. Hake ab, was du heute geschafft hast. Ändere oder lösche Einträge und füge eigene hinzu. Schaffst du alle, wächst deine Serie. Ein Tag ohne Haken wird rot.</span><button class="link" data-act="rhint" style="text-align:left;margin-top:4px">Verstanden</button></div>`}
    <h2 style="margin:16px 0 8px">${labelDate(state.date)}${rt.length?` · ${n.c}/${n.n}`:""}</h2><div class="card">
      ${rt.map(r=>{ const on=routineOn(r.id,state.date); return `<div class="rchk"><button class="rbtn" data-act="routine-check" data-id="${r.id}"><span class="box ${on?"on":""}">${on?"✓":""}</span><b>${esc(r.title)}</b></button><button class="x" data-act="routine-del" data-id="${r.id}">✕</button></div>`; }).join("")||`<p class="sub" style="padding:6px 0">Noch keine Routine. Leg unten deine erste an.</p>`}
      <div class="row" style="gap:8px;margin-top:14px"><input id="r-new" placeholder="Eigene Routine, z. B. 10 Min lesen" style="flex:1;min-width:0;border:1.5px solid var(--line);border-radius:14px;padding:11px 12px;font:inherit"><button class="pill dark" data-act="routine-add" style="width:auto;padding:0 18px">+</button></div></div>`;
  } else if(m==="month") body=rMonth(now.getFullYear(),now.getMonth())+rMonth(now.getFullYear(),now.getMonth()-1);
  else { const y=now.getFullYear();
    body=`<h2 style="margin:16px 0 8px">${y}</h2><div class="yeargrid">${Array.from({length:12},(_,mo)=>{
      const first=new Date(y,mo,1), pad=(first.getDay()+6)%7, count=new Date(y,mo+1,0).getDate();
      let cells=Array.from({length:pad},()=>`<i class="sq empty"></i>`).join("");
      for(let d=1;d<=count;d++) cells+=`<i class="sq ${rState(iso(new Date(y,mo,d)))}"></i>`;
      return `<div><div class="sub" style="margin-bottom:4px">${first.toLocaleDateString("de-DE",{month:"short"})}</div><div class="mini">${cells}</div></div>`;
    }).join("")}</div>`; }
  return `<div class="calhead"><button class="navd" data-act="dash-close">‹</button>
    <div class="seg" style="flex:1;margin:0 8px">${modes.map(([id,l])=>`<button class="${m===id?"on":""}" data-act="rcal-mode" data-v="${id}">${l}</button>`).join("")}</div></div>
    <div class="card" style="display:grid;grid-template-columns:1fr 1fr;padding:0">
      <div style="padding:12px;border-right:1px solid var(--line)"><b>${rStreak()}-Tage-Serie${rStreak()>=3?" 🔥":""}</b><div class="sub">Alle Routinen erledigt</div></div>
      <div style="padding:12px"><b>${tdy.c}/${tdy.n} heute</b><div class="sub">Erledigt</div></div></div>
    <div class="sub" style="margin-top:14px">Grün: alle erledigt · Hellgrün: teilweise · Rot: verpasst</div>
    ${body}`;
}
function stackSheet(){
  const d=day();
  return `<h2>Stack heute</h2>
    ${state.stack.map(id=>{ const s=SUPS.find(x=>x.id===id); return `<button class="task" data-act="take" data-id="${id}">
      <span class="chk ${d.taken[id]?"on":""}">${d.taken[id]?"✓":""}</span>
      <div class="grow"><b>${s.name}</b><div class="sub">${s.dose} · ${s.when}</div></div>
    </button>`; }).join("")||`<p class="sub">Noch nichts im Stack.</p>`}
    <div class="gap"></div><button class="pill ghost" style="width:100%" data-act="open" data-type="area" data-id="sups">Stack bearbeiten</button>`;
}
function productSheet(id){
  const item=allItems().find(p=>p.id===id);
  if(!item) return `<p>Nicht gefunden.</p>`;
  const sc=scored(item);
  if(item.type==="food"||item.type==="custom") return foodSheet(item,sc);
  const inStack=item.type==="sup" && state.stack.includes(item.id);
  return `<div class="row" style="gap:12px">
      <div class="score ${scoreClass(sc.score)}" style="width:56px;height:56px;font-size:20px;border-radius:16px">${sc.score}</div>
      <div><div class="sub">${item.brand||""}</div><h2>${esc(item.name)}</h2><div class="sub">${goalName()}</div></div>
    </div>
    <p class="sub" style="margin:12px 0">${sc.reasons.join(" ")}</p>
    ${(sc.parts||[]).length?`<div class="why">${sc.parts.map(([l,v],i)=>`<div><span>${l}</span><b class="${i?(v>0?"up":"dn"):""}">${i&&v>0?"+":""}${v}</b></div>`).join("")}</div>`:""}
    ${item.type==="food"||item.type==="custom"?`
      <div class="sub">${item.kcal} kcal · ${item.protein} g Protein / 100 g</div>
      <div class="field"><label>Portion in g</label><input id="portion" type="number" value="${ui.portion}"></div>
      <button class="pill primary" data-act="log-food" data-id="${item.id}">Zum Tagebuch · ${labelDate(state.date)}</button>
    `:item.type==="sup"?`
      <div class="sub">${item.dose} · ${item.when}</div><div class="gap"></div>
      <button class="pill ${inStack?"ghost":"primary"}" style="width:100%" data-act="toggle-stack" data-id="${item.id}">${inStack?"Aus dem Stack":"In den Stack"}</button>
      ${PARTNERS_ENABLED&&state.profile.affiliates?`<div class="gap"></div><button class="pill ghost" style="width:100%" data-act="affiliate">Bezugsquelle · Anzeige</button>`:""}
    `:`<button class="pill ghost" style="width:100%" data-act="mark-pflege">Für Pflege merken</button>
      ${PARTNERS_ENABLED&&state.profile.affiliates?`<div class="gap"></div><button class="pill ghost" style="width:100%" data-act="affiliate">Bezugsquelle · Anzeige</button>`:""}`}
  `;
}
function areaSheet(id){
  if(id==="sups-list") return supsSheet();
  const topic=coachTopics().find(t=>t.id===id);
  if(!topic) return "<p>Kein Thema.</p>";
  const quiz=coachQuiz(id);
  const answers=state.coach.answers[id]||{};
  const ready=quiz.every(q=>answers[q.k]);
  if(!ready){
    return `<h2>${topic.title}</h2><p class="sub">${topic.ask} Ein paar Fragen, dann ein Vorschlag.</p>
      ${quiz.map(item=>`<div class="q"><b>${item.q}</b><div class="opts">${item.opts.map(o=>`<button class="chip ${answers[item.k]===o?"on":""}" data-act="coach-answer" data-topic="${id}" data-k="${item.k}" data-v="${o}">${o}</button>`).join("")}</div></div>`).join("")}
      <div class="gap"></div><button class="pill primary" data-act="coach-ready" data-topic="${id}" ${ready?"":"disabled"}>Vorschlag zeigen</button>`;
  }
  const advice=coachAdvice(id);
  const products=[...new Set(advice.items.map(i=>i.product).filter(Boolean))];
  return `<h2>${topic.title}</h2><p class="sub">${advice.lead}</p>
    ${advice.items.map(i=>`<div style="padding:10px 0;border-bottom:1px solid var(--line)"><b>${i.title}</b><div class="sub">${i.detail}</div></div>`).join("")}
    ${products.length?`<div class="section"><h2>Dazu passen</h2></div>${products.map(pid=>{
      const item=allItems().find(x=>x.id===pid); if(!item) return "";
      return `<button class="food" data-act="open" data-type="product" data-id="${pid}"><div class="thumb">${item.emoji||""}</div><div class="grow"><b>${item.name}</b><div class="sub">${item.brand||""}</div></div></button>`;
    }).join("")}`:""}
    <div class="gap"></div>
    ${(state.coach.routine||[]).some(r=>r.topic===id)
      ?`<button class="pill ghost" style="width:100%" data-act="coach-remove" data-topic="${id}">Aus der Routine entfernen</button>`
      :`<button class="pill primary" data-act="coach-add" data-topic="${id}">In die Routine einbauen</button>`}
    <div class="gap"></div>
    <button class="pill ghost" style="width:100%" data-act="coach-reset" data-topic="${id}">Antworten ändern</button>`;
}
function planBody(id){ return areaSheet(id); }
function supsSheet(){
  const rec=recommendStack();
  const rest=SUPS.filter(p=>!rec.some(r=>r.id===p.id));
  return `<h2>Dein Stack</h2>
    <p class="sub">${goalName()} · Protein heute ${Math.round(totals().protein)} / ${targets().protein} g · Fisch ${state.profile.fish}</p>
    ${rec.map(r=>{ const p=SUPS.find(x=>x.id===r.id); return `<button class="food" data-act="open" data-type="product" data-id="${p.id}">
      <div class="thumb">${p.emoji}</div><div class="grow"><b>${p.name}</b><div class="sub">${r.why}</div></div>
      <div class="score ${scoreClass(r.score)}">${r.score}</div></button>`; }).join("")}
    <div class="gap"></div><button class="pill primary" data-act="apply-stack">Vorschlag übernehmen</button>
    <div class="section"><h2>Rest</h2></div>
    ${rest.map(p=>`<button class="food" data-act="open" data-type="product" data-id="${p.id}"><div class="thumb">${p.emoji}</div><div class="grow"><b>${p.name}</b><div class="sub">${p.note}</div></div><div class="score ${scoreClass(scored(p).score)}">${scored(p).score}</div></button>`).join("")}`;
}
function skinSheet(){
  const q=[
    {k:"typ", label:"Hautbild", opts:["trocken","fettig","sensibel","unrein","normal"]},
    {k:"ziel", label:"Stört am meisten", opts:["Trockenheit","Unreinheiten","Rötung"]},
    {k:"sonne", label:"Sonnenschutz", opts:["Täglich","Manchmal","Selten"]}
  ];
  const ready=q.every(x=>state.skin[x.k]);
  if(state.hautPlan && ready){
    const recs=CARE.filter(c=>scoreCare(c).score>=70).slice(0,2);
    return `<h2>Hautplan</h2>
      <div class="sub">Hautbild ${state.skin.typ} · ${state.skin.ziel}</div>
      <div class="sub">${state.skin.sonne==="Täglich"?"LSF beibehalten":"LSF in den Morgen"}</div>
      ${recs.map(p=>`<button class="food" data-act="open" data-type="product" data-id="${p.id}"><div class="thumb">${p.emoji}</div><div class="grow"><b>${p.name}</b></div><div class="score ${scoreClass(scored(p).score)}">${scored(p).score}</div></button>`).join("")}
      <p class="sub">Nur ein Hinweis. Nichts zum Abhaken.</p>`;
  }
  return `<h2>Haut</h2>${q.map(item=>`<div class="q"><b>${item.label}</b><div class="opts">${item.opts.map(o=>`<button class="chip ${state.skin[item.k]===o?"on":""}" data-act="skin" data-k="${item.k}" data-v="${o}">${o}</button>`).join("")}</div></div>`).join("")}
    <div class="gap"></div><button class="pill primary" data-act="skin-done" ${ready?"":"disabled"}>Tipp anpassen</button>`;
}
