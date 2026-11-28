// Life Maxxing – Service Worker: macht die App offline nutzbar.
// C = App-Dateien (Version bei jeder Änderung an index.html/JS hochzählen).
// D = Produktdatenbank (bleibt über App-Updates erhalten, wird im Hintergrund aktualisiert).
const C="forma-v137", D="forma-data",
  A=["./","index.html","styles.css","data.js","foods-search.js","portionen.js","texterkennung.js","scanner.js","vorschlaege.js","bedarf.js","erinnerungen.js","tagesscore.js","hautcheck.js","fotos.js","tagebuch.js","coach.js","onboarding.js","training.js","verlauf.js","profil.js","figur.js","uebungen.js","gymimport.js","bewertung.js","alternativen.js","recht.js","i18n.js","app.js","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
// cache:"reload": beim Einrichten immer die frischen Dateien vom Server holen (nicht aus dem Browser-Zwischenspeicher)
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(a=>new Request(a,{cache:"reload"})))).then(()=>self.skipWaiting()));});
// App-Dateien dieser Version: sofort aus dem Speicher (schneller Start, auch bei schlechtem Empfang).
// Neue Versionen kommen über die Nummer oben (C): Der Browser prüft sw.js bei jedem Start und lädt dann alles neu.
const PRE=new Set(A.map(a=>new URL(a,self.location).href));
// Alte Versionen löschen. foods.json aus einer alten Version vorher übernehmen (kein neuer 9-MB-Download).
async function keepFoods(old){ const d=await caches.open(D); if(await d.match("foods.json")) return; for(const k of old){ const h=await (await caches.open(k)).match("foods.json"); if(h){ await d.put("foods.json",h); return; } } }
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>{ const old=k.filter(x=>x!==C&&x!==D); return keepFoods(old).catch(()=>{}).then(()=>Promise.all(old.map(x=>caches.delete(x)))); }).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.hostname.endsWith("openfoodfacts.org")) return;
  if(u.pathname.includes("/studio/")) return;   // Slide-Studio (Marketing) gehört nicht in den App-Speicher
  // Produktdatenbank: sofort aus dem Speicher, im Hintergrund auffrischen
  if(u.origin===location.origin&&u.pathname.endsWith("/foods.json")){
    e.respondWith(caches.open(D).then(c=>c.match(e.request).then(h=>{
      const net=fetch(e.request).then(r=>{ if(r.ok) return c.put(e.request,r.clone()).then(()=>r); return r; });
      if(h){ e.waitUntil(net.catch(()=>{})); return h; }
      return net;
    })));
    return;
  }
  if(u.origin===location.origin&&PRE.has(u.origin+u.pathname)){
    e.respondWith(caches.open(C).then(c=>c.match(e.request,{ignoreSearch:true}).then(h=>h||fetch(e.request).then(r=>{ if(r.ok) c.put(e.request,r.clone()); return r; }))));
    return;
  }
  // Übrige eigene Dateien (Übersetzungen, Scanner, Rechtstexte): erst Netz, offline aus dem Speicher
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); } return r; }).catch(()=>caches.match(e.request).then(h=>h||(e.request.mode==="navigate"?caches.match("index.html"):Response.error()))));
    return;
  }
  e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(r=>{ if(r.ok&&u.hostname==="cdn.jsdelivr.net"){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); } return r; })));
});
// Tippen auf eine Erinnerung: offene App nach vorne holen, sonst öffnen
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{ const c=cs.find(x=>"focus" in x); return c?c.focus():self.clients.openWindow("./"); }));
});
