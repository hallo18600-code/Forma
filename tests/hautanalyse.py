"""Prüfung der Hautanalyse (hautcheck.js) mit simulierten Tagebüchern.

Jedes Szenario erzeugt hunderte zufällige Tagebücher, in denen wir den „echten“ Zusammenhang kennen:
  - Zufall: Haut hängt von nichts ab → es darf (fast) nie etwas angezeigt werden.
  - Milch macht Haut BESSER → darf nie als Auffälligkeit erscheinen (schlechte Gewohnheit nur als Minus).
  - Zucker macht Haut schlechter → Zucker soll erkannt werden, Milch (oft zusammen gegessen) nicht.
  - Zucker + wenig Schlaf zusammen → Kombination oder beide einzeln.
  - Sehr gute Ernährung macht Haut besser → soll als Plus erkannt werden.
Außerdem bei jedem Lauf: Richtung stimmt, höchstens 3 Einträge, keine kaputten Zahlen.
Grenzen: Bei Zufall darf in höchstens ~5 % der Tagebücher etwas erscheinen (7 % inkl. Messschwankung bei 150 Läufen).
Die Trefferquoten sind bewusst realistisch: Die Analyse ist vorsichtig und zeigt lieber nichts als etwas Falsches.

Lokal starten (im Repo-Ordner):
  python3 -m http.server 8765 &
  python3 tests/hautanalyse.py
"""
import os, sys, json
from playwright.sync_api import sync_playwright

URL = os.environ.get("APP_URL", "http://localhost:8765/index.html")

JS = r"""(cfg)=>{
 const R=Math.random, rn=()=>{ let u=0,v=0; while(!u)u=R(); while(!v)v=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
 const setup=()=>{ state=fresh(); state.onboarded=true; state.profile.adult=true; state.profile.termsOk=TERMS_V; state.date=todayIso();
  Object.assign(state.profile,{sex:R()<.5?"m":"w",age:25,height:178,weight:75,activity:1.55,trainFreq:"3–4× pro Woche",trainType:"Krafttraining",goal:"skin",waterTarget:8}); };
 setup();   // Profil zuerst setzen: die Bewertung hängt vom Ziel ab
 const pool=BASE_FOODS.filter(p=>p.type==="food"||!p.type);
 const sc=p=>{ try{ return +scored(p).score; }catch(e){ return 0; } };
 const cat=p=>foodCat(p)||{};
 const clean=pool.filter(p=>sc(p)>=80&&cat(p).d!==1&&cat(p).id!=="fastfood"&&(p.sugar||0)<5);
 const sweet=pool.filter(p=>(p.sugar||0)>=40);
 const fast=pool.filter(p=>(foodCat(p)||{}).id==="fastfood");
 const dairy=pool.filter(p=>(foodCat(p)||{}).d===1&&(p.sugar||0)<8);
 if(!clean.length||!sweet.length||!fast.length||!dairy.length) return {err:"Pools leer "+[clean.length,sweet.length,fast.length,dairy.length]};
 const pick=a=>a[Math.floor(R()*a.length)];
 const out={runs:0, any:0, found:0, wrongDir:0, tooMany:0, nan:0, shown:{}, examples:[]};
 for(let it=0; it<cfg.runs; it++){
  setup();
  const T=todayIso(), days=cfg.dmin+Math.floor(R()*(cfg.dmax-cfg.dmin+1));
  const H={};   // Gewohnheiten pro Tag
  for(let i=days;i>=0;i--){ const s=addDays(T,-i), d=state.days[s]=blankDay();
   const style=R(); // manche Tage sehr sauber, manche schwach
   const h={ sugar:R()<cfg.pSugar, fast:R()<cfg.pFast, dairy:false, clean:style<cfg.pClean };
   // Gewohnheiten in Phasen (z. B. eine Woche mit viel Süßem): mit Wahrscheinlichkeit „streak“ wie gestern
   const yH=H[addDays(s,-1)]; if(cfg.streak&&yH){ if(R()<cfg.streak) h.sugar=yH.sugar; if(R()<cfg.streak) h.fast=yH.fast; if(R()<cfg.streak) h.clean=yH.clean; }
   if(h.clean){ h.sugar=false; h.fast=false; }
   h.dairy = cfg.dairyWithSugar ? (h.sugar ? R()<.8 : R()<.2) : R()<.5;
   if(h.clean&&!cfg.dairyWithSugar) h.dairy=R()<.3;
   H[s]=h;
   const logged=R()<cfg.pLog;
   if(logged){
     const add=(p,g,slot)=>d.meals.push({uid:uid(),id:p.id,slot,portion:g});
     add(pick(clean),250,"breakfast"); add(pick(clean),300,"lunch"); add(pick(clean),300,"dinner");
     if(!h.clean) add(pick(pool.filter(p=>cat(p).id!=="fastfood"&&(p.sugar||0)<15)),150,"snack");
     if(h.sugar) add(pick(sweet),180,"snack");
     if(h.fast) add(pick(fast),400,"dinner");
     if(h.dairy) add(pick(dairy),200,"breakfast");
   }
   h.logged=logged;
   d.sleep=R()<cfg.pSleep?Math.max(4,Math.min(10,Math.round((7.1+rn()*0.9)*2)/2)):null; if(d.sleep==null) delete d.sleep;
   d.water=R()<.8?Math.max(0,Math.min(12,Math.round(7+rn()*2))):0;
   h.sleep=d.sleep;
  }
  // Haut am Tag s hängt vom Vortag (und der letzten Nacht) ab
  let ar=0;   // Hautbild hält an: Rauschen mit Gedächtnis (cfg.ar = Korrelation von Tag zu Tag)
  for(let i=days-1;i>=0;i--){ const s=addDays(T,-i), y=H[addDays(T,-i-1)], h=H[s];
   ar=(cfg.ar||0)*ar+Math.sqrt(1-(cfg.ar||0)**2)*rn(); if(R()>cfg.pRate) continue;
   let v=cfg.base+ar*cfg.noise;
   const eff=cfg.eff||{};
   if(eff.sugar&&y.sugar) v+=eff.sugar;
   if(eff.dairy&&y.dairy) v+=eff.dairy;
   if(eff.fast&&y.fast) v+=eff.fast;
   if(eff.combo&&y.sugar&&h.sleep!=null&&h.sleep<7) v+=eff.combo;
   if(eff.clean&&y.clean) v+=eff.clean;
   state.days[s].skin=Math.max(1,Math.min(10,Math.round(v)));
  }
  const ins=skinInsights(); out.runs++;
  if(ins.length) out.any++;
  if(ins.length>3) out.tooMany++;
  ins.forEach(x=>{ out.shown[x.f.id]=(out.shown[x.f.id]||0)+1;
    if(Math.sign(x.diff)!==x.f.dir) out.wrongDir++;
    if(!Number.isFinite(x.diff)||!Number.isFinite(x.n)) out.nan++; });
  if(cfg.want&&ins.some(x=>cfg.want.includes(x.f.id))) out.found++;
  if(out.examples.length<3&&ins.length) out.examples.push(ins.map(x=>x.f.id+" "+x.diff+" ("+x.n+")").join(", "));
 }
 return out;
}"""

BASE = dict(runs=150, dmin=14, dmax=45, pSugar=.35, pFast=.2, pClean=.3, pLog=.85, pSleep=.85, pRate=.85, base=6.5, noise=1.2, dairyWithSugar=False)
SZ = [
  ("Zufall: nichts hängt zusammen", dict(eff={}), dict(maxAny=.07)),
  ("Milch macht Haut besser (darf nie erscheinen)", dict(eff={"dairy":2}), dict(forbid=["dairy"], maxAny=.07)),
  ("Zucker schadet, Milch oft dabei (2–4 Wochen)", dict(eff={"sugar":-2}, dairyWithSugar=True, want=["sugar","sugar+sleep"]), dict(maxShare={"dairy":.04})),
  ("Zucker schadet, Milch oft dabei (5–8 Wochen)", dict(eff={"sugar":-2}, dairyWithSugar=True, want=["sugar","sugar+sleep"], dmin=35, dmax=60), dict(minFound=.6, maxShare={"dairy":.04})),
  ("Zucker + wenig Schlaf zusammen (5–8 Wochen)", dict(eff={"combo":-3}, want=["sugar+sleep","sugar","sleep"], dmin=35, dmax=60), dict(minFound=.35)),
  ("Fast Food schadet (5–8 Wochen)", dict(eff={"fast":-2}, want=["fast","fast+sleep"], dmin=35, dmax=60), dict(minFound=.5)),
  ("Sehr gute Ernährung hilft (5–8 Wochen)", dict(eff={"clean":2}, want=["high","sugar","fast"], dmin=35, dmax=60), dict(minFound=.12)),
  ("Zucker schadet deutlich (3–5 Wochen)", dict(eff={"sugar":-3}, want=["sugar","sugar+sleep"], dmin=21, dmax=35), dict(minFound=.6)),
  ("Zufall, lange Tagebücher (5–8 Wochen)", dict(eff={}, dmin=35, dmax=60), dict(maxAny=.07)),
  # Realistischer: Haut ändert sich langsam und Gewohnheiten kommen in Phasen → Zufallsmuster sehen „echter“ aus
  ("Zufall, Haut & Gewohnheiten in Phasen (3–8 Wochen)", dict(eff={}, dmin=21, dmax=60, ar=.7, streak=.7), dict(maxAny=.08)),
  ("Zucker schadet, Haut & Gewohnheiten in Phasen (5–8 Wochen)", dict(eff={"sugar":-2}, want=["sugar","sugar+sleep"], dmin=35, dmax=60, ar=.7, streak=.7), dict(minFound=.3)),
]

def main():
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(locale="de-DE"); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(1500)
        for name, over, rule in SZ:
            cfg = dict(BASE); cfg.update(over)
            r = pg.evaluate(JS, cfg)
            if "err" in r: print("FEHLER", r["err"]); return 1
            n = r["runs"]; any_ = r["any"]/n; found = r["found"]/n
            probs = []
            if r["wrongDir"]: probs.append(f"{r['wrongDir']}× falsche Richtung")
            if r["tooMany"]: probs.append(f"{r['tooMany']}× mehr als 3")
            if r["nan"]: probs.append(f"{r['nan']}× kaputte Zahl")
            if "maxAny" in rule and any_ > rule["maxAny"]: probs.append(f"zeigt bei Zufall zu oft etwas ({any_:.0%})")
            for f in rule.get("forbid", []):
                if r["shown"].get(f): probs.append(f"„{f}“ erschien {r['shown'][f]}×")
            for f, mx in rule.get("maxShare", {}).items():
                if r["shown"].get(f, 0)/n > mx: probs.append(f"„{f}“ zu oft ({r['shown'][f]/n:.0%})")
            if "minFound" in rule and found < rule["minFound"]: probs.append(f"findet echten Zusammenhang zu selten ({found:.0%})")
            print(f"=== {name}: {n} Tagebücher · irgendwas angezeigt {any_:.0%} · richtig erkannt {found:.0%}")
            print("    angezeigt:", json.dumps(r["shown"], ensure_ascii=False), "| Beispiele:", r["examples"][:2])
            print("    " + ("❌ " + "; ".join(probs) if probs else "✅ in Ordnung"))
            bad += bool(probs)
        if errs: print("JavaScript-Fehler:", errs[:3]); bad += 1
    print("\nERGEBNIS:", "✅ Alle Prüfungen bestanden" if not bad else f"❌ {bad} Probleme")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
