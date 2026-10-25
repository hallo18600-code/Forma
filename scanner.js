// Health Maxxing – Barcode-Scanner, Kamera, KI-Eingabe und Scan-Ansichten
const cam={s:null,t:null,r:null};
// Barcode-Bibliothek (ZXing) nur laden, wenn das Gerät keinen eingebauten Scanner hat – und erst beim Scannen.
// Zuerst die lokale Kopie (vendor/zxing.min.js, keine Daten an Dritte); fehlt sie, einmalig vom CDN.
const ZX_LOCAL="vendor/zxing.min.js", ZX_CDN="https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
let zxLoad=null;
function loadScript(src){ return new Promise((ok,no)=>{ const s=document.createElement("script"); s.src=src; s.onload=ok; s.onerror=()=>{ s.remove(); no(new Error("load")); }; document.head.appendChild(s); }); }
function loadZXing(){
  if(window.ZXing) return Promise.resolve();
  if(!zxLoad) zxLoad=loadScript(ZX_LOCAL).catch(()=>loadScript(ZX_CDN)).catch(e=>{ zxLoad=null; throw e; });
  return zxLoad;
}
function stopCam(){ if(cam.t){ clearInterval(cam.t); cam.t=null; } if(cam.r){ try{ cam.r.reset(); }catch(e){} cam.r=null; } if(cam.s){ cam.s.getTracks().forEach(t=>t.stop()); cam.s=null; } }
async function startCam(){
  ui.camMsg="";
  try{
    const v=document.getElementById("bc-video");
    if("BarcodeDetector" in window){
      const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      cam.s=st; v.srcObject=st; await v.play();
      const det=new BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e"]});
      cam.t=setInterval(async()=>{ try{ const r=await det.detect(v); if(r.length){ const c=r[0].rawValue; stopCam(); bcLookup(c); } }catch(e){} },400);
    } else if(await loadZXing().then(()=>!!window.ZXing,()=>false)){
      const hints=new Map(); hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[ZXing.BarcodeFormat.EAN_13,ZXing.BarcodeFormat.EAN_8,ZXing.BarcodeFormat.UPC_A,ZXing.BarcodeFormat.UPC_E]);
      cam.r=new ZXing.BrowserMultiFormatReader(hints);
      await cam.r.decodeFromConstraints({video:{facingMode:"environment"}},v,res=>{ if(res){ const c=res.getText(); stopCam(); bcLookup(c); } });
    } else throw new Error("nodet");
  }catch(e){ stopCam(); ui.camMsg=e&&e.message==="nodet"?"Scanner konnte nicht geladen werden. Gib den Code unten ein.":"Kein Kamerazugriff. Gib den Code unten ein."; render(); }
}
async function offLookup(code){
  const r=await fetch("https://world.openfoodfacts.org/api/v2/product/"+code+".json?fields=product_name,brands,nutriments,nova_group");
  if(!r.ok) return null;
  const j=await r.json(); if(j.status!==1||!j.product) return null;
  const n=j.product.nutriments||{}, g=k=>+n[k]||0;
  const kcal=g("energy-kcal_100g")||Math.round(g("energy_100g")/4.184), name=(j.product.product_name||"").trim();
  if(!name||!kcal) return null;
  return {id:"off-"+code,type:"custom",src:"off",name,brand:(j.product.brands||"").split(",")[0].trim()||"Open Food Facts",emoji:"📦",kcal:Math.round(kcal),protein:g("proteins_100g"),carbs:g("carbohydrates_100g"),fat:g("fat_100g"),sugar:g("sugars_100g"),fiber:g("fiber_100g"),salt:g("salt_100g"),sat:g("saturated-fat_100g"),processed:(+j.product.nova_group||0)>=4,nova:+j.product.nova_group||undefined,bc:code};
}
async function bcLookup(code){
  code=String(code||"").replace(/\D/g,"");
  if(code.length<8){ toast("Code zu kurz"); return; }
  let f=foods().find(x=>x.bc===code);
  if(!f){ const d=dbGet(code); if(d){ ensureDb(d.id); f=foods().find(x=>x.id===d.id); } }
  if(!f&&location.protocol.startsWith("http")){ toast("Suche Produkt…"); try{ const it=await offLookup(code); if(it){ state.customs.push(it); save(); f=it; } }catch(e){} }
  if(f){ ui.modal={type:"product",payload:f.id}; ui.amtFor=null; render(); return; }
  ui.newBc=code; ui.newBack="barcode"; ui.scanView="newfood"; toast("Nicht gefunden, leg es kurz an"); render();
}
// Spracheingabe: Text wird angehängt und sofort erkannt. Zweites Tippen beendet das Zuhören.
function aiMic(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return;
  if(ui.listening&&ui.rec){ try{ ui.rec.stop(); }catch(e){} return; }
  const ta=document.getElementById("ai-text"); if(ta) ui.aiText=ta.value;
  const r=new SR(); r.lang=LOC; r.interimResults=false; ui.rec=r; ui.listening=true; render();
  r.onresult=e=>{ const t=[...e.results].map(x=>x[0].transcript).join(" ").trim(); if(!t) return; const old=(ui.aiText||"").trim(); ui.aiText=old?old+", "+t:t; aiParse(); };
  r.onend=r.onerror=()=>{ ui.listening=false; ui.rec=null; render(); };
  try{ r.start(); }catch(e){ ui.listening=false; ui.rec=null; render(); }
}
// Text auswerten: läuft komplett auf dem Gerät (texterkennung.js), ohne KI-Server.
// Eigene Änderungen (Gramm, anderes Lebensmittel, gelöscht) bleiben erhalten, solange der Textteil gleich bleibt.
function aiParse(){
  const t=(ui.aiText||"").trim(); ui.aiOv=ui.aiOv||{};
  if(!t){ ui.aiRes=null; ui.aiMiss=[]; ui.aiIgn=[]; ui.aiOpen=null; return; }
  const r=smartParse(t);
  ui.aiRes=r.items;
  r.items.forEach(it=>{ const o=ui.aiOv[it.key]; if(!o) return;
    if(o.food&&o.food.id!==it.ref) teSwap(it,o.food);
    if(o.grams!=null){ it.grams=o.grams; it.u=null; it.q=null; it.txt=""; if(it.water) it.glasses=Math.max(1,Math.round(o.grams/250)); } });
  ui.aiRes=r.items.filter(it=>!(ui.aiOv[it.key]||{}).del);
  if(!ui.aiRes.length) ui.aiRes=null;
  ui.aiMiss=r.miss; ui.aiIgn=r.ign; if(ui.aiOpen!=null&&!(ui.aiRes||[])[ui.aiOpen]) ui.aiOpen=null;
}
function aiTyped(v){
  ui.aiText=v; clearTimeout(ui.aiT);
  ui.aiT=setTimeout(()=>{ aiParse(); const box=document.getElementById("ai-res"); if(box) box.innerHTML=aiResults(); },220);
}
const AI_EX=["2 Eier und ein Toast mit Butter","Teller Spaghetti Bolognese","Skyr mit Heidelbeeren und Honig"];
const aiK=i=>Math.round(i.kcal*i.grams/100);
function aiRow(i,k){
  const open=ui.aiOpen===k, alts=!i.water&&(i.altFoods||[]).length>0;
  // Nur neu erkannte Zeilen kurz einblenden (nicht bei jedem Tastendruck alle)
  ui.aiSeen=ui.aiSeen||new Set(); const fresh=!ui.aiSeen.has(i.key+i.ref); ui.aiSeen.add(i.key+i.ref);
  const gu=i.water||(unitsFor(i.food).find(x=>x.k==="g")||{}).ml?"ml":"g";
  const sub=i.water?`<span class="notr">${i.glasses} ${esc(uName("glas",i.glasses))}</span> · <span>zählt zum Wasser</span>`
    :`${i.txt?`<span class="notr">${esc(i.txt)}</span> · `:""}<span id="ai-k${k}">${aiK(i)}</span> kcal`;
  const main=`<span class="ai-emo">${i.water?"💧":esc(i.emoji)}</span><span class="ai-txt"><b>${esc(i.name)}</b><span class="sub">${sub}</span></span>${alts?`<span class="ai-chev" aria-hidden="true">${CHEV_DOWN}</span>`:""}`;
  return `<div class="ai-row ${open?"open":""} ${fresh?"new":""}">
    ${alts?`<button class="ai-main" data-act="ai-alt" data-i="${k}" aria-expanded="${open}" aria-label="${esc(i.name)}: andere Auswahl">${main}</button>`:`<div class="ai-main">${main}</div>`}
    <label class="ai-g"><input class="aig" type="text" inputmode="decimal" value="${i.grams}" data-act="ai-g" data-i="${k}" aria-label="Menge in ${gu}" autocomplete="off"><span class="notr">${gu}</span></label>
    <button class="x" data-act="ai-del" data-i="${k}" aria-label="${esc(i.name)} entfernen">✕</button>
  </div>
  ${open?`<div class="ai-alts"><span class="sub">Stattdessen</span><div class="opts">${i.altFoods.map(f=>`<button class="chip" data-act="ai-swap" data-i="${k}" data-id="${esc(f.id)}">${esc(f.emoji||"🍽️")} <span class="notr">${esc(f.name)}</span></button>`).join("")}</div></div>`:""}`;
}
function aiResults(){
  const r=ui.aiRes, txt=(ui.aiText||"").trim(), miss=ui.aiMiss||[], ign=ui.aiIgn||[];
  if(!txt) return `<div class="ai-ex"><span class="sub">Zum Beispiel</span><div class="opts">${AI_EX.map(x=>{ const v=tr(x); return `<button class="chip" data-act="ai-ex" data-v="${esc(v)}">${esc(x)}</button>`; }).join("")}</div></div>`;
  const missH=miss.length?`<div class="ai-miss"><span class="sub">Nicht erkannt – einzeln suchen:</span><div class="opts">${miss.map(m=>{ const o=teOrig(txt,m); return `<button class="chip" data-act="ai-find" data-v="${esc(o)}">🔍 <span class="notr">${esc(o)}</span></button>`; }).join("")}</div></div>`:"";
  const ignH=ign.length?`<p class="sub ai-ign">Ohne Kalorien weggelassen: <span class="notr">${esc([...new Set(ign.map(w=>cap(teOrig(txt,w))))].join(", "))}</span></p>`:"";
  if(!r) return `<p class="sub ai-empty">Noch nichts erkannt. Schreib zum Beispiel „2 Eier und ein Toast“.</p>${missH}${ignH}`;
  const food=r.filter(i=>!i.water), kc=food.reduce((t,i)=>t+aiK(i),0), pr=Math.round(food.reduce((t,i)=>t+i.protein*i.grams/100,0));
  // Mahlzeiten aus dem Text („Frühstück: …, Mittag: …“) als Überschriften, sonst eine Liste
  const groups=r.some(i=>i.slot&&i.slot!==ui.addSlot);
  let list="", cur;
  r.forEach((i,k)=>{ const sl=i.slot||ui.addSlot; if(groups&&sl!==cur){ cur=sl; const S=SLOTS.find(x=>x.id===sl); list+=`<div class="ai-slot">${{breakfast:"☕",lunch:"🍝",dinner:"🥗",snack:"🍎"}[sl]||""} ${S?S.name:""}</div>`; } list+=aiRow(i,k); });
  return `<div class="ai-list ${groups?"grouped":""}">${list}</div>${missH}${ignH}
    <div class="ai-sum"><span><b id="ai-tot">${kc}</b> kcal</span><span><b id="ai-pro">${pr}</b> g Protein</span></div>
    <button class="yfertig" data-act="ai-add">${r.length===1?"Hinzufügen":`Alle ${r.length} hinzufügen`}</button>`;
}
function aiView(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  return `${yHead("Sprache/Text","list")}
    <p class="sub">Schreib oder sprich, was du gegessen hast. Mengen, Portionen und Tippfehler erkennt die App selbst.</p>
    <div class="aibox ${SR?"mic":""}"><textarea id="ai-text" class="aitext" data-act="ai-type" rows="3" placeholder="z. B. 2 Eier, 2 Scheiben Vollkornbrot mit Butter und ein Kaffee mit Milch" autocomplete="off" autocapitalize="sentences" enterkeyhint="done">${esc(ui.aiText||"")}</textarea>
      ${SR?`<button class="ai-mic ${ui.listening?"on":""}" data-act="ai-mic" aria-label="${ui.listening?"Zuhören beenden":"Sprechen"}" aria-pressed="${!!ui.listening}">🎤</button>`:""}</div>
    ${ui.listening?`<p class="sub ai-listen">Hört zu…</p>`:""}
    <div id="ai-res">${aiResults()}</div>`;
}
function yHead(title,back){ return `<div class="yhead">${back?`<button class="yback" data-act="scan-view" data-v="${back}">‹</button>`:`<div class="ycount">${day().meals.filter(m=>m.slot===ui.addSlot).length}</div>`}<b>${title}</b><span></span></div>`; }
function barcodeView(){
  return `${yHead("Barcode","list")}
    <div class="bcbox"><video id="bc-video" playsinline muted></video><div class="bcframe"></div>${ui.camMsg?`<p class="bcmsg">${ui.camMsg}</p>`:""}</div>
    <button class="pill dark w-full" data-act="cam-start">Kamera starten</button>
    <div class="field"><label>Oder Code eingeben</label><input id="bc-input" inputmode="numeric" placeholder="EAN, 8 oder 13 Ziffern"></div>
    <button class="pill primary w-full" data-act="bc-lookup">Suchen</button>
    <p class="sub">Produktdaten kommen von Open Food Facts. Fehlt ein Produkt, legst du es selbst an.</p>`;
}
function moreView(){
  return `${yHead("Was möchtest du erstellen?","list")}
    ${[["quick","⚡","Schnell hinzufügen","Tracke Kalorien und Nährwerte ohne ein neues Lebensmittel zu erstellen"],["bc","🥕","Neues Lebensmittel mit Barcode","Einzelnes Lebensmittel (z. B. Cornflakes, Kellogg's)"],["nobc","🥕","Neues Lebensmittel ohne Barcode","Einzelnes Lebensmittel (z. B. Brötchen)"]].map(([k,e,t,d])=>`<button class="ycard" data-act="more-go" data-v="${k}"><span>${e}</span><div><b>${t}</b><div class="sub">${d}</div></div></button>`).join("")}`;
}
function quickView(){
  return `${yHead("Schnell hinzufügen","more")}
    <div class="field"><label>Name (optional)</label><input id="q-name" placeholder="Restaurant-Mittag"></div>
    ${[["q-kcal","Kalorien (kcal)"],["q-p","Protein (g)"],["q-c","Kohlenhydrate (g)"],["q-f","Fett (g)"]].map(([i,l])=>`<div class="field"><label>${l}</label><input id="${i}" inputmode="decimal"></div>`).join("")}
    <button class="yfertig" data-act="save-quick">Hinzufügen</button>`;
}
function newFoodView(){
  const bc=ui.newBc!=null;
  return `${yHead("Neues Lebensmittel",ui.newBack||"more")}
    ${bc?`<div class="field"><label>Barcode</label><input id="c-bc" inputmode="numeric" value="${esc(ui.newBc)}"></div>`:""}
    <div class="field"><label>Name</label><input id="c-name" placeholder="Cornflakes"></div>
    <div class="field"><label>kcal / 100 g</label><input id="c-kcal" inputmode="numeric" value="100"></div>
    <div class="field"><label>Protein / 100 g</label><input id="c-p" inputmode="decimal" value="5"></div>
    <div class="field"><label>Kohlenhydrate / 100 g</label><input id="c-c" inputmode="decimal" value="12"></div>
    <div class="field"><label>Fett / 100 g</label><input id="c-f" inputmode="decimal" value="3"></div>
    <button class="yfertig" data-act="save-custom">Speichern und eintragen</button>`;
}
function scanResults(){
  const q=ui.query.trim().toLowerCase(), mode="text";
  const pool=mode==="care"?CARE:mode==="sup"?SUPS:foods().filter(p=>!p.hidden);
  const ts=qTokens(q), found0=(q?rankSort(pool.filter(p=>{ const x=hay(p); return ts.every(w=>x.includes(w)); }),q):pool).slice(0,12);
  let found=found0, more=""; if(mode==="text"&&q.length>=2&&FOODDB.ok){ const lim=ui.scanMax||30, ids=new Set(found0.map(p=>p.id)), d=dbSearch(q,lim); found=found0.concat(d.filter(p=>!ids.has(p.id))); if(d.length>=lim) more=`<button class="pill ghost w-full mt-3" data-act="scan-more">Mehr anzeigen</button>`; }
  const row=p=>{ const sc=scored(p).score; return `<div class="yrow"><button class="grow ynm" data-act="open" data-type="product" data-id="${p.id}"><b>${esc(p.name)}</b><div class="sub">${esc(p.brand||"")}${p.kcal?(p.brand?" · ":"")+"100 g":""}</div></button>${p.kcal?`<span class="ykc">${p.kcal} kcal</span>`:""}<div class="score ${scoreClass(sc)}">${sc}</div>${mode==="text"?`<button class="yplus" data-act="quick-add" data-id="${p.id}" aria-label="${esc(p.name)} hinzufügen">+</button>`:""}</div>`; };
  const hint=(mode==="text"&&q.length>=2&&!FOODDB.ok)?`<p class="sub">Produktdatenbank nicht geladen (foods.json fehlt oder lädt noch). Es werden nur Basis-Einträge durchsucht.</p>`:"";
  return hint+(found.map(row).join("")||`<p class="sub li">Nichts gefunden.</p><button class="pill ghost w-full" data-act="more-go" data-v="nobc">Eigenes Lebensmittel anlegen</button>`)+more;
}
function scanSheet(){
  const v=ui.scanView||"list", slot=SLOTS.find(s=>s.id===ui.addSlot), title=slot?slot.name:"Suche";
  if(v==="barcode") return barcodeView();
  if(v==="ai") return aiView();
  if(v==="more") return moreView();
  if(v==="quick") return quickView();
  if(v==="newfood") return newFoodView();
  const q=ui.query.trim().toLowerCase(), mode="text";
  return `${yHead(title)}
    <div class="ytiles"><button class="ytile" data-act="scan-view" data-v="barcode"><i>${BC_ICON}</i>Barcode</button><button class="ytile" data-act="scan-view" data-v="ai"><i>💬</i>Sprache/Text</button><button class="ytile" data-act="scan-view" data-v="more"><i>⋯</i>Mehr</button></div>
    <div class="field ysearch"><input value="${esc(ui.query)}" data-act="query" placeholder="${slot?"Was hattest du zum "+slot.name+"?":"Suchen"}"></div>
    <div id="scan-results">${scanResults()}</div>
    <p class="sub mt-3">Produktdaten: Open Food Facts (ODbL)</p>
    <button class="yfertig" data-act="close">Fertig</button>`;
}
