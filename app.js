// Health Maxxing – Kern: Zustand, Speichern, Bewertung, Grund-Bausteine, Rendern, Events, Start.
// Wird als letzte Datei geladen.

function iso(d){
  const x = d instanceof Date ? d : new Date(d);
  return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
}
function parseIso(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function addDays(s,n){ const d=parseIso(s); d.setDate(d.getDate()+n); return iso(d); }
function todayIso(){ return iso(new Date()); }
function weekday(s){ return ["So","Mo","Di","Mi","Do","Fr","Sa"][parseIso(s).getDay()]; }
function weekStart(s){ const d=parseIso(s); const off=(d.getDay()+6)%7; d.setDate(d.getDate()-off); return iso(d); }
function labelDate(s){
  if(s===todayIso()) return "Heute";
  if(s===addDays(todayIso(),-1)) return "Gestern";
  return parseIso(s).toLocaleDateString("de-DE",{weekday:"short", day:"numeric", month:"short"});
}
function uid(){ return Math.random().toString(36).slice(2,9); }
function blankDay(){ return { meals:[], water:0, checks:{}, taken:{}, routine:{} }; }
function fresh(){
  return {
    onboarded:false, step:null, tab:"heute", date:todayIso(),
    profile:{ name:"", goal:"muscle", sex:"m", age:24, height:178, weight:76, activity:1.55, adult:false, target:74, reminders:true, health:false, calories:true, affiliates:true, fish:"wenig", waterTarget:8 },
    days:{}, weights:[], workouts:[], routines:defaultRoutines(), measures:[], stack:["crea","d3"], customs:[], customEx:[], skin:{}, hautPlan:false, coach:{answers:{}, routine:[], skipped:[]}
  };
}
let state = load();
slimRoutine();
let ui = { modal:null, toast:null, scanMode:"text", query:"", addSlot:"breakfast", draftKg:76, portion:100, workout:null, rest:0, tick:null, wrange:"30", plan:null, planDay:0, exQuery:"", dash:null, cal:"month" };

function load(){
  try {
    const raw = localStorage.getItem(KEY);
    if(!raw) return fresh();
    return normalize(JSON.parse(raw));
  } catch(e){ return fresh(); }
}
// Ergänzt fehlende Felder. Wirft einen Fehler, wenn die Daten kaputt sind.
function normalize(s){
    s.profile = Object.assign(fresh().profile, s.profile||{});
    s.days = s.days||{}; s.weights = s.weights||[]; s.workouts = s.workouts||[];
    s.stack = s.stack||[]; s.customs = s.customs||[]; s.customEx = s.customEx||[]; s.skin = s.skin||{}; s.coach = s.coach||{answers:{}, routine:[]}; s.coach.answers=s.coach.answers||{}; s.coach.routine=s.coach.routine||[]; s.coach.skipped=s.coach.skipped||[]; s.routines = normalizeRoutines(s.routines); s.measures = s.measures||[];
    s.date = s.date || todayIso(); s.ob = s.ob||{}; migrateCoach(s);
    return s;
}
function save(){
  const copy = JSON.parse(JSON.stringify(state));
  try { localStorage.setItem(KEY, JSON.stringify(copy)); } catch(e){}
}
function day(s){ s=s||state.date; if(!state.days[s]) state.days[s]=blankDay(); return state.days[s]; }
function foods(){ return [...BASE_FOODS, ...state.customs]; }
function allItems(){ return [...foods(), ...CARE, ...SUPS]; }
function toast(m){ ui.toast=m; render(); setTimeout(()=>{ if(ui.toast===m){ ui.toast=null; render(); } }, 1600); }
function openModal(type, payload){ ui.modal={type, payload}; ui.amtOpen=false; ui.editUid=null; render(); }
function closeModal(){ stopCam(); ui.modal=null; render(); }

function targets(){
  const p=state.profile;
  const bmr=10*p.weight+6.25*p.height-5*p.age+(p.sex==="m"?5:-161);
  let kcal=Math.round(bmr*p.activity);
  if(p.goal==="lose") kcal-=Math.min(400,Math.round(kcal*0.2));
  if(p.goal==="muscle") kcal+=250;
  kcal=Math.max(p.sex==="m"?1500:1200, kcal);
  const protein=Math.round(p.weight*((p.goal==="lose"||p.goal==="muscle")?1.8:1.4));
  return { kcal, protein, carbs:Math.round(kcal*0.4/4), fat:Math.round(kcal*0.25/9) };
}
// Geschätzter Verbrauch durch Training an einem Tag (grober Richtwert, ca. 5 MET)
function burnKcal(s){ const kg=lastWeight(); return Math.round(state.workouts.filter(w=>w.date===(s||state.date)).reduce((n,w)=>n+kg*5*(w.min||0)/60,0)); }
// Kalorien-Richtwert für einen Tag: Grundbedarf + Training
function dayTarget(s){ return targets().kcal + burnKcal(s); }
function lastWeight(){ return state.weights.length ? state.weights[state.weights.length-1].kg : state.profile.weight; }
function bmi(){ const m=state.profile.height/100; return +(lastWeight()/(m*m)).toFixed(1); }
function bmiLabel(v){ return v<18.5?"Untergewicht":v<25?"Normalbereich":v<30?"Übergewicht":"Adipositas"; }
function weightSpan(){ const m=state.profile.height/100; return { low:+(21*m*m).toFixed(0), high:+(24*m*m).toFixed(0) }; }
function goalName(){ return (GOALS.find(g=>g.id===state.profile.goal)||GOALS[0]).name; }
function showKcal(){ return state.profile.calories; }
function kcalTxt(n){ return showKcal()? n+" kcal" : ""; }

function line(item, portion){
  const f = portion/100;
  return {
    kcal:Math.round((item.kcal||0)*f),
    protein:+((item.protein||0)*f).toFixed(1),
    carbs:+((item.carbs||0)*f).toFixed(1),
    fat:+((item.fat||0)*f).toFixed(1)
  };
}
function totals(s){
  const d = day(s);
  return d.meals.reduce((a,m)=>{
    const p=foods().find(x=>x.id===m.id);
    if(!p) return a;
    const l=line(p, m.portion);
    a.kcal+=l.kcal; a.protein+=l.protein; a.carbs+=l.carbs; a.fat+=l.fat;
    return a;
  }, {kcal:0, protein:0, carbs:0, fat:0});
}
function scoreClass(n){ return n>=75?"s-good":n>=50?"s-mid":"s-bad"; }
function finish(parts){
  const raw=parts.reduce((a,x)=>a+x[1],0);
  const rs=parts.slice(1).filter(x=>x[1]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,2).map(([l,v])=>l+(v>0?" hilft":" kostet")+" ("+(v>0?"+":"")+v+").");
  return { score:Math.max(8,Math.min(98,Math.round(raw))), reasons:rs.length?rs:["Neutral für dein Ziel."], parts };
}
// Erkennung am Produktnamen (Stichwörter). Nur ein Hinweis, keine Garantie.
const FOOD_KW={
  lak:{has:["milch","joghurt","jogurt","quark","kase","skyr","sahne","butter","rahm","schmand","mozzarella","pudding","kefir","molke","whey","feta","gouda","parmesan","cheese","cappuccino","=latte","=eis"],not:["laktosefrei","lactosefrei","hafermilch","sojamilch","mandelmilch","kokosmilch","reismilch","vegan","erdnussbutter","kakaobutter","mandelbutter"]},
  glu:{has:["brot","toast","nudel","pasta","spaghetti","penne","fusilli","lasagne","pizza","weizen","dinkel","roggen","gerste","couscous","bulgur","keks","kuchen","croissant","brezel","breze","semmel","schrippe","cracker","musli","granola","hafer","zwieback","waffel","muffin","baguette","wrap","gnocchi","maultasche","spatzle","knodel","paniert","seitan","=bier"],not:["glutenfrei","reiswaffel","maiswaffel","aufstrich"]},
  nut:{has:["nuss","mandel","cashew","pistazie","pekan","macadamia","nutella","nougat","marzipan","praline"],not:["kokos","muskat","genuss"]},
  meat:{has:["fleisch","huhn","hahnchen","hendl","pute","truthahn","rind","schwein","kalb","lamm","salami","schinken","wurst","speck","bacon","hack","doner","kebab","gyros","chicken","beef","leberkas","frikadelle","bulette","schnitzel","steak","lachs","thunfisch","fisch","garnele","shrimp","krabbe","hering","makrele","sardine","forelle","kabeljau","surimi","gelatine"],not:["vegan","veggie","vegetar","fleischlos","flammkuchen"]},
  egg:{has:["=ei","=eier","eier","ruhrei","spiegelei","omelett","mayonnaise","=mayo","honig"],not:["vegan"]},
  caf:{has:["kaffee","espresso","cappuccino","cola","=latte","=energy","energydrink","=mate","matcha","schwarztee"],not:["entkoffeiniert","koffeinfrei"]}
};
function foodHas(item,kind){
  const h=NORM(item.name||""), kw=FOOD_KW[kind]; if(!h||!kw) return false;
  if(kw.not.some(x=>h.includes(x))) return false;
  const words=h.split(/[^a-z0-9]+/);
  return kw.has.some(x=>x[0]==="="?words.includes(x.slice(1)):h.includes(x));
}
function scoreFood(item){
  const g=state.profile.goal, parts=[["Basis",62]];
  const add=(l,v)=>{ v=Math.round(v); if(v) parts.push([l,v]); };
  const pr=item.protein||0, su=item.sugar||0;
  if(g==="muscle"){ add("Protein",Math.min(22,pr*.7)); add("Zucker",-su*1.2); }
  else if(g==="lose"){ add("Protein",Math.min(12,pr*.4)); add("Zucker",-su*1.6); add("Energiedichte",-Math.max(0,(item.kcal||0)-250)/12); }
  else if(g==="skin"){ add("Zucker",-su*2); }
  else add("Zucker",-su);
  if(item.processed) add("Verarbeitet",g==="skin"?-14:-8);
  const ea=state.coach.answers.gesundheit||{}, ha=state.coach.answers.haut||{}, sa=state.coach.answers.schlaf||{};
  const MEAT=["huhn","rind","salami","thunfisch","lachs"], ANI=MEAT.concat(["ei","skyr","quark","joghurt","kaese"]);
  const meat=MEAT.includes(item.id)||foodHas(item,"meat"), animal=meat||ANI.includes(item.id)||foodHas(item,"lak")||foodHas(item,"egg");
  if(ea.stil==="Vegan"&&animal) add("Passt nicht zu Vegan",-40);
  else if(ea.stil==="Vegetarisch"&&meat) add("Passt nicht zu Vegetarisch",-40);
  const fokus=ea.fokus||[], intol=ea.intol||[], huerde=ea.huerde||[];
  if(fokus.includes("Weniger Zucker")) add("Dein Fokus: weniger Zucker",-su*0.8);
  if(fokus.includes("Mehr Protein")) add("Dein Fokus: mehr Protein",Math.min(10,pr*.35));
  if(fokus.includes("Weniger Fertiges")&&item.processed) add("Dein Fokus: weniger Fertiges",-8);
  if(fokus.includes("Weniger Salz")) add("Dein Fokus: weniger Salz",-Math.max(0,(item.salt||0)-0.5)*6);
  if(fokus.includes("Mehr Ballaststoffe")) add("Dein Fokus: Ballaststoffe",Math.min(8,item.fiber||0));
  if(intol.includes("Laktose")&&foodHas(item,"lak")) add("Kann Laktose enthalten",-25);
  if(intol.includes("Gluten")&&foodHas(item,"glu")) add("Kann Gluten enthalten",-25);
  if(intol.includes("Nüsse")&&foodHas(item,"nut")) add("Kann Nüsse enthalten",-30);
  if(huerde.includes("Heißhunger")&&((pr>=10&&(item.kcal||0)<=250)||(item.fiber||0)>=6)) add("Macht lange satt",6);
  if((sa.kaffee==="Oft"||(sa.ein&&sa.ein!=="Geht schnell"))&&foodHas(item,"caf")) add("Koffein: nach 15 Uhr meiden",-4);
  else if(ea.stil==="Wenig Fleisch"&&["rind","salami"].includes(item.id)) add("Du willst weniger Fleisch",-12);
  if(g!=="skin"&&ha.stoert==="Unreinheiten") add("Zucker und Haut",-su*0.8);
  add("Ballaststoffe",Math.min(10,(item.fiber||0)*1.2));
  add("Salz",-Math.max(0,(item.salt||0)-1)*8);
  add("Gesättigte Fette",-Math.max(0,(item.sat||0)-4)*2);
  return finish(parts);
}
function scoreCare(item){
  const typ=skinType(), ok=(item.skin||[]).includes(typ), parts=[["Basis",70],[ok?"Passt zum Hauttyp":"Anderer Hauttyp",ok?12:-8]];
  if(item.fragrance) parts.push(["Duftstoffe",-12]);
  if(item.alcohol) parts.push(["Alkohol",-16]);
  if((item.actives||[]).includes("UV-Filter")) parts.push(["Lichtschutz",8]);
  const ha=state.coach.answers.haut||{}, act=item.actives||[];
  if(item.fragrance && ha.empf==="Ja") parts.push(["Du reagierst auf Duft",-10]);
  if(ha.stoert==="Unreinheiten"&&act.includes("Niacinamid")) parts.push(["Hilft bei Unreinheiten",8]);
  if((ha.stoert==="Rötung"||ha.bild==="Sensibel")&&item.alcohol) parts.push(["Alkohol reizt empfindliche Haut",-8]);
  if(ha.sonne&&ha.sonne!=="Täglich"&&act.includes("UV-Filter")) parts.push(["Du brauchst mehr Sonnenschutz",6]);
  return finish(parts);
}
function safetyNote(){
  const p=state.profile, m=p.height/100, tb=p.target/(m*m); let msg="";
  if(tb<18.5) msg="Dein Zielgewicht liegt im Untergewicht (BMI "+de(tb,1)+"). Besprich so ein Ziel bitte mit Ärzt:in.";
  else if(p.goal==="lose" && targets().kcal<=(p.sex==="m"?1500:1200)) msg="Dein Richtwert liegt am Mindestwert. Nicht weiter darunter gehen.";
  return msg?`<div class="warn">${msg}</div>`:"";
}
function insight(){
  const t=targets(); let days=0,sum=0;
  for(let i=1;i<=7;i++){ const s=addDays(state.date,-i); if(state.days[s]&&state.days[s].meals.length){ days++; sum+=totals(s).protein; } }
  if(days<3) return "";
  const avg=Math.round(sum/days);
  const txt=t.protein-avg>10?`Protein im Schnitt ${avg} g, Richtwert ${t.protein} g. Skyr, Ei oder Hähnchen schließen die Lücke.`:`Protein im Schnitt ${avg} g, nah am Richtwert ${t.protein} g.`;
  return `<div class="insight"><b>Wochen-Check</b><span>${txt}</span></div>`;
}
function recommendStack(){
  const p=state.profile, t=targets(), tot=totals(state.date);
  const hasFish = p.fish==="oft" || day().meals.some(m=>m.id==="lachs");
  const picks=[];
  const add=(id,score,why)=>{ if(!picks.find(x=>x.id===id)) picks.push({id,score,why}); };
  const ea=state.coach.answers.gesundheit||{}, sa=state.coach.answers.schlaf||{}, vegan=ea.stil==="Vegan";
  const lifts=["Krafttraining","Beides"].includes(p.trainType)&&p.trainFreq&&p.trainFreq!=="Gar nicht";
  if(vegan) add("b12",90,"Vegan: B12 steckt fast nur in tierischen Lebensmitteln.");
  if(p.goal==="muscle" || p.activity>=1.55 || lifts) add("crea",92,"Training und Kraft: Creatin ist das am klarsten belegte Pulver.");
  const trained=state.workouts.some(w=>w.date===state.date);
  if(!vegan && (p.goal==="muscle"||p.goal==="lose"||trained) && tot.protein < t.protein*0.55) add("whey",80,"Protein heute liegt klar unter dem Richtwert.");
  if((p.goal==="skin"||p.goal==="energy"||p.goal==="lose") && !hasFish) add("o3",82,"Wenig Fisch — Omega-3 eher als Kollagen.");
  if(p.goal==="energy" || (day().sleep!=null && day().sleep<6.5) || (sa.ein&&sa.ein!=="Geht schnell") || !day().checks.schlaf) add("mg",74,"Abend-Magnesium, wenn der Schlaf unruhig bleibt.");
  if(p.goal==="skin" && picks.length<3) add("col",58,"Nur Zusatz. Schlaf, LSF und Essen wirken stärker.");
  if(picks.length<3) add("d3",78,"Solide Basis bei wenig Sonne. Dosis nicht selbst hochdrehen.");
  return picks.slice(0,3);
}
function scoreSup(item){
  const rec=recommendStack().find(x=>x.id===item.id);
  return { score: rec?rec.score:48, reasons:[rec?rec.why:item.note, rec?"Für dich vorgeschlagen.":"Kein Kernstück für dein Profil."] };
}
function scored(item){
  if(item.type==="care") return scoreCare(item);
  if(item.type==="sup") return scoreSup(item);
  return scoreFood(item);
}
function taskOn(id, s){
  const d=day(s||state.date);
  if(id==="essen") return d.meals.length>0;
  if(id==="wasser") return d.water>=state.profile.waterTarget;
  if(id==="sups") return state.stack.length>0 && state.stack.every(x=>d.taken[x]);
  if(id==="sport") return state.workouts.some(w=>w.date===(s||state.date)) || !!d.checks.sport;
  return !!d.checks[id];
}
function syncAuto(s){
  const d=day(s);
  d.checks.essen = d.meals.length?1:0;
  d.checks.wasser = d.water>=state.profile.waterTarget?1:0;
  d.checks.sups = state.stack.length && state.stack.every(x=>d.taken[x]) ? 1 : 0;
  d.checks.sport = state.workouts.some(w=>w.date===s) || d.checks.sport ? 1 : 0;
}

function de(v,d){ d=d||0; return Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d}); }
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }

function glyph(name){
  const d = {
    scale:"M4 8h16M7 8v10h10V8M9 12h6",
    flag:"M6 4v16M6 5h10l-2 3 2 3H6",
    target:"M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M12 12m-3 0a3 3 0 1 0 6 0",
    drop:"M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z",
    hair:"M8 5c2 6 2 8 0 14M12 4c2 6 2 9 0 15M16 5c2 6 2 8 0 14",
    body:"M12 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 21l1.5-6L8 11h8l-1.5 4L16 21",
    moon:"M16 4a8 8 0 1 0 4 12 6 6 0 0 1-4-12z",
    cap:"M8 8h8v8a4 4 0 0 1-8 0zM7 8h10",
    leaf:"M5 19C5 10 12 5 19 5 19 14 12 19 5 19zM8 16c2-2 5-5 8-8",
    bowl:"M5 10h14l-1.5 8H6.5zM8 10V8a4 4 0 0 1 8 0v2",
    fish:"M4 12c4-4 8-4 12-1 1 2 3 2 4 1-1 2-3 2-4 1-4 3-8 3-12-1z",
    egg:"M12 4c4 2 6 6 6 9a6 6 0 0 1-12 0c0-3 2-7 6-9z",
    bread:"M5 11c0-3 3-5 7-5s7 2 7 5v7H5zM5 13h14",
    cup:"M7 6h8v8a4 4 0 0 1-8 0zM15 8h2a2 2 0 0 1 0 4h-2"
  };
  const path = d[name] || d.leaf;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
}
function foodGlyph(id){
  const map = {skyr:"bowl",hafer:"bowl",banane:"leaf",ei:"egg",huhn:"leaf",reis:"bowl",salat:"leaf",lachs:"fish",brot:"bread",cola:"cup",riegel:"bread",pizza:"bread"};
  return glyph(map[id] || "bowl");
}
function icon(n){
  const d={
    heute:"M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z",
    coach:"M5 7h14M5 12h14M5 17h10",
    sport:"M6 9h3v6H6zM15 9h3v6h-3zM9 11h6v2H9z",
    verlauf:"M5 16l4-4 3 3 7-8",
    profil:"M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM4 20a8 8 0 0 1 16 0"
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d[n]}"/></svg>`;
}
function tog(on){ return `<span class="tog ${on?"on":""}"><i></i></span>`; }
function mealGlyph(id, color){
  const p={
    breakfast:"M12 3v2M8 5.2l1.2 1.6M16 5.2l-1.2 1.6M6 14a6 6 0 0 1 12 0H6zM8 18h8",
    lunch:"M4 10h16v2a8 8 0 0 1-16 0zM8 6v4M12 5v5M16 6v4",
    dinner:"M5 4v10a3 3 0 0 0 3 3h0M19 4c-3 3-3 7 0 10M19 14v6",
    snack:"M12 3c4 3 6 6 6 9a6 6 0 1 1-12 0c0-3 2-6 6-9z"
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${p[id]}"/></svg>`;
}
function waterGlyph(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="#2B7C9E" stroke-width="1.9" stroke-linecap="round"><path d="M8 7h8l-1 12H9L8 7zM9 7c0-3 6-3 6 0"/></svg>`; }
function miniRing(pct, color){
  const C=2*Math.PI*20, off=C*(1-Math.min(1,Math.max(0,pct)));
  return `<svg class="mini" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="none" stroke="#eceef2" stroke-width="3"/>
    <circle cx="22" cy="22" r="20" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" transform="rotate(-90 22 22)" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg>`;
}
function ringSvg(pct){
  const C=2*Math.PI*46, off=C*(1-Math.min(1,Math.max(0,pct)));
  return `<svg viewBox="0 0 118 118"><circle cx="59" cy="59" r="46" fill="none" stroke="#eef0f3" stroke-width="10"/>
    <circle cx="59" cy="59" r="46" fill="none" stroke="#1aa35a" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg>`;
}
function spark(arr){
  if(arr.length<2) return `<div class="sub">Noch zu wenig Punkte für eine Kurve.</div>`;
  const min=Math.min(...arr)-0.4, max=Math.max(...arr)+0.4;
  const w=320,h=64,p=6;
  const pts=arr.map((v,i)=>`${p+i*((w-2*p)/(arr.length-1))},${h-p-((v-min)/(max-min))*(h-2*p)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline fill="none" stroke="#1aa35a" stroke-width="3" points="${pts}"/></svg>`;
}

function renderApp(){
  if(ui.workout) return renderLive();
  if(ui.plan) return renderPlan();
  if(ui.dash) return renderDash();
  const views={heute:renderHeute, coach:renderCoach, sport:renderSport, verlauf:renderVerlauf, profil:renderProfil};
  return `<div class="screen">${views[state.tab]()}
    <div class="tabfade"></div><nav class="tabs">${[["heute","Tagebuch"],["coach","Coach"],["sport","Training"],["verlauf","Verlauf"],["profil","Profil"]].map(([id,l])=>`
      <button class="tab ${state.tab===id?"on":""}" data-act="tab" data-v="${id}">${icon(id)}${l}</button>`).join("")}
    </nav></div>`;
}
function renderDash(){
  const body=ui.dash==="meal"?renderMealPage():ui.dash==="routine"?renderRoutineDash():ui.dash==="calendar"?renderCalendar():ui.dash==="stats"?renderStats():ui.dash==="exercises"?renderExercises():renderMeasures();
  return `<div class="screen"><div class="scroll pad">${body}</div></div>`;
}

function dashSheet(id){ return ""; }
// Sicherheitsabfrage vor "Alles löschen"
function resetSheet(){
  const ok=(ui.resetTxt||"").trim().toUpperCase()==="LÖSCHEN";
  return `<h2>Wirklich alles löschen?</h2>
    <p class="sub">Alle Daten auf diesem Gerät werden <b>unwiderruflich</b> gelöscht: ${state.weights.length} Wiegepunkte, ${state.workouts.length} Trainings, ${Object.keys(state.days).length} Tage mit Einträgen, dein Profil und deine Pläne. Es gibt keinen Server und keine Kopie – das lässt sich nicht rückgängig machen.</p>
    <div class="gap"></div>
    <p class="sub"><b>Tipp:</b> Sichere deine Daten vorher als Datei.</p>
    <button class="pill ghost" style="width:100%" data-act="backup">⬇️ Erst Daten sichern</button>
    <div class="gap"></div>
    <div class="field"><label for="reset-input">Zum Bestätigen <b>LÖSCHEN</b> eintippen</label></div>
    <input id="reset-input" class="reset-input" data-act="reset-type" value="${esc(ui.resetTxt||"")}" placeholder="LÖSCHEN" autocomplete="off" autocapitalize="characters" spellcheck="false">
    <div class="gap"></div>
    <button id="reset-go" class="pill danger" data-act="reset-go" ${ok?"":"disabled"}>Endgültig löschen</button>
    <div class="gap"></div>
    <button class="pill ghost" style="width:100%" data-act="close">Abbrechen</button>`;
}
// Alle Daten als JSON-Datei herunterladen
function downloadBackup(){
  try{
    const file={ app:"Health Maxxing", version:1, exported:new Date().toISOString(), data:state };
    const blob=new Blob([JSON.stringify(file,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="health-maxxing-daten-"+todayIso()+".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    toast("Datei gespeichert");
  }catch(e){ toast("Export fehlgeschlagen"); }
}
// Datei auswählen lassen und einlesen
function pickImport(){
  const inp=document.createElement("input");
  inp.type="file"; inp.accept=".json,application/json"; inp.style.display="none";
  inp.addEventListener("change",()=>{
    const f=inp.files&&inp.files[0]; inp.remove(); if(!f) return;
    if(f.size>20*1024*1024){ toast("Datei ist zu groß"); return; }
    const r=new FileReader();
    r.onload=()=>{
      const data=checkImport(r.result);
      if(!data){ toast("Ungültige Datei – keine Health-Maxxing-Daten"); return; }
      ui.importData=data; openModal("import");
    };
    r.onerror=()=>toast("Datei konnte nicht gelesen werden");
    r.readAsText(f);
  });
  document.body.appendChild(inp); inp.click();
}
// Prüft die Datei. Gibt die Daten zurück oder null, wenn sie ungültig ist.
function checkImport(text){
  try{
    let d=JSON.parse(text);
    if(d&&(d.app==="Health Maxxing"||d.app==="FORMA")&&d.data) d=d.data;          // neues Format (auch alte FORMA-Dateien)
    const isObj=x=>x&&typeof x==="object"&&!Array.isArray(x);
    if(!isObj(d)||!isObj(d.profile)) return null;
    if(d.days!=null&&!isObj(d.days)) return null;
    if(d.weights!=null&&!Array.isArray(d.weights)) return null;
    if(d.workouts!=null&&!Array.isArray(d.workouts)) return null;
    if((d.weights||[]).some(w=>!w||typeof w.date!=="string"||typeof w.kg!=="number")) return null;
    return normalize(JSON.parse(JSON.stringify(d)));  // wirft Fehler bei kaputten Daten
  }catch(e){ return null; }
}
function importSheet(){
  const d=ui.importData; if(!d) return "";
  const n=x=>`${x.weights.length} Wiegepunkte, ${x.workouts.length} Trainings, ${Object.keys(x.days).length} Tage`;
  return `<h2>Daten ersetzen?</h2>
    <p class="sub">Die Datei ist gültig.</p>
    <div class="gap"></div>
    <p class="sub"><b>In der Datei:</b> ${n(d)}<br><b>Jetzt auf dem Gerät:</b> ${n(state)}</p>
    <div class="gap"></div>
    <p class="sub">Deine aktuellen Daten werden komplett <b>ersetzt</b> und gehen verloren. Sichere sie vorher, wenn du sie behalten willst.</p>
    <button class="pill ghost" style="width:100%" data-act="backup">⬇️ Aktuelle Daten erst exportieren</button>
    <div class="gap"></div>
    <button class="pill danger" data-act="import-go">Ja, Daten ersetzen</button>
    <div class="gap"></div>
    <button class="pill ghost" style="width:100%" data-act="close">Abbrechen</button>`;
}
function renderModal(){
  if(!ui.modal) return "";
  const {type,payload}=ui.modal;
  let inner="";
  if(type==="scan") inner=scanSheet();
  if(type==="product") inner=productSheet(payload);
  if(type==="area") inner=areaSheet(payload);
  if(type==="details"){ const t=targets(); inner=`<h2>Richtwert</h2><p class="sub">${de(t.kcal)} kcal · ${t.protein} g Protein. Mifflin-St Jeor, angepasst ans Ziel. Kein ärztlicher Wert.</p><div class="gap"></div><button class="pill primary" data-act="close">OK</button>`; }
  if(type==="goal") inner=`<h2>Ziel</h2>${GOALS.map(g=>`<button class="choice ${state.profile.goal===g.id?"on":""}" data-act="set" data-k="goal" data-v="${g.id}"><b>${g.name}</b></button>`).join("")}<button class="pill primary" data-act="close">Fertig</button>`;
  if(type==="body") inner=`<h2>Körperdaten</h2>
    ${[["age","Alter",state.profile.age,18,80,1],["height","Größe cm",state.profile.height,140,220,1],["target","Zielgewicht",state.profile.target,obMinTarget(),160,0.5],["waterTarget","Wassergläser",state.profile.waterTarget,4,12,1]].map(([k,l,v,min,max,step])=>`<div class="field"><label>${l}</label><div class="stepper"><button class="plus" data-act="nudge" data-k="${k}" data-d="-${step}" data-min="${min}" data-max="${max}">−</button><b>${v}</b><button class="plus" data-act="nudge" data-k="${k}" data-d="${step}" data-min="${min}" data-max="${max}">+</button></div></div>`).join("")}
    <div class="field"><label>Fisch</label></div>
    <div class="opts">${[["wenig","Selten"],["oft","Oft"]].map(([v,l])=>`<button class="chip ${state.profile.fish===v?"on":""}" data-act="set" data-k="fish" data-v="${v}">${l}</button>`).join("")}</div>
    <div class="gap"></div><button class="pill primary" data-act="close">Fertig</button>`;
  if(type==="weigh") inner=weighSheet();
  if(type==="legal") inner=`<h2>Hinweise</h2><p class="sub">Nur für Erwachsene. Richtwerte, keine medizinische Beratung. Supplements ersetzen kein Essen. Produktdaten teils von Open Food Facts (© Open Food Facts-Mitwirkende, ODbL 1.0). Daten bleiben im Browser dieses Geräts.</p><div class="gap"></div><button class="pill primary" data-act="close">OK</button>`;
  if(type==="stack") inner=stackSheet();
  if(type==="custom") inner=customSheet();
  if(type==="ex"||type==="plan-ex") inner=exPicker(type==="plan-ex"?"plan":"live");
  if(type==="ex-hist") inner=exHist(payload);
  if(type==="wo-detail") inner=woDetail(payload);
  if(type==="goaldate") inner=`<h2>Zieldatum</h2><p class="sub">Nur eine Markierung. Kein Countdown-Druck.</p><div class="gap"></div><button class="pill primary" data-act="goal-weeks">In 8 Wochen</button><div class="gap"></div><button class="pill ghost" style="width:100%" data-act="close">Später</button>`;
  if(type==="steps") inner=stepsSheet();
  if(type==="entries") inner=`<h2>Einträge</h2><p class="sub">Tippe auf einen Eintrag, um ihn zu ändern oder zu löschen.</p>${state.weights.slice().reverse().map(w=>`<button class="row space" style="width:100%;padding:10px 0;border-bottom:1px solid var(--line)" data-act="w-edit" data-v="${w.date}"><span>${labelDate(w.date)}</span><span><b>${de(w.kg,1)} kg</b> <span class="sub">›</span></span></button>`).join("")||"<p class=sub>Noch keine Waage.</p>"}<div class="gap"></div><button class="pill primary" data-act="open" data-type="weigh">Gewicht erfassen</button>`;
  if(type==="w-edit") inner=weightEditSheet(payload);
  if(type==="wo-edit") inner=woEditSheet();
  if(type==="wo-del") inner=woDelSheet(payload);
  if(type==="import") inner=importSheet();
  if(type==="reset") inner=resetSheet();
  return `<div class="sheet" data-act="close"><div class="sheet-card" data-act="stop"><div class="grab"></div>${inner}</div></div>`;
}
function render(){ try{ ensureRoutine(); }catch(e){}
  const root=document.getElementById("app");
  let html = !state.onboarded ? (state.step==null ? renderWelcome() : renderOnboard()) : renderApp();
  if(!state.onboarded && state.step==null) html=renderWelcome();
  html += renderModal();
  if(state.onboarded) html += renderExInfo();
  if(ui.toast) html += `<div class="toast">${esc(ui.toast)}</div>`;
  // Scroll-Positionen merken, damit ein Neuaufbau (Tipp, Toast, Timer) nicht nach oben springt
  const keep=[...root.querySelectorAll(".scroll,.sheet-card")].map(n=>n.scrollTop);
  const view=!state.onboarded?"ob:"+state.step:ui.workout?"w":ui.plan?"p":ui.dash?"d:"+ui.dash:"t:"+state.tab;
  const same=ui._view===view;
  ui._view=view;
  root.innerHTML = html;
  if(same){ [...root.querySelectorAll(".scroll,.sheet-card")].forEach((n,i)=>{ if(keep[i]) n.scrollTop=keep[i]; }); }
  if(ui.exInfo) figKick();
  exAfterRender();
}
function seedDemo(){
  state = fresh();
  state.onboarded=true; state.step=0;
  state.profile.name="Alex"; state.profile.adult=true; state.profile.goal="muscle"; state.obDone=true;
  Object.assign(state.profile,{trainFreq:"3–4× pro Woche", trainType:"Krafttraining", stepGoal:10000, areas:["Haut","Schlaf"], routineTime:"15 Minuten"});
  const t=todayIso();
  state.date=t;
  for(let i=6;i>=0;i--){
    const s=addDays(t,-i);
    const kg=+(76.8-i*0.12).toFixed(1);
    state.weights.push({date:s, kg});
    state.days[s]=blankDay();
    if(i>0){
      state.days[s].meals=[
        {uid:uid(), id:"skyr", portion:200, slot:"breakfast"},
        {uid:uid(), id:"hafer", portion:50, slot:"breakfast"},
        {uid:uid(), id:"huhn", portion:180, slot:"lunch"},
        {uid:uid(), id:"reis", portion:150, slot:"lunch"}
      ];
      state.days[s].water = i%2?8:5;
      state.days[s].checks={pflege:1, schlaf:i%2?1:0, sport:i%3===0?1:0};
      state.days[s].taken={crea:1, d3:i%2?1:0};
    }
  }
  ["Push","Pull","Beine","Push","Pull"].forEach((name,i)=>state.workouts.push({ id:uid(), date:addDays(t,-1-i*2), name:name, min:40, volume:2000+i*120, sets:9, exercises:[] }));
  state.profile.weight=lastWeight();
  save();
}

document.getElementById("app").addEventListener("click", e=>{
  const el=e.target.closest("[data-act]"); if(!el) return;
  const act=el.dataset.act;
  if(act==="stop"){ e.stopPropagation(); return; }
  if((el.tagName==="INPUT"&&!["checkbox","radio","range","button"].includes(el.type))||el.tagName==="TEXTAREA") return;
  const p=state.profile;
  if(act==="start-onboard"){ state.step=0; }
  else if(act==="skip-demo"){ seedDemo(); toast("Beispieldaten geladen"); }
  else if(act==="ob-adult"){ if(el.dataset.v==="1"){ p.adult=true; state.obMinor=false; } else { p.adult=false; state.obMinor=true; } save(); }
  else if(act==="ob-pick"){ obPick(el.dataset.v); }
  else if(act==="ob-next"){ obNext(); }
  else if(act==="ob-back"){ obBack(); }
  else if(act==="ob-skip"){ obSkip(); }
  else if(act==="ob-nudge"){ obNudge(+el.dataset.d); }
  else if(act==="ob-finish"){ obFinish(); }
  else if(act==="ob-close"){ state.obRedo=false; state.onboarded=true; state.step=null; save(); }
  else if(act==="ob-redo"){ state.ob=Object.assign({},state.ob,{sex:1,goal:1,activity:1,fish:1,sups:1,target:1,weight:1}); state.obRedo=true; state.onboarded=false; state.step=1; ui.modal=null; save(); }
  else if(act==="set"){ p[el.dataset.k]=el.dataset.v; save(); }
  else if(act==="set-num"){ p[el.dataset.k]=parseFloat(el.dataset.v); save(); }
  else if(act==="set-bool"){ p.adult=true; save(); }
  else if(act==="nudge"){ p[el.dataset.k]=Math.min(+el.dataset.max, Math.max(+el.dataset.min, +(p[el.dataset.k]+ +el.dataset.d).toFixed(1))); save(); }
  else if(act==="tab"){ state.tab=el.dataset.v; ui.modal=null; save(); }
  else if(act==="shift"){ const next=addDays(state.date, +el.dataset.d); if(next<=todayIso()){ state.date=next; save(); } }
  else if(act==="today"){ state.date=todayIso(); save(); }
  else if(act==="pick-day"){ state.date=el.dataset.v; save(); }
  else if(act==="dash"){ ui.dash=el.dataset.id; ui.modal=null; }
  else if(act==="open"){
    if(el.dataset.slot) ui.addSlot=el.dataset.slot;
    if(el.dataset.type==="weigh") ui.draftKg=lastWeight();
    if(el.dataset.type==="scan"){ ui.query=""; ui.scanView="list"; }
    if(el.dataset.type==="product") ensureDb(el.dataset.id); openModal(el.dataset.type, el.dataset.id); return;
  }
  else if(act==="close"){ closeModal(); return; }
  else if(act==="scan-view"){ stopCam(); ui.scanView=el.dataset.v; ui.camMsg=""; }
  else if(act==="cam-start"){ startCam(); return; }
  else if(act==="bc-lookup"){ const i=document.getElementById("bc-input"); bcLookup(i&&i.value); return; }
  else if(act==="more-go"){ const v=el.dataset.v; if(v==="quick") ui.scanView="quick"; else { ui.newBc=v==="bc"?"":null; ui.newBack="more"; ui.scanView="newfood"; } }
  else if(act==="quick-add"){ ensureDb(el.dataset.id); day().meals.push({uid:uid(),id:el.dataset.id,portion:100,slot:ui.addSlot||"snack"}); syncAuto(state.date); save(); toast("Hinzugefügt"); }
  else if(act==="ai-run"){ aiRun(); return; }
  else if(act==="ai-mic"){ aiMic(); return; }
  else if(act==="ai-add"){
    (ui.aiRes||[]).forEach(i=>{ if(i.ref){ ensureDb(i.ref); day().meals.push({uid:uid(),id:i.ref,portion:i.grams,slot:ui.addSlot||"snack"}); return; } const it={id:"a-"+uid(),type:"custom",hidden:true,name:i.name,brand:"KI",emoji:"✨",kcal:i.kcal,protein:i.protein,carbs:i.carbs,fat:i.fat,sugar:i.sugar,processed:i.processed}; state.customs.push(it); day().meals.push({uid:uid(),id:it.id,portion:i.grams,slot:ui.addSlot||"snack"}); });
    ui.aiRes=null; ui.aiText=""; ui.scanView="list"; syncAuto(state.date); save(); toast("Im Tagebuch");
  }
  else if(act==="save-quick"){
    const g=id=>+(document.getElementById(id).value||"").replace(",",".")||0, kcal=g("q-kcal");
    if(!kcal){ toast("Kalorien fehlen"); return; }
    const it={id:"q-"+uid(),type:"custom",hidden:true,name:(document.getElementById("q-name").value||"").trim()||"Schnell hinzugefügt",brand:"Schnell",emoji:"⚡",kcal,protein:g("q-p"),carbs:g("q-c"),fat:g("q-f"),sugar:0,processed:false};
    state.customs.push(it); day().meals.push({uid:uid(),id:it.id,portion:100,slot:ui.addSlot||"snack"});
    ui.scanView="list"; syncAuto(state.date); save(); toast("Hinzugefügt");
  }
  else if(act==="scan-mode") ui.scanMode=el.dataset.v;
  else if(act==="meal-open"){ ui.addSlot=el.dataset.slot; ui.dash="meal"; ui.modal=null; }
  else if(act==="meal-edit"){ const m=day().meals.find(x=>x.uid===el.dataset.uid); if(m){ ui.modal={type:"product",payload:m.id}; ui.amtOpen=false; ui.editUid=m.uid; ui.portion=m.portion; } }
  else if(act==="save-meal"){ const m=day().meals.find(x=>x.uid===ui.editUid), i=document.getElementById("portion"); if(m) m.portion=Math.max(1,+(i&&i.value||ui.portion)||m.portion); ui.editUid=null; ui.modal=null; syncAuto(state.date); save(); toast("Gespeichert"); }
  else if(act==="del-meal2"){ day().meals=day().meals.filter(x=>x.uid!==ui.editUid); ui.editUid=null; ui.modal=null; syncAuto(state.date); save(); toast("Gelöscht"); }
  else if(act==="ai-del"){ (ui.aiRes||[]).splice(+el.dataset.i,1); if(!(ui.aiRes||[]).length) ui.aiRes=null; }
  else if(act==="steps-add"){ const i=document.getElementById("st-input"); if(i) i.value=(+i.value||0)+ +el.dataset.v; return; }
  else if(act==="steps-save"){ const i=document.getElementById("st-input"); day().steps=Math.max(0,Math.round(+(i&&i.value)||0)); ui.modal=null; save(); toast("Gespeichert"); }
  else if(act==="step-goal"){ state.profile.stepGoal=+el.dataset.v; save(); }
  else if(act==="scan-more"){ ui.scanMax=(ui.scanMax||30)+30; const bx=document.getElementById("scan-results"); if(bx) bx.innerHTML=scanResults(); return; }
  else if(act==="amt-open"||act==="amt-toggle"){
    const a=document.querySelector(".amt"); if(!a) return;
    const open=act==="amt-open"?true:!a.classList.contains("open");
    a.classList.toggle("open",open); ui.amtOpen=open;
    const i=document.getElementById("portion"); if(i){ if(open){ i.focus(); i.select(); } else i.blur(); }
    return;
  }
  else if(act==="back-scan"){ ui.scanView="list"; openModal("scan"); return; }
  else if(act==="portion-set"){ ui.portion=+el.dataset.v; }
  else if(act==="log-food"){
    const input=document.getElementById("portion");
    const portion=Math.max(5, +(input&&input.value||ui.portion)||100);
    day().meals.push({ uid:uid(), id:el.dataset.id, portion, slot:ui.addSlot });
    syncAuto(state.date); ui.modal=null; save(); toast("Im Tagebuch");
  }
  else if(act==="del-meal"){ day().meals=day().meals.filter(m=>m.uid!==el.dataset.id); syncAuto(state.date); save(); }
  else if(act==="save-custom"){
    const name=(document.getElementById("c-name").value||"").trim();
    if(!name){ toast("Name fehlt"); return; }
    const item={ id:"c-"+uid(), type:"custom", name, brand:"Eigen", emoji:"🍽", kcal:+document.getElementById("c-kcal").value||0, protein:+document.getElementById("c-p").value||0, carbs:+document.getElementById("c-c").value||0, fat:+document.getElementById("c-f").value||0, sugar:0, processed:false };
    const bcEl=document.getElementById("c-bc"); if(bcEl&&bcEl.value.trim()) item.bc=bcEl.value.replace(/\D/g,"");
    state.customs.push(item);
    ui.scanView="list";
    day().meals.push({ uid:uid(), id:item.id, portion:100, slot:ui.addSlot||"snack" });
    syncAuto(state.date); ui.modal=null; save(); toast("Angelegt");
  }
  else if(act==="water"){ day().water = day().water===+el.dataset.v ? +el.dataset.v-1 : +el.dataset.v; syncAuto(state.date); save(); }
  else if(act==="sleep-adj"){ const d=day(); d.sleep=d.sleep==null?7:Math.max(0,Math.min(14,Math.round((d.sleep+ +el.dataset.v)*2)/2)); save(); }
  else if(act==="water-add"){ day().water=(day().water||0)+1; syncAuto(state.date); save(); }
  else if(act==="water-sub"){ day().water=Math.max(0,(day().water||0)-1); syncAuto(state.date); save(); }
  else if(act==="task"){
    const id=el.dataset.id;
    if(id==="wasser"){ state.tab="heute"; }
    else if(id==="sups"){ openModal("stack"); return; }
    else if(id==="sport"){ if(!taskOn("sport")){ state.tab="sport"; } else day().checks.sport=0; }
    else if(id==="essen"){ state.tab="heute"; }
    else day().checks[id]=day().checks[id]?0:1;
    save();
  }
  else if(act==="check"){ day().checks[el.dataset.id]=1; syncAuto(state.date); ui.modal=null; save(); toast("Notiert"); }
  else if(act==="take"){ day().taken[el.dataset.id]=day().taken[el.dataset.id]?0:1; syncAuto(state.date); save(); }
  else if(act==="toggle-stack"){
    const id=el.dataset.id;
    state.stack = state.stack.includes(id) ? state.stack.filter(x=>x!==id) : state.stack.concat(id);
    save(); toast(state.stack.includes(id)?"Im Stack":"Entfernt");
  }
  else if(act==="apply-stack"){ state.stack=recommendStack().map(x=>x.id); save(); toast("Stack aktualisiert"); }
  else if(act==="coach-answer"){
    const A=state.coach.answers[el.dataset.topic]=state.coach.answers[el.dataset.topic]||{};
    const qd=coachQuiz(el.dataset.topic).find(q=>q.k===el.dataset.k);
    A[el.dataset.k]=qd&&qd.multi?toggleMulti(A[el.dataset.k],el.dataset.v,qd.none):el.dataset.v; save();
  }
  else if(act==="coach-ready"){ save(); }
  else if(act==="coach-reset"){ delete state.coach.answers[el.dataset.topic]; save(); }
  else if(act==="coach-add"){
    const topic=el.dataset.topic;
    const advice=coachAdvice(topic);
    if(!advice.routine) return;
    state.coach.routine=state.coach.routine.filter(r=>r.topic!==topic).concat([{id:topic+"-r", topic, title:advice.routine.title, detail:advice.routine.detail, product:null}]);
    ui.modal=null; save(); toast("In der Routine");
  }
  else if(act==="coach-goal"){ state.profile.goal=el.dataset.v; const r=(state.coach.routine||[]).find(x=>x.topic==="aussehen"); if(r) r.title=coachAdvice("aussehen").routine.title; save(); toast(`Neuer Richtwert: ${de(targets().kcal)} kcal`); }
  else if(act==="coach-remove"){ state.coach.routine=(state.coach.routine||[]).filter(r=>r.topic!==el.dataset.topic); ui.modal=null; save(); toast("Aus der Routine entfernt"); }
  else if(act==="r-toggle"){ ui.rOpen=!ui.rOpen; }
  else if(act==="c-toggle"){ ui.cOpen=!ui.cOpen; }
  else if(act==="rhint"){ state.rHint=1; save(); }
  else if(act==="r-pick"){ state.date=el.dataset.v; ui.rcal="day"; save(); }
  else if(act==="rcal-mode"){ ui.rcal=el.dataset.v; ui.rOff=0; }
  else if(act==="rcal-nav"){ ui.rOff=Math.min(0,(ui.rOff||0)+ +el.dataset.v); }
  else if(act==="routine-add"){
    const i=document.getElementById("r-new"), t=(i&&i.value||"").trim();
    if(!t){ toast("Name fehlt"); return; }
    state.coach.routine=(state.coach.routine||[]).concat([{id:"u-"+uid(),topic:"eigen",title:t.slice(0,60),detail:"",product:null}]); save();
  }
  else if(act==="routine-del"){ state.coach.routine=(state.coach.routine||[]).filter(r=>r.id!==el.dataset.id); save(); }
  else if(act==="routine-check"){
    day().routine=day().routine||{};
    day().routine[el.dataset.id]=day().routine[el.dataset.id]?0:1;
    save();
  }
  else if(act==="skin"){ state.skin[el.dataset.k]=el.dataset.v; save(); }
  else if(act==="skin-done"){ state.hautPlan=true; save(); toast("Plan gespeichert"); }
  else if(act==="mark-pflege"){ day().checks.pflege=1; ui.modal=null; save(); toast("Pflege notiert"); }
  else if(act==="draft"){ ui.draftKg=Math.max(35, Math.min(220, +(ui.draftKg+ +el.dataset.d).toFixed(1))); }
  else if(act==="save-weight"){
    state.weights=state.weights.filter(w=>w.date!==state.date).concat({date:state.date, kg:+ui.draftKg}).sort((a,b)=>a.date<b.date?-1:1);
    p.weight=+ui.draftKg; ui.modal=null; save(); toast("Gewicht gespeichert");
  }
  else if(act==="toggle"){ p[el.dataset.k]=!p[el.dataset.k]; save(); }
  else if(act==="start-empty"){
    ui.workout={ name:"Training", t0:Date.now(), routineId:null, exercises:[] };
    ui.modal=null; startTick();
  }
  else if(act==="start-wo"){
    const r=(state.routines||[]).find(x=>x.id===el.dataset.rid);
    const d=r && (r.days||[]).find(x=>x.id===el.dataset.did);
    if(!d){ toast("Trainingstag fehlt"); return; }
    ui.workout={ name:r.name+" · "+d.name, routineId:r.id, dayId:d.id, t0:Date.now(), exercises:(d.exercises||[]).map(e=>({id:e.id, sets:e.sets.map(s=>({kg:s.kg, reps:s.reps, done:false}))})) };
    ui.modal=null; startTick();
  }
  else if(act==="new-plan"){ ui.plan={ id:null, name:"", days:[{id:uid(), name:"Tag 1", exercises:[]}] }; ui.modal=null; }
  else if(act==="edit-plan"){
    const r=(state.routines||[]).find(x=>x.id===el.dataset.id);
    if(!r) return;
    ui.plan=JSON.parse(JSON.stringify(r));
  }
  else if(act==="cancel-plan") ui.plan=null;
  else if(act==="save-plan"){
    const name=(ui.plan.name||"").trim()||"Plan";
    ui.plan.name=name;
    if(ui.plan.id){
      state.routines=state.routines.map(r=>r.id===ui.plan.id?ui.plan:r);
    } else {
      ui.plan.id=uid();
      state.routines=state.routines.concat(ui.plan);
    }
    ui.plan=null; save(); toast("Plan gespeichert");
  }
  else if(act==="del-plan"){
    state.routines=state.routines.filter(r=>r.id!==ui.plan.id);
    ui.plan=null; save(); toast("Plan gelöscht");
  }
  else if(act==="add-day"){ ui.plan.days.push({id:uid(), name:"Tag "+(ui.plan.days.length+1), exercises:[]}); }
  else if(act==="del-day"){ ui.plan.days.splice(+el.dataset.d,1); }
  else if(act==="open-day-ex"){ ui.planDay=+el.dataset.d; openModal("plan-ex"); return; }
  else if(act==="plan-add-ex"){
    const day=ui.plan.days[ui.planDay]||ui.plan.days[0];
    day.exercises.push({id:el.dataset.id, sets:[{kg:20,reps:8},{kg:20,reps:8},{kg:20,reps:8}]});
    ui.modal=null;
  }
  else if(act==="plan-del-ex"){ ui.plan.days[+el.dataset.d].exercises.splice(+el.dataset.e,1); }
  else if(act==="add-custom-ex"){
    const input=document.getElementById("custom-ex");
    const name=(input&&input.value||"").trim();
    if(!name){ toast("Name fehlt"); return; }
    const id="x-"+uid();
    state.customEx=state.customEx||[];
    state.customEx.push({id, name});
    if(el.dataset.mode==="plan" && ui.plan){ const day=ui.plan.days[ui.planDay]||ui.plan.days[0]; day.exercises.push({id, sets:[{kg:20,reps:8},{kg:20,reps:8}]}); }
    else if(ui.workout) ui.workout.exercises.push({id, sets:[{kg:20,reps:8,done:false}]});
    ui.modal=null; save();
  }
  else if(act==="cancel-wo"){ ui.workout=null; stopTick(); }
  else if(act==="finish-wo"){
    const w=ui.workout;
    const sets=w.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.done).length,0);
    const vol=w.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.done).reduce((a,s)=>a+s.kg*s.reps,0),0);
    if(!sets){ toast("Mindestens einen Satz abhaken"); return; }
    state.workouts.push({ id:uid(), date:state.date, name:w.name, min:Math.max(1,Math.floor((Date.now()-w.t0)/60000)), seconds:Math.floor((Date.now()-w.t0)/1000), volume:vol, sets, exercises:w.exercises });
    day().checks.sport=1; ui.workout=null; stopTick(); save(); toast("Training gespeichert");
  }
  else if(act==="toggle-set"){
    const s=ui.workout.exercises[+el.dataset.e].sets[+el.dataset.s];
    s.done=!s.done;
    if(s.done) ui.rest=90;
  }
  else if(act==="add-set"){ const sets=ui.workout.exercises[+el.dataset.e].sets; const last=sets[sets.length-1]||{kg:20,reps:8}; sets.push({kg:last.kg,reps:last.reps,done:false}); }
  else if(act==="del-ex"){ ui.workout.exercises.splice(+el.dataset.e,1); }
  else if(act==="add-ex"){ ui.workout.exercises.push({id:el.dataset.id, sets:[{kg:40,reps:8,done:false}]}); ui.modal=null; }
  else if(act==="rest-skip") ui.rest=0;
  else if(act==="dash-close") ui.dash=null;
  else if(act==="cal-mode") ui.cal=el.dataset.v;
  else if(act==="cal-day"){
    const hits=workoutOn(el.dataset.v);
    if(hits[0]) openModal("wo-detail", hits[0].id);
    else toast("Kein Training an dem Tag");
    return;
  }
  else if(act==="save-measure"){
    state.measures=state.measures||[];
    const row={date:todayIso()};
    ["chest","waist","arm","hip","thigh"].forEach(k=>{ const n=document.getElementById("m-"+k); row[k]=n?+n.value||0:0; });
    state.measures=state.measures.filter(m=>m.date!==todayIso()).concat(row);
    save(); toast("Messung gespeichert");
  }
  else if(act==="wrange"){ ui.wrange=el.dataset.v; ui.wpick=null; }
  else if(act==="w-pick"){ ui.wpick=el.dataset.v; }
  else if(act==="plan-step"){
    const key="p-"+el.dataset.id+"-"+el.dataset.i;
    day().checks[key]=day().checks[key]?0:1;
    if(el.dataset.id==="schlaf") day().checks.schlaf = coachPlans().schlaf.steps.every((_,i)=>day().checks["p-schlaf-"+i])?1:0;
    if(el.dataset.id==="haut"||el.dataset.id==="haare"||el.dataset.id==="koerper"){
      const id=el.dataset.id;
      day().checks.pflege = coachPlans()[id].steps.every((_,i)=>day().checks["p-"+id+"-"+i])?1:day().checks.pflege;
    }
    save();
  }
  else if(act==="haut-reset"){ state.hautPlan=false; save(); }
  else if(act==="goal-weeks"){ state.profile.goalDate=addDays(todayIso(), 7*8); save(); toast("Ziel in 8 Wochen"); }
  else if(act==="affiliate") toast("Anzeige · Score bleibt gleich");
  else if(act==="w-edit"){ const w=state.weights.find(x=>x.date===el.dataset.v); if(!w) return; ui.draftKg=w.kg; openModal("w-edit", w.date); ui.confirmDel=false; render(); return; }
  else if(act==="w-edit-step"){ const i=document.getElementById("w-edit-kg"); const v=+((i&&i.value)||ui.draftKg).toString().replace(",","."); ui.draftKg=Math.max(35,Math.min(220,+((v||ui.draftKg)+ +el.dataset.d).toFixed(1))); if(i){ i.value=ui.draftKg.toFixed(1); return; } }
  else if(act==="w-save"){
    const i=document.getElementById("w-edit-kg"), kg=+(String(i&&i.value||"").replace(",","."));
    if(!(kg>=35&&kg<=220)){ toast("Bitte 35–220 kg eingeben"); return; }
    const w=state.weights.find(x=>x.date===el.dataset.v); if(!w) return;
    w.kg=+kg.toFixed(1); p.weight=lastWeight(); ui.modal={type:"entries"}; save(); toast("Gespeichert");
  }
  else if(act==="w-del-ask"){ ui.confirmDel=true; }
  else if(act==="del-cancel"){ ui.confirmDel=false; }
  else if(act==="w-del-go"){
    const d=ui.modal&&ui.modal.payload;
    state.weights=state.weights.filter(x=>x.date!==d);
    if(state.weights.length) p.weight=lastWeight();
    ui.confirmDel=false; ui.modal={type:"entries"}; save(); toast("Eintrag gelöscht");
  }
  else if(act==="wo-edit"){
    const w=state.workouts.find(x=>x.id===el.dataset.id); if(!w) return;
    const c=JSON.parse(JSON.stringify(w));
    c.exercises=(c.exercises||[]).map(e=>({...e, sets:(e.sets||[]).filter(s=>s.done)})).filter(e=>e.sets.length);
    ui.woEdit=c; openModal("wo-edit"); return;
  }
  else if(act==="wo-del-set"){ const e=ui.woEdit.exercises[+el.dataset.e]; e.sets.splice(+el.dataset.s,1); if(!e.sets.length) ui.woEdit.exercises.splice(+el.dataset.e,1); }
  else if(act==="wo-save"){
    const c=ui.woEdit; if(!c) return;
    const orig=state.workouts.find(x=>x.id===c.id); if(!orig) return;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(c.date||"")||c.date>todayIso()){ toast("Bitte ein gültiges Datum wählen"); return; }
    c.name=String(c.name||"").trim().slice(0,60)||"Training";
    c.min=Math.max(1,Math.round(+c.min||orig.min||1)); c.seconds=c.min*60;
    if((orig.exercises||[]).length){
      c.sets=c.exercises.reduce((n,e)=>n+e.sets.length,0);
      if(!c.sets){ toast("Kein Satz mehr übrig – lösch das Training stattdessen"); return; }
      c.volume=Math.round(c.exercises.reduce((n,e)=>n+e.sets.reduce((a,s)=>a+s.kg*s.reps,0),0));
    }
    const oldDate=orig.date;
    state.workouts=state.workouts.map(x=>x.id===c.id?c:x).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
    syncSport(oldDate); syncSport(c.date); if(!state.days[c.date]){ day(c.date); syncSport(c.date); }
    ui.woEdit=null; ui.modal={type:"wo-detail",payload:c.id}; save(); toast("Gespeichert");
  }
  else if(act==="wo-del-ask"){ openModal("wo-del", el.dataset.id); return; }
  else if(act==="wo-del-go"){
    const w=state.workouts.find(x=>x.id===el.dataset.id); if(!w) return;
    state.workouts=state.workouts.filter(x=>x.id!==w.id); syncSport(w.date);
    ui.modal=null; save(); toast("Training gelöscht");
  }
  else if(act==="import-pick"){ pickImport(); return; }
  else if(act==="import-go"){
    if(!ui.importData) return;
    state=ui.importData; state.onboarded=!!state.profile.adult; state.tab="profil";
    ui.importData=null; ui.modal=null; ui.workout=null; ui.plan=null; ui.dash=null;
    save(); toast("Daten importiert");
  }
  else if(act==="reset"){ ui.resetTxt=""; openModal("reset"); return; }
  else if(act==="backup"){ downloadBackup(); return; }
  else if(act==="reset-go"){
    if((ui.resetTxt||"").trim().toUpperCase()!=="LÖSCHEN") return;
    try{ localStorage.removeItem(KEY); }catch(e){} state=fresh(); ui.resetTxt=""; ui.modal=null; toast("Alle Daten gelöscht");
  }
  render();
});
document.getElementById("app").addEventListener("input", e=>{
  const el=e.target.closest("[data-act]"); if(!el) return;
  if(el.dataset.act==="input"){ state.profile[el.dataset.k]=el.value; save(); }
  if(el.dataset.act==="ob-num"){
    const k=el.dataset.k, v=parseFloat(String(el.value).replace(",","."));
    if(isFinite(v)){ state.profile[k]=v; obMark(k); if(k==="weight"&&!state.ob.target) state.profile.target=obDefaultTarget(); save(); }
    const h=document.getElementById("ob-hint"); if(h) h.innerHTML=obNumHint(k);
  }
  if(el.dataset.act==="reset-type"){ ui.resetTxt=el.value; const b=document.getElementById("reset-go"); if(b) b.disabled=el.value.trim().toUpperCase()!=="LÖSCHEN"; }
  if(el.dataset.act==="query"){
    ui.query=el.value; ui.scanMax=30;
    const box=document.getElementById("scan-results");
    if(box) box.innerHTML=scanResults(); else render();
  }
  if(el.dataset.act==="ai-g"){ const k=+el.dataset.i, it=(ui.aiRes||[])[k]; if(it){ it.grams=Math.max(0,+el.value||0); const kc=document.getElementById("ai-k"+k), tt=document.getElementById("ai-tot"); if(kc) kc.textContent=Math.round(it.kcal*it.grams/100); if(tt) tt.textContent=ui.aiRes.reduce((t,x)=>t+Math.round(x.kcal*x.grams/100),0); } }
  if(el.dataset.act==="portion-in"){ ui.portion=+el.value||0; const it=allItems().find(p=>p.id===el.dataset.id), b=document.getElementById("fmacros"), t=document.getElementById("ftable"), v=document.getElementById("amt-val"); if(it){ if(b) b.innerHTML=fMacros(it,ui.portion); if(t) t.innerHTML=fTable(it,ui.portion); } if(v) v.textContent=ui.portion||0; }
  if(el.dataset.act==="w-kg"){ const v=+String(el.value).replace(",","."); if(v) ui.draftKg=v; }
  if(el.dataset.act==="wo-f"&&ui.woEdit){ ui.woEdit[el.dataset.k]=el.value; }
  if(el.dataset.act==="wo-set"&&ui.woEdit){ const st=ui.woEdit.exercises[+el.dataset.e].sets[+el.dataset.s]; st[el.dataset.f]=Math.max(0,+String(el.value).replace(",",".")||0); }
  if(el.dataset.act==="set-kg") ui.workout.exercises[+el.dataset.e].sets[+el.dataset.s].kg=+el.value||0;
  if(el.dataset.act==="set-reps") ui.workout.exercises[+el.dataset.e].sets[+el.dataset.s].reps=+el.value||0;
  if(el.dataset.act==="plan-name") ui.plan.name=el.value;
  if(el.dataset.act==="day-name") ui.plan.days[+el.dataset.d].name=el.value;
  if(el.dataset.act==="plan-kg") ui.plan.exercises[+el.dataset.e].sets[+el.dataset.s].kg=+el.value||0;
  if(el.dataset.act==="plan-reps") ui.plan.exercises[+el.dataset.e].sets[+el.dataset.s].reps=+el.value||0;
  if(el.dataset.act==="ex-query"){
    ui.exQuery=el.value; render();
    const n=document.querySelector('input[data-act="ex-query"]');
    if(n){ n.focus(); n.setSelectionRange(ui.exQuery.length, ui.exQuery.length); }
  }
});
render();

if("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load",()=>{ try{ navigator.serviceWorker.register("sw.js").catch(()=>{}); }catch(e){} });

let swipeY=null;
document.getElementById("app").addEventListener("touchstart",e=>{ swipeY=e.target.closest(".amt.open")?e.touches[0].clientY:null; },{passive:true});
document.getElementById("app").addEventListener("touchend",e=>{
  if(swipeY==null) return; const dy=e.changedTouches[0].clientY-swipeY; swipeY=null;
  if(dy>50){ const a=document.querySelector(".amt"); if(a){ a.classList.remove("open"); ui.amtOpen=false; const i=document.getElementById("portion"); if(i) i.blur(); } }
},{passive:true});
loadFoodDb();
