// Health Maxxing – Lebensmittel-Datenbank und Suche (die Texterkennung steht in texterkennung.js)
const BC_ICON=`<svg width="34" height="34" viewBox="0 0 34 34"><g fill="currentColor"><rect x="4" y="7" width="2" height="16"/><rect x="8" y="7" width="3" height="16"/><rect x="13" y="7" width="1.5" height="16"/><rect x="17" y="7" width="3" height="16"/><rect x="22" y="7" width="2" height="16"/><rect x="26" y="7" width="3" height="16"/></g><rect x="3" y="15" width="28" height="2" fill="#e5483a"/></svg>`;  // Balken in Textfarbe, Laser-Strich rot
const FOODDB={rows:[],lc:[],by:new Map(),ok:false};
async function loadFoodDb(){
  if(!location.protocol.startsWith("http")) return;
  try{ const r=await fetch("foods.json"); if(!r.ok) return;
    // Erster Besuch (noch ohne Service Worker): Datei gleich für offline speichern, sonst fehlt sie beim ersten Offline-Start
    if(window.caches&&!(navigator.serviceWorker&&navigator.serviceWorker.controller)){ const cp=r.clone(); caches.open("forma-data").then(c=>c.put("foods.json",cp)).catch(()=>{}); }
    const j=await r.json();
    FOODDB.rows=j.rows||[]; FOODDB.nm=FOODDB.rows.map(x=>NORM(x[1])); FOODDB.lc=FOODDB.rows.map(x=>NORM(x[1]+" "+(x[2]||"")));
    FOODDB.rows.forEach((x,i)=>FOODDB.by.set(x[0],i)); FOODDB.ok=FOODDB.rows.length>0;
    if(!FOODDB.ok) return;
    // Tippt jemand gerade (Suche, Name, Text)? Dann nur die Trefferliste auffrischen, sonst geht die Tastatur zu.
    const a=document.activeElement;
    if(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)){
      const box=document.getElementById("scan-results"); if(box) box.innerHTML=scanResults();
      if(a.id==="ai-text"&&typeof aiTyped==="function") aiTyped(a.value);
    } else render();
  }catch(e){}
}
function dbItem(x){ return {id:"db-"+x[0],type:"custom",src:"off",name:x[1],brand:x[2]||"",emoji:(typeof supEmoji==="function"&&supEmoji({name:x[1],protein:x[4],sugar:x[7],kcal:x[3]}))||"📦",kcal:Math.round(x[3]),protein:x[4]||0,carbs:x[5]||0,fat:x[6]||0,sugar:x[7]??undefined,fiber:x[8]??undefined,salt:x[9]??undefined,sat:x[10]??undefined,processed:(x[11]||0)>=4,nova:x[11]||undefined,bc:x[0]}; }
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
