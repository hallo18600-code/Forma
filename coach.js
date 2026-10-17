// Health Maxxing – Coach: Pläne, Quiz, Routine, Produkte, Supplements, Haut
function coachPlans(){
  const skin = skinType();
  const sun = state.skin.sonne === "Täglich" ? "LSF behalten, auch bei Wolken." : "LSF in den Morgen, bevor du rausgehst.";
  return {
    haut: {
      title:"Haut", icon:"drop",
      lead: state.hautPlan ? `Hautbild ${skin}. ${sun}` : "Drei Fragen, dann ein fester Ablauf. Kein 10-Schritte-Regal.",
      why:"Die Haut reagiert auf zu viele neue Produkte schlechter als auf einen kurzen, gleichen Ablauf.",
      avoid:["Neues Serum und Säure am selben Abend","Duft, wenn die Haut brennt","Peeling täglich"],
      steps:[
        ["Morgens nur Wasser oder eine milde Reinigung", "Ein Durchgang reicht."],
        ["Creme ohne Duft, solange die Haut ruhig ist", "Ceramide oder einfache Basis."],
        [sun, "Der wichtigste Schritt am Morgen."],
        ["Abends dasselbe, kein neues Produkt testen", "Ein neues Produkt pro 2 Wochen."]
      ]
    },
    haare: {
      title:"Haare", icon:"hair",
      lead:"Weniger Waschen, weniger Hitze. Das ist der ganze Plan.",
      why:"Trockenheit kommt oft vom Föhnen und vom täglichen Shampoo, nicht vom fehlenden Öl.",
      avoid:["Nass ins Bett","220 °C auf schon trockenes Haar","Fünf Leave-ins übereinander"],
      steps:[
        ["Nur waschen, wenn die Kopfhaut es braucht", "Oft sind 2–3 Mal die Woche genug."],
        ["Mild, ohne den Ansatz zu schrubben", "Spitzen, nicht die Kopfhaut ölen."],
        ["Hitze nur auf handtuchtrockenes Haar", "Eine Stufe runter."],
        ["Eine Pflege behalten, den Rest weglassen", "Mehr Produkt ist kein besserer Plan."]
      ]
    },
    koerper: {
      title:"Körper", icon:"body",
      lead:"Kurz duschen, eine Creme, fertig.",
      why:"Lange heiße Duschen trocknen die Haut aus. Danach fehlt nur eine einfache Schicht.",
      avoid:["Peeling täglich","Duft auf frisch rasierter Haut","Creme nur im Gesicht und nirgends sonst"],
      steps:[
        ["Dusche kurz und nicht brühend", "3–5 Minuten reichen."],
        ["Abtrocknen, dann Creme auf Beine und Arme", "Solange die Haut noch leicht feucht ist."],
        ["Deo erst auf trockener Haut", "Sonst reizt es."],
        ["Ein Produkt für den Körper behalten", "Nicht jede Woche die Marke wechseln."]
      ]
    },
    schlaf: {
      title:"Schlaf", icon:"moon",
      lead:"Gleiche Aufstehzeit schlägt jede Abendroutine.",
      why:"Der Rhythmus hängt am Morgen. Licht und Koffein sind die zwei Hebel, die du wirklich siehst.",
      avoid:["Ausschlafen bis 11 Uhr am Sonntag","Koffein nach 15 Uhr, wenn du schlecht einschläfst","Bildschirm direkt am Gesicht"],
      steps:[
        ["Aufstehzeit heute halten, auch am Wochenende", "Abweichung maximal 60 Minuten."],
        ["45 Minuten vor dem Bett Licht runter", "Lampe, nicht Deckenlicht."],
        ["Koffein prüfen", "Letzter Kaffee grob 8 Stunden vor dem Bett."],
        ["Handy aus dem Bett", "Liegt er woanders, bleibst du eher liegen."]
      ]
    },
    essen: {
      title:"Essen", icon:"leaf",
      lead:`${goalName()}. Protein-Richtwert ${targets().protein} g. Heute ${Math.round(totals().protein)} g.`,
      why:"Ein Teller mit Protein und etwas Unverarbeitetem schlägt ein Verbot. Der Score bestraft Fertiges, nicht einzelne Lebensmittel.",
      avoid:["Alles-oder-nichts nach einer Pizza","Kalorien ausblenden und dann raten","Nur Shakes statt Essen"],
      steps:[
        ["Protein auf mindestens zwei Mahlzeiten", "Skyr, Ei, Fisch, Hähnchen, Hülsenfrüchte."],
        ["Eine Mahlzeit ohne Fertigprodukt", "Nicht perfekt, nur eine."],
        ["Wasser vor dem Nachmittagskaffee", "Oft ist es Durst, nicht Hunger."],
        ["Abend nicht als Ausgleich hungern", "Der nächste Tag wird sonst lauter."]
      ]
    },
    sups: {
      title:"Supplements", icon:"cap",
      lead:"Maximal drei. Alles andere ist Regal, kein Plan.",
      why:"Supplements ersetzen kein Essen. Nur nehmen, wenn Essen oder Sonne eine Lücke lassen.",
      avoid:["Fettverbrenner","Hochdosis ohne Grund","Kollagen vor Schlaf und LSF"],
      steps:[
        ["Stack auf den Vorschlag setzen", "Ziel, Protein heute, Fisch."],
        ["Morgens D3 zur Mahlzeit, falls im Stack", "Nicht nüchtern raten."],
        ["Mengen laut Packung", "Bei Erkrankungen, Medikamenten oder Schwangerschaft vorher ärztlich abklären."],
        ["Abends Magnesium nur wenn Schlaf das Thema ist", "Kein Abführ-Typ."]
      ]
    }
  };
}


function coachTopics(){
  return [
    {id:"haut", title:"Haut", icon:"drop", ask:"Was stört am Gesicht?"},
    {id:"haare", title:"Haare", icon:"hair", ask:"Was stört an den Haaren?"},
    {id:"schlaf", title:"Schlaf", icon:"moon", ask:"Was klappt am Schlaf nicht?"},
    {id:"aussehen", title:"Aussehen", icon:"body", ask:"Was willst du an deinem Aussehen ändern?"},
    {id:"gesundheit", title:"Gesundheit", icon:"leaf", ask:"Wie fühlst du dich im Alltag?"}
  ];
}
// KFA-Stufen je Geschlecht (grobe Orientierung, keine Messung)
function kfaOpts(){ return state.profile.sex==="w" ? ["Unter 20 %","20–27 %","27–33 %","Über 33 %","Weiß nicht"] : ["Unter 12 %","12–18 %","18–25 %","Über 25 %","Weiß nicht"]; }
function coachQuiz(id){
  const q = {
    haut:[
      {k:"bild", q:"Wie fühlt sich die Haut an?", opts:["Trocken","Fettig","Gemischt","Normal","Sensibel"]},
      {k:"stoert", q:"Was stört dich am meisten?", opts:["Unreinheiten","Glänzt / große Poren","Rötung","Trockenheit","Pigmentflecken","Wirkt stumpf","Erste Fältchen","Nichts Bestimmtes"]},
      {k:"art", q:"Welche Unreinheiten?", opts:["Mitesser","Entzündete Pickel","Tiefe, schmerzhafte Knoten","Rote/braune Male"], emo:{"Mitesser":"⚫","Entzündete Pickel":"🔴","Tiefe, schmerzhafte Knoten":"⚠️","Rote/braune Male":"🟤"}, skip:a=>a.stoert!=="Unreinheiten"},
      {k:"rot", q:"Wie zeigt sich die Rötung?", opts:["Brennt / spannt schnell","Wangen & Nase, oft mit Pickelchen","Schuppig an Nase / Brauen"], skip:a=>a.stoert!=="Rötung"},
      {k:"hab", q:"Was hast du schon?", multi:true, none:"Nichts davon", opts:["Waschgel","Creme","Sonnencreme","Serum","Nichts davon"]},
      {k:"sonne", q:"Wie oft trägst du Sonnenschutz?", opts:["Täglich","Manchmal","Selten"]},
      {k:"empf", q:"Reagiert die Haut auf Duft oder neue Produkte?", opts:["Ja","Nein","Weiß nicht"], skip:a=>a.bild==="Sensibel"}
    ],
    haare:[
      {k:"stoert", q:"Was stört dich?", opts:["Fettiger Ansatz","Trocken / Spliss","Schuppen","Fallen viel aus","Nichts Konkretes"]},
      {k:"schuppen", q:"Wie sehen die Schuppen aus?", opts:["Gelblich, fettig, juckt","Klein, weiß, trocken"], skip:a=>a.stoert!=="Schuppen"},
      {k:"ausfall", q:"Wie zeigt sich der Ausfall?", opts:["Geheimratsecken / Scheitel","Überall dünner","Kahle runde Stellen"], skip:a=>a.stoert!=="Fallen viel aus"},
      {k:"wasch", q:"Wie oft wäschst du die Haare?", opts:["Täglich","2–3 mal","Seltener"]},
      {k:"hitze", q:"Wie oft kommt Hitze dran?", opts:["Fast immer","Manchmal","Selten"]},
      {k:"typ", q:"Haartyp?", opts:["Glatt","Wellig","Lockig"]},
      {k:"laenge", q:"Wie trägst du sie?", opts:["Kurz","Mittel","Lang"], emo:{"Kurz":"✂️","Mittel":"💇","Lang":"💁"}},
      {k:"form", q:"Deine Gesichtsform?", opts:["Oval","Rund","Eckig","Länglich","Herzförmig","Weiß nicht"], emo:{"Oval":"🥚","Rund":"⚪","Eckig":"⬛","Länglich":"📏","Herzförmig":"🤍","Weiß nicht":"🤔"}}
    ],
    schlaf:[
      {k:"aufzeit", q:"Wann musst du meistens aufstehen?", opts:["Vor 6 Uhr","6–7 Uhr","7–8 Uhr","Nach 8 Uhr"]},
      {k:"ein", q:"Wie ist das Einschlafen?", opts:["Geht schnell","Dauert","Wach in der Nacht"]},
      {k:"auf", q:"Ist die Aufstehzeit fest?", opts:["Ja, auch am Wochenende","Wechselt stark"]},
      {k:"kaffee", q:"Kaffee nach 15 Uhr?", opts:["Oft","Selten","Nie"]},
      {k:"stunden", q:"Wie viele Stunden schläfst du?", opts:["Unter 6","6–7","7–8","Über 8"]},
      {k:"vorher", q:"Was machst du in der Stunde vorm Schlafen?", opts:["Handy / Serie im Bett","Arbeit / Lernen","Sport","Ruhig, z. B. lesen"], emo:{"Handy / Serie im Bett":"📱","Arbeit / Lernen":"💻","Sport":"🏃","Ruhig, z. B. lesen":"📖"}},
      {k:"morgen", q:"Wie fühlst du dich morgens?", opts:["Ausgeruht","Gerädert"], emo:{"Ausgeruht":"😊","Gerädert":"🥴"}}
    ],
    aussehen:[
      {k:"ziel", q:"Was willst du verbessern?", multi:true, opts:["Weniger Bauchfett","Mehr Muskeln","Gesicht definierter","Bessere Haltung","Frischer wirken"], emo:{"Weniger Bauchfett":"🔥","Mehr Muskeln":"💪","Gesicht definierter":"🗿","Bessere Haltung":"🧍","Frischer wirken":"✨"}},
      {k:"kfa", q:"Wie hoch schätzt du deinen Körperfettanteil?", opts:kfaOpts()},
      {k:"bloat", q:"Wirkt dein Gesicht morgens aufgedunsen?", opts:["Oft","Manchmal","Selten"]},
      {k:"abend", skip:a=>a.bloat==="Selten", q:"Was gibt es abends oft?", multi:true, none:"Nichts davon", opts:["Salziges / Fast Food","Alkohol","Spät gegessen","Nichts davon"], emo:{"Salziges / Fast Food":"🍟","Alkohol":"🍺","Spät gegessen":"🌙","Nichts davon":"👍"}},
      {k:"sitzen", q:"Wie viele Stunden sitzt du am Tag?", opts:["Unter 4","4–8","Über 8"]}
    ],
    gesundheit:[
      {k:"stil", q:"Wie isst du?", opts:["Alles","Wenig Fleisch","Vegetarisch","Vegan"], emo:{"Alles":"🍗","Wenig Fleisch":"🥗","Vegetarisch":"🧀","Vegan":"🌱"}},
      {k:"energie", q:"Wie ist deine Energie am Nachmittag?", opts:["Konstant","Tief nach dem Essen","Ständig müde"], emo:{"Konstant":"⚡","Tief nach dem Essen":"🥱","Ständig müde":"😴"}},
      {k:"bauch", q:"Fühlt sich dein Bauch oft aufgebläht an?", opts:["Oft","Manchmal","Selten"], emo:{"Oft":"🎈","Manchmal":"🙂","Selten":"👍"}},
      {k:"intol", q:"Verträgst du etwas nicht?", multi:true, none:"Nein, alles okay", opts:["Laktose","Gluten","Nüsse","Nein, alles okay"], emo:{"Laktose":"🥛","Gluten":"🌾","Nüsse":"🥜","Nein, alles okay":"👍"}},
      {k:"wasser", q:"Wie viel trinkst du am Tag?", opts:["Unter 1 Liter","1–2 Liter","Über 2 Liter"], emo:{"Unter 1 Liter":"🥤","1–2 Liter":"💧","Über 2 Liter":"🌊"}},
      {k:"trink", q:"Wie oft trinkst du Zuckergetränke?", opts:["Täglich","Manchmal","Nie"]},
      {k:"alk", q:"Wie oft trinkst du Alkohol?", opts:["Mehrmals pro Woche","Am Wochenende","Selten oder nie"]}
    ]
  };
  return q[id]||[];
}
function skinType(){ const b=((state.coach.answers||{}).haut||{}).bild; return {Trocken:"trocken",Fettig:"fettig",Gemischt:"normal",Normal:"normal",Sensibel:"sensibel"}[b]||state.skin.typ||"normal"; }
// Frage nötig? Manche Antworten machen eine spätere Frage überflüssig (z. B. sensible Haut → Duft-Frage).
function qNeeded(q,a){ return !(q.skip&&q.skip(a||{})); }
function quizDone(id){ const a=(state.coach.answers||{})[id]||{}; return coachQuiz(id).every(q=>!qNeeded(q,a)||hasVal(a[q.k])); }
// Quizze aus dem Onboarding, die noch nicht fertig sind
function openQuizzes(){ return ["haut","gesundheit","schlaf"].filter(id=>!quizDone(id)); }
// Alte Antworten übernehmen (Ernährung → Gesundheit)
function migrateCoach(s){
  const A=s.coach.answers, old=A.ernaehrung;
  if(old&&!A.gesundheit){ A.gesundheit={}; ["stil","intol","wasser","trink"].forEach(k=>{ if(old[k]!=null) A.gesundheit[k]=old[k]; }); }
  return s;
}
// Alte Coach-Routinen (4 Punkte pro Thema) einmalig zu einem Punkt zusammenfassen
function slimRoutine(){
  if(state.coachV>=2) return; state.coachV=2;
  const rt=state.coach.routine||[];
  ["haut","haare","schlaf"].forEach(t=>{
    if(!rt.some(r=>new RegExp("^"+t+"-\\d+$").test(r.id))) return;
    const r=coachAdvice(t).routine, i=rt.findIndex(x=>x.topic===t);
    const keep=rt.filter(x=>!new RegExp("^"+t+"-\\d+$").test(x.id));
    keep.splice(Math.min(i,keep.length),0,{id:t+"-r",topic:t,title:r.title,detail:r.detail,product:null});
    rt.splice(0,rt.length,...keep);
  });
  save();
}
const cjoin=(arr)=>arr.filter(Boolean).join(" → ");
const cap=t=>t?t[0].toUpperCase()+t.slice(1):"";
// Kurzer Name für die Routine-Liste (Details stehen im Coach-Thema)
function rShort(r){ if(["haut","haare","schlaf","aussehen","gesundheit"].includes(r.topic)){ try{ const x=coachAdvice(r.topic).routine; if(x&&x.short) return x.short; }catch(e){} } return r.title; }
// ---------- Coach-Tipps ----------
// Ein Tipp: k = Kurzname für den Routine-Punkt (null = einmalige Sache, kommt nicht in die Routine),
// title = einfacher Tipp, detail = ganz kurze Begründung (wird in „…“ gezeigt). Beides bewusst knapp halten.
const tip=(k,title,detail,extra)=>Object.assign({k,title,detail,product:null},extra||{});
// Wichtige Tipps (must) zuerst, dann reihum je einen Tipp aus jeder Gruppe, damit jedes gewählte Ziel vorkommt
function pickTips(groups,max){
  const gs=groups.map(g=>(g||[]).filter(Boolean)).filter(g=>g.length), out=[], seen=new Set();
  const add=t=>{ const id=t.k||t.title; if(seen.has(id)||out.length>=max) return false; seen.add(id); out.push(t); return true; };
  gs.forEach(g=>g.filter(t=>t.must).forEach(add));
  const pos=gs.map(()=>0);
  for(let more=true; more&&out.length<max;){
    more=false;
    gs.forEach((g,i)=>{ while(pos[i]<g.length){ const t=g[pos[i]++]; if(add(t)){ more=true; break; } } if(pos[i]<g.length) more=true; });
  }
  return out;
}
// Routine-Punkt = Zusammenfassung ALLER Tipps eines Themas (Details per › im Coach)
function sumRoutine(label,items,detail,fallback,extra){
  let keys=[...new Set(items.map(i=>i.k).concat(extra||[]).filter(Boolean))];
  if(!keys.length&&fallback) keys=[fallback];
  const s=keys.slice(0,4).join(" · ");
  return {title:label+": "+s, short:s, detail:detail||""};
}

// ---------- Haut ----------
function hautAdvice(a){
  const typ=a.bild||"Normal", st=a.stoert||"Nichts Bestimmtes", has=a.hab||[], w=state.profile.sex==="w";
  const sens=typ==="Sensibel"||a.empf==="Ja", dry=typ==="Trocken", oily=typ==="Fettig", mixed=typ==="Gemischt";
  const slow=sens||dry; // empfindliche/trockene Haut: Wirkstoffe langsamer einschleichen
  let wash=dry||sens?"Reinigungsmilch":"Reinigungsgel";
  let cream=dry?"Ceramid-Creme":oily?"Gel-Fluid":sens?"Panthenol-Creme":"leichte Creme";
  let spf=sens?"Mineral-LSF 50":oily||mixed?"LSF 50 Fluid":"LSF 50";
  const am=[], pm=[], spot=[]; let items=[], note="", photo=false; // photo = Wirkstoff macht sonnenempfindlicher
  const n=slow?"2×":"3×";
  const lsf=(d)=>tip("LSF 50",`${spf} jeden Morgen`,d||"Größter Schutz vor Hautalterung.",{product:"spf"});
  const bha=()=>tip("BHA 2 %",`BHA 2 % abends, ${n}/Woche`,"Löst Talg in der Pore. Langsam steigern.",{product:"bha"});
  const nia=(when,d)=>tip("Niacinamid",`Niacinamid 4–5 % ${when}`,d,{product:"nia"});
  const aze=(pct,d)=>tip("Azelainsäure",`Azelainsäure ${pct} abends${slow?", jeden 2. Tag":""}`,d,{product:"azelain"});

  if(st==="Unreinheiten"){
    const art=a.art||"Entzündete Pickel";
    if(art==="Mitesser"){
      items=[bha(), nia("morgens","Weniger Talg, weniger Mitesser."), tip(null,"Nicht ausdrücken","Weitet die Pore, entzündet sich.")];
      pm.push(`BHA (${n}/Wo.)`); am.push("Niacinamid"); photo=true;
      note="Wirkt nach 6–12 Wochen. Sonst: Hautarzt.";
    } else if(art==="Tiefe, schmerzhafte Knoten"){
      items=[tip(null,"Zum Hautarzt","Knoten machen Narben. Braucht Rezept-Mittel.",{must:1}),
        aze("10–20 %","Bis dahin: beruhigt, verstopft nichts."),
        tip(null,"Nie ausdrücken","Sitzen zu tief, gibt Narben.",{must:1})];
      pm.push("Azelainsäure");
    } else if(art==="Rote/braune Male"){
      items=[lsf("UV macht Male dunkler."), aze("10–20 %","Hellt Male auf, stoppt neue Pickel."), nia("morgens","Bremst neue Verfärbung.")];
      am.push("Niacinamid"); pm.push("Azelainsäure");
      note="Male verblassen in 3–6 Monaten.";
    } else {
      items=[aze(sens?"10 %":"10–20 %","Gegen Bakterien und Entzündung. Kribbeln anfangs normal."),
        tip("Zink punktuell","Zinksalbe nur auf entzündete Pickel","Trocknet aus. Flächig verstopft sie Poren.",{product:"zink"}),
        tip(null,"Nicht ausdrücken","Gibt Male und tiefere Entzündung.")];
      pm.push("Azelainsäure"); spot.push("Zink auf Pickel");
      note="Nach 8–12 Wochen keine Besserung: Hautarzt.";
    }
  } else if(st==="Glänzt / große Poren"){
    spf="LSF 50 Fluid";
    items=[nia("morgens + abends","Weniger Talg, Poren wirken kleiner."), bha(),
      tip("Mattes LSF-Fluid","LSF als Fluid statt Creme","Mattiert, ohne zu fetten.",{product:"spf"})];
    am.push("Niacinamid"); pm.push("Niacinamid",`BHA (${n}/Wo.)`); photo=true;
    note="Poren schrumpfen nicht, wirken aber kleiner.";
  } else if(st==="Rötung"){
    const rot=a.rot||"Brennt / spannt schnell";
    if(rot==="Wangen & Nase, oft mit Pickelchen"){
      spf="Mineral-LSF 50"; wash="Reinigungsmilch"; cream="Panthenol-Creme";
      items=[tip("Azelainsäure",`Azelainsäure 10–15 % abends${slow?", jeden 2. Tag":""}`,"Gegen Rötung und Pickelchen.",{product:"azelain"}),
        tip(null,"Hitze, Alkohol, Scharfes meiden","Typische Auslöser für Schübe."),
        lsf("Sonne ist Auslöser Nr. 1.")];
      pm.push("Azelainsäure");
      note="Klingt nach Rosazea. Hautarzt hat stärkere Mittel (z. B. 15 %).";
    } else if(rot==="Schuppig an Nase / Brauen"){
      cream="leichte Creme ohne Öle";
      items=[tip("Anti-Schuppen-Maske","Anti-Schuppen-Shampoo 2×/Woche drauf","Ketoconazol/Zink. 3 Min, dann abwaschen."),
        tip(null,"Leichte Creme, keine Öle","Fett füttert den Hefepilz dahinter."),
        tip(null,"Kopfhaut mitbehandeln","Oft dieselbe Ursache.")];
      spot.push("Schuppen-Maske (2×/Wo.)");
      note="Kommt in Schüben. Breitet es sich aus: Hautarzt.";
    } else {
      wash="Reinigungsmilch"; cream="Ceramid-Creme"; spf="Mineral-LSF 50";
      items=[tip("Nur 3 Produkte","2 Wochen: nur Reinigung, Creme, LSF","Die Barriere braucht Ruhe."),
        tip("Ceramide","Creme mit Ceramiden + Panthenol","Repariert die Barriere.",{product:"cerave"}),
        tip(null,"Lauwarm waschen, abtupfen","Hitze und Reiben reizen.")];
      note="Bis es ruhig ist: keine Säuren, kein Retinol, kein Duft.";
    }
  } else if(st==="Trockenheit"){
    wash="Reinigungsmilch"; cream="Ceramid-Creme";
    items=[tip("Ceramide","Ceramid-Creme auf feuchte Haut","Hält das Wasser in der Haut.",{product:"cerave"}),
      sens?tip("Panthenol","Abends Panthenol-Creme","Beruhigt und spendet Feuchtigkeit."):tip("Urea 5 %","Abends Creme mit 5 % Urea","Bindet Feuchtigkeit, glättet."),
      tip(null,"Morgens nur Wasser","Jedes Waschen nimmt Fett weg.")];
    pm.push(sens?"Panthenol-Creme":"Urea-Creme");
    note="Rot, schuppig, juckt: Hautarzt (Ekzem?).";
  } else if(st==="Pigmentflecken"){
    spf=sens?"getönter Mineral-LSF 50":"getönter LSF 50";
    items=[tip("Getönter LSF 50",`${cap(spf)}, mittags nachcremen`,"Blockt auch sichtbares Licht.",{product:"spf"}),
      sens?nia("morgens","Bremst neue Verfärbung."):tip("Vitamin C","Vitamin-C-Serum morgens","Hellt auf, stärkt den LSF.",{product:"vitc"}),
      aze("10–20 %","Hemmt die Farbstoffbildung.")];
    am.push(sens?"Niacinamid":"Vitamin C"); pm.push("Azelainsäure");
    note="Fleck wächst oder verändert sich: Hautarzt.";
  } else if(st==="Wirkt stumpf"){
    items=[sens?nia("morgens","Gleicht den Teint aus."):tip("Vitamin C","Vitamin-C-Serum morgens","Mehr Glow, schützt vor Radikalen.",{product:"vitc"}),
      tip("Milchsäure",`Milchsäure 5–10 % abends, ${sens?"1×":"2×"}/Woche`,"Löst abgestorbene Schüppchen."),
      tip(null,"Hyaluron auf feuchte Haut","Pralle Haut wirkt frischer.")];
    am.push(sens?"Niacinamid":"Vitamin C"); pm.push(`Milchsäure (${sens?"1×":"2×"}/Wo.)`); photo=true;
  } else if(st==="Erste Fältchen"){
    items=[sens?tip("Retinol","Retinol 0,1–0,2 %: Creme, Retinol, Creme","Sandwich reizt weniger. Langsam steigern.",{product:"retinol"})
               :tip("Retinol","Retinol 0,2–0,3 % abends, 2×/Woche","Bester Wirkstoff gegen Fältchen.",{product:"retinol"}),
      lsf("UV macht die meiste Hautalterung."),
      sens?nia("morgens","Macht Retinol verträglicher."):tip("Vitamin C","Vitamin-C-Serum morgens","Fördert Kollagen.",{product:"vitc"})];
    pm.push(sens?"Retinol (Sandwich)":"Retinol (2×/Wo.)"); am.push(sens?"Niacinamid":"Vitamin C"); photo=true;
    note=(w?"Kein Retinol in Schwangerschaft/Stillzeit. ":"")+"Nie am selben Abend wie Säuren.";
  } else {
    items=[tip(null,"Reinigung, Creme, LSF reichen","Gesunde Haut braucht keine 10 Schritte."),
      tip(null,"Neues einzeln, 2 Wochen Abstand","So merkst du, was reizt.")];
  }
  // Kein täglicher LSF → LSF-Tipp hat Vorrang vor einem weniger wichtigen Tipp
  if(a.sonne!=="Täglich"&&!items.some(i=>i.k==="LSF 50"||i.k==="Getönter LSF 50")){
    const t=lsf(photo?"Dein Wirkstoff macht sonnenempfindlich.":"Wichtigster Schritt jeder Routine.");
    let i=-1; items.forEach((x,j)=>{ if(!x.k&&!x.must) i=j; });
    if(items.length<3) items.push(t); else if(i>=0) items[i]=t; else items[items.length-1]=t;
  }
  const morning=[dry||sens?"Wasser":wash, ...am, oily?null:cream, spf];
  const evening=[wash, ...pm, cream, ...spot];
  const newOnes=items.map(i=>i.k).filter(k=>k&&!/LSF|Ceramide|Nur 3|Panthenol/.test(k)).map(k=>({"Zink punktuell":"Zinksalbe","Anti-Schuppen-Maske":"Anti-Schuppen-Shampoo"}[k]||k));
  const missing=[...new Set([!has.includes("Waschgel")&&wash, !has.includes("Creme")&&cream, !has.includes("Sonnencreme")&&spf, ...(has.includes("Serum")?[]:newOnes)].filter(Boolean))];
  const routine=sumRoutine("Haut",items,"",null,["LSF 50"]);
  routine.am=morning.filter(Boolean); routine.pm=evening.filter(Boolean);
  return {lead:`Hautbild ${typ.toLowerCase()} · ${st==="Unreinheiten"?(a.art||st):st==="Rötung"?(a.rot||st):st}`, routine, items:items.slice(0,3), note, missing};
}

// ---------- Haare ----------
function haareAdvice(a){
  const st=a.stoert||"Nichts Konkretes", heat=a.hitze&&a.hitze!=="Selten", curly=a.typ==="Lockig", w=state.profile.sex==="w";
  let tips=[], note="";
  if(st==="Fettiger Ansatz"){
    tips=[tip("Waschen nach Bedarf","Waschen, wenn's fettet, auch täglich","Seltener waschen gewöhnt nichts um."),
      tip("Shampoo nur am Ansatz","Shampoo oben, Conditioner nur unten","Conditioner am Ansatz fettet nach."),
      tip(null,"Trockenshampoo für Tag 2","Saugt Talg auf. Abends ausbürsten.")];
  } else if(st==="Trocken / Spliss"){
    tips=[tip("1× Woche Maske","1×/Woche Haarmaske, 10 Min","Glättet das Haar, weniger Bruch."),
      tip("Öl in die Spitzen","2–3 Tropfen Öl in die Spitzen","Schützt die Längen vorm Austrocknen."),
      tip(null,"Alle 8–12 Wochen 1 cm ab","Spliss geht nur mit der Schere weg.")];
  } else if(st==="Schuppen"){
    if(a.schuppen==="Klein, weiß, trocken"){
      tips=[tip("Mildes Shampoo","Mildes Shampoo ohne Duft","Starke Tenside trocknen aus.",{product:"shampoo"}),
        tip("Kopfhaut-Serum","Kopfhaut-Serum mit Urea/Panthenol","Spendet Feuchtigkeit, stoppt Jucken."),
        tip(null,"Lauwarm waschen, kühl föhnen","Hitze trocknet die Kopfhaut aus.")];
    } else {
      tips=[tip("Anti-Schuppen-Shampoo","Ketoconazol- oder Zink-Shampoo, 2–3×/Woche","Wirkt gegen den Hefepilz dahinter."),
        tip(null,"3–5 Min einwirken lassen","Sonst wirkt der Wirkstoff kaum."),
        tip(null,"Nach 4 Wochen: 1×/Woche weiter","Sonst kommen sie zurück.")];
      note="Dicke, rote Stellen: Hautarzt (Schuppenflechte?).";
    }
  } else if(st==="Fallen viel aus"){
    const af=a.ausfall||"Überall dünner";
    if(af==="Geheimratsecken / Scheitel"){
      tips=[tip("Minoxidil",`Minoxidil 5 % Schaum, ${w?"1×":"2×"} täglich`,"Rezeptfrei, gut belegt. Wirkt nach 3–6 Monaten."),
        tip(null,"Früh zum Hautarzt","Je früher, desto mehr bleibt."),
        tip("Ketoconazol-Shampoo","Ketoconazol-Shampoo 2×/Woche","Kann leicht unterstützen.")];
      note="Anfangs fallen kurz mehr aus, das ist normal."+(w?" Nicht in Schwangerschaft/Stillzeit.":"");
    } else if(af==="Kahle runde Stellen"){
      tips=[tip(null,"Zeitnah zum Hautarzt","Gut behandelbar, aber nicht mit Shampoo.",{must:1}),
        tip("Mildes Shampoo","Bis dahin mild waschen","Nichts selbst behandeln.",{product:"shampoo"})];
    } else {
      tips=[tip(null,"Blutbild: Ferritin, Vit. D, Schilddrüse","Häufigste Ursachen."),
        tip("Protein",`${targets().protein} g Protein, keine Crash-Diät`,"Haare reagieren 2–3 Monate verzögert."),
        tip(null,"Wächst meist in 3–6 Monaten nach","Ursache weg, Haare kommen zurück.")];
    }
  } else {
    if(a.wasch==="Täglich") tips.push(tip("Ein Waschtag weniger","Ein Waschtag weniger pro Woche","Schont die Längen."));
    tips.push(tip("Conditioner","Conditioner nach jeder Wäsche","Nur in die Längen. Schützt vor Bruch."));
  }
  if(heat) tips.push(tip("Hitzeschutz","Hitzeschutz, max. 180 °C","Darüber leidet das Keratin."));
  if(curly) tips.push(tip("Locken","Nur nass entwirren, T-Shirt statt Handtuch","Schont die Lockenform."));
  const items=tips.slice(0,3);
  const cut=haarSchnitt(a.form, a.laenge);
  if(cut) items.unshift(cut);   // Schnitt-Tipp immer zuerst
  const routine=sumRoutine("Haare",items,"","Mildes Shampoo");
  return {lead:`${a.typ||"Haar"}${a.laenge?", "+a.laenge.toLowerCase():""} · ${st==="Fallen viel aus"&&a.ausfall?a.ausfall:st}`, routine, items, note};
}
// Kurzer Schnitt-Tipp nach Gesichtsform (kurz = Kurzhaar, sonst Mittel/Lang). Allgemeine Stilregeln.
function haarSchnitt(form, len){
  if(!form) return null;
  if(form==="Weiß nicht") return tip(null,"Schnitt-Tipp","Frag den Friseur nach deiner Gesichtsform.");
  const k=len==="Kurz";
  const t={
    "Oval":      "Fast jeder Schnitt passt.",
    "Rund":      k?"Oben Volumen, Seiten kurz.":"Stufen unters Kinn, Seitenscheitel.",
    "Eckig":     k?"Oben locker, Seiten nicht zu kurz.":"Weiche Stufen oder Wellen.",
    "Länglich":  k?"Seiten nicht zu kurz, oben flach.":"Volumen an den Seiten, Pony passt.",
    "Herzförmig":k?"Oben nicht zu voll, Seiten länger.":"Volumen ab Kinnhöhe, Seitenpony."
  }[form];
  return t?tip(null,`Schnitt: ${t}`,`Passt zu ${form==="Herzförmig"?"herzförmigem":form.toLowerCase()+"em"} Gesicht.`):null;
}

// ---------- Schlaf ----------
function hm(min){ min=((min%1440)+1440)%1440; return Math.floor(min/60)+":"+String(min%60).padStart(2,"0"); }
function schlafAdvice(a){
  const wake={"Vor 6 Uhr":330,"6–7 Uhr":390,"7–8 Uhr":450,"Nach 8 Uhr":510}[a.aufzeit]||420;
  const bed=wake-480, caf=bed-480, dim=bed-60;
  const alk=((state.coach.answers||{}).gesundheit||{}).alk==="Mehrmals pro Woche";
  const g=[];
  if(a.morgen==="Gerädert"&&(a.stunden==="7–8"||a.stunden==="Über 8"))
    g.push([tip(null,"Schnarchen? Ärztlich abklären","Genug Stunden, trotzdem gerädert: oft Atemaussetzer.",{must:1})]);
  if(a.stunden==="Unter 6"||a.stunden==="6–7")
    g.push([tip(`Bett ${hm(bed)}`,`Um ${hm(bed)} ins Bett`,"Ziel 7–9 h. Jede Woche 15 Min früher.")]);
  if(a.ein==="Dauert") g.push([tip("Morgenlicht","10 Min Tageslicht nach dem Aufstehen","Stellt die innere Uhr."),
    tip("20-Min-Regel","Nach 20 Min wach: kurz aufstehen","Bett bleibt zum Schlafen, nicht Grübeln.")]);
  if(a.ein==="Wach in der Nacht") g.push([tip("16–19 °C","Schlafzimmer auf 16–19 °C","Kühl schläft man durch."),
    alk?tip("Kein Alkohol abends","3 h vorm Bett kein Alkohol","Stört die zweite Nachthälfte."):tip(null,"Nachts nicht auf die Uhr schauen","Rechnen macht hellwach.")]);
  if(a.kaffee==="Oft") g.push([tip(`Kaffee bis ${hm(caf)}`,`Letzter Kaffee bis ${hm(caf)}`,"Nach 5 h wirkt noch die Hälfte.")]);
  if(a.vorher==="Handy / Serie im Bett") g.push([tip("Handy raus","Handy 30 Min vorher weg","Inhalte halten wach, mehr als das Licht.")]);
  if(a.vorher==="Arbeit / Lernen") g.push([tip("To-do notieren","5 Min To-dos für morgen notieren","So schläfst du schneller ein.")]);
  if(a.vorher==="Sport") g.push([tip("Sport früher","Harten Sport 1–2 h vorm Bett beenden","Puls und Temperatur sind sonst zu hoch.")]);
  if(a.auf==="Wechselt stark") g.push([tip("Feste Weckzeit",`Wochenende spätestens ${hm(wake+60)} aufstehen`,"Ausschlafen wirkt wie Mini-Jetlag.")]);
  let items=pickTips(g,3);
  if(!items.length) items=[tip(null,"Dein Schlaf passt","Zeiten halten.")];
  const routine=sumRoutine("Schlaf",items,`⏰ ${hm(wake)} · ☕ bis ${hm(caf)} · 💡 ${hm(dim)} · 🛏️ ${hm(bed)}`,null);
  if(!routine.short.includes("Bett")){ routine.short=[`Bett ${hm(bed)}`].concat(routine.short?routine.short.split(" · "):[]).slice(0,4).join(" · "); routine.title="Schlaf: "+routine.short; }
  return {lead:`Aufstehen ${hm(wake)} → Bett ${hm(bed)}`, routine, items};
}

// ---------- Aussehen ----------
// Grobe KFA-Schätzung aus BMI, Alter, Geschlecht (Deurenberg). Ungenau, nur Orientierung.
function kfaGuess(){ const p=state.profile, m=p.height/100, bmi=lastWeight()/(m*m); return Math.round(1.2*bmi+0.23*p.age-10.8*(p.sex==="m"?1:0)-5.4); }
function kfaLevel(a){
  const i=kfaOpts().indexOf(a.kfa);
  if(i>=0&&i<4) return i;
  const g=kfaGuess(), cut=state.profile.sex==="w"?[20,27,33]:[12,18,25];
  return g<cut[0]?0:g<cut[1]?1:g<cut[2]?2:3;
}
function kcalFor(goal){ const old=state.profile.goal; state.profile.goal=goal; const k=targets().kcal; state.profile.goal=old; return k; }
function aussehenAdvice(a){
  const ziel=a.ziel||[], lvl=kfaLevel(a), g=state.profile.goal, t=targets(), p=state.profile;
  const lifts=["Krafttraining","Beides"].includes(p.trainType);
  const fatGoal=ziel.includes("Weniger Bauchfett")||ziel.includes("Gesicht definierter");
  const prot=Math.max(t.protein, Math.round(p.weight*1.6));
  let cal=null;
  if(lvl>=3||(lvl===2&&fatGoal))
    cal = g==="lose" ? tip("Defizit halten",`Bei ${de(t.kcal)} kcal bleiben`,"Fett geht, Muskeln bleiben.")
      : tip("Leichtes Defizit",`Kalorien auf ${de(kcalFor("lose"))} senken`,"Nur weniger Körperfett macht Bauch und Gesicht schlanker.",{act:"coach-goal",v:"lose",label:"Kalorienziel senken"});
  const lean = lvl===0&&g==="lose" ? tip("Muskeln statt Minus","Nicht weiter abnehmen","Du bist schlank. Jetzt bringen Muskeln Form.",{act:"coach-goal",v:"muscle",label:"Auf Muskelaufbau stellen"}) : null;
  const sit = a.sitzen==="Über 8" ? tip("Stündlich aufstehen","Jede Stunde 2 Min aufstehen","Gegen Rundrücken und träge Durchblutung.") : null;
  const G={
    "Weniger Bauchfett":[cal, tip("8.000 Schritte","8.000+ Schritte am Tag","Verbrennt viel, ohne Hunger zu machen."),
      tip(null,"Bauchübungen allein reichen nicht","Fett geht nie gezielt an einer Stelle.")],
    "Mehr Muskeln":[lifts?tip("Progression","Jede Woche +1 Wdh. oder +2,5 kg","Ohne mehr Last kein Wachstum.")
        :tip("3× Kraft","3×/Woche Krafttraining","Ganzkörper reicht für den Anfang.",{act:"tab",v:"sport",label:"Zum Training"}),
      tip("Protein",`${prot} g Protein am Tag`,"1,6–2,2 g pro kg holen das Maximum raus."),
      tip("Kreatin","3–5 g Kreatin täglich","Bestuntersuchtes Supplement für Kraft.")],
    "Gesicht definierter":[lvl>=2?cal:null, tip("Mewing","Mewing: Zunge an den Gaumen, Lippen zu","Nasenatmung + Haltung strafft die Kinnlinie optisch.")],
    "Bessere Haltung":[tip("Rudern & Face Pulls","Mehr ziehen als drücken","Rudern, Face Pulls: Schultern gehen zurück."),
      tip("Brust dehnen","Täglich 30 Sek. Brust dehnen (Türrahmen)","Enge Brust zieht Schultern nach vorn."), sit],
    "Frischer wirken":[tip("7–9 h Schlaf","7–9 Stunden schlafen","Schlafmangel zeigt sich zuerst im Gesicht."),
      tip("LSF 50","Jeden Morgen LSF 50","Hält den Teint gleichmäßig.")]
  };
  const groups=[lean?[lean]:[]].concat(ziel.map(z=>G[z]));
  if(a.bloat==="Oft"||a.bloat==="Manchmal"){
    const ab=(a.abend||[]).filter(x=>x!=="Nichts davon").map(x=>({"Salziges / Fast Food":"Salz","Alkohol":"Alkohol","Spät gegessen":"spätes Essen"}[x]));
    groups.push([tip("Gua Sha","Morgens 2 Min Gua Sha, nach außen","Schiebt Wasser ab, Gesicht wirkt schlanker."),
      ab.length?tip(null,`Abends weniger ${ab.join(", ")}`,"Bindet über Nacht Wasser im Gesicht."):tip(null,"Kopf beim Schlafen leicht hoch","Weniger Wasser im Gesicht.")]);
  }
  groups.push([sit]);
  if(!ziel.length) groups.unshift([cal]);
  let items=pickTips(groups,4);
  if(!items.length) items=[tip("Training nach Plan","Training nach Plan halten","Regelmäßig schlägt jedes Extra.")];
  const kfaTxt=a.kfa==="Weiß nicht"?`KFA ca. ${kfaGuess()} % (geschätzt)`:`KFA ${a.kfa||"–"}`;
  return {lead:`${kfaTxt} · ${ziel.length?ziel.join(", "):"kein Fokus"}`, routine:sumRoutine("Aussehen",items,"","Training nach Plan"), items};
}

// ---------- Gesundheit ----------
function gesundheitAdvice(a){
  const glasses=state.profile.waterTarget||8, intol=(a.intol||[]).filter(x=>x!=="Nein, alles okay"), g=[];
  let note="";
  if(a.stil==="Vegan") g.push([tip("B12","Vitamin B12 täglich","Fehlt vegan. Mangel schadet Blut und Nerven.",{product:"b12"}),
    tip("Jodsalz","Mit Jodsalz kochen","Vegan fehlt oft Jod.")]);
  if(a.energie==="Ständig müde") g.push([tip(null,"Blutbild: Ferritin, B12, Vit. D, Schilddrüse","Häufigste Gründe für Dauermüdigkeit.",{must:1}),
    tip("Morgens raus","Morgens 10 Min raus","Tageslicht macht wach.")]);
  if(a.energie==="Tief nach dem Essen") g.push([tip("Erst Gemüse & Protein","Erst Gemüse & Protein, dann Beilage","Blutzucker steigt langsamer, kleineres Tief."),
    tip("10 Min gehen","10 Min gehen nach dem Essen","Muskeln ziehen Zucker aus dem Blut.")]);
  if(a.bauch==="Oft"||a.bauch==="Manchmal"){
    g.push([intol.includes("Laktose")?tip("Laktosefrei","Laktosefrei essen, Hartkäse geht","Hartkäse hat kaum Laktose."):tip("Langsam essen","Langsam essen, gut kauen","Weniger Luft im Bauch."),
      tip(null,"Testweise ohne Kohlensäure, Kaugummi, Süßstoff","Typische Bläh-Auslöser.")]);
    if(a.bauch==="Oft") note="Mit Schmerzen, Gewichtsverlust oder Blut im Stuhl: Arzt.";
  }
  if(a.wasser==="Unter 1 Liter") g.push([tip("Wasser zu jeder Mahlzeit","Ein Glas Wasser zu jeder Mahlzeit","Wenig trinken macht müde.")]);
  if(a.trink==="Täglich") g.push([tip("Sprudel statt Softdrink","Softdrink gegen Sprudel tauschen","0,5 l Cola = rund 53 g Zucker.")]);
  if(a.alk==="Mehrmals pro Woche") g.push([tip("Mo–Do alkoholfrei","Montag bis Donnerstag alkoholfrei","Besser für Schlaf, Leber, Regeneration.")]);
  if(intol.includes("Gluten")) g.push([tip(null,"Vor glutenfrei: Zöliakie-Test","Sonst ist der Test verfälscht.",{must:1})]);
  if(a.stil==="Vegetarisch") g.push([tip("Eisen + Vitamin C","Linsen & Hafer mit Paprika/Zitrone","Vitamin C holt mehr Eisen raus.")]);
  let items=pickTips(g,4);
  if(!items.length) items=[tip("Unverarbeitet essen","Läuft gut, weiter so","Unverarbeitet bleibt die beste Basis.")];
  return {lead:`${a.stil||"–"} · Energie: ${a.energie||"–"}`, routine:sumRoutine("Gesundheit",items,"",`${glasses} Gläser Wasser`), items, note};
}
function coachAdvice(id){
  const a = (state.coach.answers||{})[id]||{};
  return ({haut:hautAdvice, haare:haareAdvice, schlaf:schlafAdvice, aussehen:aussehenAdvice, gesundheit:gesundheitAdvice}[id]||(()=>({lead:"",routine:null,items:[]})))(a);
}
function routineOn(id, s){
  const d = s? (state.days[s]||{}) : day();
  return !!(d.routine && d.routine[id]);
}
function topicMark(id){ return {haut:"💧", haare:"✂️", schlaf:"🌙", aussehen:"🪞", gesundheit:"💚"}[id] || "•"; }
// Tagesbezogene Hinweise aus Ernährung, Training, Schlaf und Wasser
function coachToday(){
  const t=targets(), tot=totals(), d=day(), hints=[], isToday=state.date===todayIso();
  const wo=state.workouts.filter(w=>w.date===state.date);
  const ea=state.coach.answers.gesundheit||{}, veg=ea.stil==="Vegan"||ea.stil==="Vegetarisch";
  const food=veg?"Tofu, Linsen oder Quark":"Skyr, Ei oder Hähnchen";
  const gap=Math.round(t.protein-tot.protein);
  if(!d.meals.length) hints.push({e:"🍽️",t:"Noch nichts gegessen eingetragen",d:"Trag die erste Mahlzeit ein, dann passen Score und Tipps zu deinem Tag.",go:"heute"});
  else if(wo.length&&gap>15) hints.push({e:"💪",t:`Nach dem Training fehlen noch ${gap} g Protein`,d:`${food} schließen die Lücke.`,go:"heute"});
  else if(gap>t.protein*0.4) hints.push({e:"🥚",t:`Protein: ${Math.round(tot.protein)} von ${t.protein} g`,d:`${food} zur nächsten Mahlzeit.`,go:"heute"});
  if(!wo.length){
    const last=[...state.workouts].filter(w=>w.date<=state.date).sort((a,b)=>a.date<b.date?1:-1)[0];
    const gapD=last?Math.round((parseIso(state.date)-parseIso(last.date))/864e5):null;
    if(gapD==null||gapD>=3) hints.push({e:"🏋️",t:last?`Seit ${gapD} Tagen kein Training`:"Noch kein Training gespeichert",d:"Eine kurze Einheit reicht. Dein Plan liegt im Training-Tab.",go:"sport"});
  }
  if(d.sleep!=null&&d.sleep<6.5) hints.push({e:"🌙",t:`Nur ${de(d.sleep,1)} h Schlaf`,d:wo.length?"Heute abends früher Licht runter.":"Heute lieber moderat trainieren und abends früher Licht runter.",go:"heute"});
  else if(d.sleep==null&&isToday) hints.push({e:"🌙",t:"Wie hast du geschlafen?",d:"Trag deine Stunden ein. Der Coach berücksichtigt sie dann.",go:"heute"});
  if(isToday&&new Date().getHours()>=14&&d.water<state.profile.waterTarget/2) hints.push({e:"💧",t:`Erst ${d.water} von ${state.profile.waterTarget} Gläsern`,d:"Ein Glas jetzt, eins zur nächsten Mahlzeit.",go:"heute"});
  return hints.slice(0,3);
}
// Themen, die im Fragebogen als wichtig gewählt wurden, zuerst
function coachPrio(id){ const map={Haut:"haut",Haare:"haare",Schlaf:"schlaf",Energie:"schlaf","Körperpflege":"aussehen",Aussehen:"aussehen","Ernährung":"gesundheit",Gesundheit:"gesundheit"}; return (state.profile.areas||[]).some(a=>map[a]===id)?1:0; }
function renderCoach(){
  const routine = state.coach.routine||[];
  const tip = coachToday()[0];
  return `<div class="scroll pad">
    <div class="topbar"><div><h1>Coach</h1><div class="sub">Ein paar Fragen, dann ein einfacher Plan</div></div></div>
    ${tip?`<button class="card tipcard" data-act="tab" data-v="${tip.go}"><span class="tipk">Tipp für heute</span><b>${tip.e} ${tip.t}</b><span class="sub">${tip.d}</span></button>`:""}
    <div class="section"><h2>Deine Themen</h2></div>
    <div class="card meals">
    ${coachTopics().sort((a,b)=>coachPrio(b.id)-coachPrio(a.id)).map(t=>{
      const inRoutine = routine.some(r=>r.topic===t.id), done = quizDone(t.id);
      const status = inRoutine ? "In deiner Routine ✓" : done ? "Dein Vorschlag ist fertig" : "Ein paar kurze Fragen";
      return `<button class="meal-row" data-act="open" data-type="area" data-id="${t.id}">
        <div class="bubble">${topicMark(t.id)}</div>
        <div class="grow"><div class="meal-name">${t.title}</div><div class="sub">${status}</div></div>
        ${done?"":`<span class="tagp open">Offen</span>`}<span class="chev">›</span>
      </button>`;
    }).join("")}
    </div>
    <p class="sub note">Vorschläge kannst du in deine Routine übernehmen. Abhaken geht im Tagebuch unter „Dein Tag“.</p>
  </div>`;
}
function starterRoutine(){ return [["u-s1","Wasser trinken (2 Liter)"],["u-s2","10 Minuten bewegen"],["u-s3","Gesicht reinigen und Sonnenschutz"],["u-s4","Vor 23 Uhr ins Bett"]].map(([id,title])=>({id,topic:"eigen",title,detail:"",product:null})); }
function ensureRoutine(){ if(!state.routineSeeded){ state.routineSeeded=true; if(!(state.coach.routine||[]).length) state.coach.routine=starterRoutine(); if(!state.rStart) state.rStart=todayIso(); } }
function rDone(s){ const rt=state.coach.routine||[]; return {c:rt.filter(r=>routineOn(r.id,s)).length, n:rt.length}; }
function rState(s){ const x=rDone(s); if(!x.n) return ""; if(x.c===x.n) return "on"; if(x.c) return "part"; const st=state.rStart||(state.rStart=todayIso()); return (s<todayIso()&&s>=st)?"miss":""; }
function rStreak(){ let n=0, s=todayIso(); if(!(state.coach.routine||[]).length) return 0; if(rState(s)!=="on") s=addDays(s,-1); while(rState(s)==="on"&&n<400){ n++; s=addDays(s,-1); } return n; }
// Eine Zeile der Routine: Haken + kurzer Name. › öffnet die Details im Coach, ✕ löscht (nur auf der Routine-Seite).
function rRow(r,del){
  const on=routineOn(r.id,state.date), coach=coachTopics().some(t=>t.id===r.topic);
  return `<div class="rchk"><button class="rbtn" data-act="routine-check" data-id="${r.id}"><span class="box ${on?"on":""}">${on?"✓":""}</span><span class="grow">${topicMark(r.topic)!=="•"?topicMark(r.topic)+" ":""}<b>${esc(rShort(r))}</b></span></button>${coach?`<button class="x" data-act="open" data-type="area" data-id="${r.topic}" aria-label="Details">›</button>`:""}${del?`<button class="x" data-act="routine-del" data-id="${r.id}" aria-label="Routine-Punkt löschen">✕</button>`:""}</div>`;
}
function routineBlock(){
  const rt=state.coach.routine||[], wk=weekStart(state.date), t=rDone(state.date), open=!!ui.rOpen&&rt.length>0;
  const when=state.date===todayIso()?"heute":labelDate(state.date);
  const list=open?`<div class="rlist">${rt.map(r=>rRow(r,false)).join("")}
      <button class="link mt-3" data-act="dash" data-id="routine">Kalender, Serie &amp; eigene Punkte ›</button></div>`:"";
  return `<div class="card rprev"><button class="rhead" data-act="${rt.length?"r-toggle":"dash"}" ${rt.length?"":'data-id="routine"'}><div class="row space"><b>Routine${rStreak()>=3?` <span class="rfire">🔥 ${rStreak()}</span>`:""}</b><span class="sub">${rt.length?t.c+"/"+t.n+" "+when+" "+(open?"▴":"▾"):"Anlegen ›"}</span></div></button>
    <div class="rweek">${Array.from({length:7},(_,i)=>addDays(wk,i)).map(s=>`<i class="rd ${rState(s)} ${s===todayIso()?"today":""}">${weekday(s)}</i>`).join("")}</div>${list}</div>`;
}
function rMonth(y,mo){
  const first=new Date(y,mo,1), pad=(first.getDay()+6)%7, count=new Date(y,mo+1,0).getDate();
  const heads=["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=>`<div class="sub">${d}</div>`).join("");
  let cells="<div></div>".repeat(pad);
  for(let d=1;d<=count;d++){ const s=iso(new Date(y,mo,d)), r=rDone(s); cells+=`<button class="calcell" data-act="r-pick" data-v="${s}"><div class="cdot ${rState(s)} ${s===todayIso()?"today":""}">${d}</div><div class="cname">${r.c?r.c+"/"+r.n:""}</div></button>`; }
  return `<h2 class="month-h">${first.toLocaleDateString("de-DE",{month:"long",year:"numeric"})}</h2><div class="calgrid">${heads}${cells}</div>`;
}
function renderRoutineDash(){
  const m=ui.rcal||"day", now=new Date(), rt=state.coach.routine||[], tdy=rDone(todayIso());
  const modes=[["day","Tag"],["month","Monat"],["year","Jahr"]];
  let body="";
  if(m==="day"){
    const n=rDone(state.date);
    body=`${state.rHint?"":`<div class="insight"><b>Was ist das?</b><span>Hake ab, was du heute geschafft hast. Alles erledigt = Serie +1.</span><button class="link mt-1 self-start" data-act="rhint">Verstanden</button></div>`}
    <h2 class="month-h">${labelDate(state.date)}${rt.length?` · ${n.c}/${n.n}`:""}</h2><div class="card">
      ${rt.map(r=>rRow(r,true)).join("")||`<p class="sub">Noch keine Routine. Leg unten deine erste an.</p>`}
      <div class="row mt-4"><input id="r-new" class="input grow" placeholder="Eigene Routine, z. B. 10 Min lesen" aria-label="Eigene Routine"><button class="plus dark" data-act="routine-add" aria-label="Routine-Punkt hinzufügen">+</button></div></div>`;
  } else if(m==="month") body=rMonth(now.getFullYear(),now.getMonth())+rMonth(now.getFullYear(),now.getMonth()-1);
  else { const y=now.getFullYear();
    body=`<h2 class="month-h">${y}</h2><div class="yeargrid">${Array.from({length:12},(_,mo)=>{
      const first=new Date(y,mo,1), pad=(first.getDay()+6)%7, count=new Date(y,mo+1,0).getDate();
      let cells=Array.from({length:pad},()=>`<i class="sq empty"></i>`).join("");
      for(let d=1;d<=count;d++) cells+=`<i class="sq ${rState(iso(new Date(y,mo,d)))}"></i>`;
      return `<div><div class="sub mb-1">${first.toLocaleDateString("de-DE",{month:"short"})}</div><div class="mini">${cells}</div></div>`;
    }).join("")}</div>`; }
  return `<div class="calhead"><button class="navd" data-act="dash-close" aria-label="Zurück">‹</button>
    <div class="seg grow">${modes.map(([id,l])=>`<button class="${m===id?"on":""}" data-act="rcal-mode" data-v="${id}">${l}</button>`).join("")}</div></div>
    <div class="card split">
      <div><b>${rStreak()}-Tage-Serie${rStreak()>=3?" 🔥":""}</b><div class="sub">Alle Routinen erledigt</div></div>
      <div><b>${tdy.c}/${tdy.n} heute</b><div class="sub">Erledigt</div></div></div>
    <div class="sub mt-4">Grün: alle erledigt · Hellgrün: teilweise · Rot: verpasst</div>
    ${body}`;
}
function stackSheet(){
  const d=day();
  return `<h2>Stack heute</h2>
    ${state.stack.map(id=>{ const s=SUPS.find(x=>x.id===id); return `<button class="task" data-act="take" data-id="${id}">
      <span class="chk ${d.taken[id]?"on":""}">${d.taken[id]?"✓":""}</span>
      <div class="grow"><b>${s.name}</b><div class="sub">${s.dose} · ${s.when}</div></div>
    </button>`; }).join("")||`<p class="sub">Noch nichts im Stack.</p>`}
    <div class="gap"></div><button class="pill ghost w-full" data-act="open" data-type="area" data-id="sups-list">Stack bearbeiten</button><p class="sub mt-3">Mengen laut Packung. Kein ärztlicher Rat. Bei Erkrankungen, Medikamenten oder Schwangerschaft vorher ärztlich abklären.</p>`;
}
function productSheet(id){
  const item=allItems().find(p=>p.id===id);
  if(!item) return `<p>Nicht gefunden.</p>`;
  const sc=scored(item);
  if(item.type==="food"||item.type==="custom") return foodSheet(item,sc);
  const inStack=item.type==="sup" && state.stack.includes(item.id);
  return `<div class="row gap-3">
      <div class="score lg ${scoreClass(sc.score)}">${sc.score}</div>
      <div><div class="sub">${item.brand||""}</div><h2>${esc(item.name)}</h2><div class="sub">${goalName()}</div></div>
    </div>
    <div class="my-3">${rateList(sc)}</div>
    ${item.type==="food"||item.type==="custom"?`
      <div class="sub">${item.kcal} kcal · ${item.protein} g Protein / 100 g</div>
      <div class="field"><label>Portion in g</label><input id="portion" type="number" value="${ui.portion}"></div>
      <button class="pill primary" data-act="log-food" data-id="${item.id}">Zum Tagebuch · ${labelDate(state.date)}</button>
    `:item.type==="sup"?`
      <div class="sub">Üblich: ${item.dose} · ${item.when}</div><p class="sub mt-3">Mengen laut Packung. Kein ärztlicher Rat. Bei Erkrankungen, Medikamenten oder Schwangerschaft vorher ärztlich abklären.</p><div class="gap"></div>
      <button class="pill w-full ${inStack?"ghost":"primary"}" data-act="toggle-stack" data-id="${item.id}">${inStack?"Aus dem Stack":"In den Stack"}</button>
      ${PARTNERS_ENABLED&&state.profile.affiliates?`<div class="gap"></div><button class="pill ghost w-full" data-act="affiliate">Bezugsquelle · Anzeige</button>`:""}
    `:`<button class="pill ghost w-full" data-act="mark-pflege">Für Pflege merken</button>
      ${PARTNERS_ENABLED&&state.profile.affiliates?`<div class="gap"></div><button class="pill ghost w-full" data-act="affiliate">Bezugsquelle · Anzeige</button>`:""}`}
  `;
}
function areaSheet(id){
  if(id==="sups-list") return supsSheet();
  const topic=coachTopics().find(t=>t.id===id);
  if(!topic) return "<p>Kein Thema.</p>";
  const quiz=coachQuiz(id);
  const answers=state.coach.answers[id]||{};
  const ready=quizDone(id);
  if(!ready){
    return `<h2>${topic.title}</h2><p class="sub">${topic.ask}</p>
      ${quiz.filter(item=>qNeeded(item,answers)).map(item=>`<div class="q"><b>${item.q}</b>${item.multi?`<span class="sub"> · mehrere möglich</span>`:""}<div class="opts">${item.opts.map(o=>`<button class="chip ${(item.multi?(answers[item.k]||[]).includes(o):answers[item.k]===o)?"on":""}" data-act="coach-answer" data-topic="${id}" data-k="${item.k}" data-v="${o}">${o}</button>`).join("")}</div></div>`).join("")}
      <div class="gap"></div><button class="pill primary" data-act="coach-ready" data-topic="${id}" ${ready?"":"disabled"}>Vorschlag zeigen</button>`;
  }
  const advice=coachAdvice(id);
  const r=advice.routine, inRt=(state.coach.routine||[]).some(x=>x.topic===id);
  // Produkt-Chips: bei Haut nur, was noch fehlt; sonst die passenden Produkte
  const chip=(name,pid)=>pid?`<button class="chip" data-act="open" data-type="product" data-id="${pid}">${esc(name)} ›</button>`:`<span class="chip">${esc(name)}</span>`;
  const miss=advice.missing||[];
  const prods=[...new Set(advice.items.map(i=>i.product).filter(Boolean))].map(pid=>allItems().find(x=>x.id===pid)).filter(Boolean);
  const shop=miss.length
    ?`<div class="section"><h2>Fehlt dir noch</h2></div><div class="opts">${miss.map(n=>chip(n,careId(n))).join("")}</div><p class="sub mt-2">Einzeln einführen, je 1–2 Wochen Abstand.</p>`
    :prods.length?`<div class="section"><h2>Dazu passen</h2></div><div class="opts">${prods.map(p=>chip(p.name,p.id)).join("")}</div>`:"";
  const plan=r&&r.am?`<span>☀️ ${esc(r.am.join(" → "))}</span><span>🌙 ${esc(r.pm.join(" → "))}</span>`:r&&r.detail?`<span>${esc(r.detail)}</span>`:"";
  return `<h2>${topic.title}</h2><p class="sub">${esc(advice.lead)}</p>
    ${r?`<div class="insight"><b>${esc(r.short)}</b>${plan}</div>`:""}
    <div class="section"><h2>Deine Tipps</h2></div>
    ${advice.items.map(i=>`<div class="li"><b>${esc(i.title)}</b>${i.detail?`<div class="sub">„${esc(i.detail)}“</div>`:""}${i.act?`<button class="pill ghost w-full mt-2" data-act="${i.act}" data-v="${i.v}">${i.label}</button>`:""}</div>`).join("")}
    ${advice.note?`<p class="sub mt-3">⚠️ ${esc(advice.note)}</p>`:""}
    ${shop}
    <div class="gap"></div>
    ${inRt
      ?`<button class="pill ghost w-full" data-act="coach-remove" data-topic="${id}">Aus der Routine entfernen</button>`
      :r?`<button class="pill primary" data-act="coach-add" data-topic="${id}">In die Routine</button>`:""}
    <div class="row space mt-4"><button class="link" data-act="coach-reset" data-topic="${id}">Antworten ändern</button><span class="sub">Kein ärztlicher Rat</span></div>`;
}
// Name aus „Fehlt dir noch“ → passendes Produkt zum Antippen
function careId(n){ return /LSF/.test(n)?"spf":/Azelain/.test(n)?"azelain":/BHA/.test(n)?"bha":/Zink/.test(n)?"zink":/Niacinamid/.test(n)?"nia":/Retinol/.test(n)?"retinol":/Vitamin C/.test(n)?"vitc":/Ceramid|Panthenol|Creme|Fluid/.test(n)?"cerave":/Reinigungsgel/.test(n)?"cleanser":null; }
function planBody(id){ return areaSheet(id); }
function supsSheet(){
  const rec=recommendStack();
  const rest=SUPS.filter(p=>!rec.some(r=>r.id===p.id));
  return `<h2>Dein Stack</h2>
    <p class="sub">${goalName()} · Protein heute ${Math.round(totals().protein)} / ${targets().protein} g · Fisch ${state.profile.fish}</p>
    ${rec.map(r=>{ const p=SUPS.find(x=>x.id===r.id); return `<button class="food" data-act="open" data-type="product" data-id="${p.id}">
      <div class="thumb">${p.emoji}</div><div class="grow"><b>${p.name}</b><div class="sub">${r.why}</div></div>
      <div class="score ${scoreClass(r.score)}">${r.score}</div></button>`; }).join("")}
    <div class="gap"></div><button class="pill primary" data-act="apply-stack">Vorschlag übernehmen</button>
    <div class="section"><h2>Rest</h2></div>
    ${rest.map(p=>`<button class="food" data-act="open" data-type="product" data-id="${p.id}"><div class="thumb">${p.emoji}</div><div class="grow"><b>${p.name}</b><div class="sub">${p.note}</div></div><div class="score ${scoreClass(scored(p).score)}">${scored(p).score}</div></button>`).join("")}<p class="sub mt-3">Mengen laut Packung. Kein ärztlicher Rat. Bei Erkrankungen, Medikamenten oder Schwangerschaft vorher ärztlich abklären.</p>`;
}
function skinSheet(){
  const q=[
    {k:"typ", label:"Hautbild", opts:["trocken","fettig","sensibel","unrein","normal"]},
    {k:"ziel", label:"Stört am meisten", opts:["Trockenheit","Unreinheiten","Rötung"]},
    {k:"sonne", label:"Sonnenschutz", opts:["Täglich","Manchmal","Selten"]}
  ];
  const ready=q.every(x=>state.skin[x.k]);
  if(state.hautPlan && ready){
    const recs=CARE.filter(c=>scoreCare(c).score>=70).slice(0,2);
    return `<h2>Hautplan</h2>
      <div class="sub">Hautbild ${state.skin.typ} · ${state.skin.ziel}</div>
      <div class="sub">${state.skin.sonne==="Täglich"?"LSF beibehalten":"LSF in den Morgen"}</div>
      ${recs.map(p=>`<button class="food" data-act="open" data-type="product" data-id="${p.id}"><div class="thumb">${p.emoji}</div><div class="grow"><b>${p.name}</b></div><div class="score ${scoreClass(scored(p).score)}">${scored(p).score}</div></button>`).join("")}
      <p class="sub">Nur ein Hinweis. Nichts zum Abhaken.</p>`;
  }
  return `<h2>Haut</h2>${q.map(item=>`<div class="q"><b>${item.label}</b><div class="opts">${item.opts.map(o=>`<button class="chip ${state.skin[item.k]===o?"on":""}" data-act="skin" data-k="${item.k}" data-v="${o}">${o}</button>`).join("")}</div></div>`).join("")}
    <div class="gap"></div><button class="pill primary" data-act="skin-done" ${ready?"":"disabled"}>Tipp anpassen</button>`;
}
