// Life Maxxing – Trainingsverlauf aus anderen Gym-Apps übernehmen (Hevy, Strong).
// Die Datei wird nur im Browser gelesen, nichts geht ins Internet.
// Bekannte Übungen werden auf eigene Übungen gelegt, unbekannte als "Eigene Übung" angelegt.

const GYM_APPS = {
  hevy:   { name:"Hevy",   emo:"🏋️", path:["Hevy öffnen","Profil → ⚙️ Einstellungen","„Daten exportieren“ → Workouts"] },
  strong: { name:"Strong", emo:"💪", path:["Strong öffnen","Profil → ⚙️ Einstellungen","„Strong-Daten exportieren“"] },
  fitbod: { name:"Fitbod", emo:"🤖", path:["Fitbod öffnen","Profil → ⚙️ Einstellungen","„Workout-Daten exportieren“"] },
  fitnotes:{ name:"FitNotes", emo:"📒", path:["FitNotes öffnen","⚙️ Einstellungen → Tabellen-Export","„Workouts exportieren“"] },
  other:  { name:"Andere App", emo:"📱", path:["Deine App öffnen","Einstellungen → „Export“ oder „CSV“","Datei speichern"] }
};

// Englische Namen (Hevy/Strong) → passende Übungen hier. Bei mehreren entscheidet das Gerät in Klammern.
const GYM_ALIAS = {
  "bench press":["bp","bp_db","bp_smith"], "incline bench press":["bp_inc","bp_inc_db","bp_inc_smith"],
  "decline bench press":["bp_dec","bp_dec_db"], "close grip bench press":["bp_close"], "bench press close grip":["bp_close"],
  "chest press":["chest_press"], "incline chest press":["chest_press"], "chest fly":["fly_db","fly_cable","pecdeck"],
  "dumbbell fly":["fly_db"], "cable crossover":["fly_cable"], "cable fly":["fly_cable"], "pec deck":["pecdeck"], "butterfly":["pecdeck"],
  "push up":["pushup"], "chest dip":["dip","dip_assist"], "triceps dip":["dip","dip_machine"], "dip":["dip","dip_assist"],
  "bench dip":["bench_dip"], "pullover":["pullover"],
  "bent over row":["row","row_db"], "dumbbell row":["row_db"], "t bar row":["row_tbar"], "seated cable row":["row_cable"],
  "seated row":["row_cable","row_machine"], "iso lateral row":["row_machine"], "machine row":["row_machine"],
  "lat pulldown":["lat","lat_machine"], "close grip lat pulldown":["lat_close"], "lat pulldown close grip":["lat_close"],
  "straight arm":["straight_pd"], "pull up":["pull","pull_assist"], "chin up":["chin"],
  "deadlift":["dl","dl_db"], "romanian deadlift":["rdl","rdl_db"], "sumo deadlift":["dl_sumo"],
  "back extension":["back_ext","back_ext_machine"], "hyperextension":["back_ext","back_ext_machine"], "good morning":["good_morning"], "shrug":["shrug","shrug_db"],
  "overhead press":["ohp","ohp_db","ohp_smith","ohp_machine"], "shoulder press":["ohp_db","ohp_machine","ohp_smith","ohp"], "military press":["ohp"],
  "arnold press":["arnold"], "lateral raise":["latraise","latraise_cable","latraise_machine"], "front raise":["front_raise","front_raise_cable"],
  "reverse fly":["rear_fly","rear_fly_machine"], "rear delt fly":["rear_fly","rear_fly_machine"], "face pull":["face"], "upright row":["upright"],
  "bicep curl":["curl","curl_db","curl_ez","curl_cable"], "biceps curl":["curl","curl_db","curl_ez","curl_cable"], "barbell curl":["curl"], "ez bar curl":["curl_ez"],
  "hammer curl":["hammer","hammer_cable"], "preacher curl":["preacher","preacher_db","preacher_machine"], "concentration curl":["conc"], "reverse curl":["reverse_curl"],
  "triceps pushdown":["tri"], "tricep pushdown":["tri"], "triceps rope pushdown":["tri_rope"], "rope pushdown":["tri_rope"],
  "overhead triceps extension":["tri_oh","tri_oh_cable"], "triceps extension":["tri_oh","tri_oh_cable"], "skullcrusher":["skull","skull_db"], "skull crusher":["skull","skull_db"],
  "lying triceps extension":["skull","skull_db"], "triceps kickback":["kickback"], "tricep kickback":["kickback"],
  "squat":["sq","sq_smith","sq_bw"], "front squat":["sq_front"], "goblet squat":["sq_goblet","sq_goblet_kb"], "hack squat":["sq_hack"], "leg press":["legpress"],
  "lunge":["lunge","lunge_bb","lunge_bw"], "walking lunge":["walk_lunge"], "bulgarian split squat":["bulgarian"], "step up":["stepup"],
  "leg extension":["leg_ext"], "lying leg curl":["leg_curl"], "seated leg curl":["leg_curl_seat"], "leg curl":["leg_curl","leg_curl_seat"],
  "calf raise":["calf","calf_db","calf_bw"], "seated calf raise":["calf_seat"], "hip adduction":["adductor"], "hip abduction":["abductor"],
  "hip thrust":["hip","hip_smith","hip_machine"], "glute bridge":["bridge","bridge_bb"], "glute kickback":["glute_kick","glute_kick_machine"], "kettlebell swing":["kb_swing"],
  "crunch":["crunch","cable_crunch"], "cable crunch":["cable_crunch"], "sit up":["situp"], "plank":["plank"], "leg raise":["leg_raise"], "lying leg raise":["leg_raise"],
  "hanging leg raise":["hang_raise"], "ab wheel":["ab_wheel"], "mountain climber":["mountain"], "jumping jack":["jacks"]
};
// Deutsche Namen (z. B. Hevy auf Deutsch) – gleiche Logik
Object.assign(GYM_ALIAS, {
  "bankdrücken":["bp","bp_db","bp_smith"], "schrägbankdrücken":["bp_inc","bp_inc_db","bp_inc_smith"], "schrägbank":["bp_inc","bp_inc_db","bp_inc_smith"],
  "negativbankdrücken":["bp_dec","bp_dec_db"], "enges bankdrücken":["bp_close"], "bankdrücken eng":["bp_close"], "brustpresse":["chest_press"],
  "fliegende":["fly_db","fly_cable"], "kabel fliegende":["fly_cable"], "kabelzug fliegende":["fly_cable"], "butterfly":["pecdeck"], "reverse butterfly":["rear_fly_machine","rear_fly"],
  "liegestütz":["pushup"], "dips":["dip","dip_assist"], "trizeps dips":["dip","dip_machine"], "bankdips":["bench_dip"], "bank dips":["bench_dip"], "überzug":["pullover"], "überzüge":["pullover"],
  "rudern vorgebeugt":["row","row_db"], "vorgebeugtes rudern":["row","row_db"], "einarmiges rudern":["row_db"], "kurzhantelrudern":["row_db"], "t bar rudern":["row_tbar"],
  "rudern sitzend":["row_cable","row_machine"], "sitzendes rudern":["row_cable","row_machine"], "kabelrudern":["row_cable"], "rudern":["row_machine","row_cable","row","row_db"],
  "latzug":["lat","lat_machine"], "latziehen":["lat","lat_machine"], "latzug eng":["lat_close"], "enger latzug":["lat_close"], "lat überzug":["straight_pd"],
  "klimmzug":["pull","pull_assist"], "klimmzüge":["pull","pull_assist"], "klimmzug untergriff":["chin"], "kreuzheben":["dl","dl_db"], "rumänisches kreuzheben":["rdl","rdl_db"],
  "sumo kreuzheben":["dl_sumo"], "rückenstrecker":["back_ext","back_ext_machine"], "rückenstreckung":["back_ext","back_ext_machine"], "schulterheben":["shrug","shrug_db"],
  "schulterdrücken":["ohp_db","ohp","ohp_smith","ohp_machine"], "schulterpresse":["ohp_machine"], "überkopfdrücken":["ohp","ohp_db"], "militärpresse":["ohp"],
  "seitheben":["latraise","latraise_cable","latraise_machine"], "seitliches heben":["latraise","latraise_cable","latraise_machine"], "frontheben":["front_raise","front_raise_cable"],
  "vorgebeugtes seitheben":["rear_fly","rear_fly_machine"], "aufrechtes rudern":["upright"],
  "bizeps curl":["curl","curl_db","curl_ez","curl_cable"], "bizepscurl":["curl","curl_db","curl_ez","curl_cable"], "langhantelcurl":["curl"], "kurzhantelcurl":["curl_db"],
  "hammercurl":["hammer","hammer_cable"], "scott curl":["preacher","preacher_db","preacher_machine"], "scottcurl":["preacher","preacher_db","preacher_machine"],
  "bizepsmaschine":["preacher_machine"], "konzentrationscurl":["conc"],
  "trizeps pushdown":["tri","tri_rope"], "trizepsdrücken":["tri","tri_rope"], "trizeps drücken":["tri","tri_rope"], "pushdown":["tri","tri_rope"],
  "trizeps über kopf":["tri_oh","tri_oh_cable"], "überkopf trizepsdrücken":["tri_oh","tri_oh_cable"], "überkopf trizepsstrecken":["tri_oh","tri_oh_cable"], "überkopf trizeps":["tri_oh","tri_oh_cable"], "trizepsstrecken über kopf":["tri_oh","tri_oh_cable"], "trizepsdrücken über kopf":["tri_oh","tri_oh_cable"],
  "trizepsstrecken":["tri_oh","tri_oh_cable","skull"], "french press":["skull","skull_db"], "stirndrücken":["skull","skull_db"], "kickback":["kickback"], "dip maschine":["dip_machine"],
  "kniebeuge":["sq","sq_smith","sq_bw"], "frontkniebeuge":["sq_front"], "goblet":["sq_goblet","sq_goblet_kb"], "hackenschmidt":["sq_hack"], "hack kniebeuge":["sq_hack"],
  "beinpresse":["legpress"], "ausfallschritt":["lunge","lunge_bb","lunge_bw"], "ausfallschritte gehend":["walk_lunge"], "gehende ausfallschritte":["walk_lunge"],
  "bulgarische kniebeuge":["bulgarian"], "aufsteiger":["stepup"], "beinstrecker":["leg_ext"], "beinstreckung":["leg_ext"],
  "beinbeuger liegend":["leg_curl"], "beinbeuger sitzend":["leg_curl_seat"], "beinbeuger":["leg_curl","leg_curl_seat"], "beincurl":["leg_curl","leg_curl_seat"],
  "wadenheben":["calf","calf_db","calf_bw"], "wadenheben sitzend":["calf_seat"], "adduktoren":["adductor"], "adduktion":["adductor"], "abduktoren":["abductor"], "abduktion":["abductor"],
  "hüftstoß":["hip","hip_smith","hip_machine"], "beckenheben":["bridge","bridge_bb"], "gesäß kickback":["glute_kick","glute_kick_machine"],
  "bauchpresse":["crunch","cable_crunch"], "kabel crunch":["cable_crunch"], "kabelcrunch":["cable_crunch"], "unterarmstütz":["plank"],
  "beinheben liegend":["leg_raise"], "beinheben hängend":["hang_raise"], "hängendes beinheben":["hang_raise"], "beinheben":["leg_raise","hang_raise"],
  "bauchroller":["ab_wheel"], "ab roller":["ab_wheel"], "bergsteiger":["mountain"], "hampelmann":["jacks"]
});
const GYM_EQ = { barbell:"Langhantel", dumbbell:"Kurzhantel", cable:"Kabel", machine:"Maschine", "smith machine":"Smith-Maschine",
  "ez bar":"SZ-Stange", kettlebell:"Kettlebell", bodyweight:"Körpergewicht", weighted:"Körpergewicht", assisted:"Maschine", "plate loaded":"Maschine", band:"Kabel",
  langhantel:"Langhantel", kurzhantel:"Kurzhantel", kurzhanteln:"Kurzhantel", kabelzug:"Kabel", kabel:"Kabel", seilzug:"Kabel", maschine:"Maschine", gerät:"Maschine",
  "smith maschine":"Smith-Maschine", multipresse:"Smith-Maschine", "sz stange":"SZ-Stange", "ez stange":"SZ-Stange", körpergewicht:"Körpergewicht", unterstützt:"Maschine",
  widerstandsband:"Kabel", "mit gewicht":"Körpergewicht" };
const GYM_EQK = Object.keys(GYM_EQ).sort((a,b)=>b.length-a.length);
const GYM_KEYS = Object.keys(GYM_ALIAS).sort((a,b)=>b.length-a.length);   // längste zuerst: "incline bench press" vor "bench press"
const gymNorm = s => String(s||"").toLowerCase().replace(/[‐-―-]/g," ").replace(/[^a-zäöüß0-9 ]/g," ").replace(/\s+/g," ").trim();
const gymWord = k => new RegExp("(^| )"+k.replace(/ /g," ?")+"(s|es|e|n|en|er)?( |$)");
const GYM_STOP = /\b(mit|am|an|der|die|das|und|im|auf|the|with|on|a|an|of|machine|variante|version)\b/g;
// Name ohne Gerät und Füllwörter, zusammengeschrieben ("Trizeps-Pushdown mit Seil" → "trizepspushdownseil")
function gymCore(n){ let t=" "+gymNorm(n)+" "; GYM_EQK.forEach(k=>{ t=t.replace(new RegExp(" "+k+"(?= )","g")," "); }); return t.replace(GYM_STOP," ").replace(/[^a-zäöüß0-9]/g,""); }
function gymTri(s){ const o=new Set(), t="  "+s+" "; for(let i=0;i<t.length-2;i++) o.add(t.slice(i,i+3)); return o; }
function gymSim(a,b){ if(!a||!b) return 0; if(a===b) return 1; const A=gymTri(a), B=gymTri(b); let n=0; A.forEach(x=>{ if(B.has(x)) n++; }); return 2*n/(A.size+B.size); }
// Aus mehreren Varianten die mit passendem Gerät, Seil oder Unterstützung
function gymPick(ids, full, eq){
  ids=ids.filter(id=>EX[id]); if(!ids.length) return null;
  const byEq=eq?ids.filter(id=>EX[id].eq===eq):[]; if(byEq.length) ids=byEq;   // Gerät zuerst
  if(/überkopf|über kopf|overhead/.test(full)){ const o=ids.filter(id=>/über Kopf/.test(EX[id].name)); if(o.length) ids=o; }
  const rope=/(^| )(seil|rope)( |$)/.test(full);
  if(rope){ const r=ids.find(id=>/seil/i.test(EX[id].name)); if(r) return r; }
  else { const nr=ids.filter(id=>!/seil/i.test(EX[id].name)); if(nr.length) ids=nr; }
  if(/assist|unterstützt/.test(full)){ const a=ids.find(id=>/assist/.test(id)); if(a) return a; }
  return (eq && ids.find(id=>EX[id].eq===eq)) || ids[0];
}
function gymEqOf(full){ const k=GYM_EQK.find(k=>gymWord(k).test(full)); return k?GYM_EQ[k]:null; }

// Übungsname → id hier, oder null (dann wird es eine eigene Übung)
function gymMatch(title){
  const full=gymNorm(title), eq=gymEqOf(full);
  const m=String(title).match(/^(.*?)\s*\(([^)]*)\)\s*$/), base=gymNorm(m?m[1]:title);
  // 1. Genau ein Name aus dieser App
  const own=Object.values(EX).find(x=>gymNorm(x.name)===full); if(own) return own.id;
  const same=Object.values(EX).filter(x=>gymNorm(x.base)===base).map(x=>x.id);
  if(same.length&&(!eq||same.some(id=>EX[id].eq===eq))) return gymPick(same, full, eq);
  // 2. Bekannte Namen (Englisch/Deutsch), längster Treffer zuerst
  for(const key of GYM_KEYS) if(gymWord(key).test(full)) return gymPick(GYM_ALIAS[key], full, eq);
  // 3. Ähnlichster Name (Tippfehler, andere Schreibweise)
  const best=gymSuggest(title,1)[0];
  return best&&best.score>=0.62 ? best.id : null;
}
// Ähnlichste Übungen mit Punktzahl 0–1 (für Zuordnen von Hand)
function gymSuggest(title, n){
  const full=gymNorm(title), eq=gymEqOf(full), core=gymCore(title), out={};
  const add=(ids,sc)=>{ const id=gymPick(ids, full, eq); if(id&&(!out[id]||out[id]<sc)) out[id]=sc; };
  Object.values(EX).forEach(x=>add([x.id], gymSim(core, gymCore(x.base))+(eq&&x.eq===eq?0.05:0)));
  GYM_KEYS.forEach(k=>add(GYM_ALIAS[k], gymSim(core, gymCore(k))));
  return Object.keys(out).map(id=>({id, score:out[id]})).sort((a,b)=>b.score-a.score).slice(0,n||3);
}
// Eigene Übung durch eine bekannte ersetzen (in allen Trainings und Plänen)
function gymMerge(from, to){
  if(!EX[to]) return;
  const fix=list=>(list||[]).forEach(e=>{ if(e&&e.id===from) e.id=to; });
  state.workouts.forEach(w=>fix(w.exercises));
  (state.routines||[]).forEach(r=>(r.days||[]).forEach(d=>fix(d.exercises)));
  if(typeof ui!=="undefined"&&ui.workout) fix(ui.workout.exercises);
  state.customEx=(state.customEx||[]).filter(c=>c.id!==from);
}
// Beim Start: eigene Übungen aus einem früheren Import nachträglich erkennen
function gymRemap(){
  let n=0;
  (state.customEx||[]).slice().forEach(c=>{
    const used=state.workouts.filter(w=>(w.exercises||[]).some(e=>e.id===c.id));
    const fromImport=c.imp || (used.length && used.every(w=>w.imp));
    if(!fromImport) return;
    const id=gymMatch(c.name); if(id){ gymMerge(c.id,id); n++; }
  });
  return n;
}

// CSV lesen (Komma oder Semikolon, Anführungszeichen)
function gymCsv(text){
  text = String(text||"").replace(/^﻿/,"");
  const first = text.split(/\r?\n/)[0]||"", sep = (first.split(";").length>first.split(",").length) ? ";" : ",";
  const rows=[]; let row=[], cell="", q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){ if(ch==='"'){ if(text[i+1]==='"'){ cell+='"'; i++; } else q=false; } else cell+=ch; continue; }
    if(ch==='"') q=true;
    else if(ch===sep){ row.push(cell); cell=""; }
    else if(ch==="\n"||ch==="\r"){ if(ch==="\r"&&text[i+1]==="\n") i++; row.push(cell); rows.push(row); row=[]; cell=""; }
    else cell+=ch;
  }
  if(cell||row.length){ row.push(cell); rows.push(row); }
  const head=(rows.shift()||[]).map(h=>h.trim().toLowerCase());
  return rows.filter(r=>r.some(c=>c.trim())).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||"").trim()])));
}

// Datum lesen: "26 Mar 2024, 18:05", "2024-03-26 18:05:00" oder ähnlich → {date:"2024-03-26", t:Millisekunden}
const GYM_MON={jan:1,feb:2,mar:3,mär:3,apr:4,may:5,mai:5,jun:6,jul:7,aug:8,sep:9,oct:10,okt:10,nov:11,dec:12,dez:12};
function gymDate(s){
  s=String(s||"").trim(); let y,mo,d,h=0,mi=0, m;
  if((m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/))) [y,mo,d,h,mi]=[m[1],m[2],m[3],m[4]||0,m[5]||0].map(Number);
  else if((m=s.match(/^(\d{1,2})\.?\s+([a-zäA-Z]{3})[a-z.]*\s+(\d{4}),?\s*(?:(\d{1,2}):(\d{2}))?/)) && GYM_MON[m[2].toLowerCase()]){ d=+m[1]; mo=GYM_MON[m[2].toLowerCase()]; y=+m[3]; h=+(m[4]||0); mi=+(m[5]||0); }
  else if((m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4}),?\s*(?:(\d{1,2}):(\d{2}))?/))) [d,mo,y,h,mi]=[m[1],m[2],m[3],m[4]||0,m[5]||0].map(Number);
  else { const t=Date.parse(s); if(isNaN(t)) return null; const x=new Date(t); y=x.getFullYear(); mo=x.getMonth()+1; d=x.getDate(); h=x.getHours(); mi=x.getMinutes(); }
  if(!(y>1990&&y<2100&&mo>=1&&mo<=12&&d>=1&&d<=31)) return null;
  const p=n=>String(n).padStart(2,"0");
  return { date:`${y}-${p(mo)}-${p(d)}`, t:new Date(y,mo-1,d,h,mi).getTime() };
}
const gymNum = s => { const n=parseFloat(String(s||"").replace(",",".")); return isFinite(n)?n:0; };
const gymClean = (s,n) => String(s||"").replace(/[<>]/g,"").trim().slice(0,n||60);

// Datei → Trainings. Erkennt Hevy und Strong am Spaltenkopf.
function gymParse(text){
  const rows=gymCsv(text); if(!rows.length) return null;
  const k=Object.keys(rows[0]);
  let app, get;
  if(k.includes("exercise_title")&&k.includes("start_time")){
    app="hevy";
    const lbs=k.includes("weight_lbs")&&!k.includes("weight_kg");
    get=r=>({ key:r.title+"|"+r.start_time, name:r.title, start:r.start_time, end:r.end_time, ex:r.exercise_title,
      kg:lbs?gymNum(r.weight_lbs)*0.4536:gymNum(r.weight_kg), reps:gymNum(r.reps), sec:gymNum(r.duration_seconds), warm:/warm/i.test(r.set_type) });
  } else if(k.includes("exercise name")&&k.includes("date")){
    app="strong";
    get=r=>{ const dur=String(r.duration||""), hh=+(dur.match(/(\d+)\s*h/)||[0,0])[1], mm=+(dur.match(/(\d+)\s*m/)||[0,0])[1];
      return { key:r.date+"|"+r["workout name"], name:r["workout name"], start:r.date, min:hh*60+mm, ex:r["exercise name"],
        kg:gymNum(r.weight)*(/lb/i.test(r["weight unit"]||"")?0.4536:1), reps:gymNum(r.reps), sec:gymNum(r.seconds), warm:/^w/i.test(r["set order"]||""), skip:/rest/i.test(r["set order"]||"") }; };
  } else if(k.includes("exercise")&&k.includes("iswarmup")){
    app="fitbod";   // eine Zeile pro Satz, ohne Trainingsname: ein Training pro Tag
    const wk=k.find(h=>/^weight/.test(h))||"weight(kg)", lbs=/lb/.test(wk);
    get=r=>({ key:String(r.date).slice(0,10), name:"Training", start:r.date, ex:r.exercise,
      kg:gymNum(r[wk])*(lbs?0.4536:1), reps:gymNum(r.reps), sec:gymNum(r["duration(s)"]), warm:/true|1/i.test(r.iswarmup) });
  } else if(k.includes("exercise")&&k.includes("category")&&k.includes("date")){
    app="fitnotes";
    const wk=k.find(h=>/^weight/.test(h))||"weight (kgs)", lbs=/lb/.test(wk);
    get=r=>{ const t=String(r.time||"").split(":").map(Number), sec=t.length===3?t[0]*3600+t[1]*60+t[2]:t.length===2?t[0]*60+t[1]:0;
      return { key:r.date, name:"Training", start:r.date, ex:r.exercise, kg:gymNum(r[wk])*(lbs?0.4536:1), reps:gymNum(r.reps), sec, warm:false }; };
  } else {
    // Andere App: Spalten am Namen erkennen (Englisch oder Deutsch)
    const col=(re,not)=>k.find(h=>re.test(h)&&!(not&&not.test(h)));
    const cD=col(/date|datum|^day$|^tag$|start/,/end|update/), cE=col(/exercise|übung|uebung|movement|lift/,/note|categ|id$|type|group|muscle/),
      cW=col(/weight|gewicht|^kg$|^lbs?$|load/,/unit|body|körper/), cR=col(/^reps?$|reps|wdh|wiederhol/), cS=col(/^sets?$|^sätze$|^saetze$/),
      cN=col(/workout|routine|training|session|einheit/,/date|datum|time|zeit|dur|note|id$/), cT=col(/second|sekunde|duration|dauer/), cU=col(/unit|einheit/,/workout|training/), cY=col(/warm|set.?type|satzart/);
    if(!cD||!cE||!(cR||cW)) return null;
    app="other";
    const lbsCol=/lb/.test(cW||"");
    get=r=>{ const lbs=lbsCol||/lb/i.test(r[cU]||"");
      return { key:String(r[cD]).slice(0,10)+"|"+(cN?r[cN]:""), name:cN?r[cN]:"Training", start:r[cD], ex:r[cE],
        kg:gymNum(r[cW])*(lbs?0.4536:1), reps:gymNum(r[cR]), sec:cT?gymNum(r[cT]):0, warm:cY?/warm|aufwärm|^w$|true/i.test(r[cY]||""):false, n:cS?Math.min(20,Math.max(1,Math.round(gymNum(r[cS])))):1 }; };
  }

  const wos=new Map(), names=new Map();
  rows.forEach(r=>{
    const x=get(r); if(x.skip||x.warm||!x.ex) return;
    if(!(x.reps>0||x.kg>0||x.sec>0)) return;
    const d=gymDate(x.start); if(!d) return;
    let w=wos.get(x.key);
    if(!w){ const e=x.end&&gymDate(x.end); w={ imp:app+":"+x.key, date:d.date, name:gymClean(x.name)||"Training", min:Math.min(300,x.min||(e?Math.max(1,Math.round((e.t-d.t)/60000)):45)), ex:new Map() }; wos.set(x.key,w); }
    const title=gymClean(x.ex,80);
    if(!w.ex.has(title)) w.ex.set(title,[]);
    for(let i=0;i<(x.n||1);i++) w.ex.get(title).push({ kg:Math.round(x.kg*10)/10, reps:Math.round(x.reps||x.sec)||0, done:true });
    names.set(title,1);
  });
  return { app, workouts:[...wos.values()], names:[...names.keys()] };
}

// Übernehmen: hängt die Trainings an, doppelte (schon importierte) werden übersprungen
function gymApply(res){
  const have=new Set(state.workouts.map(w=>w.imp).filter(Boolean));
  state.customEx=state.customEx||[];
  const idOf={}; let newEx=0;
  res.names.forEach(n=>{
    let id=gymMatch(n);
    if(!id){
      const own=state.customEx.find(c=>gymNorm(c.name)===gymNorm(n));
      if(own) id=own.id; else { id="x-"+uid(); state.customEx.push({id, name:n, imp:1}); newEx++; }
    }
    idOf[n]=id;
  });
  let added=0, sets=0, first=null;
  res.workouts.forEach(w=>{
    if(have.has(w.imp)) return;
    const exercises=[...w.ex].map(([n,s])=>({ id:idOf[n], sets:s }));
    const n=exercises.reduce((a,e)=>a+e.sets.length,0);
    const vol=Math.round(exercises.reduce((a,e)=>a+e.sets.reduce((b,s)=>b+s.kg*s.reps,0),0));
    state.workouts.push({ id:uid(), imp:w.imp, date:w.date, name:w.name, min:w.min, seconds:w.min*60, volume:vol, sets:n, exercises });
    if(state.days[w.date]) state.days[w.date].checks.sport=1;
    added++; sets+=n; if(!first||w.date<first) first=w.date;
  });
  state.workouts.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  const matched=res.names.length-newEx;
  return { app:res.app, added, sets, first, exercises:res.names.length, matched, skipped:res.workouts.length-added };
}

// Datei auswählen und direkt übernehmen
function gymPickFile(){
  const inp=document.createElement("input");
  inp.type="file"; inp.accept=".csv,text/csv,text/plain"; inp.style.display="none";
  inp.addEventListener("change",()=>{
    const f=inp.files&&inp.files[0]; inp.remove(); if(!f) return;
    if(f.size>30*1024*1024){ toast("Datei ist zu groß"); return; }
    const r=new FileReader();
    r.onload=()=>{
      const res=gymParse(r.result);
      if(!res||!res.workouts.length){ ui.gymErr=true; ui.gymRes=null; render(); return; }
      ui.gymErr=false; ui.gymRes=gymApply(res); save(); render();
    };
    r.onerror=()=>toast("Datei konnte nicht gelesen werden");
    r.readAsText(f);
  });
  document.body.appendChild(inp); inp.click();
}

// Inhalt: Anleitung in 3 Schritten oder Ergebnis. Wird im Fragebogen und im Profil benutzt.
function gymBody(app){
  const A=GYM_APPS[app]||GYM_APPS.hevy, r=ui.gymRes;
  if(r) return `<div class="gi-done">
      <div class="gi-ok">✓</div>
      <div class="gi-big">${de(r.added)}</div>
      <div class="gi-lbl">${r.added===1?"Training":"Trainings"} übernommen</div>
      <div class="gi-stats">
        <div><b>${de(r.sets)}</b><span>Sätze</span></div>
        <div><b>${r.exercises}</b><span>Übungen</span></div>
        <div><b>${r.first?["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"][+r.first.slice(5,7)-1]+" "+r.first.slice(2,4).replace(/^/,"‘"):"–"}</b><span>seit</span></div>
      </div>
      ${r.skipped?`<p class="sub">${r.skipped} waren schon da und wurden übersprungen.</p>`:""}
    </div>`;
  return `<div class="gi-app"><span class="gi-emo">${A.emo}</span><b>${A.name}</b><span class="gi-arrow">→</span><img class="gi-emo gi-hm" src="icon-192.png" alt=""><b>Life Maxxing</b></div>
    <ol class="gi-steps">${A.path.concat("Datei hier auswählen").map((t,i)=>`<li><span>${i+1}</span>${esc(t)}</li>`).join("")}</ol>
    ${ui.gymErr?`<div class="warn">${app==="other"?"Die Datei konnte nicht gelesen werden. Sie braucht Spalten für Datum, Übung und Wiederholungen oder Gewicht.":`Das ist keine ${A.name}-Datei. Bitte die exportierte CSV-Datei wählen.`}</div>`:""}
    ${app==="other"&&!ui.gymErr?`<p class="gi-note">Klappt mit fast jeder App, die eine CSV-Datei mit Datum, Übung, Gewicht und Wiederholungen exportiert.</p>`:""}
    <p class="gi-note">🔒 Die Datei bleibt auf deinem Handy.</p>`;
}
// Auswahl im Profil: erst App wählen, dann gleiche Anleitung
function gymSheet(app){
  if(!app) return `<h2>Aus anderer App übernehmen</h2><p class="sub">Dein Trainingsverlauf mit allen Sätzen und Gewichten.</p>
    <div class="ob-opts">${Object.keys(GYM_APPS).map(k=>obOpt({v:k,l:GYM_APPS[k].name,e:GYM_APPS[k].emo},false,false,"gym-app")).join("")}</div>`;
  return `<h2>${app==="other"?"Aus anderer App":"Aus "+GYM_APPS[app].name} übernehmen</h2>${gymBody(app)}<div class="gap"></div>
    ${ui.gymRes?`<button class="pill primary" data-act="close">Fertig</button>`:`<button class="pill primary" data-act="gym-pick">📂 Datei auswählen</button>`}`;
}
