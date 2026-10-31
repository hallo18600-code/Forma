// Health Maxxing – Service Worker: macht die App offline nutzbar.
// C = App-Dateien (Version bei jeder Änderung an index.html/JS hochzählen).
// D = Produktdatenbank (bleibt über App-Updates erhalten, wird im Hintergrund aktualisiert).
const C="forma-v92", D="forma-data",
  A=["./","index.html","styles.css","data.js","foods-search.js","portionen.js","texterkennung.js","scanner.js","tagebuch.js","coach.js","onboarding.js","training.js","verlauf.js","profil.js","figur.js","uebungen.js","bewertung.js","recht.js","i18n.js","app.js","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()));});
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
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); } return r; }).catch(()=>caches.match(e.request).then(h=>h||(e.request.mode==="navigate"?caches.match("index.html"):Response.error()))));
    return;
  }
  e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(r=>{ if(r.ok&&u.hostname==="cdn.jsdelivr.net"){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); } return r; })));
});
