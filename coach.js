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
        [sun, "Wirksamer als jedes Serum."],
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
      why:"Creatin ist für Kraft klar. Der Rest nur, wenn Essen oder Sonne eine Lücke lassen.",
      avoid:["Fettverbrenner","Hochdosis ohne Grund","Kollagen vor Schlaf und LSF"],
      steps:[
        ["Stack auf den Vorschlag setzen", "Ziel, Protein heute, Fisch."],
        ["Morgens D3 zur Mahlzeit, falls im Stack", "Nicht nüchtern raten."],
        ["Creatin täglich 5 g, mit Wasser", "Nicht nur am Trainingstag."],
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
      {k:"stoert", q:"Was stört dich am meisten?", opts:["Trockenheit","Unreinheiten","Rötung","Wirkt stumpf","Erste Fältchen","Nichts Bestimmtes"]},
      {k:"hab", q:"Was hast du schon?", multi:true, none:"Nichts davon", opts:["Waschgel","Creme","Sonnencreme","Serum","Nichts davon"]},
      {k:"sonne", q:"Wie oft trägst du Sonnenschutz?", opts:["Täglich","Manchmal","Selten"]},
      {k:"empf", q:"Reagiert die Haut auf Duft oder neue Produkte?", opts:["Ja","Nein","Weiß nicht"]}
    ],
    haare:[
      {k:"stoert", q:"Was stört dich?", opts:["Fettiger Ansatz","Trocken / Spliss","Schuppen","Fallen viel aus","Nichts Konkretes"]},
      {k:"wasch", q:"Wie oft wäschst du die Haare?", opts:["Täglich","2–3 mal","Seltener"]},
      {k:"hitze", q:"Wie oft kommt Hitze dran?", opts:["Fast immer","Manchmal","Selten"]},
      {k:"typ", q:"Haartyp?", opts:["Glatt","Wellig","Lockig"]}
    ],
    schlaf:[
      {k:"aufzeit", q:"Wann musst du meistens aufstehen?", opts:["Vor 6 Uhr","6–7 Uhr","7–8 Uhr","Nach 8 Uhr"]},
      {k:"ein", q:"Wie ist das Einschlafen?", opts:["Geht schnell","Dauert","Wach in der Nacht"]},
      {k:"auf", q:"Ist die Aufstehzeit fest?", opts:["Ja, auch am Wochenende","Wechselt stark"]},
      {k:"kaffee", q:"Kaffee nach 15 Uhr?", opts:["Oft","Selten","Nie"]},
      {k:"stunden", q:"Wie viele Stunden schläfst du?", opts:["Unter 6","6–7","7–8","Über 8"]}
    ],
    aussehen:[
      {k:"ziel", q:"Was willst du verbessern?", multi:true, opts:["Weniger Bauchfett","Mehr Muskeln","Gesicht definierter","Bessere Haltung","Frischer wirken"], emo:{"Weniger Bauchfett":"🔥","Mehr Muskeln":"💪","Gesicht definierter":"🗿","Bessere Haltung":"🧍","Frischer wirken":"✨"}},
      {k:"kfa", q:"Wie hoch schätzt du deinen Körperfettanteil?", opts:kfaOpts()},
      {k:"bloat", q:"Wirkt dein Gesicht morgens aufgedunsen?", opts:["Oft","Manchmal","Selten"]},
      {k:"abend", q:"Was gibt es abends oft?", multi:true, none:"Nichts davon", opts:["Salziges / Fast Food","Alkohol","Spät gegessen","Nichts davon"], emo:{"Salziges / Fast Food":"🍟","Alkohol":"🍺","Spät gegessen":"🌙","Nichts davon":"👍"}},
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
function quizDone(id){ const a=(state.coach.answers||{})[id]||{}; return coachQuiz(id).every(q=>hasVal(a[q.k])); }
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
function hautAdvice(a){
  const has=(a.hab||[]), typ=a.bild||"Normal", st=a.stoert||"Nichts Bestimmtes";
  const sens=typ==="Sensibel"||a.empf==="Ja"||st==="Rötung";
  const oily=typ==="Fettig"||st==="Unreinheiten", dry=typ==="Trocken"||st==="Trockenheit";
  const wash = dry||sens ? "milde Reinigungsmilch" : oily ? "Gel-Reinigung" : "mildes Waschgel";
  const cream = dry ? "Ceramid-Creme" : oily ? "leichtes Gel-Fluid" : sens ? "Panthenol-Creme ohne Duft" : "leichte Creme";
  const spf = sens ? "mineralischer LSF 50" : oily ? "LSF 50 Fluid" : "LSF 50";
  // Ein Wirkstoff passend zum Problem
  const act = {
    "Unreinheiten": sens?["Niacinamid 4–5 %","abends","Beruhigt und reguliert Talg. Sanfter als Säuren."]:["BHA 2 % (Salicylsäure)","abends, Mo/Mi/Fr","Löst verstopfte Poren. Erst 3× pro Woche, nach 4 Wochen öfter, wenn die Haut es mag."],
    "Rötung": ["Niacinamid 4–5 %","abends","Stärkt die Hautbarriere. Bleibt die Rötung über Wochen, lass es beim Hautarzt anschauen."],
    "Wirkt stumpf": sens?null:["Vitamin-C-Serum","morgens vor dem LSF","Macht die Haut mit der Zeit ebenmäßiger. Dunkel und kühl lagern, sonst wird es braun."],
    "Erste Fältchen": sens?null:["Retinol (max. 0,3 %)","abends, 2× pro Woche","Am besten belegter Wirkstoff gegen Fältchen. Langsam steigern. Nicht in Schwangerschaft, LSF morgens Pflicht."],
    "Trockenheit": null, "Nichts Bestimmtes": null
  }[st]||null;
  const morning = dry||sens ? ["Wasser", act&&act[1].startsWith("morgens")?act[0]:null, cream, spf] : [wash, act&&act[1].startsWith("morgens")?act[0]:null, oily?null:cream, spf];
  const evening = [wash, act&&act[1].startsWith("abends")?act[0].split(" (")[0]+(act[1].includes("Mo/")?" (Mo/Mi/Fr)":act[1].includes("2×")?" (2×/Woche)":""):null, cream];
  const names=[...new Set([wash, act&&act[0].split(" (")[0], cream, spf])].filter(Boolean);
  const routine={ title:"Gesicht: "+names.join(", "), detail:`Morgens: ${cjoin(morning)}. Abends: ${cjoin(evening)}.` };
  const items=[], missing=[];
  if(!has.includes("Waschgel")) missing.push(wash);
  if(!has.includes("Creme")) missing.push(cream);
  if(!has.includes("Sonnencreme")) missing.push(spf);
  if(act&&!(has.includes("Serum")&&st!=="Erste Fältchen")) missing.push(act[0]);
  if(a.sonne!=="Täglich") items.push({title:`${spf} jeden Morgen`, detail:"Schützt vor Pigmentflecken und Fältchen mehr als jedes Serum. Menge: zwei Fingerlängen für Gesicht und Hals. Draußen alle 2 Stunden nachlegen.", product:"spf"});
  if(act) items.push({title:`${act[0]}, ${act[1]}`, detail:act[2], product:act[0].startsWith("Niacinamid")?"nia":null});
  else if(dry) items.push({title:"Creme auf noch feuchte Haut", detail:"Ceramide und Glycerin halten Wasser in der Haut. Kein heißes Wasser beim Waschen.", product:"cerave"});
  if(sens&&has.includes("Serum")) items.push({title:"Serum 2 Wochen pausieren", detail:"Nur Reinigung, Creme, LSF. Wird es ruhiger, lag es am Serum.", product:null});
  else if(missing.length>1) items.push({title:"Ein neues Produkt pro 2 Wochen", detail:`Dir fehlen noch: ${missing.join(", ")}. Nacheinander starten, dann weißt du, was du nicht verträgst.`, product:null});
  else if(sens) items.push({title:"Ohne Duft, Alkohol und Menthol", detail:"Genau diese Stoffe reizen empfindliche Haut am häufigsten.", product:null});
  else items.push({title:"Peeling höchstens 2× pro Woche", detail:"Öfter schwächt die Hautbarriere.", product:null});
  return {lead:`Hautbild: ${typ}. Stört: ${st}.`, routine, items:items.slice(0,3)};
}
function haareAdvice(a){
  const st=a.stoert||"Nichts Konkretes", items=[], heat=a.hitze&&a.hitze!=="Selten", curly=a.typ==="Lockig";
  const freq = st==="Fettiger Ansatz" ? "Waschen nach Bedarf" : (st==="Trocken / Spliss"||curly) ? "2× pro Woche waschen" : "2–3× pro Woche waschen";
  const parts=[st==="Schuppen"?"Anti-Schuppen-Shampoo 2×/Woche":freq, "Conditioner nur in die Längen", heat?"Hitzeschutz bis 180 °C":null, st==="Trocken / Spliss"?"1× Woche Maske":null].filter(Boolean);
  const routine={ title:"Haare: "+parts.join(", "), detail:curly?"Mit T-Shirt statt Frottee trocknen, nicht rubbeln.":"Shampoo nur auf die Kopfhaut, Längen bekommen nur den Schaum ab." };
  if(st==="Fettiger Ansatz") items.push({title:"Täglich waschen ist okay", detail:"Seltener waschen trainiert die Kopfhaut nicht um. Mildes Shampoo nur am Ansatz, Conditioner nie an die Kopfhaut.", product:"shampoo"});
  if(st==="Trocken / Spliss") items.push({title:"Spliss nur mit der Schere weg", detail:"Kein Produkt klebt gespaltene Spitzen wieder zusammen. Alle 8–12 Wochen 1 cm schneiden, dann Conditioner nach jeder Wäsche.", product:null});
  if(st==="Schuppen") items.push({title:"Anti-Schuppen-Shampoo mit Wirkstoff", detail:"Zinkpyrithion, Ketoconazol oder Selendisulfid. 3–5 Minuten einwirken lassen. Wird es nach 4 Wochen nicht besser: Hautarzt.", product:null});
  if(st==="Fallen viel aus") items.push({title:"Abklären lassen statt Shampoo kaufen", detail:"50–100 Haare am Tag sind normal. Bei deutlich mehr oder kahlen Stellen: Hautarzt. Oft stecken Eisenmangel, Stress oder Veranlagung dahinter.", product:null});
  if(heat) items.push({title:"Hitzeschutz und eine Stufe runter", detail:"Nur auf handtuchtrockenes Haar, nie auf nasses. Über 180 °C bricht das Haar schneller.", product:null});
  if(a.wasch==="Täglich"&&st!=="Fettiger Ansatz") items.push({title:"Ein Waschtag weniger", detail:"Trockenes Haar verliert bei jeder Wäsche Fett, das es schützt. Dazwischen nur mit Wasser ausspülen.", product:null});
  if(!items.length) items.push({title:"Nichts ändern, was funktioniert", detail:"Deine Haare sind okay. Ein Shampoo, ein Conditioner reicht.", product:null});
  return {lead:`${a.typ||"Haar"}. Stört: ${st}.`, routine, items:items.slice(0,3)};
}
function hm(min){ min=((min%1440)+1440)%1440; return Math.floor(min/60)+":"+String(min%60).padStart(2,"0"); }
function schlafAdvice(a){
  const wake={"Vor 6 Uhr":330,"6–7 Uhr":390,"7–8 Uhr":450,"Nach 8 Uhr":510}[a.aufzeit]||420;
  const bed=wake-480, caf=bed-480, dim=bed-60, items=[];
  const routine={ title:`Schlaf: Kaffee bis ${hm(caf)}, ${hm(dim)} Licht runter, ${hm(bed)} ins Bett`, detail:`Wecker ${hm(wake)}, auch am Wochenende (max. 1 Stunde später).` };
  if(a.stunden==="Unter 6") items.push({title:`Ziel: um ${hm(bed)} im Bett`, detail:"Erwachsene brauchen meist 7–9 Stunden. Lieber früher ins Bett als später aufstehen.", product:null});
  if(a.auf==="Wechselt stark") items.push({title:"Gleiche Aufstehzeit, jeden Tag", detail:"Die feste Uhrzeit am Morgen stellt die innere Uhr. Wer am Wochenende 3 Stunden länger schläft, hat montags eine Art Jetlag.", product:null});
  if(a.kaffee==="Oft") items.push({title:`Letzter Kaffee um ${hm(caf)}`, detail:"Koffein wirkt 5–6 Stunden nur halb so stark, ist aber noch da. Auch Cola, Energy und Schwarztee zählen.", product:null});
  if(a.ein==="Dauert") items.push({title:"Morgens 10 Minuten Tageslicht", detail:"Licht am Morgen macht dich abends früher müde. Draußen wirkt es stärker als am Fenster.", product:null});
  if(a.ein==="Wach in der Nacht") items.push({title:"Kühl, dunkel, keine Uhr", detail:"Schlafzimmer um 16–19 °C. Nicht auf die Uhr schauen. Alkohol am Abend macht die zweite Nachthälfte unruhiger. Hält es über 3 Monate an: ärztlich abklären.", product:null});
  if(!items.length) items.push({title:"Dein Schlaf passt", detail:"Halte die Zeiten. Das ist schon der wichtigste Hebel.", product:null});
  return {lead:`Aufstehen ${hm(wake)} → Bett ${hm(bed)}.`, routine, items:items.slice(0,3)};
}
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
  const ziel=a.ziel||[], lvl=kfaLevel(a), g=state.profile.goal, items=[], parts=[];
  const fatGoal=ziel.includes("Weniger Bauchfett")||ziel.includes("Gesicht definierter");
  const lifts=["Krafttraining","Beides"].includes(state.profile.trainType);
  const est=a.kfa==="Weiß nicht"?` (grob geschätzt ca. ${kfaGuess()} %)`:"";
  if(lvl>=3||(lvl===2&&fatGoal)){
    if(g==="lose") items.push({title:"Defizit halten, nicht verschärfen", detail:`Dein Richtwert ${de(targets().kcal)} kcal ist schon ein leichtes Minus${est}. 0,5–1 % Körpergewicht pro Woche ist ein gutes Tempo. Schneller kostet Muskeln.`, product:null});
    else items.push({title:"Kalorien leicht runter", detail:`Für sichtbar weniger Fett${est}: ca. 400 kcal unter deinem Bedarf von ${de(kcalFor("energy"))} kcal. Neuer Richtwert ${de(kcalFor("lose"))} kcal statt ${de(targets().kcal)} kcal. Protein hoch lassen.`, product:null, act:"coach-goal", v:"lose", label:"Kalorienziel senken"});
    parts.push("Kalorienziel halten");
  } else if(lvl===0&&g==="lose"){
    items.push({title:"Nicht weiter runter", detail:"Du bist schon schlank. Mehr Definition kommt jetzt über Muskeln, nicht über weniger Essen.", product:null, act:"coach-goal", v:"muscle", label:"Auf Muskelaufbau stellen"});
  }
  if(ziel.includes("Weniger Bauchfett")&&items.length<3) items.push({title:"Bauchübungen verbrennen kein Bauchfett", detail:"Fett geht am ganzen Körper weg, nicht gezielt an einer Stelle. Der Bauch kommt meist zuletzt. Defizit und Krafttraining sind der Weg.", product:null});
  if(a.bloat==="Oft"||a.bloat==="Manchmal"){
    const ab=(a.abend||[]).filter(x=>x!=="Nichts davon");
    items.push({title:"Morgens 2 Minuten Gua Sha", detail:`Sanft von der Mitte nach außen und zum Hals hin streichen, das schiebt Wasser ab. Ein kühles Tuch hilft ähnlich. Wirkt für ein paar Stunden. Grüner Tee am Morgen: Koffein entwässert leicht, der Effekt ist klein.${ab.length?` Der größere Hebel bei dir: abends weniger ${ab.map(x=>({"Salziges / Fast Food":"Salz","Alkohol":"Alkohol","Spät gegessen":"spätes Essen"}[x])).join(" und ")}.`:""}`, product:null});
    parts.push("morgens Gua Sha");
  }
  if(ziel.includes("Mehr Muskeln")||ziel.includes("Bessere Haltung")){
    if(!lifts) items.push({title:"3× pro Woche Krafttraining", detail:`Muskeln formen den Körper mehr als jede Diät. Dazu ${targets().protein} g Protein am Tag.${ziel.includes("Bessere Haltung")?" Für die Haltung: Rudern und Face Pulls.":""}`, product:null, act:"tab", v:"sport", label:"Zum Training"});
    else if(ziel.includes("Bessere Haltung")) items.push({title:"Mehr ziehen als drücken", detail:"Rudern und Face Pulls in jedes Training. Bildschirm auf Augenhöhe.", product:null});
    parts.push(lifts?"Training nach Plan":"3× Krafttraining");
  }
  if(a.sitzen==="Über 8"&&items.length<3){ items.push({title:"Jede Stunde kurz aufstehen", detail:"Langes Sitzen zieht die Schultern nach vorn. Zwei Minuten gehen reichen.", product:null}); parts.push("stündlich aufstehen"); }
  if(ziel.includes("Frischer wirken")&&items.length<3) items.push({title:"Schlaf und LSF zuerst", detail:"Augenringe und fahle Haut kommen meist von wenig Schlaf und Sonne. Schau dir dafür Schlaf und Haut an.", product:null});
  if(ziel.includes("Gesicht definierter")&&items.length<3) items.push({title:"Kiefer-Training bringt nichts", detail:"Für Mewing und Kiefer-Gadgets gibt es keinen Beleg. Ein schmaleres Gesicht kommt über weniger Körperfett und weniger Wasser.", product:null});
  if(!parts.length) parts.push("Training nach Plan","Kalorienziel halten");
  const kfaTxt=a.kfa==="Weiß nicht"?`KFA ca. ${kfaGuess()} % (geschätzt)`:`KFA ${a.kfa||"–"}`;
  return {lead:`${kfaTxt}. Fokus: ${ziel.length?ziel.join(", "):"–"}.`, routine:{title:"Aussehen: "+parts.slice(0,3).join(", "), detail:""}, items:items.slice(0,3)};
}
function gesundheitAdvice(a){
  const items=[], parts=[], veg=a.stil==="Vegan"||a.stil==="Vegetarisch", glasses=state.profile.waterTarget||8;
  if(a.stil==="Vegan") items.push({title:"Vitamin B12 täglich", detail:"Steckt fast nur in tierischen Lebensmitteln. Bei veganer Ernährung immer ergänzen.", product:"b12"});
  if(a.bauch==="Oft"||a.bauch==="Manchmal"){
    const lak=(a.intol||[]).includes("Laktose");
    items.push({title:"Langsam essen, danach 10 Min gehen", detail:`Schnelles Essen und Kohlensäure bringen Luft in den Bauch. Ein kurzer Spaziergang danach hilft der Verdauung. Ballaststoffe langsam steigern, Kaugummi und Zuckerersatz (Sorbit) meiden.${lak?" Achte auf versteckte Milch.":""} Bei Schmerzen oder wenn es über Wochen bleibt: ärztlich abklären.`, product:null});
    parts.push("10 Min gehen nach dem Essen");
  }
  if(a.energie==="Tief nach dem Essen"&&items.length<3){ items.push({title:"Mittags erst Protein und Gemüse", detail:"Dann die Beilage. Große Portionen Nudeln oder Brot allein machen eher müde. Ein Spaziergang danach flacht das Tief ab.", product:null}); if(!parts.length) parts.push("10 Min gehen nach dem Essen"); }
  if(a.energie==="Ständig müde"&&items.length<3) items.push({title:"Erst Schlaf prüfen, dann Blutbild", detail:"Hält die Müdigkeit trotz genug Schlaf an, lass Eisen, Vitamin D und Schilddrüse beim Hausarzt checken. Nicht auf Verdacht hochdosiert einnehmen.", product:null});
  if(a.wasser==="Unter 1 Liter"){ items.push({title:"Ein Glas zu jeder Mahlzeit", detail:"Gut 1,5 Liter am Tag sind ein guter Richtwert, bei Sport und Hitze mehr. Am Urin sieht man es: hellgelb passt.", product:null}); parts.push("ein Glas Wasser zu jeder Mahlzeit"); }
  else parts.push(`${glasses} Gläser Wasser`);
  if(a.trink==="Täglich"&&items.length<3){ items.push({title:"Zuckergetränke ersetzen", detail:"Ein halber Liter Cola hat etwa 50 g Zucker, das ist schon das Tagesmaximum der WHO. Wasser mit Zitrone, Tee oder Zero.", product:null}); parts.push("Wasser statt Softdrink"); }
  if(a.alk==="Mehrmals pro Woche"&&items.length<3){ items.push({title:"Feste alkoholfreie Tage", detail:"Es gibt keine Menge, die völlig risikofrei ist. Alkohol verschlechtert auch Schlaf und Haut. Starte mit 4 freien Tagen pro Woche.", product:null}); parts.push("Mo–Do kein Alkohol"); }
  if(veg&&a.stil!=="Vegan"&&items.length<3) items.push({title:"Eisen mit Vitamin C kombinieren", detail:"Linsen oder Haferflocken plus Paprika oder Orange. So nimmt der Körper mehr Eisen auf.", product:null});
  const intol=(a.intol||[]).filter(x=>x!=="Nein, alles okay");
  if(intol.length&&items.length<3) items.push({title:"Score warnt bei "+intol.join(", "), detail:"Erkannt wird am Namen. Bitte trotzdem die Zutatenliste prüfen.", product:null});
  if(!items.length) items.push({title:"Läuft gut", detail:"Halte Wasser und Bewegung. Dein Essens-Score achtet auf den Rest.", product:null});
  return {lead:`Ernährung: ${a.stil||"–"}. Energie: ${a.energie||"–"}.`, routine:{title:"Gesundheit: "+parts.slice(0,3).join(", "), detail:""}, items:items.slice(0,3)};
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
  const t=targets(), tot=totals(), d=day(), burn=burnKcal(), hints=[], isToday=state.date===todayIso();
  const wo=state.workouts.filter(w=>w.date===state.date);
  const ea=state.coach.answers.gesundheit||{}, veg=ea.stil==="Vegan"||ea.stil==="Vegetarisch";
  const food=veg?"Tofu, Linsen oder Quark":"Skyr, Ei oder Hähnchen";
  const gap=Math.round(t.protein-tot.protein);
  if(!d.meals.length) hints.push({e:"🍽️",t:"Noch nichts gegessen eingetragen",d:"Trag die erste Mahlzeit ein, dann passen Score und Tipps zu deinem Tag.",go:"heute"});
  else if(wo.length&&gap>15) hints.push({e:"💪",t:`Nach dem Training fehlen noch ${gap} g Protein`,d:`${food} schließen die Lücke.`,go:"heute"});
  else if(gap>t.protein*0.4) hints.push({e:"🥚",t:`Protein: ${Math.round(tot.protein)} von ${t.protein} g`,d:`${food} zur nächsten Mahlzeit.`,go:"heute"});
  if(burn&&showKcal()) hints.push({e:"🔥",t:`Training: Ziel heute ${de(dayTarget())} kcal`,d:`+${de(burn)} kcal für ${wo.map(w=>esc(w.name)).join(", ")}. Abends nicht hungrig bleiben.`,go:"heute"});
  if(!wo.length){
    const last=[...state.workouts].filter(w=>w.date<=state.date).sort((a,b)=>a.date<b.date?1:-1)[0];
    const gapD=last?Math.round((parseIso(state.date)-parseIso(last.date))/864e5):null;
    if(gapD==null||gapD>=3) hints.push({e:"🏋️",t:last?`Seit ${gapD} Tagen kein Training`:"Noch kein Training gespeichert",d:"Eine kurze Einheit reicht. Dein Plan liegt im Training-Tab.",go:"sport"});
  }
  if(d.sleep!=null&&d.sleep<6.5) hints.push({e:"🌙",t:`Nur ${de(d.sleep,1)} h Schlaf`,d:wo.length?"Heute früher Licht runter, damit sich der Körper erholt.":"Heute lieber moderat trainieren und abends früher Licht runter.",go:"heute"});
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
    <p class="sub" style="text-align:center;margin:14px 8px 0">Vorschläge kannst du in deine Routine übernehmen. Abhaken geht im Tagebuch unter „Dein Tag“.</p>
  </div>`;
}
function starterRoutine(){ return [["u-s1","Wasser trinken (2 Liter)"],["u-s2","10 Minuten bewegen"],["u-s3","Gesicht reinigen und Sonnenschutz"],["u-s4","Vor 23 Uhr ins Bett"]].map(([id,title])=>({id,topic:"eigen",title,detail:"",product:null})); }
function ensureRoutine(){ if(!state.routineSeeded){ state.routineSeeded=true; if(!(state.coach.routine||[]).length) state.coach.routine=starterRoutine(); if(!state.rStart) state.rStart=todayIso(); } }
function rDone(s){ const rt=state.coach.routine||[]; return {c:rt.filter(r=>routineOn(r.id,s)).length, n:rt.length}; }
function rState(s){ const x=rDone(s); if(!x.n) return ""; if(x.c===x.n) return "on"; if(x.c) return "part"; const st=state.rStart||(state.rStart=todayIso()); return (s<todayIso()&&s>=st)?"miss":""; }
function rStreak(){ let n=0, s=todayIso(); if(!(state.coach.routine||[]).length) return 0; if(rState(s)!=="on") s=addDays(s,-1); while(rState(s)==="on"&&n<400){ n++; s=addDays(s,-1); } return n; }
function routineBlock(){
  const rt=state.coach.routine||[], wk=weekStart(state.date), t=rDone(state.date), open=!!ui.rOpen&&rt.length>0;
  const when=state.date===todayIso()?"heute":labelDate(state.date);
  const list=open?`<div class="rlist">${rt.map(r=>{ const on=routineOn(r.id,state.date); return `<div class="rchk"><button class="rbtn" data-act="routine-check" data-id="${r.id}"><span class="box ${on?"on":""}">${on?"✓":""}</span><div class="grow"><b>${esc(r.title)}</b>${r.detail?`<div class="sub">${esc(r.detail)}</div>`:""}</div></button></div>`; }).join("")}
      <button class="link" data-act="dash" data-id="routine" style="margin-top:10px">Kalender, Serie &amp; eigene Punkte ›</button></div>`:"";
  return `<div class="card rprev"><button class="rhead" data-act="${rt.length?"r-toggle":"dash"}" ${rt.length?"":'data-id="routine"'}><div class="row space"><b>Routine${rStreak()>=3?` <span class="rfire">🔥 ${rStreak()}</span>`:""}</b><span class="sub">${rt.length?t.c+"/"+t.n+" "+when+" "+(open?"▴":"▾"):"Anlegen ›"}</span></div></button>
    <div class="rweek">${Array.from({length:7},(_,i)=>addDays(wk,i)).map(s=>`<i class="rd ${rState(s)} ${s===todayIso()?"today":""}">${weekday(s)}</i>`).join("")}</div>${list}</div>`;
}
function rMonth(y,mo){
  const first=new Date(y,mo,1), pad=(first.getDay()+6)%7, count=new Date(y,mo+1,0).getDate();
  const heads=["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=>`<div class="sub">${d}</div>`).join("");
  let cells="<div></div>".repeat(pad);
  for(let d=1;d<=count;d++){ const s=iso(new Date(y,mo,d)), r=rDone(s); cells+=`<button class="calcell" data-act="r-pick" data-v="${s}"><div class="cdot ${rState(s)} ${s===todayIso()?"today":""}">${d}</div><div class="cname">${r.c?r.c+"/"+r.n:""}</div></button>`; }
  return `<h2 style="margin:16px 0 8px">${first.toLocaleDateString("de-DE",{month:"long",year:"numeric"})}</h2><div class="calgrid">${heads}${cells}</div>`;
}
function renderRoutineDash(){
  const m=ui.rcal||"day", now=new Date(), rt=state.coach.routine||[], tdy=rDone(todayIso());
  const modes=[["day","Tag"],["month","Monat"],["year","Jahr"]];
  let body="";
  if(m==="day"){
    const n=rDone(state.date);
    body=`${state.rHint?"":`<div class="insight" style="margin-bottom:4px"><b>Was ist das?</b><span>Das ist deine Basis-Routine als Beispiel. Hake ab, was du heute geschafft hast. Ändere oder lösche Einträge und füge eigene hinzu. Schaffst du alle, wächst deine Serie. Ein Tag ohne Haken wird rot.</span><button class="link" data-act="rhint" style="text-align:left;margin-top:4px">Verstanden</button></div>`}
    <h2 style="margin:16px 0 8px">${labelDate(state.date)}${rt.length?` · ${n.c}/${n.n}`:""}</h2><div class="card">
      ${rt.map(r=>{ const on=routineOn(r.id,state.date); return `<div class="rchk"><button class="rbtn" data-act="routine-check" data-id="${r.id}"><span class="box ${on?"on":""}">${on?"✓":""}</span><b>${esc(r.title)}</b></button><button class="x" data-act="routine-del" data-id="${r.id}">✕</button></div>`; }).join("")||`<p class="sub" style="padding:6px 0">Noch keine Routine. Leg unten deine erste an.</p>`}
      <div class="row" style="gap:8px;margin-top:14px"><input id="r-new" placeholder="Eigene Routine, z. B. 10 Min lesen" style="flex:1;min-width:0;border:1.5px solid var(--line);border-radius:14px;padding:11px 12px;font:inherit"><button class="pill dark" data-act="routine-add" style="width:auto;padding:0 18px">+</button></div></div>`;
  } else if(m==="month") body=rMonth(now.getFullYear(),now.getMonth())+rMonth(now.getFullYear(),now.getMonth()-1);
  else { const y=now.getFullYear();
    body=`<h2 style="margin:16px 0 8px">${y}</h2><div class="yeargrid">${Array.from({length:12},(_,mo)=>{
      const first=new Date(y,mo,1), pad=(first.getDay()+6)%7, count=new Date(y,mo+1,0).getDate();
      let cells=Array.from({length:pad},()=>`<i class="sq empty"></i>`).join("");
      for(let d=1;d<=count;d++) cells+=`<i class="sq ${rState(iso(new Date(y,mo,d)))}"></i>`;
      return `<div><div class="sub" style="margin-bottom:4px">${first.toLocaleDateString("de-DE",{month:"short"})}</div><div class="mini">${cells}</div></div>`;
    }).join("")}</div>`; }
  return `<div class="calhead"><button class="navd" data-act="dash-close">‹</button>
    <div class="seg" style="flex:1;margin:0 8px">${modes.map(([id,l])=>`<button class="${m===id?"on":""}" data-act="rcal-mode" data-v="${id}">${l}</button>`).join("")}</div></div>
    <div class="card" style="display:grid;grid-template-columns:1fr 1fr;padding:0">
      <div style="padding:12px;border-right:1px solid var(--line)"><b>${rStreak()}-Tage-Serie${rStreak()>=3?" 🔥":""}</b><div class="sub">Alle Routinen erledigt</div></div>
      <div style="padding:12px"><b>${tdy.c}/${tdy.n} heute</b><div class="sub">Erledigt</div></div></div>
    <div class="sub" style="margin-top:14px">Grün: alle erledigt · Hellgrün: teilweise · Rot: verpasst</div>
    ${body}`;
}
function stackSheet(){
  const d=day();
  return `<h2>Stack heute</h2>
    ${state.stack.map(id=>{ const s=SUPS.find(x=>x.id===id); return `<button class="task" data-act="take" data-id="${id}">
      <span class="chk ${d.taken[id]?"on":""}">${d.taken[id]?"✓":""}</span>
      <div class="grow"><b>${s.name}</b><div class="sub">${s.dose} · ${s.when}</div></div>
    </button>`; }).join("")||`<p class="sub">Noch nichts im Stack.</p>`}
    <div class="gap"></div><button class="pill ghost" style="width:100%" data-act="open" data-type="area" data-id="sups">Stack bearbeiten</button>`;
}
function productSheet(id){
  const item=allItems().find(p=>p.id===id);
  if(!item) return `<p>Nicht gefunden.</p>`;
  const sc=scored(item);
  if(item.type==="food"||item.type==="custom") return foodSheet(item,sc);
  const inStack=item.type==="sup" && state.stack.includes(item.id);
  return `<div class="row" style="gap:12px">
      <div class="score ${scoreClass(sc.score)}" style="width:56px;height:56px;font-size:20px;border-radius:16px">${sc.score}</div>
      <div><div class="sub">${item.brand||""}</div><h2>${esc(item.name)}</h2><div class="sub">${goalName()}</div></div>
    </div>
    <p class="sub" style="margin:12px 0">${sc.reasons.join(" ")}</p>
    ${(sc.parts||[]).length?`<div class="why">${sc.parts.map(([l,v],i)=>`<div><span>${l}</span><b class="${i?(v>0?"up":"dn"):""}">${i&&v>0?"+":""}${v}</b></div>`).join("")}</div>`:""}
    ${item.type==="food"||item.type==="custom"?`
      <div class="sub">${item.kcal} kcal · ${item.protein} g Protein / 100 g</div>
      <div class="field"><label>Portion in g</label><input id="portion" type="number" value="${ui.portion}"></div>
      <button class="pill primary" data-act="log-food" data-id="${item.id}">Zum Tagebuch · ${labelDate(state.date)}</button>
    `:item.type==="sup"?`
      <div class="sub">${item.dose} · ${item.when}</div><div class="gap"></div>
      <button class="pill ${inStack?"ghost":"primary"}" style="width:100%" data-act="toggle-stack" data-id="${item.id}">${inStack?"Aus dem Stack":"In den Stack"}</button>
      ${PARTNERS_ENABLED&&state.profile.affiliates?`<div class="gap"></div><button class="pill ghost" style="width:100%" data-act="affiliate">Bezugsquelle · Anzeige</button>`:""}
    `:`<button class="pill ghost" style="width:100%" data-act="mark-pflege">Für Pflege merken</button>
      ${PARTNERS_ENABLED&&state.profile.affiliates?`<div class="gap"></div><button class="pill ghost" style="width:100%" data-act="affiliate">Bezugsquelle · Anzeige</button>`:""}`}
  `;
}
function areaSheet(id){
  if(id==="sups-list") return supsSheet();
  const topic=coachTopics().find(t=>t.id===id);
  if(!topic) return "<p>Kein Thema.</p>";
  const quiz=coachQuiz(id);
  const answers=state.coach.answers[id]||{};
  const ready=quiz.every(q=>hasVal(answers[q.k]));
  if(!ready){
    return `<h2>${topic.title}</h2><p class="sub">${topic.ask} Ein paar Fragen, dann ein Vorschlag.</p>
      ${quiz.map(item=>`<div class="q"><b>${item.q}</b>${item.multi?`<span class="sub"> · mehrere möglich</span>`:""}<div class="opts">${item.opts.map(o=>`<button class="chip ${(item.multi?(answers[item.k]||[]).includes(o):answers[item.k]===o)?"on":""}" data-act="coach-answer" data-topic="${id}" data-k="${item.k}" data-v="${o}">${o}</button>`).join("")}</div></div>`).join("")}
      <div class="gap"></div><button class="pill primary" data-act="coach-ready" data-topic="${id}" ${ready?"":"disabled"}>Vorschlag zeigen</button>`;
  }
  const advice=coachAdvice(id);
  const products=[...new Set(advice.items.map(i=>i.product).filter(Boolean))];
  const r=advice.routine, inRt=(state.coach.routine||[]).some(x=>x.topic===id);
  return `<h2>${topic.title}</h2><p class="sub">${advice.lead}</p>
    ${r?`<div class="insight" style="margin:12px 0 4px"><b>Dein Routine-Punkt</b><span><b>${esc(r.title)}</b>${r.detail?`<br>${esc(r.detail)}`:""}</span></div>`:""}
    <div class="section"><h2>Worauf es bei dir ankommt</h2></div>
    ${advice.items.map(i=>`<div style="padding:10px 0;border-bottom:1px solid var(--line)"><b>${i.title}</b><div class="sub">${i.detail}</div>${i.act?`<button class="pill ghost" style="width:100%;margin-top:8px" data-act="${i.act}" data-v="${i.v}">${i.label}</button>`:""}</div>`).join("")}
    ${products.length?`<div class="section"><h2>Dazu passen</h2></div>${products.map(pid=>{
      const item=allItems().find(x=>x.id===pid); if(!item) return "";
      return `<button class="food" data-act="open" data-type="product" data-id="${pid}"><div class="thumb">${item.emoji||""}</div><div class="grow"><b>${item.name}</b><div class="sub">${item.brand||""}</div></div></button>`;
    }).join("")}`:""}
    <div class="gap"></div>
    ${inRt
      ?`<button class="pill ghost" style="width:100%" data-act="coach-remove" data-topic="${id}">Aus der Routine entfernen</button>`
      :r?`<button class="pill primary" data-act="coach-add" data-topic="${id}">Als 1 Punkt in die Routine</button>`:""}
    <div class="gap"></div>
    <button class="pill ghost" style="width:100%" data-act="coach-reset" data-topic="${id}">Antworten ändern</button>
    <p class="sub" style="font-size:12px;margin-top:12px">Allgemeine Tipps, kein ärztlicher Rat.</p>`;
}
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
    ${rest.map(p=>`<button class="food" data-act="open" data-type="product" data-id="${p.id}"><div class="thumb">${p.emoji}</div><div class="grow"><b>${p.name}</b><div class="sub">${p.note}</div></div><div class="score ${scoreClass(scored(p).score)}">${scored(p).score}</div></button>`).join("")}`;
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
