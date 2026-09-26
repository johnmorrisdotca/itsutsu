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
};
