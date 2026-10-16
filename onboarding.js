// FORMA – Willkommen, Fragebogen (eine Frage pro Seite) und persönlicher Plan

const OB_GOALS = {
  muscle:["💪","Kraft und Masse aufbauen, mit leichtem Kalorienplus"],
  lose:["🔥","Fett verlieren und dabei Muskeln halten"],
  skin:["✨","Haut, Haare und Ausstrahlung im Fokus"],
  energy:["⚡","Fitter durch den Tag und besser schlafen"]
};
const OB_FEATURES = [
  ["Essen", [
    ["🍽️","Kalorientracker","Suchen, Barcode scannen oder einfach hinschreiben, was du gegessen hast"],
    ["⭐","Essensbewerter","Jedes Lebensmittel bekommt einen Score, passend zu deinem Ziel"],
    ["💊","Supplement-Check","Nur das, was für dich wirklich Sinn ergibt"]
  ]],
  ["Körper", [
    ["🏋️","Trainingstracker","Pläne, Sätze, Pausen-Timer und Fortschritt"],
    ["⚖️","Gewicht & Maße","Verlauf, BMI und Körpermaße im Blick"],
    ["👟","Schritte & Wasser","Tagesziele zum Abhaken"]
  ]],
  ["Pflege & Alltag", [
    ["💧","Hautguide","Eine einfache Routine für deinen Hauttyp"],
    ["✂️","Haare & Körperpflege","Weniger Produkte, die richtigen Schritte"],
    ["🌙","Schlafcoach","Stunden tracken und leichter einschlafen"],
    ["✅","Routine","Tägliche Gewohnheiten mit Serie"]
  ]]
];
const OB_TOPICS = [["ernaehrung","Ernährung"],["haut","Haut"],["haare","Haare"],["koerper","Körper"],["schlaf","Schlaf"]];
const OB_INTRO = {
  ernaehrung:"Daraus wird dein persönlicher Essens-Score.",
  haut:"Daraus baut der Coach deine Hautroutine.",
  haare:"Für einen einfachen Haarpflege-Plan.",
  koerper:"Für deine Körperpflege nach dem Duschen.",
  schlaf:"Damit Schlaf-Tipps und Routine zu dir passen."
};

function hasVal(v){ return Array.isArray(v) ? v.length>0 : v!=null && v!==""; }
function toggleMulti(arr, v, none){
  arr = (arr||[]).slice();
  if(arr.includes(v)) return arr.filter(x=>x!==v);
  if(v===none) return [v];
  return arr.filter(x=>x!==none).concat(v);
}
function obAns(t){ return state.coach.answers[t] || (state.coach.answers[t]={}); }
function obProf(k){ return (state.ob||{})[k] ? state.profile[k] : undefined; }
function obMark(k){ state.ob = state.ob||{}; state.ob[k]=1; }
function obMinTarget(){ const m=state.profile.height/100; return Math.ceil(18.5*m*m*2)/2; }
function obDefaultTarget(){
  const p=state.profile, w=+p.weight||70;
  const t = p.goal==="lose" ? w-4 : p.goal==="muscle" ? w+2 : w;
  return Math.max(obMinTarget(), Math.round(t*2)/2);
}

// Alle Fragen in Reihenfolge. Themen-Fragen kommen aus coachQuiz(), damit Coach und Fragebogen gleich bleiben.
function obSteps(){
  const p=state.profile, S=[];
  const num=(id,sec,q,sub,min,max,step,unit)=>S.push({id,sec,kind:"num",k:id,q,sub,min,max,step,unit});
  S.push({id:"adult",sec:"Start",kind:"adult",q:"Kurz vorab",sub:"FORMA ist für Erwachsene gemacht. Bist du 18 oder älter?"});
  S.push({id:"name",sec:"Über dich",kind:"text",k:"name",q:"Wie dürfen wir dich nennen?",sub:"Nur für die Begrüßung in der App. Du kannst das Feld auch leer lassen."});
  S.push({id:"sex",sec:"Über dich",kind:"single",req:1,q:"Dein Geschlecht",sub:"Brauchen wir für die Kalorienformel.",
    opts:[{v:"m",l:"Mann",e:"👨"},{v:"w",l:"Frau",e:"👩"}], get:()=>obProf("sex"), set:v=>{ p.sex=v; obMark("sex"); }});
  num("age","Über dich","Wie alt bist du?","",18,90,1,"Jahre");
  num("height","Über dich","Wie groß bist du?","",140,220,1,"cm");
  num("weight","Über dich","Wie viel wiegst du gerade?","Ein ungefährer Wert reicht. Neu wiegen kannst du dich jederzeit.",40,200,0.5,"kg");
  S.push({id:"goal",sec:"Dein Ziel",kind:"single",req:1,q:"Was ist dein Hauptziel?",sub:"Danach richten sich Kalorien und Essens-Score.",
    opts:GOALS.map(g=>({v:g.id,l:g.name,e:OB_GOALS[g.id][0],d:OB_GOALS[g.id][1]})), get:()=>obProf("goal"),
    set:v=>{ p.goal=v; obMark("goal"); if(!state.ob.target) p.target=obDefaultTarget(); }});
  num("target","Dein Ziel","Dein Wunschgewicht",p.goal==="lose"||p.goal==="muscle"?"Lieber realistisch: 0,5 kg pro Woche sind ein gutes Tempo.":"Wenn es dir nicht ums Gewicht geht, lass einfach dein aktuelles Gewicht stehen.",obMinTarget(),200,0.5,"kg");
  S.push({id:"areas",sec:"Dein Ziel",kind:"multi",q:"Woran willst du außerdem arbeiten?",sub:"Mehrere möglich. Diese Themen bekommen in Coach und Routine Vorrang.",
    opts:[["Haut","💧"],["Haare","✂️"],["Schlaf","🌙"],["Energie","⚡"],["Körperpflege","🧴"],["Ernährung","🥗"],["Gewohnheiten","✅"]].map(([l,e])=>({v:l,l,e})),
    get:()=>p.areas, set:v=>{ p.areas=v; }});
  S.push({id:"activity",sec:"Alltag & Training",kind:"single",req:1,q:"Wie aktiv ist dein Alltag?",sub:"Ohne Training. Das rechnet FORMA extra dazu.",
    opts:[["1.3","Meist sitzend","Büro, Studium, wenig zu Fuß","🪑"],["1.4","Leicht aktiv","Öfter auf den Beinen, kurze Wege zu Fuß","🚶"],["1.55","Aktiv","Viel Bewegung oder körperliche Arbeit","🚴"],["1.7","Sehr aktiv","Harte körperliche Arbeit","🏗️"]].map(([v,l,d,e])=>({v,l,d,e})),
    get:()=>state.ob&&state.ob.activity?String(p.activity):undefined, set:v=>{ p.activity=+v; obMark("activity"); }});
  S.push({id:"trainFreq",sec:"Alltag & Training",kind:"single",q:"Wie oft trainierst du?",sub:"Danach wählt FORMA deinen Startplan.",
    opts:[["Gar nicht","Noch nicht, will aber anfangen","🛋️"],["1–2× pro Woche","","🙂"],["3–4× pro Woche","","💪"],["5× oder öfter","","🔥"]].map(([l,d,e])=>({v:l,l,d,e})),
    get:()=>p.trainFreq, set:v=>{ p.trainFreq=v; }});
  S.push({id:"trainType",sec:"Alltag & Training",kind:"single",q:"Welches Training machst du – oder willst du machen?",
    opts:[["Krafttraining","Gewichte, Maschinen, Eigengewicht","🏋️"],["Ausdauer","Laufen, Rad, Schwimmen","🏃"],["Beides","Kraft und Ausdauer gemischt","⚡"],["Weiß ich noch nicht","Der Startplan hilft dir rein","🤔"]].map(([l,d,e])=>({v:l,l,d,e})),
    get:()=>p.trainType, set:v=>{ p.trainType=v; }});
  S.push({id:"stepGoal",sec:"Alltag & Training",kind:"single",q:"Wie viele Schritte willst du pro Tag schaffen?",
    opts:[[6000,"ca. 60 Minuten zu Fuß"],[8000,"ca. 80 Minuten zu Fuß"],[10000,"Der Klassiker, ca. 100 Minuten"],[12000,"Sportlich, ca. 2 Stunden"]].map(([v,d])=>({v:String(v),l:v.toLocaleString("de-DE")+" Schritte",d,e:"👟"})),
    get:()=>p.stepGoal?String(p.stepGoal):undefined, set:v=>{ p.stepGoal=+v; }});
  OB_TOPICS.forEach(([t,title])=>{
    coachQuiz(t).forEach((q,i)=>S.push({id:t+"-"+q.k, sec:title, topic:t, opt:1, kind:q.multi?"multi":"single", q:q.q,
      sub:q.hint || (i===0 ? `${coachQuiz(t).length} kurze Fragen. ${OB_INTRO[t]}` : ""), none:q.none,
      opts:q.opts.map(o=>({v:o,l:o,e:(q.emo||{})[o]})), get:()=>obAns(t)[q.k], set:v=>{ obAns(t)[q.k]=v; }}));
    if(t==="ernaehrung") S.push({id:"fish",sec:title,topic:t,opt:1,kind:"single",q:"Wie oft isst du Fisch?",sub:"Wichtig für den Omega-3-Vorschlag.",
      opts:[{v:"wenig",l:"Selten oder nie",e:"🥦"},{v:"oft",l:"Mindestens einmal pro Woche",e:"🐟"}], get:()=>obProf("fish"), set:v=>{ p.fish=v; obMark("fish"); }});
  });
  S.push({id:"sups",sec:"Supplements & Routine",opt:1,kind:"multi",none:"none",q:"Nimmst du schon Supplements?",sub:"Die kannst du dann täglich abhaken.",
    opts:SUPS.map(s=>({v:s.id,l:s.name,e:s.emoji,d:s.dose+", "+s.when})).concat({v:"none",l:"Nichts davon",e:"🚫"}),
    get:()=>state.ob&&state.ob.sups?(state.stack.length?state.stack.slice():["none"]):undefined,
    set:v=>{ state.stack=v.filter(x=>x!=="none"); obMark("sups"); if(!v.length) delete state.ob.sups; }});
  S.push({id:"routineTime",sec:"Supplements & Routine",opt:1,kind:"single",q:"Wie viel Zeit hast du täglich für deine Routine?",sub:"Danach richtet sich, wie viele Punkte deine Routine bekommt.",
    opts:[["5 Minuten","3 kleine Gewohnheiten","⏱️"],["15 Minuten","5 Gewohnheiten","🕒"],["30 Minuten oder mehr","Die volle Routine","🗓️"]].map(([l,d,e])=>({v:l,l,d,e})),
    get:()=>p.routineTime, set:v=>{ p.routineTime=v; }});
  S.push({id:"plan",sec:"Dein Plan",kind:"plan",q:"Fertig! Das ist dein Plan"});
  return S;
}

// ---------- Rendern ----------
function renderWelcome(){
  const icons=["🍽️","⭐","🏋️","⚖️","👟","💧","✂️","🌙","💊","✅"];
  return `<div class="screen wlscreen">
    <div class="scroll wl">
      <div class="logo">forma</div>
      <div class="wl-stack" aria-hidden="true">${icons.map(e=>`<span>${e}</span>`).join("")}</div>
      <h1 class="wl-h">Alles, was dich formt.</h1>
      <p class="wl-sub">Essen, Training, Haut, Schlaf und mehr. Eine App statt zehn – und alles auf dich abgestimmt.</p>
      ${OB_FEATURES.map(([g,items])=>`<h2 class="wl-g">${g}</h2><div class="wl-list">${items.map(([e,t,d])=>`<div class="wl-item"><span class="bubble">${e}</span><div class="grow"><b>${t}</b><span>${d}</span></div></div>`).join("")}</div>`).join("")}
      <p class="wl-privacy">🔒 Kein Konto, kein Server. Deine Daten bleiben auf deinem Gerät.</p>
    </div>
    <div class="wl-cta">
      <button class="pill primary" data-act="start-onboard">Fragebogen starten</button>
      <span class="sub">Dauert ca. 3 Minuten. Danach ist alles auf dich eingestellt.</span>
      <button class="link" data-act="skip-demo">Erst mit Beispieldaten ansehen</button>
    </div>
  </div>`;
}
function obNumHint(k){
  const p=state.profile, m=p.height/100;
  if(k==="weight"){ const b=p.weight/(m*m); return `BMI <b>${de(b,1)}</b> · ${bmiLabel(b)}`; }
  if(k==="target"){
    const b=p.target/(m*m), sp=weightSpan(), d=p.target-p.weight;
    return `BMI bei diesem Gewicht: <b>${de(b,1)}</b> (${bmiLabel(b)})<br>Richtbereich für ${p.height} cm: ${sp.low}–${sp.high} kg${Math.abs(d)>=0.5?`<br>${d<0?"Minus":"Plus"} ${de(Math.abs(d),1)} kg zu heute`:""}`;
  }
  return "";
}
function obOpt(o, on, multi, act){
  return `<button class="ob-opt ${multi?"multi":""} ${on?"on":""}" data-act="${act||"ob-pick"}" data-v="${esc(o.v)}">
    ${o.e?`<span class="ob-e">${o.e}</span>`:""}
    <div class="grow"><b>${esc(o.l)}</b>${o.d?`<span>${esc(o.d)}</span>`:""}</div>
    <i class="ob-check">${on?"✓":""}</i></button>`;
}
function renderOnboard(){
  const S=obSteps();
  state.step=Math.max(0,Math.min(S.length-1,state.step||0));
  const st=S[state.step], p=state.profile;
  const secSteps=S.filter(x=>x.sec===st.sec), secPos=secSteps.indexOf(st)+1;
  const pct=Math.round(state.step/(S.length-1)*100);
  let body="", can=true;
  if(st.kind==="adult"){
    body=`<div class="ob-opts">${obOpt({v:"1",l:"Ja, ich bin 18 oder älter",e:"✅"},p.adult,false,"ob-adult")}${obOpt({v:"0",l:"Nein",e:"✋"},state.obMinor,false,"ob-adult")}</div>
      ${state.obMinor?`<div class="warn">FORMA ist erst ab 18. Schau gern wieder vorbei, wenn es so weit ist.</div>`:""}`;
    can=!!p.adult;
  } else if(st.kind==="text"){
    body=`<input class="ob-text" data-act="input" data-k="${st.k}" value="${esc(p[st.k]||"")}" placeholder="Dein Vorname" autocomplete="given-name" maxlength="30">`;
  } else if(st.kind==="num"){
    const v=p[st.k];
    body=`<div class="ob-num">
        <button class="ob-nb" data-act="ob-nudge" data-d="-${st.step}" aria-label="Weniger">−</button>
        <label class="ob-val"><input id="ob-in" data-act="ob-num" data-k="${st.k}" type="text" inputmode="decimal" autocomplete="off" aria-label="${st.q}" value="${String(v).replace(".",",")}"><span>${st.unit}</span></label>
        <button class="ob-nb" data-act="ob-nudge" data-d="${st.step}" aria-label="Mehr">+</button>
      </div><div class="ob-hint" id="ob-hint">${obNumHint(st.k)}</div>`;
  } else if(st.kind==="single"||st.kind==="multi"){
    const cur=st.get(), multi=st.kind==="multi";
    body=`${multi?`<div class="ob-multi">Mehrere möglich</div>`:""}<div class="ob-opts">${st.opts.map(o=>obOpt(o, multi?(cur||[]).includes(o.v):cur===o.v, multi)).join("")}</div>`;
    if(st.req) can=hasVal(cur);
  } else if(st.kind==="plan"){
    body=renderObPlan();
  }
  const foot = st.kind==="plan"
    ? `<button class="pill primary" data-act="ob-finish">FORMA starten</button>`
    : `<button class="pill primary" data-act="ob-next" ${can?"":"disabled"}>Weiter</button>
       ${st.opt?`<button class="pill skip" data-act="ob-skip">Abschnitt überspringen</button>`:""}`;
  return `<div class="screen ob">
    <div class="ob-top">
      <button class="ob-back" data-act="ob-back" aria-label="Zurück">‹</button>
      <div class="ob-prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(3,pct)}%"></i></div>
      ${state.obRedo?`<button class="link" data-act="ob-close">Schließen</button>`:""}
    </div>
    <div class="scroll ob-body">
      <div class="ob-sec">${st.sec}${secSteps.length>1&&st.kind!=="plan"?` · Frage ${secPos} von ${secSteps.length}`:""}</div>
      <h1>${st.kind==="plan"&&p.name?`Fertig, ${esc(p.name)}! Das ist dein Plan`:st.q}</h1>
      ${st.sub?`<p class="sub">${st.sub}</p>`:""}
      ${body}
    </div>
    <div class="ob-foot">${foot}</div>
  </div>`;
}

// Was der Essens-Score für diese Person besonders beachtet
function persoTags(){
  const A=state.coach.answers, e=A.ernaehrung||{}, s=A.schlaf||{}, h=A.haut||{}, out=[goalName()];
  if(e.stil&&e.stil!=="Alles") out.push(e.stil);
  (e.fokus||[]).filter(x=>x!=="Nichts Bestimmtes").forEach(x=>out.push(x));
  (e.intol||[]).filter(x=>x!=="Nein, alles okay").forEach(x=>out.push("Ohne "+x));
  if((e.huerde||[]).includes("Heißhunger")) out.push("Sättigung");
  if(s.kaffee==="Oft"||(s.ein&&s.ein!=="Geht schnell")) out.push("Koffein am Abend");
  if(h.stoert==="Unreinheiten") out.push("Zucker & Haut");
  return out;
}
function fullBodyPlan(){
  const set=(kg,reps,n=3)=>Array.from({length:n},()=>({kg,reps}));
  return { id:"gk", name:"Ganzkörper", days:[
    {id:"gka", name:"Ganzkörper A", exercises:[{id:"sq",sets:set(40,10)},{id:"bp",sets:set(30,10)},{id:"row",sets:set(30,10)},{id:"plank",sets:set(0,30,2)}]},
    {id:"gkb", name:"Ganzkörper B", exercises:[{id:"rdl",sets:set(40,10)},{id:"ohp",sets:set(20,10)},{id:"lat",sets:set(30,10)},{id:"lunge",sets:set(8,10)}]}
  ]};
}
function obWantsFullBody(){ return ["Gar nicht","1–2× pro Woche"].includes(state.profile.trainFreq); }
function obDefaultPlans(){ return JSON.stringify(state.routines)===JSON.stringify(defaultRoutines()); }
// Tägliche Routine aus den Antworten
function buildRoutine(){
  const p=state.profile, A=state.coach.answers, s=A.schlaf||{}, h=A.haut||{}, e=A.ernaehrung||{}, k=A.koerper||{}, c=[];
  const add=(id,topic,title,area)=>c.push({id:"ob-"+id, topic, title, detail:"", product:null, area});
  if(s.stunden==="Unter 6") add("bett","schlaf","Vor 23 Uhr ins Bett","Schlaf");
  else if(s.auf==="Wechselt stark") add("auf","schlaf","Aufstehzeit halten, auch am Wochenende","Schlaf");
  if(s.kaffee==="Oft") add("kaffee","schlaf","Kein Kaffee nach 15 Uhr","Schlaf");
  if(h.sonne&&h.sonne!=="Täglich") add("lsf","haut","Morgens Sonnenschutz auftragen","Haut");
  if(h.bild) add("gesicht","haut",h.routine==="Nichts"?"Abends Gesicht reinigen und eincremen":"Abends Gesicht reinigen","Haut");
  if(e.protein==="Eher nicht") add("protein","ernaehrung","Protein zu jeder Mahlzeit","Ernährung");
  if(e.trink==="Täglich") add("zucker","ernaehrung","Wasser statt Zuckergetränk","Ernährung");
  if(e.fertig==="Oft") add("kochen","ernaehrung","Eine Mahlzeit selbst kochen","Ernährung");
  if((e.huerde||[]).includes("Heißhunger")) add("snack","ernaehrung","Protein-Snack statt Süßem","Ernährung");
  if((e.huerde||[]).includes("Abends zu viel")) add("abend","ernaehrung","Nach dem Abendessen: Küche zu","Ernährung");
  if(k.creme&&k.creme!=="Immer") add("creme","koerper","Nach dem Duschen eincremen","Körperpflege");
  if(p.trainFreq==="Gar nicht") add("bewegen","eigen","10 Minuten bewegen","Energie");
  add("wasser","eigen",e.wasser==="Unter 1 Liter"?"Zu jeder Mahlzeit ein Glas Wasser":`${p.waterTarget} Gläser Wasser trinken`,"Gewohnheiten");
  const areas=p.areas||[];
  c.sort((a,b)=>(areas.includes(b.area)?1:0)-(areas.includes(a.area)?1:0));
  const max={"5 Minuten":3,"15 Minuten":5,"30 Minuten oder mehr":7}[p.routineTime]||4;
  return c.slice(0,max).map(({area,...r})=>r);
}
function renderObPlan(){
  const p=state.profile, t=targets(), rt=buildRoutine();
  const plan = obWantsFullBody()&&obDefaultPlans() ? "Ganzkörper A und B im Wechsel – ideal für 1–2 Einheiten pro Woche."
    : obDefaultPlans() ? "Push, Pull, Beine – ein klassischer Plan für 3 oder mehr Einheiten pro Woche." : "Deine bestehenden Trainingspläne bleiben, wie sie sind.";
  const sups = state.stack.length ? state.stack.map(id=>(SUPS.find(x=>x.id===id)||{}).name).filter(Boolean).join(", ")
    : "Vorschlag für dich: "+recommendStack().map(r=>(SUPS.find(x=>x.id===r.id)||{}).name).join(", ")+". Ansehen kannst du ihn im Tagebuch.";
  return `<div class="obp-hero">
      <span>Dein Richtwert pro Tag</span>
      <div class="obp-k">${de(t.kcal)} kcal</div>
      <div class="obp-row"><div><b>${t.protein} g</b><span>Protein</span></div><div><b>${p.waterTarget}</b><span>Gläser Wasser</span></div><div><b>${de(p.stepGoal||10000)}</b><span>Schritte</span></div></div>
      <p>An Trainingstagen rechnet FORMA den Verbrauch automatisch dazu.</p>
    </div>
    ${safetyNote()}
    <div class="card obp"><h3>⭐ Dein Essens-Score achtet auf</h3><div class="opts">${persoTags().map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div></div>
    <div class="card obp"><h3>🏋️ Training</h3><p>${plan}</p></div>
    <div class="card obp"><h3>✅ Deine tägliche Routine</h3>${rt.map(r=>`<div class="obp-li">${esc(r.title)}</div>`).join("")}</div>
    <div class="card obp"><h3>💊 Supplements</h3><p>${sups}</p></div>
    <p class="sub" style="margin:14px 4px 0">Richtwerte, keine medizinische Beratung. Antworten kannst du später im Coach und im Profil ändern.</p>`;
}

// ---------- Aktionen ----------
function obGo(n){ const S=obSteps(); state.step=Math.max(0,Math.min(S.length-1,(state.step||0)+n)); save(); }
function obClampNum(k){
  const S=obSteps(), st=S.find(x=>x.id===k); if(!st) return;
  const p=state.profile; let v=+p[k]; if(!isFinite(v)||!v) v=st.min;
  p[k]=Math.max(st.min,Math.min(st.max,+v.toFixed(1))); obMark(k);
  if(k==="weight"&&!state.ob.target) p.target=obDefaultTarget();
}
function obPick(v){
  const st=obSteps()[state.step]; if(!st||!st.opts) return;
  if(st.kind==="multi"){ st.set(toggleMulti(st.get(),v,st.none)); save(); return; }
  st.set(v); save();
  const cur=state.step;
  setTimeout(()=>{ if(!state.onboarded&&state.step===cur){ obGo(1); render(); } },260);
}
function obNext(){
  const st=obSteps()[state.step]; if(!st) return;
  if(st.kind==="adult"&&!state.profile.adult) return;
  if(st.kind==="num") obClampNum(st.k);
  if(st.req&&!hasVal(st.get())) return;
  obGo(1);
}
function obNudge(d){
  const st=obSteps()[state.step]; if(!st||st.kind!=="num") return;
  const p=state.profile, v=(+p[st.k]||st.min)+d;
  p[st.k]=Math.max(st.min,Math.min(st.max,+v.toFixed(1))); obMark(st.k);
  if(st.k==="weight"&&!state.ob.target) p.target=obDefaultTarget();
  save();
}
function obSkip(){
  const S=obSteps(), st=S[state.step]; if(!st||!st.opt) return;
  let i=state.step; while(i<S.length-1&&S[i].sec===st.sec) i++;
  state.step=i; save();
}
function obBack(){
  const st=obSteps()[state.step];
  if(st&&st.kind==="num") obClampNum(st.k);
  if(!state.step) state.step=null; else obGo(-1);
  save();
}
function obFinish(){
  const p=state.profile; if(!p.adult) return;
  const first=!state.obDone;
  ["age","height","weight","target"].forEach(obClampNum);
  if(!state.ob.target) p.target=obDefaultTarget();
  p.target=Math.max(obMinTarget(),p.target);
  if(!state.weights.length||Math.abs(lastWeight()-p.weight)>0.05)
    state.weights=state.weights.filter(w=>w.date!==todayIso()).concat({date:todayIso(),kg:+p.weight}).sort((a,b)=>a.date<b.date?-1:1);
  // Routine: neu aus den Antworten, eigene Punkte bleiben erhalten
  const own=(state.coach.routine||[]).filter(r=>!/^ob-|^u-s\d$/.test(r.id));
  state.coach.routine=buildRoutine().concat(own); state.routineSeeded=true; if(!state.rStart) state.rStart=todayIso();
  if(obDefaultPlans()&&obWantsFullBody()) state.routines=[fullBodyPlan()];
  if(first&&!state.ob.sups) state.stack=[];
  state.coach.skipped=OB_TOPICS.map(x=>x[0]).filter(t=>!quizDone(t));
  state.obDone=true; state.obRedo=false; state.obMinor=false;
  state.onboarded=true; state.step=null; state.date=todayIso(); state.tab="heute";
  save(); toast("Alles auf dich eingestellt");
}
