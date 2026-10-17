// Health Maxxing – Lebensmittel-Bewertung (naturbelassen / primal), je Ziel eigene Logik.
// Ablauf: 1. Lebensmittel-Art am Namen erkennen  2. Grundwert je Ziel  3. Nährwerte feinjustieren
//         4. Verarbeitung & Ersatzstoffe abziehen  5. Persönliches (Vegan, Unverträglichkeiten, Fokus)
// Ausgabe: score + kurze Texte "gut" und "schlecht" (keine Punkte-Rechnung).

// Zielreihenfolge in allen Tabellen: [Muskeln, Abnehmen, Haut, Energie]
const R_GOALS=["muscle","lose","skin","energy"];

// Textvorsätze: "~" nur bei vielen Kalorien (ab 300 kcal), "+" nur bei viel Protein (ab 12 g), "%" nur bei viel Fett (ab 10 g).
// Mehrere Texte mit "|" trennen. w:1 = naturbelassenes Lebensmittel (Abzug, wenn stark verarbeitet). d:1 = Milchprodukt.
// f = eigene Erkennung, k = Stichwörter ("=" ganzes Wort, "^" Wortanfang), n = Ausnahmen.
const R_CATS=[
  {id:"alcohol",k:["=biere","birra","cerveza","=vin","bier","=pils","=radler","=wein","rotwein","weisswein","rosewein","weinschorle","gluhwein","sekt","prosecco","champagner","wodka","vodka","whisky","whiskey","=gin","=rum","likor","schnaps","aperol","=cider","=korn","=ouzo","tequila","=alkohol"],n:["alkoholfrei","weinbeere","weintraube","weinessig","bierschinken","bierwurst","biersalami"],
   b:[10,8,6,8],g:["","","",""],x:["Bremst Regeneration & Muskelaufbau","Leere Kalorien, macht hungrig","Entzieht Wasser, Haut wirkt fahl","Stört den Schlaf, macht müde"]},
  {id:"softdrink",k:["orangina","pulco","ginger beer","capri","aloe vera drink","=soda","oasis","schorle zero","=cola","coca","pepsi","=coke","afri","limo","fanta","sprite","=energy","energydrink","energy drink","red bull","monster","eistee","ice tea","icetea","=tonic","tonic water","bitter lemon","ginger ale","spezi","mezzo","fassbrause","=7up","schweppes","=mate","club mate","sportgetrank","isotonisch","brause"],n:["mate tee","energy ball","energy bites"],
   b:[10,8,6,10],g:["","","",""],x:["Zucker ohne Nährstoffe","Flüssige Kalorien machen nicht satt","Zucker kann Unreinheiten fördern","Zucker-Hoch, danach Absturz"]},
  {id:"vegjuice",k:["karottensaft","mohrensaft","gemusesaft","rote bete saft","rote beete saft","tomatensaft","selleriesaft","gemuse saft"],w:1,
   b:[55,58,88,62],g:["Mikronährstoffe für die Regeneration","Wenig Kalorien für einen Saft","Viel Beta-Carotin für die Haut","Vitamine ohne viel Zucker"],x:["Kaum Protein","Ganzes Gemüse sättigt mehr","",""]},
  {id:"juice",k:["=jus","zumo","succo","saft","nektar","smoothie","schorle","=juice","direktsaft"],n:["zitronensaft","limettensaft","saftig","nektarine"],
   b:[34,18,30,34],g:["Schnelle Carbs nach dem Training","","Etwas Vitamin C","Schnelle Energie aus Obst"],x:["Fruchtzucker ohne Ballaststoffe","Flüssiger Zucker, macht nicht satt","Viel Fruchtzucker auf einmal","Schneller Zucker, schnelles Tief"]},
  {id:"plantmilk",f:(h,raw,c)=>rHit(h,h.trim().split(/[^a-z0-9%&]+/),c.k)||/(hafer|mandel|reis|cashew|soja|erbsen|dinkel|oat|almond|hanf|haselnuss|hazelnut|nocciola|almendra|zobi)[ -]?(drink|milch|milk)/.test(h)||/(bevanda|napitak|leche de|lait d.?amande|boisson)/.test(h),k:["hafermilch","haferdrink","hafer drink","oat drink","mandelmilch","mandeldrink","mandel drink","reisdrink","reismilch","cashewdrink","kokosdrink","erbsendrink","dinkeldrink"],
   b:[22,32,26,28],g:["","Wenig Kalorien","",""],x:["Fast kein Protein|Ersatzdrink, nicht naturbelassen","Ersatzdrink, nicht naturbelassen|Oft Zucker aus Getreide","Ersatzdrink mit Zusätzen & Öl","Kaum echte Nährstoffe|Ersatzdrink, nicht naturbelassen"]},
  {id:"ersatz",f:h=>/(vegan|veggie|vegetar|pflanzlich|plant based|fleischfrei|fleischlos|ohne fleisch)/.test(h)&&/(burger|wurst|schnitzel|hack|nugget|aufschnitt|salami|frikadell|bulette|chicken|steak|schinken|geschnetzelt|mortadella|filet|gyros|doner|bites|fischstabchen|thunfisch|lachs|lyoner|leberwurst|cevapcici|balls|mince)/.test(h)||/(vegan|pflanzlich|plant based)/.test(h)&&/(kase|cheese|joghurt|jogurt|quark|skyr|sahne|butter|mayo|cuisine|alternative|creme)/.test(h)||/(seitan|beyond meat|quorn|like meat|vegetarian butcher|sojaschnetzel|soja schnetzel|garden gourmet|veganz|planted|rugenwalder vegetar)/.test(h),
   b:[22,24,12,18],g:["","","",""],x:["Ersatzprodukt aus Isolaten & Zusätzen","Ersatzprodukt, nicht naturbelassen|Oft mehr Kalorien als gedacht","Stark verarbeitet, oft Soja & Pflanzenöl","Ersatzprodukt ohne echte Nährstoffe"]},
  {id:"proteinbar",f:h=>/(protein|eiweiss)/.test(h)&&/(riegel|\bbar\b|bars|keks|cookie|pudding|crisp|chips|waffel|pancake|\beis\b|creme|brownie|snack|schoko|spread|cereal|musli|pops|balls|bites)/.test(h)&&!/(drink|shake|pulver|powder)/.test(h),
   b:[48,38,28,34],g:["Viel Protein, praktisch für unterwegs","Proteinreich","",""],x:["Stark verarbeitet, oft Süßstoffe","Kalorienreicher als er wirkt|Stark verarbeitet","Milchprotein & Zusätze – ungünstig für die Haut","Kein Ersatz für echtes Essen"]},
  {id:"whey",f:h=>/(whey|proteinpulver|eiweisspulver|protein pulver|proteinshake|protein shake|isolat|isolate|casein|clear whey)/.test(h)||/(protein|eiweiss)/.test(h)&&/(drink|shake|pulver|powder|milk|milch)/.test(h),
   b:[72,64,38,46],g:["Viel Protein, schnell nach dem Training","Viel Protein, wenig Kalorien","","Hält lange satt"],x:["Isoliertes Pulver – echtes Essen ist besser","Getrunken sättigt weniger als gegessen","Molke kann bei manchen Unreinheiten fördern","Kaum Carbs für Energie"],d:1},
  {id:"darkchoc",f:(h,raw)=>/(schokolade|schoko|chocolate|chocolat|kakao|cacao|cocoa|fondente|noir)/.test(h)&&(/(^|\D)(6[5-9]|[7-9]\d|100) ?%/.test(raw)||/(zartbitter|edelbitter|bitterschokolade|rohkakao|kakaonibs|kakao nibs|backkakao|kakaopulver|cacao nibs|raw cacao)/.test(h))&&!/(milch|keks|riegel|pudding|\beis\b|muffin|kuchen|creme|drink|trink|instant|musli|cookie|mousse|nuss|praline)/.test(h),
   b:[50,40,62,64],g:["Kaum Zucker, viel Kakao","Wenig Zucker, kleine Menge reicht","Kakao liefert Antioxidantien","Kakao + Fett = ruhige Energie|Etwas natürliches Koffein"],x:["Wenig Protein für die Kalorien","~Sehr kalorienreich","Etwas Zucker – in Maßen","Nur in kleinen Mengen"]},
  {id:"ricecake",k:["rice cake","galettes de riz","galette de riz","tortitas de arroz","reiswaffel","maiswaffel","reiscracker","puffreis","dinkelwaffel","reis waffel","mais waffel"],
   b:[34,36,38,40],g:["Leichte Carbs vor dem Training","Wenig Kalorien pro Stück","Glutenfrei","Schnell verfügbare Carbs"],x:["Kaum Protein & Nährstoffe","Puffreis lässt Blutzucker springen","Stark verarbeiteter Puffreis","Schnelle Carbs ohne Ballaststoffe"]},
  {id:"sugar",k:["confiture","confitura","=doce","=jam","conserve","fruit spread","sucre","cassonade","azucar","zucchero","=syrup","=sirop","grenadine","=zucker","rohrzucker","puderzucker","rubenzucker","haushaltszucker","kokosblutenzucker","vanillezucker","gelierzucker","kandis","sirup","agavendicksaft","marmelade","konfiture","fruchtaufstrich","gelee","=dulce","zuckerrubensirup","glukose","fruktose","dextrose","traubenzucker"],n:["ahornsirup","erable","maple","sirop de agave"],
   b:[10,8,6,12],g:["","","",""],x:["Purer Zucker ohne Nährstoffe","Purer Zucker, null Sättigung","Zucker kann Unreinheiten fördern","Zucker-Hoch, danach Absturz"]},
  {id:"sweets",k:["biscuit","biscoff","speculoos","madeleine","=sable","sables","tartelette","=cake","bueno","ferrero","rocher","toffifee","mon cheri","=mars","maltesers","toblerone","celebrations","tic tac","mentos","knoppers","jaffa","prinzenrolle","magnum","=glace","glaces","gelato","helado","crema di nocciol","hazelnut spread","pate a tartiner","bionella","noisetta","custard","creme brulee","creme dessert","galette","=boudoirs","gocciole","baiocchi","abbracci","pan di stelle","=lion","schaumwaffel","kipferl","cinnamon roll","rollitos de canela","croissant","brioche","schokolade","schoko","chocolate","nutella","nougat","gummi","haribo","bonbon","lakritz","marshmallow","toffee","karamell","caramel","praline","marzipan","keks","cookie","biskuit","zwieback","platzchen","lebkuchen","stollen","kuchen","torte","muffin","donut","doughnut","brownie","croissant","plunder","strudel","krapfen","=berliner","waffel","pfannkuchen","crepe","pancake","=eis","eiscreme","speiseeis","eiskonfekt","sorbet","pudding","dessert","tiramisu","mousse","milchreis","griesbrei","grießbrei","quarkballchen","quarkkeulchen","riegel","snickers","twix","bounty","kitkat","kit kat","duplo","hanuta","milka","ritter sport","kinder","m&m","smarties","oreo","leibniz","prinzen rolle","kekse","fruchtschnitte","mochi","baklava","schaumkuss","dickmann"],n:["sussholz","sukartoffel","susskartoffel","sußkartoffel","eisberg","eiswurfel","kuchenkrauter"],
   b:[12,8,8,12],g:["","","",""],x:["Viel Zucker, kaum Protein","Viele Kalorien, macht nicht satt","Zucker kann Unreinheiten fördern","Zucker-Hoch, danach Müdigkeit"]},
  {id:"cereal",k:["corn flakes","=flakes","bran flakes","weetabix","tresor","=trix","cereales","cereals","=cereal","all bran","fitness","cornflakes","frosties","smacks","=pops","loops","crunchy","knuspermusli","knusper","granola","cerealien","fruhstucksflocken","choco","cini minis","nesquik","special k","chocapic","=crisp"],
   b:[20,14,12,18],g:["","","",""],x:["Zuckerflocken, wenig Protein","Viel Zucker, macht nicht lange satt","Zucker & Weißmehl – ungünstig für die Haut","Schnelle Energie, schneller Absturz"]},
  {id:"chips",k:["pufuleti","saltletts","pretzel","=sticks","tyrrell","potato wedges","chips","flips","salzstangen","salzbrezel","=cracker","cracker","popcorn","nachos","tortilla chips","knabber","erdnussflips","crisps","pringles","snack mix","partymix","=tuc","bretzel"],
   b:[12,8,10,12],g:["","","",""],x:["Leere Kalorien ohne Protein","Extrem kalorienreich, null Sättigung","Frittiert, viel Salz & Pflanzenöl","Fett & Salz machen träge"]},
  {id:"fastfood",k:["pizza","doner","kebab","durum","burger","pommes","fritten","currywurst","nuggets","chicken wings","hot dog","hotdog","kroketten","rosti","kartoffelpuffer","reibekuchen","falafel","frittiert","backfisch","fischstabchen","=nuggets","fast food","=mcdonald","big mac","whopper","flammkuchen","calzone","=tacos","burrito","quesadilla","fried"],
   b:[28,16,12,20],g:["","","",""],x:["Weißmehl & Frittierfett statt echter Nahrung","Hohe Kaloriendichte, schnell wieder hungrig","Frittiertes & Fertiges – ungünstig für die Haut","Schwer im Magen, macht träge"]},
  {id:"readymeal",k:["bouillon","=kub","=brodo","caldo","ramen","ramyun","nouilles instant","cassoulet","mousline","puree delice","velute","cream of","fertiggericht","fertig","=instant","instant","terrine","nudelsnack","5 minuten","mikrowelle","tiefkuhlgericht","lasagne","maultasche","cordon bleu","paniert","panade","=schnitzel","wiener schnitzel","kartoffelsalat","nudelsalat","fleischsalat","eiersalat","wurstsalat","thunfischsalat","geflugelsalat","krautsalat","coleslaw","bruhwurfel","suppenwurfel","gekornte","fix fur","=fix","tutensuppe","asia nudeln","yum yum","cup noodles","ravioli","tortellini","kasespatzle","schupfnudeln","frikadelle","bulette","fleischpflanzerl","cevapcici","=gyros"],n:["lasagneplatten"],
   b:[32,26,18,26],g:["","","",""],x:["Fertigprodukt mit Zusätzen","Versteckte Kalorien in Soße & Panade","Viel Salz & Zusätze","Fertigprodukt, macht schnell müde"]},
  {id:"mixedmeal",k:["gulasch","chili con carne","eintopf","=suppe","suppe","curry","bolognese","auflauf","=bowl","risotto","ragout","geschnetzeltes","shakshuka","omelett","ratatouille","pfanne","stew","=dal","=dhal"],n:["currypulver","currypaste","currysauce","currywurst"],w:1,
   b:[70,66,66,70],g:["Warme Mahlzeit aus echten Zutaten","Sättigende warme Mahlzeit","Echte Zutaten statt Fertigkram","Ausgewogene warme Mahlzeit"],x:["","","",""]},
  {id:"sauce",k:["vinaigrette","mayonesa","majo","majonez","sriracha","harissa","=salsa","sos de soia","soy sauce","chilli oil","chili oil","maggi wurze","ketchup","mayonnaise","=mayo","remoulade","dressing","grillsauce","bbq","barbecue","=sauce","sosse","sauce","pesto","aufstrich","dip","aioli","tzatziki","hollandaise","currysauce","sojasauce","teriyaki","sweet chili","=chutney","salatcreme","streichcreme"],n:["tomatensauce","tomatensosse","passata","senf"],
   b:[28,20,20,28],g:["","","",""],x:["Fertigsoße mit Zucker & Öl","Versteckte Kalorien aus Öl & Zucker","Zucker, Salz & Pflanzenöl","Kaum Nährstoffe"]},
  {id:"margarine",k:["margarine","=rama","becel","=latta","halbfettmargarine","streichfett","pflanzenfett","=sanella","bratfett","frittierfett","palmfett","kokosfett gehartet","plattenfett"],
   b:[10,10,6,10],g:["","","",""],x:["Industriefett statt echter Butter","Industriefett, viele Kalorien","Raffinierte Pflanzenfette – ungünstig für die Haut","Industriefett ohne Nährstoffe"]},
  {id:"seedoil",k:["sunflower oil","rapeseed oil","huile de tournesol","huile de colza","isio","canola","vegetable oil","sonnenblumenol","rapsol","distelol","maiskeimol","pflanzenol","speiseol","erdnussol","sojaol","traubenkernol","palmol","=bratol","frittierol","sonnenblumen ol","raps ol"],
   b:[20,16,10,18],g:["","","",""],x:["Raffiniertes Samenöl, nicht naturbelassen","~Sehr kalorienreich|Raffiniertes Samenöl","Viel Omega-6, wenig Omega-3|Raffiniertes Samenöl","Raffiniertes Samenöl, nicht naturbelassen"]},
  {id:"coconut",k:["=coco","noix de coco","lait de coco","vita coco","kokos","coconut"],n:["kokosfett gehartet"],w:1,
   b:[64,52,94,90],g:["Natürliches Fett aus der Kokosnuss","MCT-Fette sättigen gut","Kokos – Top-Fett für die Haut","MCT-Fette: schnelle, saubere Energie"],x:["Kaum Protein","~Sehr kalorienreich – sparsam","",""]},
  {id:"goodfat",k:["huile d'olive","huile d olive","aceite de oliva","extra vergine","vierge extra","huile de noix","olivenol","olive oil","olivenoel","=ghee","butterschmalz","avocadool","leinol","walnussol","hanfol","schmalz","=talg","rindertalg","mct ol","mct-ol","kurbiskernol","=olio","olive extra"],w:1,
   b:[64,50,84,80],g:["Natürliches Fett zum Kochen","Natürliches Fett – sparsam gut","Gute Fette für geschmeidige Haut","Fett liefert lange Energie"],x:["Kein Protein","~Sehr kalorienreich – sparsam","",""]},
  {id:"peanut",k:["cacahuete","cacahuetes","mani ","erdnuss","peanut"],w:1,
   b:[60,44,50,64],g:["Viel Protein für eine Nuss","Sättigt gut – kleine Menge","","Fett + Protein = stabile Energie"],x:["Hülsenfrucht, nicht primal","~Sehr kalorienreich|Hülsenfrucht, nicht primal","Viel Omega-6|Hülsenfrucht, nicht primal","Hülsenfrucht, nicht primal"]},
  {id:"butter",k:["beurre","=burro","mantequilla","maslo 82","butter"],n:["buttermilch","butterkase","kakaobutter","sheabutter","nussbutter","mandelbutter","cashewbutter"],w:1,d:1,
   b:[58,46,62,70],g:["Naturbelassenes Fett","Natürliches Fett, macht satt","Natürliches Fett mit Vitamin A","Natürliche Fettquelle für lange Energie"],x:["Kein Protein","~Sehr kalorienreich – dünn streichen","Milchfett – in Maßen",""]},
  {id:"processedmeat",k:["wurst","salami","schinken","=speck","speckwurfel","bacon","leberkase","fleischkase","=wiener","wurstchen","frankfurter","mortadella","lyoner","aufschnitt","chorizo","cabanossi","pastrami","corned","sulze","teewurst","mettwurst","landjager","kassler","kasseler","pfefferbeisser","=bierschinken","leberpastete","pastete","=mett","hot dog","peperoni salami","bresaola","prosciutto","serrano","=parma","coppa","nduja","=bratwurst","weisswurst","krakauer","bockwurst","bifi","jerky","beef jerky","dorrfleisch","knacker","=pastrama","rillettes"],n:["wurstsalat"],
   b:[40,32,22,28],g:["+Liefert Protein","","",""],x:["Verarbeitet: Salz, Nitrit & Zusätze","Viel Fett & Salz|Verarbeitet","Salz, Nitrit & Zusätze – ungünstig für die Haut","Schwer & salzig, macht träge"]},
  {id:"broth",k:["knochenbruhe","bone broth","rinderbruhe","huhnerbruhe","geflugelbruhe","rinderfond","kalbsfond","huhnerfond","fischfond","=fond"],w:1,
   b:[78,88,95,80],g:["Kollagen & Aminosäuren","Wärmt & sättigt fast ohne Kalorien","Kollagen aus Knochen – Top für die Haut","Mineralien & Elektrolyte"],x:["Wenig Protein pro Portion","","",""]},
  {id:"organ",k:["leber","=herz","rinderherz","huhnerherz","geflugelherz","=niere","nieren","innereien","=bries","kalbsbries","markknochen","=mark","rindermark"],n:["leberwurst","leberkase","leberpastete"],w:1,
   b:[92,88,95,94],g:["Nährstoffbombe mit viel Protein","Viele Nährstoffe, wenig Kalorien","Vitamin A in Bestform","B12 & Eisen in Bestform"],x:["","","",""]},
  {id:"fattyfish",k:["maquereau","mackerel","saumon","truite","trout","sgombro","caballa","rillettes de thon","lachs","salmon","makrele","hering","matjes","sardine","sardelle","anchovis","sprotte","forelle","saibling","=aal","bismarck","rollmops","heilbutt","wildlachs","kaviar","rogen","fischrogen"],n:["frischkase","aufstrich","creme","seelachs"],w:1,
   b:[90,84,97,90],g:["Viel Protein + Omega-3","Protein & gute Fette machen satt","Omega-3 – Top für die Haut","Omega-3 & Protein für stabile Energie"],x:["","Etwas mehr Kalorien als magerer Fisch","",""]},
  {id:"leanfish",k:["=thon","atun","tonno","=tuna","merluza","cabillaud","crevette","gambas","thunfisch","tuna","kabeljau","seelachs","alaska","dorsch","zander","barsch","tilapia","pangasius","dorade","wolfsbarsch","scholle","seezunge","rotbarsch","=fisch","fischfilet","garnele","shrimp","krabbe","scampi","gamba","muschel","miesmuschel","auster","jakobsmuschel","hummer","languste","tintenfisch","calamari","oktopus","pulpo","meeresfruchte","schellfisch","karpfen","hecht","=wels","seehecht"],n:["austernpilz","austernsauce"],w:1,
   b:[94,94,82,76],g:["Sehr viel Protein, kaum Fett","Viel Protein, sehr wenig Kalorien","Protein, Jod & Zink","Leichtes Protein, liegt nicht schwer"],x:["","","Wenig Omega-3 – fetter Fisch ist besser","Kaum Carbs für Energie"]},
  {id:"poultry",k:["poulet","volaille","pollo","dinde","tacchino","hahnchen","huhn","hendl","=pute","puten","truthahn","chicken","geflugel","=ente","entenbrust","=gans","gansebrust","wachtel","perlhuhn","maishahnchen","poulet"],w:1,
   b:[95,94,74,76],g:["Top-Protein bei wenig Kalorien","Viel Protein, wenig Kalorien","Protein für Kollagen & Haut","Leichtes Protein"],x:["","","Weniger Hautnährstoffe als Fisch oder Ei","Allein kaum Energie aus Carbs"]},
  {id:"redmeat",k:["boeuf","bœuf","manzo","ternera","=veau","agneau","porc","rind","steak","=beef","lamm","kalb","=wild","wildschwein","hirsch","=reh","rehrucken","bison","entrecote","hufte","roastbeef","tatar","=hack","hackfleisch","gehacktes","rinderhack","schwein","kotelett","braten","=filet","=lende","=schulter","ziegenfleisch","zicklein","kaninchen","pferd","ochse","=rib","ribeye","rumpsteak","t-bone","tafelspitz","beinscheibe","schaufel","nacken"],n:["bratensosse","bratensauce"],w:1,
   b:[92,80,82,86],g:["Protein, Eisen & Kreatin","Viel Protein, macht lange satt","Zink & Eisen für die Haut","Eisen & B12 für Energie"],x:["","%Fettere Stücke: mehr Kalorien","",""]},
  {id:"soy",k:["tofu","tempeh","=soja","soja","=soy","edamame","=miso","sojamilch","sojadrink","sojajoghurt","yuba","natto"],n:["sojasauce","sojasosse"],
   b:[42,42,24,36],g:["Pflanzliches Protein","Protein bei moderaten Kalorien","",""],x:["Soja, nicht naturbelassen","Soja, nicht naturbelassen","Verarbeitetes Soja – lieber Fisch, Ei, Fleisch","Soja, nicht naturbelassen"]},
  {id:"protdairy",k:["skyr","quark","huttenkase","korniger frischkase","cottage","high protein joghurt","protein joghurt","proteinjoghurt","griechischer joghurt","griechisch joghurt","=ymer","magerquark","speisequark"],w:1,d:1,
   b:[94,95,58,74],g:["Sehr viel Protein, kaum Kalorien","Viel Protein, macht lange satt","Viel Protein für Kollagen","Protein hält Blutzucker stabil"],x:["","","Milchprodukt – kann bei manchen Unreinheiten fördern","Kaum Carbs für schnelle Energie"]},
  {id:"kefir",k:["kefir","=ayran","dickmilch","sauermilch","buttermilch","=lassi","=laban"],w:1,d:1,
   b:[74,72,64,70],g:["Protein & fermentiert","Fermentiert & leicht","Fermentiert – gut für den Darm","Fermentiert, leicht verdaulich"],x:["Weniger Protein als Skyr","","Trotzdem ein Milchprodukt",""]},
  {id:"dairy",k:["fromage blanc","fromage frais","=lait","leche entera","=leche","yaourt","yoghourt","=yogur","actimel","=melk","creme entiere","creme legere","creme fleurette","smietana","philadelphia","=kiri","exquisa","=panna","nata montada","petit suisse","milch","joghurt","jogurt","yogurt","sahne","schmand","creme fraiche","frischkase","mascarpone","ricotta","=rahm","kaffeesahne","kondensmilch","schlagsahne","saure sahne","=milk"],w:1,d:1,
   b:[66,60,50,62],g:["Protein & Calcium","Protein & Calcium","Liefert Protein & Calcium","Protein & Carbs"],x:["","%Fettreich – auf Fettstufe achten","Milch kann bei manchen Unreinheiten fördern",""]},
  {id:"cheese",k:["fromage","formaggio","queso","parmigiano","emmental","vache qui rit","leerdamer","quesitos","saint agur","=comte","roquefort","reblochon","gruyere","pecorino","kase","cheese","gouda","emmentaler","parmesan","grana padano","pecorino","mozzarella","burrata","=feta","camembert","=brie","cheddar","halloumi","manchego","gorgonzola","raclette","tilsiter","edamer","butterkase","harzer","appenzeller","gruyere","comte","provolone","=schafskase","ziegenkase","hirtenkase","bergkase","leerdammer","maasdamer","babybel","limburger","romadur","=quarkkase"],w:1,d:1,
   b:[64,46,46,58],g:["Viel Protein & Calcium","+Viel Protein","Liefert Protein & Calcium","Fett + Protein sättigen lange"],x:["Viel Fett pro Gramm Protein","~Kalorien- & fettreich","Milchprodukt – bei unreiner Haut eher meiden",""]},
  {id:"egg",k:["œuf","œufs","oeuf","oeufs","=uova","huevo","huevos","=ei","=eier","eier","ruhrei","spiegelei","=eigelb","eiklar","eiweiss","freilandei","wachteleier","=egg","eggs","pochiert"],n:["eiweisspulver","eiweissbrot","eiernudel","eierlikor","eierkuchen"],w:1,
   b:[92,90,90,90],g:["Komplettes Protein, natürlich","Sättigt stark bei wenig Kalorien","Biotin & Protein für Haut & Haare","Protein + Fett: lange satt, kein Tief"],x:["","","",""]},
  {id:"avocado",k:["avocado","guacamole"],w:1,
   b:[70,64,95,92],g:["Gute Fette & Kalium","Ballaststoffe & Fett machen satt","Vitamin E & gute Fette für die Haut","Gesunde Fette für lange Energie"],x:["Wenig Protein","Kalorienreich – eine halbe reicht","",""]},
  {id:"nuts",k:["noix","noisette","amande","almond","walnut","hazelnut","nocciol","mandorl","pistach","cashew","=nuts","nut mix","nussmix","kerne-mix","seeds mix","=nueces","almendra","walnuss","haselnuss","=nusse","nusskern","nussmischung","studentenfutter","trail mix","mandel","cashew","pistazie","macadamia","pekan","paranuss","kurbiskern","sonnenblumenkern","=chia","chiasamen","leinsamen","=sesam","hanfsamen","pinienkern","mandelmus","cashewmus","nussmus","=tahini","tahin","=nuts","edelnuss","maronen","esskastanie","=nuss"],n:["muskatnuss","kokosnuss","nougat"],w:1,
   b:[70,58,88,86],g:["Gute Fette & etwas Protein","Sättigen – kleine Handvoll","Vitamin E & Zink für die Haut","Fett + Protein = stabile Energie"],x:["Viele Kalorien für das Protein","~Sehr kalorienreich – Handvoll reicht","",""]},
  {id:"legume",k:["lentille","lentil","pois chiche","haricot","frijol","alubia","garbanzo","baked bean","=fagioli","ceci","lenticchie","linse","kichererbse","kidneybohne","=bohnen","schwarze bohnen","weisse bohnen","borlotti","cannellini","wachtelbohne","mungbohne","hummus","humus","lupine","=erbsenprotein","bohneneintopf","=dal"],n:["grune bohnen","brechbohnen","bohnen grun","prinzessbohnen","bohnenkraut","kaffeebohne"],w:1,
   b:[62,66,62,74],g:["Pflanzliches Protein & Carbs","Ballaststoffe & Protein sättigen","Ballaststoffe & Zink","Langsame Carbs für lange Energie"],x:["Hülsenfrucht, nicht primal","Hülsenfrucht, nicht primal","Hülsenfrucht, nicht primal","Kann blähen – gut kochen"]},
  {id:"fermentedveg",k:["chucrut","choucroute","sauerkraut","kimchi","=kombucha","milchsauer","fermentiert"],w:1,
   b:[74,92,94,72],g:["Mikronährstoffe für die Regeneration","Kaum Kalorien, viel Geschmack","Fermentiert – gut für Darm & Haut","Vitamin C & Ballaststoffe"],x:["Kaum Protein","","","Wenig Kalorien – keine Energiequelle"]},
  {id:"sweetpotato",k:["susskartoffel","batate","=yams","sweet potato"],w:1,
   b:[82,78,95,96],g:["Saubere Carbs fürs Training","Sättigt bei moderaten Kalorien","Viel Beta-Carotin für die Haut","Langsame, saubere Carbs"],x:["Kaum Protein","","",""]},
  {id:"potato",k:["kartoffel","erdapfel","drillinge","pellkartoffel","salzkartoffel","bratkartoffel","maniok","cassava","pastinake","topinambur","=knolle","kartoffelpuree","kartoffelbrei"],w:1,
   b:[78,78,76,92],g:["Saubere Carbs fürs Training","Sättigt stark bei wenig Kalorien","Vitamin C & Kalium, glutenfrei","Lang anhaltende, saubere Carbs"],x:["Kaum Protein","","",""]},
  {id:"oats",k:["avoine","avena","=avoines","=oat","oatcake","oatmeal","porridge oats","flocons d'avoine","овесени","^hafer","porridge","haferbrei","haferflocken","=oats","overnight oats","haferkleie","=musli","bircher","fruchtmusli","fruchte musli","basis musli"],w:1,
   b:[86,78,80,96],g:["Gute Carbs + etwas Protein","Ballaststoffe halten lange satt","Zink & langsame Carbs – gut für die Haut","Langsame Carbs – Energie über Stunden"],x:["","~Trocken viele Kalorien – Portion wiegen","",""]},
  {id:"rice",k:["^reis","basmati","jasminreis","naturreis","vollkornreis","wildreis","parboiled","risottoreis","sushireis","=rice"],w:1,
   b:[80,66,72,88],g:["Saubere Carbs fürs Training","Glutenfrei & gut verträglich","Glutenfrei, sanft für den Körper","Gut verträgliche Stärke für Energie"],x:["Wenig Protein","~Trocken viele Kalorien – Portion wiegen","",""]},
  {id:"pseudograin",k:["sarrasin","ble noir","buckwheat","quinoa","hirse","buchweizen","amaranth","teff","sorghum"],w:1,
   b:[84,74,82,94],g:["Mehr Protein als Reis","Ballaststoffe & Protein sättigen","Glutenfrei & mineralstoffreich","Langsame Carbs & Magnesium"],x:["","~Trocken viele Kalorien – Portion wiegen","",""]},
  {id:"wholewheat",k:["vollkorn","roggen","pumpernickel","sauerteig","knackebrot","dinkelvollkorn","schwarzbrot","kornerbrot","eiweissbrot","proteinbrot","=urkorn","emmer","einkorn"],w:1,
   b:[62,56,52,68],g:["Ballaststoffreiche Carbs","Sättigende Ballaststoffe","Ballaststoffe & Zink","Vollkorn hält länger satt als Weißmehl"],x:["Gluten-Getreide, nicht primal","Gluten-Getreide, nicht primal","Gluten-Getreide, nicht primal","Gluten-Getreide, nicht primal"]},
  {id:"refined",k:["=pain","pain de mie","=pan","bauletto","biscotte","krisprolls","tartines craquantes","fette croccanti","farine","harina","semoule","=pates","coquillette","spaghettoni","maccheroni","tortiglioni","capellini","pipe rigate","risoni","nouilles","=noodles","glass noodles","=soba","pasta","=bread","=toast","brot","brotchen","semmel","schrippe","weckle","wecken","toast","baguette","ciabatta","brezel","breze","laugen","=wrap","wraps","tortilla","fladenbrot","=pita","bagel","=bun","buns","nudel","pasta","spaghetti","penne","fusilli","makkaroni","tagliatelle","farfalle","rigatoni","linguine","lasagneplatten","gnocchi","couscous","bulgur","=mehl","weizenmehl","dinkelmehl","spatzle","knodel","kloss","grieß","griess","paniermehl","=focaccia","naan","=toastbrot"],w:1,lq:1,
   b:[42,28,28,38],g:["Schnelle Carbs nach dem Training","","","Schnelle Carbs"],x:["Weißmehl: wenig Nährstoffe","Weißmehl macht schnell wieder hungrig","Weißmehl lässt Blutzucker springen","Schnelle Energie, schnelles Tief"]},
  {id:"driedfruit",k:["getrocknet","trockenobst","trockenfrucht","dattel","rosine","sultanine","bananenchips","apfelchips","=cranberries","softfeige","trockenpflaume","aprikose getrocknet","mango getrocknet","gojibeere","goji"],w:1,
   b:[50,28,46,64],g:["Schnelle Carbs fürs Training","","Etwas Mineralstoffe","Schnelle, natürliche Energie"],x:["Kaum Protein","Sehr viel Zucker auf kleinem Raum","Konzentrierter Zucker","Nur kleine Mengen – viel Zucker"]},
  {id:"berries",k:["beere","erdbeer","himbeer","heidelbeer","blaubeer","brombeer","johannisbeer","stachelbeer","=acai","granatapfel","cranberry","holunder"],n:["kaffeebohne"],w:1,
   b:[72,86,96,86],g:["Antioxidantien für die Regeneration","Wenig Zucker für Obst","Antioxidantien – Top für die Haut","Natürlicher Zucker + Ballaststoffe"],x:["Kaum Protein","","",""]},
  {id:"banana",k:["banane","banana"],w:1,
   b:[80,64,78,95],g:["Perfekte Carbs vor dem Training","Süß & sättigend","Vitamin B6 & Kalium","Schnelle, natürliche Energie + Kalium"],x:["Kaum Protein","Mehr Zucker als andere Früchte","Recht viel Fruchtzucker",""]},
  {id:"vitc",k:["orange","mandarine","clementine","kiwi","grapefruit","zitrone","limette","pomelo","guave","=sanddorn"],w:1,
   b:[70,80,94,84],g:["Vitamin C für die Regeneration","Wenig Kalorien, viel Wasser","Viel Vitamin C für Kollagen","Natürlicher Zucker + Vitamin C"],x:["Kaum Protein","","",""]},
  {id:"fruit",k:["=pomme","pommes ","compote","=apple","pineapple","=pina","piña","=fruit","fruits","=frutta","myrtille","framboise","fraise","abricot","peche","cerise","=poire","apfel","apfelmus","birne","traube","kirsche","pfirsich","nektarine","aprikose","pflaume","zwetschge","zwetsche","melone","mango","ananas","papaya","feige","=obst","obstsalat","physalis","litschi","maracuja","passionsfrucht","rhabarber","quitte","kaki","sharon","drachenfrucht","=fruchte"],n:["apfelessig","mangold","nektarinen saft"],w:1,
   b:[68,72,84,86],g:["Schnelle Carbs rund ums Training","Süß, aber mit Ballaststoffen","Vitamine & Antioxidantien","Natürlicher Zucker + Ballaststoffe"],x:["Kaum Protein","Fruchtzucker – in Maßen","",""]},
  {id:"skinveg",k:["epinard","spinach","potiron","courge","pumpkin","carrot","=carotte","carottes","pomodor","=tomato","tomatoes","=sugo","=polpa","arrabbiata","marinara","napoletana","pimiento","poivron","patate douce","karotte","mohre","=rube","rote bete","rote beete","rote rube","spinat","grunkohl","mangold","paprika","tomate","tomatenmark","passata","tomatensauce","tomatensosse","kurbis","hokkaido","butternut","brokkoli","broccoli","rotkohl","rucola","feldsalat","=kresse","wildkrauter","brunnenkresse","pak choi","=kale"],n:["kurbiskern"],w:1,
   b:[80,95,97,76],g:["Mikronährstoffe für die Regeneration","Viel Volumen, kaum Kalorien","Vitamine & Antioxidantien für die Haut","Vitamine & Ballaststoffe"],x:["Kaum Protein","","","Wenig Kalorien – allein keine Energie"]},
  {id:"veg",k:["asparagus","asperge","cornichon","pepinillo","olives","azeitona","aceituna","petits pois","=pois","haricots verts","gingembre","ginger shot","=ginger","brocoli","courgette","champignon","=funghi","legumes","verdure","gurke","zucchini","aubergine","blumenkohl","rosenkohl","kohlrabi","weisskohl","wirsing","spitzkohl","chinakohl","=kohl","sellerie","spargel","pilz","champignon","shiitake","austernpilz","zwiebel","schalotte","knoblauch","lauch","porree","fenchel","=salat","salatherz","eisberg","kopfsalat","romana","chicoree","radicchio","endivie","artischocke","okra","=gemuse","gemuse","grune bohnen","brechbohnen","prinzessbohnen","zuckerschoten","=erbsen","erbse","=mais","zuckermais","radieschen","rettich","rucola","ingwer","oliven","kapern","gewurzgurke","sprossen","keimlinge","bambus","pak choi","staudensellerie","fruhlingszwiebel"],n:["ingwertee","ingwer tee"],w:1,
   b:[76,94,90,72],g:["Mikronährstoffe für die Regeneration","Viel Volumen, kaum Kalorien","Vitamine & Antioxidantien","Vitamine & Ballaststoffe"],x:["Kaum Protein","","","Wenig Kalorien – allein keine Energie"]},
  {id:"honey",k:["=miel","=miele","erable","=maple","honig","honey","ahornsirup","maple"],w:1,
   b:[38,22,32,54],g:["Schnelle Carbs nach dem Training","","","Natürlicher Zucker, besser als Haushaltszucker"],x:["Trotzdem purer Zucker","Purer Zucker, null Sättigung","Zucker kann Unreinheiten fördern","Trotzdem purer Zucker"]},
  {id:"coffeemilk",k:["cappuccino","=latte","latte macchiato","milchkaffee","eiskaffee","frappuccino","frappe","flat white","chai latte","mocca","mokka","caffe latte","cafe au lait","=macchiato","kaffeegetrank","coffee drink"],d:1,
   b:[48,46,34,48],g:["","","","Wacher Kick"],x:["Milch & oft Zucker","Kalorien aus Milch & Sirup","Milch im Kaffee – bei Hautfokus lieber schwarz","Leiht Energie, ersetzt keinen Schlaf"]},
  {id:"coffee",k:["=cafe","=caffe","nescafe","arabica","cafe moulu","caffe in grani","kaffee","espresso","cold brew","=americano","filterkaffee","=coffee","=lungo","=ristretto"],w:1,
   b:[66,78,58,66],g:["Koffein kann die Leistung steigern","Schwarz fast ohne Kalorien","","Wacher Kick – am besten vor 14 Uhr"],x:["","","Zu viel stört den Schlaf – wichtig für die Haut","Leiht Energie, ersetzt keinen Schlaf"]},
  {id:"tea",k:["=tee","tee ","teebeutel","gruner tee","grunter tee","grüntee","gruntee","krautertee","fruchtetee","pfefferminz","kamille","matcha","rooibos","schwarztee","=chai","=tea","ingwertee","mate tee","fencheltee","hagebutte"],w:1,
   b:[76,86,88,76],g:["Kalorienfreies Getränk","Ohne Kalorien","Antioxidantien, ohne Zucker","Sanfter Muntermacher"],x:["","","",""]},
  {id:"spice",k:["moutarde","mustard","senape","mostaza","levure","=hefe","backpulver","yeast","vinaigre","aceto","=basilic","herbes","fines herbes","pfeffer","gewurz","=zimt","kurkuma","curcuma","oregano","basilikum","petersilie","schnittlauch","dill","thymian","rosmarin","krauter","senf","essig","apfelessig","balsamico","vanille","muskat","kreuzkummel","kummel","koriander","chiliflocken","cayenne","=paprikapulver","knoblauchpulver","zitronensaft","limettensaft","hefeflocken"],w:1,
   b:[74,78,80,74],g:["Würzt fast ohne Kalorien","Würzt fast ohne Kalorien","Würzt fast ohne Kalorien","Würzt fast ohne Kalorien"],x:["","","",""]},
  {id:"water",k:["=eau","=acqua","=agua","perrier","evian","volvic","vittel","cristaline","san pellegrino","wasser","mineral","sprudel","heilwasser","quellwasser","=water","tafelwasser"],w:1,
   b:[90,96,96,90],g:["Wichtig für Kraft & Regeneration","Null Kalorien, füllt den Magen","Gut hydriert wirkt Haut frischer","Schon wenig Durst macht müde"],x:["","","",""]}
];
// Besondere Hinweise je Lebensmittel (ersetzen den ersten Gut-Text für dieses Ziel)
const R_NOTES=[
  ["skin",["karotte","mohre"],"Beta-Carotin für einen frischen Teint"],["skin",["tomate","passata","tomatenmark"],"Lycopin – gut für die Haut"],
  ["skin",["spinat","grunkohl","mangold"],"Vitamin A & C für die Haut"],["skin",["paprika"],"Sehr viel Vitamin C für Kollagen"],
  ["skin",["kurbis","hokkaido","butternut"],"Beta-Carotin für die Haut"],["skin",["rote bete","rote beete","rote rube"],"Antioxidantien für die Haut"],
  ["skin",["brokkoli","broccoli"],"Vitamin C & Sulforaphan"],["skin",["walnuss","chia","leinsamen","hanfsamen"],"Omega-3 aus Pflanzen für die Haut"],
  ["skin",["paranuss"],"Selen für die Haut"],["skin",["kurbiskern"],"Zink für die Haut"],["skin",["mandel","haselnuss","sonnenblumenkern"],"Vitamin E für die Haut"],
  ["skin",["olivenol","olive oil"],"Polyphenole & gute Fette für die Haut"],["skin",["auster"],"Zink – Top für die Haut"],
  ["skin",["gruner tee","grunter tee","gruntee","matcha"],"Grüner Tee: Antioxidantien für die Haut"],["skin",["heidelbeer","blaubeer"],"Antioxidantien – Top für die Haut"],
  ["energy",["krautertee","fruchtetee","pfefferminz","kamille","rooibos","fencheltee","hagebutte"],"Koffeinfrei – gut für den Abend"],
  ["energy",["matcha","gruner tee","grunter tee","gruntee"],"Sanftes Koffein ohne Crash"],
  ["muscle",["rind","steak","rinderhack"],"Kreatin, Eisen & Protein"],["muscle",["haferflocken","^hafer"],"Hafer: Protein, Eisen & Zink"],
  ["lose",["kokoswasser"],"Kaum Kalorien, viele Elektrolyte"],["energy",["kokoswasser"],"Elektrolyte & leichte Carbs"],
  ["skin",["ziegen","schafs","schaf ","hirtenkase","=feta"],"Schaf/Ziege für viele besser verträglich"]
];
// Diese Arten haben ihren Zucker schon im Grundwert (kein doppelter Abzug)
const R_SUGAR_OK=["fruit","berries","banana","vitc","driedfruit","juice","vegjuice","honey","sugar","sweets","softdrink","cereal","darkchoc","coffeemilk","proteinbar"];
// Natürlich fettreiche Arten: beim Abnehmen nur halber Kalorien-Abzug (steckt schon im Grundwert)
const R_FATTY=["nuts","coconut","avocado","goodfat","butter","peanut","darkchoc","cheese","seedoil","margarine","chips","sweets"];
// Stichwörter einmal normalisieren (wie die Produktnamen)
R_CATS.forEach(c=>{ const nk=k=>{ const p=/^[=^]/.test(k)?k[0]:"", b=p?k.slice(1):k; return p+NORM(b); }; c.k=(c.k||[]).map(nk); c.n=(c.n||[]).map(nk); });
R_NOTES.forEach(n=>{ n[1]=n[1].map(k=>{ const p=/^[=^]/.test(k)?k[0]:""; return p+NORM(p?k.slice(1):k); }); });

function rHit(h,words,list){
  return list.some(k=>k[0]==="="?words.includes(k.slice(1)):k[0]==="^"?words.some(w=>w.startsWith(k.slice(1))):h.includes(k));
}
function foodCat(item){
  const raw=String(item.name||""), h=" "+NORM(raw)+" ", words=h.trim().split(/[^a-z0-9%&]+/).filter(Boolean);
  for(const c of R_CATS){
    if(c.n.length&&rHit(h,words,c.n)) continue;
    if(c.f?c.f(h,raw,c):rHit(h,words,c.k)) return c;
  }
  return null;
}
// Kleines Thema je Text, damit nicht zweimal dasselbe gesagt wird
function rTopic(t){
  t=t.toLowerCase();
  if(/süßstoff/.test(t)) return "sweet";
  if(/ballaststoff/.test(t)) return "fiber";
  if(/protein/.test(t)) return "protein";
  if(/zucker/.test(t)) return "sugar";
  if(/kalorien/.test(t)) return "kcal";
  if(/salz/.test(t)) return "salt";
  if(/verarbeit|zusätz|fertig|industri|ersatz|isolat/.test(t)) return "proc";
  if(/milch|molke/.test(t)) return "dairy";
  if(/gluten/.test(t)) return "gluten";
  if(/omega/.test(t)) return "omega";
  if(/ballaststoff/.test(t)) return "fiber";
  if(/haltung|bio[ -:]|wildfang|qualität|günstigmarke|msc/.test(t)) return "quality";
  if(/carbs|stärke/.test(t)) return "carbs";
  return t;
}
function scoreFood(item){
  const g=state.profile.goal, gi=Math.max(0,R_GOALS.indexOf(g));
  const pr=+item.protein||0, kc=+item.kcal||0, cb=+item.carbs||0, fa=+item.fat||0, su=+item.sugar||0, fi=+item.fiber||0, sa=+item.salt||0;
  const nova=+item.nova||0, heavy=nova>=4||(!nova&&item.processed), pk=kc>0?pr*100/kc:0;
  const h=" "+NORM(item.name||"")+" ", words=h.trim().split(/[^a-z0-9%&]+/).filter(Boolean);
  let cat=foodCat(item);
  if(cat&&cat.id==="mixedmeal"&&heavy) cat=R_CATS.find(c=>c.id==="readymeal");
  // Gerichte mit Fleisch/Fisch (z. B. "Bauerntopf mit Hackfleisch", "Tagliatelle Wildlachs") als Gericht werten
  if(cat&&R_ANIMAL.includes(cat.id)&&!['broth','organ'].includes(cat.id)&&/(sauce|sosse|topf|salatbox|schlemmerfilet|a la |bordelaise|gratin|lasagne|tagliatelle|nudel|pasta|spaghetti|pizza|wrap|sandwich|burger|risotto|fertiggericht|mahlzeit|menu)/.test(h)) cat=R_CATS.find(c=>c.id===(heavy?"readymeal":"mixedmeal"));
  const id=cat?cat.id:"", pros=[], cons=[];
  const good=(t,w)=>{ if(t) pros.push({t,w}); }, bad=(t,w)=>{ if(t) cons.push({t,w}); };
  let score;
  // Texte der Kategorie: Vorsätze ~ + % prüfen
  const catTexts=(s,fn,w0)=>String(s||"").split("|").forEach((t,i)=>{
    if(!t) return; const p=t[0];
    if(p==="~"){ if(kc<300) return; t=t.slice(1); }
    else if(p==="+"){ if(pr<12) return; t=t.slice(1); }
    else if(p==="%"){ if(fa<10) return; t=t.slice(1); }
    fn(t,w0-i);
  });
  if(cat){
    score=cat.b[gi];
    let gTxt=cat.g[gi];
    const note=cat.w&&R_NOTES.find(n=>n[0]===g&&rHit(h,words,n[1]));
    if(note) gTxt=note[2]+(gTxt?"|"+gTxt.split("|").slice(1).join("|"):"");
    catTexts(gTxt,good,12); catTexts(cat.x[gi],bad,12);
    // Sonderfälle innerhalb einer Art
    if(id==="softdrink"&&su<1){ score+=[8,18,8,6][gi]; cons.length=0; bad("Süßstoffe & Zusätze statt echter Nahrung",12); if(g==="lose") good("Ohne Kalorien",8); }
    if(id==="softdrink"&&/(energy|red bull|monster)/.test(h)&&g==="energy") bad("Koffein auf Pump, danach Tief",13);
    if(id==="juice"&&/smoothie/.test(h)){ score+=6; }
    if(id==="cheese"&&/(ziegen|schafs|schaf |hirtenkase|feta)/.test(h)&&g==="skin") score+=14;
    // Milch & Joghurt: Vollfett ist naturbelassener und für die Haut besser als fettarm (Magermilch steht eher mit Unreinheiten in Verbindung)
    if(id==="dairy"||id==="kefir"){
      const low=fa<2||/(fettarm|mager|entrahmt|0,1|0,3|1,5|light|leicht)/.test(h), full=!low&&(fa>=3||/(vollmilch|vollfett|3,5|3,8|4,0)/.test(h));
      if(full){ score+=[2,0,10,3][gi]; good(g==="skin"?"Vollfett: besser für die Haut als fettarm":"Vollfett: naturbelassener",g==="skin"?13:11); }
      else if(low){ score+=[-1,2,-6,-2][gi]; if(g==="skin") bad("Fettarm: für die Haut eher ungünstiger",11); else if(g==="lose") good("Fettarm: weniger Kalorien",9); }
    }
    if(id==="wholewheat"&&/sauerteig/.test(h)){ score+=5; good("Sauerteig: besser verträglich",8); }
    if(id==="tea"&&g==="energy"&&/(kraut|frucht|pfefferminz|kamille|rooibos|fenchel|hagebutte)/.test(h)) score-=6;
    // Naturbelassenes Lebensmittel, aber stark verarbeitet (z. B. Fruchtjoghurt mit Zusätzen)
    if(cat.w&&heavy){ score-=nova>=4?16:10; bad(R_ANIMAL.includes(id)&&sa>=1.2?"Aufschnitt: Salz & Zusätze":"Stark verarbeitet mit Zusätzen",14); }
  } else {
    // Unbekannt: nach Verarbeitungsgrad (NOVA) einschätzen
    const B={1:[70,72,74,70],2:[56,54,56,58],3:[54,52,50,52],4:[30,26,20,26]};
    score=(B[nova]||(item.processed?[36,30,24,30]:[58,58,58,58]))[gi];
    if(nova===1) good("Unverarbeitet",10);
    if(heavy) bad("Stark verarbeitet mit Zusätzen",14);
    if(g==="muscle"&&pr<3&&kc>50){ score-=6; bad("Kaum Protein",6); }
  }
  const add=(v,t,isGood)=>{ v=Math.round(v); if(!v) return; score+=v; (v>0?good:bad)(t,Math.abs(v)); };
  const sugarOk=R_SUGAR_OK.includes(id), fatty=R_FATTY.includes(id);
  // Pluspunkte aus Nährwerten nur für echte, naturbelassene Lebensmittel (nicht für Pommes, Toast & Co.)
  const real=(!cat||(cat.w&&!cat.lq))&&!heavy, carbFood=cb>=15&&cb*4>=kc*0.4;
  const addG=(v,t)=>{ if(real) add(v,t); };
  // Nährwerte je Ziel
  if(g==="muscle"){
    if(pk>=8&&pr>=8) addG(Math.min(8,(pk-8)*0.6),"Viel Protein, wenig Kalorien");
    else if(pr>=20) addG(3,"Viel Protein");
    if(!sugarOk&&su>10) add(-Math.min(14,(su-10)*0.8),"Viel Zucker");
    if(carbFood&&fi>=2&&su<=cb*0.25) addG(3,"Gute Carbs mit Ballaststoffen");
  } else if(g==="lose"){
    if(kc>350&&!["whey","spice"].includes(id)) add(-Math.min(14,(kc-350)/20)*(fatty?0.5:1),"Sehr kalorienreich");
    else if(kc>0&&kc<=60) addG(4,"Kaum Kalorien");
    if(pk>=10&&pr>=8) addG(Math.min(8,(pk-10)*0.5+3),"Viel Protein, wenig Kalorien");
    if(fi>=5) addG(3,"Viele Ballaststoffe – sättigt");
    if(!sugarOk&&su>8) add(-Math.min(15,su-8),"Viel Zucker");
  } else if(g==="skin"){
    if(!sugarOk&&su>8) add(-Math.min(16,(su-8)*1.2),"Viel Zucker – kann Unreinheiten fördern");
    if(!(cat&&cat.d)&&!["ersatz","plantmilk","soy"].includes(id)&&foodHas(item,"lak")) add(-8,"Enthält Milch – kann Haut reizen");
    if(fi>=4) addG(2,"Ballaststoffe");
  } else {
    if(!sugarOk&&su>12) add(-Math.min(15,su-12),"Zucker-Peak, danach Tief");
    if(carbFood&&cb>=20&&fi>=3&&su<cb*0.3) addG(4,"Langsame Carbs für stabile Energie");
    if(pr>=10) addG(2,"Protein hält die Energie stabil");
  }
  if(sa>1.5&&id!=="spice") add(-Math.min(10,(sa-1.5)*4),g==="skin"?"Viel Salz – kann aufschwemmen":"Viel Salz");
  // Primal-Blick: Soja, Süßstoffe, Pflanzenöle im Namen
  if(!["soy","ersatz","sauce","plantmilk"].includes(id)&&/(soja|\bsoy\b)/.test(h)) add(-8,"Enthält Soja – nicht naturbelassen");
  if(heavy&&/(zero|light|zuckerfrei|sugar free|ohne zucker|sussstoff|sussungsmittel|sucralose|aspartam)/.test(h)&&id!=="softdrink") add(-6,"Süßstoffe statt echter Nahrung");
  if(!["seedoil","margarine"].includes(id)&&/(sonnenblumenol|rapsol|palmol|pflanzenol)/.test(h)) add(-5,"Mit raffiniertem Pflanzenöl");
  rateQuality(item,id,h,(v,t,w)=>{ score+=v; (v>0?good:bad)(t,w); });
  // Persönliches aus dem Fragebogen
  const ea=state.coach.answers.gesundheit||{};
  const MEATC=["fattyfish","leanfish","poultry","redmeat","organ","broth","processedmeat"], ANIC=MEATC.concat(["egg","protdairy","kefir","dairy","cheese","butter","whey"]);
  const plant=["ersatz","plantmilk","soy"].includes(id);
  const meat=!plant&&(MEATC.includes(id)||foodHas(item,"meat")), animal=meat||!plant&&(ANIC.includes(id)||foodHas(item,"lak")||foodHas(item,"egg"));
  const P=(v,t)=>{ v=Math.round(v); if(!v) return; score+=v; (v>0?good:bad)(t,50+Math.abs(v)); };
  let cap=98;
  if(ea.stil==="Vegan"&&animal){ P(-40,"Passt nicht zu vegan"); cap=15; }
  else if(ea.stil==="Vegetarisch"&&meat){ P(-40,"Passt nicht zu vegetarisch"); cap=15; }
  if(ea.stil==="Wenig Fleisch"&&(id==="redmeat"||id==="processedmeat"||RED_MEAT.some(x=>h.includes(x)))) P(-12,"Du willst weniger Fleisch");
  const fokus=foodFocus(), intol=ea.intol||[];
  const lak=["protdairy","kefir","dairy","cheese","whey","coffeemilk"].includes(id)||foodHas(item,"lak")&&!plant;
  const glu=["wholewheat","refined"].includes(id)||foodHas(item,"glu");
  const nut=["nuts","peanut"].includes(id)||foodHas(item,"nut");
  if(intol.includes("Laktose")&&lak&&!/(laktosefrei|lactosefrei)/.test(h)) P(-25,"Kann Laktose enthalten");
  if(intol.includes("Gluten")&&glu&&!/glutenfrei/.test(h)) P(-25,"Kann Gluten enthalten");
  if(intol.includes("Nüsse")&&nut) P(-30,"Kann Nüsse enthalten");
  if(fokus.includes("Weniger Zucker")&&su>5) P(-Math.min(12,su*0.6),"Viel Zucker – dein Fokus");
  if(fokus.includes("Zucker & Haut")&&su>5) P(-Math.min(10,su*0.5),"Zucker – dein Haut-Fokus");
  if(fokus.includes("Mehr Protein")&&pr>=10) P(Math.min(8,pr*0.3),"Viel Protein – dein Fokus");
  if(fokus.includes("Weniger Fertiges")&&heavy) P(-8,"Fertigprodukt – dein Fokus");
  if(fokus.includes("Weniger Salz")&&sa>0.8) P(-Math.min(10,(sa-0.5)*6),"Salzig – dein Fokus");
  if(fokus.includes("Mehr Ballaststoffe")&&fi>=4) P(Math.min(6,fi*0.6),"Ballaststoffe – dein Fokus");
  if(fokus.includes("Sättigung")&&((pr>=10&&kc<=250)||fi>=6)) P(5,"Macht lange satt");
  if(fokus.includes("Koffein am Abend")&&foodHas(item,"caf")) P(-4,"Koffein: nach 15 Uhr meiden");
  return rateOut(Math.min(cap,score),pros,cons);
}
// Höchstens 3 gute und 3 schlechte Punkte, wichtigste zuerst, jedes Thema nur einmal
function rateOut(score,pros,cons){
  const pick=l=>{ const seen=new Set(), out=[]; l.sort((a,b)=>b.w-a.w).forEach(x=>{ const k=rTopic(x.t); if(seen.has(k)||out.length>=3) return; seen.add(k); out.push(x.t); }); return out; };
  const good=pick(pros), bad=pick(cons);
  return { score:Math.max(5,Math.min(98,Math.round(score))), good, bad, reasons:[] };
}
// Gut/Schlecht-Liste für die Anzeige (gleich für Essen und Pflege)
function rateList(sc){
  const g=sc.good||[], b=sc.bad||[];
  if(!g.length&&!b.length) return `<p class="sub">${esc((sc.reasons||[]).join(" "))}</p>`;
  return `<div class="rpc">${g.map(t=>`<div class="rp"><i>✓</i><span>${esc(t)}</span></div>`).join("")}${b.map(t=>`<div class="rc"><i>✕</i><span>${esc(t)}</span></div>`).join("")}</div>`;
}

// Qualität: Bio, Weide, Freiland, Wildfang leicht besser; Günstigmarken & einfache Haltung leicht schlechter.
// Nur kleine Unterschiede (max. ±5), weil Haltung am Namen nicht sicher erkennbar ist.
const R_ANIMAL=["poultry","redmeat","processedmeat","organ","broth","fattyfish","leanfish","egg","protdairy","kefir","dairy","cheese","butter"];
const R_BIO_BRANDS=["rewe bio","edeka bio","biobio","bio bio","alnatura","gut bio","gutbio","k-bio","k bio","dmbio","dm bio","naturgut","natur gut","dennree","andechser","sobbeke","zuruck zum ursprung","enerbio","demeter","bioland","naturland","nur nur natur","schrozberger","uplander","glaserne molkerei","bio wertkost","bio sonne","bio organic","biotrend","ja! bio","spar natur pur","naturkind","alnavit","berchtesgadener land bio"];
const R_BUDGET=["ja!","=ja","gut & gunstig","gut&gunstig","gut und gunstig","k-classic","k classic","kaufland classic","=tip","jeden tag","s-budget","muhlenhof","metzgerfrisch","meine metzgerei","gut ponholz","gut drei eichen","wiltmann","penny","=milsani","=milbona","=dulano"];
function rateQuality(item,id,h,add){
  const bn=" "+NORM(item.brand||"")+" ", all=h+bn, ani=R_ANIMAL.includes(id), fish=id==="fattyfish"||id==="leanfish";
  const bw=bn.trim().split(/[^a-z0-9!&-]+/).filter(Boolean);
  const bio=/(^|[^a-z])(bio|organic|oko|demeter|bioland|naturland)([^a-z]|$)/.test(all)||R_BIO_BRANDS.some(b=>bn.includes(" "+b)||bn.trim()===b);
  const weide=/(weide|grasgefuttert|gras gefuttert|heumilch|grass fed|heu-milch|alpenmilch bio)/.test(all);
  const free=/(freiland|auslauf|haltungsform 3|haltungsform 4|haltungsform 5|haltungsstufe 3|haltungsstufe 4|aussenklima|strohschwein|neuland|premium-haltung|faire haltung|fair & gut)/.test(all);
  const wild=fish&&/(wildlachs|wildfang|wild caught|wild gefangen|^ wild|alaska)/.test(all);
  const msc=fish&&/(msc|nachhaltig gefangen|nachhaltiger fang)/.test(all);
  const low=/(stallhaltung|bodenhaltung|kafighaltung|kleingruppe|haltungsform 1|haltungsform 2|haltungsstufe 1|haltungsstufe 2|aquakultur|zuchtlachs|aus zucht)/.test(all);
  const budget=R_BUDGET.some(b=>b[0]==="="?bw.includes(b.slice(1)):bn.includes(b));
  if(ani){
    let v=0, t=[];
    if(bio){ v+=4; t.push(id==="egg"?"Bio-Eier: beste Haltung":fish?"Bio: kontrollierte Herkunft":"Bio: bessere Haltung & Futter"); }
    if(weide){ v+=bio?1:4; t.push("Weidehaltung: mehr Omega-3"); }
    if(free&&!bio){ v+=3; t.push(id==="egg"?"Freiland: bessere Haltung":"Bessere Haltung (Stufe 3+)"); }
    if(wild){ v+=4; t.push("Wildfang statt Zucht"); }
    else if(msc&&!bio){ v+=1; t.push("MSC: nachhaltiger Fang"); }
    if(v){ add(Math.min(5,v),t[0],40); return; }
    if(low){ add(-4,id==="egg"?"Einfache Haltung (Bodenhaltung)":fish?"Aus Zucht (Aquakultur)":"Einfache Haltung (Stufe 1–2)",40); return; }
    if(budget&&id!=="broth") add(-3,"Günstigmarke – Haltung meist einfach",40);
  } else if(bio&&!["sweets","softdrink","alcohol","chips","fastfood","sugar","cereal","ersatz","plantmilk","margarine","seedoil","readymeal","sauce","proteinbar"].includes(id)){
    add(2,"Bio: weniger Pestizide",20);
  }
}
