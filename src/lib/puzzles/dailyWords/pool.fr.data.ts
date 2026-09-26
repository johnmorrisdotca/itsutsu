/**
 * THE DAILY WORDS' POOLS FOR FR, one list of versions per length.
 *
 * WRITTEN BY `node scripts/daily-pools.ts`, NEVER BY HAND, and never rewritten: each
 * entry is a frozen copy of an answer list, and the days of every cycle it
 * serves were drawn from exactly these words. `dailyPools.test.ts` holds each
 * entry to its hash. A newer list is a new entry from a later cycle.
 *
 * From src/lib/puzzles/gomoji/words.fr.data.ts, whose notice follows:
 *
 *   THE FRENCH WORDS FOR GOMOJI. Written by `scripts/word-lists-fr-de.mjs`, read 2026-09-26, from
 *   Lexique 3.83 (http://www.lexique.org), which decides what is a word; ranked by
 *   hermitdave's FrequencyWords (OpenSubtitles 2018, https://github.com/hermitdave/FrequencyWords,
 *   content/2018/fr/fr_50k.txt; word frequency lists compiled by Hermit Dave from
 *   https://opensubtitles.org), with Lexique's own count ranking the answers; and
 *   Wiktionary (via https://kaikki.org), which an answer must also be in, and which
 *   says where a word English also spells came from. All under CC BY-SA 4.0
 *   (https://creativecommons.org/licenses/by-sa/4.0/), and this list with them.
 *   Never edited by hand; run the script again instead.
 *
 *   Every word the dictionary has may be guessed. An answer is also in
 *   Wiktionary, a base form, a word of this language rather than one borrowed
 *   from English, and not vulgar or a slur (the script says how).
 *   Accents are folded to their plain letter (é→E, ç→C…); a word with œ or æ has no plain spelling and is left out.
 */
import type { PackedDailyPool } from "./dailyWords.types";

export const DAILY_POOL_FR: Record<number, readonly PackedDailyPool[]> = {
  4: [
    {
      fromCycle: 0,
      source: "the 4-letter answers (medium and hard) of words.fr.data.ts, read 2026-09-26",
      words: `
abbe abri abus acre acte ados aere afin afro agir aide aigu aile aine aire aise alfa amas amer ange
anis anse anus aout apre apte ardu aria arme aube auto aval avec aveu avis azur baba baie bail bain
banc base bave beat beau bebe beer beta bete bide bien bile bise bled bleu bloc bobo bois bond bord
bouc boue boum bout boxe bras bref brie brin brio bris brun brut bull buse bute cafe cage caid cale
came camp cape case cata cave ceci cela cene cerf ceux chai char chas chat chef cher chez chic choc
chou ciel cime cine cinq cire cite clef clic clin clou coca coin coit colo coma cone cote coup cour
cout cran cric crin croc cube cuir cuit cure cuve dada daim dame dans dard date deca decu defi deja
dela demi deni dent deux dico dieu dire diva dodu doge dojo dome donc dont dore dose doue doux drap
duel dune echo eden edit egal elan elfe elle emir emoi epee eros este etat etau etre etui exil expo
face fade faim fana fane faon fard faux fele fete fief fiel fier fige file fils fisc fixe flan flic
flot flou fluo flux foie foin fois fond fort four fret fric froc fuel fuir fute gaga gage gain gale
gant gare gars gaze geai gene gens gent gite glas gogo gone gout gras grec gres gril gris gros grue
guet haie hair halo hart hate haut here hier hors hote houx huer huis huit idee idem ilot imam imbu
inca inne insu iode iota iris issu ivre jade joie jojo joli joug jour juge juin jupe kaki kepi khan
kiki kilo koto labo lacs laid lait lama lame laps lard legs lent lest leur lice lien lier lieu lime
lion lire lobe loch loco loin loir lolo long lope lors loto loup luge lune luth lutz luxe lynx mage
maia mail main mais male mali mare mari mars maso meat mega melo meme menu mere meuf mica midi miel
mien mime mine mino mire miro mise mite mode mois moka mole mome mono mont mors mort moto moue muet
mule musc nage naif nain nana nase naze nerf neuf nice nier noce noel noir noix nord note nous noye
nuee nuit obus oeil oeuf ogre once onde onze opus oral orbe oree orge orme oser oter ouie ours ovni
page pain pair paix pale paon papa pape papy para parc pari part pate pays peau pele pepe pere peur
piaf pied pieu pile pion pipe pire pise plan plat plus pneu poil pois pole poli pont pope porc port
pote pour pres pret prix prof puce puer puis puma quai quel quoi race rade rage raie raki rale rame
rami rang rapt rare raye reel rein repu reve rhum ride rien rire rite rive rixe robe role rond rose
roti roue roux rude ruee ruer ruse saga sage sain sake sale sana sang sans sape sari sauf saut saxo
scie seau secu sein sens sept serf seul seve shah sida sien sikh silo sire site sofa soie soif soin
soir soja sole solo sono sort souk sous suer suie suri tact taie tain talc tant tard tare tata taux
taxe taxi tele test tete tetu thai thon thym tian tien tige titi toge toit tole tome tong topo tort
tour tous tout toux trac tram tres trio troc trop trot trou truc tsar tube tuer turc tutu type unes
unir urne user vain vase veau velo velu vent vers vert veto veuf vexe vice vide visa vite voeu voie
voir voix vous vrac vrai yang yoga yoyo zele zero zinc zona zone
`,
    },
  ],
  5: [
    {
      fromCycle: 0,
      source: "the 5-letter answers (medium and hard) of words.fr.data.ts, read 2026-09-26",
      words: `
abces abime aboli abord acces accro accru achat acide acier actif adage adieu aerer affut agent
agile ahuri aider aieul aigle aigre aigri aimer ainsi ajout album algue alias alibi allee aller
allie alors amant ambre amont amour ample ampli ancre angle anime annee antan antre aorte apero
apnee appat appel appui aprem apres arabe arbre arche archi arene arete argot aride armee armer
arome arret aryen asile assez astre athee atlas atome atout aucun aussi autel autre avant avare
avide avion avoir avril azote bache bader baffe bagne bague bahut balai balle banal banco bande
barbe barbu barda barge baril barjo baron barre baser batir baton batte baume baver bazar beauf
beche begue beige belge bemol benef benet benin benir benit benne beret berge berne beton bette
biais biche bidet bidon biere bigot bigre bijou bilan bille bique bison bisou bizut blair blanc
blase bleme blond bocal boeuf bogue boire boise boite bombe bonde bonte bonze borne bosco bosse
bossu botte bouee boule bourg bouse bovin boxon brave bride brise brode broye bruit brume brune
buche bulbe bulle burin buste butee buter butin butte cable cabot cacao caddy cadet cadre cajou
caler calin calme camee camus canal canif canin canne canoe canon canot capot carie carne carpe
carre carte caser caste catho catin cause ceder cedre celle celte celui cense cesse cette chair
chale champ chant chaos chaud chaux cheik chene cheri chien chili chiot choix chose chute cible
cidre cieux cigue cirer citer civil clair clebs clerc clodo clone clope clore cobra coche cocon
codex coeur cohue colin colis colon comme comte conde conge conte copie coque coran corde corne
corps corse coton coude coupe cours crabe crade crado craie crane creer creme crepe crete creux
creve crier crime crise croco croix cruel cucul cuire cuite culot culte cumin curer curie cuvee
cuver cycle cygne dague dalle damas damne danse daube debat debit debut deces deche dechu decor
degat degel degre delai delit delta demon dense depit depot desir dette deuil devin devis diane
diapo diese diete digne digue dinde diner dingo divan divin dixit dogme doigt dorer doute douze
doyen drame droit drole duche duper duree durer duvet ebene ecart echec eclat eclos ecole ecolo
ecran ecrin ecrou ecume effet egard egare egout eleve elire elite elles eloge email encas encre
enfer enfin enfle engin enjeu ennui enter entre envie envoi envol epais epate epave epice epier
epine epoux errer essai essor etage etain etang etape ether etole etude eveil evier exact exces
exclu exode fable facon faire faite faner fange farce faste fatal faune faute fauve faxer fayot
felin femme femur fente ferie ferme feter fibre fichu figer figue filer filet fille filon filou
final finir fiole firme fissa fixer flair flanc fleau fleur flore flute foire folie fonds fondu
fonte force forer foret forge forme fosse fouet foule foutu foyer frais franc frein frele frene
frere frigo frime frire frise frite froid front fruit fugue fuite fumee fumer furax furet furie
fusee fusil futal futur gable gaffe gaine gallo galon galop gamin gamma gamme garde garer garni
garou gater gaule gaver gazer gazon geant gelee geler gemir gemme gener genie genou genre gerbe
gerer germe geste gibet gifle gigot gigue gilet giron gitan givre glace gland globe gnole gnome
gober gogol golfe gombo gomme gorge gosse gouda goule graal grace grade grain grand grave greer
grele greve grief groin gruau guepe guere gueux guide guise habit hache hadji haine halle halte
hamac haras hardi harpe hasch hater hatif havre hebdo henne herbe heros heure hibou hindi hiver
homme honte hosto hotel hotte houle huile huppe hutte hydre hyene hymne icone ideal idole image
impec imper impie impot impro impur index indic inoui islam isole issue jadis jambe japon jarre
jaser jauge jaune javel jetee jeter jeton jeudi jeune joint jouer jouet jouir joute joyau judas
juger jules jupon jurer juste kayak kebab krach kurde kyste lacer lacet lache lagon laine laius
lampe lande lapin laque large larme larve latex latin latte laver lecon ledit legal legat leger
lepre leurs lever levre lexie liane liant libre liege ligne ligue lilas linge lisse liste litre
livre local loger logis lopin loque lotte lotus louer louis loupe lourd lover loyal loyer lubie
lueur luger lumen lundi lutin lutte lycee mache macho macon magie magma magot maire major malin
malle maman mambo mamie manga manie manif manne mante mardi maree marge marin marre masse mater
maths matin maton matos matou maure mauve meche medoc megot melee meler melon mener merci merle
messe metal meteo metis metre metro meule meute miaou miche mieux milan mille mince miner minet
minou minus miser mixte moche moine moins moise moisi moite mollo monde moral morne morse morue
morve motif motte moule moyen mucus mufle mulet murir musee muter myope mythe mytho nabot nadir
nager nappe nasal natal natif natte naval navet navre neant neige nenni neveu niais niche niece
noble nocif noeud nonne norme noter notre nouba nouer noyau noyer nuage nuire nulle nuque obeir
obese objet obtus ocean odeur offre ogive olive ombre oncle ongle opera opium opter orage ordre
orgie orgue orque ortho osier otage otite ouais oubli ouest outil outre ovale ovule oxyde pacha
pacte pagne paien paire palet palir palme panda panne panse paque parce parer paria parme parmi
paroi parti patee patin patio patir patte paume pause pavot payer peage peche pegre peine peint
pekin peler pelle penal pendu pente pepee pepin peril perir perle perso perte pesee peser peste
petit phare philo photo piano piece piege piete pieux piger pilon pince pinot pinte pique pisse
piste pitie pitre pivot pizza place plage plaie plain plant plebe plein plier plomb plouc pluie
plume poche poele poeme poete pogne poids poilu poing point poire polar polir polka pomme pompe
poney ponte porte porto poser poste pouce poule pouls poupe preux prier prime prise prive proie
promo prone prose proue prude prune puant pubis puits pulpe punir puree purin quand quant quart
quasi quels quete queue rabat radin radio radis rafle rager ragot raide raler ramer ramon rampe
rance raser rasta rater raton ravin ravir rayer rayon recel recif recit recre recul reelu refus
regal regie regle reglo regne reine rejet renal renne renom rente repas repit repli repos reste
resto retro rever revue rhino rhume riche ricin rider rieur rimer ripou risee rital rival river
robot roche roder rogne rogue roman roque rosee rosse roter rotie rotir rouge route royal ruban
rubis ruche rugir ruine rumba rural ruser russe sable sabot sabre sacre saint salir salle salon
salut salve samba sante saoul saper sapin satan satin sauce sauge saule savon saxon sbire sceau
scene scier secte seine seize selle selon semer senat sense serbe serie serre serum seuil sevir
siege siens sieur sigle signe silex singe sinon sinus sioux sirop sitot skier slave sobre socle
soeur solde somme sonde songe sorte sosie souci soude soupe sourd soute stade stage stase steno
store style stylo suave subir subit sucre sueur suite sujet super surin sympa tabac table tabou
tache tacot taffe taire talon talus tanne tante taper tapis tarif tarin tarot tarte tasse tater
tatou taule taupe taxer teint telle tempe temps tendu tenir tenor tente tenue terme terne terni
terre tetee teter texan texte texto theme these thune tiare tibia tiede tiers tigre timon tique
tirer tiret tissu titre toile tondu tonne tonus toque tordu torse total trace train trait trame
trapu treve tribu trier tripe trois tronc trone troue truie tueur tuile tuyau tyran ultra union
unite untel urine usage usine usure utile vache vague valet valse valve vanne varie vaste veine
venin venir vente verbe verdi verge verni verre verso vertu vespa veste vetir vexer vichy vider
vieil vieux vigie vigne villa ville vingt viral viree virer viril virus visee viser vison vital
vitre vivre vizir vocal vodka vogue voici voila voile voire volee voler volet vomir votre vouer
voute voyou vulve xeres zarbi zebre zeste
`,
    },
  ],
};
