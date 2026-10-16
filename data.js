// Health Maxxing – Grunddaten: Ziele, Lebensmittel, Pflege, Supplements, Übungen, Aufgaben
// NORM wird schon beim Laden dieser Datei gebraucht (Liste der Standard-Lebensmittel)
function NORM(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/ae/g,"a").replace(/oe/g,"o").replace(/ue/g,"u"); }
const KEY = "forma-app-v1";
const GOALS = [
  { id:"muscle", name:"Muskeln aufbauen" },
  { id:"lose", name:"Abnehmen" },
  { id:"skin", name:"Haut & Look" },
  { id:"energy", name:"Energie" }
];
const SLOTS = [
  { id:"breakfast", name:"Frühstück", share:.25, tint:"#FFF4D6", ink:"#C4841D" },
  { id:"lunch", name:"Mittagessen", share:.35, tint:"#E7F6EE", ink:"#1F8A54" },
  { id:"dinner", name:"Abendessen", share:.30, tint:"#E8EEFF", ink:"#3B5BDB" },
  { id:"snack", name:"Snacks", share:.10, tint:"#FDECEC", ink:"#C24646" }
];
const BASE_FOODS = [
  { id:"skyr", type:"food", name:"Skyr Natur", brand:"Arla", emoji:"🥛", kcal:63, protein:11, carbs:4, fat:0.2, sugar:3.5, processed:false },
  { id:"hafer", type:"food", name:"Haferflocken", brand:"Kölln", emoji:"🥣", kcal:372, protein:14, carbs:59, fat:7, sugar:1.1, processed:false },
  { id:"banane", type:"food", name:"Banane", brand:"Natur", emoji:"🍌", kcal:89, protein:1.1, carbs:23, fat:0.3, sugar:12, processed:false },
  { id:"ei", type:"food", name:"Ei", brand:"Frisch", emoji:"🥚", kcal:143, protein:13, carbs:1, fat:10, sugar:0.4, processed:false },
  { id:"huhn", type:"food", name:"Hähnchenbrust", brand:"Frisch", emoji:"🍗", kcal:110, protein:23, carbs:0, fat:1.5, sugar:0, processed:false },
  { id:"reis", type:"food", name:"Reis gekocht", brand:"Küche", emoji:"🍚", kcal:130, protein:2.7, carbs:28, fat:0.3, sugar:0.1, processed:false },
  { id:"salat", type:"food", name:"Griechischer Salat", brand:"Küche", emoji:"🥗", kcal:128, protein:6, carbs:6, fat:9, sugar:3, processed:false },
  { id:"lachs", type:"food", name:"Lachsfilet", brand:"Frisch", emoji:"🐟", kcal:208, protein:20, carbs:0, fat:13, sugar:0, processed:false },
  { id:"brot", type:"food", name:"Vollkornbrot", brand:"Bäcker", emoji:"🍞", kcal:220, protein:8, carbs:38, fat:3, sugar:3, processed:false },
  { id:"cola", type:"food", name:"Cola", brand:"Handelsmarke", emoji:"🥤", kcal:42, protein:0, carbs:10.6, fat:0, sugar:10.6, processed:true },
  { id:"riegel", type:"food", name:"Proteinriegel", brand:"FitBar", emoji:"🍫", kcal:380, protein:30, carbs:32, fat:12, sugar:18, processed:true },
  { id:"pizza", type:"food", name:"Fertigpizza", brand:"Tiefkühl", emoji:"🍕", kcal:255, protein:11, carbs:29, fat:10, sugar:3.2, processed:true }
];
(function(){
  const rows=`quark|Magerquark|Natur|🥛|67,12,4,0.3,4,0,0,0.1,0.2
joghurt|Naturjoghurt 3,5 %|Natur|🥛|66,4,5,3.5,5,0,0,0.1,2.3
kaese|Gouda|Käse|🧀|356,25,0,28,0,0,0,1.8,18
thunfisch|Thunfisch Dose|Natur|🐟|116,26,0,1,0,0,0,1,0.3
tofu|Tofu Natur|Pflanzlich|🫘|120,13,2,7,0.5,0,1,0,1
linsen|Linsen gekocht|Küche|🫘|116,9,20,0.4,1,0,8,0,0.1
kartoffel|Kartoffeln gekocht|Küche|🥔|77,2,17,0.1,0.8,0,2,0,0
nudeln|Nudeln gekocht|Küche|🍝|158,6,31,0.9,1,0,2,0,0.2
apfel|Apfel|Natur|🍎|52,0.3,14,0.2,10,0,2.4,0,0
beeren|Blaubeeren|Natur|🫐|57,0.7,14,0.3,10,0,2.4,0,0
brokkoli|Brokkoli|Natur|🥦|34,2.8,7,0.4,1.7,0,2.6,0,0.1
avocado|Avocado|Natur|🥑|160,2,9,15,0.7,0,7,0,2.1
mandeln|Mandeln|Natur|🌰|579,21,22,50,4,0,12,0,3.8
erdnuss|Erdnussbutter|Glas|🥜|600,25,12,50,6,1,6,0.8,10
rind|Rinderhack|Frisch|🥩|220,19,0,16,0,0,0,0.2,7
haferdrink|Haferdrink|Pflanzlich|🥛|46,1,7,1.5,4,1,0.8,0.1,0.2
granola|Granola|Müsli|🥣|450,9,60,18,22,1,7,0.1,5
schoko|Vollmilchschokolade|Süßes|🍫|535,7,57,30,56,1,2,0.2,18
chips|Kartoffelchips|Snack|🥔|536,6,50,34,0.5,1,4,1.5,3
pommes|Pommes|Fast Food|🍟|280,3.5,38,13,0.5,1,3,1,1.5
salami|Salami|Wurst|🌭|430,20,1,38,1,1,0,4.5,15
energy|Energy Drink|Dose|🥤|45,0,11,0,11,1,0,0.1,0`.split("\n");
  rows.forEach(r=>{ const [id,name,brand,emoji,n]=r.split("|"); const [kcal,protein,carbs,fat,sugar,pr,fiber,salt,sat]=n.split(",").map(Number);
    BASE_FOODS.push({id,type:"food",name,brand,emoji,kcal,protein,carbs,fat,sugar,processed:!!pr,fiber,salt,sat}); });
  const X={hafer:{fiber:10,sat:1.3},brot:{fiber:7,salt:1.2},pizza:{salt:1.3,sat:4.5},riegel:{fiber:4,sat:5},lachs:{sat:3},ei:{sat:3}};
  BASE_FOODS.forEach(f=>Object.assign(f,X[f.id]||{}));
})();
const GENERIC_TXT=`Brötchen;Semmel|Schrippe|Weckle|Wecken;270;9;53;1.5;3;3;60;;
Vollkornbrot;Brot|Schwarzbrot|Körnerbrot;215;7;38;1.5;3;7;45;45;
Mischbrot;Brot|Bauernbrot;230;8;45;1.2;3;5;45;45;
Roggenbrot;Brot;210;6.5;40;1.2;3;6;45;45;
Toastbrot;Toast|Weißbrot;265;8;49;3;4;3;25;25;
Vollkorntoast;Toast;245;9;42;3;4;6;28;28;
Brezel;Laugenbrezel|Breze;285;9;56;2.5;1;3;90;;
Laugenbrötchen;Laugenweckle;270;9;52;2;2;3;70;;
Croissant;Buttercroissant;400;8;45;21;7;2;60;;1
Knäckebrot;Knäcke;330;10;60;1.5;1;14;10;10;
Reiswaffel;Reiscracker;385;8;80;3;1;1;9;;
Cornflakes;Frühstücksflocken;375;7;84;1;8;3;;;1
Müsli;Knuspermüsli|Granola;390;10;60;11;15;8;;;
Porridge;Haferbrei;90;4;14;2;4;1.5;250;;
Reis gekocht;Reis|Basmatireis|Jasminreis;130;2.7;28;0.3;0;0.4;;;
Nudeln gekocht;Pasta|Spaghetti|Penne|Fusilli|Makkaroni|Tagliatelle;155;5.5;30;1;1;2;250;;
Vollkornnudeln gekocht;Vollkornpasta;150;6;28;1.2;1;4;250;;
Kartoffeln gekocht;Kartoffel|Salzkartoffeln|Pellkartoffeln;72;2;15;0.1;0.8;1.7;90;;
Bratkartoffeln;;130;2.5;18;5.5;1;2;;;
Kartoffelpüree;Püree|Kartoffelbrei;85;2;14;2.5;1.5;1.5;;;
Pommes frites;Pommes|Fritten;280;3.5;38;13;0.5;3;150;;1
Couscous gekocht;Couscous;115;4;22;0.5;0.5;1.5;;;
Quinoa gekocht;Quinoa;120;4.5;21;1.9;1;2.8;;;
Pfannkuchen;Eierkuchen|Palatschinken|Crêpe;190;6;25;7;5;1;80;;
Pizza Margherita;Pizza;250;11;31;9;3;2;300;;1
Pizza Salami;;270;11;30;12;3;2;300;;1
Döner;Döner Kebab|Dürüm|Kebab;215;12;20;9;3;2;350;;1
Currywurst;;230;10;8;18;4;1;200;;1
Bratwurst;Rostbratwurst;300;13;2;27;1;0;100;;1
Wiener Würstchen;Würstchen|Wiener|Frankfurter;270;12;1;24;1;0;50;;1
Leberkäse;Fleischkäse;290;12;1;27;1;0;;100;1
Schnitzel;Wiener Schnitzel|Schweineschnitzel;250;18;12;14;1;1;150;;1
Hähnchenbrust;Hühnchen|Hähnchen|Chicken|Hühnerbrust;165;31;0;3.6;0;0;150;;
Hähnchenschenkel;Hühnerkeule;200;18;0;14;0;0;150;;
Putenbrust;Pute|Truthahn;110;24;0;1.5;0;0;150;;
Rindersteak;Steak|Rinderfilet|Rindfleisch;150;22;0;7;0;0;200;;
Hackfleisch;Hack|Rinderhack gemischt|Gehacktes;230;18;0;17;0;0;;;
Schweinefleisch;Schweinebraten|Schweinefilet;180;21;0;11;0;0;150;;
Speck;Bacon|Frühstücksspeck;420;14;0.5;40;0.5;0;8;8;1
Kochschinken;Schinken;110;19;1;3.5;1;0;15;15;
Salami;;400;20;1;35;1;0;6;6;1
Leberwurst;;300;12;2;27;1;0;;20;1
Fleischwurst;Lyoner|Mortadella;260;11;2;23;1;0;;20;1
Gulasch;Rindergulasch;130;12;4;7;2;1;350;;
Lasagne;;150;8;13;7;3;1;400;;1
Spaghetti Bolognese;Bolognese|Spaghetti Bolo;140;7;17;5;3;1.5;400;;
Spaghetti Carbonara;Carbonara;190;8;20;8;1;1;400;;
Chili con Carne;Chili;120;9;10;5;2;4;350;;
Linseneintopf;Eintopf;80;5;11;2;2;3;350;;
Gemüsesuppe;Suppe;35;1.2;6;0.8;3;1.5;300;;
Tomatensuppe;;45;1.2;7;1.5;5;1;300;;
Hühnersuppe;Nudelsuppe;40;3;3;1.5;1;0.5;300;;
Kartoffelsalat;;130;1.7;15;7;2;1.5;;;
Nudelsalat;;170;3;19;9;2;1.5;;;
Falafel;;330;13;32;18;3;5;17;;
Hummus;;230;8;14;16;0.5;6;;;
Tofu;Tofu natur;120;13;2;7;0.5;1;;;
Seitan;;140;25;5;2;0;1;;;
Lachs;Lachsfilet;200;20;0;13;0;0;150;;
Forelle;;120;20;0;4;0;0;200;;
Fischstäbchen;;190;13;17;8;1;1;28;;1
Garnelen;Shrimps|Krabben;100;21;0;1.5;0;0;;;
Kabeljau;Seelachs|Fischfilet;80;18;0;0.7;0;0;150;;
Hering;Matjes|Bismarckhering;200;17;0;14;0;0;;;
Ei;Eier|Frühstücksei|Hühnerei|Ei gekocht;155;13;1;11;1;0;60;;
Spiegelei;Spiegeleier;200;13;1;16;1;0;70;;
Rührei;Rühreier;180;11;1;14;1;0;120;;
Vollmilch;Milch|Kuhmilch;65;3.4;4.8;3.6;4.8;0;200;;
Milch 1,5 %;fettarme Milch|Kuhmilch 1,5;47;3.4;4.9;1.5;4.9;0;200;;
Sojadrink;Sojamilch;40;3.5;2.5;1.8;2;0.5;200;;
Mandeldrink;Mandelmilch;24;0.5;3;1.1;3;0.3;200;;
Naturjoghurt 1,5 %;Joghurt|Joghurt fettarm;47;4;6;1.5;6;0;150;;
Griechischer Joghurt;;130;5;4;10;4;0;150;;
Hüttenkäse;Cottage Cheese;100;12;3;4;3;0;200;;
Frischkäse;Philadelphia;250;6;4;23;4;0;;20;
Mozzarella;;250;18;1;19;1;0;125;;
Emmentaler;Käse;380;28;0;30;0;0;;25;
Parmesan;Grana Padano;390;36;0;28;0;0;;5;
Feta;Schafskäse|Hirtenkäse;260;15;1;22;1;0;;;
Camembert;Brie;300;20;0;24;0;0;;;
Margarine;;720;0;0;80;0;0;;10;
Sahne;Schlagsahne;300;2.5;3.5;30;3.5;0;;;
Banane;Bananen;90;1;20;0.3;17;2;120;;
Birne;Birnen;55;0.5;13;0.3;9;3;170;;
Orange;Orangen|Apfelsine;47;1;9;0.2;8;2;150;;
Mandarine;Clementine|Mandarinen;46;0.8;10;0.3;9;1.7;80;;
Weintrauben;Trauben;70;0.7;16;0.2;16;1;;;
Erdbeeren;Erdbeere;32;0.7;5.5;0.3;5;2;;;
Himbeeren;Himbeere;40;1.2;5;0.4;4.5;5;;;
Kiwi;;50;1;10;0.6;9;2;75;;
Ananas;;55;0.5;12;0.1;10;1.4;;;
Mango;;60;0.8;14;0.4;13;1.8;250;;
Wassermelone;Melone;30;0.6;7;0.2;6;0.4;;;
Pfirsich;Nektarine|Pfirsiche;40;0.8;9;0.1;8;1.5;150;;
Kirschen;Kirsche;60;1;13;0.3;12;1.5;;;
Datteln;Dattel;280;2;65;0.5;63;7;8;;
Rosinen;;300;3;70;0.5;60;4;;;
Tomate;Tomaten|Cherrytomaten;18;0.9;2.6;0.2;2.6;1.2;100;;
Gurke;Salatgurke|Gurken;12;0.6;2;0.2;1.7;0.5;300;;
Paprika;;25;1;4.6;0.3;4.2;2;150;;
Karotte;Möhre|Mohrrübe|Karotten|Möhren;35;0.9;7;0.2;5;3;80;;
Blumenkohl;;25;2;2;0.3;2;3;;;
Zucchini;;19;1.5;2;0.4;2;1;250;;
Aubergine;;25;1;3;0.2;3;3;250;;
Spinat;;23;2.7;0.6;0.4;0.5;2;;;
Salat;Kopfsalat|Blattsalat|Eisbergsalat;14;1.3;1.1;0.2;1;1.5;;;
Zwiebel;Zwiebeln;28;1.2;5;0.2;4;1.7;80;;
Champignons;Pilze|Champignon;22;3;0.5;0.3;0.3;1.5;;;
Mais;Dosenmais;85;3;15;1.5;5;3;;;
Erbsen;;70;5;10;0.4;4;5;;;
Kidneybohnen;Bohnen|Kidneybohne;100;7;14;0.5;1;6;;;
Kichererbsen;Kichererbse;120;8;15;2.5;3;6;;;
Süßkartoffel;Süßkartoffeln;85;1.5;19;0.2;6;3;200;;
Kürbis;;26;1;4;0.1;3;1;;;
Rote Bete;;45;1.5;8;0.1;7;2;;;
Sauerkraut;;20;1;2;0.3;1.5;2;;;
Oliven;;115;1;4;11;0.5;3;;;
Walnüsse;Walnuss;650;15;7;62;3;7;;;
Haselnüsse;Haselnuss;640;14;10;60;4;10;;;
Cashewkerne;Cashews;570;18;30;42;6;3;;;
Erdnüsse;Erdnuss;600;26;8;49;4;8;;;
Pistazien;;570;21;17;45;8;10;;;
Sonnenblumenkerne;;580;21;19;49;3;9;;;
Chiasamen;Chia;490;17;8;31;0;34;;;
Leinsamen;;500;18;2;42;1;27;;;
Zartbitterschokolade;Bitterschokolade|Edelbitter;550;7;40;38;30;10;;;1
Nutella;Nuss-Nougat-Creme|Nussnougatcreme;540;6;58;31;56;3;;;1
Gummibärchen;Haribo|Weingummi;340;7;77;0.1;46;0;;;1
Kekse;Keks|Butterkeks;450;7;72;14;24;2;;10;1
Kuchen;Rührkuchen;380;5;50;18;30;1;;80;1
Eis;Speiseeis|Vanilleeis|Eiscreme;200;3.5;24;10;22;0;50;;1
Müsliriegel;;400;6;65;13;30;5;25;;1
Honig;;300;0.4;75;0;75;0;;;
Marmelade;Konfitüre;250;0.5;60;0.1;55;1;;;
Zucker;;400;0;100;0;100;0;;;
Pudding;;110;3;18;3;16;0;;;1
Donut;Berliner|Krapfen;380;5;50;18;20;1.5;60;;1
Popcorn;;400;11;62;13;1;14;;;1
Wasser;Mineralwasser|Sprudel|Leitungswasser;0;0;0;0;0;0;250;;
Kaffee;Espresso|Filterkaffee|Kaffee schwarz;2;0.1;0;0;0;0;200;;
Cappuccino;;45;2.5;4;2;4;0;200;;
Latte Macchiato;Milchkaffee|Latte;50;3;5;2;5;0;250;;
Tee;Schwarztee|Grüner Tee|Früchtetee;1;0;0.2;0;0;0;250;;
Cola;Coca-Cola|Pepsi|Fanta|Sprite;42;0;10.6;0;10.6;0;330;;1
Cola Zero;Cola light|Zero;0;0;0;0;0;0;330;;1
Apfelsaft;Saft|Multivitaminsaft;46;0.1;11;0.1;10;0;200;;
Orangensaft;;45;0.7;10;0.2;9;0;200;;
Apfelschorle;Schorle;22;0;5;0;5;0;250;;
Bier;Pils|Weizenbier|Helles;43;0.4;3.5;0;0.1;0;500;;
Wein;Rotwein|Weißwein|Rosé;75;0.1;2.5;0;1;0;150;;
Smoothie;;55;0.6;12;0.3;11;1;250;;
Olivenöl;Öl|Rapsöl|Sonnenblumenöl|Speiseöl;880;0;0;99;0;0;;;
Mayonnaise;Mayo;680;1;3;75;2;0;;;1
Ketchup;;100;1.2;23;0.1;22;0.5;;;1
Senf;;80;4;5;4;3;3;;;
Sojasauce;Sojasoße;60;8;5;0;1;0;;;
Tomatensauce;Passata|Pastasauce|Tomatensoße;40;1.5;7;1;5;1.5;;;
Pesto;;450;5;4;46;2;2;;;
Salatdressing;Dressing;300;1;8;30;5;0.5;;;1
Proteinriegel;Proteinbar;350;30;35;10;5;5;45;;1
Proteinpulver;Whey|Whey Protein|Proteinshake;380;75;8;5;5;0;30;;1`;
(function(){
  // Format: Name;Alias|Alias;kcal;Eiweiss;KH;Fett;Zucker;Ballaststoffe;Stueck-g;Scheibe-g;verarbeitet
  const EMO=[["brot","🍞"],["broetchen","🥖"],["brezel","🥨"],["croissant","🥐"],["reis","🍚"],["nudel","🍝"],["spaghetti","🍝"],["pasta","🍝"],["kartoffel","🥔"],["pommes","🍟"],["pizza","🍕"],["doner","🌯"],["wurst","🌭"],["salami","🌭"],["schnitzel","🍖"],["hahn","🍗"],["huhn","🍗"],["pute","🍗"],["steak","🥩"],["fleisch","🥩"],["hack","🥩"],["speck","🥓"],["schinken","🥓"],["lachs","🐟"],["fisch","🐟"],["forelle","🐟"],["kabeljau","🐟"],["hering","🐟"],["garnele","🦐"],["ei","🥚"],["milch","🥛"],["drink","🥛"],["joghurt","🥛"],["quark","🥛"],["kase","🧀"],["mozzarella","🧀"],["feta","🧀"],["camembert","🧀"],["parmesan","🧀"],["sahne","🥛"],["banane","🍌"],["birne","🍐"],["orange","🍊"],["mandarine","🍊"],["trauben","🍇"],["erdbeer","🍓"],["himbeer","🍓"],["kiwi","🥝"],["ananas","🍍"],["mango","🥭"],["melone","🍉"],["pfirsich","🍑"],["kirsche","🍒"],["tomate","🍅"],["gurke","🥒"],["paprika","🫑"],["karotte","🥕"],["blumenkohl","🥦"],["zucchini","🥒"],["aubergine","🍆"],["spinat","🥬"],["salat","🥗"],["zwiebel","🧅"],["champignon","🍄"],["mais","🌽"],["erbse","🫛"],["bohne","🫘"],["kichererbse","🫘"],["tofu","🫘"],["nuss","🥜"],["nusse","🥜"],["mandel","🌰"],["cashew","🥜"],["schokolade","🍫"],["nutella","🍫"],["gummi","🍬"],["keks","🍪"],["kuchen","🍰"],["eis","🍨"],["riegel","🍫"],["honig","🍯"],["donut","🍩"],["popcorn","🍿"],["wasser","💧"],["kaffee","☕"],["cappuccino","☕"],["latte","☕"],["tee","🍵"],["cola","🥤"],["saft","🧃"],["schorle","🧃"],["bier","🍺"],["wein","🍷"],["smoothie","🥤"],["suppe","🍲"],["eintopf","🍲"],["gulasch","🍲"],["chili","🍲"],["lasagne","🍝"],["bolognese","🍝"],["carbonara","🍝"],["ol","🫒"],["oliven","🫒"],["protein","💪"],["muesli","🥣"],["cornflakes","🥣"],["porridge","🥣"],["haferflocken","🥣"]];
  const emo=n=>{ const x=NORM(n); for(const [k,e] of EMO){ if(x.includes(k)) return e; } return "🍽️"; };
  const byName=new Map(); BASE_FOODS.forEach(f=>byName.set(NORM(f.name),f));
  const num=v=>{ const n=parseFloat(String(v).replace(",",".")); return isFinite(n)?n:NaN; };
  let added=0, merged=0, skipped=0;
  GENERIC_TXT.split(/\r?\n/).forEach(line=>{
    line=line.trim(); if(!line||line[0]==="#") return;
    const c=line.split(";"); const name=(c[0]||"").trim(); const kcal=num(c[2]);
    if(!name||!isFinite(kcal)){ skipped++; return; }
    const al=(c[1]||"").split("|").map(x=>x.trim()).filter(Boolean);
    const piece=num(c[8])||0, slice=num(c[9])||0;
    const hit=byName.get(NORM(name))||al.map(a=>byName.get(NORM(a))).find(x=>x&&Math.abs(x.kcal-kcal)<=Math.max(5,kcal*0.1));
    if(hit){
      // Doppelung: Naehrwerte der vorhandenen Zeile bleiben, nur Alias und Gramm-Angaben ergaenzen
      hit.al=Array.from(new Set([...(hit.al||[]),...(NORM(hit.name)===NORM(name)?[]:[name]),...al]));
      if(piece&&!hit.pieceG) hit.pieceG=piece; if(slice&&!hit.sliceG) hit.sliceG=slice;
      merged++; return;
    }
    const f={id:"g-"+NORM(name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),type:"food",name,brand:"Standard",emoji:emo(name),
      kcal,protein:num(c[3])||0,carbs:num(c[4])||0,fat:num(c[5])||0,sugar:num(c[6])||0,fiber:num(c[7])||0,processed:c[10]==="1"||c[10]==="1\r",al,pieceG:piece||undefined,sliceG:slice||undefined};
    BASE_FOODS.push(f); byName.set(NORM(name),f); added++;
  });
  window.GENERIC_STATS={added,merged,skipped};
})();
// Partnerlinks/Bezugsquellen erst einschalten, wenn es echte Partner gibt.
const PARTNERS_ENABLED = false;
const CARE = [
  { id:"cerave", type:"care", name:"Feuchtigkeitscreme", emoji:"🧴", skin:["trocken","sensibel","normal"], fragrance:false, alcohol:false, actives:["Ceramides"] },
  { id:"nia", type:"care", name:"Niacinamid 4–5 %", emoji:"💧", skin:["fettig","unrein","normal"], fragrance:false, alcohol:false, actives:["Niacinamid"] },
  { id:"spf", type:"care", name:"Sonnencreme LSF 50", emoji:"☀️", skin:["trocken","sensibel","fettig","normal"], fragrance:false, alcohol:false, actives:["UV-Filter"] },
  { id:"toner", type:"care", name:"Gesichtswasser", emoji:"💧", skin:["fettig"], fragrance:true, alcohol:true, actives:["Menthol"] }
];
CARE.push(
  {id:"cleanser",type:"care",name:"Mildes Reinigungsgel",emoji:"🧼",skin:["fettig","unrein","normal","sensibel"],fragrance:false,alcohol:false,actives:[]},
  {id:"shampoo",type:"care",name:"Mildes Shampoo",emoji:"🚿",skin:["normal","sensibel","trocken"],fragrance:false,alcohol:false,actives:[]},
  {id:"duft",type:"care",name:"Duschgel parfümiert",emoji:"🧴",skin:["normal"],fragrance:true,alcohol:false,actives:[]}
);
const SUPS = [
  { id:"crea", type:"sup", name:"Creatin Monohydrat", emoji:"⚪", dose:"5 g", when:"täglich", note:"Am klarsten belegt für Kraft." },
  { id:"whey", type:"sup", name:"Whey Isolat", emoji:"🥛", dose:"25 g", when:"nach dem Training", note:"Nur wenn Protein aus Essen fehlt." },
  { id:"d3", type:"sup", name:"Vitamin D3", emoji:"☀️", dose:"800 IE (20 µg)", when:"zur Mahlzeit", note:"Basis bei wenig Sonne, v. a. Oktober bis März." },
  { id:"o3", type:"sup", name:"Omega-3", emoji:"🐟", dose:"1–2 g EPA/DHA", when:"zur Mahlzeit", note:"Sinnvoll bei wenig Fisch." },
  { id:"mg", type:"sup", name:"Magnesium", emoji:"🌙", dose:"bis 250 mg", when:"abends", note:"Wirkung auf Schlaf nur schwach belegt." },
  { id:"b12", type:"sup", name:"Vitamin B12", emoji:"🌱", dose:"laut Packung", when:"täglich", note:"Wichtig bei veganer Ernährung." },
  { id:"col", type:"sup", name:"Kollagen", emoji:"🧴", dose:"10 g", when:"morgens", note:"Kleine Effekte auf Hautfeuchte. Schlaf, LSF und Essen wirken stärker." }
];
const ROUTINES = [
  { id:"push", name:"Push", detail:"Bankdrücken, Schulterdrücken", exercises:["bp","ohp"] },
  { id:"pull", name:"Pull", detail:"Rudern, Latzug", exercises:["row","lat"] },
  { id:"legs", name:"Beine", detail:"Kniebeuge, RDL", exercises:["sq","rdl"] },
  { id:"empty", name:"Leer", detail:"Übungen selbst wählen", exercises:[] }
];
const EX = {}; // wird in uebungen.js mit allen Übungen gefüllt
function defaultRoutines(){
  const set = (kg, reps, n=3) => Array.from({length:n}, ()=>({kg, reps}));
  const day = (id, name, exercises) => ({id, name, exercises});
  return [
    { id:"ppl", name:"Push Pull Legs", days:[
      day("push","Push",[{id:"bp", sets:set(60,8)},{id:"ohp", sets:set(30,8)},{id:"dip", sets:set(0,8)}]),
      day("pull","Pull",[{id:"row", sets:set(50,10)},{id:"lat", sets:set(45,10)},{id:"curl", sets:set(12,10)}]),
      day("legs","Beine",[{id:"sq", sets:set(80,5)},{id:"rdl", sets:set(70,8)},{id:"lunge", sets:set(16,10)}])
    ]}
  ];
}
function normalizeRoutines(list){
  if(!list || !list.length) return defaultRoutines();
  if(list[0].days) return list;
  return [{ id:"ppl", name:"Push Pull Legs", days:list.map(r=>({id:r.id, name:r.name, exercises:r.exercises||[]})) }];
}
const TASKS = [
  { id:"essen", name:"Essen notiert", hint:"Mindestens eine Mahlzeit" },
  { id:"wasser", name:"Wasser", hint:"Gläser voll" },
  { id:"sups", name:"Supplements", hint:"Dein Stack" },
  { id:"sport", name:"Training", hint:"Oder bewusster Ruhetag" },
  { id:"pflege", name:"Pflege", hint:"Kurze Abendroutine" },
  { id:"schlaf", name:"Schlaf", hint:"Fenster gehalten" }
];
