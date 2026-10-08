const C="forma-v3",A=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.hostname.endsWith("openfoodfacts.org")) return;
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); } return r; }).catch(()=>caches.match(e.request).then(h=>h||caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request).then(r=>{ if(r.ok&&u.hostname==="cdn.jsdelivr.net"){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); } return r; })));
});
