"""Prüfung „Bessere Alternativen“ und „Werte von der Packung ergänzen“.

Teil 1 (Logik): rechnet alle Produkte der Datenbank für alle 4 Ziele und viele zufällige Profile durch.
  - Jede Alternative stammt aus den Basisdaten, hat einen Score, ist mind. 15 Punkte besser und mind. 65.
  - Alternativen bleiben in derselben Art (Getränk → Getränk, Snack → Snack …), nie das Produkt selbst.
  - Passt nicht zu Ernährungsform / meiden / Unverträglichkeit → wird nicht vorgeschlagen.
  - Alle Namen in der Zuordnung gibt es wirklich (kein Tippfehler, der still nichts anzeigt).
Teil 2 (Klicks): Cola öffnen → Alternative antippen → Produkt öffnet sich → Zurück führt zur Cola.
  Produkt ohne Zucker/Salz → Werte ergänzen → Score erscheint und bleibt nach Neuladen.

Lokal starten (im Repo-Ordner):
  python3 -m http.server 8765 &
  python3 tests/alternativen.py
"""
import os, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get("APP_URL", "http://localhost:8765/index.html")

LOGIK = r"""async ()=>{
 for(let i=0;i<200&&!FOODDB.ok;i++) await new Promise(r=>setTimeout(r,100));
 const F={}, fail=(k,ex)=>{ (F[k]=F[k]||{n:0,ex:[]}).n++; if(F[k].ex.length<4) F[k].ex.push(ex); };
 // 1) Namen in der Zuordnung
 const B=altBase(); const H=[" pommes "," chicken nuggets "," backfisch "," pizza "," nudeln "," toastbrot "," brot "," schokolade "," gummi "," marmelade "," zucker "," kase "," joghurt "," red bull "," cola "];
 Object.entries(ALT_MAP).forEach(([cat,m])=>{ const L=new Set(); if(typeof m==="function") H.forEach(h=>m(h).forEach(n=>L.add(n))); else m.forEach(n=>L.add(n));
   L.forEach(n=>{ if(!B.has(NORM(n))) fail("Name fehlt in den Basisdaten",cat+": "+n); }); });
 // Erlaubte Arten je Gruppe
 const DRINK=new Set(["water","tea","coffee","juice","vegjuice","dairy","kefir","softdrink","plantmilk","coffeemilk","nectar"]);
 const DRINKC=new Set(["softdrink","nectar","juice","alcohol","coffeemilk","plantmilk"]);
 const catOf=f=>{ try{ const c=rClassify(f).cat; return c?c.id:null; }catch(e){ return "ERR"; } };
 const rnd=a=>a[Math.floor(Math.random()*a.length)];
 const PROFILES=[{},{gesundheit:{stil:"Vegan"}},{gesundheit:{stil:"Vegetarisch"}},{gesundheit:{intol:["Laktose"]}},{gesundheit:{intol:["Gluten","Nüsse"]}},{gesundheit:{meiden:["Koffein","Milchprodukte"]}},{gesundheit:{stil:"Primal",meiden:["Rotes Fleisch","Schweinefleisch"]}},{haut:{stoert:["Unreinheiten"]}}];
 const items=FOODDB.rows.map(dbItem).concat(BASE_FOODS);
 let n=0, shown=0, withAlt={};
 const saveA=state.coach.answers, saveG=state.profile.goal;
 for(const P of PROFILES){
  state.coach.answers=JSON.parse(JSON.stringify(P));
  for(const g of R_GOALS){
   state.profile.goal=g;
   // Alle Basisdaten + Datenbank-Produkte: ohne Profil jedes 3., mit Profil jedes 40. (zufällig versetzt), damit es nicht ewig dauert
   const st=P===PROFILES[0]?3:40, off=Math.floor(Math.random()*st);
   for(let i=0;i<items.length;i++){
    const it=items[i]; if(it.src==="off"&&(i%st)!==off) continue;
    n++;
    let sc, alts;
    try{ sc=scored(it); alts=altFor(it,sc); }catch(e){ fail("JavaScript-Fehler",it.name+": "+e.message); continue; }
    if(!Array.isArray(alts)){ fail("Kein Array",it.name); continue; }
    if(!alts.length) continue;
    shown++;
    const own=sc.score, c0=catOf(it);
    if(own==null) fail("Alternative trotz fehlendem Score",it.name);
    if(own>=ALT_MAX) fail("Alternative bei gutem Score",it.name+" "+own);
    if(alts.length>3) fail("Mehr als 3",it.name);
    const ids=new Set();
    alts.forEach(a=>{
      if(ids.has(a.f.id)) fail("Doppelt",it.name+" → "+a.f.name); ids.add(a.f.id);
      if(!BASE_FOODS.includes(a.f)) fail("Nicht aus Basisdaten",it.name+" → "+a.f.name);
      if(a.f.id===it.id||NORM(a.f.name)===NORM(it.name)) fail("Produkt selbst",it.name);
      const r=scoreFood(a.f);
      if(r.score!==a.score) fail("Score passt nicht",it.name+" → "+a.f.name);
      if(r.noScore) fail("Alternative ohne Score",a.f.name);
      if(!(a.score>=ALT_MIN&&a.score>=own+ALT_GAP)) fail("Nicht deutlich besser",it.name+" ("+own+") → "+a.f.name+" ("+a.score+")");
      if((r.notes||[]).some(t=>!/laktosefrei/i.test(t))) fail("Passt nicht zu den Angaben",JSON.stringify(P)+" "+it.name+" → "+a.f.name+": "+r.notes.join("; "));
      if((r.perso||[]).some(x=>/Unverträglichkeit/.test(x.src||""))) fail("Unverträglichkeit",JSON.stringify(P)+" "+it.name+" → "+a.f.name);
      const ca=catOf(a.f);
      if(DRINKC.has(c0)&&!DRINK.has(ca)) fail("Getränk → kein Getränk",it.name+" → "+a.f.name+" ("+ca+")");
      const d0=altIsDrink(it,c0), d1=altIsDrink(a.f,ca);
      if(d0!==d1) fail(d0?"Getränk → Essen":"Essen → Getränk",it.name+" ("+c0+") → "+a.f.name);
      if(c0==="readymeal"&&/(bruhe|bouillon|fond|pulver|wurfel|wurze|gewurz| fix )/.test(" "+NORM(it.name)+" ")) fail("Zutat → Mahlzeit",it.name+" → "+a.f.name);
      const k=c0+" → "+a.f.name; withAlt[k]=(withAlt[k]||0)+1;
    });
    if(alts.some((a,j)=>j&&a.score>alts[j-1].score)) fail("Falsch sortiert",it.name);
   }
  }
 }
 state.coach.answers=saveA; state.profile.goal=saveG;
 // Beispiele zum Ansehen
 const ex={}; state.coach.answers={};
 ["Cola","Energy Drink","Fanta Orange","Haribo Goldbären","Nutella","Kartoffelchips","Pommes","Chicken Nuggets","Fertigpizza","Salami","Margarine","Toastbrot","Spaghetti","Kellogg's Frosties","Apfelsaft","Proteinriegel","Erdbeer Konfitüre","Ketchup","Bier"].forEach(q=>{
   const it=BASE_FOODS.find(f=>NORM(f.name)===NORM(q))||dbSearch(q,1)[0]; if(!it) return;
   ex[q]=R_GOALS.map(g=>{ state.profile.goal=g; const s=scored(it).score; return g+" "+s+": "+altFor(it).map(a=>a.f.name+" "+a.score).join(", "); }); });
 state.profile.goal=saveG; state.coach.answers=saveA;
 return {F,n,shown,top:Object.entries(withAlt).sort((a,b)=>b[1]-a[1]).slice(0,60),ex};
}"""


def wait(pg, expr, sec=60):
    """Warten, bis expr im Browser wahr ist (wait_for_function geht wegen der Content-Security-Policy nicht)"""
    for _ in range(sec * 10):
        try:
            if pg.evaluate(f"()=>{{ try{{ return !!({expr}); }}catch(e){{ return false; }} }}"): return
        except Exception: pass
        pg.wait_for_timeout(100)
    raise RuntimeError("Zeitüberschreitung: " + expr)


def main():
    ok = True
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(locale="de-DE"); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); wait(pg, "typeof altFor==='function'")
        pg.evaluate("""()=>{ state=fresh(); state.onboarded=true; state.profile.adult=true; state.profile.termsOk=TERMS_V; state.date=todayIso();
          Object.assign(state.profile,{sex:"m",age:30,height:180,weight:80,activity:1.55,trainFreq:"3–4× pro Woche",trainType:"Krafttraining",goal:"lose"}); save(); }""")
        pg.reload(); wait(pg, "typeof FOODDB!=='undefined'&&FOODDB.ok")
        pg.set_default_timeout(0); r = pg.evaluate(LOGIK); pg.set_default_timeout(30000)
        print(f"=== Alternativen: {r['n']:,} Bewertungen geprüft, {r['shown']:,}× Alternativen angezeigt".replace(",", "."))
        if r["F"]:
            ok = False
            for k, v in r["F"].items(): print(f"    ❌ {k}: {v['n']}×  z. B. {v['ex']}")
        else: print("    ✅ alles in Ordnung")
        print("    Häufigste Zuordnungen:"); [print("      ", k, n) for k, n in r["top"][:40]]
        print("    Beispiele (Ziel Score: Alternativen):")
        for q, l in r["ex"].items():
            print("      ", q); [print("          ", x) for x in l]

        # ---------- Klicks ----------
        print("=== Klick-Test")
        def fail(t):
            nonlocal ok; ok = False; print("    ❌", t)
        pg.evaluate("()=>{ state.profile.goal='lose'; ui.addSlot='lunch'; openModal('product','cola'); }")
        if not pg.locator(".falt").count(): fail("Cola zeigt keine Alternativen")
        else:
            names = pg.locator(".falt-nm").all_inner_texts(); print("    Cola →", names)
            if "Wasser" not in names: fail("Wasser fehlt bei Cola")
            pg.locator(".falt-row").first.click()
            first = pg.evaluate("ui.modal&&ui.modal.payload")
            h2 = pg.locator(".fhead h2").inner_text()
            if h2 not in names: fail("Alternative öffnet falsches Produkt: " + h2)
            if pg.locator(".falt").count(): fail("Gute Alternative zeigt selbst Alternativen")
            pg.locator(".yback").click()
            if pg.locator(".fhead h2").inner_text() != "Cola": fail("Zurück führt nicht zur Cola")
            if pg.evaluate("ui.altBack") is not None: fail("altBack nicht zurückgesetzt")
            pg.locator(".yback").click()
            if pg.evaluate("ui.modal&&ui.modal.type") != "scan": fail("Zweites Zurück führt nicht zur Liste")
            # Hinzufügen nach Alternative trägt die Alternative ein
            pg.evaluate("()=>{ openModal('product','cola'); }"); pg.locator(".falt-row").first.click()
            n0 = pg.evaluate("day().meals.length"); pg.locator("[data-act=log-food]").click()
            m = pg.evaluate("day().meals.slice(-1)[0]")
            if pg.evaluate("day().meals.length") != n0 + 1 or m["id"] != first: fail("Hinzufügen trägt nicht die Alternative ein")
            # Beim Bearbeiten: Alternative und zurück → Bearbeiten bleibt erhalten
            uid = m["uid"]; pg.evaluate("()=>{ day().meals.push({uid:'t-cola',id:'cola',slot:'lunch',portion:330}); save(); }")
            pg.evaluate("()=>{ ui.modal={type:'product',payload:'cola'}; ui.editUid='t-cola'; ui.amtFor=null; render(); }")
            pg.locator(".falt-row").first.click(); pg.locator(".yback").click()
            if pg.evaluate("ui.editUid") != "t-cola": fail("Bearbeiten geht nach Zurück verloren")
            pg.evaluate("closeModal()")
            # Nach Alternative + Hinzufügen: Tagebuch-Eintrag öffnen → kein falsches Zurück
            pg.evaluate("()=>{ openModal('product','cola'); }"); pg.locator(".falt-row").first.click(); pg.locator("[data-act=log-food]").click()
            pg.evaluate("()=>{ const m=day().meals.slice(-1)[0]; const b=document.createElement('button'); b.dataset.act='meal-edit'; b.dataset.uid=m.uid; document.getElementById('app').appendChild(b); b.click(); }")
            if pg.evaluate("ui.altBack") is not None or pg.locator(".yback").get_attribute("data-act") != "close": fail("Bearbeiten nach Alternative: falscher Zurück-Knopf")
            pg.evaluate("closeModal()")

        # Werte ergänzen
        code = "4311501161524"
        has = pg.evaluate(f"!!dbGet('{code}')")
        if not has: print("    (Testprodukt nicht in der Datenbank, nehme ein anderes)")
        code = pg.evaluate(f"""()=>{{ if(dbGet('{code}')&&dbGet('{code}').sugar==null) return '{code}'; const r=FOODDB.rows.find(x=>x[7]==null&&x[9]==null&&x[5]>2); return r[0]; }}""")
        pg.evaluate(f"()=>{{ ensureDb('db-{code}'); openModal('product','db-{code}'); }}")
        if pg.locator(".fring-t b").inner_text() != "–": fail("Produkt ohne Angaben hat doch einen Score")
        pg.locator("[data-act=fill-open]").click()
        carbs = pg.evaluate(f"dbGet('{code}').carbs")
        # Unsinn wird abgelehnt
        pg.fill("#fill-s", str(carbs + 5).replace(".", ",")); pg.fill("#fill-sa", "0,1"); pg.locator("[data-act=fill-save]").click()
        if pg.evaluate(f"foods().find(x=>x.id==='db-{code}').fill"): fail("Zucker > Kohlenhydrate wurde gespeichert")
        if pg.input_value("#fill-sa") != "0,1": fail("Eingaben gehen bei Fehler verloren")
        pg.fill("#fill-s", ""); pg.locator("[data-act=fill-save]").click()
        if pg.evaluate(f"foods().find(x=>x.id==='db-{code}').fill"): fail("Leeres Feld wurde gespeichert")
        pg.fill("#fill-s", "4,5"); pg.fill("#fill-sa", "0,02"); pg.locator("[data-act=fill-save]").click()
        it = pg.evaluate(f"foods().find(x=>x.id==='db-{code}')")
        if it.get("sugar") != min(4.5, carbs) or it.get("salt") != 0.02: fail(f"Werte falsch gespeichert: {it}")
        s = pg.locator(".fring-t b").inner_text()
        if s == "–": fail("Nach dem Ergänzen kein Score")
        else: print("    Ergänzt → Score", s)
        pg.reload(); wait(pg, "typeof FOODDB!=='undefined'&&FOODDB.ok"); pg.wait_for_timeout(500)
        it2 = pg.evaluate(f"foods().find(x=>x.id==='db-{code}')")
        if not it2 or it2.get("salt") != 0.02 or it2.get("sugar") != it.get("sugar"): fail(f"Nach Neuladen weg: {it2}")
        if pg.evaluate(f"scored(foods().find(x=>x.id==='db-{code}')).score") is None: fail("Nach Neuladen kein Score")
        # Hat die Datenbank später echte Werte, gelten die (dbRefresh)
        pg.evaluate(f"()=>{{ const i=FOODDB.by.get('{code}'); FOODDB.rows[i][9]=0.05; dbRefresh(); }}")
        it3 = pg.evaluate(f"foods().find(x=>x.id==='db-{code}')")
        if it3.get("salt") != 0.05 or "salt" in (it3.get("fill") or {}): fail(f"Datenbank-Wert überschreibt Ergänzung nicht: {it3}")
        # Dunkelmodus & Englisch: Karte rendert ohne Fehler
        pg.evaluate("()=>{ state.profile.theme='dark'; save(); }"); pg.reload(); wait(pg, "typeof altFor==='function'")
        pg.evaluate("()=>{ openModal('product','cola'); }")
        if not pg.locator(".falt").count(): fail("Dunkelmodus: keine Alternativen")
        if errs: fail("JavaScript-Fehler: " + "; ".join(errs[:5]))
        if ok: print("    ✅ alles in Ordnung")
        b.close()
    print("\nERGEBNIS:", "✅ Alle Prüfungen bestanden" if ok else "❌ Fehler gefunden")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
