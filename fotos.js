// Health Maxxing – Fortschrittsfotos: ganz unten im Verlauf, Vergleich nebeneinander.
// Fotos bleiben nur auf dem Gerät. Sie liegen in IndexedDB (nicht im normalen Speicher, der ist für Bilder zu klein)
// und sind deshalb NICHT in der Datensicherung (Datei) enthalten. „Alles löschen“ löscht sie mit.
// Jedes Foto wird beim Speichern verkleinert (längste Seite 1280 px, JPEG), damit der Speicher nicht vollläuft.
// Gewicht zum Foto: der letzte Wiege-Eintrag bis zu diesem Tag (wird immer neu gelesen, Änderungen zählen also mit).

const PH_DB="hm-photos", PH_STORE="p", PH_MAX=1280, PH_LIMIT=200;
const PH_CAM='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.3-2h5.2l1.3 2h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg>';

// ---------- Speicher (IndexedDB) ----------
function phOpen(){
  return new Promise((ok,no)=>{
    try{
      if(!window.indexedDB) return no(new Error("no-idb"));
      const r=indexedDB.open(PH_DB,1);
      r.onupgradeneeded=()=>{ if(!r.result.objectStoreNames.contains(PH_STORE)) r.result.createObjectStore(PH_STORE,{keyPath:"id"}); };
      r.onsuccess=()=>ok(r.result); r.onerror=()=>no(r.error||new Error("idb"));
    }catch(e){ no(e); }
  });
}
function phTx(mode,fn){
  return phOpen().then(db=>new Promise((ok,no)=>{
    const tx=db.transaction(PH_STORE,mode), st=tx.objectStore(PH_STORE); let res;
    try{ res=fn(st); }catch(e){ no(e); return; }
    tx.oncomplete=()=>{ db.close(); ok(res&&"result" in res?res.result:res); };
    tx.onerror=tx.onabort=()=>{ db.close(); no(tx.error||new Error("tx")); };
  }));
}
// Zwischenspeicher für die Anzeige: [{id,date,t,url}] sortiert alt → neu. null = noch nicht geladen.
let PH=null, PH_ERR=false;
function phSort(a){ return a.sort((x,y)=>x.date<y.date?-1:x.date>y.date?1:(x.t||0)-(y.t||0)); }
function phLoad(){
  return phTx("readonly",st=>st.getAll()).then(rows=>{
    (PH||[]).forEach(p=>{ try{ URL.revokeObjectURL(p.url); }catch(e){} });
    PH=phSort((rows||[]).filter(r=>r&&r.id&&r.blob&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)).map(r=>({id:String(r.id),date:r.date,t:r.t||0,url:URL.createObjectURL(r.blob)})));
    PH_ERR=false;
  }).catch(()=>{ PH=PH||[]; PH_ERR=true; });
}
function phClearAll(){ return phTx("readwrite",st=>st.clear()).catch(()=>{}).then(()=>{ (PH||[]).forEach(p=>{ try{ URL.revokeObjectURL(p.url); }catch(e){} }); PH=[]; ui.phSel=null; }); }

// ---------- Bild verkleinern ----------
function phShrink(file){
  return new Promise((ok,no)=>{
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=()=>{
      try{
        const k=Math.min(1,PH_MAX/Math.max(img.naturalWidth,img.naturalHeight)), w=Math.max(1,Math.round(img.naturalWidth*k)), h=Math.max(1,Math.round(img.naturalHeight*k));
        const c=document.createElement("canvas"); c.width=w; c.height=h; c.getContext("2d").drawImage(img,0,0,w,h);
        URL.revokeObjectURL(url);
        c.toBlob(b=>b?ok(b):no(new Error("blob")),"image/jpeg",0.82);
      }catch(e){ URL.revokeObjectURL(url); no(e); }
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); no(new Error("img")); };
    img.src=url;
  });
}
// Foto auswählen (Kamera oder Mediathek) und speichern
function phPick(){
  if((PH||[]).length>=PH_LIMIT){ toast("Höchstens "+PH_LIMIT+" Fotos"); return; }
  const inp=document.createElement("input");
  inp.type="file"; inp.accept="image/*"; inp.style.display="none";
  inp.addEventListener("change",async()=>{
    const f=inp.files&&inp.files[0]; inp.remove(); if(!f) return;
    if(!/^image\//.test(f.type||"image/")||f.size>40*1024*1024){ toast("Das ist kein passendes Bild"); return; }
    try{
      toast("Foto wird gespeichert…");
      const blob=await phShrink(f), rec={id:"ph-"+Date.now().toString(36)+uid(), date:todayIso(), t:Date.now(), blob};
      await phTx("readwrite",st=>st.put(rec));
      await phLoad(); ui.phSel=null; render(); toast("Foto gespeichert");
    }catch(e){ toast("Foto konnte nicht gespeichert werden"); }
  });
  document.body.appendChild(inp); inp.click();
}
async function phDelete(id){
  try{ await phTx("readwrite",st=>st.delete(id)); await phLoad(); ui.phSel=null; ui.modal=null; render(); toast("Foto gelöscht"); }
  catch(e){ toast("Löschen fehlgeschlagen"); }
}

// ---------- Anzeige ----------
// Gewicht am Tag des Fotos (letzter Eintrag bis dahin)
function phKg(date){
  let kg=null; (state.weights||[]).forEach(w=>{ if(w&&w.date<=date&&Number.isFinite(+w.kg)&&w.kg>0&&(kg===null||w.date>=kg.date)) kg={date:w.date,kg:+w.kg}; });
  return kg?kg.kg:null;
}
function phDate(s){ return parseIso(s).toLocaleDateString(LOC,{day:"numeric",month:"short"}); }
function phTag(p){ const kg=phKg(p.date); return `<span class="pf-tag notr">${esc(phDate(p.date))}${kg!=null?" · "+de(kg,1)+" kg":""}</span>`; }
function phDiff(a,b){
  const x=phKg(a.date), y=phKg(b.date); if(x==null||y==null||a.id===b.id) return "";
  const d=Math.round((y-x)*10)/10;
  return `<div class="pf-diff notr">${d>0?"+":d<0?"−":"±"}${de(Math.abs(d),1)} kg</div>`;
}
function phImg(p,cls){ return `<button class="pf-ph ${cls||""}" data-act="ph-open" data-id="${esc(p.id)}" aria-label="Foto vom ${esc(phDate(p.date))}"><img src="${p.url}" alt="" loading="lazy" decoding="async">${phTag(p)}</button>`; }
// Die zwei verglichenen Fotos: gewählt, sonst das erste und das neueste
function phPair(){
  const L=PH||[]; if(!L.length) return [];
  const sel=(ui.phSel||[]).map(id=>L.find(p=>p.id===id)).filter(Boolean);
  const pair=sel.length===2&&sel[0].id!==sel[1].id?sel:[L[0],L[L.length-1]];
  return phSort(pair.slice());
}

// Bereich ganz unten im Verlauf
function photoSection(){
  if(PH===null) return "";
  const L=PH;
  if(!L.length) return `<div class="section"><h2>Fortschrittsfotos</h2></div>
    <div class="card pf-empty"><div class="pf-ic">${PH_CAM}</div><b>Halte deinen Fortschritt fest</b><div class="sub">Ein Foto pro Woche reicht. Bleibt nur auf deinem Gerät.</div><button class="pill primary" data-act="ph-add">Erstes Foto</button></div>`;
  const first=L[0], last=L[L.length-1];
  return `<div class="section"><h2>Fortschrittsfotos</h2><span class="sub">${L.length===1?"1 Foto":L.length+" Fotos"}</span></div>
    <div class="card">
      <div class="pf-two ${L.length===1?"one":""}">${L.length===1?phImg(first):phImg(first)+phImg(last)+phDiff(first,last)}</div>
      <div class="pf-acts"><button class="pill ghost" data-act="dash" data-id="photos">Alle ansehen</button><button class="pill primary" data-act="ph-add">+ Foto</button></div>
    </div>`;
}
// Eigene Seite: zwei große Fotos, darunter alle als kleine Bilder zum Auswählen
function renderPhotos(){
  const L=PH||[], pair=phPair();
  const sel=new Set(pair.map(p=>p.id));
  return `<div class="calhead"><button class="navd" data-act="dash-close" aria-label="Zurück">‹</button><h2>Fortschrittsfotos</h2><span class="tap-sp"></span></div>
    ${!L.length?`<div class="card pf-empty"><div class="pf-ic">${PH_CAM}</div><b>Noch keine Fotos</b><div class="sub">Ein Foto pro Woche reicht.</div></div>`:`
    <div class="pf-big ${pair.length===1||pair[0].id===pair[1].id?"one":""}">${pair[0].id===(pair[1]||pair[0]).id?phImg(pair[0]):pair.map(p=>phImg(p)).join("")+phDiff(pair[0],pair[1])}</div>
    ${L.length>2?`<p class="sub pf-hint">Tippe auf zwei Fotos, um sie zu vergleichen</p>`:""}
    ${L.length>1?`<div class="pf-strip">${L.slice().reverse().map(p=>`<button class="pf-th ${sel.has(p.id)?"on":""}" data-act="ph-sel" data-id="${esc(p.id)}" aria-pressed="${sel.has(p.id)}" aria-label="Foto vom ${esc(phDate(p.date))}"><img src="${p.url}" alt="" loading="lazy" decoding="async"><span class="notr">${esc(phDate(p.date))}</span></button>`).join("")}</div>`:""}`}
    <button class="yfertig static" data-act="ph-add">+ Neues Foto</button>
    <p class="sub pf-hint">🔒 Fotos bleiben nur auf diesem Gerät und sind nicht in der Datensicherung.</p>
    ${PH_ERR?`<p class="sub pf-hint">Fotos konnten nicht geladen werden.</p>`:""}`;
}
// Auswahl: Es sind immer genau zwei Fotos im Vergleich. Tippen auf ein anderes Foto ersetzt das,
// das am längsten ausgewählt ist. Am Anfang: erstes Foto + neuestes (das neueste wird zuerst ersetzt).
function phSelect(id){
  const L=PH||[]; if(L.length<2||!L.some(p=>p.id===id)) return;
  const pair=phPair().map(p=>p.id);
  let s=(ui.phSel||[]).filter(x=>pair.includes(x));
  if(s.length!==2) s=[pair[1],pair[0]];          // [zuerst ersetzen, behalten]
  if(s.includes(id)) return;
  ui.phSel=[s[1],id];
}
// Blatt für ein einzelnes Foto: groß ansehen, löschen (mit zweitem Tipp zur Bestätigung)
function photoSheet(id){
  const p=(PH||[]).find(x=>x.id===id);
  if(!p) return `<h2>Foto</h2><p class="sub">Nicht gefunden.</p><div class="gap"></div><button class="pill primary" data-act="close">OK</button>`;
  const kg=phKg(p.date), ask=ui.phDel===p.id;
  return `<h2>${esc(labelDate(p.date))}</h2>${kg!=null?`<p class="sub notr">${de(kg,1)} kg</p>`:""}
    <div class="pf-full"><img src="${p.url}" alt=""></div>
    <div class="gap"></div>
    <button class="pill ${ask?"danger":"ghost"} w-full" data-act="ph-del" data-id="${esc(p.id)}">${ask?"Wirklich löschen?":"Foto löschen"}</button>
    <div class="gap"></div><button class="pill primary" data-act="close">Fertig</button>`;
}

// Beim Start laden (danach einmal neu zeichnen, damit der Bereich erscheint)
try{ phLoad().then(()=>{ try{ if(typeof render==="function"&&state.onboarded) render(); }catch(e){} }); }catch(e){ PH=[]; }
