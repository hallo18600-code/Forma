// Health Maxxing – Texterkennung: „2 Eier, eine Scheibe Brot mit Butter und ein Kaffee“ → Einträge fürs Tagebuch.
// Läuft komplett auf dem Gerät (kein Server). Ablauf:
//   1. Text aufbereiten (Brüche, Kommazahlen, Bereiche, „3x“)  2. in Teile schneiden (Komma, „und“, „mit“ …)
//   3. je Teil Menge, Einheit, Größe und Mahlzeit erkennen     4. Lebensmittel suchen (genau, Mehrzahl, Tippfehler,
//      zusammengesetzte Wörter, Produktdatenbank)               5. Gramm aus passender Einheit (EL, Scheibe, Teller …)
// Wird nach portionen.js geladen (braucht unitsFor, uName, qtyTxt) und vor scanner.js.
// Menge als Text: halbe Schritte als ½, sonst mit Komma (0,3 Teller)
const teQty=q=>Math.abs(q*2-Math.round(q*2))<1e-6?qtyTxt(q):de(q,q<1?2:1);

// ---------- Wörter ----------
const TE_NUM={ein:1,eine:1,einen:1,einem:1,einer:1,eines:1,eins:1,zwei:2,drei:3,vier:4,funf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10,elf:11,zwolf:12,
  zwanzig:20,dreissig:30,vierzig:40,funfzig:50,hundert:100,halb:.5,halbe:.5,halber:.5,halbes:.5,halben:.5,anderthalb:1.5,eineinhalb:1.5,zweieinhalb:2.5,
  dreieinhalb:3.5,viertel:.25,dreiviertel:.75,doppelt:2,doppelte:2,doppelter:2,doppeltes:2,doppelten:2};
// Einheitswort → Einheit (Schlüssel wie in unitsFor). Gewicht/Volumen direkt in Gramm.
const TE_W={g:1,gr:1,gramm:1,gram:1,grams:1,kg:1000,kilo:1000,kilogramm:1000,mg:.001,ml:1,milliliter:1,cl:10,dl:100,l:1000,liter:1000,ltr:1000};
const TE_U={el:"el",essloffel:"el",essl:"el",tl:"tl",teeloffel:"tl",messloffel:"mess",scoop:"mess",scoops:"mess",
  teller:"teller",schussel:"schuessel",schusseln:"schuessel",schale:"schale",schalen:"schale",schalchen:"schaelchen",portion:"portion",portionen:"portion",port:"portion",
  tasse:"tasse",tassen:"tasse",becher:"becher",glas:"glas",glaser:"glas",flasche:"flasche",flaschen:"flasche",dose:"dose",dosen:"dose",
  packung:"packung",packungen:"packung",pack:"packung",packchen:"packung",tute:"tuete",tuten:"tuete",beutel:"tuete",
  stuck:"stueck",stucke:"stueck",stucks:"stueck",stk:"stueck",stck:"stueck",ecke:"stueck",ecken:"stueck",stange:"stueck",stangen:"stueck",
  scheibe:"scheibe",scheiben:"scheibe",scheibchen:"scheibe",riegel:"riegel",kugel:"kugel",kugeln:"kugel",handvoll:"hand",hand:"hand",
  zehe:"zehe",zehen:"zehe",spalte:"spalte",spalten:"spalte",tafel:"tafel",tafeln:"tafel",reihe:"reihe",reihen:"reihe",stuckchen:"stueckchen",
  schuss:"schuss",spritzer:"schuss",schluck:"schuss",prise:"prise",prisen:"prise",mass:"mass",shot:"shot",shots:"shot",schnapsglas:"shot",kanne:"kanne"};
// Welche Einheiten des Lebensmittels zu einem Wort passen (erste vorhandene gewinnt)
const TE_UTRY={teller:["teller","schuessel","schale_g"],schuessel:["schuessel","schale_g","teller","schale"],schale:["schale","beilage","schuessel","schaelchen"],
  schaelchen:["schaelchen","schale"],portion:["portion","beilage","teller","schale"],tasse:["tasse","becher","glas"],becher:["becher","tasse","glas"],
  glas:["glas","tasse","becher"],flasche:["flasche"],dose:["dose"],packung:["packung","tuete","becher","dose"],tuete:["tuete","packung"],
  stueck:["stueck","riegel","kugel","pizza_st","scheibe"],scheibe:["scheibe","stueck"],riegel:["riegel","stueck"],kugel:["kugel"],hand:["hand"],
  zehe:["zehe"],spalte:["spalte","stueck"],tafel:["tafel"],reihe:["reihe"],stueckchen:["stueckchen"],schuss:["schuss"],mess:["mess"],el:["el"],tl:["tl"],
  mass:["mass"],shot:["shot"],kanne:[]};
// Gramm, wenn das Lebensmittel die Einheit nicht kennt
const TE_UG={el:12,tl:5,mess:30,teller:350,schuessel:300,schale:150,schaelchen:50,portion:150,tasse:200,becher:150,glas:200,flasche:500,dose:330,
  packung:200,tuete:150,riegel:40,kugel:50,hand:30,zehe:4,spalte:100,tafel:100,reihe:20,stueckchen:5,schuss:30,prise:.5,mass:1000,shot:20,kanne:1000};
// Einheiten, die man zählt (bei „3 Bananen“ ohne Einheitswort)
const TE_COUNT=new Set(["stueck","stueck_k","stueck_g","scheibe","riegel","kugel","zehe","spalte","tafel","reihe","stueckchen","dose","flasche","becher","glas","glas_g","tasse","packung","tuete","pizza","mess","shot","mass","ei"]);
// Füllwörter, die nichts über das Essen sagen
const TE_FILL=new Set(("ich hab habe hatte hatten hatte gegessen getrunken gefruhstuckt esse ess trinke trank ass heute gestern vorhin gerade eben noch auch so ca circa etwa ungefahr rund knapp "+
  "mal nur einfach dann danach zuerst lecker leckere leckeren leckeres leckerer frisch frische frischen frischer frisches selbstgemacht selbstgemachte selbstgemachten "+
  "hausgemacht hausgemachte bio mein meine meinen meinem meiner dazu zusammen insgesamt fast um uhr zum zur zu am im der die das den dem des vom von aus ne nen n "+
  "also bzw und oder plus sowie gut ganz ganze ganzen ganzer ganzes normal normale normalen normaler normales").split(" "));
// Würzen und Co.: zählen nicht, werden still übersprungen
const TE_IGN=new Set(("salz pfeffer gewurz gewurze krauter zimt muskat oregano basilikum petersilie schnittlauch dill thymian rosmarin paprikapulver currypulver "+
  "knoblauchpulver chiliflocken susstoff sussungsmittel eiswurfel essig zitronensaft limettensaft wurze maggi").split(" "));
// Größe
const TE_BIG=/^(gross|grosse|grosser|grosses|grossen|riesig|riesige|riesiger|riesigen|xl|xxl|maxi)$/, TE_SMALL=/^(klein|kleine|kleiner|kleines|kleinen|mini)$/;
const TE_LITTLE=/^(etwas|bisschen|bissel|wenig)$/;
// Mahlzeit-Wörter im Text
const TE_SLOT=[["breakfast",/\b(zum fruhstuck|fruhstuck|fruhstucken|morgens|heute morgen|heute fruh|breakfast)\b/],["lunch",/\b(zum mittagessen|zu mittag|mittagessen|mittagspause|mittags|mittag|lunch)\b/],
  ["dinner",/\b(zum abendessen|zu abend|abendessen|abendbrot|abends|abend|dinner|nachts)\b/],["snack",/\b(zwischendurch|zwischenmahlzeit|nachmittags|nachmittag|snacks|snack)\b/]];
// Andere Schreibweisen (Schlüssel und Ziel normalisiert)
const TE_SYN={"kaffee schwarz":"kaffee","schwarzer kaffee":"kaffee","protein shake":"proteinpulver","eiweissshake":"proteinpulver","eiweiss shake":"proteinpulver",
  "weissbrot":"toastbrot","spaghetti":"nudeln gekocht","pasta":"nudeln gekocht","hahnchen":"hahnchenbrust","hahnchenfleisch":"hahnchenbrust","huhn":"hahnchenbrust",
  "chicken":"hahnchenbrust","o saft":"orangensaft","osaft":"orangensaft","cola light":"cola zero","coke zero":"cola zero","pommes frites":"pommes",
  "fritten":"pommes","nudel":"nudeln gekocht","eiweiss":"proteinpulver","proteinshake":"proteinpulver","shake":"proteinpulver","stulle":"mischbrot","brotscheibe":"mischbrot"};
// „Käsebrot“, „Wurstbrötchen“: Brot + Belag
const TE_BREAD=[["brotchen","brotchen"],["semmel","brotchen"],["toast","toastbrot"],["stulle","mischbrot"],["brot","mischbrot"]];
const TE_TOP={kase:"kase",wurst:"wurst",salami:"salami",schinken:"kochschinken",butter:"butter",marmeladen:"marmelade",marmelade:"marmelade",nutella:"nutella",
  honig:"honig",leberwurst:"leberwurst",frischkase:"frischkase",erdnussbutter:"erdnussbutter",avocado:"avocado",lachs:"lachs",thunfisch:"thunfisch",
  tomaten:"tomate",gurken:"gurke",ei:"ei",eier:"ei",quark:"magerquark",schmalz:"butter",mett:"hackfleisch",speck:"speck",teewurst:"leberwurst",hummus:"hummus"};

// ---------- Hilfen ----------
const teN=s=>NORM(s).replace(/[^a-z0-9%]+/g," ").trim();
// Wortstamm für Mehrzahl/Fälle: Bananen = Banane, Eier = Ei, Kartoffeln = Kartoffel
function teStem(w){ if(w.length<=4) return w; for(const e of ["en","er","n","e","s"]) if(w.endsWith(e)&&w.length-e.length>=3) return w.slice(0,-e.length); return w; }
function teQ(s){ const w=s.split(" ").filter(Boolean); return {s:w.join(" "), w, c:w.join(""), st:w.map(teStem)}; }
// Tippfehler-Abstand (Vertauschen zählt als 1). Bricht ab, sobald es mehr als max wird.
function teDist(a,b,max){
  if(Math.abs(a.length-b.length)>max) return max+1;
  let p2=null, p=Array.from({length:b.length+1},(_,j)=>j);
  for(let i=1;i<=a.length;i++){
    const c=[i]; let lo=i;
    for(let j=1;j<=b.length;j++){
      let v=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));
      if(p2&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) v=Math.min(v,p2[j-2]+1);
      c.push(v); if(v<lo) lo=v;
    }
    if(lo>max) return max+1;
    p2=p; p=c;
  }
  return p[b.length];
}

// ---------- Suche: eigene Liste (Grunddaten + eigene Lebensmittel) ----------
let TE_IDX=null;
function teIndex(){
  const pool=foods().filter(p=>!p.hidden&&!String(p.id).startsWith("db-")&&!String(p.id).startsWith("off-"));
  const sig=pool.length;
  if(TE_IDX&&TE_IDX.sig===sig) return TE_IDX.list;
  const list=pool.map(p=>({p, keys:[p.name].concat(p.al||[]).map((x,i)=>{ const q=teQ(teN(x)); q.name=i===0; return q; }).filter(k=>k.s)}));
  TE_IDX={sig,list}; return list;
}
// Wie gut passt ein Lebensmittel zur Suche? 100 = genau der Name … 36 = nur Teil eines zusammengesetzten Worts
function teScore(e,q){
  let best=0;
  for(const K of e.keys){
    let sc=0;
    if(K.s===q.s) sc=K.name?100:99;
    else if(K.c===q.c) sc=98;
    else if(K.st.join(" ")===q.st.join(" ")) sc=95;
    else if(q.w.every((w,i)=>K.w.some((x,j)=>x===w||K.st[j]===q.st[i]||(w.length>=3&&x.startsWith(w))))) sc=80+Math.round(9*q.c.length/Math.max(1,K.c.length));
    else if(K.w.every((x,j)=>q.w.some((w,i)=>w===x||q.st[i]===K.st[j]))) sc=70+Math.round(9*K.c.length/Math.max(1,q.c.length));
    else {
      const d=q.c.length>=5?teDist(q.c,K.c,2):9;
      if(d===1) sc=64; else if(d===2&&q.c.length>=8) sc=56;
      else if(q.w.length===1&&K.w.length===1&&K.c.length>=4&&q.c.length>K.c.length){
        const r=K.c.length/q.c.length;
        if(q.c.endsWith(K.c)||q.c.endsWith(K.st[0])) sc=40+Math.round(18*r);          // Vollkorn„brötchen“
        else if(q.c.startsWith(K.c)) sc=36+Math.round(18*r);                         // „Hähnchenbrust“filet
      }
    }
    if(sc>best) best=sc;
  }
  return best;
}
function teLocal(q){ return teIndex().map(e=>({p:e.p,sc:teScore(e,q)})).filter(x=>x.sc>=36).sort((a,b)=>b.sc-a.sc); }
// ---------- Suche: Produktdatenbank (Open Food Facts) ----------
function teDbList(q){ return (typeof FOODDB!=="undefined"&&FOODDB.ok)?dbSearch(q.s,12):[]; }
// Name genau gleich oder Suche ist der Anfang eines kurzen Namens
function teDbNear(list,q){
  let best=null, bs=0;
  for(const it of list){
    const n=teN(it.name), nq=teQ(n); let s=0;
    if(n===q.s||nq.c===q.c||nq.st.join(" ")===q.st.join(" ")) s=3;
    else if(n.startsWith(q.s+" ")&&q.s.length>=n.length*0.5) s=2;
    if(s>bs||(s&&s===bs&&n.length<teN(best.name).length)){ bs=s; best=it; }
  }
  return best;
}
// Alle Suchwörter stehen als Wortanfang im Namen (nicht mitten im Wort: „Apfel“ ≠ „Granatapfel“)
function teDbWords(list,q){
  return list.find(it=>{ const nw=teN(it.name+" "+(it.brand||"")).split(" ");
    return q.w.every(w=>nw.some(x=>x.startsWith(w.length>=6?teStem(w):w)))&&(it.kcal>0||/wasser|tee|kaffee|zero|light|espresso/.test(teN(it.name))); });
}
// Bestes Lebensmittel zu einem Namen. Gibt {food, sc, alts} oder null zurück.
function teFind(raw){
  let s=teN(raw); if(!s) return null;
  if(TE_SYN[s]) s=teN(TE_SYN[s]);
  const q=teQ(s), loc=teLocal(q), top=loc[0];
  let db=null; const DB=()=>db||(db=teDbList(q));
  let food=null, sc=0, how="local";
  if(top&&top.sc>=80){ food=top.p; sc=top.sc; }
  else {
    const near=teDbNear(DB(),q);
    if(top&&top.sc>=70){ food=near||top.p; sc=near?75:top.sc; if(near) how="near"; }   // „Alpro Haferdrink“: Produkt vor Grunddaten
    else if(top&&top.sc>=56){ food=top.p; sc=top.sc; }                   // Tippfehler: „Bananne“
    else if(near){ food=near; sc=60; how="near"; }
    else { const w=teDbWords(DB(),q); if(w){ food=w; sc=45; how="words"; } else if(top){ food=top.p; sc=top.sc; } }
  }
  if(!food) return null;
  // Andere Möglichkeiten zum Austauschen (eigene Liste + Datenbank)
  const seen=new Set([food.id]), alts=[];
  loc.slice(0,8).forEach(x=>{ if(alts.length<4&&!seen.has(x.p.id)){ seen.add(x.p.id); alts.push(x.p); } });
  if(alts.length<4) DB().forEach(x=>{ if(alts.length<4&&!seen.has(x.id)&&x.kcal>0){ seen.add(x.id); alts.push(x); } });
  return {food, sc, alts, how};
}

// ---------- Andere Sprachen ----------
// Wörter vorher ins Deutsche übertragen: Zahlen, Einheiten, Verbinder und häufige Lebensmittel.
// Englische Lebensmittelwörter versteht die App immer (viele schreiben „Chicken“, „Oats“, „Peanut Butter“).
const TE_EN_FOOD={"overnight oats":"overnight oats","chicken nuggets":"chicken nuggets","ice tea":"ice tea","iced tea":"eistee","hot dog":"hot dog","french toast":"french toast",
  "scrambled eggs":"ruhrei","scrambled egg":"ruhrei","fried eggs":"spiegelei","fried egg":"spiegelei","boiled egg":"ei","boiled eggs":"eier",egg:"ei",eggs:"eier",
  "whole wheat bread":"vollkornbrot","wholemeal bread":"vollkornbrot",bread:"brot",cheese:"kase","cottage cheese":"huttenkase","cream cheese":"frischkase",ham:"schinken",
  sausage:"wurstchen",sausages:"wurstchen",milk:"milch","oat milk":"hafermilch","almond milk":"mandelmilch","soy milk":"sojamilch",coffee:"kaffee",tea:"tee","green tea":"gruner tee",
  water:"wasser",juice:"saft","orange juice":"orangensaft","apple juice":"apfelsaft",beer:"bier",wine:"wein","red wine":"rotwein","white wine":"weisswein",rice:"reis",
  noodles:"nudeln",potato:"kartoffel",potatoes:"kartoffeln","mashed potatoes":"kartoffelpuree",fries:"pommes","french fries":"pommes","sweet potato":"susskartoffel",
  "sweet potatoes":"susskartoffeln",chicken:"hahnchen","chicken breast":"hahnchenbrust",beef:"rindfleisch","ground beef":"hackfleisch",pork:"schweinefleisch",fish:"fisch",
  salmon:"lachs",tuna:"thunfisch",shrimp:"garnelen",prawns:"garnelen",salad:"salat",apple:"apfel",apples:"apfel",banana:"banane",bananas:"bananen",berries:"beeren",
  strawberries:"erdbeeren",blueberries:"blaubeeren",raspberries:"himbeeren",grapes:"trauben",pear:"birne",oats:"haferflocken",oatmeal:"porridge",yogurt:"joghurt",
  yoghurt:"joghurt","greek yogurt":"griechischer joghurt",honey:"honig",jam:"marmelade","peanut butter":"erdnussbutter",nuts:"nusse",almonds:"mandeln",walnuts:"walnusse",
  tomato:"tomate",tomatoes:"tomaten",cucumber:"gurke",carrot:"karotte",carrots:"karotten",spinach:"spinat",onion:"zwiebel",mushrooms:"champignons",beans:"bohnen",
  lentils:"linsen",chickpeas:"kichererbsen",soup:"suppe",chocolate:"schokolade","dark chocolate":"zartbitterschokolade",cookie:"keks",cookies:"kekse",cake:"kuchen",
  "ice cream":"eis",sugar:"zucker","olive oil":"olivenol",oil:"ol","protein shake":"proteinshake","protein bar":"proteinriegel","protein powder":"proteinpulver",
  pancake:"pfannkuchen",pancakes:"pfannkuchen","milk shake":"milchshake",milkshake:"milchshake",crisps:"chips",meatballs:"frikadellen",cereal:"cornflakes",peas:"erbsen"};
const TE_LANGS={
  en:{a:"1",an:"1",one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10",half:"halb","a couple of":"paar","a few":"paar",few:"paar",
    several:"paar",some:"etwas","a bit of":"etwas","a little":"etwas",double:"doppelt",and:"und",with:"mit",without:"ohne",then:"dann",of:"",for:"",the:"",i:"",had:"",
    ate:"",have:"",drank:"",eaten:"",my:"",today:"","this morning":"morgens",morning:"morgens",noon:"mittags",evening:"abends",tonight:"abends",large:"gross",big:"gross",
    small:"klein",medium:"",fresh:"",slice:"scheibe",slices:"scheiben",piece:"stuck",pieces:"stuck",cup:"tasse",cups:"tassen",mug:"tasse",glass:"glas",glasses:"glaser",
    "bowl of":"schale","bowls of":"schalen",plate:"teller",plates:"teller",tablespoon:"el",tablespoons:"el",tbsp:"el",teaspoon:"tl",teaspoons:"tl",tsp:"tl",
    handful:"handvoll",handfuls:"handvoll",can:"dose",cans:"dosen",bottle:"flasche",bottles:"flaschen",serving:"portion",servings:"portionen",portions:"portionen",
    bar:"riegel",bars:"riegel",pack:"packung",packet:"packung",bag:"tute",litre:"liter",litres:"liter",liters:"liter",grams:"g",gram:"g",pint:"500 ml",corn:"mais"},
  fr:{un:"1",une:"1",deux:"2",trois:"3",quatre:"4",cinq:"5",six:"6",sept:"7",huit:"8",neuf:"9",dix:"10",demi:"halb",demie:"halb","un peu de":"etwas","un peu d":"etwas",
    quelques:"paar",et:"und",avec:"mit",sans:"ohne",puis:"dann",de:"",du:"",des:"",d:"",la:"",le:"",les:"",l:"",j:"",ai:"",mange:"",bu:"",aujourd:"",hui:"",
    "ce matin":"morgens",matin:"morgens",midi:"mittags",soir:"abends","petit dejeuner":"fruhstuck",dejeuner:"mittagessen",diner:"abendessen",tranche:"scheibe",tranches:"scheiben",
    morceau:"stuck",morceaux:"stuck",piece:"stuck",pieces:"stuck",tasse:"tasse",tasses:"tassen",verre:"glas",verres:"glaser",bol:"schale",bols:"schalen",assiette:"teller",
    assiettes:"teller","cuillere a soupe":"el","cuilleres a soupe":"el",cas:"el","cuillere a cafe":"tl","cuilleres a cafe":"tl",cac:"tl",poignee:"handvoll",canette:"dose",
    bouteille:"flasche",bouteilles:"flaschen",portion:"portion",portions:"portionen",barre:"riegel",gros:"gross",grosse:"gross",grand:"gross",grande:"gross",petit:"klein",petite:"klein",
    "œuf":"ei","œufs":"eier",oeuf:"ei",oeufs:"eier",pain:"brot","pain complet":"vollkornbrot",beurre:"butter",fromage:"kase",jambon:"schinken",lait:"milch",cafe:"kaffee",the:"tee",
    eau:"wasser",jus:"saft","jus d orange":"orangensaft",biere:"bier",vin:"wein",riz:"reis",pates:"nudeln","pommes de terre":"kartoffeln",frites:"pommes",poulet:"hahnchen",
    boeuf:"rindfleisch","bœuf":"rindfleisch",porc:"schweinefleisch",poisson:"fisch",saumon:"lachs",thon:"thunfisch",salade:"salat",pomme:"apfel",pommes:"apfel",fraises:"erdbeeren",
    myrtilles:"blaubeeren",raisin:"trauben","flocons d avoine":"haferflocken",avoine:"haferflocken",yaourt:"joghurt",miel:"honig",confiture:"marmelade",noix:"nusse",
    amandes:"mandeln",concombre:"gurke",carotte:"karotte",carottes:"karotten",brocoli:"brokkoli",epinards:"spinat",oignon:"zwiebel",haricots:"bohnen",lentilles:"linsen",
    soupe:"suppe",chocolat:"schokolade",gateau:"kuchen",biscuits:"kekse",glace:"eis",sucre:"zucker","huile d olive":"olivenol",huile:"ol",crepe:"pfannkuchen",crepes:"pfannkuchen"},
  es:{un:"1",una:"1",uno:"1",dos:"2",tres:"3",cuatro:"4",cinco:"5",seis:"6",siete:"7",ocho:"8",nueve:"9",diez:"10",medio:"halb",media:"halb","un poco de":"etwas",
    unos:"paar",unas:"paar",y:"und",con:"mit",sin:"ohne",luego:"dann",de:"",del:"",el:"",la:"",los:"",las:"",he:"",comido:"",comi:"",bebido:"",hoy:"",desayuno:"fruhstuck",
    almuerzo:"mittagessen",cena:"abendessen",rebanada:"scheibe",rebanadas:"scheiben",trozo:"stuck",trozos:"stuck",pieza:"stuck",piezas:"stuck",taza:"tasse",tazas:"tassen",
    vaso:"glas",vasos:"glaser",bol:"schale",cuenco:"schale",plato:"teller",platos:"teller",cucharada:"el",cucharadas:"el",cucharadita:"tl",cucharaditas:"tl",punado:"handvoll",
    lata:"dose",latas:"dosen",botella:"flasche",botellas:"flaschen",racion:"portion",porcion:"portion",barrita:"riegel",grande:"gross",pequeno:"klein",pequena:"klein",
    huevo:"ei",huevos:"eier",pan:"brot","pan integral":"vollkornbrot",mantequilla:"butter",queso:"kase",jamon:"schinken",leche:"milch",cafe:"kaffee",te:"tee",agua:"wasser",
    zumo:"saft",jugo:"saft","zumo de naranja":"orangensaft",cerveza:"bier",vino:"wein",arroz:"reis",patatas:"kartoffeln",papas:"kartoffeln","patatas fritas":"pommes",
    pollo:"hahnchen",ternera:"rindfleisch",cerdo:"schweinefleisch",pescado:"fisch",salmon:"lachs",atun:"thunfisch",ensalada:"salat",manzana:"apfel",manzanas:"apfel",
    platano:"banane",fresas:"erdbeeren",avena:"haferflocken",yogur:"joghurt",miel:"honig",mermelada:"marmelade",nueces:"nusse",almendras:"mandeln",pepino:"gurke",
    zanahoria:"karotte",brocoli:"brokkoli",espinacas:"spinat",cebolla:"zwiebel",judias:"bohnen",frijoles:"bohnen",lentejas:"linsen",sopa:"suppe",galletas:"kekse",
    pastel:"kuchen",tarta:"kuchen",helado:"eis",azucar:"zucker","aceite de oliva":"olivenol",aceite:"ol",tortilla:"omelett",tostada:"toast",tostadas:"toast",espaguetis:"spaghetti",bolonesa:"bolognese","a la":"",arandanos:"blaubeeren"},
  it:{un:"1",uno:"1",una:"1",due:"2",tre:"3",quattro:"4",cinque:"5",sei:"6",sette:"7",otto:"8",nove:"9",dieci:"10",mezzo:"halb",mezza:"halb","un po di":"etwas",
    qualche:"paar",e:"und",con:"mit",senza:"ohne",poi:"dann",di:"",del:"",della:"",il:"",la:"",lo:"",i:"",gli:"",le:"",ho:"",mangiato:"",bevuto:"",oggi:"",
    colazione:"fruhstuck",pranzo:"mittagessen",cena:"abendessen",fetta:"scheibe",fette:"scheiben",pezzo:"stuck",pezzi:"stuck",tazza:"tasse",tazze:"tassen",bicchiere:"glas",
    bicchieri:"glaser",ciotola:"schale",piatto:"teller",piatti:"teller",cucchiaio:"el",cucchiai:"el",cucchiaino:"tl",cucchiaini:"tl",manciata:"handvoll",lattina:"dose",
    bottiglia:"flasche",porzione:"portion",barretta:"riegel",grande:"gross",piccolo:"klein",piccola:"klein",uovo:"ei",uova:"eier",pane:"brot","pane integrale":"vollkornbrot",
    burro:"butter",formaggio:"kase",prosciutto:"schinken",latte:"milch",caffe:"kaffee",te:"tee",acqua:"wasser",succo:"saft",birra:"bier",vino:"wein",riso:"reis",
    patate:"kartoffeln","patatine fritte":"pommes",pollo:"hahnchen",manzo:"rindfleisch",maiale:"schweinefleisch",pesce:"fisch",salmone:"lachs",tonno:"thunfisch",
    insalata:"salat",mela:"apfel",mele:"apfel",fragole:"erdbeeren",mirtilli:"blaubeeren",avena:"haferflocken",miele:"honig",marmellata:"marmelade",noci:"nusse",
    mandorle:"mandeln",pomodoro:"tomate",pomodori:"tomaten",cetriolo:"gurke",carota:"karotte",carote:"karotten",spinaci:"spinat",cipolla:"zwiebel",fagioli:"bohnen",
    lenticchie:"linsen",zuppa:"suppe",cioccolato:"schokolade",biscotti:"kekse",torta:"kuchen",gelato:"eis",zucchero:"zucker","olio d oliva":"olivenol",
    "olio di oliva":"olivenol",olio:"ol",cornetto:"croissant",alla:"",al:""},
  nl:{een:"1",twee:"2",drie:"3",vier:"4",vijf:"5",zes:"6",zeven:"7",acht:"8",negen:"9",tien:"10",half:"halb",halve:"halb","een paar":"paar","een beetje":"etwas",
    en:"und",met:"mit",zonder:"ohne",dan:"dann",de:"",het:"",van:"",ik:"",heb:"",gegeten:"",gedronken:"",vandaag:"",ontbijt:"fruhstuck",avondeten:"abendessen",
    plak:"scheibe",plakken:"scheiben",sneetje:"scheibe",sneetjes:"scheiben",stuk:"stuck",stuks:"stuck",stukken:"stuck",kop:"tasse",kopje:"tasse",kopjes:"tassen",
    glazen:"glaser",kom:"schale",kommetje:"schale",bord:"teller",eetlepel:"el",eetlepels:"el",theelepel:"tl",theelepels:"tl",handje:"handvoll",blik:"dose",blikje:"dose",
    fles:"flasche",flessen:"flaschen",portie:"portion",reep:"riegel",groot:"gross",grote:"gross",kleine:"klein",eieren:"eier",brood:"brot",volkorenbrood:"vollkornbrot",
    boter:"butter",kaas:"kase",melk:"milch",koffie:"kaffee",thee:"tee",sap:"saft",sinaasappelsap:"orangensaft",wijn:"wein",rijst:"reis",aardappelen:"kartoffeln",
    aardappels:"kartoffeln",friet:"pommes",patat:"pommes",kip:"hahnchen",rundvlees:"rindfleisch",varkensvlees:"schweinefleisch",vis:"fisch",zalm:"lachs",tonijn:"thunfisch",
    appel:"apfel",appels:"apfel",banaan:"banane",aardbeien:"erdbeeren",blauwe:"",bessen:"blaubeeren",havermout:"haferflocken",honing:"honig",noten:"nusse",
    amandelen:"mandeln",tomaat:"tomate",komkommer:"gurke",wortel:"karotte",wortels:"karotten",spinazie:"spinat",ui:"zwiebel",bonen:"bohnen",linzen:"linsen",soep:"suppe",
    chocola:"schokolade",chocolade:"schokolade",koekje:"keks",koekjes:"kekse",taart:"kuchen",ijs:"eis",suiker:"zucker",olijfolie:"olivenol",olie:"ol",pindakaas:"erdnussbutter"}
};
let TE_LRE=null;
function teLang(t){
  if(!TE_LRE){
    const map={}, add=o=>Object.keys(o).forEach(k=>{ const nk=NORM(k).replace(/[^a-z0-9œ ]+/g," ").replace(/\s+/g," ").trim(); if(nk) map[nk]=NORM(o[k]); });
    add(TE_EN_FOOD); const L=typeof LANG!=="undefined"?LANG:"de"; if(TE_LANGS[L]) add(TE_LANGS[L]);
    // Gleiche Wörter („overnight oats“) bleiben im Muster: sie schützen längere Begriffe vor dem Übersetzen einzelner Teile
    const keys=Object.keys(map).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
    TE_LRE={re:keys.length?new RegExp("(^|[^a-z0-9œ])("+keys.join("|")+")(?=$|[^a-z0-9œ])","g"):null, map};
  }
  if(!TE_LRE.re) return t;
  return t.replace(TE_LRE.re,(m,pre,k)=>TE_LRE.map[k]===k?m:pre+" "+TE_LRE.map[k]+" ");
}

// ---------- Text in Teile schneiden ----------
const TE_SEP=/(\s*[,;\n+&]\s*|\s*\.\s+|\s+(?:und|mit|sowie|dazu|plus|danach|dann|ausserdem|auf|ohne)\s+)/;
function tePrep(text){
  let t=" "+String(text||"")+" ";
  t=t.replace(/(\d)\s*½/g,"$1.5").replace(/(\d)\s*¼/g,"$1.25").replace(/(\d)\s*¾/g,"$1.75").replace(/½/g," 0.5 ").replace(/¼/g," 0.25 ").replace(/¾/g," 0.75 ").replace(/⅓/g," 0.33 ").replace(/⅔/g," 0.67 ");
  t=NORM(t).replace(/[’`´]/g," ");
  t=teLang(" "+t.replace(/'/g," ")+" ");                              // andere Sprachen → Deutsch
  t=t.replace(/(\d),(\d)/g,"$1.$2");                                   // 1,5 → 1.5
  t=t.replace(/\b(\d+)\s+(\d+)\s*\/\s*(\d+)\b/g,(m,a,b,c)=>+c?String(+a+ +b/ +c):m);   // 1 1/2
  t=t.replace(/\b(\d+)\s*\/\s*(\d+)\b/g,(m,a,b)=>+b?String(+(+a/ +b).toFixed(2)):m);   // 1/2
  // 2-3, 2 bis 3, 2 oder 3 → Mitte
  t=t.replace(/\b(\d+(?:\.\d+)?)\s*(?:-|–|bis|oder)\s*(\d+(?:\.\d+)?)(?![\d.])/g,(m,a,b)=>String(+((+a+ +b)/2).toFixed(2)));
  t=t.replace(/\b(ca|ungef|zb|bzw|evtl|inkl)\./g," ").replace(/\b\d{1,2}:\d{2}\b(\s*uhr)?/g," ").replace(/\b\d{1,2}(\.\d{2})?\s*uhr\b/g," ");
  t=t.replace(/(\d)\.(\d)/g,"$1§$2");                                  // Dezimalpunkt schützen, dann Satzende trennen
  t=t.replace(/[!?:()"„“”'´`*_\/]+/g," ").replace(/\.(?=\s|$)/g,". ");
  t=t.replace(/\b(\d+(?:§\d+)?)\s*[x×]\b/g," $1 ").replace(/\b[x×]\s*(\d+(?:§\d+)?)\b/g," $1 ");   // 3x, x3
  t=t.replace(/\bhand voll\b/g,"handvoll").replace(/\bein paar\b|\beinige\b|\bmehrere\b/g," paar ").replace(/\bein bisschen\b|\bein wenig\b/g," etwas ");
  t=t.replace(/\s*-\s*/g," ").replace(/\s+/g," ");
  return t;
}
function teSegments(text){
  const parts=tePrep(text).split(TE_SEP), out=[];
  let sep="", parent=-1, drop=false;
  for(const raw of parts){
    if(TE_SEP.test(raw)&&!/[a-z0-9]/.test(raw.replace(/\b(und|mit|sowie|dazu|plus|danach|dann|ausserdem|auf|ohne)\b/g,""))){
      const w=raw.trim().replace(/[.,;+&\n]/g,"").trim()||raw.trim()[0]||",";
      sep=w; continue;
    }
    const s=raw.replace(/§/g,".").trim(); if(!s){ continue; }
    if(sep==="ohne"){ drop=true; } else if(sep&&!["mit","und"].includes(sep)) drop=false;
    // „Kaffee ohne Zucker und Milch“: beides weglassen. „… und ein Croissant“ (mit Menge) ist wieder etwas Neues.
    const fresh=/^(\d|(ein|eine|einen|zwei|drei|vier|funf|halb)\b)/.test(s);
    if(sep==="ohne"||(drop&&sep==="und"&&!fresh)) { sep=""; continue; }
    drop=false;
    // „mit“ hängt an das vorige Essen an; „und“ direkt danach bleibt beim selben (Brot mit Butter und Käse)
    let par=-1;
    if(sep==="mit"&&out.length) par=out[out.length-1].par>=0?out[out.length-1].par:out.length-1;
    else if(sep==="und"&&!fresh&&out.length&&out[out.length-1].par>=0) par=out[out.length-1].par;
    out.push({raw:s, par});
    sep="";
  }
  return out;
}

// ---------- Menge, Einheit, Größe aus einem Teil lesen ----------
function teSpec(seg){
  let s=" "+seg+" ", slot=null;
  for(const [id,re] of TE_SLOT){ if(re.test(s)){ slot=id; s=s.replace(new RegExp(re.source,"g")," "); } }
  const tk=s.trim().split(" ").filter(Boolean);
  const sp={qty:null,unit:null,wg:null,size:null,little:false,few:false,slot,name:[],egg:false,count:null};
  let pendingNum=null;
  for(let i=0;i<tk.length;i++){
    let w=tk[i];
    const m=w.match(/^(\d+(?:\.\d+)?)([a-z]*)$/);
    if(m){
      const n=parseFloat(m[1]), u=m[2];
      if(u&&TE_W[u]!=null){ sp.wg=(sp.wg||0)+n*TE_W[u]; continue; }
      if(u&&TE_U[u]){ sp.unit=sp.unit||TE_U[u]; sp.qty=sp.qty==null?n:sp.qty; continue; }
      if(u){ sp.name.push(w); continue; }
      // Zahl ohne Einheit: Einheit kann im nächsten Wort stehen
      const nx=tk[i+1];
      if(nx&&TE_W[nx]!=null){ sp.wg=(sp.wg||0)+n*TE_W[nx]; i++; continue; }
      if(sp.qty==null) sp.qty=n; else pendingNum=n;
      continue;
    }
    if(w==="paar"){ sp.few=true; continue; }
    if(TE_NUM[w]!=null){
      const v=TE_NUM[w];
      // „ein halbes Brötchen“ = ½, „eine Portion“ = 1
      if(sp.qty==null) sp.qty=v; else if(sp.qty===1&&v<1) sp.qty=v; else if(v>=1&&v!==1) sp.qty*=v;
      continue;
    }
    if(TE_W[w]!=null&&sp.qty!=null&&sp.wg==null&&!sp.unit){ sp.wg=sp.qty*TE_W[w]; sp.qty=null; continue; }
    if(TE_U[w]&&!sp.unit){ sp.unit=TE_U[w]; continue; }
    if(TE_BIG.test(w)){ sp.size="g"; continue; }
    if(TE_SMALL.test(w)){ sp.size="k"; continue; }
    if(TE_LITTLE.test(w)){ sp.little=true; continue; }
    if(TE_FILL.has(w)) continue;
    sp.name.push(w);
  }
  if(sp.qty==null&&pendingNum!=null) sp.qty=pendingNum;
  if(sp.qty!=null&&sp.qty>0&&sp.wg!=null&&!sp.unit) sp.count=sp.qty;   // „2 Scheiben Brot (80 g)“ / „3 Eier 150 g“
  // „Ein Riegel“, „eine Kugel“: Einheit ist zugleich das Essen
  if(!sp.name.length&&sp.unit&&["riegel","kugel"].includes(sp.unit)){ sp.name=[sp.unit==="riegel"?"riegel":"eis"]; }
  sp.egg=sp.name.some(w=>/(^|[a-z])eier$/.test(w));
  return sp;
}

// ---------- Gramm berechnen ----------
// Gibt {grams, u, q, txt} zurück. u/q = Einheit fürs Tagebuch (nur wenn sie genau passt), txt = kurze Mengenangabe
function teAmount(food, sp, ctx){
  const us=unitsFor(food), find=k=>us.find(x=>x.k===k), def=us.find(x=>x.d)||null;
  const kc=+food.kcal||0, nm=" "+teN(food.name+" "+((food.al||[]).join(" ")))+" ";
  let u=null, q=null, grams=null;
  const pick=keys=>{ for(const k of keys){ const x=find(k); if(x) return x; } return null; };
  const sized=(x,qq)=>{   // groß/klein: passende Variante oder ±35 %
    if(!sp.size) return [x,qq,null];
    const v=x&&find(x.k.replace(/_[gk]$/,"")+"_"+sp.size);
    if(v) return [v,qq,null];
    return [x,qq,sp.size==="g"?1.35:0.7];
  };
  let f=1;
  if(sp.wg!=null){ grams=sp.wg; }
  else if(sp.unit){
    const x=pick(TE_UTRY[sp.unit]||[sp.unit]);
    q=sp.qty!=null?sp.qty:1;
    if(x){ const r=sized(x,q); u=r[0]; f=r[2]||1; grams=u.g*q*f; }
    else {
      const base=sp.unit==="stueck"?(+food.pieceG||+food.sliceG||100):sp.unit==="scheibe"?(+food.sliceG||30):(TE_UG[sp.unit]||100);
      grams=base*q*(sp.size==="g"?1.35:sp.size==="k"?0.7:1);
      if(UNIT_TXT.de[sp.unit]) ctx.txt=teQty(q)+" "+uName(sp.unit,q);
      q=null;
    }
  }
  else if(sp.qty!=null&&sp.egg&&/ruhrei|omelett|spiegelei/.test(nm)){ grams=sp.qty*(/spiegelei/.test(nm)?(+food.pieceG||70):55); q=null; ctx.txt=T(teQty(sp.qty)+" "+(sp.qty>1?"Eier":"Ei")); }
  else if(sp.qty!=null&&sp.qty>=20){ grams=sp.qty; }                  // „300 Nudeln“: Gramm
  else if(sp.qty!=null){
    q=sp.qty;
    const x=(def&&TE_COUNT.has(def.k))?def:pick(["stueck","scheibe","riegel","kugel"])||null;
    if(x){ const r=sized(x,q); u=r[0]; f=r[2]||1; grams=u.g*q*f; }
    else if(+food.pieceG){ grams=+food.pieceG*q*(sp.size==="g"?1.35:sp.size==="k"?0.7:1); ctx.txt=teQty(q)+" "+uName("stueck",q); q=null; }
    else if(def){ const r=sized(def,q); u=r[0]; f=r[2]||1; grams=u.g*q*f; }
    else { grams=100*q; q=null; }
  }
  else if(sp.few){                                                     // „ein paar Erdbeeren / Kartoffeln“
    const x=pick(["stueck","stueckchen","scheibe","kugel"]), h=find("hand");
    if(x&&(!h||x.g>=h.g/3)){ u=x; q=3; grams=x.g*3; } else if(h){ u=h; q=1; grams=h.g; } else if(def){ u=def; q=1; grams=def.g; }
  }
  else if(sp.little){                                                  // „etwas Butter / Milch“
    const x=def&&["tl","el"].includes(def.k)?(find("tl")||def):find("schuss")||find("tl");
    if(x){ u=x; q=1; grams=x.g; } else { grams=(def?def.g:100)*0.5; }
  }
  else if(ctx.rule){ const r=ctx.rule; u=r.u?find(r.u):null; q=r.q; grams=r.g!=null?r.g:(u?u.g*q:null); if(grams==null){ u=null; q=null; } }
  if(grams==null){
    if(def){ const r=sized(def,1); u=r[0]; q=1; f=r[2]||1; grams=u.g*f; }
    else { grams=100*(sp.size==="g"?1.35:sp.size==="k"?0.7:1); }
  }
  grams=Math.max(0,Math.min(10000,Math.round(grams)));
  // Mengenangabe für die Anzeige. Größe per Faktor (keine eigene Einheit) steht dahinter.
  const txt=ctx.txt||(u&&u.k==="pizza"&&q!=null?T(teQty(q)+" "+(q>1?"Pizzen":"Pizza")):"")||(u&&q!=null?teQty(q)+" "+uName(u.k,q)+(f>1?" · "+T("groß"):f<1?" · "+T("klein"):""):"");
  // Einheit nur merken, wenn die Gramm genau dazu passen (sonst zeigt das Tagebuch nur Gramm)
  if(u&&(f!==1||q==null||Math.abs(q*2-Math.round(q*2))>1e-6)){ u=null; q=null; }
  return {grams, u:u?u.k:null, q:u?q:null, txt};
}
// Regeln für Beilagen am vorigen Essen („Kaffee mit Milch“ = Schuss, „2 Scheiben Brot mit Käse“ = 2 Scheiben Käse)
function teRule(food, parentFood, parentCount){
  if(!parentFood) return null;
  const n=" "+teN(food.name+" "+((food.al||[]).join(" ")))+" ", p=" "+teN(parentFood.name)+" ", N=Math.max(1,Math.min(4,Math.round(parentCount||1)));
  const hot=/ (kaffee|espresso|cappuccino|latte|macchiato|tee|kakao|chai) /.test(p), cereal=/(musli|granola|cornflakes|haferflocken|porridge|haferbrei|flocken|oats|knusper)/.test(p);
  const dairy=/(skyr|joghurt|quark|huttenkase|porridge)/.test(p), bread=/(brot|toast|brotchen|semmel|knacke|baguette|bagel|croissant|ciabatta)/.test(p), eggs=/( ei |eier|ruhrei|spiegelei|omelett)/.test(p);
  const milk=/(milch|sahne|drink|kaffeesahne)/.test(n)&&!/(shake|reis|schokolade)/.test(n), sweet=/ (zucker|honig|sirup|agavendicksaft) /.test(n);
  const us=unitsFor(food), has=k=>us.some(x=>x.k===k), def=us.find(x=>x.d);
  if(hot&&milk) return {u:"schuss",q:N};
  if(hot&&sweet) return {u:"tl",q:N};
  if(cereal&&milk) return {g:150};
  if((cereal||dairy)&&has("hand")&&!milk) return {u:"hand",q:1};
  if(bread&&/ (butter|margarine|schmalz) /.test(n)) return {g:8*N};
  if(bread&&/ (honig) /.test(n)) return {g:10*N};
  if(bread&&/(marmelade|konfiture|nutella|nougat|erdnussbutter|aufstrich|frischkase|leberwurst|hummus|quark)/.test(n)) return {g:18*N};
  if((bread||eggs)&&def&&def.k==="scheibe") return bread?{g:Math.max(def.g,15)*N}:{u:"scheibe",q:N};
  if(bread&&/avocado/.test(n)) return {g:40*N};
  if(/ salat /.test(p+" ")&&/(dressing|sauce|sosse|vinaigrette)/.test(n)) return {g:30};
  return null;
}
const TE_WATER=/^(wasser|mineralwasser|sprudel|sprudelwasser|leitungswasser|stilles wasser|wasser still|medium wasser)$/;

// ---------- Hauptfunktion ----------
// items: {key,name,brand,emoji,grams,kcal,protein,carbs,fat,sugar,processed,ref,u,q,txt,slot,alts,water,glasses,sp,par}
function smartParse(text){
  const segs=teSegments(text), items=[], miss=[], ign=[];
  let slot=null, anySlot=false;
  const counts=[];   // Anzahl je Teil (für Beläge)
  segs.forEach((seg,si)=>{
    const sp=teSpec(seg.raw);
    if(sp.slot){ slot=sp.slot; anySlot=true; }
    const name=sp.name.join(" ");
    if(!name){ if(sp.qty!=null||sp.unit||sp.wg!=null) miss.push(seg.raw); counts[si]=null; return; }
    if(name.split(" ").every(w=>TE_IGN.has(w))||TE_IGN.has(name)){ ign.push(name); counts[si]=null; return; }
    // Teile, die aus mehreren Essen bestehen („Currywurst Pommes“, „Käsebrot“)
    // Beilage zu Nudeln: „Nudeln mit Bolognese“ meint die Soße, nicht noch einen Teller Spaghetti
    const pIt=seg.par>=0?items.find(it=>it.seg===seg.par):null;
    let name2=name;
    if(pIt&&/(nudel|pasta|spaghetti|penne|fusilli|tagliatelle|makkaroni|reis|gnocchi|spatzle)/.test(teN(pIt.food.name))&&/^(bolognese|bolo|bolognesesosse|bolognese sosse)$/.test(name)) name2="bolognese sosse";
    // Wasser im Porridge ist kein getrunkenes Wasser
    if(pIt&&TE_WATER.test(name)&&/(hafer|porridge|musli|flocken|oats|suppe|reis|nudel)/.test(teN(pIt.food.name))){ ign.push(name); counts[si]=null; return; }
    let list=[{name:name2, sp, par:seg.par}];
    const whole=teFind(name2);
    if(!whole||(whole.how!=="near"&&whole.sc<95)){
      const sub=teSplit(name2);
      if(sub) list=sub.map((nm,i)=>({name:nm, sp:i?Object.assign({},sp,{qty:null,unit:null,wg:null,size:null,little:false,count:null}):sp, par:i?-2:seg.par, top:sub.top&&i>0}));
    }
    list.forEach((x,li)=>{
      const hit=li===0&&list.length===1?whole:teFind(x.name);
      if(!hit){ miss.push(x.name); return; }
      const food=hit.food;
      // Bezug: „mit“ → das Essen davor; bei Brot+Belag aus einem Wort → das Brot
      let parentItem=null;
      if(x.par===-2) parentItem=items[items.length-1]||null;
      else if(x.par>=0) parentItem=items.find(it=>it.seg===x.par)||null;
      const ctx={};
      if(parentItem&&x.sp.qty==null&&!x.sp.unit&&x.sp.wg==null&&!x.sp.little) ctx.rule=teRule(food,parentItem.food,parentItem.count);
      const a=teAmount(food,x.sp,ctx);
      const n=teN(food.name), water=TE_WATER.test(n)||((food.al||[]).some(al=>teN(al)==="mineralwasser")&&n==="wasser");
      const it={key:si+":"+li+":"+x.name, seg:si, name:food.name, brand:food.brand||"", emoji:food.emoji||"🍽️", food, ref:food.id,
        grams:a.grams, u:a.u, q:a.q, txt:a.txt, kcal:+food.kcal||0, protein:+food.protein||0, carbs:+food.carbs||0, fat:+food.fat||0, sugar:+food.sugar||0, processed:!!food.processed,
        slot, alts:hit.alts.map(f=>f.id), altFoods:hit.alts, sp:x.sp, par:parentItem?items.indexOf(parentItem):-1, water,
        count:x.sp.count!=null?x.sp.count:(a.q!=null?a.q:(x.sp.qty!=null&&x.sp.qty<20?x.sp.qty:1))};
      if(water) it.glasses=Math.max(1,Math.round(a.grams/250));
      items.push(it);
    });
  });
  // Mahlzeit-Wörter: Teile vor dem ersten Wort gehören zur gewählten Mahlzeit
  if(!anySlot) items.forEach(it=>it.slot=null);
  return {items, miss, ign, slots:anySlot};
}
// Ein Name aus mehreren Essen? Zuerst „Käsebrot“ (Belag + Brot), dann Wortgruppen, die je genau ein Essen sind.
function teSplit(name){
  const w=name.split(" ");
  if(w.length===1){
    const x=w[0];
    for(const [end,bread] of TE_BREAD){
      if(x.endsWith(end)&&x.length>end.length+1){
        let pre=x.slice(0,-end.length); if(TE_TOP[pre]==null&&pre.endsWith("n")&&TE_TOP[pre.slice(0,-1)]!=null) pre=pre.slice(0,-1);
        if(TE_TOP[pre]!=null){ const r=[bread,TE_TOP[pre]]; r.top=true; return r; }
      }
    }
    return null;
  }
  if(w.length>5) return null;
  const strong=s=>{ if(TE_IGN.has(s)) return true; const q=teQ(TE_SYN[s]?teN(TE_SYN[s]):s); return teLocal(q).some(c=>c.sc>=95); };
  const out=[]; let i=0;
  while(i<w.length){
    let j=w.length;
    while(j>i&&!strong(w.slice(i,j).join(" "))) j--;
    if(j===i) return null;
    const part=w.slice(i,j).join(" "); if(!TE_IGN.has(part)) out.push(part);
    i=j;
  }
  return out.length>=2?out:null;
}
// Ein anderes Lebensmittel für einen erkannten Eintrag (Menge wird neu berechnet)
function teSwap(it, food){
  const parent=it.par>=0?(ui.aiRes||[])[it.par]:null, ctx={};
  if(parent&&it.sp.qty==null&&!it.sp.unit&&it.sp.wg==null&&!it.sp.little) ctx.rule=teRule(food,parent.food,parent.count);
  const a=teAmount(food,it.sp,ctx);
  const alts=[it.food].concat(it.altFoods||[]).filter(f=>f.id!==food.id).slice(0,4);
  Object.assign(it,{name:food.name,brand:food.brand||"",emoji:food.emoji||"🍽️",food,ref:food.id,grams:a.grams,u:a.u,q:a.q,txt:a.txt,
    kcal:+food.kcal||0,protein:+food.protein||0,carbs:+food.carbs||0,fat:+food.fat||0,sugar:+food.sugar||0,processed:!!food.processed,
    alts:alts.map(f=>f.id),altFoods:alts,water:TE_WATER.test(teN(food.name))});
  if(it.water) it.glasses=Math.max(1,Math.round(a.grams/250));
}
// Ursprüngliche Schreibweise eines erkannten Wortes im Text finden („hahnchen“ → „Hähnchen“)
function teOrig(text,norm){
  const words=String(text||"").split(/[\s,;:.!?+&()/]+/).filter(Boolean), want=String(norm||"").split(" ").filter(Boolean);
  const nw=words.map(w=>teN(w));
  for(let i=0;i+want.length<=words.length;i++){ if(want.every((w,j)=>nw[i+j]===w)) return words.slice(i,i+want.length).join(" "); }
  return norm;
}
