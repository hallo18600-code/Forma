// Health Maxxing – Übungs-Bibliothek: Liste, Suche, Detailseite mit Männchen, Muskeln und Fortschritts-Diagramm.
// Wird nach data.js und figur.js geladen und füllt EX.

const MUSKEL = {
  brust:"Brust", schultern:"Schultern", trizeps:"Trizeps", bizeps:"Bizeps", unterarme:"Unterarme",
  lat:"Latissimus", ruecken:"Oberer Rücken", nacken:"Nacken", unterer:"Unterer Rücken", bauch:"Bauch",
  quads:"Quadrizeps", beinbeuger:"Beinbeuger", gesaess:"Gesäß", waden:"Waden", adduktoren:"Adduktoren", abduktoren:"Abduktoren"
};
const EX_GROUPS = ["Brust","Rücken","Schultern","Arme","Beine","Gesäß","Core","Ganzkörper"];
// [id, Name, Gruppe, Gerät, Bewegungsmuster, Primär, Sekundär]
const EX_LIST = [
  ["bp","Bankdrücken","Brust","Langhantel","bench","brust","trizeps,schultern"],
  ["bp_db","Bankdrücken","Brust","Kurzhantel","bench","brust","trizeps,schultern"],
  ["bp_smith","Bankdrücken","Brust","Smith-Maschine","bench","brust","trizeps,schultern"],
  ["bp_inc","Schrägbankdrücken","Brust","Langhantel","incline","brust","schultern,trizeps"],
  ["bp_inc_db","Schrägbankdrücken","Brust","Kurzhantel","incline","brust","schultern,trizeps"],
  ["bp_inc_smith","Schrägbankdrücken","Brust","Smith-Maschine","incline","brust","schultern,trizeps"],
  ["bp_dec","Negativbankdrücken","Brust","Langhantel","decline","brust","trizeps,schultern"],
  ["bp_dec_db","Negativbankdrücken","Brust","Kurzhantel","decline","brust","trizeps,schultern"],
  ["chest_press","Brustpresse","Brust","Maschine","chest_press","brust","trizeps,schultern"],
  ["fly_db","Fliegende","Brust","Kurzhantel","fly_lying","brust","schultern"],
  ["fly_cable","Cable Crossover","Brust","Kabel","fly","brust","schultern"],
  ["pecdeck","Butterfly","Brust","Maschine","fly_seat","brust","schultern"],
  ["pushup","Liegestütz","Brust","Körpergewicht","pushup","brust","trizeps,schultern,bauch"],
  ["dip","Dips","Brust","Körpergewicht","dip","brust,trizeps","schultern"],
  ["dip_assist","Dips unterstützt","Brust","Maschine","dip","brust,trizeps","schultern"],
  ["pullover","Überzüge","Brust","Kurzhantel","pullover","brust,lat","trizeps"],

  ["row","Rudern vorgebeugt","Rücken","Langhantel","row_bent","lat,ruecken","bizeps,unterer"],
  ["row_db","Einarmiges Rudern","Rücken","Kurzhantel","row_bent","lat,ruecken","bizeps"],
  ["row_tbar","T-Bar-Rudern","Rücken","Langhantel","row_bent","ruecken,lat","bizeps,unterer"],
  ["row_cable","Rudern sitzend","Rücken","Kabel","row_seat","lat,ruecken","bizeps"],
  ["row_machine","Rudern","Rücken","Maschine","row_seat","ruecken,lat","bizeps"],
  ["lat","Latzug","Rücken","Kabel","pulldown","lat","bizeps,ruecken"],
  ["lat_close","Latzug eng","Rücken","Kabel","pulldown","lat","bizeps,ruecken"],
  ["lat_machine","Latzug","Rücken","Maschine","pulldown","lat","bizeps,ruecken"],
  ["pull","Klimmzug","Rücken","Körpergewicht","pullup","lat","bizeps,ruecken,unterarme"],
  ["chin","Chin-up","Rücken","Körpergewicht","pullup","lat,bizeps","ruecken,unterarme"],
  ["pull_assist","Klimmzug unterstützt","Rücken","Maschine","pullup","lat","bizeps,ruecken"],
  ["straight_pd","Lat-Überzug am Kabel","Rücken","Kabel","straight_pd","lat","trizeps,bauch"],
  ["dl","Kreuzheben","Rücken","Langhantel","deadlift","unterer,gesaess,beinbeuger","quads,nacken,unterarme"],
  ["dl_db","Kreuzheben","Rücken","Kurzhantel","deadlift","unterer,gesaess,beinbeuger","quads,unterarme"],
  ["back_ext","Rückenstrecker","Rücken","Körpergewicht","back_ext","unterer","gesaess,beinbeuger"],
  ["back_ext_machine","Rückenstrecker","Rücken","Maschine","back_ext","unterer","gesaess,beinbeuger"],
  ["good_morning","Good Morning","Rücken","Langhantel","good_morning","beinbeuger,unterer","gesaess"],
  ["shrug","Shrugs","Rücken","Langhantel","shrug","nacken","unterarme"],
  ["shrug_db","Shrugs","Rücken","Kurzhantel","shrug","nacken","unterarme"],

  ["ohp","Schulterdrücken","Schultern","Langhantel","ohp","schultern","trizeps,bauch"],
  ["ohp_db","Schulterdrücken sitzend","Schultern","Kurzhantel","ohp_seat","schultern","trizeps"],
  ["ohp_smith","Schulterdrücken sitzend","Schultern","Smith-Maschine","ohp_seat","schultern","trizeps"],
  ["ohp_machine","Schulterpresse","Schultern","Maschine","ohp_seat","schultern","trizeps"],
  ["arnold","Arnold Press","Schultern","Kurzhantel","ohp_seat","schultern","trizeps"],
  ["latraise","Seitheben","Schultern","Kurzhantel","lat_raise","schultern","nacken"],
  ["latraise_cable","Seitheben","Schultern","Kabel","lat_raise","schultern","nacken"],
  ["latraise_machine","Seitheben","Schultern","Maschine","lat_raise","schultern","nacken"],
  ["front_raise","Frontheben","Schultern","Kurzhantel","front_raise","schultern","brust"],
  ["front_raise_cable","Frontheben","Schultern","Kabel","front_raise","schultern","brust"],
  ["rear_fly","Reverse Flys","Schultern","Kurzhantel","rear_fly","schultern,ruecken","nacken"],
  ["rear_fly_machine","Reverse Butterfly","Schultern","Maschine","rev_fly_seat","schultern,ruecken","nacken"],
  ["face","Face Pull","Schultern","Kabel","face_pull","schultern,ruecken","nacken"],
  ["upright","Aufrechtes Rudern","Schultern","Langhantel","upright","schultern,nacken","bizeps"],

  ["curl","Bizepscurl","Arme","Langhantel","curl","bizeps","unterarme"],
  ["curl_db","Bizepscurl","Arme","Kurzhantel","curl","bizeps","unterarme"],
  ["curl_ez","Bizepscurl","Arme","SZ-Stange","curl","bizeps","unterarme"],
  ["curl_cable","Bizepscurl","Arme","Kabel","curl_cable","bizeps","unterarme"],
  ["hammer","Hammer Curl","Arme","Kurzhantel","curl","bizeps","unterarme"],
  ["hammer_cable","Hammer Curl mit Seil","Arme","Kabel","curl_cable","bizeps","unterarme"],
  ["preacher","Scott-Curl","Arme","SZ-Stange","preacher","bizeps","unterarme"],
  ["preacher_db","Scott-Curl","Arme","Kurzhantel","preacher","bizeps","unterarme"],
  ["preacher_machine","Bizepsmaschine","Arme","Maschine","preacher","bizeps","unterarme"],
  ["conc","Konzentrationscurl","Arme","Kurzhantel","preacher","bizeps","unterarme"],
  ["reverse_curl","Reverse Curl","Arme","SZ-Stange","curl","unterarme,bizeps",""],
  ["tri","Trizepsdrücken","Arme","Kabel","pushdown","trizeps",""],
  ["tri_rope","Trizepsdrücken mit Seil","Arme","Kabel","pushdown","trizeps",""],
  ["tri_oh","Trizepsdrücken über Kopf","Arme","Kurzhantel","tri_oh","trizeps",""],
  ["tri_oh_cable","Trizepsdrücken über Kopf","Arme","Kabel","tri_oh","trizeps",""],
  ["skull","Skullcrusher","Arme","SZ-Stange","skull","trizeps",""],
  ["skull_db","Skullcrusher","Arme","Kurzhantel","skull","trizeps",""],
  ["kickback","Trizeps-Kickback","Arme","Kurzhantel","kickback","trizeps",""],
  ["bench_dip","Bankdips","Arme","Körpergewicht","bench_dip","trizeps","brust,schultern"],
  ["bp_close","Enges Bankdrücken","Arme","Langhantel","bench","trizeps","brust,schultern"],
  ["dip_machine","Dip-Maschine","Arme","Maschine","dip","trizeps","brust,schultern"],

  ["sq","Kniebeuge","Beine","Langhantel","squat","quads,gesaess","beinbeuger,unterer,adduktoren"],
  ["sq_smith","Kniebeuge","Beine","Smith-Maschine","squat","quads,gesaess","beinbeuger,adduktoren"],
  ["sq_front","Frontkniebeuge","Beine","Langhantel","squat_front","quads","gesaess,bauch"],
  ["sq_goblet","Goblet Squat","Beine","Kurzhantel","squat_goblet","quads,gesaess","bauch,adduktoren"],
  ["sq_goblet_kb","Goblet Squat","Beine","Kettlebell","squat_goblet","quads,gesaess","bauch,adduktoren"],
  ["sq_bw","Kniebeuge","Beine","Körpergewicht","squat_bw","quads,gesaess","beinbeuger"],
  ["sq_hack","Hackenschmidt","Beine","Maschine","squat","quads","gesaess"],
  ["legpress","Beinpresse","Beine","Maschine","legpress","quads,gesaess","beinbeuger"],
  ["lunge","Ausfallschritt","Beine","Kurzhantel","lunge","quads,gesaess","beinbeuger,adduktoren"],
  ["lunge_bb","Ausfallschritt","Beine","Langhantel","lunge_bb","quads,gesaess","beinbeuger,adduktoren"],
  ["lunge_bw","Ausfallschritt","Beine","Körpergewicht","lunge","quads,gesaess","beinbeuger"],
  ["walk_lunge","Ausfallschritt gehend","Beine","Kurzhantel","lunge","quads,gesaess","beinbeuger,adduktoren"],
  ["bulgarian","Bulgarische Kniebeuge","Beine","Kurzhantel","split_squat","quads,gesaess","beinbeuger,adduktoren"],
  ["stepup","Step-up","Beine","Kurzhantel","stepup","quads,gesaess","beinbeuger"],
  ["leg_ext","Beinstrecker","Beine","Maschine","leg_ext","quads",""],
  ["leg_curl","Beinbeuger liegend","Beine","Maschine","leg_curl_lying","beinbeuger","waden"],
  ["leg_curl_seat","Beinbeuger sitzend","Beine","Maschine","leg_curl_seat","beinbeuger","waden"],
  ["rdl","Rumänisches Kreuzheben","Beine","Langhantel","rdl","beinbeuger,gesaess","unterer"],
  ["rdl_db","Rumänisches Kreuzheben","Beine","Kurzhantel","rdl","beinbeuger,gesaess","unterer"],
  ["dl_sumo","Sumo-Kreuzheben","Beine","Langhantel","deadlift","gesaess,quads","adduktoren,unterer,beinbeuger"],
  ["calf","Wadenheben stehend","Beine","Maschine","calf","waden",""],
  ["calf_db","Wadenheben","Beine","Kurzhantel","calf","waden",""],
  ["calf_bw","Wadenheben","Beine","Körpergewicht","calf","waden",""],
  ["calf_seat","Wadenheben sitzend","Beine","Maschine","calf_seat","waden",""],
  ["adductor","Adduktoren","Beine","Maschine","adduct","adduktoren",""],

  ["hip","Hip Thrust","Gesäß","Langhantel","hip_thrust","gesaess","beinbeuger,quads"],
  ["hip_smith","Hip Thrust","Gesäß","Smith-Maschine","hip_thrust","gesaess","beinbeuger,quads"],
  ["hip_machine","Hip Thrust","Gesäß","Maschine","hip_thrust","gesaess","beinbeuger"],
  ["bridge","Glute Bridge","Gesäß","Körpergewicht","bridge","gesaess","beinbeuger"],
  ["bridge_bb","Glute Bridge","Gesäß","Langhantel","bridge","gesaess","beinbeuger"],
  ["glute_kick","Glute Kickback","Gesäß","Kabel","glute_kick","gesaess","beinbeuger"],
  ["glute_kick_machine","Glute Kickback","Gesäß","Maschine","glute_kick","gesaess","beinbeuger"],
  ["abductor","Abduktoren","Gesäß","Maschine","abduct","abduktoren,gesaess",""],
  ["kb_swing","Kettlebell Swing","Gesäß","Kettlebell","swing","gesaess,beinbeuger","unterer,schultern,bauch"],

  ["crunch","Crunch","Core","Körpergewicht","crunch","bauch",""],
  ["situp","Sit-up","Core","Körpergewicht","situp","bauch",""],
  ["plank","Plank","Core","Körpergewicht","plank","bauch","schultern,unterer"],
  ["leg_raise","Beinheben liegend","Core","Körpergewicht","leg_raise","bauch",""],
  ["hang_raise","Beinheben hängend","Core","Körpergewicht","hang_raise","bauch","unterarme"],
  ["cable_crunch","Kabel-Crunch","Core","Kabel","cable_crunch","bauch",""],
  ["ab_wheel","Ab Roller","Core","Körpergewicht","ab_wheel","bauch","lat,schultern"],
  ["mountain","Mountain Climber","Core","Körpergewicht","mountain","bauch","schultern,quads"],

  ["jacks","Hampelmann","Ganzkörper","Körpergewicht","jacks","waden,schultern","quads,gesaess"]
];
// Anzeigename: Gerät in Klammern, wenn es denselben Namen mehrfach gibt oder ein Gerät gebraucht wird
(function(){
  const count={};
  EX_LIST.forEach(r=>count[r[1]]=(count[r[1]]||0)+1);
  Object.keys(EX).forEach(k=>delete EX[k]);
  EX_LIST.forEach(([id,name,group,eq,pattern,prim,sec])=>{
    const full = (eq==="Körpergewicht" && count[name]===1) ? name : name+" ("+eq+")";
    EX[id]={ id, name:full, base:name, group, eq, pattern, primary:prim?prim.split(","):[], secondary:sec?sec.split(","):[] };
  });
})();

function exInfoOf(id){
  if(EX[id]) return EX[id];
  const c=(state.customEx||[]).find(x=>x.id===id);
  return c ? { id:c.id, name:c.name, group:"Eigene", eq:"", pattern:null, primary:[], secondary:[] } : null;
}
const exThumbCache={};
function exThumb(id){
  if(!exThumbCache[id]) exThumbCache[id]=FIG.svg(exInfoOf(id)||{});
  return `<span class="ex-thumb">${exThumbCache[id]}</span>`;
}
const musLabel=list=>(list||[]).map(m=>MUSKEL[m]||m).join(", ");

// ---------- Daten für Diagramm und Rekorde ----------
function exSessions(id){
  const out=[];
  state.workouts.forEach(w=>(w.exercises||[]).forEach(e=>{
    if(e.id!==id) return;
    const sets=(e.sets||[]).filter(s=>s.done);
    if(!sets.length) return;
    let kg=0, reps=0, vol=0, orm=0, best=sets[0];
    sets.forEach(s=>{
      const k=+s.kg||0, r=+s.reps||0;
      kg=Math.max(kg,k); reps=Math.max(reps,r); vol+=k*r;
      orm=Math.max(orm, r<=1?k:k*(1+r/30));
      if(k>best.kg||(k===+best.kg&&r>best.reps)) best=s;
    });
    out.push({ date:w.date, kg, reps, vol:Math.round(vol), orm:Math.round(orm*2)/2, best, sets });
  }));
  return out.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
}
const kgTxt=v=>de(v, v%1?1:0);
function dShort(s){ return parseIso(s).toLocaleDateString(LOC,{day:"numeric", month:"short"}); }

// ---------- Liste (Dashboard, Auswahl im Training, Routine) ----------
function exAllIds(){
  return [...Object.keys(EX), ...(state.customEx||[]).map(c=>c.id)];
}
function exLibList(mode){
  const q=(ui.exQuery||"").trim().toLowerCase();
  const g=ui.exGroup||"Alle";
  const ids=exAllIds().filter(id=>{
    const x=exInfoOf(id); if(!x) return false;
    if(g!=="Alle" && x.group!==g) return false;
    if(!q) return true;
    return (x.name+" "+x.group+" "+musLabel(x.primary)+" "+musLabel(x.secondary)).toLowerCase().includes(q);
  });
  if(!ids.length) return `<div class="sub li">Keine Übung gefunden. Du kannst sie oben als eigene Übung anlegen.</div>`;
  const add=mode==="plan"?"plan-add-ex":"add-ex";
  const row=id=>{
    const x=exInfoOf(id), last=lastSet(id);
    const sub=[musLabel(x.primary)||x.group, last!=="–"?"Zuletzt "+last:""].filter(Boolean).join(" · ");
    if(mode==="dash") return `<button class="exrow" data-act="exi-open" data-id="${id}">${exThumb(id)}<span class="grow"><b>${esc(x.name)}</b><span class="sub">${esc(sub)}</span></span><span class="exrow-go">›</span></button>`;
    return `<div class="exrow"><button class="exrow-main" data-act="${add}" data-id="${id}">${exThumb(id)}<span class="grow"><b>${esc(x.name)}</b><span class="sub">${esc(sub)}</span></span></button><button class="exi-btn" data-act="exi-open" data-id="${id}" data-mode="${mode}" aria-label="Details zu ${esc(x.name)}">i</button></div>`;
  };
  // Ohne Suche: zuerst die zuletzt trainierten, dann nach Muskelgruppe
  if(!q && g==="Alle"){
    const recent=[...new Set([...state.workouts].reverse().flatMap(w=>(w.exercises||[]).filter(e=>(e.sets||[]).some(s=>s.done)).map(e=>e.id)))].filter(id=>exInfoOf(id)).slice(0,6);
    let html=recent.length?`<div class="exhead">Zuletzt trainiert</div>${recent.map(row).join("")}`:"";
    [...EX_GROUPS,"Eigene"].forEach(grp=>{
      const list=ids.filter(id=>exInfoOf(id).group===grp);
      if(list.length) html+=`<div class="exhead">${grp}</div>${list.map(row).join("")}`;
    });
    return html;
  }
  return ids.sort((a,b)=>exInfoOf(a).name.localeCompare(exInfoOf(b).name,"de")).map(row).join("");
}
function exFilterBar(mode){
  ui.exlMode=mode;
  const groups=["Alle",...EX_GROUPS, ...((state.customEx||[]).length?["Eigene"]:[])];
  return `<div class="exsearch"><input type="search" data-act="exl-query" value="${esc(ui.exQuery||"")}" placeholder="Übung oder Muskel suchen" autocomplete="off" aria-label="Übung suchen"></div>
    <div class="exchips">${groups.map(x=>`<button class="chip ${(ui.exGroup||"Alle")===x?"on":""}" data-act="exl-group" data-v="${x}">${x}</button>`).join("")}</div>`;
}

// ---------- Detailseite ----------
function exChart(id){
  const all=exSessions(id);
  if(!all.length) return `<div class="exc empty"><div class="exc-ghost">${[22,30,28,40,38,52].map(h=>`<i style="height:${h}%"></i>`).join("")}</div><b>Noch keine Daten</b><div class="sub">Hake Sätze im Training ab – dann siehst du hier, wie dein Gewicht steigt.</div></div>`;
  const hasKg=all.some(s=>s.kg>0);
  const metrics=hasKg?[["kg","Schwerstes Gewicht"],["orm","1RM geschätzt"],["vol","Volumen"]]:[["reps","Meiste Wdh."],["vol","Volumen"]];
  let m=ui.exiMetric; if(!metrics.some(x=>x[0]===m)) m=metrics[0][0];
  const range=ui.exiRange||"3m";
  const from=range==="3m"?addDays(todayIso(),-91):range==="1j"?addDays(todayIso(),-365):"0000";
  const data=all.filter(s=>s.date>=from);
  const unit=m==="reps"?"Wdh.":"kg";
  const ranges=[["3m","3 Monate"],["1j","1 Jahr"],["all","Alles"]];
  const head=(v,d)=>`<div class="exc-top"><div><b class="exc-val">${v}</b> <span class="exc-date">${d}</span></div></div>`;
  let body;
  if(!data.length){
    body=head("–","")+`<div class="sub t-c py-10">Kein Training in diesem Zeitraum.</div>`;
  } else {
    const W=330, H=176, pl=38, pr=12, pt=14, pb=24;
    const vals=data.map(s=>s[m]);
    const max=Math.max(...vals,1);
    const step=niceStep(max/2.2);
    const top=Math.ceil(max/step)*step;
    const t0=parseIso(data[0].date).getTime(), t1=Math.max(parseIso(data[data.length-1].date).getTime(), t0+1);
    const xs=data.map((s,i)=>data.length===1?pl+(W-pl-pr)/2:pl+(parseIso(s.date).getTime()-t0)/(t1-t0)*(W-pl-pr));
    // gleiche Tage leicht versetzen, damit Punkte nicht übereinander liegen
    for(let i=1;i<xs.length;i++) if(xs[i]-xs[i-1]<4) xs[i]=Math.min(W-pr, xs[i-1]+4);
    const ys=vals.map(v=>pt+(1-v/top)*(H-pt-pb));
    let sel=ui.exiPt; if(sel==null||sel>=data.length) sel=data.length-1;
    const ticks=[]; for(let v=0; v<=top+1e-9; v+=step) ticks.push(v);
    const xl=data.length===1?[0]:[0, Math.round((data.length-1)/2), data.length-1];
    const pts=xs.map((x,i)=>x.toFixed(1)+","+ys[i].toFixed(1)).join(" ");
    const area=`M${xs[0].toFixed(1)},${H-pb} L${pts.replace(/ /g," L")} L${xs[xs.length-1].toFixed(1)},${H-pb} Z`;
    body=head(`${kgTxt(vals[sel])} ${unit}`, dShort(data[sel].date))+
    `<svg class="exc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf ${unit}">
      <defs><linearGradient id="excg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${tc("accent")}" stop-opacity=".18"/><stop offset="1" stop-color="${tc("accent")}" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map(v=>{ const y=pt+(1-v/top)*(H-pt-pb); return `<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="${tc("line")}"/><text x="${pl-6}" y="${y+4}" text-anchor="end" class="exc-ax">${kgTxt(v)}</text>`; }).join("")}
      ${xl.map(i=>`<text x="${xs[i]}" y="${H-6}" text-anchor="${i===0&&data.length>1?"start":i===data.length-1&&data.length>1?"end":"middle"}" class="exc-ax">${dShort(data[i].date)}</text>`).join("")}
      ${data.length>1?`<path d="${area}" fill="url(#excg)"/><polyline points="${pts}" fill="none" stroke="${tc("accent")}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`:""}
      <line x1="${xs[sel]}" x2="${xs[sel]}" y1="${pt-4}" y2="${H-pb}" stroke="${tc("accent")}" stroke-opacity=".35" stroke-dasharray="3 3"/>
      ${xs.map((x,i)=>`<circle cx="${x}" cy="${ys[i]}" r="${i===sel?5.5:3.2}" fill="${i===sel?tc("surface"):tc("accent")}" stroke="${tc("accent")}" stroke-width="${i===sel?3:0}"/>`).join("")}
      ${xs.map((x,i)=>`<circle cx="${x}" cy="${ys[i]}" r="13" fill="transparent" data-act="exi-pt" data-i="${i}" class="hit"/>`).join("")}
    </svg>`;
  }
  return `<div class="exc">
    <div class="seg exc-range">${ranges.map(([k,l])=>`<button class="${range===k?"on":""}" data-act="exi-range" data-v="${k}">${l}</button>`).join("")}</div>
    ${body}
    <div class="exc-metrics">${metrics.map(([k,l])=>`<button class="chip ${m===k?"on":""}" data-act="exi-metric" data-v="${k}">${l}</button>`).join("")}</div>
  </div>`;
}
function niceStep(x){
  const p=Math.pow(10, Math.floor(Math.log10(Math.max(x,.1))));
  const n=x/p;
  return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p;
}
function exRecords(id){
  const all=exSessions(id); if(!all.length) return "";
  const hasKg=all.some(s=>s.kg>0);
  const bestKg=all.reduce((a,s)=>s.kg>a.kg?s:a, all[0]);
  const bestSet=all.flatMap(s=>s.sets).reduce((a,s)=>(+s.kg*+s.reps)>(+a.kg*+a.reps)?s:a);
  const orm=Math.max(...all.map(s=>s.orm));
  const vol=Math.max(...all.map(s=>s.vol));
  const reps=Math.max(...all.map(s=>s.reps));
  const tiles=hasKg?[
    ["Schwerstes Gewicht", kgTxt(bestKg.kg)+" kg", dShort(bestKg.date)],
    ["Bester Satz", kgTxt(+bestSet.kg)+" kg × "+bestSet.reps, "Gewicht × Wdh."],
    ["1RM geschätzt", kgTxt(orm)+" kg", "Formel, kein Test"],
    ["Bestes Volumen", de(vol)+" kg", "in einem Training"]
  ]:[
    ["Meiste Wdh.", reps+"", "in einem Satz"],
    ["Trainings", all.length+"", "mit dieser Übung"]
  ];
  return `<h2 class="exi-h">Rekorde</h2><div class="exrec">${tiles.map(([l,v,s])=>`<div><span>${l}</span><b>${v}</b><em>${s}</em></div>`).join("")}</div>`;
}
function renderExInfo(){
  if(!ui.exInfo) return "";
  const id=ui.exInfo.id, x=exInfoOf(id);
  if(!x){ ui.exInfo=null; return ""; }
  const mode=ui.exInfo.mode;
  const hist=exSessions(id).reverse().slice(0,6);
  const cues=CUES[x.pattern]||[];
  const reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  const playing=!figPaused&&!reduce;
  return `<div class="exi" role="dialog" aria-label="${esc(x.name)}">
    <div class="exi-scroll">
      <div class="exi-hero">
        <button class="exi-back" data-act="exi-close" aria-label="Zurück">‹</button>
        ${x.pattern?FIG.svg(x,{anim:playing, cls:"big"}):`<div class="exi-none">${FIG.svg(x,{cls:"big"})}</div>`}
        ${x.pattern?`<button class="exi-play" data-act="exi-play" aria-label="${playing?"Pause":"Abspielen"}">${playing?"❚❚":"▶"}</button>`:""}
      </div>
      <div class="exi-body">
        <h1>${esc(x.name)}</h1>
        <div class="exi-tags">${x.eq?`<span class="chip">${esc(x.eq)}</span>`:""}<span class="chip">${esc(x.group)}</span></div>
        ${x.primary.length||x.secondary.length?`<div class="exi-mus">
          ${x.primary.length?`<div><i class="mdot p"></i><span>Primär</span><b>${musLabel(x.primary)}</b></div>`:""}
          ${x.secondary.length?`<div><i class="mdot s"></i><span>Sekundär</span><b>${musLabel(x.secondary)}</b></div>`:""}
        </div>`:`<p class="sub">Eigene Übung – ohne Männchen und Muskel-Angaben.</p>`}
        <h2 class="exi-h">Fortschritt</h2>
        ${exChart(id)}
        ${exRecords(id)}
        ${cues.length?`<h2 class="exi-h">So geht's</h2><ol class="excue">${cues.map(c=>`<li>${c}</li>`).join("")}</ol>`:""}
        ${hist.length?`<h2 class="exi-h">Verlauf</h2><div class="exhist">${hist.map(s=>`<div><b>${labelDate(s.date)}</b><span>${s.sets.map(t=>kgTxt(+t.kg)+" × "+t.reps).join(" · ")}</span></div>`).join("")}</div>`:""}
      </div>
    </div>
    ${mode?`<div class="exi-foot"><button class="pill primary" data-act="${mode==="plan"?"plan-add-ex":"add-ex"}" data-id="${id}">Zum ${mode==="plan"?"Trainingstag":"Training"} hinzufügen</button></div>`:""}
  </div>`;
}

// Nach dem Zeichnen: gewählten Filter-Chip sichtbar halten
function exAfterRender(){
  document.querySelectorAll(".exchips").forEach(bar=>{
    const on=bar.querySelector(".on"); if(!on) return;
    bar.scrollLeft=Math.max(0, on.offsetLeft-bar.clientWidth/2+on.offsetWidth/2);
  });
}

// ---------- Ereignisse (laufen vor dem Haupt-Handler in app.js, der danach neu zeichnet) ----------
document.getElementById("app").addEventListener("click", e=>{
  const el=e.target.closest("[data-act]"); if(!el) return;
  const act=el.dataset.act;
  if(act==="exi-open"){ ui.exInfo={ id:el.dataset.id, mode:el.dataset.mode||null }; ui.exiPt=null; ui.exiMetric=null; }
  else if(act==="exi-close"){ ui.exInfo=null; }
  else if(act==="exi-play"){ figPaused=!figPaused; }
  else if(act==="exi-range"){ ui.exiRange=el.dataset.v; ui.exiPt=null; }
  else if(act==="exi-metric"){ ui.exiMetric=el.dataset.v; }
  else if(act==="exi-pt"){ ui.exiPt=+el.dataset.i; }
  else if(act==="exl-group"){ ui.exGroup=el.dataset.v; }
  else if((act==="add-ex"||act==="plan-add-ex") && ui.exInfo){ ui.exInfo=null; }
  else if(act==="dash" && el.dataset.id==="exercises"){ ui.exQuery=""; ui.exGroup="Alle"; }
  else if(act==="open-day-ex" || (act==="open" && el.dataset.type==="ex")){ ui.exQuery=""; ui.exGroup="Alle"; }
});
document.getElementById("app").addEventListener("input", e=>{
  const el=e.target.closest('[data-act="exl-query"]'); if(!el) return;
  ui.exQuery=el.value;
  const box=document.getElementById("exl-list"); if(box) box.innerHTML=exLibList(ui.exlMode);
});
