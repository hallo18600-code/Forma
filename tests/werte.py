"""Prüfung „Unstimmige Werte“: offensichtlich falsche Datenbank-Angaben dürfen nie bewertet oder eingetragen werden.

Teil 1 (Logik):
  - Bekannte Fehler werden erkannt (Kalorien passen nicht zu den Makros, lauter Nullen, Wasser mit Kalorien,
    Salz viel zu hoch, Werte pro Portion statt pro 100 g, unmögliche Mengen).
  - Richtige Werte werden NICHT gesperrt: alle Basisdaten, Wasser/Tee/Zero-Getränke mit 0 kcal, Süßstoffe,
    zuckerfreie Bonbons, Wein/Bier, salzige Produkte wie Sojasoße, Brühe, Parmesan.
  - Höchstens 1 % der Datenbank betroffen (sonst sind die Regeln zu streng).
  - Gesperrte Produkte haben keinen Score und tauchen nie als Alternative oder im Tages-Score auf.
Teil 2 (Klicks):
  - Unstimmiges Produkt: „+“ in der Suche, Vorschlag und „Hinzufügen“ tragen nichts ein.
  - Werte von der Packung eintragen → Score erscheint, Eintragen geht, bleibt nach Datenbank-Abgleich und Neuladen.
  - „Stimmt genau so“ → Produkt ist freigegeben.

Lokal starten (im Repo-Ordner):
  python3 -m http.server 8765 &
  python3 tests/werte.py
"""
import os, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get("APP_URL", "http://localhost:8765/index.html")

LOGIK = r"""async ()=>{
 for(let i=0;i<200&&!FOODDB.ok;i++) await new Promise(r=>setTimeout(r,100));
 const F=[], fail=(k,ex)=>F.push(k+": "+ex);
 const mk=(name,kcal,p,c,f,s,sa,extra)=>Object.assign({id:"db-t"+Math.random(),type:"custom",src:"off",name,brand:"",kcal,protein:p,carbs:c,fat:f,sugar:s,salt:sa},extra||{});
 const BAD=[
  [mk("Feta",168,16,0,23,0,2.3),"kcal"],
  [mk("Hackfleisch gemischt",47,18,0,17,0,0.2),"kcal"],
  [mk("natural Mineral Water",330,9,4,30,3,1),"water"],
  [mk("Pastrami",0,0,0,0,0,0),"zero"],
  [mk("Gouda Scheiben",364,25,0,30,0,17.7),"salt"],
  [mk("Möhren & Erbsen",44,2.5,5.5,0.5,1.6,24.6),"salt"],
  [mk("Sonnenblumenkerne",318,15.5,7.8,25.2,1.7,0.1),"portion"],
  [mk("Joghurt",60,4,4,3,8,0.1),"amount"],
 ];
 BAD.forEach(([it,want])=>{ const r=rImplausible(it); if(!r.includes(want)) fail("Fehler nicht erkannt",it.name+" → "+JSON.stringify(r)+" (erwartet "+want+")"); const s=scoreFood(it,"muscle"); if(s.score!=null) fail("Unstimmiges Produkt hat Score",it.name); });
 const GOOD=[
  mk("Coca-Cola Zero",0,0,0,0,0,0), mk("Gerolsteiner Medium",0,0,0,0,0,0), mk("Erythrit",0,0,100,0,0,0), mk("Tic Tac Mint",244,0.1,97,0.8,0,0),
  mk("Grauburgunder trocken",73,0.1,1,0,1,0), mk("Pilsner Bier",42,0.5,3,0,0,0), mk("Sojasauce",77,10,3.2,0,0.6,16.9), mk("Gemüsebrühe Pulver",200,10,25,6,10,45),
  mk("Parmigiano Reggiano",392,33,0,29,0,1.6), mk("Mandeln",600,21,6,52,4,0), mk("Butter",741,0.7,0.6,83,0.6,0), mk("Kräuterbutter",578,1,3,62.5,0.7,1.8),
  mk("Lachsschinken",120,22,1,3,1,3.5), mk("Kartoffelchips",536,6,50,34,0.5,1.5), mk("Hühnerbrühe",0,0,0,0,0,0.9), mk("Salatgurke",12,0.6,2,0.2,1.7,0)
 ];
 GOOD.forEach(it=>{ const r=rImplausible(it); if(r.length) fail("Richtiges Produkt gesperrt",it.name+" → "+r.join(",")); });
 BASE_FOODS.forEach(f=>{ const r=rImplausible(f); if(r.length) fail("Basisdaten gesperrt",f.name); });
 // Anteil der Datenbank
 let n=0, bad=0; for(const row of FOODDB.rows){ const it=dbItem(row); if(rMissing(it).length) continue; n++; if(rImplausible(it).length) bad++; }
 if(bad/n>0.01) fail("Zu viele Produkte gesperrt",bad+" von "+n);
 // Gesperrte Produkte nie als Alternative / im Tages-Score
 state=fresh(); state.profile.goal="muscle";
 const it=mk("Feta",168,16,0,23,0,2.3); state.customs.push(it); const d=state.date; state.days[d]={meals:[{uid:"x",id:it.id,portion:100,slot:"lunch"}],checks:{},taken:{},routine:{},water:0};
 if(dayScore(d)!=null) fail("Tages-Score nutzt unstimmiges Produkt","");
 return {fails:F, gesperrt:bad, bewertet:n};
}"""

KLICK = r"""async ()=>{
 for(let i=0;i<200&&!FOODDB.ok;i++) await new Promise(r=>setTimeout(r,100));
 const F=[], fail=(k,ex)=>F.push(k+": "+(ex||""));
 seedDemo(); state.profile.termsOk=TERMS_V; save(); render();
 let row=null; for(const r of FOODDB.rows){ const x=dbItem(r); if(!rMissing(x).length&&rImplausible(x).includes("kcal")){ row=r; break; } }
 if(!row) return {fails:["Kein unstimmiges Produkt in der Datenbank gefunden"]};
 const id="db-"+row[0], n0=()=>day().meals.length, start=n0();
 const click=(act,extra)=>{ const b=document.createElement("button"); b.dataset.act=act; Object.assign(b.dataset,extra||{}); document.getElementById("app").appendChild(b); b.click(); b.remove(); };
 click("quick-add",{id}); if(n0()!==start) fail("„+“ hat unstimmiges Produkt eingetragen");
 if(!(ui.modal&&ui.modal.type==="product"&&ui.modal.payload===id)) fail("Produktseite nicht geöffnet");
 if(!document.querySelector('[data-act="impl-hint"]')) fail("„Erst Werte prüfen“ fehlt");
 if(document.querySelector('[data-act="log-food"]')) fail("„Hinzufügen“ trotz unstimmiger Werte");
 click("log-food",{id}); if(n0()!==start) fail("„Hinzufügen“ hat eingetragen");
 click("sug-add",{id}); if(n0()!==start) fail("Vorschlag hat eingetragen");
 // Werte korrigieren
 document.querySelector('[data-act="fix-open"]').click(); await new Promise(r=>setTimeout(r,50));
 const c=state.customs.find(x=>x.id===id), p=+c.protein||0, cb=+c.carbs||0, f=+c.fat||0;
 const set=(k,v)=>{ document.getElementById(k).value=String(v).replace(".",","); };
 set("fx-k",Math.round(4*p+4*cb+9*f)); set("fx-s",Math.min(+c.sugar||0,cb)); set("fx-sa",c.salt!=null?c.salt:0.5);
 document.querySelector('[data-act="fix-save"]').click(); await new Promise(r=>setTimeout(r,50));
 if(rImplausible(c).length) fail("Nach Korrektur weiter unstimmig",JSON.stringify(rImplausible(c)));
 if(scored(c).score==null) fail("Nach Korrektur kein Score");
 const k=c.kcal; dbRefresh(); if(c.kcal!==k) fail("Datenbank-Abgleich überschreibt Korrektur");
 openModal("product",id); if(!document.querySelector('[data-act="log-food"]')) fail("Nach Korrektur kein „Hinzufügen“");
 document.querySelector('[data-act="log-food"]').click(); if(n0()!==start+1) fail("Nach Korrektur nicht eintragbar");
 // Bestätigen
 let row2=null; for(const r of FOODDB.rows){ const x=dbItem(r); if(x.id!==id&&!rMissing(x).length&&rImplausible(x).length){ row2=r; break; } }
 const id2="db-"+row2[0]; ensureDb(id2); openModal("product",id2);
 document.querySelector('[data-act="impl-ok"]').click(); await new Promise(r=>setTimeout(r,50));
 const c2=state.customs.find(x=>x.id===id2); if(rImplausible(c2).length) fail("„Stimmt genau so“ wirkt nicht");
 return {fails:F, kcal:k};
}"""

def main():
    ok = True
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(locale="de-DE")
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(500)
        r = pg.evaluate(LOGIK)
        print(f"=== Logik: {r.get('gesperrt')} von {r.get('bewertet')} Produkten gesperrt")
        for f in r["fails"]: print("    ❌", f); ok = False
        if not r["fails"]: print("    ✅ alles in Ordnung")
        pg.evaluate("()=>localStorage.clear()"); pg.reload(); pg.wait_for_timeout(500)
        r = pg.evaluate(KLICK)
        print("=== Klick-Test")
        for f in r["fails"]: print("    ❌", f); ok = False
        if not r["fails"]: print("    ✅ alles in Ordnung")
        # Bleibt nach Neuladen
        pg.reload(); pg.wait_for_timeout(800)
        left = pg.evaluate("()=>{ const c=state.customs.filter(x=>x.ok); return c.length&&c.every(x=>!rImplausible(x).length); }")
        if not left: print("    ❌ Korrektur/Bestätigung nach Neuladen weg"); ok = False
        if errs: print("    ❌ JS-Fehler:", errs[:3]); ok = False
        b.close()
    print("\nERGEBNIS:", "✅ Alle Prüfungen bestanden" if ok else "❌ Fehler gefunden")
    sys.exit(0 if ok else 1)

main()
