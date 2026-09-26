/**
 * THE DAILY WORDS' POOLS FOR DE, one list of versions per length.
 *
 * WRITTEN BY `node scripts/daily-pools.ts`, NEVER BY HAND, and never rewritten: each
 * entry is a frozen copy of an answer list, and the days of every cycle it
 * serves were drawn from exactly these words. `dailyPools.test.ts` holds each
 * entry to its hash. A newer list is a new entry from a later cycle.
 *
 * From src/lib/puzzles/gomoji/words.de.data.ts, whose notice follows:
 *
 *   THE GERMAN WORDS FOR GOMOJI. Written by `scripts/word-lists-fr-de.mjs`, read 2026-09-26, from
 *   LanguageTool's german-pos-dict (Morphy and korrekturen.de,
 *   https://github.com/languagetool-org/german-pos-dict), which decides what is a
 *   word; ranked by hermitdave's FrequencyWords (OpenSubtitles 2018,
 *   https://github.com/hermitdave/FrequencyWords, content/2018/de/de_50k.txt; word
 *   frequency lists compiled by Hermit Dave from https://opensubtitles.org); and
 *   Wiktionary (via https://kaikki.org), which an answer must also be in, and which
 *   says where a word English also spells came from. All under CC BY-SA 4.0
 *   (https://creativecommons.org/licenses/by-sa/4.0/), and this list with them.
 *   Never edited by hand; run the script again instead.
 *
 *   Every word the dictionary has may be guessed. An answer is also in
 *   Wiktionary, a base form, a word of this language rather than one borrowed
 *   from English, and not vulgar or a slur (the script says how).
 *   Ä, Ö and Ü are kept as letters of their own; a word with ß is left out, the way French leaves out œ and æ.
 */
import type { PackedDailyPool } from "./dailyWords.types";

export const DAILY_POOL_DE: Record<number, readonly PackedDailyPool[]> = {
  4: [
    {
      fromCycle: 0,
      source: "the 4-letter answers (medium and hard) of words.de.data.ts, read 2026-09-26",
      words: `
aber acht adel ader affe ahne ahoi akku akne akut also amen amme anno arie arzt asta asyl atem atom
auch aufs auge aula aura auto bach bahn bald balg ball band bang bank bann bart base bass baum beau
beet beil beim bein berg bete bett bier bild biss blau blei blut blöd bock boje boot bord bote brav
brei brot brut bube buch bude bund bunt burg böse büro chef chic chor clou cola coup dach dame damm
dank dann darm dass dazu deck dein denn derb deut dick dieb ding dino diva diät doch doku doll doof
dorf dorn dort dose dran drei drin duft dumm dutt däne dünn dürr düse ebbe eben eber echo echt edel
egal eher ehre eile eins ekel elbe elch elfe elle ende ente erbe erde erst esel etat etui etwa euer
eule euro ewig exil fach fakt fall fang farn fass fast faul fehl fein feld fell fels fern fest fete
fett fies fink floh flug flur flut fond form fort foto frau frei froh früh fund föhn fünf fürs gabe
gage gala gang gans ganz garn gast gaul geiz gelb geld gern gier gift gips glas glut gmbh gold golf
gott grab grad graf gral gras grau grob gros grün gurt göre güte haar habe haft hahn halb hall hals
halt hand hang hart harz hase hass hast haus haut heck heer heft hege heil heim held hell helm hemd
herb herd herr herz heut hexe hier hirn hoch hohl hohn hold holz horn hort hose huhn hund hupe höhe
idee idol igel iglu imam irin irre jagd jahr jota judo juhu juli jung juni jura just kaff kahl kahn
kalb kali kalk kalt kamm kamp kanu karo kauf kaum keck keil keim kein keks kerl kern kind kinn kino
kita klan klar klee klon klub klug knie koch kode kohl koks koma kopf korb korn kost kram kran krug
kuli kult kurs kurz kuss käse kühl kühn lack lade lage lahm laib laie lake lama lamm land lang last
laub lauf laus laut lava leck leer lehm leib leid leim lenz lese lieb lied lift liga lila link list
loch loge logo lohn lose luft lump lupe lust lärm löwe lüge made magd mahl maid mail mais mann mast
maul maus meer mehl mehr mein menü mies mild mine mode mofa mohn mohr mole moll mond moor moos mopp
mops mord muff mund märz möwe müde mühe müll nach nahe naht naiv naja name napf narr nase nass navi
nazi neid nein nerv nest nett netz neun noch nord note null nuss nähe oase oben ober obst oder ofen
ohne omen oper opus paar pack page pakt papa pass pate patt pech pein pelz pest pfad pfau pfui pier
pike pils pilz plan plus poet pony pose post pott pult puma pute putz qual quer rabe rage rand rang
rast rate raub rauf raum raus real rede rege reha reif reim rein reiz rest reue rind ring riss ritt
robe rock rohr rosa rose rost rotz ruhe ruhm ruhr ruin rund rute rübe rüde saal saat sack saft sage
salz samt sand sarg satt satz saum sehr seil sein seit sekt senf sich sieb sieg silo sims sinn sitz
soda sofa sohn soja sold soll solo spat spuk spur spät stab star stau steg stet stil stur suff säen
säge tabu taco taff takt tanz taub taxi teer teig teil text tief tier tipp toll topf tour trab treu
trog trug trüb tuba tuch turm tutu type türe tüte ufer umso unze uran urin urne vage vase vati verb
vers veto vieh viel vier vize volk voll volt vorn wach wade wahl wahn wahr wald wand wann ware warm
wart watt weck wehr weib weil wein weit welt wenn werk wert west wild wind wink wirr wirt witz wlan
wohl wolf wort wozu wund wurf wurm wüst yoga zahl zahm zahn zart zaun zehe zehn zeit zelt zeug ziel
zimt zink zinn zins zofe zoff zoll zone zopf zorn zwar zwei öden ölen übel üben über
`,
    },
  ],
  5: [
    {
      fromCycle: 0,
      source: "the 5-letter answers (medium and hard) of words.de.data.ts, read 2026-09-26",
      words: `
abbau abend abruf abtei abtun abzug achse achte acker adieu adler agent ahnen aktie aktiv alarm
album alias alibi allee allzu altar amigo ampel anbau angel anger angst anker anmut anruf antik
antun anzug apart apfel april arche areal arena armee armut arten artig asche atlas atmen audio
autor backe baden bahre banal baron basar basis basta bauch bauen bauer beben beige beleg beruf
besen beten beton beuge beule beute bevor bezug bibel biber bidet biege biene biest binde birne
bison bitte blank blase blass blatt blech blick blind blitz blond blume bluse blüte boden bogen
bohne bombe bowle boxen boxer brach brand braun braut breit brett brief brise brite bruch brust
brühe buche bucht bulle busch bussi börse bügel bühne bürde bürge büste cello chaos chlor creme
dabei dachs dafür daher dahin damit dampf danke daran darin darum datei datum dauer davon davor
debüt degen dekan delle depot desto dicht diele disko dogge dolch donut dosen dosis draht drama
drang drauf dreck dritt droge druck duell duett dufte dumpf dunst durch durst duzen döner düsen
ebnen echse ehren eiche eiern eifer eigen eilen eilig eimer einen einer einig einst eisen eisig
eitel eiter ekeln eklig elend elfte elite email enden engel engen enkel enorm enzym erben erbin
erbse erden erdöl erlös ernst ernte erste essen esser essig etage ethik etwas euter exakt extra
fabel fahne fahrt falke falle falls falte famos farbe farce fasan faser fatal faust faxen fazit
feder fegen fehde feier feige feile feind ferse fesch feuer fidel figur filet finte firma first
fisch fixen flach flair fleck flink flora flott fluch fluss flyer flöte fokus folge folie forum
foyer frage frech fremd frist fromm frost frust fuchs fugen funke furie fähig fähre fötus fügen
fülle fünft fürst gabel galle garde gasse gaudi geben geber gebet gebot gegen gehen gehör geier
geige geist gelee gemüt genau genie genre genug gerne gerät geste gesät getan getto getue geölt
geübt gicht glanz glatt gleis glied glück gnade gosse gouda gramm greif greis grell griff groll
grube gruft grund gummi gunst gurke gütig haben hacke hafen hafer hagel haken hallo halse harem
harfe harke hasch haube hauch hauen haupt hebel heben hecht hegen heide heini henne heran herum
hetze heuer heute hexen hilfe hinzu hirte hitze hoden holen honig horde hotel humor hupen hurra
hymne härte höhle hölle hören hörer hüfte hügel hülle hülse hürde hüten hüter hütte ideal igitt
imker immer immun indem inder indes indiz innen innig insel intim irren jacht jacke jagen jetzt
jubel juwel jäger jüdin kabel kader kajak kakao kamel kamin kampf kanal kanne kante kappe karre
karte kasse kaste kater katze kauen kebab kegel kehle kehre kelch kelle kerbe kerze kette keule
kiosk kippe kiste klage klamm klang klaue kleid klein klick klima klotz kluft knabe knall knapp
knast knete knick knien kniff knopf kobra kodex kombi komet komma konto kopie korps krach kraft
krake krank kranz krass kraus kraut krebs kreis kreml kreuz krieg krimi kripo krise krone krumm
krähe kröte kugel kunde kunst kurve kutte käfer käfig kälte köder könig köter kübel küche küken
kürze küste laben labil labor lache lachs laden lager lakai lampe lanze lasch latte laube lauch
lauge laune leben leber leder ledig legal legen leger lehne lehre leier leine leise lesen leser
letzt leute liane licht liege likör lilie linde linie links linse lippe liste liter loben locke
logik lokal losen lotse lotto loyal lunge lunte lurch luxus lyrik länge lösen löwin lücke lügen
mache macho macht macke mafia magen mager magie makel malen maler mamba mambo manga manie mappe
marge marke markt maske masse mathe mauer meile meise meist memme menge mensa messe meter metro
meute miene miete mieze milch miliz mimen minna minne minus minze mitte mixen mobil modul modus
monat moped moral motiv motor motte motto mumie musik mutig mutti mädel mähen mähne möbel mögen
mönch mücke mühen mühle münze müsli mütze nabel nacht nackt nadel nagel nagen nager narbe natur
nebel neben neffe neige nelke nicht niere niete ninja nisse nobel nomen nonne notar notiz nudel
nähen näher nötig obhut ochse offen olive onkel opfer optik orden orgel orgie orkan orten osten
otter outen ozean pacht paket palme pampa panik panne pappe papst parat pasta pater pauke pause
pelle penne perle petze pfahl pfand pfeil pferd pfiff pflug pfote pfund phase piano pille pilot
pinke pirat piste pizza plage plane platt platz plump pokal polin popel porto prall preis prima
prinz prise probe profi promi prosa prost prüde psalm pudel puder pulle pulli pumpe punkt puppe
puste pöbel püree qualm quark quasi quere queue quote rabbi rache radau rampe range rasch rasen
raser rasse raste rasur raten ratte rauch rauen raupe recht reden regal regel regen regie reich
reihe rente revue riese rinde rinne rippe ritze robbe robot rolle roman rosig route rubel rubin
rudel ruder rufen ruhen ruhig ruine rumba rumpf russe röhre römer sache sagen sahne sakko salat
salbe salon salto salut salve samba samen sanft sauce sauer sauna sause schaf schal scham schar
schau scheu schon schub schuh schön sechs seele segel segen sehen seher sehne seide seife seite
selig senat senil senke sense serie serum sesam sicht silbe sippe sirup sitte skala skalp socke
sogar sohle solch somit sonde sonne sonst sorge sorte sowas sowie spalt spass spatz speck speer
spiel spind spion spitz spore spott sprit spule spüle staat stadt stage stahl stall stamm stand
stark starr stasi statt staub steif steig steil stein stern stets stich stieg stiel stier stift
still stirn stock stoff stolz stopp store streu stroh strom stube stuck stufe stuhl stumm stunk
sturm sturz stuss stute stück suche sucht suite summe sumpf super suppe sushi syrer szene säbel
sägen sähen säule säure süden sühne sünde tabak tacho tadel tafel tagen taler tanga tanne tante
tarif tasse taste taufe teich teils tempo tenor teuer theke thema these thron tiger tinte tisch
titel toben tonne torte total trage trakt trank traum traut treck treff trieb trine trist tritt
tropf trost trott trotz truhe trunk trupp träge träne tulpe tumor tusch tuten täter tätig tönen
töten türke tüten ufern ulkig umbau umweg umzug unfug ungut union unmut unser untat unten unter
untot uralt urban vater viech viert villa virus visum vlies vogel vorab voran vorne waage wache
wachs waffe wagen waise wange wanne wanze warum warze waten weben weder wegen wehen weich weide
weihe weile weise welle welpe wende wenig werft wesen wespe weste wette wicht wider wiege wiese
wieso wille wisch witwe wobei woche wodka wofür woher wohin wolke wolle womit wonne woran worin
worum wovon wovor wrack wuchs wucht wurst wärme würde würze wüten zange zarin zebra zeche zecke
zeile zelle zeugs ziege zirka zitat zivil zobel zucht zudem zumal zunge zutat zutun zuvor zwang
zweck zweig zweit zwerg zwirn zwist zwölf zyste zügel zügig ärmel ästen äther öfter ölung übers
übrig übung üppig
`,
    },
  ],
  6: [
    {
      fromCycle: 0,
      source: "the 6-letter answers (medium and hard) of words.de.data.ts, read 2026-09-26",
      words: `
abbild abends abfall abflug abfuhr abgabe abgang abhang abitur ablage ablauf abriss abrupt absage
absatz absurd abteil abwehr abwurf achtel achten ackern adrett affekt affäre agenda agiert ahnung
akkord aktion akzent albern allein alltag altern amboss ameise ananas andere anders anfall anfang
anflug angabe angeln angler anhand anhang anhieb anlage anlass anlauf anonym anrede anreiz ansage
ansatz anteil antrag anwalt anzahl anämie appell araber arbeit archiv arrest arznei asbest aspekt
asthma athlet atmung aufbau aufruf aufzug august ausbau ausruf auster ausweg auszug backen bagger
bahnen balken balkon ballen ballon balsam bambus bammel banane bandit bangen bannen barbar barren
barsch beamen beamer beamte becher becken bedarf beeilt befehl befund begabt begehr beginn behagt
belang belebt belegt bellen bemalt bemüht bengel benzin bequem bereit bereut bergen beruht besagt
besitz bestie besuch betont betrag betrug betten beugen beulen beutel bewegt beweis bezirk biegen
bieten bieter bikini bilanz bilden billig binden binnen bisher bissig bistro bitten bitter bizarr
bizeps blabla blasen bleibe blende bluten blutig blöken blühen bohren bohrer bolzen bomben bonbon
bonsai booten borgen bowlen braten brauch brauen brause bremse brezel brille britin bronze bruder
brutal brücke brüten buchen buckel buffet butter bäcker bäumen büchse bücken büfett büffel bügeln
bündel bündig bürgen bürger bürste cabrio chance charge charme chefin chemie christ clique coupon
cousin coyote dackel daheim damals danach danken darauf daraus dasein dauern daumen deckel decken
defekt dehnen dekret delfin dellen demenz denken denker derart detail deuten devise dezent diakon
dialog diebin dienen diener dienst diesel diktat dingen diplom direkt disput doktor donner doppel
double dozent drache drehen dreier dreist dritte droben drohen drohne drüben drüber dubios ducken
duften dulden dunkel durchs dusche dünger dünnen dürfen düster ebenso effekt ehrbar ehrung eichel
eichen eifrig eigelb eigens eignen einmal einsam einser einzig einzug einöde eisbär eisern ekelig
eltern embryo empört endlos entern entzug enzian episch epoche erbaut erdgas erfolg erhalt erholt
erhöht erhört erlass erlebt erlegt erlöst erneut ernten erregt ersatz ertrag erwerb essbar essenz
etappe examen exfrau exmann exodus extrem fabrik fackel fahren fahrer faible faktor fallen falsch
falten fangen farbig faseln fasern fassen fasten faulen federn fehlen fehler feiern feilen ferien
ferkel fernab ferner fertig fessel fetten fettig fetzen feucht feuern feurig fiasko fieber fiedel
fiktiv filmen filzen finden finder finger firmen flagge flamme flanke flaute flegel flehen fliege
flinte flosse flucht fluten fläche flöten flügel fohlen folgen folter fondue format formel formen
forsch fortan fossil fracht fragen franke fratze freude freuen freund frevel friede frisch frisur
frisör frivol frosch frucht früher fummel funken funker furcht fussel futter fährte fällen fällig
färben fügung fühlen führen führer füllen füller fünfer fünfte gabeln gaffen galant galgen galopp
ganove garage garten gatter gattin gaumen gauner geahnt gebaut gebell gebiet gebiss geboxt gebräu
geburt gebäck gebühr geduld geehrt geerbt gefahr gefaxt gefegt gefeit gefühl gegend gegner gehabe
gehabt gehalt gehege geheim geheul gehirn geholt gehweg gehört geigen geiger geirrt geisel geizig
gejagt gekaut gelage gelebt gelegt gelenk gelobt gelten gelöst gemahl gemalt gemein gemixt gemäht
gemüse genehm genial genick genuss genäht genüge genügt gepard gepäck gerade gerast gerede gering
gerste geruch geruht geröll gerüst gesagt gesang gesetz gespür gestüt gesuch gesund gewagt gewalt
gewand gewebe gewehr geweht geweih gewinn gewiss gewähr geysir gierig giften giftig gigant gipfel
gitter glaser glatze glaube gleich global globus glocke glotze glühen gnädig gockel golden goldig
golfen gondel graben grafik granit grappa grasen grauen grenze grippe grotte gruppe gräuel grölen
grütze gucken gulden gurren guttun gähnen gönnen gönner göttin gültig gürtel haaren haarig hacken
haften hallen halten halter hammel hammer handel hangar happen harken harsch hassen hastig haufen
hausen heften heftig heikel heilen heilig heimat heirat heiser heiter heizen heizer hektar hektik
heldin helfen helfer helium hellen hemmen hengst henkel henker herauf heraus herbst hering herold
herrin hervor herzen herzog hetzen heuern heuert heulen hieran hierin hierzu himmel hinaus hinein
hinken hinten hinter hintun hinweg hirsch hissen hitzig hocken hocker hoffen hoheit hoppla hormon
horror horten hospiz hotdog hummer hummus hunger hurtig husten hybrid hälfte hängen häufen häufig
häuten höchst höhlen hörbar hübsch hüllen hülsen hündin hüpfen imbiss immens impfen impuls ingwer
inhalt inland insekt intakt intern iraker irisch ironie irrtum januar japsen jaulen jawort jedoch
jemals jemand jetlag jodeln joggen johlen jubeln jugend junker jurist justiz jüngst kabine kadett
kaffee kaiser kajüte kaktus kalium kamera kammer kanone kanten kanton kanzel kapern kaplan kappen
kapsel kaputt kapuze karate karren kartei karten karton kasino kaufen kaviar kegeln kehren keller
kennen kenner kerben kerker kessel ketten ketzer keusch kicken kiefer killen kippen kirche kirmes
kissen kitsch kittel kitten kitzel klagen klappe klaren klasse klauen kleben kleber klecks klemme
klerus klette klient klinge klinik klinke klippe kloake klonen kläger klären knarre knebel knecht
kneipe knicks knirps knospe knoten knödel kobold kochen koffer kognak kohlen kojote koller koloss
kommen konfus konsul konsum kontra konvoi koppel korken kosmos kosten kostüm krabbe kragen kralle
krampf krater kredit kreide krippe kritik kruste krypta krähen krämer krätze krönen krücke krümel
kuchen kugeln kultur kummer kumpel kundin kupfer kuppel kurbel kurier kurios kurven kurzum kusine
kutter kämmen käufer köchin ködern können köpfen körper kühlen kürbis kürzen küssen labern lachen
lacher ladung lagern lagune lahmen landen langen lappen lassen lasten laster lauern laufen lausig
lauten lauter lawine lebend leblos lecken lecker leeren legion leguan lehnen lehren lehrer leiche
leicht leiden leider leihen leinen leiste leiten leiter lektor lenken lenker lerche lernen lerner
lesung letzte lieben liegen lineal linsen listen listig lizenz locken locker lohnen lotsen lustig
lähmen längst lässig lästig läufer läuten löffel lösung lüften lügner lümmel machen macher magier
magnet mahlen mailen makler mammut mandat mandel manege mangel mantel marine marmor marsch masche
masern massig massiv matrix matsch mauern maurer maxime meiden meinen melden melken melone mengen
mensch mental merken messen messer metall meteor methan metier miauen mieder mieten mieter milieu
minder minute misere missen mittag mittel modell modeln modern mogeln moment montag morast morden
morgen morsch mosaik motten muffig mulmig munter murmel murren museum muskel muslim muster mutant
mutter mästen möbeln mörder mörtel mühsal mühsam müller münzen müssen nachts nacken nageln nahezu
namens narren nation neblig nehmen neigen nektar nennen nenner nerven nervig nervös neubau neunte
nichte nichts nickel nicken nieder niesen nieten nippen nische nisten niveau norden normen notruf
nudeln nullen nummer nutzen nutzer nymphe nähern nähren närrin nützen obdach oberst objekt obwohl
opfern orakel orange ordnen ordner ortung ostern paaren packen paddel palais palast panzer papier
parade parfum parfüm parken parker partei partie pascha passen passiv patent patron patzer pauken
pausen pendel pennen perlen perser person petzen pfanne pfeife pflege pforte pfütze phobie phrase
physik pickel picken piepen pieper pikant pilger pinsel plagen plakat planen planet planke pleite
plural pochen podest podium poesie pointe pokern police polier pollen portal posten potenz pracht
praxis presse primär privat proben profil profit prägen prämie prüfen prügel psyche pudern pulver
pumpen puppen pusten putsch putzen putzig pyjama python quaken qualle quelle quiche quälen rabatt
rachen racker radius ragout rahmen rakete rallye rammen ramsch ranken rappen rasant rasend rassel
rasten raster ration ratlos ratsam rauben raufen raunen rausch razzia rebell rechts redner reflex
reform regeln regime region regler regnen reiben reifen reihen reimen reisen reiten reiter reizen
rekord rektor relikt reling rennen renner reptil retten retter revier rezept rheuma riegel riemen
riesig ringen ringer rippen risiko ritter ritual ritzen rivale robben robust rochen rocken rocker
roggen rollen roller rosine rosten rostig rotten rubrik rudern rummel runden runter rupfen russin
rutsch rächen rächer rädern rätsel räuber räumen rösten rücken rühmen rühren rüssel rüsten sabber
sachte sacken saftig saison salben salzig sattel sauber saugen sausen schach schade schall scharf
schatz schaum scheck schein schelm schema schere scherz schick schief schier schiff schild schilf
schiri schirm schlaf schlag schlau schmal schnee schnur schock schopf schrei schrot schräg schubs
schuld schule schund schuss schutt schutz schwan schwer schwur schwül segeln segler segnen sehnen
seilen sektor selber selbst selten senden sender senior senken sepsis seriös sessel setzen seuche
sicher sieben siebte siegel siegen sieger siezen signal silber simpel simsen singen sinken sinnen
sirene sitzen skaten skizze sklave skript sobald sockel sodass soeben sofern sofort sohlen soiree
soldat solide sollen sommer sonett sonnen sonnig sopran sorgen soweit sowohl sozial spagat spange
spanne sparen specht speise spende sperre spesen sphinx sphäre spinat spinne spital spruch sprung
spröde spucke spuken spulen spuren sputen späher später spülen spüren stabil stange stapel stativ
statue statur status stehen stelle steppe steril stetig steuer steven stimme storch strafe straff
strahl stramm strand strebe streik streit streng strich strick strikt studie studio stufen stumpf
stunde stärke stätte stören stütze subtil suchen sucher sultan superb surren symbol system sänger
söhnen sühnen sünder tadeln tagung taille taktik tanken tanzen tapete tapfer tappen tarnen tasche
tasten taufen taugen tausch teenie teilen teller tempel tempus termin testen teufel texten ticken
tigern tilgen tippen tollen tomate topfit toppen torero tortur touren tracht tragen trapez traube
trauen trauer trauma treppe tresen tresor treten triade tribut trikot trubel trumpf truppe tränen
trödel trüben trügen tugend tumult tunken tupfen turnen turner tyrann tänzer täufer tölpel tötung
tümpel türkis türmen umarmt umfang umfeld umgang umhang umkehr umlauf umsatz umwelt unecht unfair
unfall ungern unheil unhold unklar unklug unnütz unreif unrein unruhe unsinn unterm untreu unwahr
unweit unwohl urlaub urteil urwald vakuum vampir vektor ventil verbot verein verhör verlag verrat
verruf vertan vertun verübt vesper vetter vierer vierte visage visier vision visite voraus vorbei
vorher vorhin vorort vorrat vortag vorzug vulgär vulkan völlig wachen wacker waffel waggon wahren
walten walzer wandel wanken wappen warnen warten wasser wecken wecker wedeln wehren wehtun weiden
weihen weilen weinen weisen weiten weiter weizen welken wellen wenden werben werden werfen werfer
werken werten wetten wetter whisky wickel widder widern widmen wieder wiegen wiener wiesel willig
windel winden windig winkel winken winter winzig wirbel wirken wirtin wissen witwer witzig wohnen
wollen wonach worauf woraus wucher wunsch wurzel wählen wähler währen wälzen wärmen wärter wäsche
wölfin wühlen würdig würfel würgen würger würzen würzig wütend zacken zahlen zander zanken zapfen
zaster zauber zehnte zeigen zeiger zeitig zelten zement zensur zepter zerren zettel zeugen zeugin
ziegel ziehen zielen zieren ziffer zimmer zinken zinsen zipfel zirkel zirkus zocken zocker zollen
zoomen zornig zucken zucker zuerst zufall zugabe zugang zumute zupfen zurück zusage zusatz zutage
zuviel zwecks zweier zweite zyklop zyklus zählen zähler zähmen zögern zügeln zünden ächzen ähneln
ändern ärgern ärztin ätzend ödland öffnen öfters üblich
`,
    },
  ],
};
