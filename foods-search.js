// Health Maxxing – Lebensmittel-Datenbank und Suche, Texterkennung von Mahlzeiten
const BC_ICON=`<svg width="34" height="34" viewBox="0 0 34 34"><g fill="currentColor"><rect x="4" y="7" width="2" height="16"/><rect x="8" y="7" width="3" height="16"/><rect x="13" y="7" width="1.5" height="16"/><rect x="17" y="7" width="3" height="16"/><rect x="22" y="7" width="2" height="16"/><rect x="26" y="7" width="3" height="16"/></g><rect x="3" y="15" width="28" height="2" fill="#e5483a"/></svg>`;  // Balken in Textfarbe, Laser-Strich rot
const FOODDB={rows:[],lc:[],by:new Map(),ok:false};
async function loadFoodDb(){
  if(!location.protocol.startsWith("http")) return;
  try{ const r=await fetch("foods.json"); if(!r.ok) return;
    // Erster Besuch (noch ohne Service Worker): Datei gleich für offline speichern, sonst fehlt sie beim ersten Offline-Start
    if(window.caches&&!(navigator.serviceWorker&&navigator.serviceWorker.controller)){ const cp=r.clone(); caches.open("forma-data").then(c=>c.put("foods.json",cp)).catch(()=>{}); }
    const j=await r.json();
    FOODDB.rows=j.rows||[]; FOODDB.nm=FOODDB.rows.map(x=>NORM(x[1])); FOODDB.lc=FOODDB.rows.map(x=>NORM(x[1]+" "+(x[2]||"")));
    FOODDB.rows.forEach((x,i)=>FOODDB.by.set(x[0],i)); FOODDB.ok=FOODDB.rows.length>0; if(FOODDB.ok) render();
  }catch(e){}
}
function dbItem(x){ return {id:"db-"+x[0],type:"custom",src:"off",name:x[1],brand:x[2]||"",emoji:"📦",kcal:Math.round(x[3]),protein:x[4]||0,carbs:x[5]||0,fat:x[6]||0,sugar:x[7]??undefined,fiber:x[8]??undefined,salt:x[9]??undefined,sat:x[10]??undefined,processed:(x[11]||0)>=4,nova:x[11]||undefined,bc:x[0]}; }
function qTokens(q){ return NORM(q).split(/\s+/).filter(Boolean).map(w=>w.length>=7?w.replace(/(en|n|e|s)$/,""):w); }
function hay(p){ return NORM(p.name+" "+(p.brand||"")+" "+((p.al||[]).join(" "))); }
function foodRank(p,q){
  const qn=NORM(q).trim(); if(!qn) return 5;
  const n=NORM(p.name), als=(p.al||[]).map(NORM);
  if(n===qn) return 0; if(als.includes(qn)) return 1; if(n.startsWith(qn)) return 2; if(als.some(a=>a.startsWith(qn))) return 3;
  if(n.split(" ").some(w=>w.startsWith(qn))) return 4; return 5;
}
function rankSort(list,q){ const k=p=>{ const r=foodRank(p,q); return r*1000+(r>=2?Math.min(p.name.length,200):0); }; return list.map((p,i)=>[k(p),i,p]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x[2]); }
function dbSearch(q,limit){
  const ts=qTokens(q); if(!ts.length) return [];
  const res=[];
  for(let i=0;i<FOODDB.lc.length;i++){
    const s=FOODDB.lc[i]; let sc=0, ok=true;
    for(const w of ts){ const p=s.indexOf(w); if(p<0){ ok=false; break; } sc+=p===0?3:(s[p-1]===" "?2:0); }
    if(!ok) continue;
    const n=FOODDB.nm[i]; if(n.startsWith(ts[0])) sc+=2;
    sc-=Math.min(n.length,60)/60;
    res.push([sc,i]);
  }
  res.sort((x,y)=>y[0]-x[0]||x[1]-y[1]);
  return res.slice(0,limit||30).map(r=>dbItem(FOODDB.rows[r[1]]));
}
function dbGet(code){ let i=FOODDB.by.get(code); if(i==null) i=FOODDB.by.get("0"+code); if(i==null&&code.length===13&&code[0]==="0") i=FOODDB.by.get(code.slice(1)); return i==null?null:dbItem(FOODDB.rows[i]); }
function ensureDb(id){ id=String(id); if(id.startsWith("db-")&&!foods().some(x=>x.id===id)){ const it=dbGet(id.slice(3)); if(it){ state.customs.push(it); save(); } } }
const U_G={g:1,gramm:1,kg:1000,ml:1,l:1000,liter:1000,el:10,"esslöffel":10,essloeffel:10,tl:4,"teelöffel":4,teeloeffel:4,tasse:200,tassen:200,glas:200,"gläser":200,glaeser:200,becher:150,schale:150,schalen:150,portion:100,portionen:100,handvoll:30,dose:250,dosen:250,teller:350,"schüssel":300,"schüsseln":300,schuessel:300,flasche:500,flaschen:500,kugel:50,kugeln:50,prise:1,prisen:1};
const U_P=["scheibe","scheiben","stück","stueck","stücke","stuecke","stk","riegel"];
const isG=u=>!!u&&Object.prototype.hasOwnProperty.call(U_G,u), isP=u=>!!u&&U_P.includes(u);
const PIECE={ei:60,eier:60,apfel:180,"äpfel":180,banane:120,bananen:120,birne:170,orange:150,"brötchen":60,broetchen:60,semmel:60,brezel:80,croissant:60,tomate:100,tomaten:100,avocado:150,kiwi:75,mandarine:80,kartoffel:90,kartoffeln:90,riegel:40,joghurt:150,skyr:150,"würstchen":50,wurst:50};
const SLICE={brot:40,toast:25,"käse":25,kaese:25,wurst:15,salami:15,schinken:15};
const DEF={butter:10,margarine:10,"öl":10,oel:10,"olivenöl":10,marmelade:20,honig:15,zucker:5,kaffee:200,tee:200,wasser:250,milch:200,saft:200,cola:330};
const NUMW={ein:1,eine:1,einen:1,einem:1,einer:1,zwei:2,drei:3,vier:4,"fünf":5,fuenf:5,sechs:6,halb:.5,halbe:.5,halben:.5,halbes:.5,anderthalb:1.5};
// Synonyme, die nicht schon als Alias in der Datenbank stehen (Schluessel = ganzer Name nach dem Normalisieren)
const SYN={"protein shake":"proteinpulver","eiweissshake":"proteinpulver","eiweiss shake":"proteinpulver","weissbrot":"toastbrot","vollkornbroetchen":"brötchen","kaffee schwarz":"kaffee","spaghetti":"nudeln gekocht","hahnchen":"hähnchenbrust","hahnchenfleisch":"hähnchenbrust","huhn":"hähnchenbrust"};
function matchFood(name){
  const syn=SYN[NORM(name).trim()]; if(syn) name=syn;
  const strict=["butter","ol","oel","salz"].includes(NORM(name).trim());
  const sing=w=>w.length>3?w.replace(/(er|en|n|e|s)$/,""):w;
  const variants=[name,name.split(/\s+/).map(sing).join(" ")];
  for(const q of variants){
    const ts=qTokens(q); if(!ts.length) continue;
    const pool=foods().filter(p=>!p.hidden&&!String(p.id).startsWith("db-")&&!String(p.id).startsWith("off-"));
    const qn=NORM(q).trim(), loc=rankSort(pool.filter(p=>{ const x=NORM(p.name+" "+(p.brand||"")); return (!strict&&ts.every(w=>x.includes(w)))||NORM(p.name)===qn||(p.al||[]).some(a=>NORM(a)===qn); }),q);
    if(loc[0]) return loc[0];
    if(FOODDB.ok){ const d=dbSearch(q,1); if(d[0]) return d[0]; }
  }
  return null;
}
function smartParse(text){
  const segs=text.toLowerCase().replace(/(\d),(\d)/g,"$1.$2").replace(/\b(ca\.?|etwa|ungefähr|circa|so)\b/g," ").split(/,|;|\n|\+|&|\bund\b|\bmit\b|\bsowie\b|\bdazu\b|\bplus\b/).map(x=>x.trim()).filter(Boolean);
  const items=[], miss=[];
  for(const seg of segs){
    const tk=seg.split(/\s+/); let i=0, qty=null, unit=null;
    const mm=tk[0].match(/^(\d+(?:[.,]\d+)?)([a-zäöüß]*)$/);
    if(mm){ qty=parseFloat(mm[1].replace(",",".")); if(mm[2]&&(isG(mm[2])||isP(mm[2]))) unit=mm[2]; i=1; }
    else if(NUMW[tk[0]]!==undefined){ qty=NUMW[tk[0]]; i=1; if(qty===1&&tk[1]&&String(tk[1]).startsWith("halb")){ qty=.5; i=2; } }
    if(unit==null&&tk[i]&&(isG(tk[i])||isP(tk[i]))&&tk.length>i+1){ unit=tk[i]; i++; }
    while(["von","vom","an","aus","der","die","das","dem"].includes(tk[i])) i++;
    let name=tk.slice(i).join(" ");
    if(!name&&unit&&isP(unit)){ name=unit; unit=null; }
    if(!name){ miss.push(seg); continue; }
    const f=matchFood(name);
    if(!f){ miss.push(name); continue; }
    // Gramm aus Stueck/Scheibe/Portion: erst Daten der Datenbank, dann alte Tabellen, dann Standard
    const words=name.split(/\s+/), pw=f.pieceG||words.map(w=>PIECE[w]).find(Boolean)||0, sw=f.sliceG||words.map(w=>SLICE[w]).find(Boolean)||0;
    let grams;
    if(unit&&/^scheibe/.test(unit)) grams=(qty||1)*(sw||30);
    else if(unit&&isP(unit)) grams=(qty||1)*(pw||100);
    else if(unit==="portion"||unit==="portionen") grams=(qty||1)*(pw>=50?pw:100);
    else if(unit==="teller"||unit==="schüssel"||unit==="schüsseln"||unit==="schuessel") grams=(qty||1)*(pw>=250?pw:((f.kcal||0)>300?80:U_G[unit]));
    else if(unit==="flasche"||unit==="flaschen"||unit==="dose"||unit==="dosen") grams=(qty||1)*(pw||U_G[unit]);
    else if(unit) grams=(qty||1)*U_G[unit];
    else if(qty!=null) grams=qty*(pw||sw||100);
    else grams=words.map(w=>DEF[w]).find(Boolean)||(pw>=50?pw:100);
    items.push({name:f.name,brand:f.brand||"",grams:Math.round(grams),kcal:f.kcal||0,protein:f.protein||0,carbs:f.carbs||0,fat:f.fat||0,sugar:f.sugar||0,processed:!!f.processed,ref:f.id});
  }
  return {items,miss};
}
