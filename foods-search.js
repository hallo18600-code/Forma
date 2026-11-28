// Netz/Dateien abrufbar? Im Browser über http(s), in der Store-App (Capacitor, z. B. capacitor://) immer
function webOk(){ return location.protocol.startsWith("http")||!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()); }
// Life Maxxing – Lebensmittel-Datenbank und Suche (die Texterkennung steht in texterkennung.js)
const BC_ICON=`<svg width="34" height="34" viewBox="0 0 34 34"><g fill="currentColor"><rect x="4" y="7" width="2" height="16"/><rect x="8" y="7" width="3" height="16"/><rect x="13" y="7" width="1.5" height="16"/><rect x="17" y="7" width="3" height="16"/><rect x="22" y="7" width="2" height="16"/><rect x="26" y="7" width="3" height="16"/></g><rect x="3" y="15" width="28" height="2" fill="#e5483a"/></svg>`;  // Balken in Textfarbe, Laser-Strich rot
const FOODDB={rows:[],nm:[],lc:[],by:new Map(),ok:false};
async function loadFoodDb(){
  if(!webOk()) return;
  try{ const r=await fetch("foods.json"); if(!r.ok) return;
    // Erster Besuch (noch ohne Service Worker): Datei gleich für offline speichern, sonst fehlt sie beim ersten Offline-Start
    if(window.caches&&!(navigator.serviceWorker&&navigator.serviceWorker.controller)){ const cp=r.clone(); caches.open("forma-data").then(c=>c.put("foods.json",cp)).catch(()=>{}); }
    const j=await r.json();
    // Fehlen Protein, Kohlenhydrate oder Fett, müsste die App 0 g anzeigen – solche Zeilen fliegen raus (auch aus einer alten gespeicherten Datei)
    const rows=(j.rows||[]).filter(x=>x&&x[3]!=null&&x[4]!=null&&x[5]!=null&&x[6]!=null), nm=new Array(rows.length), lc=new Array(rows.length), bn=new Map();
    // Suchtexte in Häppchen vorbereiten: zwischendurch darf das Handy zeichnen und auf Tippen reagieren (kein Ruckeln beim Start)
    for(let i=0;i<rows.length;i++){
      const x=rows[i], n=NORM(x[1]); let b=bn.get(x[2]); if(b===undefined){ b=NORM(x[2]||""); bn.set(x[2],b); }
      nm[i]=n; lc[i]=n+" "+b;
      if(i%4000===3999) await new Promise(res=>setTimeout(res,0));
    }
    const by=new Map(); rows.forEach((x,i)=>by.set(x[0],i));
    Object.assign(FOODDB,{rows,nm,lc,by,ok:rows.length>0}); dbLast=null;
    if(!FOODDB.ok) return;
    dbRefresh();
    // Tippt jemand gerade (Suche, Name, Text)? Dann nur die Trefferliste auffrischen, sonst geht die Tastatur zu.
    const a=document.activeElement;
    if(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)){
      const box=document.getElementById("scan-results"); if(box) box.innerHTML=scanResults();
      if(a.id==="ai-text"&&typeof aiTyped==="function") aiTyped(a.value);
    } else render();
  }catch(e){}
}
function dbItem(x){ const it={id:"db-"+x[0],type:"custom",src:"off",name:x[1],brand:x[2]||"",emoji:"📦",kcal:Math.round(x[3]),protein:x[4]||0,carbs:x[5]||0,fat:x[6]||0,sugar:x[7]??undefined,fiber:x[8]??undefined,salt:x[9]??undefined,sat:x[10]??undefined,processed:(x[11]||0)>=4,nova:x[11]>0?x[11]:undefined,warn:x[12]&1?1:undefined,liquid:x[12]&2?true:x[12]&4?false:undefined,bc:x[0]};
  if(typeof supEmoji==="function") it.emoji=supEmoji(it)||catEmoji(it)||"📦";
  return it; }
// Spalte 12 (Bits, siehe build_foods.py): 1 = Kalorien passen nicht zu den Makros, 2 = Packung in ml, 4 = Packung in g
function qTokens(q){ return NORM(q).split(/\s+/).filter(Boolean).map(w=>w.length>=7?w.replace(/(en|n|e|s)$/,""):w); }
function hay(p){ return NORM(p.name+" "+(p.brand||"")+" "+((p.al||[]).join(" "))); }
function foodRank(p,q){
  const qn=NORM(q).trim(); if(!qn) return 5;
  const n=NORM(p.name), als=(p.al||[]).map(NORM);
  if(n===qn) return 0; if(als.includes(qn)) return 1; if(n.startsWith(qn)) return 2; if(als.some(a=>a.startsWith(qn))) return 3;
  if(n.split(" ").some(w=>w.startsWith(qn))) return 4; return 5;
}
function rankSort(list,q){ const k=p=>{ const r=foodRank(p,q); return r*1000+(r>=2?Math.min(p.name.length,200):0); }; return list.map((p,i)=>[k(p),i,p]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x[2]); }
// Letzte Suche merken: Wird der Suchtext nur länger (Buchstabe für Buchstabe), reicht es, die letzten Treffer weiter zu filtern.
let dbLast=null;
function dbSearch(q,limit){
  const ts=qTokens(q); if(!ts.length) return [];
  const narrow=dbLast&&dbLast.ts.every(o=>ts.some(t=>t.includes(o)));
  const cand=narrow?dbLast.hit:null, hit=[], n0=cand?cand.length:FOODDB.lc.length, K=limit||30;
  // Nur die besten K behalten (statt zehntausende Treffer zu sortieren): absteigend nach Punkten, bei Gleichstand frühere Zeile zuerst
  const top=[]; const add=(sc,i)=>{ if(top.length>=K&&sc<=top[top.length-1][0]) return; let lo=0, hi=top.length; while(lo<hi){ const m=(lo+hi)>>1; if(top[m][0]>=sc) lo=m+1; else hi=m; } top.splice(lo,0,[sc,i]); if(top.length>K) top.pop(); };
  for(let j=0;j<n0;j++){
    const i=cand?cand[j]:j, s=FOODDB.lc[i]; let sc=0, ok=true;
    for(const w of ts){ const p=s.indexOf(w); if(p<0){ ok=false; break; } sc+=p===0?3:(s[p-1]===" "?2:0); }
    if(!ok) continue;
    hit.push(i);
    const n=FOODDB.nm[i]; if(n.startsWith(ts[0])) sc+=2;
    sc-=Math.min(n.length,60)/60;
    const r=FOODDB.rows[i]; if((r[7]==null&&(r[5]||0)>0.5)||r[9]==null) sc-=1.5;   // Zucker oder Salz fehlen (kein Score): weiter nach hinten
    add(sc,i);
  }
  dbLast={ts,hit};
  return top.map(r=>dbItem(FOODDB.rows[r[1]]));
}
function dbGet(code){ let i=FOODDB.by.get(code); if(i==null) i=FOODDB.by.get("0"+code); if(i==null&&code.length===13&&code[0]==="0") i=FOODDB.by.get(code.slice(1)); return i==null?null:dbItem(FOODDB.rows[i]); }
// Schon gespeicherte Datenbank-Produkte mit der neuen Datenbank abgleichen (Nährwerte, Verarbeitungsgrad, Kalorien-Hinweis, Einheit).
// Datenbank-Produkte lassen sich in der App nicht bearbeiten, es geht also nichts Eigenes verloren.
function dbRefresh(){
  let ch=false;
  (state.customs||[]).forEach(c=>{ if(!c||!String(c.id).startsWith("db-")) return; const i=FOODDB.by.get(c.bc||String(c.id).slice(3)); if(i==null) return;
    const f=dbItem(FOODDB.rows[i]);
    // Von der Packung korrigierte Werte bleiben (die Datenbank hatte dort offensichtliche Fehler)
    if(c.fix){ Object.assign(f,c.fix); delete f.warn; }
    if(c.novaEst!=null){ delete c.novaEst; ch=true; }   // alte Schätzung (gibt es nicht mehr)
    // Nährwerte mit abgleichen: Wird ein Fehler in der Datenbank korrigiert, stimmt auch das gespeicherte Produkt wieder
    // Selbst von der Packung ergänzte Werte (Zucker, Salz) bleiben, solange die Datenbank dazu nichts hat
    if(c.fill){ for(const k of ["sugar","salt"]) if(c.fill[k]!=null){ if(f[k]==null) f[k]=k==="sugar"?Math.min(c.fill[k],+f.carbs||0):c.fill[k]; else { delete c.fill[k]; ch=true; } } if(!Object.keys(c.fill).length){ delete c.fill; ch=true; } }
    if(c.emoji==="📦"&&f.emoji&&f.emoji!=="📦"){ c.emoji=f.emoji; ch=true; }   // altes Kisten-Bild durch passendes ersetzen
    for(const k of ["name","brand","kcal","protein","carbs","fat","sugar","fiber","salt","sat","nova","processed","warn","liquid"]) if(c[k]!==f[k]&&!(c[k]==null&&f[k]==null)){ if(f[k]==null) delete c[k]; else c[k]=f[k]; ch=true; } });
  if(ch){ if(typeof SK_CAT!=="undefined") SK_CAT.clear(); save(); }
}
function ensureDb(id){ id=String(id); if(id.startsWith("db-")&&!foods().some(x=>x.id===id)){ const it=dbGet(id.slice(3)); if(it){ state.customs.push(it); save(); } } }
