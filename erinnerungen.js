// Life Maxxing – Erinnerungen (Essen, Wasser, Wiegen, Supplements).
// Schlau: Eine Erinnerung kommt nur, wenn das noch offen ist (Frühstück schon eingetragen → keine Frühstücks-Erinnerung).
//
// Zwei Wege:
//  1. App aus dem Store (Capacitor mit Plugin @capacitor/local-notifications): Die Erinnerungen werden für die
//     nächsten 7 Tage auf dem Handy eingeplant und kommen auch, wenn die App zu ist. Nach jeder Änderung wird neu
//     geplant – was heute schon erledigt ist, fällt raus.
//  2. Browser/PWA: Ohne Server kann eine Webseite nichts einplanen. Die App prüft deshalb alle 30 Sekunden, solange
//     sie offen oder im Hintergrund ist, und zeigt dann eine Mitteilung. Ist sie ganz geschlossen, kommt nichts.
// Es geht nichts ins Internet.

const REM_DEF={ essen:false, wasser:false, wiegen:false, sups:false, t:{ breakfast:"08:00", lunch:"12:30", dinner:"19:00", wiegen:"07:30", sups:"09:00" } };
const REM_WATER_H=[10,12,14,16,18,20];
const REM_ID0=7000;                       // eigener ID-Bereich für eingeplante Mitteilungen (7000–7999)
const REM_FIRED="hm-rem-fired";           // Browser: was heute schon gezeigt wurde (nicht in der Sicherung)

function remCfg(){
  const p=state.profile, r=p.rem&&typeof p.rem==="object"?p.rem:{};
  const t=Object.assign({},REM_DEF.t,r.t&&typeof r.t==="object"?r.t:{});
  Object.keys(t).forEach(k=>{ if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t[k])) t[k]=REM_DEF.t[k]; });
  return { essen:!!r.essen, wasser:!!r.wasser, wiegen:!!r.wiegen, sups:!!r.sups, t };
}
function remSave(c){ state.profile.rem=c; save(); }
function remAny(c){ c=c||remCfg(); return c.essen||c.wasser||c.wiegen||(c.sups&&state.stack.length>0); }
function remMin(hhmm){ const [h,m]=hhmm.split(":").map(Number); return h*60+m; }
function remHHMM(min){ min=((min%1440)+1440)%1440; return String(Math.floor(min/60)).padStart(2,"0")+":"+String(min%60).padStart(2,"0"); }

// ---------- Was ist heute noch offen? ----------
// Liest den Tag, ohne ihn anzulegen (day() würde leere Tage speichern)
function remDay(s){ return state.days[s]||blankDay(); }
const SLOT_TXT={ breakfast:["Frühstück eintragen","Was gab es heute zum Frühstück?"], lunch:["Mittagessen eintragen","Kurz eintragen, dann passt dein Tagesüberblick."], dinner:["Abendessen eintragen","Trag dein Abendessen ein, dann ist der Tag komplett."] };
// Alle Erinnerungen eines Tages: [{id, min, title, body, open}] – open=false heißt: schon erledigt
function remList(s, c){
  c=c||remCfg(); const d=remDay(s), out=[], p=state.profile;
  if(c.essen) ["breakfast","lunch","dinner"].forEach(sl=>{
    out.push({ id:"m-"+sl, min:remMin(c.t[sl]), title:SLOT_TXT[sl][0], body:SLOT_TXT[sl][1], open:!(d.meals||[]).some(m=>m&&m.slot===sl) });
  });
  if(c.wasser){
    const goal=Math.max(1,+p.waterTarget||8);
    REM_WATER_H.forEach(h=>{ const want=Math.floor(goal*(h-8)/12), have=d.water||0;
      out.push({ id:"w-"+h, min:h*60, title:"Zeit für ein Glas Wasser 💧", body:s===todayIso()?"Heute: "+have+" von "+goal+" Gläsern.":"Bleib bei deinem Wasserziel.", open:have<want }); });
  }
  if(c.wiegen) out.push({ id:"g", min:remMin(c.t.wiegen), title:"Kurz wiegen ⚖️", body:"Am besten morgens nüchtern. So lernt dein Richtwert mit.", open:!(state.weights||[]).some(w=>w&&w.date===s) });
  if(c.sups&&state.stack.length){
    const names=state.stack.map(id=>{ const x=SUPS.find(y=>y.id===id); return x&&x.name; }).filter(Boolean);
    out.push({ id:"s", min:remMin(c.t.sups), title:"Supplements genommen? 💊", body:names.slice(0,3).join(", ")+(names.length>3?" …":""), open:state.stack.some(id=>!(d.taken||{})[id]) });
  }
  return out.sort((a,b)=>a.min-b.min);
}

// ---------- Weg 1: App aus dem Store (Capacitor) ----------
function remNative(){
  try{ const C=window.Capacitor; return C&&C.isNativePlatform&&C.isNativePlatform()&&C.Plugins&&C.Plugins.LocalNotifications||null; }catch(e){ return null; }
}
function remNid(dayOff,idx){ return REM_ID0+dayOff*50+idx; }
let remBusy=null, remAgain=false;
// Für die nächsten 7 Tage neu einplanen (alte eigene vorher löschen)
async function remPlanNative(){
  const LN=remNative(); if(!LN) return false;
  if(remBusy){ remAgain=true; return remBusy; }
  remBusy=(async()=>{
    try{
      const pend=await LN.getPending(), ours=((pend&&pend.notifications)||[]).filter(n=>n.id>=REM_ID0&&n.id<REM_ID0+1000);
      if(ours.length) await LN.cancel({notifications:ours.map(n=>({id:n.id}))});
      const c=remCfg(); if(!remAny(c)) return true;
      const now=new Date(), list=[], t0=todayIso();
      for(let o=0;o<7;o++){
        const s=addDays(t0,o), base=parseIso(s);
        remList(s,c).forEach((r,i)=>{
          if(o===0&&!r.open) return;                      // heute schon erledigt
          const at=new Date(base.getTime()); at.setHours(Math.floor(r.min/60),r.min%60,0,0);
          if(at<=now) return;
          // An künftigen Tagen ist noch nichts eingetragen: neutraler Text ohne Zahlen
          list.push({ id:remNid(o,i), title:T(r.title), body:T(o===0?r.body:r.body.replace(/^Heute: .*$/,"Bleib bei deinem Wasserziel.")), schedule:{at, allowWhileIdle:true}, extra:{tab:"heute"} });
        });
      }
      // iPhone behält höchstens 64 geplante Mitteilungen: die nächsten 60 nehmen
      list.sort((a,b)=>a.schedule.at-b.schedule.at); list.splice(60);
      if(list.length) await LN.schedule({notifications:list});
      return true;
    }catch(e){ return false; }
    finally{ remBusy=null; if(remAgain){ remAgain=false; remPlanNative(); } }
  })();
  return remBusy;
}
// Nach Änderungen kurz warten und dann einmal neu planen (nicht bei jedem Tipp)
let remT=null;
function remSoon(){ if(!remNative()) return; clearTimeout(remT); remT=setTimeout(remPlanNative,800); }

// ---------- Weg 2: Browser ----------
function remWebOk(){ return typeof Notification!=="undefined"; }
function remFired(){ try{ const f=JSON.parse(localStorage.getItem(REM_FIRED)||"null"); return f&&f.date===todayIso()&&Array.isArray(f.ids)?f:{date:todayIso(),ids:[]}; }catch(e){ return {date:todayIso(),ids:[]}; } }
function remMark(id){ const f=remFired(); if(!f.ids.includes(id)) f.ids.push(id); try{ localStorage.setItem(REM_FIRED,JSON.stringify(f)); }catch(e){} }
// Fällige Erinnerungen jetzt: Zeit vorbei (höchstens 60 Min. her), noch offen, heute noch nicht gezeigt
function remDue(now){
  now=now||new Date(); const s=iso(now), min=now.getHours()*60+now.getMinutes(), fired=remFired().ids;
  return remList(s).filter(r=>r.open&&min>=r.min&&min-r.min<60&&!fired.includes(r.id));
}
function remShow(r){
  const title=T(r.title), opt={ body:T(r.body), tag:"hm-"+r.id, icon:"icon-192.png", badge:"icon-192.png", data:{tab:"heute"} };
  try{
    if(navigator.serviceWorker&&navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,opt)).catch(()=>{ try{ new Notification(title,opt); }catch(e){} });
    else new Notification(title,opt);
  }catch(e){}
}
function remTick(){
  if(remNative()||!state.onboarded||!remWebOk()||Notification.permission!=="granted") return;
  // Wer die App gerade vor sich hat, braucht keine Mitteilung – sie kommt, sobald die App im Hintergrund ist
  if(document.visibilityState==="visible") return;
  remDue().slice(0,1).forEach(r=>{ remMark(r.id); remShow(r); });
}

// ---------- Erlaubnis ----------
async function remAsk(){
  const LN=remNative();
  if(LN){ try{ const r=await LN.requestPermissions(); return r&&r.display==="granted"; }catch(e){ return false; } }
  if(!remWebOk()) return false;
  if(Notification.permission==="granted") return true;
  // Auch bei „denied“ fragen: Der Browser antwortet dann sofort ohne Fenster (manche melden den Stand falsch)
  try{ return (await Notification.requestPermission())==="granted"; }catch(e){ return false; }
}
function remPerm(){
  if(remNative()) return "native";
  if(!remWebOk()) return "none";
  return Notification.permission;   // granted | denied | default
}
// Schalter: beim Einschalten erst um Erlaubnis fragen
async function remToggle(k){
  const c=remCfg();
  if(c[k]){ c[k]=false; remSave(c); remSoon(); render(); return; }
  const ok=await remAsk();
  if(!ok){ toast(remPerm()==="none"?"Mitteilungen gehen hier nicht":"Mitteilungen sind nicht erlaubt"); render(); return; }
  c[k]=true; remSave(c); remSoon(); render(); toast("Erinnerung an");
}
function remTime(k,d){ const c=remCfg(); c.t[k]=remHHMM(remMin(c.t[k])+d); remSave(c); remSoon(); }

// ---------- Blatt im Profil ----------
function remRowTime(k,label,c){
  return `<div class="remt"><span>${label}</span><div class="stepper"><button class="plus" data-act="rem-time" data-k="${k}" data-d="-30" aria-label="${label}: 30 Minuten früher">−</button><b class="notr">${c.t[k]}</b><button class="plus" data-act="rem-time" data-k="${k}" data-d="30" aria-label="${label}: 30 Minuten später">+</button></div></div>`;
}
function remSheet(){
  const c=remCfg(), perm=remPerm();
  const row=(k,emo,title,sub)=>`<button class="g-row" data-act="rem-tog" data-k="${k}" role="switch" aria-checked="${c[k]}"><span class="bubble">${emo}</span><div class="grow"><b>${title}</b><div class="sub">${sub}</div></div>${tog(c[k])}</button>`;
  const note=perm==="denied"?"Mitteilungen sind für diese App blockiert. Du kannst sie in den Einstellungen deines Handys oder Browsers erlauben."
    : perm==="none"?"Dieser Browser kann keine Mitteilungen zeigen. Auf dem iPhone: App zuerst zum Home-Bildschirm hinzufügen."
    : perm==="native"?"" : "Im Browser kommen Erinnerungen nur, solange die App offen oder im Hintergrund ist. In der App-Store-Version kommen sie immer.";
  return `<h2>Erinnerungen</h2>
    <p class="sub">Nur wenn etwas noch offen ist. Schon eingetragen heißt: keine Erinnerung.</p>
    <div class="group mt-3">
      ${row("essen","🍽️","Essen eintragen","Frühstück, Mittag, Abend")}
      ${c.essen?`<div class="remts">${remRowTime("breakfast","Frühstück",c)}${remRowTime("lunch","Mittagessen",c)}${remRowTime("dinner","Abendessen",c)}</div>`:""}
      ${row("wasser","💧","Wasser trinken","Alle 2 Stunden von 10 bis 20 Uhr, nur wenn du hinterher bist")}
      ${row("wiegen","⚖️","Wiegen","Morgens, wenn du dich noch nicht gewogen hast")}
      ${c.wiegen?`<div class="remts">${remRowTime("wiegen","Uhrzeit",c)}</div>`:""}
      ${state.stack.length?row("sups","💊","Supplements","Wenn du noch nicht alle genommen hast"):""}
      ${state.stack.length&&c.sups?`<div class="remts">${remRowTime("sups","Uhrzeit",c)}</div>`:""}
    </div>
    ${note?`<p class="sub mt-3">${note}</p>`:""}
    <div class="gap"></div><button class="pill primary" data-act="close">Fertig</button>`;
}
function remSubTxt(){
  const c=remCfg(), on=[c.essen&&"Essen",c.wasser&&"Wasser",c.wiegen&&"Wiegen",c.sups&&state.stack.length&&"Supplements"].filter(Boolean);
  return on.length?on.join(", "):"Aus";
}

// ---------- Start ----------
try{
  setInterval(()=>{ try{ remTick(); }catch(e){} },30000);
  document.addEventListener("visibilitychange",()=>{ try{ if(document.visibilityState==="hidden") remTick(); else remSoon(); }catch(e){} });
  // Store-App: Tippen auf eine Mitteilung öffnet das Tagebuch
  const LN=remNative();
  if(LN&&LN.addListener) LN.addListener("localNotificationActionPerformed",()=>{ try{ state.tab="heute"; state.date=todayIso(); ui.modal=null; save(); render(); }catch(e){} });
}catch(e){}
