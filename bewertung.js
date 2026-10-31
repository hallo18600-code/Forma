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
  {id:"alcohol",k:["=biere","birra","cerveza","=vin","bier","=pils","radler","=wein","rotwein","weisswein","rosewein","weinschorle","gluhwein","sekt","prosecco","champagner","wodka","vodka","whisky","whiskey","=gin","=rum","likor","schnaps","aperol","=cider","doppelkorn","kornbrand","weizenbier","weissbier","hefeweizen","=helles","pilsener","bockbier","=lager","=ouzo","tequila","=alkohol"],n:["alkoholfrei","weinbeere","weintraube","weinessig","bierschinken","bierwurst","biersalami","vinaigre","essig"],
   b:[10,8,6,8],g:["","","",""],x:["Bremst Regeneration & Muskelaufbau","Leere Kalorien, macht hungrig","Entzieht Wasser, Haut wirkt fahl","Stört den Schlaf, macht müde"]},
  {id:"softdrink",k:["orangina","pulco","ginger beer","capri","aloe vera drink","=soda","oasis","schorle zero","=cola","coca","pepsi","=coke","=afri","afri cola","afri-cola","africola","limo","fanta","sprite","=energy","energydrink","energy drink","red bull","monster","eistee","ice tea","icetea","=tonic","tonic water","bitter lemon","ginger ale","=spezi","mezzo","fassbrause","fuze","fuzetea","fuze tea","=7up","schweppes","mirinda","=mate","club mate","sportgetrank","isotonisch","brause","limonade","=h2o","eistee"],n:["mate tee","energy ball","energy bites"],
   b:[10,8,6,10],g:["","","",""],x:["Zucker ohne Nährstoffe","Flüssige Kalorien machen nicht satt","Zucker kann Unreinheiten fördern","Lässt den Blutzucker stark schwanken"]},
  {id:"vegjuice",k:["karottensaft","mohrensaft","gemusesaft","rote bete saft","rote beete saft","tomatensaft","selleriesaft","gemuse saft"],n:["in tomatensaft","im tomatensaft","in tomato juice","im eigenen saft"],w:1,
   b:[45,58,88,58],g:["Mikronährstoffe für die Regeneration","Wenig Kalorien für einen Saft","Viel Beta-Carotin für die Haut","Vitamine ohne viel Zucker"],x:["Kaum Protein","Ganzes Gemüse sättigt mehr","",""]},
  {id:"nectar",k:["nektar","nectar","fruchtnektar","fruchtsaftgetrank","saftgetrank","juice drink","fruchtgetrank","multivitamingetrank"],n:["nektarine"],
   b:[24,12,24,26],g:["","","Etwas Vitamin C","Schnelle Energie"],x:["Zugesetzter Zucker, kaum Nährstoffe","Zugesetzter Zucker, flüssige Kalorien","Zugesetzter Zucker – schlechter als echter Saft","Lässt den Blutzucker stark schwanken"]},
  {id:"juice",k:["=jus","zumo","succo","saft","smoothie","schorle","=juice","direktsaft","shot","ingwershot"],n:["zitronensaft","limettensaft","saftig","nektarine","dicksaft"],w:1,
   b:[44,30,64,62],g:["Schnelle Carbs & Kalium nach dem Training","","Vitamine & Antioxidantien aus Obst","Schnelle Energie & Vitamine"],x:["Kaum Protein","Flüssige Kalorien sättigen kaum","Fruchtzucker – in Maßen: ein Glas statt einer Flasche","Ohne Ballaststoffe geht der Zucker schnell ins Blut"]},
  {id:"plantmilk",f:(h,raw,c)=>rHit(h,h.trim().split(/[^a-z0-9%&]+/),c.k)||/(hafer|mandel|reis|cashew|soja|erbsen|dinkel|oat|almond|hanf|haselnuss|hazelnut|nocciola|almendra|zobi)[ -]?(drink|milch|milk)/.test(h)||/(bevanda|napitak|leche de|lait d.?amande|boisson)/.test(h),k:["hafermilch","haferdrink","hafer drink","oat drink","mandelmilch","mandeldrink","mandel drink","reisdrink","reismilch","cashewdrink","kokosdrink","erbsendrink","dinkeldrink"],
   b:[22,32,26,28],g:["","Wenig Kalorien","",""],x:["Fast kein Protein|Ersatzdrink, nicht naturbelassen","Ersatzdrink, nicht naturbelassen|Oft Zucker aus Getreide","Ersatzdrink mit Zusätzen & Öl","Kaum echte Nährstoffe|Ersatzdrink, nicht naturbelassen"]},
  {id:"ersatz",f:h=>(/(vegan|veggie|vegetar|pflanzlich|plant.?based|fleischfrei|fleischlos|ohne fleisch|(chicken|meat|beef|fish)less|my veggie|aus erbsen|aus soja|aus weizen|aus sonnenblumen)/.test(h)||/lupine/.test(h)&&/(joghurt|jogurt|yoghurt|yogurt|drink|quark|kase|creme)/.test(h)||/(sonnenblumen|erbsen|lupinen|weizen|jackfruit)[ -]?(hack|burger|wurst|schnitzel|nugget|gyros|filet)/.test(h))&&/(burger|wurst|schnitzel|hack|nugget|aufschnitt|salami|frikadell|bulette|chicken|steak|schinken|geschnetzelt|mortadella|filet|gyros|doner|bites|fischstabchen|thunfisch|lachs|fisch|garnel|lyoner|leberwurst|cevapcici|balls|mince)/.test(h)||/(vegan|pflanzlich|plant.?based)/.test(h)&&/(kase|cheese|joghurt|jogurt|quark|skyr|sahne|butter|mayo|cuisine|alternative|creme)/.test(h)||/(seitan|beyond meat|quorn|like meat|vegetarian butcher|sojaschnetzel|soja schnetzel|garden gourmet|veganz|planted|rugenwalder vegetar)/.test(h),
   b:[22,24,12,18],g:["","","",""],x:["Ersatzprodukt aus Isolaten & Zusätzen","Ersatzprodukt, nicht naturbelassen|Oft mehr Kalorien als gedacht","Stark verarbeitet, oft Soja & Pflanzenöl","Ersatzprodukt ohne echte Nährstoffe"]},
  {id:"proteinbar",f:h=>/(protein|eiweiss)/.test(h)&&/(riegel|\bbar\b|bars|keks|cookie|pudding|crisp|chips|waffel|pancake|\beis\b|creme|mousse|brownie|snack|schoko|spread|cereal|musli|pops|balls|bites)/.test(h)&&!/(drink|shake|pulver|powder)/.test(h),
   b:[52,38,28,34],g:["Viel Protein, praktisch für unterwegs","Proteinreich","",""],x:["Stark verarbeitet, oft Süßstoffe","Kalorienreicher als er wirkt|Stark verarbeitet","Milchprotein & Zusätze – ungünstig für die Haut","Kein Ersatz für echtes Essen"]},
  {id:"whey",f:h=>/(whey|proteinpulver|eiweisspulver|protein pulver|proteinshake|protein shake|isolat|isolate|casein|clear whey)/.test(h)||/(protein|eiweiss)/.test(h)&&/(drink|shake|pulver|powder|milk|milch)/.test(h),
   b:[78,70,52,56],g:["Viel Protein, schnell nach dem Training","Viel Protein, wenig Kalorien","","Hält lange satt"],x:["Isoliertes Pulver – echtes Essen ist besser","Getrunken sättigt weniger als gegessen","Molke kann bei manchen Unreinheiten fördern","Kaum Carbs für Energie"],d:1},
  {id:"darkchoc",f:(h,raw)=>/(schokolade|schoko|chocolate|chocolat|kakao|cacao|cocoa|fondente|noir)/.test(h)&&(/(^|\D)(6[5-9]|[7-9]\d|100) ?%/.test(raw)||/(zartbitter|edelbitter|bitterschokolade|rohkakao|kakaonibs|kakao nibs|backkakao|kakaopulver|cacao nibs|raw cacao)/.test(h))&&!/(milch|keks|riegel|pudding|\beis\b|muffin|kuchen|creme|drink|trink|instant|musli|cookie|mousse|nuss|praline)/.test(h),
   b:[50,40,62,64],g:["Viel Kakao, weniger Zucker als Milchschoko","Weniger Zucker, kleine Menge reicht","Kakao liefert Antioxidantien","Kakao und Fett liefern gleichmäßige Energie|Etwas natürliches Koffein"],x:["Wenig Protein für die Kalorien","~Sehr kalorienreich","Etwas Zucker – in Maßen","Nur in kleinen Mengen"]},
  {id:"ricecake",k:["rice cake","galettes de riz","galette de riz","tortitas de arroz","reiswaffel","maiswaffel","linsenwaffel","kichererbsenwaffel","erbsenwaffel","reiscracker","puffreis","dinkelwaffel","reis waffel","mais waffel"],
   b:[34,36,38,40],g:["Leichte Carbs vor dem Training","Wenig Kalorien pro Stück","Glutenfrei","Schnell verfügbare Carbs"],x:["Kaum Protein & Nährstoffe","Puffreis lässt Blutzucker springen","Stark verarbeiteter Puffreis","Schnelle Carbs ohne Ballaststoffe"]},
  {id:"sugar",k:["confiture","confitura","=doce","=jam","conserve","fruit spread","sucre","cassonade","azucar","zucchero","=syrup","=sirop","grenadine","=zucker","rohrzucker","puderzucker","rubenzucker","haushaltszucker","kokosblutenzucker","vanillezucker","gelierzucker","kandis","sirup","agavendicksaft","birnendicksaft","marmelade","konfiture","fruchtaufstrich","gelee","=dulce","zuckerrubensirup","glukose","fruktose","dextrose","traubenzucker"],n:["ahornsirup","erable","maple","sirop de agave","weniger zucker","wenig zucker","ohne zucker","zuckerreduziert","zuckerfrei","ohne zuckerzusatz","maiz","mais dulce"],
   b:[10,8,6,12],g:["","","",""],x:["Purer Zucker ohne Nährstoffe","Purer Zucker, macht nicht satt","Zucker kann Unreinheiten fördern","Lässt den Blutzucker stark schwanken"]},
  {id:"sweets",k:["vollmilch schokolade","milch schokolade","weisse schokolade","biscuit","biscoff","speculoos","madeleine","=sable","sables","tartelette","=cake","bueno","ferrero","rocher","toffifee","mon cheri","=mars","maltesers","toblerone","celebrations","tic tac","mentos","knoppers","jaffa","prinzenrolle","magnum","=glace","glaces","gelato","helado","crema di nocciol","hazelnut spread","pate a tartiner","bionella","noisetta","custard","creme brulee","creme dessert","galette","=boudoirs","gocciole","baiocchi","abbracci","pan di stelle","=lion","schaumwaffel","kipferl","cinnamon roll","rollitos de canela","croissant","brioche","schokolade","schoko","chocolate","nutella","nougat","gummi","haribo","bonbon","lakritz","marshmallow","toffee","karamell","caramel","praline","marzipan","keks","cookie","biskuit","zwieback","platzchen","lebkuchen","stollen","kuchen","torte","muffin","donut","doughnut","brownie","croissant","plunder","strudel","krapfen","=berliner","waffel","pfannkuchen","crepe","pancake","=eis","eiscreme","speiseeis","eiskonfekt","fruchteis","wassereis","milcheis","stieleis","softeis","sahneeis","eis am stiel","kuvertur","pralinen","sorbet","pudding","dessert","tiramisu","mousse","milchreis","griesbrei","grießbrei","quarkballchen","quarkkeulchen","riegel","snickers","twix","bounty","kitkat","kit kat","duplo","hanuta","milka","ritter sport","kinder","m&m","smarties","oreo","leibniz","prinzen rolle","kekse","fruchtschnitte","mochi","baklava","schaumkuss","dickmann","vanilleeis","schokoeis","erdbeereis","fruchtgummi","weingummi","gummibar","goldbar","lolly","=drops","pastillen","schaumzucker","nussknacker"],n:["sussholz","sukartoffel","susskartoffel","sußkartoffel","eisberg","eiswurfel","kuchenkrauter"],
   b:[12,8,8,12],g:["","","",""],x:["Viel Zucker, kaum Protein","Viele Kalorien, macht nicht satt","Zucker kann Unreinheiten fördern","Zucker macht danach oft müde"]},
  {id:"cereal",k:["corn flakes","=flakes","bran flakes","weetabix","tresor","=trix","cereales","cereals","=cereal","all bran","fitness","cornflakes","frosties","smacks","=pops","loops","crunchy","knuspermusli","knusper","granola","cerealien","fruhstucksflocken","choco","cini minis","nesquik","special k","chocapic","=crisp"],n:["erdnussbutter","peanut butter","nussmus","mandelmus","erdnussmus","cashewmus"],
   b:[20,14,12,18],g:["","","",""],x:["Gezuckerte Flocken, wenig Protein","Viel Zucker, macht nicht lange satt","Zucker & Weißmehl – ungünstig für die Haut","Schnelle Energie, schneller Absturz"]},
  {id:"chips",k:["pufuleti","saltletts","pretzel","=sticks","tyrrell","potato wedges","chips","flips","salzstangen","salzbrezel","=cracker","cracker","popcorn","nachos","tortilla chips","knabber","erdnussflips","crisps","pringles","chipsfrisch","snack mix","partymix","=tuc","bretzel"],
   b:[12,8,10,12],g:["","","",""],x:["Leere Kalorien ohne Protein","Sehr kalorienreich und macht kaum satt","Frittiert, viel Salz & Pflanzenöl","Fett & Salz machen träge"]},
  {id:"fastfood",k:["pizza","doner","kebab","durum","burger","pommes","fritten","currywurst","nuggets","chicken wings","hot dog","hotdog","kroketten","rosti","kartoffelpuffer","reibekuchen","falafel","frittiert","backfisch","fischstabchen","=nuggets","fast food","=mcdonald","big mac","whopper","flammkuchen","calzone","=tacos","burrito","quesadilla","fried"],n:["hofburger","pizzasauce","pizza sauce","pizzatomaten"],
   b:[28,16,12,20],g:["","","",""],x:["Weißmehl und Frittierfett, wenig Nährstoffe","Hohe Kaloriendichte, schnell wieder hungrig","Frittiertes & Fertiges – ungünstig für die Haut","Schwer im Magen, macht träge"]},
  {id:"readymeal",k:["bouillon","=kub","=brodo","caldo","ramen","ramyun","nouilles instant","cassoulet","mousline","puree delice","velute","cream of","fertiggericht","fertig","=instant","instant","terrine","nudelsnack","5 minuten","mikrowelle","tiefkuhlgericht","lasagne","maultasche","cordon bleu","paniert","panade","=schnitzel","wiener schnitzel","kartoffelsalat","nudelsalat","fleischsalat","eiersalat","wurstsalat","thunfischsalat","geflugelsalat","krautsalat","coleslaw","bruhwurfel","suppenwurfel","gekornte","fix fur","=fix","tutensuppe","gemusebruhe","gemuse bruhe","=bruhe","klare bruhe","bruhpulver","noodle cup","cup noodle","minestrone","tortelli","cannelloni","asia nudeln","yum yum","cup noodles","ravioli","tortellini","tortelloni","cappelletti","agnolotti","girasoli","mezzelune","pelmeni","pierogi","dumpling","gyoza","wan tan","wantan","fruhlingsrolle","kasespatzle","schupfnudeln","schlemmerfilet","schlemmer filet","=schlemmer","frikadelle","bulette","fleischpflanzerl","cevapcici","=gyros"],n:["lasagneplatten","kaffee","coffee","espresso","cappuccino","kakao","haferflocken","oats","tee"],
   b:[32,26,18,26],g:["","","",""],x:["Fertigprodukt mit Zusätzen","Versteckte Kalorien in Soße & Panade","Viel Salz & Zusätze","Fertigprodukt, macht schnell müde"]},
  {id:"mixedmeal",k:["gulasch","chili con carne","eintopf","=suppe","suppe","curry","bolognese","auflauf","=bowl","risotto","ragout","geschnetzeltes","shakshuka","carbonara","omelett","ratatouille","pfanne","stew","=dal","=dhal"],n:["hummus","currypulver","currypaste","curry paste","currysauce","currywurst","aufstrich","streichcreme","pickle","gratinkase"],w:1,
   b:[70,66,66,70],g:["Warme Mahlzeit aus echten Zutaten","Sättigende warme Mahlzeit","Aus echten Zutaten statt Fertigprodukt","Ausgewogene warme Mahlzeit"],x:["","","",""]},
  {id:"sauce",k:["vinaigrette","mayonesa","majo","majonez","sriracha","harissa","=salsa","sos de soia","soy sauce","chilli oil","chili oil","maggi wurze","ketchup","mayonnaise","=mayo","remoulade","dressing","grillsauce","bbq","barbecue","=sauce","sosse","sauce","pesto","aufstrich","dip","aioli","tzatziki","hollandaise","currysauce","sojasauce","teriyaki","sweet chili","=chutney","salatcreme","streichcreme"],n:["tomatensauce","tomatensosse","passata","senf"],
   b:[28,20,20,28],g:["","","",""],x:["Fertigsoße mit Zucker & Öl","Versteckte Kalorien aus Öl & Zucker","Zucker, Salz & Pflanzenöl","Kaum Nährstoffe"]},
  {id:"margarine",k:["margarine","=rama","becel","=latta","halbfettmargarine","streichfett","pflanzenfett","=sanella","bratfett","frittierfett","palmfett","kokosfett gehartet","plattenfett","kaffeeweisser","coffee creamer","=creamer"],
   b:[10,10,6,10],g:["","","",""],x:["Industriefett statt echter Butter","Industriefett, viele Kalorien","Raffinierte Pflanzenfette – ungünstig für die Haut","Industriefett ohne Nährstoffe"]},
  {id:"seedoil",k:["sunflower oil","rapeseed oil","huile de tournesol","huile de colza","isio","canola","vegetable oil","sonnenblumenol","rapsol","distelol","maiskeimol","pflanzenol","speiseol","erdnussol","sojaol","traubenkernol","palmol","=bratol","frittierol","sonnenblumen ol","raps ol","sesamol","sesam ol"],
   b:[20,16,10,18],g:["","","",""],x:["Raffiniertes Samenöl, nicht naturbelassen","~Sehr kalorienreich|Raffiniertes Samenöl","Viel Omega-6, wenig Omega-3|Raffiniertes Samenöl","Raffiniertes Samenöl, nicht naturbelassen"]},
  {id:"coconut",k:["=coco","noix de coco","lait de coco","vita coco","kokos","coconut"],n:["kokosfett gehartet"],w:1,
   b:[52,52,94,84],g:["Natürliches Fett aus der Kokosnuss","MCT-Fette sättigen gut","Kokosfett ist gut für die Haut","MCT-Fette liefern schnell Energie"],x:["Kaum Protein","~Sehr kalorienreich – sparsam","",""]},
  {id:"goodfat",k:["avocado ol","oliven ol","lein ol","walnuss ol","kurbiskern ol","hanf ol","huile d'olive","huile d olive","aceite de oliva","extra vergine","vierge extra","huile de noix","olivenol","olive oil","olivenoel","=ghee","butterschmalz","avocadool","leinol","walnussol","hanfol","schmalz","=talg","rindertalg","mct ol","mct-ol","kurbiskernol","=olio","olive extra","kakaobutter","mct","=c8"],w:1,
   b:[48,50,84,74],g:["Natürliches Fett zum Kochen","Natürliches Fett – sparsam gut","Gute Fette für geschmeidige Haut","Fett liefert lange Energie"],x:["Kein Protein","~Sehr kalorienreich – sparsam","",""]},
  {id:"peanut",k:["cacahuete","cacahuetes","mani ","erdnuss","peanut"],w:1,
   b:[60,44,50,64],g:["Viel Protein für eine Nuss","Sättigt gut – kleine Menge","","Fett und Protein liefern gleichmäßige Energie"],x:["Hülsenfrucht, nicht primal","~Sehr kalorienreich|Hülsenfrucht, nicht primal","Viel Omega-6|Hülsenfrucht, nicht primal","Hülsenfrucht, nicht primal"]},
  {id:"butter",k:["beurre","=burro","mantequilla","maslo 82","butter"],n:["buttermilch","butterkase","kakaobutter","sheabutter","nussbutter","mandelbutter","cashewbutter","peanut","erdnuss","cacahuete","arachide"],w:1,d:1,
   b:[46,46,62,66],g:["Naturbelassenes Fett","Natürliches Fett, macht satt","Natürliches Fett mit Vitamin A","Natürliche Fettquelle für lange Energie"],x:["Kein Protein","~Sehr kalorienreich – dünn streichen","Milchfett – in Maßen",""]},
  {id:"processedmeat",k:["snacki","kabanos","minisalami","geflugelwurst","putenwurst","hahnchenwurst","bratwurstchen","saftschinken","wurst","salami","schinken","=speck","speckwurfel","bacon","leberkase","fleischkase","=wiener","wurstchen","frankfurter","mortadella","lyoner","aufschnitt","chorizo","cabanossi","pastrami","corned","sulze","teewurst","mettwurst","landjager","kassler","kasseler","pfefferbeisser","=bierschinken","leberpastete","pastete","=mett","hot dog","peperoni salami","bresaola","prosciutto","serrano","=parma","coppa","nduja","=bratwurst","weisswurst","krakauer","bockwurst","bifi","jerky","beef jerky","dorrfleisch","knacker","=pastrama","rillettes","=ham","saucisse","cipollata","sunca","schinkenbraten","terrine","leberkas"],n:["wurstsalat","nussknacker","nussbeisser"],
   b:[40,32,22,28],g:["+Liefert Protein","","",""],x:["Verarbeitet: Salz, Nitrit & Zusätze","Viel Fett & Salz|Verarbeitet","Salz, Nitrit & Zusätze – ungünstig für die Haut","Schwer & salzig, macht träge"]},
  {id:"broth",k:["knochenbruhe","bone broth","rinderbruhe","huhnerbruhe","geflugelbruhe","rinderfond","kalbsfond","huhnerfond","fischfond","geflugelfond","wildfond","=fond"],n:["gemuse"],w:1,
   b:[62,88,95,72],g:["Kollagen & Aminosäuren","Wärmt & sättigt fast ohne Kalorien","Kollagen aus Knochen, gut für die Haut","Mineralien & Elektrolyte"],x:["Wenig Protein pro Portion","","",""]},
  {id:"organ",k:["leber","=herz","rinderherz","huhnerherz","geflugelherz","=niere","nieren","innereien","=bries","kalbsbries","markknochen","=mark","rindermark"],n:["leberwurst","leberkase","leberkas","leberpastete","=pate","pastete"],w:1,
   b:[92,88,95,94],g:["Sehr nährstoffreich, mit viel Protein","Viele Nährstoffe, wenig Kalorien","Sehr viel Vitamin A","Sehr viel B12 & Eisen"],x:["","","",""]},
  {id:"fattyfish",k:["maquereau","mackerel","saumon","truite","trout","sgombro","caballa","rillettes de thon","lachs","salmon","makrele","hering","matjes","sardine","sardelle","anchovis","sprotte","forelle","saibling","=aal","bismarck","rollmops","heilbutt","wildlachs","kaviar","rogen","fischrogen","makrelenfilet","heringsfilet","lachsfilet","lachsportion","lachsstuck","lachsscheiben"],n:["frischkase","aufstrich","creme","seelachs","paniert","panade","coated","breaded","backfisch","knusper","crispy","schlemmer","fischstabchen","nugget"],w:1,
   b:[90,84,97,90],g:["Viel Protein + Omega-3","Protein & gute Fette machen satt","Omega-3 ist gut für die Haut","Omega-3 & Protein für stabile Energie"],x:["","Etwas mehr Kalorien als magerer Fisch","",""]},
  {id:"leanfish",k:["=thon","atun","tonno","=tuna","merluza","cabillaud","crevette","gambas","thunfisch","tuna","kabeljau","seelachs","alaska","dorsch","zander","barsch","tilapia","pangasius","dorade","wolfsbarsch","scholle","seezunge","rotbarsch","=fisch","fischfilet","garnele","shrimp","krabbe","scampi","gamba","muschel","miesmuschel","auster","jakobsmuschel","hummer","languste","tintenfisch","calamari","oktopus","pulpo","meeresfruchte","schellfisch","karpfen","hecht","=wels","seehecht"],n:["austernpilz","austernsauce","paniert","panade","coated","breaded","backfisch","knusper","crispy","schlemmer","fischstabchen","nugget"],w:1,
   b:[94,94,82,76],g:["Sehr viel Protein, kaum Fett","Viel Protein, sehr wenig Kalorien","Protein, Jod & Zink","Leichtes Protein, liegt nicht schwer"],x:["","","Wenig Omega-3 – fetter Fisch ist besser","Kaum Carbs für Energie"]},
  {id:"poultry",n:["nugget","chicken wings","crispy","paniert","cordon","breaded","coated","=pane","=panes","knusper","planted","like chicken","vegan","vegetar","veggie"],k:["poulet","volaille","pollo","dinde","tacchino","hahnchen","huhn","hendl","=pute","puten","truthahn","chicken","geflugel","=ente","entenbrust","=gans","gansebrust","wachtel","perlhuhn","maishahnchen","poulet"],w:1,
   b:[95,94,74,76],g:["Hochwertiges Protein bei wenig Kalorien","Viel Protein, wenig Kalorien","Protein für Kollagen & Haut","Leichtes Protein"],x:["","","Weniger Hautnährstoffe als Fisch oder Ei","Allein kaum Energie aus Carbs"]},
  {id:"redmeat",k:["boeuf","bœuf","manzo","ternera","=veau","agneau","porc","rind","steak","=beef","lamm","kalb","=wild","wildschwein","hirsch","=reh","rehrucken","bison","entrecote","hufte","roastbeef","tatar","=hack","hackfleisch","gehacktes","rinderhack","schwein","kotelett","braten","=filet","=lende","=schulter","ziegenfleisch","zicklein","kaninchen","pferd","ochse","=rib","ribeye","rumpsteak","t-bone","tafelspitz","beinscheibe","schaufel","nacken"],n:["bratensosse","bratensauce","vegan","veggie","vegetar","plant","beyond","sonnenblumen","wonder","schlemmer","porridge","aus erbsen","lachs"],w:1,
   b:[92,80,82,86],g:["Protein, Eisen & Kreatin","Viel Protein, macht lange satt","Zink & Eisen für die Haut","Eisen & B12 für Energie"],x:["","%Fettere Stücke: mehr Kalorien","",""]},
  {id:"soy",k:["tofu","tempeh","=soja","soja","=soy","edamame","=miso","sojamilch","sojadrink","sojajoghurt","yuba","natto"],n:["sojasauce","sojasosse"],
   b:[42,42,24,36],g:["Pflanzliches Protein","Protein bei moderaten Kalorien","",""],x:["Soja, nicht naturbelassen","Soja, nicht naturbelassen","Verarbeitetes Soja – lieber Fisch, Ei, Fleisch","Soja, nicht naturbelassen"]},
  {id:"protdairy",k:["skyr","quark","huttenkase","korniger frischkase","cottage","high protein joghurt","protein joghurt","proteinjoghurt","griechischer joghurt","griechisch joghurt","=ymer","magerquark","speisequark","kwark","yopro"],w:1,d:1,
   b:[94,95,58,74],g:["Sehr viel Protein, kaum Kalorien","Viel Protein, macht lange satt","Viel Protein für Kollagen","Protein hält Blutzucker stabil"],x:["","","Milchprodukt – kann bei manchen Unreinheiten fördern","Kaum Carbs für schnelle Energie"]},
  {id:"kefir",k:["kefir","=ayran","dickmilch","sauermilch","buttermilch","butter milch","butter milk","=lassi","=laban"],w:1,d:1,
   b:[74,72,64,70],g:["Protein & fermentiert","Fermentiert & leicht","Fermentiert, mit lebenden Kulturen","Fermentiert, leicht verdaulich"],x:["Weniger Protein als Skyr","","Trotzdem ein Milchprodukt",""]},
  {id:"dairy",n:["kokosmilch","kokosnussmilch","coconut milk","lait de coco","kokosjoghurt","kokos joghurt","hafermilch","mandelmilch","reismilch","sojamilch","sojajoghurt","milchschokolade","milchreis","schokomilch"],k:["frischcreme","fromage blanc","fromage frais","=lait","leche entera","=leche","yaourt","yoghourt","=yogur","actimel","=melk","creme entiere","creme legere","creme fleurette","smietana","philadelphia","=kiri","exquisa","=panna","nata montada","petit suisse","milch","joghurt","jogurt","yogurt","yoghurt","greek style yog","greek style natur","greek style plain","sahne","schmand","creme fraiche","frischkase","mascarpone","ricotta","=rahm","kaffeesahne","kondensmilch","schlagsahne","saure sahne","=milk"],w:1,d:1,
   b:[66,60,50,62],g:["Calcium & etwas Protein","Calcium & etwas Protein","Liefert Protein & Calcium","Protein & Carbs"],x:["","%Fettreich – auf Fettstufe achten","Milch kann bei manchen Unreinheiten fördern",""]},
  {id:"cheese",k:["fromage","formaggio","queso","parmigiano","emmental","vache qui rit","leerdamer","quesitos","saint agur","=comte","roquefort","reblochon","gruyere","pecorino","kase","cheese","gouda","emmentaler","parmesan","grana padano","pecorino","mozzarella","burrata","=feta","camembert","=brie","cheddar","halloumi","manchego","gorgonzola","raclette","tilsiter","edamer","butterkase","harzer","appenzeller","gruyere","comte","provolone","=schafskase","ziegenkase","hirtenkase","bergkase","edelpilz","leerdammer","maasdamer","babybel","limburger","romadur","=quarkkase"],w:1,d:1,
   b:[64,46,46,58],g:["Viel Protein & Calcium","+Viel Protein","Liefert Protein & Calcium","Fett + Protein sättigen lange"],x:["Viel Fett pro Gramm Protein","~Kalorien- & fettreich","Milchprodukt – bei unreiner Haut eher meiden",""]},
  {id:"egg",k:["œuf","œufs","oeuf","oeufs","=uova","huevo","huevos","=ei","=eier","eier","ruhrei","spiegelei","=eigelb","eiklar","eiweiss","freilandei","wachteleier","=egg","eggs","pochiert"],n:["eiweisspulver","eiweissbrot","eiweiss brot","eiweiss-brot","eiernudel","eierlikor","eierkuchen"],w:1,
   b:[92,90,90,90],g:["Komplettes Protein, natürlich","Sättigt stark bei wenig Kalorien","Biotin & Protein für Haut & Haare","Protein + Fett: lange satt, kein Tief"],x:["","","",""]},
  {id:"avocado",k:["avocado","guacamole"],w:1,
   b:[60,64,95,84],g:["Gute Fette & Kalium","Ballaststoffe & Fett machen satt","Vitamin E & gute Fette für die Haut","Gesunde Fette für lange Energie"],x:["Wenig Protein","Kalorienreich – eine halbe reicht","",""]},
  {id:"nuts",k:["noix","noisette","amande","almond","walnut","hazelnut","nocciol","mandorl","pistach","cashew","=nuts","nut mix","nussmix","kerne-mix","seeds mix","=nueces","almendra","walnuss","haselnuss","=nusse","nusskern","nussmischung","studentenfutter","trail mix","mandel","cashew","pistazie","macadamia","pekan","paranuss","kurbiskern","sonnenblumenkern","=chia","chiasamen","leinsamen","=sesam","hanfsamen","pinienkern","mandelmus","cashewmus","nussmus","=tahini","tahin","=nuts","edelnuss","=nuss"],n:["muskatnuss","kokosnuss","nougat","maronen","marone","esskastanie"],w:1,
   b:[66,58,88,80],g:["Gute Fette & etwas Protein","Sättigen – kleine Handvoll","Vitamin E & Zink für die Haut","Fett und Protein liefern gleichmäßige Energie"],x:["Viele Kalorien für das Protein","~Sehr kalorienreich – Handvoll reicht","",""]},
  {id:"legume",k:["lentille","lentil","pois chiche","haricot","frijol","alubia","garbanzo","baked bean","=fagioli","ceci","lenticchie","linse","kichererbse","kidneybohne","kidney bean","=beans","=bohnen","schwarze bohnen","weisse bohnen","borlotti","cannellini","wachtelbohne","mungbohne","hummus","humus","lupine","=erbsenprotein","bohneneintopf","=dal"],n:["grune bohnen","brechbohnen","bohnen grun","prinzessbohnen","bohnenkraut","kaffeebohne"],w:1,
   b:[64,66,62,72],g:["Pflanzliches Protein & Carbs","Ballaststoffe & Protein sättigen","Ballaststoffe & Zink","Langsame Carbs für lange Energie"],x:["Hülsenfrucht, nicht primal","Hülsenfrucht, nicht primal","Hülsenfrucht, nicht primal","Kann blähen – gut kochen"]},
  {id:"fermentedveg",k:["chucrut","choucroute","sauerkraut","kimchi","=kombucha","milchsauer","fermentiert"],w:1,
   b:[60,92,94,70],g:["Mikronährstoffe für die Regeneration","Kaum Kalorien, viel Geschmack","Fermentiert, oft mit lebenden Kulturen","Vitamin C & Ballaststoffe"],x:["Kaum Protein","","","Wenig Kalorien – keine Energiequelle"]},
  {id:"sweetpotato",k:["susskartoffel","batate","=yams","sweet potato"],w:1,
   b:[74,78,95,90],g:["Gute Carbs fürs Training","Sättigt bei moderaten Kalorien","Viel Beta-Carotin für die Haut","Langsame, gut verträgliche Carbs"],x:["Kaum Protein","","",""]},
  {id:"potato",k:["kartoffel","erdapfel","drillinge","pellkartoffel","salzkartoffel","bratkartoffel","maniok","cassava","pastinake","topinambur","=knolle","kartoffelpuree","kartoffelbrei","maronen","marone","esskastanie"],w:1,
   b:[72,78,76,88],g:["Gute Carbs fürs Training","Sättigt stark bei wenig Kalorien","Vitamin C & Kalium, glutenfrei","Lang anhaltende Energie aus Carbs"],x:["Kaum Protein","","",""]},
  {id:"oats",k:["avoine","avena","=avoines","=oat","oatcake","oatmeal","porridge oats","flocons d'avoine","овесени","^hafer","porridge","haferbrei","haferflocken","=oats","overnight oats","haferkleie","=musli","bircher","fruchtmusli","fruchte musli","basis musli"],w:1,
   b:[80,78,80,92],g:["Gute Carbs + etwas Protein","Ballaststoffe halten lange satt","Zink & langsame Carbs – gut für die Haut","Langsame Carbs – Energie über Stunden"],x:["","~Trocken viele Kalorien – Portion wiegen","",""]},
  {id:"rice",k:["^reis","basmati","jasminreis","naturreis","vollkornreis","wildreis","parboiled","risottoreis","sushireis","=rice"],w:1,
   b:[72,66,72,84],g:["Gute Carbs fürs Training","Glutenfrei & gut verträglich","Glutenfrei, sanft für den Körper","Gut verträgliche Stärke für Energie"],x:["Wenig Protein","~Trocken viele Kalorien – Portion wiegen","",""]},
  {id:"pseudograin",k:["sarrasin","ble noir","buckwheat","quinoa","hirse","buchweizen","amaranth","teff","sorghum"],w:1,
   b:[78,74,82,90],g:["Mehr Protein als Reis","Ballaststoffe & Protein sättigen","Glutenfrei & mineralstoffreich","Langsame Carbs & Magnesium"],x:["","~Trocken viele Kalorien – Portion wiegen","",""]},
  {id:"wholewheat",f:(h,raw,c)=>rHit(h,rWords(h),c.k)&&/(brot|brotchen|toast|nudel|pasta|spaghetti|knacke|cracker|mehl|semmel|weckle|flocken|wrap|tortilla|bagel|baguette|vollkorn)/.test(h)&&!/(keks|kuchen|riegel|waffel|cookie|muffin|croissant|hafer|reis|musli|granola|flakes|knusper)/.test(h),k:["vollkorn","roggen","pumpernickel","sauerteig","knackebrot","dinkelvollkorn","schwarzbrot","kornerbrot","eiweissbrot","proteinbrot","=urkorn","emmer","einkorn"],w:1,
   b:[62,56,52,68],g:["Ballaststoffreiche Carbs","Sättigende Ballaststoffe","Ballaststoffe & Zink","Vollkorn hält länger satt als Weißmehl"],x:["Gluten-Getreide, nicht primal","Gluten-Getreide, nicht primal","Gluten-Getreide, nicht primal","Gluten-Getreide, nicht primal"]},
  {id:"refined",k:["=pain","pain de mie","=pan","bauletto","biscotte","krisprolls","tartines craquantes","fette croccanti","farine","harina","semoule","=pates","coquillette","spaghettoni","maccheroni","tortiglioni","capellini","pipe rigate","risoni","nouilles","=noodles","glass noodles","=soba","pasta","=bread","=toast","brot","brotchen","semmel","schrippe","weckle","wecken","toast","baguette","ciabatta","brezel","breze","laugen","=wrap","wraps","tortilla","fladenbrot","=pita","bagel","=bun","buns","nudel","pasta","spaghetti","penne","fusilli","makkaroni","tagliatelle","farfalle","rigatoni","linguine","lasagneplatten","feuillete","blatterteig","gnocchi","couscous","bulgur","=mehl","weizenmehl","dinkelmehl","spatzle","knodel","kloss","grieß","griess","paniermehl","=focaccia","naan","=toastbrot"],w:1,lq:1,
   b:[42,28,28,38],g:["Schnelle Carbs nach dem Training","","","Schnelle Carbs"],x:["Weißmehl: wenig Nährstoffe","Weißmehl macht schnell wieder hungrig","Weißmehl lässt Blutzucker springen","Schnelle Energie, schnelles Tief"]},
  {id:"driedfruit",k:["getrocknet","trockenobst","trockenfrucht","dattel","rosine","sultanine","bananenchips","apfelchips","=cranberries","=dates","medjool","softfeige","trockenpflaume","aprikose getrocknet","mango getrocknet","gojibeere","goji"],w:1,
   b:[46,28,56,62],g:["Schnelle Carbs fürs Training","","Kalium, Eisen & Polyphenole","Schnelle, natürliche Energie"],x:["Kaum Protein","Sehr viel Zucker auf kleinem Raum","Konzentrierter Zucker","Nur kleine Mengen – viel Zucker"]},
  {id:"berries",k:["beere","erdbeer","himbeer","heidelbeer","blaubeer","brombeer","johannisbeer","stachelbeer","=acai","granatapfel","cranberry","holunder"],n:["kaffeebohne","essig"],w:1,
   b:[60,86,96,76],g:["Antioxidantien für die Regeneration","Wenig Zucker für Obst","Viele Antioxidantien für die Haut","Natürlicher Zucker + Ballaststoffe"],x:["Kaum Protein","","",""]},
  {id:"banana",k:["banane","banana"],w:1,
   b:[68,64,78,88],g:["Perfekte Carbs vor dem Training","Süß & sättigend","Vitamin B6 & Kalium","Schnelle, natürliche Energie + Kalium"],x:["Kaum Protein","Mehr Zucker als andere Früchte","Recht viel Fruchtzucker",""]},
  {id:"vitc",k:["orange","mandarine","clementine","kiwi","grapefruit","zitrone","limette","pomelo","guave","=sanddorn"],w:1,
   b:[56,80,94,74],g:["Vitamin C für die Regeneration","Wenig Kalorien, viel Wasser","Viel Vitamin C für Kollagen","Natürlicher Zucker + Vitamin C"],x:["Kaum Protein","","",""]},
  {id:"fruit",k:["watermelon","wassermelone","=pomme","pommes ","compote","=apple","pineapple","=pina","piña","=fruit","fruits","=frutta","myrtille","framboise","fraise","abricot","peche","cerise","=poire","apfel","apfelmus","birne","traube","kirsche","pfirsich","nektarine","aprikose","pflaume","zwetschge","zwetsche","melone","mango","ananas","papaya","feige","=obst","obstsalat","physalis","litschi","maracuja","passionsfrucht","rhabarber","quitte","kaki","sharon","drachenfrucht","=fruchte"],n:["apfelessig","essig","mangold","nektarinen saft"],w:1,
   b:[56,72,84,76],g:["Schnelle Carbs rund ums Training","Süß, aber mit Ballaststoffen","Vitamine & Antioxidantien","Natürlicher Zucker + Ballaststoffe"],x:["Kaum Protein","Fruchtzucker – in Maßen","",""]},
  {id:"skinveg",k:["epinard","spinach","potiron","courge","pumpkin","carrot","=carotte","carottes","pomodor","=tomato","tomatoes","=sugo","=polpa","arrabbiata","marinara","napoletana","pimiento","poivron","patate douce","karotte","mohre","=rube","rote bete","rote beete","rote rube","spinat","grunkohl","mangold","paprika","tomate","tomatenmark","passata","tomatensauce","tomatensosse","kurbis","hokkaido","butternut","brokkoli","broccoli","rotkohl","rucola","feldsalat","=kresse","wildkrauter","brunnenkresse","pak choi","=kale"],n:["kurbiskern"],w:1,
   b:[56,95,97,74],g:["Mikronährstoffe für die Regeneration","Viel Volumen, kaum Kalorien","Vitamine & Antioxidantien für die Haut","Vitamine & Ballaststoffe"],x:["Kaum Protein","","","Wenig Kalorien – allein keine Energie"]},
  {id:"veg",k:["asparagus","asperge","cornichon","pepinillo","olives","azeitona","aceituna","petits pois","=pois","haricots verts","gingembre","ginger shot","=ginger","brocoli","courgette","champignon","=funghi","legumes","verdure","gurke","zucchini","aubergine","blumenkohl","rosenkohl","kohlrabi","weisskohl","wirsing","spitzkohl","chinakohl","=kohl","=chou","=choux","sellerie","spargel","pilz","champignon","shiitake","austernpilz","zwiebel","schalotte","knoblauch","lauch","porree","fenchel","=salat","salatherz","eisberg","kopfsalat","romana","chicoree","radicchio","endivie","artischocke","okra","=gemuse","gemuse","grune bohnen","brechbohnen","prinzessbohnen","zuckerschoten","=erbsen","erbse","=mais","zuckermais","radieschen","rettich","rucola","ingwer","oliven","kapern","gewurzgurke","sprossen","keimlinge","bambus","pak choi","staudensellerie","fruhlingszwiebel"],n:["ingwertee","ingwer tee"],w:1,
   b:[52,94,90,70],g:["Mikronährstoffe für die Regeneration","Viel Volumen, kaum Kalorien","Vitamine & Antioxidantien","Vitamine & Ballaststoffe"],x:["Kaum Protein","","","Wenig Kalorien – allein keine Energie"]},
  {id:"honey",k:["=miel","=miele","erable","=maple","honig","honey","ahornsirup","maple"],w:1,
   b:[46,30,58,66],g:["Schnelle Carbs nach dem Training","Natürlich süßen – kleine Menge reicht","Natürlich süß, mit Antioxidantien","Natürlicher Zucker, besser als Haushaltszucker"],x:["Kaum Protein","Viele Kalorien – nur ein Teelöffel","In Maßen: ein Teelöffel statt drei","In Maßen, sonst Zucker-Tief"]},
  {id:"coffeemilk",k:["cappuccino","=latte","latte macchiato","milchkaffee","eiskaffee","frappuccino","frappe","flat white","chai latte","mocca","mokka","caffe latte","cafe au lait","=macchiato","kaffeegetrank","coffee drink"],d:1,
   b:[48,46,34,48],g:["","","","Macht wach"],x:["Milch & oft Zucker","Kalorien aus Milch & Sirup","Milch im Kaffee – bei Hautfokus lieber schwarz","Macht wach, ersetzt aber keinen Schlaf"]},
  {id:"coffee",n:["sandwich","kaffeeweisser","creamer","pocket coffee"],k:["=cafe","=caffe","nescafe","arabica","cafe moulu","caffe in grani","kaffee","espresso","cold brew","=americano","filterkaffee","=coffee","=lungo","=ristretto"],w:1,
   b:[66,78,58,66],g:["Koffein kann die Leistung steigern","Schwarz fast ohne Kalorien","","Macht wach – am besten vor 14 Uhr"],x:["","","Zu viel stört den Schlaf – wichtig für die Haut","Macht wach, ersetzt aber keinen Schlaf"]},
  {id:"tea",n:["feuillet"],k:["=tee","tee","teebeutel","gruner tee","grunter tee","grüntee","gruntee","krautertee","fruchtetee","pfefferminz","kamille","matcha","rooibos","schwarztee","=chai","=tea","ingwertee","mate tee","fencheltee","hagebutte"],w:1,
   b:[76,86,88,76],g:["Kalorienfreies Getränk","Ohne Kalorien","Antioxidantien, ohne Zucker","Sanfter Muntermacher"],x:["","","",""]},
  {id:"spice",k:["moutarde","mustard","senape","mostaza","levure","=hefe","backpulver","yeast","vinaigre","aceto","=basilic","herbes","fines herbes","pfeffer","gewurz","=zimt","kurkuma","curcuma","oregano","basilikum","petersilie","schnittlauch","dill","thymian","rosmarin","krauter","senf","essig","apfelessig","balsamico","vanille","muskat","kreuzkummel","kummel","koriander","chiliflocken","cayenne","=paprikapulver","knoblauchpulver","zitronensaft","limettensaft","hefeflocken","=aneth","ciboulette","=persil","=thym","=romarin","=origan","=cumin","=curcuma","=cannelle"],w:1,
   b:[74,78,80,74],g:["Würzt fast ohne Kalorien","Würzt fast ohne Kalorien","Würzt fast ohne Kalorien","Würzt fast ohne Kalorien"],x:["","","",""]},
  {id:"water",n:["kokoswasser","wassermelone","watermelon","tonic","mit geschmack","geschmack","flavour","flavor","touch","aroma"],k:["=eau","=acqua","=agua","perrier","evian","volvic","vittel","cristaline","san pellegrino","wasser","mineral","sprudel","heilwasser","quellwasser","=water","tafelwasser"],w:1,
   b:[90,96,96,90],g:["Wichtig für Kraft & Regeneration","Null Kalorien, füllt den Magen","Gut hydriert wirkt Haut frischer","Schon wenig Durst macht müde"],x:["","","",""]}
];
// Mikronährstoffe je Lebensmittel. Die Datenbank kennt keine Vitamine, deshalb steckt dieses Wissen hier.
// m/l/s/e = Plus/Minus für Muskeln/Abnehmen/Haut/Energie, tm/tl/ts/te = Gut-Text, bs/be = Schlecht-Text
const R_MICRO=[
  {k:["orangensaft","o-saft","blutorangensaft","grapefruitsaft","mandarinensaft","acerolasaft","sanddornsaft","acerola","orange juice","jus d'orange","zumo de naranja"],s:9,e:3,l:1,ts:"Viel Vitamin C & Folat für die Haut",te:"Vitamin C & Kalium"},
  {k:["granatapfelsaft","aroniasaft","heidelbeersaft","blaubeersaft","johannisbeersaft","kirschsaft","holundersaft","cranberrysaft"],s:9,e:2,ts:"Polyphenole – starke Antioxidantien"},
  {k:["multivitaminsaft","multisaft","acerolakirsch"],s:5,ts:"Viele Vitamine auf einmal"},
  {k:["apfelsaft","traubensaft","birnensaft","ananassaft"],s:0,e:1,ts:"Etwas Vitamin C & Polyphenole"},
  {k:["karotte","mohre","karottensaft","mohrensaft"],s:7,ts:"Beta-Carotin (Vitamin A) für frischen Teint"},
  {k:["susskartoffel","batate"],s:6,e:2,ts:"Beta-Carotin für die Haut",te:"Kalium & langsame Stärke"},
  {k:["kurbis","hokkaido","butternut"],s:6,ts:"Beta-Carotin für die Haut"},
  {k:["spinat","mangold"],s:6,e:4,ts:"Vitamin A, C & E für die Haut",te:"Eisen & Magnesium"},
  {k:["grunkohl","=kale","palmkohl"],s:8,e:4,ts:"Viel Vitamin A, C & K für die Haut",te:"Eisen & Magnesium"},
  {k:["paprika"],s:6,ts:"Sehr viel Vitamin C für Kollagen"},
  {k:["tomate","passata","tomatenmark"],s:4,ts:"Enthält Lycopin, ein Antioxidans"},
  {k:["brokkoli","broccoli","rosenkohl"],s:5,m:1,ts:"Vitamin C & Sulforaphan"},
  {k:["rote bete","rote beete","rote rube"],s:3,e:4,m:2,ts:"Antioxidantien für die Haut",te:"Nitrat für bessere Durchblutung",tm:"Nitrat für mehr Ausdauer"},
  {k:["rucola","feldsalat","brunnenkresse","=kresse","postelein"],s:3,e:1,ts:"Vitamin K & Folat"},
  {k:["gurke","eisberg","kopfsalat","staudensellerie"],s:-5,e:-2,bs:"Viel Wasser, wenig Vitamine"},
  {k:["lachs","makrele","hering","matjes","sardine","sardelle","anchovis","forelle","saibling","sprotte"],s:4,e:3,ts:"Omega-3 & Vitamin D für die Haut",te:"Omega-3 & B12"},
  {k:["auster"],s:10,e:4,ts:"Viel Zink für reine Haut",te:"Zink & B12"},
  {k:["leber"],s:6,e:7,m:2,ts:"Sehr viel Vitamin A",te:"Sehr viel Eisen & B12"},
  {k:["eigelb"],s:4,ts:"Biotin & Vitamin A"},
  {k:["rind","steak","lamm","hirsch","=wild","bison","rehrucken","ochse"],s:3,e:4,m:3,ts:"Zink & Eisen für die Haut",te:"Eisen & B12 für Energie",tm:"Kreatin, Eisen & Zink"},
  {k:["kabeljau","seelachs","pangasius","tilapia","schellfisch"],s:-3,bs:"Kaum Omega-3"},
  {k:["paranuss"],s:7,ts:"Selen für die Haut"},
  {k:["walnuss"],s:5,e:2,ts:"Omega-3 aus Pflanzen"},
  {k:["mandel","haselnuss","sonnenblumenkern"],s:4,e:2,ts:"Vitamin E für die Haut",te:"Magnesium für Energie"},
  {k:["kurbiskern"],s:6,e:3,ts:"Zink für reine Haut",te:"Magnesium & Eisen"},
  {k:["chia","leinsamen","hanfsamen"],s:5,e:2,ts:"Omega-3 aus Pflanzen"},
  {k:["cashew","pistazie","macadamia","pekan"],s:1,e:2,te:"Magnesium für Energie"},
  {k:["kokos","coconut"],s:3,e:2,ts:"Kokos: gute Fette & Laurinsäure",te:"MCT-Fette für schnelle Energie"},
  {k:["heidelbeer","blaubeer","acai","aronia","holunder","schwarze johannisbeer"],s:6,e:1,ts:"Anthocyane: starke Antioxidantien"},
  {k:["granatapfel"],s:4,ts:"Polyphenole für die Haut"},
  {k:["himbeer","brombeer","erdbeer","johannisbeer"],s:3,ts:"Vitamin C & Antioxidantien"},
  {k:["kiwi","guave","sanddorn","acerola"],s:5,ts:"Sehr viel Vitamin C"},
  {k:["orange","mandarine","clementine","grapefruit","zitrone"],s:2,ts:"Vitamin C"},
  {k:["mango","papaya","aprikose","nektarine","pfirsich"],s:3,ts:"Beta-Carotin & Vitamin C"},
  {k:["banane"],e:3,m:2,te:"Kalium & schnelle Carbs",tm:"Kalium & Carbs fürs Training"},
  {k:["apfel","birne","traube","melone","ananas"],s:-1},
  {k:["datteln","dattel"],e:3,te:"Schnelle Energie & Kalium"},
  {k:["haferflocken","^hafer","haferkleie"],s:3,e:4,m:2,ts:"Zink & Biotin für die Haut",te:"Magnesium & B-Vitamine",tm:"Protein, Eisen & Zink"},
  {k:["quinoa","buchweizen","amaranth","hirse"],s:3,e:4,m:2,ts:"Zink & Magnesium",te:"Eisen & Magnesium",tm:"Mehr Protein als Reis"},
  {k:["naturreis","vollkornreis","wildreis"],s:2,e:2,ts:"Mehr Mineralstoffe als weißer Reis",te:"Mehr Ballaststoffe als weißer Reis"},
  {k:["linse","kichererbse","bohne"],s:1,e:4,te:"Eisen & Magnesium"},
  {k:["olivenol","olive oil","huile d'olive","olio"],s:5,ts:"Polyphenole & Vitamin E"},
  {k:["gruner tee","gruntee","matcha","grunter tee"],s:4,e:1,ts:"Antioxidantien (EGCG)",te:"Sanftes Koffein ohne Crash"},
  {k:["kurkuma","ingwer"],s:2,ts:"Reich an Pflanzenstoffen"},
  {k:["knochenbruhe","bone broth","rinderfond","kalbsfond"],s:4,m:1,ts:"Kollagen für die Haut"},
  {k:["sauerkraut","kimchi","kefir","kombucha"],s:3,e:1,ts:"Fermentiert, oft mit lebenden Kulturen"},
  {k:["ziegen","schafs","=feta","hirtenkase","buffel"],s:8,ts:"Schaf/Ziege oft besser verträglich"},
  {k:["kakao","cacao","zartbitter","edelbitter"],s:3,e:2,ts:"Flavanole für die Haut",te:"Magnesium"},
  {k:["=ei","=eier","ruhrei","spiegelei","freilandei"],s:2,e:1,ts:"Biotin, Vitamin A & Protein"},
  {k:["huhn","hahnchen","pute","truthahn","geflugel"],s:-1,e:-1},
  {k:["kokoswasser"],l:6,e:4,tl:"Kaum Kalorien, viele Elektrolyte",te:"Elektrolyte & leichte Carbs"},
  {k:["kaffee","espresso"],m:2,e:2,tm:"Koffein kann die Leistung steigern"},
  {k:["krautertee","fruchtetee","pfefferminz","kamille","rooibos","fencheltee","hagebutte"],e:-6,te:"Koffeinfrei – gut für den Abend"},
  {k:["sauerteig"],m:2,l:2,s:3,e:2,ts:"Sauerteig: besser verträglich",te:"Sauerteig: Blutzucker steigt langsamer"}
];
R_MICRO.forEach(x=>{ x.k=x.k.map(k=>{ const p=/^[=^]/.test(k)?k[0]:""; return p+NORM(p?k.slice(1):k); }); });
// Diese Arten sind naturbelassen, aber sie haben ihren Zucker von Natur aus (Obst & Co.)
const R_FRUITY=["juice","fruit","berries","banana","vitc","driedfruit","vegjuice","honey"];
// Gesunde, natürliche Fettquellen
const R_GOODFAT=["nuts","coconut","avocado","goodfat","butter","fattyfish","egg","darkchoc","organ","redmeat"];
// Stichwörter einmal normalisieren (wie die Produktnamen)
R_CATS.forEach(c=>{ const nk=k=>{ const p=/^[=^]/.test(k)?k[0]:"", b=p?k.slice(1):k; return p+NORM(b); }; c.k=(c.k||[]).map(nk); c.n=(c.n||[]).map(nk); });

// Treffer-Stärke eines Stichworts: 2 = Hauptwort (ganzes Wort oder Wortende, z. B. Rinder„schinken“), 1 = nur Bestimmungswort (z. B. „Rinder“schinken)
function kwHit(h,words,k){
  if(k[0]==="=") return words.includes(k.slice(1))?2:0;
  if(k[0]==="^"){ const s=k.slice(1); return words.some(w=>w.startsWith(s))?2:0; }
  if(k.includes(" ")||k.includes("'")||k.includes("-")) return h.includes(k)?2:0;
  let best=0;
  for(const w of words){
    const i=w.lastIndexOf(k); if(i<0) continue;
    const rest=w.slice(i+k.length);
    if(rest===""||/^(e|n|en|er|es|s|ern|chen|ens|n?s)$/.test(rest)) return 2;
    best=1;
  }
  return best;
}
function rHit(h,words,list){ return list.some(k=>kwHit(h,words,k)>0); }
// In welchen Wörtern trifft eine Liste? (für die Träger-Regel)
function rHitWords(words,list,min){ const out=new Set(); words.forEach((w,i)=>{ if(list.some(k=>!k.includes(" ")&&kwHit(" "+w+" ",[w],k)>=min)) out.add(i); }); return out; }
function rWords(h){ return h.trim().split(/[^a-z0-9%&']+/).filter(Boolean); }
function foodCat(item,skip){
  // "Thunfisch in Sonnenblumenöl", "Hähnchen mit Reis": zuerst nur den Teil vor "in/mit" prüfen
  const raw0=String(item.name||""), m=(" "+NORM(raw0)+" ").match(/^(.+?) (in|im|mit|auf|an) /);
  if(m&&m[1].trim().length>2){ const c=foodCat1(raw0.slice(0,Math.max(3,m[1].trim().length+1)),m[1]+" ",skip); if(c) return c; }
  return foodCat1(raw0,null,skip);
}
// skip = Arten, die schon als unpassend erkannt wurden (zweiter Versuch, z. B. "Butter-Spekulatius" ist keine Butter)
function foodCat1(raw,hh,skip){
  const h=hh||(" "+NORM(raw)+" "), words=rWords(h);
  // Gleich starke Treffer: das "Trägerprodukt" gewinnt gegen die Geschmacksrichtung (Erdbeer-Joghurt = Joghurt, Blumenbrot Kokos = Brot)
  let best=null, bs=0, carrier=null, cs=0;
  for(const c of R_CATS){
    if(skip&&skip.has(c.id)) continue;
    if(c.n.length&&rHit(h,words,c.n)) continue;
    let s=0;
    if(c.f){ if(c.f(h,raw,c)) s=3; }
    else for(const k of c.k){ const v=kwHit(h,words,k); if(v>s) s=v; if(s===2) break; }
    if(!s) continue;
    if(!R_FLAVOR.has(c.id)&&s>cs){ cs=s; carrier=c; }
    if(s>bs||(s===bs&&R_FLAVOR.has(best.id)&&!R_FLAVOR.has(c.id))){ bs=s; best=c; if(s===3) break; }
  }
  // Essig ist Essig, auch mit Himbeere oder Rotwein im Namen (aber Essiggurken bleiben Gurken, Linsen-Balsamico-Aufstrich bleibt Aufstrich)
  if((!best||R_FLAVOR.has(best.id))&&!(skip&&skip.has("spice"))&&words.some(w=>/^(essig|vinaigre|aceto|vinegar|balsamico)$/.test(w)||/.essig$/.test(w))&&!/(dressing|sauce|vinaigrette|marinade)/.test(h)) return R_BYID.spice;
  // Geschmack (Obst, Nuss, Gewürz) gewinnt nicht gegen ein erkanntes Trägerprodukt, auch wenn das nur im Wort steckt
  // (z. B. "Buttermilchdrink Himbeere" = Buttermilch, "Garten-Limonade Orange" = Limo)
  if(best&&R_FLAVOR.has(best.id)&&carrier&&!best.f&&!carrier.f){
    // "Tortenpfirsiche": Pfirsich ist das Hauptwort, "Torte" nur Vorsilbe im selben Wort → bleibt Obst
    const fw=rHitWords(words,best.k,2), cw=rHitWords(words,carrier.k,1);
    if(!cw.size||[...cw].some(i=>!fw.has(i))) return carrier;
    return best;
  }
  if(best&&R_FLAVOR.has(best.id)&&carrier) return carrier;
  return best;
}
const R_FLAVOR=new Set(["fruit","berries","vitc","banana","coconut","spice","veg","skinveg","honey","nuts","peanut","driedfruit","avocado"]);
// Marken, die (fast) nur eine Art herstellen. Greift nur, wenn der Name nichts Eindeutiges sagt.
const R_BRANDS={
  sweets:["haribo","katjes","trolli","nimm2","storck","milka","lindt","lindor","lindt&sprungli","ferrero","kinder","mars","snickers","twix","m&m's","merci","toffifee","ritter sport","oreo","mentos","wick","ricola","em-eukal","fisherman's friend","magnum","ben & jerry's","haagen-dazs","cremissimo","langnese","loacker","manner","bahlsen","leibniz","de beukelaer","griesson","favorina","feodora","zotter","sarotti","hachez","after eight","skittles","maoam","hitschler","fini","daim","toblerone","knoppers","nutella","marabou","alpia","choceur","moser roth","schogetten","yogurette","duplo","hanuta","balisto","milky way","kitkat","lion","bounty","raffaello","mon cheri","rocher","giotto","red band","wikana","coppenrath","brandt","corny"],
  softdrink:["coca-cola","coca cola","pepsi","fanta","sprite","mirinda","mezzo mix","schweppes","red bull","monster","booster","rockstar","lipton","fuze tea","capri-sun","capri sun","punica","vio","bionade","fritz-kola","fritz","afri","durstloscher","sinalco","club-mate","river","flying power","effect","bullit","oettinger","orangina","vitamin well"],
  alcohol:["krombacher","bitburger","warsteiner","veltins","radeberger","jever","beck's","becks","paulaner","erdinger","franziskaner","augustiner","hacker-pschorr","spaten","lowenbrau","konig ludwig","monchshof","gosser","heineken","corona","perlenbacher","schofferhofer","clausthaler","grimbergen","leffe","hasseroder","kostritzer","ottakringer","stiegl","astra","tsingtao","desperados","bacardi","jagermeister","smirnoff","absolut","aperol","martini","baileys"],
  juice:["tropicana","innocent","true fruits","granini","hohes c","valensina","rauch","happy day","albi","beckers bester","amecke","dittmeyer","pfanner","voelkel","rabenhorst","eckes"],
  water:["hella","volvic","evian","gerolsteiner","vittel","saskia","adelholzener","apollinaris","bad brambacher","rhenser","selters","san pellegrino","perrier","fiji"],
  chips:["funny-frisch","pringles","lay's","lays","chio","lorenz","kelly's","zweifel","takis","doritos","tuc","pom-bar","crunchips","chipsfrisch","gardschips","kettle"],
  cereal:["kellogg's","kelloggs","mymuesli","barnhouse"],
  sauce:["lee kum kee","kikkoman","heinz","hela","develey","kuhne"],
  ersatz:["beyond meat","beyond burger","planted","planted.","like meat","garden gourmet","the vegetarian butcher","vegetarian butcher","quorn","endori","greenforce","billie green","mein veggie","vemondo","violife","simply v","veganz","wheaty","rugenwalder vegetarisch","taifun","my vay","food for future","vantastic","green legend","valsoia"],
  plantmilk:["alpro","oatly","oat-ly!","provamel","rude health","isola bio","natumi"]
};
const R_BRAND_OF=new Map(); Object.entries(R_BRANDS).forEach(([id,l])=>l.forEach(b=>R_BRAND_OF.set(NORM(b).trim(),id)));
function brandCat(item){
  const b=NORM(item.brand||"").trim(); if(!b) return null;
  let id=R_BRAND_OF.get(b)||R_BRAND_OF.get(b.split(/[,;(]/)[0].trim());
  if(!id){ for(const [k,v] of R_BRAND_OF) if(k.length>=5&&(b.startsWith(k+" ")||b===k)) { id=v; break; } }
  return id||null;
}
const R_BYID={}; R_CATS.forEach(c=>R_BYID[c.id]=c);
// Passt die erkannte Art zu den Nährwerten? Sonst ist es eher ein Gericht/Snack (z. B. "Rindfleisch-Ravioli" mit 4 g Protein)
const R_DRIED=/(getrocknet|trocken|dried|\bdry\b|\bsoft|secch|seche|deshidrat|chips|scheiben|ringe|wurfel)/;
const R_DRINKW=/(limo|getrank|drink|h2o|schorle|wasser(?!melone)|\bwater\b|spritz|soda|radler|eistee|ice tea|\btea\b|\btee\b|sirup|nektar|nectar|saft|juice|smoothie|\bshot\b|geschmack|\btouch\b)/;
function rPlausible(cat,n,heavy,h){
  if(!cat) return cat; h=h||"";
  const id=cat.id, dish=R_BYID[heavy?"readymeal":"mixedmeal"];
  // Nur ein Bestandteil im Namen, das Produkt ist etwas anderes (zweiter Versuch ohne diese Art)
  if(id==="butter"&&n.fa<38) return "RETRY";                       // Butterkeks, Butter-Toast, Buttermilch-Drink
  if(id==="egg"&&(n.cb>=8||/(brot|brotchen|toast|knack|semmel)/.test(h))) return "RETRY";   // Eiweißbrot                           // Eiweißbrot
  // Tee mit vielen Kalorien: Werte fürs trockene Blatt (Matcha) sind ok, Gebäck/Zucker/Oliven ("dénoyautées") nicht
  if(id==="tea"&&n.kc>60) return n.pr>=40?R_BYID.whey:(n.su<5&&n.fa<6&&/(matcha|grun|schwarz|kraut|tee\b|tea\b)/.test(h)&&!/(geback|kranz|keks|feuillet|denoyaut|fouett|zucker|butter|buter|wurst)/.test(h))?cat:"RETRY";
  if(id==="organ"&&n.cb>10) return "RETRY";                        // "Herz"-Nudeln
  if(id==="honey"&&n.fa>5&&n.cb<50) return "RETRY";                         // Honig-Senf-Sauce
  if(id==="coffee"&&(n.su>20||/(brot|keks|praline|schoko)/.test(h))) return "RETRY";
  if(id==="spice"&&!/(hefeflocken|levure|backpulver|senf|moutarde|mustard)/.test(h)&&!(/(essig|aceto|balsam|vinaigre|vinegar)/.test(h)&&n.fa<1&&n.su<25)&&(n.pr>13||n.fa>16||(n.su>8&&n.kc>60))
     &&!(n.kc>200&&n.fa<20&&n.su<15&&n.pr<=13&&n.cb<70&&/(gewurz|\b(pfeffer|pulver|gemahlen|zimt|kurkuma|curcuma|curry|paprika|muskat|kummel|chili|oregano|thymian|rosmarin|majoran|basilikum|petersilie|dill|anis|nelken|kardamom|ingwer)\b)/.test(h)&&!/(cracker|knack|brot|chips|snack|riegel|nudel|spiral|pasta|penne|fusilli|salat|rusa)/.test(h))) return "RETRY"; // Shake, Kräuterquark, Vanilleeis
  if(id==="spice"&&/(senf|moutarde|mustard)/.test(h)&&n.su>10) return R_BYID.sauce;   // süßer Senf, Honig-Senf
  // Obst & Gemüse mit Getränke-Wörtern und wenig Kalorien: Limo, Schorle, aromatisiertes Wasser
  if(["fruit","berries","vitc","banana","veg","skinveg"].includes(id)&&n.kc<70&&R_DRINKW.test(h)) return "RETRY";
  if(["poultry","redmeat","leanfish","fattyfish"].includes(id)&&n.cb>8) return /(panier|panade|breaded|coated|crispy|knusper|backfisch|nugget|=pane)/.test(h)?R_BYID.fastfood:dish;
  if(id==="fermentedveg"&&n.kc>150&&n.cb>30) return R_BYID.readymeal;      // Instant-Nudeln "Kimchi"
  if(id==="coconut"&&(n.su>25||n.su>15&&n.cb>30)) return n.su<=25&&/(mix|nuss|cashew|mandel|\bnut)/.test(h)?"RETRY":R_BYID.sweets;  // Kokos-Gebäck; Nuss-Mix: als Nuss prüfen
  if(id==="coconut"&&n.kc<70&&n.su>6) return R_BYID.softdrink;    // Getränk mit Kokos (Kokoswasser hat weniger Zucker)
  if(id==="chips"&&n.fa<5&&n.kc>200&&/(apfel|banane|mango|ananas|frucht|beere|obst|birne)/.test(h)) return R_BYID.driedfruit; // Apfelchips
  if(id==="dairy"&&n.pr>=15&&n.fa>=15&&n.cb<5) return R_BYID.cheese;   // "Heumilch-Bergkäse", "Comté au lait cru"
  if(["dairy","protdairy"].includes(id)&&n.kc>300&&n.pr>=25&&n.fa<15) return /(riegel|\bbar\b|snack|crisp)/.test(h)?R_BYID.proteinbar:R_BYID.whey; // Diät-/Protein-Shakepulver, Proteinriegel
  if(["dairy","protdairy","kefir"].includes(id)&&n.kc>300&&n.su>25) return R_BYID.sweets; // Vollmilch-Kuvertüre, Milchschoko
  if(id==="dairy"&&n.kc>300&&n.cb>30) return "RETRY";             // Milchbrei-Pulver, Riegel "Erdnuss & Vollmilch"
  if(id==="dairy"&&n.cb>25&&n.kc>200&&n.su<15) return "RETRY";   // "Greek Style"-Fladenbrot, Milchbrötchen
  if(id==="dairy"&&n.kc>180&&n.su>12&&n.cb>18&&n.pr<15) return R_BYID.sweets; // Sahneschnitte, Joghurt-Eis, gezuckerte Kondensmilch
  if(id==="oats"&&n.kc<150&&/(cuisine|creme|jogu|joghurt|yogurt|alternative|dessert)/.test(h)) return R_BYID.ersatz; // Hafer-Joghurt
  if(id==="rice"&&n.kc<120&&n.fa>5) return R_BYID.ersatz;         // Reis-Kochcreme
  if(["poultry","redmeat","leanfish","fattyfish"].includes(id)&&n.pr<11) return dish;
  if(id==="organ"&&n.pr<10) return dish;
  if(id==="egg"&&n.pr<8) return dish;
  if(id==="protdairy"&&n.pr<6) return R_BYID.dairy;
  if(id==="cheese"&&n.pr<8&&n.su>12) return R_BYID.sweets;          // Käsekuchen-Eis, "Cheesecake"-Pralinen
  if(id==="cheese"&&n.pr<8&&n.kc<150) return dish;                  // Salat mit Mozzarella
  if(id==="cheese"&&n.pr<8) return n.kc>350&&n.fa>15&&n.cb>10?R_BYID.chips:n.cb>10&&n.fa<25?dish:R_BYID.dairy; // Käse-Snack; "Pasta 5-Käse" ist ein Gericht
  if(id==="cheese"&&n.cb>15) return n.cb>35?R_BYID.refined:dish; // Käsebrötchen, Käse-Snack
  if(id==="egg"&&n.cb>15) return dish; // Pfannkuchen-Streifen, Eierspätzle
  if(id==="sugar"&&n.pr>=5&&/(flakes|flocken|gepufft|pops|crisp|musli|kissen|ringe)/.test(h)) return R_BYID.cereal;
  if(id==="juice"&&n.kc>150) return n.su>40?R_BYID.sweets:"RETRY";  // "Saft-Goldbären", Sirup – kein Saft
  if(id==="tea"&&(n.su>=2.5||n.kc>=10)) return R_BYID.softdrink; // gesüßter Eistee (aufgebrühter Tee hat fast keine Kalorien)
  if(id==="coffee"&&n.kc<60&&n.su>=2&&n.pr<1) return R_BYID.softdrink; // Wasser/Limo "mit Kaffee"
  if(id==="oats"&&n.kc<120&&n.cb<15&&/(drink|barista|milch|milk|oatly|alpro)/.test(h)) return R_BYID.plantmilk; // Haferdrink
  if(id==="broth"&&n.kc>60) return R_BYID.readymeal;
  if(id==="nuts"&&n.fa<25&&n.pr<15) return n.su>20?R_BYID.sweets:dish;
  if(["nuts","peanut","coconut","avocado"].includes(id)&&n.su>25) return R_BYID.sweets;
  if(id==="darkchoc"&&n.su>36) return R_BYID.sweets; // 70 % hat ca. 30 g Zucker, erst darüber wie normale Schokolade
  if(id==="spice"&&n.su>(/(essig|aceto|balsam|vinaigre|vinegar)/.test(h)?25:15)) return R_BYID.sweets;   // Balsamico hat von Natur aus etwas Zucker
  if(id==="honey"&&(n.pr>=4||n.fi>=3)) return (n.fa>8||/(printen|keks|geback|kuchen|lebkuchen|riegel|snack|waffel)/.test(h))?R_BYID.sweets:R_BYID.cereal; // "Dinkel gepufft mit Honig" ist Frühstücksflocke, Honig-Printen sind Gebäck
  if(id==="chips"&&n.pr>=18) return R_BYID.processedmeat;
  if(id==="oats"&&n.su>15) return R_BYID.cereal;
  if(id==="oats"&&n.cb<40&&n.kc>150) return dish;
  if(id==="veg"&&/oliv/.test(h)&&n.cb<15) return cat;               // Oliven sind von Natur aus fettreich (Oliven-Cracker nicht)
  if(["veg","skinveg"].includes(id)&&/(relish|relisj|suss-sauer|suss sauer|sweet sour|ketchup|chutney)/.test(h)) return R_BYID.sauce; // Relish, Süß-sauer-Soße
  if(id==="driedfruit"&&n.su<12) return R_BYID.veg; // getrocknete Oliven/Tomaten: kein Zuckerobst // Oliven sind von Natur aus fettreich
  if(["veg","skinveg","fruit","berries","vitc","banana"].includes(id)&&n.kc>150){
    if(n.fa>15) return n.cb>=35?R_BYID.chips:R_BYID.sauce;           // Gemüsechips bzw. Meerrettich-Creme, Aufstrich
    const dried=R_DRIED.test(h)||(n.fi>=4&&n.fa<5&&n.pr<6), fruity=id!=="veg"&&id!=="skinveg";
    if(fruity&&dried) return R_BYID.driedfruit;
    if(fruity&&n.su>40) return n.kc<300?R_BYID.sugar:R_BYID.sweets;   // Konfitüre bzw. Fruchtgummi, kein Trockenobst
    if(n.su>40||/kandiert/.test(h)) return R_BYID.sweets;              // kandierter Ingwer
    if(fruity&&n.fa<5&&n.cb>40) return R_BYID.driedfruit;
    return dish;
  }
  if(["potato","sweetpotato"].includes(id)&&n.kc>180&&n.su>20) return R_BYID.sweets;   // Maronencreme
  if(["potato","sweetpotato"].includes(id)&&n.kc>180) return n.fa>10?R_BYID.chips:dish;
  if(id==="avocado"&&n.kc>300) return n.fa>60?R_BYID.goodfat:dish;
  if(["goodfat","seedoil"].includes(id)&&n.fa<60) return R_BYID.sauce;
  if(id==="whey"&&n.pr<20) return R_BYID.proteinbar;
  if(id==="water"&&n.kc>15) return n.su>2?R_BYID.softdrink:cat;
  return cat;
}
// Nährwert-Bewertung je Ziel, 0–100, rein aus den Zahlen pro 100 g
const cl=(x,a,b)=>Math.max(a==null?0:a,Math.min(b==null?1:b,x));
function rNutri(n,id){
  const {kc,pr,cb,fa,su,fi}=n;
  if(kc<8||id==="coffee"||(kc<20&&["broth","tea","water","softdrink","spice","alcohol"].includes(id))) return null; // Wasser, Brühe, Tee, Kaffee (Werte oft fürs Pulver): Makros sagen nichts aus
  const ps=cl(pr*4/kc), cs=cl(cb*4/kc), fs=cl(fa*9/kc);
  const sr=cb>0?su/cb:0, fr=cb>0?fi/cb:0;
  const carbGood=cl(1-sr*1.4)*0.65+cl(fr*7)*0.35;
  const natFat=R_GOODFAT.includes(id);
  // Protein-Dichte zählt erst ab nennenswerter Menge (Brokkoli hat viel Protein pro kcal, aber kaum Protein absolut)
  // Gleiche Logik für gekocht/trocken: Menge über Protein ODER Energiedichte (Reis gekocht ≈ Reis trocken)
  const amt=cl((kc-20)/80), D=cl(ps/0.5)*Math.max(cl(pr/8),amt), C=cs*carbGood*Math.max(cl(cb/20),amt);
  const muscle=cl(0.9*(0.2*cl(pr/25)+0.8*D)+0.5*C-cl((su-10)/40,0,1.5)*0.4,-0.6,1)*100;
  const lose=cl(0.55*cl(1-(kc-40)/460,-0.5,1)+0.30*cl(ps/0.5)+0.15*cl(fi/8)-cl((su-5)/30,0,2)*0.3,-0.6,1)*100;
  const skin=cl(0.5*(1-cl((su-5)/30,0,2))+0.35*(cs>0.5?carbGood:1)+0.15*cl(fi/6)+(natFat&&fs>0.3?0.1:0)-(natFat?0:cl(fs-0.6)*0.3),-0.6,1)*100;
  const energy=cl(0.55*C+0.3*(0.5*cl(ps/0.3)*Math.max(cl(pr/8),amt)+0.5*(natFat?cl(fs/0.5):0))+0.15*cl(fi/6)-cl((su-10)/30,0,2)*0.4,-0.6,1)*100;
  return [muscle,lose,skin,energy];
}
// Wie stark die Nährwerte innerhalb einer Art den Wert verschieben (Muskeln & Abnehmen stark, Haut schwächer – dort zählen Mikronährstoffe)
const R_K=[0.75,0.75,0.4,0.5];
// Weicher Rand: oben/unten keine harten Grenzen, damit nicht alles bei 98 oder 5 klebt
function rSoft(x){ if(x>88) return 88+10*(1-Math.exp(-(x-88)/10)); if(x<14) return 14-11*(1-Math.exp(-(14-x)/14)); return x; }
const rG=v=>v>=10?String(Math.round(v)):String(Math.round(v*10)/10).replace(".",",");

// Kleines Thema je Text, damit nicht zweimal dasselbe gesagt wird
function rTopic(t){
  t=t.toLowerCase();
  if(/süßstoff/.test(t)) return "sweet";
  if(/ballaststoff/.test(t)) return "fiber";
  if(/protein/.test(t)) return "protein";
  if(/zucker/.test(t)) return "sugar";
  if(/kcal|kalorien/.test(t)) return "kcal";
  if(/salz/.test(t)) return "salt";
  if(/verarbeit|zusätz|fertig|industri|ersatz|isolat/.test(t)) return "proc";
  if(/milch|molke/.test(t)) return "dairy";
  if(/gluten/.test(t)) return "gluten";
  if(/omega/.test(t)) return "omega";
  if(/haltung|bio[ -:]|wildfang|qualität|günstigmarke|msc|zucht/.test(t)) return "quality";
  if(/carbs|stärke|blutzucker/.test(t)) return "carbs";
  if(/vitamin|zink|eisen|magnes|selen|carotin/.test(t)) return "micro:"+t;
  return t;
}
// Art erkennen + Nährwerte aufbereiten (auch für die Median-Tabelle genutzt)
function rClassify(item){
  const pr=+item.protein||0, cb=+item.carbs||0, fa=+item.fat||0, su=+item.sugar||0, fi=+item.fiber||0, sa=+item.salt||0;
  // Kalorien gegen Makros prüfen (Tippfehler in der Datenbank, z. B. Hackfleisch mit 47 kcal)
  let kc=+item.kcal||0; const calc=pr*4+cb*4+fa*9;
  if(calc>30&&(kc<calc*0.6||kc>calc*1.6)) kc=Math.round(calc);
  const nova=+item.nova||0; let heavy=nova>=4||(!nova&&item.processed);
  const h=" "+NORM(item.name||"")+" ", words=rWords(h), nut={kc,pr,cb,fa,su,fi,sa};
  let cat=foodCat(item);
  const bc=brandCat(item), skip=new Set(); let drinkLike=false;
  // Marke hilft, wenn der Name nichts sagt oder nur eine Geschmacksrichtung nennt ("Original Taste" von Coca-Cola, "Pfirsiche" von Haribo)
  const brandUse=b=>{ let x=R_BYID[b];
    if(b==="plantmilk"&&/(joghurt|jogurt|yogurt|skyr|dessert|pudding|mousse|cuisine|greek|style|plain|creme|kase|cheese)/.test(h)) x=R_BYID.ersatz;
    if(b==="ersatz"&&nut.kc<80&&nut.fa<4&&/(drink|milch|milk|barista|kaffee|hafer|mandel|soja|reis)/.test(h)) x=R_BYID.plantmilk;
    if(b==="ersatz"&&nut.su>=20&&nut.kc>=250) x=R_BYID.sweets;        // vegane Schokolade, Nuss-Nougat-Creme
    return x; };
  if(bc){
    const fl=cat&&(R_FLAVOR.has(cat.id)||["coffee","driedfruit","tea","sauce","mixedmeal","readymeal"].includes(cat.id));
    if(!cat) cat=brandUse(bc);
    // Marke überstimmt nur eine Geschmacksrichtung – und nur, wenn die Nährwerte dazu passen (Hersteller machen oft mehr als eine Sache)
    else if(fl&&bc==="sweets"&&nut.su>=20) cat=brandUse(bc);
    else if(fl&&["softdrink","alcohol","juice","water"].includes(bc)&&nut.kc<80&&!(bc==="water"&&["coffee","tea"].includes(cat.id))) cat=brandUse(bc);
    else if(fl&&bc==="chips"&&nut.fa>=15&&nut.cb>=35) cat=brandUse(bc);
    else if(["ersatz","plantmilk"].includes(bc)&&fl) cat=brandUse(bc);
    else if(fl&&bc==="sauce"&&(nut.su>=10||nut.fa>=10)) cat=brandUse(bc);                    // veganer Aufstrich/Käse mit Paprika, Leberwurst-Art …
    else if(["ersatz","plantmilk"].includes(bc)&&["poultry","redmeat","processedmeat","leanfish","fattyfish","dairy","cheese","protdairy","egg","oats","rice","butter","fastfood"].includes(cat.id)) cat=brandUse(bc);
  }
  for(let t=0;t<4;t++){
    if(cat&&cat.id==="mixedmeal"&&heavy) cat=R_BYID.readymeal;
    // Gerichte mit Fleisch/Fisch (z. B. "Bauerntopf mit Hackfleisch", "Tagliatelle Wildlachs") als Gericht werten
    if(cat&&R_ANIMAL.includes(cat.id)&&!["broth","organ","cheese"].includes(cat.id)&&/(sauce|sosse|topf|salatbox|schlemmerfilet|a la |bordelaise|gratin|lasagne|tagliatelle|nudel|pasta|spaghetti|pizza|wrap|sandwich|burger|risotto|fertiggericht|mahlzeit|menu|suppe|eintopf)/.test(h)) cat=R_BYID[heavy?"readymeal":"mixedmeal"];
    const pc=rPlausible(cat,nut,heavy,h);
    if(pc==="RETRY"){ if(["fruit","berries","vitc","banana","veg","skinveg"].includes(cat.id)&&nut.kc<70) drinkLike=true; skip.add(cat.id); cat=foodCat(item,skip); continue; }
    cat=pc; break;
  }
  if(!cat&&drinkLike) cat=nut.su>=2?R_BYID.softdrink:R_BYID.water;   // Limo/Schorle/aromatisiertes Wasser mit Obst im Namen
  // Alkoholfreies Bier, Radler 0,0 %: kein Alkohol, aber auch kein gesundes Getränk
  if(/(alkoholfrei|0[,.]0 ?%|alcohol.?free|sans alcool|analcolic|sin alcohol|non.?alcoholic)/.test(h)&&((cat&&cat.id==="alcohol")||bc==="alcohol"||/(bier|beer|radler|weizen|\bpils|helles|sekt|wein|\bgin\b)/.test(h))) cat=R_BYID.softdrink;
  // Nicht erkannt: grob über die Nährwerte einordnen (reiner Zucker, Öl, Chips, Gebäck)
  if(!cat){
    const {kc,pr,cb,fa,su}=nut;
    if(fa>=85) cat=R_BYID.seedoil;
    else if(su>=25&&kc>=300) cat=R_BYID.sweets;
    else if(kc>=430&&fa>=18&&cb>=40&&su<10&&pr<14) cat=R_BYID.chips;
    else if(kc>=380&&cb>=55&&su>=12) cat=R_BYID.sweets;
  }
  if(kc<20&&cat&&!["tea","water","coffee","softdrink","alcohol","broth"].includes(cat.id)&&R_BYID.tea.k.some(k=>kwHit(h,words,k)===2)) cat=R_BYID.tea;
  // Pures Fleisch, Fisch, Ei: Die Datenbank stuft abgepacktes Frischfleisch oft als „stark verarbeitet“ ein
  // (Schutzatmosphäre, Etikett). Ohne viel Salz, Zucker oder Würz-Hinweis im Namen ist es naturbelassen.
  if(heavy&&cat&&["poultry","redmeat","leanfish","fattyfish","egg","organ"].includes(cat.id)&&sa<1.2&&su<3
     &&!/(marin|panier|gewurz|wurz|grill|bbq|barbecue|knusper|crispy|sauce|sosse|krauter|knoblauch|paprika|curry|teriyaki|honig|chili|gyros|kebab|doner|nugget|cordon|bacon|zubereit|gegart|sous vide)/.test(h)) heavy=false;
  if(heavy&&cat&&["protdairy","dairy","kefir","cheese"].includes(cat.id)&&su<6&&sa<2
     &&!/(frucht|erdbeer|himbeer|kirsch|pfirsich|mango|vanill|schoko|choco|karamell|caramel|nuss|stracciatella|light|zero|leicht|schmelz|zubereitung|scheiblett|streich|creme|dessert|pudding|drink|shake|protein|aroma|geschmack)/.test(h)) heavy=false;
  return {cat,nut,heavy,nova,h,words};
}
let R_MICRO_HIT=null;
// Diät aus dem Fragebogen (alte Antworten werden umgedeutet)
function rDiet(){ const s=(state.coach.answers.gesundheit||{}).stil; return ({Alles:"Nichts Bestimmtes","Wenig Fleisch":"Ausgewogen"})[s]||s||"Nichts Bestimmtes"; }
function glu0(id,item,h){ return ["wholewheat","refined"].includes(id)||foodHas(item,"glu")&&!/glutenfrei/.test(h); }
// Alle vier Ziele auf einmal (für "Deine Ziele" in der Detailansicht)
function scoreAllGoals(item){ const o={}; R_GOALS.forEach(g=>o[g]=scoreFood(item,g).score); return o; }
// Supplements aus der Datenbank (Kapseln, Pulver, Brausetabletten) wie im Supplement-Bereich bewerten, nicht wie Essen
function rSupKind(item,h,cat){
  const pr=+item.protein||0, su=+item.sugar||0;
  if(/(saft|nektar|drink|getrank|water|wasser|schorle|limo|bonbon|riegel|joghurt|musli|tee |smoothie|mineral|kaugummi|sirup|sirop|capri|traubenzucker|dextro)/.test(h)) return null;
  if(su>=50) return null;   // überwiegend Zucker: wie eine Süßigkeit bewerten, nicht wie ein Supplement
  if(cat&&cat.id==="whey"&&pr>=50) return "whey";
  // Getränke mit "Multivitamin", "Magnesium" o. Ä. im Namen sind Getränke, keine Supplements (außer Brausetabletten)
  if(cat&&["juice","nectar","softdrink","water","vegjuice","alcohol","tea","coffee","dairy","kefir","coffeemilk"].includes(cat.id)&&!/(kapsel|tablette|tabl|caps|pulver|powder|sticks)/.test(h)) return null;
  if(/(kreatin|creatin)/.test(h)) return "crea";
  if(/(kollagen|collagen)/.test(h)&&(pr>=60||+item.kcal<50)) return "col";
  if(/(vitamin ?d|vit\.? ?d3|( |^)d3( |$))/.test(h)) return "d3";
  if(/omega ?-?3/.test(h)&&/(kapsel|caps|softgel|krill|algen|fischol|epa|dha|vegan|tabl)/.test(h)) return "o3";
  if(/magnesium/.test(h)) return "mg";
  if(/(( |^)b ?12( |$)|vitamin b)/.test(h)) return "b12";
  if(/(multivitamin|vitamin [ace]( |$)|( |^)zink|selen|eisen ?tabl|calcium ?tabl|kapseln|tabletten|brausetabl|elektrolyt|nahrungserganzung)/.test(h)&&su<30) return "gen";
  return null;
}
// Emoji für Supplements aus der Datenbank (sonst sieht die Liste leer aus)
const R_SUP_EMO={crea:"💪",whey:"🥛",col:"✨",d3:"☀️",o3:"🐟",mg:"🌙",b12:"🌱",gen:"💊"};
function supEmoji(item){ const k=rSupKind(item," "+NORM(item.name||"")+" ",null); return k?R_SUP_EMO[k]:null; }
function rSupFood(item,kind,g,h){
  const r=supScore(kind,g), good=[...r.good], bad=[...r.bad]; let sc=r.score;
  const su=+item.sugar||0;
  if(su>=20){ sc-=12; bad.unshift("Als Gummi/Pulver mit viel Zucker"); }
  else if(/(brausetabl|zero|sussstoff|sucralose|aspartam)/.test(h)){ sc-=4; bad.push("Oft mit Süßstoffen"); }
  return { score:Math.max(40,Math.min(99,Math.round(sc))), good:good.slice(0,3), bad:bad.slice(0,3), reasons:[r.why], notes:r.notes||[] };
}
function scoreFood(item,goal){
  const g=goal||state.profile.goal, gi=Math.max(0,R_GOALS.indexOf(g));
  R_MICRO_HIT=null;
  const C=rClassify(item), cat=C.cat, nut=C.nut, heavy=C.heavy, nova=C.nova, h=C.h, words=C.words;
  const supK=typeof supScore==="function"?rSupKind(item,h,cat):null;
  if(supK) return rSupFood(item,supK,g,h);
  const {kc,pr,cb,fa,su,fi,sa}=nut;
  const id=cat?cat.id:"", pros=[], cons=[];
  const good=(t,w)=>{ if(t) pros.push({t,w}); }, bad=(t,w)=>{ if(t) cons.push({t,w}); };
  let score;
  const catTexts=(s,fn,w0)=>String(s||"").split("|").forEach((t,i)=>{
    if(!t) return; const p=t[0];
    if(p==="~"){ if(kc<300) return; t=t.slice(1); }
    else if(p==="+"){ if(pr<12) return; t=t.slice(1); }
    else if(p==="%"){ if(fa<10) return; t=t.slice(1); }
    fn(t,w0-i);
  });
  // 1) Grundwert der Art (Wissen: naturbelassen, Primal, typische Mikronährstoffe)
  if(cat){
    score=cat.b[gi];
    catTexts(cat.g[gi],good,11); catTexts(cat.x[gi],bad,11);
  } else {
    const B={1:[66,68,70,66],2:[56,54,56,58],3:[50,48,46,50],4:[30,26,22,28]};
    score=(B[nova]||(item.processed?[34,30,24,30]:[52,52,52,52]))[gi];
    if(nova===1) good("Unverarbeitet",10);
    if(heavy) bad("Stark verarbeitet mit Zusätzen",12);
  }
  // 2) Nährwerte dieses einen Produkts: besser/schlechter als typisch für seine Art
  const N=rNutri(nut,id);
  if(N){
    const med=(R_MED[id||("_"+(nova||0))]||R_MED._0)[gi];
    // Gerichte: Zutaten unbekannt, deshalb vorsichtiger. Nicht erkannt: Nährwerte sind das Einzige, was wir wissen → stärker gewichten
    const lim=!cat?28:["mixedmeal","readymeal"].includes(id)?12:18;
    score+=Math.max(-lim,Math.min(lim,R_K[gi]*(N[gi]-med)));
  }
  // 3) Texte aus den echten Nährwerten
  const ps=kc>0?pr*4/kc:0, cs=kc>0?cb*4/kc:0, fs=kc>0?fa*9/kc:0, sr=cb>0?su/cb:0, fr=cb>0?fi/cb:0;
  const carbGood=cl(1-sr*1.4)*0.65+cl(fr*7)*0.35, fruity=R_FRUITY.includes(id), drink=kc<8||["coffee","tea","water"].includes(id);
  // Lob für Protein/Carbs nur bei echtem Essen (kein "viel Protein" für Donuts)
  const junk=["sweets","chips","fastfood","sugar","softdrink","cereal","alcohol","sauce","margarine","seedoil"].includes(id), realFood=!cat||cat.w, okFood=!junk&&!(heavy&&!cat);
  if(!drink){
    if(g==="muscle"){
      if(okFood){
        if(pr>=20&&ps>=0.35) good("Sehr viel Protein ("+rG(pr)+" g)",15);
        else if(ps>=0.4&&pr>=7) good("Viel Protein, wenig Kalorien",14);
        else if(pr>=12) good("Viel Protein ("+rG(pr)+" g)",11);
      }
      if(realFood&&cb>=15&&cs>=0.45&&carbGood>=0.6) good("Gute, langsame Carbs",9);
      if(pr<5&&kc>=20) bad("Wenig Protein ("+rG(pr)+" g)",10);
      else if(["mixedmeal","readymeal"].includes(id)&&ps<0.2&&kc>=60){ score-=6; bad("Wenig Protein für ein Hauptgericht",10); }
      if(fs>0.65&&pr>=5&&pr<15&&ps<0.2&&!R_GOODFAT.includes(id)) bad("Viel Fett, wenig Protein",9);
    } else if(g==="lose"){
      if(kc<=60&&realFood) good("Nur "+kc+" kcal pro 100 g",13);
      else if(kc<=120&&realFood) good("Wenig Kalorien ("+kc+" kcal)",10);
      if(okFood&&ps>=0.4&&pr>=7) good("Viel Protein – macht satt",12);
      if(fi>=5) good("Viele Ballaststoffe – sättigt",9);
      if(kc>=400) bad("Sehr kalorienreich ("+kc+" kcal)",13);
      else if(kc>=250) bad("Kalorienreich ("+kc+" kcal)",9);
    } else if(g==="skin"){
      if(fi>=5&&cat&&cat.w) good("Ballaststoffe für einen gesunden Darm",6);
      if(cb>=20&&cs>0.55&&carbGood<0.45&&!fruity) bad("Schnelle Carbs lassen Blutzucker springen",10);
    } else {
      if(realFood&&cb>=15&&cs>=0.45&&carbGood>=0.6) good("Langsame Carbs – Energie über Stunden",12);
      if(fs>=0.5&&R_GOODFAT.includes(id)) good("Gesunde Fette – lange Energie",10);
      if(okFood&&pr>=10) good("Protein hält die Energie stabil",7);
      if(cb>=20&&carbGood<0.4&&!fruity) bad("Schnelle Carbs, schnelles Tief",9);
    }
    if(su>=12&&id==="darkchoc") bad("Enthält Zucker ("+rG(su)+" g) – in Maßen",10);
    else if(su>=12&&!fruity) bad("Viel Zucker ("+rG(su)+" g)"+(g==="skin"?" – kann Unreinheiten fördern":g==="energy"?" – danach Tief":""),13);
  }
  // 4) Mikronährstoffe einzelner Lebensmittel (nur bei naturbelassenen)
  if(cat&&(cat.w||["darkchoc","vegjuice","fermentedveg","nectar"].includes(id))&&!heavy){
    const GK=["m","l","s","e"][gi], TK="t"+GK, BK="b"+GK;
    // Bester Treffer: Hauptwort vor Bestimmungswort (Rinder„fond“ = Fond, nicht Rind)
    let hit=null, hs=0; for(const x of R_MICRO){ if(/seelachs/.test(h)&&x.k.includes("lachs")) continue; const v=Math.max(...x.k.map(k=>kwHit(h,words,k))); if(v>hs){ hs=v; hit=x; if(v===2) break; } }
    // Fruchtjoghurt oder Käse "mit Heidelbeere": Die Frucht ist nur Geschmack, ihre Vitamine zählen nicht
    if(hit&&["dairy","protdairy","kefir","cheese","butter"].includes(id)&&!hit.k.some(k=>/ziegen|schafs|feta|hirten|buffel|kefir/.test(k))) hit=null;
    R_MICRO_HIT=hit;
    if(hit){ score+=hit[GK]||0; if(hit[TK]) good(hit[TK],12.5); if(hit[BK]) bad(hit[BK],8); }
  }
  // 5) Sonderfälle innerhalb einer Art
  // Zero/Light: Beim Abnehmen zählen vor allem die Kalorien, deshalb im Mittelfeld (besser als mit Zucker, Wasser bleibt besser)
  if(id==="softdrink"&&su<1){ const zero=kc<10; score+=[8,zero?47:18,8,6][gi]; cons.length=0;
    if(g==="lose"&&zero){ good("Kaum Kalorien – bremst das Abnehmen nicht",13); good("Besser als die Variante mit Zucker",12); bad("Wasser ist noch besser: ohne Süßstoffe & Zusätze",12); }
    else bad("Süßstoffe und Zusätze, keine Nährstoffe",12); }
  if(id==="softdrink"&&/(energy|red bull|monster)/.test(h)&&g==="energy") bad("Viel Koffein, danach oft ein Tief",13);
  // Saft: Mikronährstoffe gegen Zucker abwägen. Smoothie (mit Fruchtfleisch) und Direktsaft besser, Konzentrat etwas schlechter
  // Honig: Imkerhonig/roh/kaltgeschleudert ist naturbelassener als Industrie-Mischhonig
  if(id==="honey"){
    if(/(imker|roh|raw|kaltgeschleudert|wabenhonig|waben|naturbelassen|regional|heimisch|deutscher honig|aus deutschland)/.test(h)){ score+=[3,3,6,4][gi]; good("Imkerhonig: roh & naturbelassen",12.5); }
    else if(/(eu-?landern|nicht-eu|mischung|aus eu)/.test(h)){ score-=[1,1,3,2][gi]; bad("Mischhonig: oft stark erhitzt",7); }
    if(/manuka/.test(h)){ score+=[1,1,5,2][gi]; good("Manuka-Honig",12); }
  }
  if(id==="juice"){
    if(/smoothie/.test(h)){ score+=[2,3,5,4][gi]; good("Mit Fruchtfleisch: mehr Ballaststoffe",9); }
    if(/(direktsaft|frisch gepresst|naturtrub|100 ?%|nfc)/.test(h)){ score+=[1,0,3,2][gi]; good("Direktsaft: mehr Vitamine",8); }
    else if(/konzentrat/.test(h)){ score-=[1,0,3,2][gi]; bad("Aus Konzentrat: weniger Vitamine",7); }
  }
  // Milchprodukte mit zugesetztem Zucker (Milch hat von Natur aus ca. 5 g): Fruchtjoghurt, Kakao, Fruchtquark
  if(["dairy","kefir","protdairy"].includes(id)&&su>6.5){ const z=Math.min(18,(su-6)*1.5); score-=[z,z,z*1.2,z][gi]; bad("Zugesetzter Zucker ("+rG(su)+" g)",12); }
  // Sahne, Frischkäse, Crème fraîche: viel Fett, wenig Protein – nicht wie Milch oder Joghurt bewerten
  if(id==="dairy"&&kc>150&&fa*9/kc>0.6&&pr<8){ score+=[-16,-14,-6,-8][gi]; bad(g==="lose"?"Viel Fett, viele Kalorien":"Viel Fett, wenig Protein",11); }
  // Pflanzliches Proteinpulver: kein Milcheiweiß, also auch kein Molke-Hinweis für die Haut
  if(id==="whey"&&/(vegan|pflanzlich|erbse|pea |soja|reisprotein|plant)/.test(h)){ const i=cons.findIndex(x=>/Molke/.test(x.t)); if(i>=0) cons.splice(i,1); if(g==="skin") bad("Isoliertes Pulver mit Zusätzen",9); }
  // Milch & Joghurt: Vollfett ist naturbelassener und für die Haut besser als fettarm
  if(id==="dairy"||id==="kefir"){
    const low=fa<2||/(fettarm|mager|entrahmt|0,1|0,3|1,5|light|leicht)/.test(h), full=!low&&(fa>=3||/(vollmilch|vollfett|3,5|3,8|4,0)/.test(h));
    if(full){ score+=[2,0,10,3][gi]; if(g!=="lose") good(g==="skin"?"Vollfett: besser für die Haut als fettarm":"Vollfett: naturbelassener",g==="skin"?13:10); }
    else if(low){ score+=[-1,2,-6,-2][gi]; if(g==="skin") bad("Fettarm: für die Haut eher ungünstiger",11); else if(g==="lose") good("Fettarm: weniger Kalorien",9); }
  }
  // Naturbelassenes Lebensmittel, aber stark verarbeitet (z. B. Fruchtjoghurt mit Zusätzen)
  if(cat&&cat.w&&heavy){ score-=nova>=4?14:9; bad(["poultry","redmeat","leanfish","fattyfish"].includes(id)&&sa>=1.2?"Verarbeitet: Salz & Zusätze":"Stark verarbeitet mit Zusätzen",14); }
  if(sa>1.5&&id!=="spice") { score-=Math.min(10,(sa-1.5)*4); bad((g==="skin"?"Viel Salz – kann aufschwemmen":"Viel Salz")+" ("+rG(sa)+" g)",9); }
  // Primal-Blick: Soja, Süßstoffe, Pflanzenöle im Namen
  if(!["soy","ersatz","sauce","plantmilk"].includes(id)&&/(soja|\bsoy\b)/.test(h)){ score-=8; bad("Enthält Soja – nicht naturbelassen",10); }
  if(heavy&&/(zero|light|zuckerfrei|sugar free|ohne zucker|sussstoff|sussungsmittel|sucralose|aspartam)/.test(h)&&id!=="softdrink"){ score-=6; bad("Mit Süßstoffen",9); }
  if(!["seedoil","margarine"].includes(id)&&/(sonnenblumenol|rapsol|palmol|pflanzenol)/.test(h)){ score-=5; bad("Mit raffiniertem Pflanzenöl",8); }
  rateQuality(item,id,h,(v,t,w)=>{ score+=v; (v>0?good:bad)(t,w); });
  score=rSoft(score);
  // 6) Persönliches aus dem Fragebogen
  const ea=state.coach.answers.gesundheit||{};
  const MEATC=["fattyfish","leanfish","poultry","redmeat","organ","broth","processedmeat"], ANIC=MEATC.concat(["egg","protdairy","kefir","dairy","cheese","butter","whey"]);
  const plant=["ersatz","plantmilk","soy"].includes(id);
  const meat=!plant&&(MEATC.includes(id)||foodHas(item,"meat")), animal=meat||!plant&&(ANIC.includes(id)||foodHas(item,"lak")||foodHas(item,"egg"));
  const P=(v,t)=>{ v=Math.round(v); if(!v) return; score+=v; (v>0?good:bad)(t,50+Math.abs(v)); };
  // Die Zahl sagt nur: wie gesund + wie gut fürs Ziel. Ernährungsform und Vorlieben ändern sie NICHT,
  // sie erscheinen nur als neutraler Hinweis unter der Bewertung.
  const cap=98, notes=[], NOTE=t=>{ if(!notes.includes(t)) notes.push(t); };
  if(ea.stil==="Vegan"&&animal) NOTE("Tierisch – passt nicht zu deiner veganen Ernährung");
  else if(ea.stil==="Vegetarisch"&&meat) NOTE("Enthält Fleisch oder Fisch – passt nicht zu deiner vegetarischen Ernährung");
  // Was die Person meiden will
  const meiden=(ea.meiden||[]).filter(x=>x!=="Nichts");
  const M=(v,t)=>NOTE(t);
  if(meiden.includes("Zucker")&&su>=8&&!R_FRUITY.includes(id)) M(0,"Viel Zucker – du willst Zucker meiden");
  if(meiden.includes("Milchprodukte")&&(["protdairy","kefir","dairy","cheese","butter","whey","coffeemilk"].includes(id)||foodHas(item,"lak"))&&!plant) M(-22,"Du willst Milchprodukte meiden");
  if(meiden.includes("Gluten")&&glu0(id,item,h)) M(-22,"Du willst Gluten meiden");
  if(meiden.includes("Soja")&&(["soy","ersatz"].includes(id)||/(soja|\bsoy\b|tofu|tempeh)/.test(h))) M(-22,"Du willst Soja meiden");
  if(meiden.includes("Schweinefleisch")&&/(schwein|speck|bacon|salami|leberkase|mett|kassler|kasseler|lyoner|leberwurst|chorizo|serrano|prosciutto|parma|bratwurst|wiener|frankfurter)/.test(h)) M(-25,"Enthält (meist) Schweinefleisch");
  if(meiden.includes("Rotes Fleisch")&&(id==="redmeat"||id==="processedmeat")) M(-18,"Du willst rotes Fleisch meiden");
  if(meiden.includes("Alkohol")&&id==="alcohol") M(-25,"Du willst Alkohol meiden");
  if(meiden.includes("Koffein")&&(foodHas(item,"caf")||id==="coffee"||id==="coffeemilk")&&!/(entkoffeiniert|koffeinfrei)/.test(h)) M(-15,"Du willst Koffein meiden");
  if(meiden.includes("Fertigprodukte")&&heavy) M(-12,"Du willst Fertigprodukte meiden");
  // Haut-Probleme: beim Ziel Haut voll, sonst halb
  const hp=((state.coach.answers.haut||{}).stoert||[]), hk=g==="skin"?1:0.5, H=(v,t)=>{ v=Math.round(v*hk); if(!v) return; score+=v; (v>0?good:bad)(t,35+Math.abs(v)); };
  const microTxt=(R_MICRO_HIT&&R_MICRO_HIT.ts)||"";
  if(hp.includes("Unreinheiten")){
    if(["protdairy","kefir","dairy","cheese","whey","coffeemilk"].includes(id)&&!plant) H(-7,"Milch kann deine Unreinheiten verstärken");
    else if(su>=12&&!R_FRUITY.includes(id)) H(-6,"Zucker kann deine Unreinheiten verstärken");
    if(/zink|omega/i.test(microTxt)||["fattyfish","organ"].includes(id)) H(5,"Liefert Zink/Omega-3 für die Haut");
  }
  if(hp.includes("Rötung")){
    if(id==="alcohol") H(-8,"Alkohol verstärkt Rötungen");
    if(/omega/i.test(microTxt)||id==="fattyfish") H(5,"Liefert Omega-3-Fettsäuren");
  }
  if(hp.includes("Trockenheit")&&(R_GOODFAT.includes(id)||/omega|vitamin e/i.test(microTxt))&&!heavy) H(5,"Gute Fette für die Haut");
  if((hp.includes("Wirkt stumpf")||hp.includes("Pigmentflecken"))&&(["berries","skinveg","vitc","vegjuice"].includes(id)||/antioxid|vitamin c|carotin/i.test(microTxt))&&!heavy) H(5,"Antioxidantien für einen frischen Teint");
  if(hp.includes("Erste Fältchen")&&(["broth","fattyfish","vitc"].includes(id)||/kollagen|vitamin c/i.test(microTxt))&&!heavy) H(5,"Kollagen & Vitamin C für die Haut");
  if(hp.includes("Glänzt / große Poren")&&["refined","sweets","fastfood","chips","cereal"].includes(id)) H(-5,"Schnelle Carbs können fettige Haut fördern");
  const fokus=foodFocus(), intol=ea.intol||[];
  const lak=["protdairy","kefir","dairy","cheese","whey","coffeemilk"].includes(id)||foodHas(item,"lak")&&!plant;
  const glu=["wholewheat","refined"].includes(id)||foodHas(item,"glu");
  const nutA=["nuts","peanut"].includes(id)||foodHas(item,"nut");
  // Lang gereifter Hartkäse und Butter/Ghee haben kaum Laktose
  const lakArm=id==="cheese"&&/(gouda|emmental|parmesan|parmigiano|grana|bergkase|cheddar|gruyere|comte|pecorino|tilsiter|edamer|leerdam|appenzeller|manchego|gereift|alter |alt )/.test(h)||id==="butter"||/(ghee|butterschmalz)/.test(h);
  if(intol.includes("Laktose")&&lak&&!/(laktosefrei|lactosefrei)/.test(h)){ if(lakArm) NOTE("Gereift bzw. reines Milchfett: meist fast laktosefrei"); else P(-25,"Kann Laktose enthalten"); }
  if(intol.includes("Gluten")&&glu&&!/glutenfrei/.test(h)) P(-25,"Kann Gluten enthalten");
  if(intol.includes("Nüsse")&&nutA) P(-30,"Kann Nüsse enthalten");
  // Zucker-Fokus: Obst & Co. haben ihren Zucker von Natur aus (mit Ballaststoffen), deshalb kein Abzug
  const addedSu=su>5&&!R_FRUITY.includes(id)&&!(["dairy","kefir","protdairy"].includes(id)&&su<=6);
  if(fokus.includes("Weniger Zucker")&&addedSu) P(-Math.min(12,su*0.6),"Viel Zucker – dein Fokus");
  if(fokus.includes("Zucker & Haut")&&addedSu) P(-Math.min(10,su*0.5),"Zucker – dein Haut-Fokus");
  if(fokus.includes("Mehr Protein")&&pr>=10) P(Math.min(8,pr*0.3),"Viel Protein – dein Fokus");
  if(fokus.includes("Weniger Fertiges")&&heavy) P(-8,"Fertigprodukt – dein Fokus");
  if(fokus.includes("Weniger Salz")&&sa>0.8) P(-Math.min(10,(sa-0.5)*6),"Salzig – dein Fokus");
  if(fokus.includes("Mehr Ballaststoffe")&&fi>=4) P(Math.min(6,fi*0.6),"Ballaststoffe – dein Fokus");
  if(fokus.includes("Sättigung")&&((pr>=10&&kc<=250)||fi>=6)) P(5,"Macht lange satt");
  if(fokus.includes("Koffein am Abend")&&foodHas(item,"caf")) P(-4,"Koffein: nach 15 Uhr meiden");
  rTextCheck(pros,cons,{kc,pr,fa,su,fiber:item.fiber,h,id});
  const out=rateOut(Math.min(cap,score),pros,cons); out.notes=notes; return out;
}
// Typische Nährwert-Bewertung je Art (Median aus 100.000 Produkten), Reihenfolge: Muskeln, Abnehmen, Haut, Energie
const R_MED={_0:[34,45,80,14],_1:[52,41,85,39],_2:[1,1,73,0],_3:[35,48,82,15],_4:[26,44,78,12],alcohol:[0,54,85,0],avocado:[10,47,100,28],banana:[10,50,51,11],berries:[8,55,50,5],broth:[35,81,85,8],butter:[1,-27,95,15],cereal:[29,14,64,23],cheese:[56,35,82,14],chips:[28,8,86,28],coconut:[7,39,95,18],coffeemilk:[16,58,49,5],dairy:[20,55,80,6],darkchoc:[9,-14,77,16],driedfruit:[-24,-12,-9,-33],egg:[58,62,95,30],ersatz:[42,52,86,21],fastfood:[46,46,85,28],fattyfish:[75,61,95,30],fermentedveg:[9,69,85,10],fruit:[4,50,45,2],goodfat:[0,-28,95,15],honey:[-59,-38,-50,-60],juice:[2,53,45,1],kefir:[16,65,85,5],leanfish:[85,77,85,15],legume:[58,57,94,36],margarine:[1,-15,73,0],mixedmeal:[34,53,84,17],nectar:[1,50,42,0],nuts:[38,4,100,37],oats:[52,38,87,47],organ:[85,76,95,26],peanut:[43,8,93,25],plantmilk:[8,60,68,6],potato:[32,58,85,27],poultry:[87,77,85,15],processedmeat:[49,42,81,13],protdairy:[78,78,85,15],proteinbar:[78,49,85,23],pseudograin:[55,34,87,48],readymeal:[37,50,83,19],redmeat:[81,65,95,29],refined:[52,36,83,42],rice:[46,26,76,38],ricecake:[45,20,73,36],sauce:[10,34,75,5],seedoil:[0,-28,73,0],skinveg:[10,65,65,8],softdrink:[0,52,45,0],soy:[63,67,86,18],spice:[30,56,85,11],sugar:[-42,-16,-31,-57],sweetpotato:[24,52,75,18],sweets:[-9,-18,29,-21],tea:[95,65,100,53],veg:[10,62,82,8],vegjuice:[5,63,53,5],vitc:[1,55,47,0],water:[33,55,85,18],whey:[90,46,85,16],wholewheat:[56,42,97,54]};
// Feste Texte einer Art passen nicht zu jedem Produkt (z. B. "kaum Fett" bei Thunfisch in Öl).
// Was die Nährwerte dieses Produkts widerlegen, fliegt raus; Zucker-Texte werden bei wenig Zucker neutral umformuliert.
const R_SUGAR_FIX=[[/^Viel Zucker, kaum Protein$/,"Wenig Nährstoffe, kaum Protein"],[/^Viel Zucker, macht nicht lange satt$/,"Schnelle Carbs, macht nicht lange satt"],
  [/^Gezuckerte Flocken, wenig Protein$/,"Verarbeitete Flocken, wenig Protein"],[/^Zucker & Weißmehl – ungünstig für die Haut$/,"Weißmehl – ungünstig für die Haut"],
  [/^Zucker kann Unreinheiten fördern$/,"Schnelle Carbs können Unreinheiten fördern"],[/^Zucker macht danach oft müde$/,"Schnelle Carbs machen danach oft müde"],
  [/^Viel Zucker, viele Kalorien$/,"Viele Kalorien, wenig Nährstoffe"]];
function rTextCheck(pros,cons,n){
  const glut=/(weizen|dinkel|roggen|gerste|grunkern|emmer|einkorn|kamut|brot|pasta|nudel|couscous|bulgur)/.test(n.h);
  const fib=n.fiber!=null&&n.fiber!=="";
  const badPro=t=>{ t=t.toLowerCase();
    if(/(wenig|kaum) kalorien(?! pro stück)|nur \d+ kcal|kaum kalorien|viel volumen/.test(t)&&n.kc>120) return true;
    if(/(ohne kalorien|null kalorien|kalorienfrei|fast ohne kalorien)/.test(t)&&n.kc>(n.id==="spice"?200:20)) return true;
    if(/sehr viel protein/.test(t)&&n.pr<15) return true;
    if(/(viel protein|proteinreich|liefert protein|mehr protein als)/.test(t)&&n.pr<8) return true;
    if(/kaum fett/.test(t)&&n.fa>5) return true;
    if(/wenig zucker/.test(t)&&n.su>10) return true;
    if(/ballaststoff/.test(t)&&fib&&+n.fiber<1.5) return true;
    if(/glutenfrei/.test(t)&&glut) return true;
    return false; };
  for(let i=pros.length-1;i>=0;i--) if(badPro(pros[i].t)) pros.splice(i,1);
  for(let i=cons.length-1;i>=0;i--){ const t=cons[i].t, l=t.toLowerCase();
    if(/^kein protein/.test(l)&&n.pr>=3||/^(kaum|fast kein) protein/.test(l)&&n.pr>=8||/^wenig protein$/.test(l)&&n.pr>=12) { cons.splice(i,1); continue; }
    if(/zucker/.test(l)&&!/zugesetzt|süßstoff|zuckeralkohol/.test(l)&&n.su<12&&!["sugar","softdrink","nectar","honey","juice","driedfruit"].includes(n.id)){
      const f=R_SUGAR_FIX.find(([re])=>re.test(t)); if(f) cons[i]={t:f[1],w:cons[i].w}; else if(/^viel zucker/.test(l)) cons.splice(i,1);
    }
  }
}
// Höchstens 3 gute und 3 schlechte Punkte, wichtigste zuerst, jedes Thema nur einmal
// Wichtige Wörter eines Textes (für "sagt nicht zweimal dasselbe")
const R_STOP=new Set(["fur","die","der","das","und","mit","haut","energie","lange","lang","gut","gute","guter","viel","viele","wenig","sehr","top","kaum","eine","einen","nach","beim","oder","ohne","dein","deine","bei","als","pro","kann","fur","ist","nur","noch"]);
function rKeys(t){ return NORM(t).split(/[^a-z0-9]+/).filter(w=>w.length>=3&&!R_STOP.has(w)&&!/^\d/.test(w)).map(w=>w.slice(0,4)); }
function rateOut(score,pros,cons){
  const pick=(l,block)=>{ const seen=new Set(), keys=new Set(block||[]), out=[];
    l.sort((a,b)=>b.w-a.w).forEach(x=>{ const k=rTopic(x.t), ks=rKeys(x.t);
      if(seen.has(k)||out.length>=3||ks.some(w=>keys.has(w))) return;
      seen.add(k); ks.forEach(w=>keys.add(w)); out.push(x.t); });
    return out; };
  const bad=pick(cons);
  // Kein Widerspruch: wenn "Wenig Protein" schlecht ist, nicht gleichzeitig Protein loben
  const good=pick(pros,bad.some(t=>/(wenig|kaum|kein|fast kein) protein/i.test(t))?["prot"]:[]);
  return { score:Math.max(5,Math.min(98,Math.round(score))), good, bad, reasons:[] };
}
// Gut/Schlecht-Liste für die Anzeige (gleich für Essen und Pflege)
function rateList(sc){
  const g=sc.good||[], b=sc.bad||[];
  if(!g.length&&!b.length) return `<p class="sub">${esc((sc.reasons||[]).join(" "))}</p>`;
  return `<div class="rpc">${g.map(t=>`<div class="rp"><i>✓</i><span>${esc(t)}</span></div>`).join("")}${b.map(t=>`<div class="rc"><i>✕</i><span>${esc(t)}</span></div>`).join("")}</div>`;
}

// Qualität: Bio, Weide, Freiland, Wildfang leicht besser; Günstigmarken & einfache Haltung leicht schlechter.
// Text bei Günstigmarken neutral halten (keine Marke nennen, nichts behaupten, was nicht am Produkt steht).
// Nur kleine Unterschiede (max. ±4), weil Haltung am Namen nicht sicher erkennbar ist.
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
    if(bio){ v+=3; t.push(id==="egg"?"Bio-Eier: beste Haltung":fish?"Bio: kontrollierte Herkunft":"Bio: bessere Haltung & Futter"); }
    if(weide){ v+=bio?1:3; t.push("Weidehaltung: mehr Omega-3"); }
    if(free&&!bio){ v+=3; t.push(id==="egg"?"Freiland: bessere Haltung":"Bessere Haltung (Stufe 3+)"); }
    if(wild){ v+=3; t.push("Wildfang statt Zucht"); }
    else if(msc&&!bio){ v+=1; t.push("MSC: nachhaltiger Fang"); }
    if(v){ add(Math.min(4,v),t[0],40); return; }
    if(low){ add(-3,id==="egg"?"Einfache Haltung (Bodenhaltung)":fish?"Aus Zucht (Aquakultur)":"Einfache Haltung (Stufe 1–2)",40); return; }
    if(budget&&id!=="broth") add(-2,"Einfachere Qualitätsstufe",40);
  } else if(bio&&!["sweets","softdrink","alcohol","chips","fastfood","sugar","cereal","ersatz","plantmilk","margarine","seedoil","readymeal","sauce","proteinbar"].includes(id)){
    add(2,"Bio: weniger Pestizide",20);
  }
}
