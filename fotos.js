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
function phClearAll(){ return phTx("readwrite",st=>st.clear()).catch(()=>{}).then(()=>{ (PH||[]).forEach(p=>{ try{ URL.revokeObjectURL(p.url); }catch(e){} }); PH=[]; }); }

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
// Aufnahmedatum aus den Bilddaten (EXIF) lesen, falls vorhanden – nur als Vorschlag beim Fragen nach dem Datum
async function phExifDate(file){
  try{
    const buf=new Uint8Array(await file.slice(0,262144).arrayBuffer()); let txt="";
    for(let i=0;i<buf.length;i++) txt+=String.fromCharCode(buf[i]);
    const ds=[...txt.matchAll(/(\d{4}):(\d{2}):(\d{2}) \d{2}:\d{2}:\d{2}/g)].map(m=>m[1]+"-"+m[2]+"-"+m[3]).filter(phDateOk).sort();
    return ds[0]||null;   // frühestes = Aufnahme (später kann „geändert“ dazukommen)
  }catch(e){ return null; }
}
function phDateOk(d){ return typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>="2000-01-01"&&d<=todayIso()&&iso(parseIso(d))===d; }
async function phSave(blob,date){
  const rec={id:"ph-"+Date.now().toString(36)+uid(), date, t:Date.now(), blob};
  await phTx("readwrite",st=>st.put(rec));
  await phLoad(); render(); toast("Foto gespeichert");
}
// Foto hinzufügen: mode "cam" = direkt mit der Kamera (Datum heute, keine Frage), "lib" = aus Fotos (Datum fragen)
function phPick(mode){
  if((PH||[]).length>=PH_LIMIT){ toast("Höchstens "+PH_LIMIT+" Fotos"); return; }
  const inp=document.createElement("input");
  inp.type="file"; inp.accept="image/*"; inp.style.display="none";
  if(mode==="cam") inp.setAttribute("capture","environment");
  inp.addEventListener("change",async()=>{
    const f=inp.files&&inp.files[0]; inp.remove(); if(!f) return;
    if(!/^image\//.test(f.type||"image/")||f.size>40*1024*1024){ toast("Das ist kein passendes Bild"); return; }
    try{
      toast("Foto wird gespeichert…");
      const blob=await phShrink(f);
      if(mode==="cam"){ await phSave(blob,todayIso()); return; }
      const d=await phExifDate(f);
      if(ui.phPending) try{ URL.revokeObjectURL(ui.phPending.url); }catch(e){}
      ui.phPending={blob,url:URL.createObjectURL(blob),date:d||todayIso()};
      openModal("ph-date");
    }catch(e){ toast("Foto konnte nicht gespeichert werden"); }
  });
  document.body.appendChild(inp); inp.click();
}
// Gewähltes Datum übernehmen (aus dem Datumsfeld)
async function phPendingSave(){
  const P=ui.phPending, i=document.getElementById("ph-date-in"), d=i&&i.value;
  if(!P) return;
  if(!phDateOk(d)){ toast("Bitte ein gültiges Datum wählen"); return; }
  ui.phPending=null; ui.modal=null;
  try{ URL.revokeObjectURL(P.url); }catch(e){}
  try{ await phSave(P.blob,d); }catch(e){ toast("Foto konnte nicht gespeichert werden"); render(); }
}
function phPendingCancel(){ const P=ui.phPending; ui.phPending=null; if(P) try{ URL.revokeObjectURL(P.url); }catch(e){} }
// Datum eines gespeicherten Fotos ändern
async function phSetDate(id){
  const i=document.getElementById("ph-redate"), d=i&&i.value;
  if(!phDateOk(d)){ toast("Bitte ein gültiges Datum wählen"); return; }
  try{
    const rec=await phTx("readonly",st=>st.get(id)); if(!rec) return;
    rec.date=d; await phTx("readwrite",st=>st.put(rec)); await phLoad(); ui.phRedate=null; render(); toast("Gespeichert");
  }catch(e){ toast("Speichern fehlgeschlagen"); }
}
async function phDelete(id){
  try{ await phTx("readwrite",st=>st.delete(id)); await phLoad(); ui.modal=null; render(); toast("Foto gelöscht"); }
  catch(e){ toast("Löschen fehlgeschlagen"); }
}

// ---------- Anzeige ----------
// Gewicht am Tag des Fotos (letzter Eintrag bis dahin)
function phKg(date){
  let kg=null; (state.weights||[]).forEach(w=>{ if(w&&w.date<=date&&Number.isFinite(+w.kg)&&w.kg>0&&(kg===null||w.date>=kg.date)) kg={date:w.date,kg:+w.kg}; });
  return kg?kg.kg:null;
}
function phDate(s){ return parseIso(s).toLocaleDateString(LOC,{day:"numeric",month:"short",year:s.slice(0,4)===todayIso().slice(0,4)?undefined:"numeric"}); }
function phSub(p){ const kg=phKg(p.date); return `<span class="notr">${esc(phDate(p.date))}${kg!=null?" · "+de(kg,1)+" kg":""}</span>`; }
// Vergleich: links immer das allererste, rechts immer das neueste Foto
function phCompare(act){
  const L=PH||[], first=L[0], last=L.length>1?L[L.length-1]:null;
  const cell=(p,lab)=>`<button class="pf-cell" data-act="${act}" data-id="${esc(p.id)}"><span class="pf-ph"><img src="${p.url}" alt="" decoding="async"></span><b>${lab}</b><span class="sub">${phSub(p)}</span></button>`;
  const right=last?cell(last,"Jetzt"):`<button class="pf-cell" data-act="ph-add"><span class="pf-ph pf-next">${PH_CAM}<span>Nächstes Foto</span></span><b>Jetzt</b><span class="sub">in ein paar Wochen</span></button>`;
  const x=last&&phKg(first.date), y=last&&phKg(last.date), d=x!=null&&y!=null?Math.round((y-x)*10)/10:null;
  return `<div class="pf-two">${cell(first,"Vorher")}${right}</div>
    ${d!=null?`<div class="pf-diff"><b class="notr">${d>0?"+":d<0?"−":"±"}${de(Math.abs(d),1)} kg</b> seit dem ersten Foto</div>`:""}`;
}
// Bereich ganz unten im Verlauf
function photoSection(){
  if(PH===null) return "";
  const L=PH;
  if(!L.length) return `<div class="section"><h2>Fortschrittsfotos</h2></div>
    <div class="card pf-empty"><div class="pf-ic">${PH_CAM}</div><b>Halte deinen Fortschritt fest</b><div class="sub">Ein Foto pro Woche reicht. Bleibt nur auf deinem Gerät.</div><button class="pill primary" data-act="open" data-type="ph-add">Erstes Foto</button></div>`;
  return `<div class="section"><h2>Fortschrittsfotos</h2><button class="link" data-act="dash" data-id="photos">Alle (${L.length}) ›</button></div>
    <div class="card">${phCompare("ph-page")}
      <button class="pill primary w-full mt-3" data-act="open" data-type="ph-add">+ Foto</button>
    </div>`;
}
// Eigene Seite: Vergleich oben, darunter alle Fotos (neueste zuerst)
function renderPhotos(){
  const L=PH||[];
  return `<div class="calhead"><button class="navd" data-act="dash-close" aria-label="Zurück">‹</button><h2>Fortschrittsfotos</h2><span class="tap-sp"></span></div>
    ${L.length?`<div class="card">${phCompare("ph-open")}</div>
    <div class="section"><h2>Alle Fotos</h2><span class="sub">${L.length}</span></div>
    <div class="pf-grid">${L.slice().reverse().map(p=>`<button class="pf-g" data-act="ph-open" data-id="${esc(p.id)}"><span class="pf-ph"><img src="${p.url}" alt="" loading="lazy" decoding="async"></span><span class="sub notr">${esc(phDate(p.date))}</span></button>`).join("")}</div>`
    :`<div class="card pf-empty"><div class="pf-ic">${PH_CAM}</div><b>Noch keine Fotos</b><div class="sub">Ein Foto pro Woche reicht.</div></div>`}
    <button class="yfertig static" data-act="open" data-type="ph-add">+ Foto</button>
    <p class="sub pf-hint">🔒 Fotos bleiben nur auf diesem Gerät und sind nicht in der Datensicherung.</p>
    ${PH_ERR?`<p class="sub pf-hint">Fotos konnten nicht geladen werden.</p>`:""}`;
}
// Blatt: Foto hinzufügen – Kamera oder aus Fotos
function phAddSheet(){
  return `<h2>Foto hinzufügen</h2>
    <div class="gap"></div>
    <button class="ycard" data-act="ph-pick" data-v="cam"><span>📷</span><div><b>Foto machen</b><div class="sub">Mit der Kamera, Datum ist heute</div></div></button>
    <button class="ycard" data-act="ph-pick" data-v="lib"><span>🖼️</span><div><b>Aus Fotos wählen</b><div class="sub">Danach gibst du an, von wann es ist</div></div></button>
    <p class="sub pf-hint">Tipp: gleiches Licht, gleiche Stelle, gleiche Haltung.</p>`;
}
// Blatt: Von wann ist das Foto? (nur bei „Aus Fotos wählen“)
function phDateSheet(){
  const P=ui.phPending; if(!P) return `<h2>Foto</h2><p class="sub">Nicht gefunden.</p><div class="gap"></div><button class="pill primary" data-act="close">OK</button>`;
  return `<h2>Von wann ist das Foto?</h2>
    <div class="pf-prev"><img src="${P.url}" alt=""></div>
    <div class="field"><label for="ph-date-in">Datum</label><input id="ph-date-in" type="date" value="${P.date}" min="2000-01-01" max="${todayIso()}"></div>
    <button class="pill primary w-full" data-act="ph-date-save">Speichern</button>
    <div class="gap"></div><button class="pill ghost w-full" data-act="close">Abbrechen</button>`;
}
// Blatt für ein einzelnes Foto: groß ansehen, Datum ändern, löschen (mit zweitem Tipp zur Bestätigung)
function photoSheet(id){
  const p=(PH||[]).find(x=>x.id===id);
  if(!p) return `<h2>Foto</h2><p class="sub">Nicht gefunden.</p><div class="gap"></div><button class="pill primary" data-act="close">OK</button>`;
  const kg=phKg(p.date), ask=ui.phDel===p.id, re=ui.phRedate===p.id;
  return `<h2 class="notr">${esc(parseIso(p.date).toLocaleDateString(LOC,{day:"numeric",month:"long",year:"numeric"}))}</h2>${kg!=null?`<p class="sub notr">${de(kg,1)} kg</p>`:""}
    <div class="pf-full"><img src="${p.url}" alt=""></div>
    <div class="gap"></div>
    ${re?`<div class="field"><label for="ph-redate">Neues Datum</label><input id="ph-redate" type="date" value="${p.date}" min="2000-01-01" max="${todayIso()}"></div><button class="pill primary w-full" data-act="ph-redate-save" data-id="${esc(p.id)}">Datum speichern</button>`
      :`<button class="pill ghost w-full" data-act="ph-redate" data-id="${esc(p.id)}">Datum ändern</button>`}
    <div class="gap"></div>
    <button class="pill ${ask?"danger":"ghost"} w-full" data-act="ph-del" data-id="${esc(p.id)}">${ask?"Wirklich löschen?":"Foto löschen"}</button>
    <div class="gap"></div><button class="pill primary" data-act="close">Fertig</button>`;
}

// Beim Start laden (danach einmal neu zeichnen, damit der Bereich erscheint)
try{ phLoad().then(()=>{ try{ if(typeof render==="function"&&state.onboarded) render(); }catch(e){} }); }catch(e){ PH=[]; }
