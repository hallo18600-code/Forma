// Health Maxxing – Barcode-Scanner, Kamera, KI-Eingabe und Scan-Ansichten
const cam={s:null,t:null,r:null};
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
    } else if(window.ZXing){
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
  if(f){ ui.modal={type:"product",payload:f.id}; render(); return; }
  ui.newBc=code; ui.newBack="barcode"; ui.scanView="newfood"; toast("Nicht gefunden, leg es kurz an"); render();
}
function aiMic(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return;
  const ta=document.getElementById("ai-text"); if(ta) ui.aiText=ta.value;
  const r=new SR(); r.lang=LOC; ui.listening=true; render();
  r.onresult=e=>{ ui.aiText=((ui.aiText||"")+" "+e.results[0][0].transcript).trim(); };
  r.onend=r.onerror=()=>{ ui.listening=false; render(); };
  try{ r.start(); }catch(e){ ui.listening=false; render(); }
}
// Text auswerten: läuft komplett auf dem Gerät (smartParse), ohne KI-Server.
function aiRun(){
  const ta=document.getElementById("ai-text"); ui.aiText=(ta&&ta.value||"").trim();
  if(!ui.aiText){ toast("Beschreibe dein Essen"); return; }
  const r=smartParse(ui.aiText);
  ui.aiRes=r.items.length?r.items:null; ui.aiMiss=r.miss;
  ui.aiErr=r.items.length?"":'Nichts erkannt. Schreib z. B. "200 g Haferflocken, 2 Eier, ein Apfel".';
  render();
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
function aiView(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition, r=ui.aiRes;
  return `${yHead("Sprache/Text","list")}
    <p class="sub">Schreib oder sprich, was du gegessen hast, z. B. „200 g Haferflocken, 2 Eier, ein Apfel“. Die App erkennt Mengen und sucht die Lebensmittel in der Datenbank.</p>
    <textarea id="ai-text" class="aitext" placeholder="z. B. 2 Eier, 2 Scheiben Vollkornbrot mit Butter und ein Kaffee mit Milch">${esc(ui.aiText||"")}</textarea>
    <div class="row">${SR?`<button class="pill ghost" data-act="ai-mic">🎤 ${ui.listening?"Hört zu…":"Sprechen"}</button>`:""}<button class="pill primary grow" data-act="ai-run">Erkennen</button></div>
    ${ui.aiErr?`<p class="sub t-bad">${esc(ui.aiErr)}</p>`:""}
    ${r?`<div class="section"><h2>Erkannt</h2><span class="sub">Gesamt <b id="ai-tot">${r.reduce((t,x)=>t+Math.round(x.kcal*x.grams/100),0)}</b> kcal</span></div>${r.map((i,k)=>`<div class="yrow"><div class="grow"><b>${esc(i.name)}</b><div class="sub">${esc(i.brand||"")}${i.brand?" · ":""}<span id="ai-k${k}">${Math.round(i.kcal*i.grams/100)}</span> kcal</div></div><input class="aig" aria-label="Gramm" type="number" inputmode="decimal" value="${i.grams}" data-act="ai-g" data-i="${k}"><span class="sub">g</span><button class="x" data-act="ai-del" data-i="${k}" aria-label="Entfernen">✕</button></div>`).join("")}<button class="yfertig" data-act="ai-add">Alles hinzufügen</button>`:""}
    ${(ui.aiMiss||[]).length?`<p class="sub mt-3">Nicht gefunden: ${ui.aiMiss.map(esc).join(", ")}. Such sie einzeln oder leg sie an.</p>`:""}`;
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
