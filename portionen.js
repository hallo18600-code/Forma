// Health Maxxing – Portionsgrößen: Esslöffel, Teller, Scheibe, Glas … statt nur Gramm
// Jedes Lebensmittel bekommt passende Einheiten (aus dem Namen und den Gramm-Angaben der Datenbank).
// Gespeichert wird weiter in Gramm (portion). Zusätzlich merkt sich ein Eintrag Einheit (u) und Anzahl (q) für die Anzeige.

// ---------- Symbole (Strichzeichnungen, Farbe kommt aus dem Text) ----------
const PI_SVG={
  tl:'<ellipse cx="8" cy="8" rx="2.6" ry="3.6" transform="rotate(-45 8 8)"/><path d="M10 10l9 9"/>',
  el:'<ellipse cx="8.5" cy="8.5" rx="4" ry="5.5" transform="rotate(-45 8.5 8.5)"/><path d="M12.5 12.5l7.5 7.5"/>',
  mess:'<path d="M3.5 9h11v2.5a5.5 5.5 0 0 1-11 0z"/><path d="M14.5 10.5h6"/><path d="M6 6.5c.8-1 2-1 3 0s2.2 1 3 0"/>',
  teller:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.2"/>',
  teller_k:'<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="3.6"/>',
  teller_g:'<circle cx="12" cy="12" r="10.5"/><circle cx="12" cy="12" r="6.5"/><path d="M12 9.5v1M10 12h1M14 12h1"/>',
  suppe:'<path d="M3 12h18a9 8 0 0 1-18 0z"/><path d="M9.5 3.5c-1 1.4 1 2.4 0 4M14.5 3.5c-1 1.4 1 2.4 0 4"/>',
  schale:'<path d="M3 11h18a9 8 0 0 1-18 0z"/><path d="M7 8.5c1.5-1.5 3-1.5 5 0s3.5 1.5 5 0"/>',
  schale_g:'<path d="M2 10h20a10 9 0 0 1-20 0z"/><path d="M5.5 7c2-2 4-2 6.5 0s4.5 2 6.5 0"/>',
  schaelchen:'<path d="M6 13h12a6 5.5 0 0 1-12 0z"/><path d="M9 10.5c1-1 2-1 3 0s2 1 3 0"/>',
  portion:'<path d="M3 18.5h18"/><path d="M5 18.5a7 6.5 0 0 1 14 0"/><path d="M12 12v-1"/>',
  tasse:'<path d="M4.5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M15.5 10h1.5a2.5 2.5 0 0 1 0 5h-1.5"/><path d="M8.5 4.5c-.6.8.6 1.4 0 2.2M12 4.5c-.6.8.6 1.4 0 2.2"/>',
  becher:'<path d="M5 6.5h14l-1.6 14H6.6z"/><path d="M4 6.5h16"/><path d="M7.5 10.5h9"/>',
  glas:'<path d="M6 3.5h12l-1.6 17H7.6z"/><path d="M6.8 10.5h10.4"/>',
  glas_g:'<path d="M5 2.5h14l-1.8 19H6.8z"/><path d="M5.8 8.5h12.4"/>',
  flasche:'<path d="M10 2.5h4M10.5 2.5v4L8 10v11h8V10l-2.5-3.5v-4"/><path d="M8 14h8"/>',
  dose:'<rect x="6.5" y="3" width="11" height="18" rx="2"/><path d="M6.5 7h11M6.5 17h11"/>',
  mass:'<path d="M4.5 5h11v15h-11z"/><path d="M15.5 8h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M4.5 9h11"/><path d="M8 12.5v4.5M12 12.5v4.5"/>',
  shot:'<path d="M7.5 7h9l-1.2 12H8.7z"/><path d="M8 11h8"/>',
  schuss:'<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/>',
  hand:'<path d="M3 12.5h14.5l3-2.5"/><path d="M3.5 12.5c.5 4.5 4 7 8.5 7s7.5-2.5 8-6"/><circle cx="8" cy="9.5" r="1.6"/><circle cx="12" cy="8.5" r="1.6"/><circle cx="15" cy="10.3" r="1.2"/>',
  steak:'<path d="M5 9c0-3 3-5 7-5s7 2 7 6-3 9-8 9c-3.5 0-6-2-6-5 0-2 1-3 0-5z"/><circle cx="14" cy="10.5" r="2"/>',
  scheibe:'<path d="M6 20.5V11a4.5 4.5 0 1 1 3-7.9h6A4.5 4.5 0 1 1 18 11v9.5z"/>',
  kaese:'<path d="M3 17V10l16-5 2 5v7z"/><path d="M3 10h18"/><circle cx="9" cy="13.5" r="1.3"/><circle cx="15" cy="14" r="1"/>',
  wurst:'<circle cx="12" cy="12" r="8.5"/><circle cx="9.5" cy="10" r="1"/><circle cx="14.5" cy="9.5" r=".8"/><circle cx="13.5" cy="14.5" r="1"/><circle cx="9" cy="14.5" r=".7"/>',
  stueck:'<circle cx="12" cy="13.5" r="7"/><path d="M12 6.5V4"/><path d="M12.3 5.8c1.4-1.8 3.3-2.3 4.7-2"/>',
  stueck_k:'<circle cx="12" cy="14.5" r="5"/><path d="M12 9.5V7.5"/><path d="M12.2 8.8c1-1.3 2.4-1.6 3.4-1.4"/>',
  stueck_g:'<circle cx="12" cy="13" r="8.5"/><path d="M12 4.5V2.5"/><path d="M12.3 3.8c1.6-2 3.7-2.5 5.3-2.2"/>',
  ei:'<path d="M12 3c3.5 0 6.5 5.5 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8.5 8.5 3 12 3z"/>',
  pizza_st:'<path d="M12 21L3.5 5.5a17 17 0 0 1 17 0z"/><path d="M4.8 8a14 14 0 0 1 14.4 0"/><circle cx="10" cy="11" r="1.2"/><circle cx="14" cy="10.5" r="1.1"/><circle cx="12" cy="15" r="1"/>',
  pizza:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>',
  kugel:'<circle cx="12" cy="8" r="5"/><path d="M7.4 10L12 21l4.6-11"/>',
  stueckchen:'<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M7 12h10M12 7v10"/>',
  reihe:'<rect x="3" y="9" width="18" height="6" rx="1"/><path d="M9 9v6M15 9v6"/>',
  tafel:'<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M5 9h14M5 15h14M12 3v18"/>',
  riegel:'<rect x="2.5" y="8.5" width="19" height="7" rx="3.5"/><path d="M7 8.5v7M17 8.5v7"/>',
  tuete:'<path d="M6 4h12l-1 4 1 12.5H6L7 8z"/><path d="M7 8h10"/>',
  packung:'<path d="M4 8l8-4 8 4v9l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v9"/>',
  keks:'<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="9.5" r="1"/><circle cx="14.5" cy="9" r="1"/><circle cx="15" cy="14.5" r="1"/><circle cx="9.5" cy="15" r="1"/>',
  kuchen:'<path d="M3 19.5h18v-8L5 7.5l-2 4z"/><path d="M3 11.5h18M3 15.5h18"/>',
  zehe:'<path d="M12 3c-3 3-6 6-6 10.5a6 6 0 0 0 12 0C18 9 15 6 12 3z"/><path d="M12 8v11"/>',
  spalte:'<path d="M3 9a9 9 0 0 0 18 0z"/><path d="M5.5 9a6.5 6.5 0 0 0 13 0"/>',
  waage:'<path d="M5 11h14l1 9H4z"/><path d="M7 7.5h10M12 7.5V11"/><circle cx="12" cy="15.5" r="2"/>',
  messbecher:'<path d="M6 4h11l-1 16H7z"/><path d="M17 7h2.5v6H16.6"/><path d="M9 9h3M9 12h3M9 15h3"/>'
};
function pIcon(k){ return `<svg viewBox="0 0 24 24" aria-hidden="true">${PI_SVG[k]||PI_SVG.portion}</svg>`; }

// ---------- Namen der Einheiten: [Einzahl, Mehrzahl, Kurzform] ----------
const UNIT_TXT={
  de:{tl:["Teelöffel","Teelöffel","TL"],el:["Esslöffel","Esslöffel","EL"],mess:["Messlöffel","Messlöffel"],teller_k:["Kleiner Teller","Kleine Teller"],teller:["Teller","Teller"],teller_g:["Großer Teller","Große Teller"],tasse:["Tasse","Tassen"],schuessel:["Schüssel","Schüsseln"],schale:["Schale","Schalen"],schale_g:["Große Schale","Große Schalen"],schaelchen:["Schälchen","Schälchen"],beilage:["Beilage","Beilagen"],portion:["Portion","Portionen"],portion_k:["Kleine Portion","Kleine Portionen"],portion_g:["Große Portion","Große Portionen"],stueck:["Stück","Stück"],stueck_k:["Stück klein","Stück klein"],stueck_g:["Stück groß","Stück groß"],scheibe:["Scheibe","Scheiben"],stueckchen:["Stückchen","Stückchen"],reihe:["Reihe","Reihen"],tafel:["Tafel","Tafeln"],riegel:["Riegel","Riegel"],hand:["Handvoll","Handvoll"],handflaeche:["Handfläche","Handflächen"],tuete:["Tüte","Tüten"],packung:["Packung","Packungen"],becher:["Becher","Becher"],glas:["Glas","Gläser"],glas_g:["Großes Glas","Große Gläser"],flasche:["Flasche","Flaschen"],flasche_g:["Große Flasche","Große Flaschen"],dose:["Dose","Dosen"],schuss:["Schuss","Schuss"],kugel:["Kugel","Kugeln"],pizza:["Ganze Pizza","Ganze Pizzen"],mass:["Maß","Maß"],shot:["Schnapsglas","Schnapsgläser"],zehe:["Zehe","Zehen"],spalte:["Spalte","Spalten"],g:["Gramm","Gramm","g"],ml:["Milliliter","Milliliter","ml"]},
  en:{tl:["Teaspoon","Teaspoons","tsp"],el:["Tablespoon","Tablespoons","tbsp"],mess:["Scoop","Scoops"],teller_k:["Small plate","Small plates"],teller:["Plate","Plates"],teller_g:["Large plate","Large plates"],tasse:["Cup","Cups"],schuessel:["Deep bowl","Deep bowls"],schale:["Bowl","Bowls"],schale_g:["Large bowl","Large bowls"],schaelchen:["Small bowl","Small bowls"],beilage:["Side","Sides"],portion:["Serving","Servings"],portion_k:["Small serving","Small servings"],portion_g:["Large serving","Large servings"],stueck:["Piece","Pieces"],stueck_k:["Small piece","Small pieces"],stueck_g:["Large piece","Large pieces"],scheibe:["Slice","Slices"],stueckchen:["Square","Squares"],reihe:["Row","Rows"],tafel:["Bar","Bars"],riegel:["Bar","Bars"],hand:["Handful","Handfuls"],handflaeche:["Palm-sized","Palm-sized"],tuete:["Bag","Bags"],packung:["Pack","Packs"],becher:["Pot","Pots"],glas:["Glass","Glasses"],glas_g:["Large glass","Large glasses"],flasche:["Bottle","Bottles"],flasche_g:["Large bottle","Large bottles"],dose:["Can","Cans"],schuss:["Splash","Splashes"],kugel:["Scoop","Scoops"],pizza:["Whole pizza","Whole pizzas"],mass:["Litre mug","Litre mugs"],shot:["Shot","Shots"],zehe:["Clove","Cloves"],spalte:["Wedge","Wedges"],g:["Grams","Grams","g"],ml:["Millilitres","Millilitres","ml"]},
  fr:{tl:["Cuillère à café","Cuillères à café","c. à c."],el:["Cuillère à soupe","Cuillères à soupe","c. à s."],mess:["Mesurette","Mesurettes"],teller_k:["Petite assiette","Petites assiettes"],teller:["Assiette","Assiettes"],teller_g:["Grande assiette","Grandes assiettes"],tasse:["Tasse","Tasses"],schuessel:["Grand bol","Grands bols"],schale:["Bol","Bols"],schale_g:["Grand bol","Grands bols"],schaelchen:["Petit bol","Petits bols"],beilage:["Accompagnement","Accompagnements"],portion:["Portion","Portions"],portion_k:["Petite portion","Petites portions"],portion_g:["Grande portion","Grandes portions"],stueck:["Pièce","Pièces"],stueck_k:["Petite pièce","Petites pièces"],stueck_g:["Grosse pièce","Grosses pièces"],scheibe:["Tranche","Tranches"],stueckchen:["Carré","Carrés"],reihe:["Rangée","Rangées"],tafel:["Tablette","Tablettes"],riegel:["Barre","Barres"],hand:["Poignée","Poignées"],handflaeche:["Paume","Paumes"],tuete:["Sachet","Sachets"],packung:["Paquet","Paquets"],becher:["Pot","Pots"],glas:["Verre","Verres"],glas_g:["Grand verre","Grands verres"],flasche:["Bouteille","Bouteilles"],flasche_g:["Grande bouteille","Grandes bouteilles"],dose:["Canette","Canettes"],schuss:["Trait","Traits"],kugel:["Boule","Boules"],pizza:["Pizza entière","Pizzas entières"],mass:["Chope d’un litre","Chopes d’un litre"],shot:["Shot","Shots"],zehe:["Gousse","Gousses"],spalte:["Quartier","Quartiers"],g:["Grammes","Grammes","g"],ml:["Millilitres","Millilitres","ml"]},
  es:{tl:["Cucharadita","Cucharaditas","cdta."],el:["Cucharada","Cucharadas","cda."],mess:["Cacito","Cacitos"],teller_k:["Plato pequeño","Platos pequeños"],teller:["Plato","Platos"],teller_g:["Plato grande","Platos grandes"],tasse:["Taza","Tazas"],schuessel:["Cuenco grande","Cuencos grandes"],schale:["Cuenco","Cuencos"],schale_g:["Cuenco grande","Cuencos grandes"],schaelchen:["Cuenquito","Cuenquitos"],beilage:["Guarnición","Guarniciones"],portion:["Ración","Raciones"],portion_k:["Ración pequeña","Raciones pequeñas"],portion_g:["Ración grande","Raciones grandes"],stueck:["Pieza","Piezas"],stueck_k:["Pieza pequeña","Piezas pequeñas"],stueck_g:["Pieza grande","Piezas grandes"],scheibe:["Rebanada","Rebanadas"],stueckchen:["Onza","Onzas"],reihe:["Fila","Filas"],tafel:["Tableta","Tabletas"],riegel:["Barrita","Barritas"],hand:["Puñado","Puñados"],handflaeche:["Palma","Palmas"],tuete:["Bolsa","Bolsas"],packung:["Paquete","Paquetes"],becher:["Tarrina","Tarrinas"],glas:["Vaso","Vasos"],glas_g:["Vaso grande","Vasos grandes"],flasche:["Botella","Botellas"],flasche_g:["Botella grande","Botellas grandes"],dose:["Lata","Latas"],schuss:["Chorrito","Chorritos"],kugel:["Bola","Bolas"],pizza:["Pizza entera","Pizzas enteras"],mass:["Jarra de litro","Jarras de litro"],shot:["Chupito","Chupitos"],zehe:["Diente","Dientes"],spalte:["Gajo","Gajos"],g:["Gramos","Gramos","g"],ml:["Mililitros","Mililitros","ml"]},
  it:{tl:["Cucchiaino","Cucchiaini"],el:["Cucchiaio","Cucchiai"],mess:["Misurino","Misurini"],teller_k:["Piatto piccolo","Piatti piccoli"],teller:["Piatto","Piatti"],teller_g:["Piatto grande","Piatti grandi"],tasse:["Tazza","Tazze"],schuessel:["Ciotola grande","Ciotole grandi"],schale:["Ciotola","Ciotole"],schale_g:["Ciotola grande","Ciotole grandi"],schaelchen:["Ciotolina","Ciotoline"],beilage:["Contorno","Contorni"],portion:["Porzione","Porzioni"],portion_k:["Porzione piccola","Porzioni piccole"],portion_g:["Porzione grande","Porzioni grandi"],stueck:["Pezzo","Pezzi"],stueck_k:["Pezzo piccolo","Pezzi piccoli"],stueck_g:["Pezzo grande","Pezzi grandi"],scheibe:["Fetta","Fette"],stueckchen:["Quadratino","Quadratini"],reihe:["Fila","File"],tafel:["Tavoletta","Tavolette"],riegel:["Barretta","Barrette"],hand:["Manciata","Manciate"],handflaeche:["Palmo","Palmi"],tuete:["Sacchetto","Sacchetti"],packung:["Confezione","Confezioni"],becher:["Vasetto","Vasetti"],glas:["Bicchiere","Bicchieri"],glas_g:["Bicchiere grande","Bicchieri grandi"],flasche:["Bottiglia","Bottiglie"],flasche_g:["Bottiglia grande","Bottiglie grandi"],dose:["Lattina","Lattine"],schuss:["Goccio","Gocci"],kugel:["Pallina","Palline"],pizza:["Pizza intera","Pizze intere"],mass:["Boccale da litro","Boccali da litro"],shot:["Bicchierino","Bicchierini"],zehe:["Spicchio","Spicchi"],spalte:["Spicchio","Spicchi"],g:["Grammi","Grammi","g"],ml:["Millilitri","Millilitri","ml"]},
  nl:{tl:["Theelepel","Theelepels","tl"],el:["Eetlepel","Eetlepels","el"],mess:["Maatschepje","Maatschepjes"],teller_k:["Klein bord","Kleine borden"],teller:["Bord","Borden"],teller_g:["Groot bord","Grote borden"],tasse:["Kop","Koppen"],schuessel:["Grote kom","Grote kommen"],schale:["Kom","Kommen"],schale_g:["Grote kom","Grote kommen"],schaelchen:["Schaaltje","Schaaltjes"],beilage:["Bijgerecht","Bijgerechten"],portion:["Portie","Porties"],portion_k:["Kleine portie","Kleine porties"],portion_g:["Grote portie","Grote porties"],stueck:["Stuk","Stuks"],stueck_k:["Klein stuk","Kleine stukken"],stueck_g:["Groot stuk","Grote stukken"],scheibe:["Plak","Plakken"],stueckchen:["Blokje","Blokjes"],reihe:["Rij","Rijen"],tafel:["Reep","Repen"],riegel:["Reepje","Reepjes"],hand:["Handje","Handjes"],handflaeche:["Handpalm","Handpalmen"],tuete:["Zak","Zakken"],packung:["Pak","Pakken"],becher:["Beker","Bekers"],glas:["Glas","Glazen"],glas_g:["Groot glas","Grote glazen"],flasche:["Fles","Flessen"],flasche_g:["Grote fles","Grote flessen"],dose:["Blikje","Blikjes"],schuss:["Scheutje","Scheutjes"],kugel:["Bol","Bollen"],pizza:["Hele pizza","Hele pizza’s"],mass:["Literpul","Literpullen"],shot:["Shotje","Shotjes"],zehe:["Teentje","Teentjes"],spalte:["Partje","Partjes"],g:["Gram","Gram","g"],ml:["Milliliter","Milliliter","ml"]}
};
// Name einer Einheit in der App-Sprache. q = Anzahl (für Mehrzahl), short = Kurzform (EL, TL, g) wenn vorhanden
function uName(k,q,short){
  const T=(UNIT_TXT[typeof LANG!=="undefined"?LANG:"de"]||UNIT_TXT.de), v=T[k]||UNIT_TXT.de[k]||[k,k];
  if(short&&v[2]) return v[2];
  return q!=null&&q>1?v[1]:v[0];
}
// 0.5 → ½, 1.5 → 1½
function qtyTxt(q){ q=Math.round(q*2)/2; const w=Math.floor(q); return q%1?(w?w+"½":"½"):String(w); }

// ---------- Welche Einheiten passen zu welchem Lebensmittel? ----------
// Eintrag: [Schlüssel, Gramm, Symbol (optional), Standard (1 = wird beim Öffnen vorgewählt)]
const P_FRUIT={apfel:180,birne:170,orange:150,mandarine:80,clementine:80,kiwi:75,pfirsich:150,nektarine:150,aprikose:40,pflaume:35,zwetschge:35,grapefruit:300,zitrone:100,limette:60,feige:50,granatapfel:250,mango:250,papaya:400,banane:120};
const P_VEG={gewurzgurke:40,tomate:100,gurke:300,paprika:150,karotte:80,mohre:80,zucchini:250,aubergine:250,zwiebel:80,kartoffel:90,susskartoffel:200,avocado:150,kohlrabi:250,fenchel:250,radieschen:10,champignon:20};
// Muster werden wie die Namen normalisiert (ü→u, ue→u …), damit z. B. „Sauerkraut“ (→ „saurkraut“) gefunden wird
const P_RE=new Map();
function pRe(re){ let r=P_RE.get(re.source); if(!r){ r=new RegExp(NORM(re.source)); P_RE.set(re.source,r); } return r; }
function unitsFor(it){
  if(!it||!(it.type==="food"||it.type==="custom")) return [];
  const t=" "+NORM(it.name+" "+((it.al||[]).join(" "))).replace(/[-_/,.()]+/g," ")+" ";
  const nm=" "+NORM(it.name)+" ", has=re=>pRe(re).test(t), hasN=re=>pRe(re).test(nm), kc=+it.kcal||0, pw=+it.pieceG||0, sw=+it.sliceG||0;
  const R=Math.round, word=tab=>{ for(const k in tab){ if(t.includes(k)) return tab[k]; } return 0; };
  let u=null, ml=false;
  const plates=T=>[["teller_k",R(T*.6),"teller_k"],["teller",T,"teller",1],["teller_g",R(T*1.4),"teller_g"]];
  const pieces=(p,ic)=>[["stueck_k",R(p*.7),"stueck_k"],["stueck",p,ic||"stueck",1],["stueck_g",R(p*1.3),"stueck_g"]];
  const drinkRe=/ (wasser|water|eau|mineralwasser|sprudel|cola|limo|limonade|fanta|sprite|eistee|ice tea|saft|juice|jus|nektar|schorle|smoothie|kaffee|coffee|espresso|cappuccino|latte|macchiato|flat white|tee|tea|milch|milk|lait|kakao|trinkschokolade|kefir|buttermilch|ayran|lassi|bier|beer|pils|radler|weizen|wein|wine|sekt|prosecco|champagner|energy|red bull|mate|kombucha|shake|getrank|cider|limonata) |drink|saft |milch |wasser /;
  // 0. Supplements: Kreatin im Messlöffel, Kapseln & Tabletten als Stück
  if(has(/kreatin|creatin/)&&kc<100) u=[["mess",5,"mess",1],["tl",4]];
  else if(has(/kapsel|tablette|softgel|brausetabl|dragee/)) u=[["stueck",1,"stueck",1]];
  // 1. Pulver und Fette
  else if(has(/protein ?pulver|whey|eiweiss ?pulver|casein|kollagen|protein powder/)) u=[["mess",30,"mess",1],["tl",3],["el",8]];
  else if(has(/pulver|poudre|powder|gewurz|zimt/)) u=[["tl",4,"tl",1],["el",10]];
  else if(kc>=700&&has(/ ol |olivenol|rapsol|sonnenblumenol|kokosol|leinol|sesamol|walnussol|bratol|kurbiskernol|speiseol| oil |huile|ghee /)) u=[["tl",4],["el",10,"el",1]];
  else if(has(/^ (zucker|puderzucker|rohrzucker|brauner zucker|vanillezucker|kokosblutenzucker|erythrit|xylit|birkenzucker|sugar|sucre)/)) u=[["tl",4,"tl",1],["el",12]];
  else if(has(/chips|crisps|pringles|flips|salzstangen|cracker|nachos|snack|knabber|brezeln /)) u=[["hand",20,"hand",1],["schale",50,"schale"],["tuete",150,"tuete"]];
  // 2. Soßen, Dips, Senf
  else if(has(/pesto/)) u=[["tl",6],["el",15,"el",1],["portion",50,"schaelchen"]];
  else if(kc<150&&has(/tomatensauce|tomatensosse|sauce tomate|tomato sauce|sauce basilic|passata|pastasauce|pastasosse|sugo|napoli|arrabbiata|bratensosse|bratensauce|rahmsosse|gravy/)) u=[["el",15],["portion",125,"schaelchen",1]];
  else if(kc<300&&has(/soja ?sauce|soja ?sosse|sojasauce|worcester|tabasco|sriracha|fischsauce|teriyaki|essig|balsamico|vinegar|tomatenmark|tubenmark/)) u=[["tl",6,"tl",1],["el",16]];
  else if(has(/ketchup|mayo|remoulade|senf|moutarde|mustard|dressing|aioli|barbecue|bbq|salsa|tzatziki| dip |sosse|sauce|hummus|guacamole|ajvar/)) u=[["tl",6],["el",15,"el",1],["schaelchen",50,"schaelchen"]];
  // 3. Honig, Aufstriche, Butter
  else if(kc<400&&has(/ (honig|honey|miel|sirup|sirop|ahornsirup|agavendicksaft|dattelsirup|melasse|reissirup) /)) u=[["tl",7,"tl",1],["el",20]];
  else if(has(/marmelade|konfiture|confiture|philadelphia|fruchtaufstrich|gelee |nutella|nuss ?nougat|schoko ?creme|nougatcreme|aufstrich|erdnussbutter|erdnusscreme|peanut butter|mandelmus|nussmus|cashewmus|tahin|frischkase|streichkase|teewurst|mettwurst|schmelzkase|apfelkraut|rubenkraut/)) u=[["tl",7,"tl",1],["el",18]];
  else if(kc>=450&&has(/ (butter|margarine|halbfettbutter|krauterbutter|schmalz|pflanzenfett|beurre) /)) u=[["tl",5,"tl",1],["el",12]];
  // 4. Suppen, Pizza, Gerichte
  else if(has(/suppe|bruhe|bouillon|consomme|gazpacho| soup | soupe /)) u=kc>150?[["tl",5,"tl",1],["el",12]]:[["tasse",250,"tasse"],["teller",pw>=250?pw:300,"suppe",1],["schuessel",450,"suppe"]];
  else if(has(/pizza|flammkuchen/)){ const w=pw||350; u=[["stueck",R(w/8),"pizza_st"],["pizza",w,"pizza",1]]; }
  else if(!has(/beyond|patty|patties|veggie|vegan/)&&has(/doner|kebab|durum|burger|wrap|burrito|sandwich|hot ?dog|bagel|panini|quesadilla|falafeltasche/)) u=[["stueck",pw||250,"steak",1]];
  else if(has(/currywurst/)) u=[["portion",pw||250,"portion",1]];
  else if(has(/kartoffelsalat|nudelsalat|reissalat|krautsalat|coleslaw|tabouleh|couscoussalat/)) u=[["el",25],["beilage",150,"schale",1],["teller",300,"teller"]];
  else if(kc<300&&has(/bolognese|carbonara|lasagne|gulasch|chili con|chili sin|eintopf|curry|risotto|auflauf|paella|gratin|ragout|geschnetzel|frikassee|griechischer salat|bowl|nasi|bami|pad thai|ramen|kaiserschmarrn|spatzle|maultasche|gnocchi|ravioli|tortellini|moussaka|shakshuka|pfanne|knodel|gyros|tacos|sushi|fajita|chili|stroganoff|rouladen|braten mit|mit sosse|nudeln mit|reis mit|pasta mit/)) u=plates(pw>=250?pw:400);
  // 5. Süßes, Frühstücksflocken, Knabberzeug
  else if(has(/riegel|snickers|twix| mars |bounty|kitkat|kinder bueno|duplo|hanuta|corny| bar /)) u=[["riegel",pw||40,"riegel",1]];
  else if(has(/kuchen|torte|muffin|brownie|donut|berliner|krapfen|plunder|schnecke|strudel|tarte|cheesecake|waffel |crepe/)&&!has(/reibekuchen|kartoffelpuffer/)) u=[["stueck",sw||pw||80,has(/donut|muffin|berliner|krapfen|waffel|crepe|pfannkuchen/)?"keks":"kuchen",1]];
  else if(has(/keks|cookie|platzchen|zwieback|waffel|biskuit|oreo|leibniz|prinzen|lebkuchen|spekulatius|reiswaffel|maiswaffel/)) u=[["stueck",sw||pw||10,"keks",1],["packung",sw||pw?R((sw||pw)*15):150,"packung"]];
  else if(has(/pudding|mousse|panna cotta|griesbrei|gries |milchreis|dessert|tiramisu|creme brulee/)) u=[["el",20],["becher",pw||125,"becher",1],["schale",200,"schale"]];
  else if(has(/ eis |eiscreme|speiseeis|gelato|sorbet|magnum|cornetto|stieleis|ice cream/)) u=[["kugel",pw||50,"kugel",1],["becher",150,"becher"]];
  else if(has(/porridge|haferbrei|overnight oats/)) u=[["schale",pw||250,"schale",1]];
  else if(kc>200&&has(/hafer|flocken|musli|granola|cornflakes|crunchy|knusper|cerealien|cereal|oats|smacks|loops|pops /)) u=[["el",10],["schale",50,"schale",1],["schale_g",80,"schale_g"]];
  else if(kc>=350&&has(/schoko|chocolate|chocolat|zartbitter|vollmilch|praline|ritter sport|milka|lindt|toblerone|cacao|noir |dark /)) u=[["stueckchen",5,"stueckchen"],["reihe",20,"reihe",1],["tafel",100,"tafel"]];
  else if(has(/gummi|fruchtgummi|bonbon|lakritz|weingummi|marshmallow|haribo|lutscher|smarties|m&m|kaubonbon/)) u=[["stueck",3,"stueckchen"],["hand",25,"hand",1],["tuete",200,"tuete"]];
  else if(has(/popcorn/)) u=[["hand",8,"hand"],["schale",30,"schale",1],["tuete",90,"tuete"]];
  // 6. Eier, Käse, Wurst, Fleisch, Fisch
  else if(has(/ruhrei|omelett|scrambled/)) u=[["el",20],["portion",pw||120,"portion",1]];
  else if(has(/ (ei|eier|egg|eggs|oeuf|oeufs) |spiegelei|fruhstucksei|bio eier/)) u=[["stueck",pw||60,"ei",1]];
  else if(has(/salami|schinken|mortadella|lyoner|fleischwurst|leberkase|bierschinken|aufschnitt|pastrami|bresaola|chorizo|corned|kassler|speck|bacon|bierwurst|jagdwurst|gelbwurst|leberwurst|blutwurst|presssack|serrano|prosciutto/)) u=[["scheibe",sw||(has(/salami|chorizo/)?6:has(/speck|bacon/)?8:15),"wurst",1]];
  else if(has(/mozzarella|burrata/)) u=[["scheibe",25,"kaese"],["stueck",pw||125,"stueck",1]];
  else if(has(/parmesan|grana padano|pecorino|reibekase|gerieben/)) u=[["el",6,"el",1],["hand",30,"hand"]];
  else if(!has(/drink|trink/)&&has(/huttenkase|cottage|ricotta|mascarpone|quark|skyr|joghurt|jogurt|yogurt|yaourt|schmand|creme fraiche|saure sahne|sauerrahm/)){
    const cup=pw||(has(/quark|mascarpone|ricotta/)?250:150);
    u=[["el",20,"el"],["schale",150,"schale",pw?0:1],["becher",cup,"becher",pw?1:0]];
  }
  else if(has(/sahne|cream |kaffeesahne|kondensmilch/)) u=[["tl",5],["el",15,"el",1],["becher",200,"becher"]];
  else if(has(/feta|halloumi|hirtenkase|schafskase/)) u=[["portion",50,"kaese",1],["packung",200,"packung"]];
  else if(has(/camembert|brie/)) u=[["stueck",30,"kaese",1],["packung",125,"packung"]];
  else if(has(/kase|gouda|emmentaler|edamer|cheddar|bergkase|tilsiter|butterkase|leerdammer|maasdamer|raclette|gorgonzola|manchego|cheese|fromage/)) u=[["scheibe",sw||25,"kaese",1],["stueck",50,"kaese"],["hand",30,"hand"]];
  else if(has(/hack|gehacktes|mett |tatar/)) u=[["el",20],["portion",125,"steak",1],["packung",400,"packung"]];
  else if(has(/garnele|shrimp|scampi|krabbe|gambas|muschel/)) u=[["stueck",12,"stueck"],["portion",125,"portion",1]];
  else if(has(/thunfisch|tuna|sardine|makrele in|hering in|fisch in/)&&kc<300) u=[["el",20],["dose",140,"dose",1]];
  else if(has(/nugget|frikadelle|bulette|cevapcici|fischstabchen|bratwurst|wurstchen|wiener|frankfurter|krakauer|knacker|falafel|bratling|burger|patty|patties/)) u=[["stueck",pw||(has(/nugget/)?20:has(/burger|patty|patties/)?110:has(/frikadelle|bulette|bratling/)?80:has(/cevapcici/)?25:has(/falafel/)?17:has(/fischstabchen/)?28:has(/bratwurst/)?100:50),"wurst",1]];
  else if(has(/tofu|seitan|tempeh/)) u=[["scheibe",50,"stueckchen"],["portion",100,"portion",1],["packung",200,"packung"]];
  else if(has(/hahnchen|huhn|chicken|pute|truthahn|rind|kalb|schwein|lamm|steak|schnitzel|filet|braten|kotelett|keule|schenkel|lachs|salmon|fisch|forelle|kabeljau|seelachs|hering|makrele|dorade|zander|tilapia|pangasius| ente | gans|hirsch| reh|leber|gyros|pulled|geflugel|fleisch/)) u=[["handflaeche",100,"steak"],["stueck",pw||150,"steak",1]];
  // 7. Getränke (Milliliter statt Gramm)
  else if(has(/whisky|whiskey|wodka|vodka| rum |gin |likor|schnaps| korn |tequila|obstler|grappa|ouzo|jagermeister/)){ ml=true; u=[["shot",20,"shot",1],["glas",40,"glas"]]; }
  else if(kc<=120&&has(drinkRe)){
    ml=true;
    if(hasN(/espresso/)) u=[["tasse",30,"tasse",1]];
    else if(has(/kaffee|coffee|cappuccino|latte|macchiato|flat white| tee |tea |kakao|trinkschokolade/)) u=[["tasse",pw||200,"tasse",1],["becher",300,"becher"]];
    else if(has(/bier|beer|pils|radler|weizen/)) u=[["glas",300,"glas"],["flasche",pw||500,"flasche",1],["mass",1000,"mass"]];
    else if(has(/wein|wine|rose|sekt|prosecco|champagner/)) u=[["glas",has(/sekt|prosecco|champagner/)?100:150,"glas",1],["flasche",750,"flasche"]];
    else if(has(/wasser|water|eau|sprudel/)) u=[["glas",250,"glas",1],["flasche",500,"flasche"],["flasche_g",1500,"flasche"]];
    else if(has(/cola|limo|fanta|sprite|eistee|ice tea|energy|red bull|mate|kombucha/)) u=[["glas",200,"glas",pw?0:1],["dose",pw||330,"dose",pw?1:0],["flasche",500,"flasche"]];
    else if(has(/milch|milk|lait|drink|kefir|buttermilch|ayran/)) u=[["schuss",30,"schuss"],["glas",200,"glas",1],["glas_g",300,"glas_g"]];
    else u=[["glas",pw||200,"glas",1],["glas_g",300,"glas_g"],["flasche",1000,"flasche"]];
  }
  // 8. Brot und Backwaren
  else if(has(/brot|toast|brotchen|semmel|weckle|schrippe|baguette|ciabatta|knackebrot|pumpernickel|brezel|laugen|croissant|fladenbrot|tortilla|naan|pita|bread|pain |zwieback/)){
    if(sw) u=[["scheibe",sw,"scheibe",1]];
    else if(has(/knackebrot|knacke|crispbread/)) u=[["scheibe",10,"scheibe",1]];
    else if(pw||has(/brotchen|semmel|weckle|schrippe|croissant|brezel|laugen|tortilla|naan|pita/)) u=[["stueck",pw||60,"scheibe",1]];
    else u=[["scheibe",45,"scheibe",1]];
  }
  // 9. Beilagen: Reis, Nudeln, Kartoffeln, Hülsenfrüchte
  else if(has(/pommes|wedges|kroketten|fries/)) u=[["portion_k",100,"portion"],["portion",pw||150,"portion",1],["portion_g",220,"portion"]];
  else if(has(/linsen|kichererbsen|bohnen|kidney|erbsen|edamame|mais |lentil|beans/)) u=kc>250?[["el",15],["portion",60,"portion",1]]:[["el",20],["beilage",150,"schale",1],["dose",240,"dose"]];
  else if(has(/kartoffel|potato|puree|kartoffelbrei|bratkartoffel|rosti|reibekuchen|kartoffelpuffer/)&&!has(/susskartoffel/)&&kc<250) u=pw?[["stueck",pw,"stueck"],["beilage",R(pw*2),"portion",1],["teller",300,"teller"]]:[["el",25],["beilage",200,"portion",1],["teller",300,"teller"]];
  else if(has(/reis|rice|nudel|pasta|spaghetti|penne|fusilli|farfalle|tagliatelle|makkaroni|maccheroni|couscous|bulgur|quinoa|hirse|polenta|buchweizen|noodle/)){
    // Mehr als 250 kcal je 100 g heißt fast immer: trocken/ungekocht
    u=kc>250?[["el",15],["portion",100,"portion",1],["portion_g",150,"portion"]]:[["el",25],["beilage",150,"portion",1],["teller",pw>=250?pw:300,"teller"]];
  }
  // 10. Nüsse, Kerne, Trockenobst
  else if(has(/datteln|feigen getrocknet|aprikosen getrocknet|pflaumen getrocknet/)) u=[["stueck",pw||8,"stueck",1],["hand",30,"hand"]];
  else if(has(/rosinen|sultaninen|cranberries|trockenfrucht|trockenobst|getrocknet/)) u=[["el",10],["hand",30,"hand",1]];
  else if(kc>=350&&has(/nuss|nusse|nusskern|mandel|cashew|pistazie|erdnuss|macadamia|pekan|studentenfutter|nuts |almond/)) u=[["el",10],["hand",30,"hand",1],["schale",60,"schale"]];
  else if(has(/chia|leinsamen|sesam|sonnenblumenkerne|kurbiskerne|hanfsamen|flohsamen|kerne |samen /)) u=[["tl",4],["el",10,"el",1],["hand",30,"hand"]];
  // 11. Obst
  else if(has(/apfelmus|kompott|mus /)) u=[["el",20],["schale",125,"schale",1]];
  else if(kc<150&&has(/beere|traube|kirsche|johannisbeer|berries|grapes|cherries/)) u=[["hand",60,"hand"],["schale",150,"schale",1],["packung",250,"packung"]];
  else if(has(/melone|ananas|pineapple|melon/)) u=[["spalte",has(/wassermelone/)?250:150,"spalte",1],["schale",150,"schale"]];
  else if(kc<150&&has(/apfel|banane|birne|orange|mandarine|clementine|kiwi|pfirsich|nektarine|aprikose|pflaume|zwetschge|mango|grapefruit|zitrone|limette|feige|granatapfel|papaya|apple|banana|pear/)) u=[...pieces(pw||word(P_FRUIT)||120),["schale",150,"schale"]];
  // 12. Gemüse
  else if(has(/knoblauch|garlic/)) u=[["zehe",4,"zehe",1]];
  else if(has(/oliven|olive|azeitona/)) u=[["stueck",4,"stueckchen"],["hand",40,"hand",1]];
  else if(has(/avocado/)) u=[["el",15],["stueck",pw||150,"stueck",1]];
  else if(kc<150&&has(/tomate|gurke|paprika|karotte|mohre|mohrrube|zucchini|aubergine|zwiebel|susskartoffel|kohlrabi|fenchel/)) u=[...pieces(pw||word(P_VEG)||100),["hand",50,"hand"]];
  else if(kc<150&&has(/ salat |salate |kopfsalat|rucola|feldsalat|spinat|blattsalat|eisberg|lettuce|spinach/)) u=[["hand",30,"hand"],["schale",100,"schale",1],["teller",200,"teller"]];
  else if(has(/brokkoli|broccoli|blumenkohl|champignon|pilz|kurbis|rote bete|sauerkraut|kohl|spargel|lauch|porree|sellerie|radieschen|rettich|bohnen grun|okra|pak choi|sprossen|gemuse|vegetable/)) u=[["hand",50,"hand"],["beilage",150,"schale",1],["teller",250,"teller"]];
  // 13. Sonst: was die Datenbank weiß
  if(!u&&pw) u=[["stueck",pw,"stueck",1]];
  if(!u&&sw) u=[["scheibe",sw,"scheibe",1]];
  if(!u) u=[["el",15],["portion",100,"portion"]];
  const out=u.filter(x=>x&&x[1]>0).map(([k,g,ic,d])=>({k,g:Math.max(1,R(g)),ic:ic||k,d:!!d}));
  out.push({k:"g",g:1,ic:ml?"messbecher":"waage",ml});
  return out;
}
// Gramm-Einheit (heißt bei Getränken „ml“)
function gName(us,q,short){ const g=us.find(x=>x.k==="g"); return uName(g&&g.ml?"ml":"g",q,short); }
// Text für Tagebuch-Zeilen: „2 EL · 30 g“ oder „150 g“
function amtTxt(p,m){
  const us=unitsFor(p), gu=gName(us,null,true), u=m.u&&us.find(x=>x.k===m.u);
  const g=`${Math.round(m.portion)} ${gu}`;
  return u?`${qtyTxt(m.q||1)} ${uName(u.k,m.q||1,true)} · ${g}`:g;
}

// ---------- Mengen-Auswahl im Lebensmittel-Blatt ----------
// Beim ersten Anzeigen eines Lebensmittels: Standard-Einheit wählen (bzw. die gespeicherte beim Bearbeiten)
function amtInit(it){
  const key=it.id+"|"+(ui.editUid||"");
  if(ui.amtFor===key) return;
  ui.amtFor=key; ui.lastUnit=null; ui.lastQty=null;
  const us=unitsFor(it), m=ui.editUid&&day().meals.find(x=>x.uid===ui.editUid);
  if(m){
    const u=m.u&&us.find(x=>x.k===m.u);
    ui.unit=u?u.k:"g"; ui.qty=u?(m.q||1):null; ui.portion=m.portion; return;
  }
  const d=us.find(x=>x.d);
  if(d){ ui.unit=d.k; ui.qty=1; ui.portion=d.g; }
  else { ui.unit="g"; ui.qty=null; ui.portion=100; }
}
function amtUnit(it){ const us=unitsFor(it); return us.find(x=>x.k===ui.unit)||us[us.length-1]; }
// Zugeklappte Leiste: Menge auf einen Blick, Umschalter Einheit ↔ Gramm, bei Gramm direkt eintippen
const CHEV_DOWN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"/></svg>';
function amtAlt(it){ const us=unitsFor(it); return us.find(x=>x.k===ui.lastUnit)||us.find(x=>x.d)||us[0]; }
function amtCompact(it){
  const us=unitsFor(it), u=amtUnit(it), g=Math.round(ui.portion||0), kc=Math.round((it.kcal||0)*g/100), gu=gName(us,null,true), isG=u.k==="g";
  const alt=isG?amtAlt(it):u;
  const main=isG
    ? `<label class="amt-main"><i class="amt-ci">${pIcon(u.ic)}</i><span class="amt-txt"><span class="amt-in"><input id="portion-c" type="number" inputmode="decimal" value="${g}" data-act="portion-in" data-id="${it.id}" aria-label="Menge"><em class="notr">${gu}</em></span><span class="amt-sum notr" id="amt-sum">${kc} kcal</span></span></label>`
    : `<button class="amt-main" data-act="amt-open"><i class="amt-ci">${pIcon(u.ic)}</i><span class="amt-txt"><b id="amt-val" class="notr">${esc(qtyTxt(ui.qty||1)+" "+uName(u.k,ui.qty||1))}</b><span class="amt-sum notr" id="amt-sum">${g} ${gu} · ${kc} kcal</span></span></button>`;
  const seg=alt&&alt.k!=="g"?`<div class="amt-seg notr" role="group" aria-label="Einheit"><button class="${isG?"":"on"}" data-act="amt-mode" data-v="unit" data-id="${it.id}" aria-pressed="${!isG}">${esc(uName(alt.k,1,true))}</button><button class="${isG?"on":""}" data-act="amt-mode" data-v="g" data-id="${it.id}" aria-pressed="${isG}">${esc(gu)}</button></div>`:"";
  return `${main}${seg}<button class="amt-chev" data-act="amt-open" aria-label="Mehr Einheiten">${CHEV_DOWN}</button>`;
}
function amtBody(it,pop){
  const us=unitsFor(it), u=amtUnit(it), g=Math.round(ui.portion||0), kc=Math.round((it.kcal||0)*g/100), gu=gName(us,null,true);
  const cards=us.map(x=>`<button class="unit ${x.k===u.k?"on":""}" data-act="unit-set" data-k="${x.k}" data-id="${it.id}" aria-pressed="${x.k===u.k}">
      <i>${pIcon(x.ic)}</i><b class="notr">${esc(x.k==="g"?gName(us):uName(x.k))}</b>${x.k==="g"?"<span>genau</span>":`<span class="notr">${x.g} ${gu}</span>`}</button>`).join("");
  const q=ui.qty||1;
  const pick=u.k==="g"
    ? `<div class="opts">${[50,100,150,200,250].map(n=>`<button class="chip ${g===n?"on":""}" data-act="portion-set" data-v="${n}">${n} ${gu}</button>`).join("")}</div>
       <div class="famt"><input id="portion" type="number" inputmode="decimal" value="${g}" data-act="portion-in" data-id="${it.id}"><span class="notr">${esc(gName(us))}</span></div>`
    : `<div class="qty">
        <button class="qbtn" data-act="qty" data-v="-1" data-id="${it.id}" aria-label="Weniger" ${q<=.5?"disabled":""}>−</button>
        <div class="qmid ${pop?"pop":""}"><b>${qtyTxt(q)}</b><span class="notr">${esc(uName(u.k,q))}</span></div>
        <button class="qbtn plus" data-act="qty" data-v="1" data-id="${it.id}" aria-label="Mehr">+</button>
      </div>
      <div class="qsum notr"><span>≈ ${g} ${gu}</span><span class="k">${kc} kcal</span></div>`;
  return `<div class="amt-head"><b class="amt-t">Wie viel?</b><button class="amt-x" data-act="amt-toggle" aria-label="Zuklappen">${CHEV_DOWN}</button></div><div class="units">${cards}</div>${pick}`;
}
// Nach Änderung der Menge: nur die betroffenen Teile neu zeichnen (Blatt bleibt offen, kein Springen)
function amtRefresh(it,pop){
  const b=document.getElementById("amt-body"); if(b){ const sx=(b.querySelector(".units")||{}).scrollLeft||0; b.innerHTML=amtBody(it,pop); const un=b.querySelector(".units"); if(un) un.scrollLeft=sx; trDom(b); }
  const c=document.getElementById("amt-compact"); if(c){ c.innerHTML=amtCompact(it); trDom(c); }
  amtSync(it);
}
// Nur Zahlen nachziehen (das Feld, in dem gerade getippt wird, bleibt unangetastet)
function amtSync(it){
  const us=unitsFor(it), u=amtUnit(it), g=Math.round(ui.portion||0), kc=Math.round((it.kcal||0)*g/100), gu=gName(us,null,true);
  const set=(id,h)=>{ const e=document.getElementById(id); if(e){ e.innerHTML=h; trDom(e); } };
  set("fmacros",fMacros(it,ui.portion||0)); set("ftable",fTable(it,ui.portion||0));
  const txt=(id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
  txt("fgram",g); txt("amt-sum",u.k==="g"?`${kc} kcal`:`${g} ${gu} · ${kc} kcal`);
  if(u.k!=="g") txt("amt-val",`${qtyTxt(ui.qty||1)} ${uName(u.k,ui.qty||1)}`);
  ["portion","portion-c"].forEach(id=>{ const i=document.getElementById(id); if(i&&i!==document.activeElement) i.value=g; });
}
