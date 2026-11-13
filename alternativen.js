// Life Maxxing – Bessere Alternativen unter einem schlecht bewerteten Lebensmittel.
// Nur aus den Basisdaten der App (vollständige Nährwerte, keine Markenprodukte) und nur innerhalb derselben Art:
// Getränk → Getränk, Süßes → Süßes, Wurst → Fleisch. Lieber gar keine Alternative als eine unpassende.
// Angezeigt wird nur, was für dein Ziel deutlich besser abschneidet und zu deinen Angaben passt (Ernährungsform, meiden, Unverträglichkeiten).

const ALT_MAX=50;          // nur unter Lebensmitteln mit weniger als 50 Punkten („Mäßig“ oder „Schlecht“)
const ALT_MIN=65;          // eine Alternative braucht mindestens 65 Punkte …
const ALT_GAP=15;          // … und mindestens 15 Punkte mehr als das Lebensmittel selbst
// Lebensmittel-Art → passende Alternativen (Namen aus den Basisdaten, in dieser Reihenfolge bei gleichem Score).
// Funktionen bekommen den normalisierten Namen und wählen je nach Produkt (z. B. Pommes → Kartoffeln, Nuggets → Hähnchen).
const ALT_MAP={
  softdrink:h=>/(energy|red bull|monster|mate)/.test(h)?["Kaffee","Tee","Wasser"]:["Wasser","Tee","Cola Zero"],
  nectar:["Wasser","Tee","Apfelschorle"],
  juice:["Wasser","Tee","Apfelschorle"],
  alcohol:["Wasser","Tee"],
  coffeemilk:["Kaffee","Tee"],
  plantmilk:["Milch 1,5 %","Vollmilch"],
  sweets:h=>/(schoko|chocolate|chocolat|praline|riegel|bar\b)/.test(h)?["Zartbitterschokolade","Datteln","Walnüsse","Blaubeeren"]:["Blaubeeren","Erdbeeren","Datteln","Apfel","Zartbitterschokolade"],
  sugar:h=>/(marmelade|konfiture|fruchtaufstrich|confiture|jam|gelee)/.test(h)?["Blaubeeren","Erdbeeren","Himbeeren","Honig"]:["Honig","Datteln"],
  cereal:["Haferflocken","Porridge"],
  proteinbar:["Skyr Natur","Magerquark","Griechischer Joghurt","Mandeln"],
  chips:["Mandeln","Walnüsse","Cashewkerne","Karotte"],
  ricecake:["Mandeln","Walnüsse","Karotte"],
  fastfood:h=>/(pommes|fritten|kroketten|rosti|kartoffelpuffer|reibekuchen|wedges)/.test(h)?["Kartoffeln gekocht","Süßkartoffel","Bratkartoffeln"]
    :/(nugget|chicken|wings|hahnchen|huhn|schnitzel|cordon)/.test(h)?["Hähnchenbrust","Putenbrust"]
    :/(fisch|backfisch)/.test(h)?["Lachsfilet","Kabeljau","Forelle"]
    :/(burger|steak)/.test(h)?["Rindersteak","Hähnchenbrust","Gulasch"]
    :/(doner|kebab|durum|gyros|wrap)/.test(h)?["Hähnchenbrust","Putenbrust","Gulasch"]
    :["Gulasch","Chili con Carne","Hähnchenbrust"],
  // Brühe, Würzpulver und „Fix für …“ sind Zutaten, keine Mahlzeit: dafür keine Alternative
  readymeal:h=>/(bruhe|bouillon|brodo|caldo|=kub|fond|pulver|wurfel|wurze|gewurz| fix |fix fur|basis fur|sauce|sosse|soße)/.test(h.replace(/ kub /," =kub "))?[]:["Gulasch","Chili con Carne","Hühnersuppe","Gemüsesuppe","Linseneintopf"],
  processedmeat:["Putenbrust","Hähnchenbrust","Rindersteak","Ei"],
  ersatz:["Hähnchenbrust","Rindersteak","Ei","Lachsfilet","Linsen gekocht","Kichererbsen"],
  soy:["Ei","Hähnchenbrust","Lachsfilet","Linsen gekocht","Kichererbsen"],
  refined:h=>/(nudel|pasta|spaghetti|penne|fusilli|maccheroni|tortiglioni|farfalle|lasagne|tagliatelle|gnocchi|couscous)/.test(h)?["Kartoffeln gekocht","Reis gekocht","Quinoa gekocht","Süßkartoffel"]
    :/(brot|brotchen|toast|semmel|baguette|wrap|tortilla|bagel|pain|ciabatta|weckle)/.test(h)?["Vollkornbrot","Roggenbrot","Vollkornbrötchen"]:[],
  wholewheat:h=>/(nudel|pasta|spaghetti|penne|fusilli)/.test(h)?["Kartoffeln gekocht","Reis gekocht","Quinoa gekocht","Süßkartoffel"]:[],
  margarine:["Butter","Olivenöl"],
  seedoil:["Olivenöl","Butter"],
  sauce:h=>/(mayo|majo|remoulade|aioli|dressing|vinaigrette|salatsauce|salatcreme)/.test(h)?["Olivenöl","Senf"]:["Tomatensauce","Senf"],
  peanut:["Mandeln","Walnüsse","Cashewkerne"],
  driedfruit:["Blaubeeren","Apfel","Erdbeeren","Banane"],
  dairy:h=>/(milch|drink|shake|kakao|kefir|=latte|getrank)/.test(h)?[]:/(kase|cheese)/.test(h)?["Hüttenkäse","Magerquark","Skyr Natur"]:["Naturjoghurt 1,5 %","Skyr Natur","Magerquark","Griechischer Joghurt"],
  cheese:["Hüttenkäse","Magerquark","Mozzarella"],
  honey:["Blaubeeren","Datteln"]
};
let ALT_BASE=null;   // Basisdaten nach Name (einmal aufbauen)
function altBase(){
  if(!ALT_BASE){ ALT_BASE=new Map(); BASE_FOODS.forEach(f=>{ const k=NORM(f.name); if(!ALT_BASE.has(k)) ALT_BASE.set(k,f); }); }
  return ALT_BASE;
}
// Getränk oder Essen? Getränke bekommen nur Getränke als Alternative, Essen nur Essen.
const ALT_DRINKCAT=new Set(["water","tea","coffee","coffeemilk","juice","vegjuice","nectar","softdrink","alcohol","plantmilk"]);
function altCat(f){ try{ const c=rClassify(f).cat; return c?c.id:null; }catch(e){ return null; } }
function altIsDrink(f,cid){
  if(ALT_DRINKCAT.has(cid)) return true;
  const h=" "+NORM(f.name||"")+" ";
  if(["dairy","kefir","sweets","whey"].includes(cid)) return f.liquid===true||/(milch|drink|shake|getrank|kakao|kefir|ayran|smoothie|latte)/.test(h)&&!/(schokolade|schoko riegel|pulver|reis|brotchen|brot|kase|quark|joghurt|creme|pudding)/.test(h);
  return false;
}
// Alternativen-Kandidaten für ein Lebensmittel (ohne Score-Prüfung)
function altCandidates(item){
  let cat=null; try{ cat=rClassify(item).cat; }catch(e){}
  if(!cat) return [];
  const m=ALT_MAP[cat.id]; if(!m) return [];
  const names=typeof m==="function"?m(" "+NORM(item.name||"")+" "):m;
  const B=altBase(), self=NORM(item.name||""), drink=altIsDrink(item,cat.id);
  return names.map(n=>B.get(NORM(n))).filter(f=>f&&f.id!==item.id&&NORM(f.name)!==self&&altIsDrink(f,altCat(f))===drink);
}
// Passt die Alternative zu den Angaben? (Ernährungsform, meiden, Unverträglichkeit → dann nicht vorschlagen)
function altFits(r){
  if((r.notes||[]).some(t=>!/laktosefrei/i.test(t))) return false;
  if((r.perso||[]).some(x=>/Unverträglichkeit/.test(x.src||""))) return false;
  return true;
}
// Ergebnis: bis zu 3 Alternativen [{f, score}], beste zuerst. Leer, wenn das Lebensmittel gut genug ist oder nichts Passendes da ist.
function altFor(item,sc){
  if(!item||item.type==="sup"||item.type==="care") return [];
  const own=sc?sc.score:scored(item).score;
  if(own==null||!Number.isFinite(+own)||own>=ALT_MAX) return [];
  const out=[];
  altCandidates(item).forEach((f,i)=>{
    let r=null; try{ r=scoreFood(f); }catch(e){}
    if(!r||r.score==null||!Number.isFinite(+r.score)) return;
    if(r.score<ALT_MIN||r.score<own+ALT_GAP||!altFits(r)) return;
    out.push({f,score:r.score,i});
  });
  return out.sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,3);
}
// Karte unter der Bewertung: schlicht, nur bei schlechten Lebensmitteln
function altCard(item,sc){
  const alts=altFor(item,sc); if(!alts.length) return "";
  return `<div class="fcard falt"><b class="fcard-t">Bessere Alternative${alts.length>1?"n":""}</b>
    ${alts.map(a=>`<button class="falt-row" data-act="alt-open" data-id="${esc(a.f.id)}"><span class="falt-emo">${esc(a.f.emoji||"🍽️")}</span><span class="grow falt-nm">${esc(a.f.name)}</span>${scoreChip(a.score)}<span class="falt-go" aria-hidden="true">›</span></button>`).join("")}
  </div>`;
}
