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
  6: [
    {
      fromCycle: 0,
      source: "the 6-letter answers (medium and hard) of words.fr.data.ts, read 2026-09-26",
      words: `
abattu abbaye abimer abject abolir abonne aboyer absent absolu abuser abusif abysse acajou accent
accord accroc aconit acteur action actuel acuite adepte adorer adroit adulte aerien affame affile
afflux affole agacer agence agenda agiter agneau agonie agrafe ailier aimant alarme alcool alcove
alerte aliene alinea allier allure amande amante amarre ambigu amende amener amical amidon amiral
amitie amorce amorti ampute amuser ananas ancien anemie angine animal animer anneau annexe annuel
anodin aparte apeure aplati aplomb apogee apotre appart apport arcade archer archet ardent ardeur
argent argile armada armure artere aspect assaut assidu asthme astral astuce atrium atroce aucune
aucuns audace augure aumone aupres auquel aurore autant auteur autour autres autrui avaler avance
avarie avatar avenir avenue averer aviron aviser avocat avoine avorte avouer babine babord bafoue
bagage baiser balade balcon baleze balise ballet ballon ballot bambin bambou banane bancal bandit
bannir banque baquet barber barder bardot barjot barque barrer basane basque basset bassin baston
bateau battre bavard baveux bavoir bavure beaute becane beguin beigne belier belote bercer berger
berner besoin betail betise beurre bibine biceps bichon bidule bikini billet billot binome biquet
bisque bistro bitume blabla blague blamer blason blesse blinde blocus blouse bobard bobine boheme
boiter bolero bolide bonbon bondir bonnet bordee border borgne bosser botter bottin boucan bouche
boucle bouder boudin boueux bouffe bouffi bouger bougie bougon bougre bouler boulet boulon boulot
bourde bourge bourre bourru bourse bouton boxeur braise brasse braver brebis breche brelan breton
brevet brique briser broche broder bronze brosse broyer bruler brutal bucher buffet buffle bureau
butoir butter buveur cabale cabane cabine cacher cachet cachot caddie cadeau cadran cadrer cafard
cafter cageot cagibi cahier caille caiman caisse calcul calice calife calmar calmer camion campus
canape canard canari cancan cancer cancre canine canton canyon capter captif caquet carafe careme
carlin carnet carrer cartel carton casbah casher casier casque casser cassis castor causer cavale
caveau caviar cavite cecite celeri celles cendre centre cercle cerise cerner cesser chacal chacun
chahut chaine chaire chaise chalet chaman chance chaque charge charme charte chasse chaste chaton
chauve chelem chemin chenal chenil cheque cherir chetif cheval chevet cheveu chevre chiche chichi
chiffe chimie chiper chipie chique chlore choeur choper chouia chrome chrono chuter cibler cierge
cigale cigare ciment cinema cingle cintre cirage cireur cirque ciseau citron clamer clapet claque
clarte classe clause clerge cliche client climat clique cloche cloque clouer cobalt cobaye coccyx
cocher cochon codage coffre cognac cognee cogner coiffe colere coller collet colore combat comble
comete comite commun compas compte concis condor confus conque consul conter contre convoi copain
copier coquin corail corbin cordon coreen cornee corner cornet corpus corser corset corvee cosmos
couard couche coucou coudre coulee couler coulis couper couple coupon courbe courge courir courre
course cousin couter couver coyote cramer crampe crasse crayon creche credit creole crever crible
crique croate croche croire crosse croupe croute cruche crypte cubain cuisse cuivre cupide cursus
cypres damner danger danois danser debine debout debris decale decent dechet declic declin decret
dedain dedale dedier deesse defait defaut defier defini defunt degout dehors delice delier delire
deluge demain dement demode demuni denree depens depuis derive desaxe desert desole dessin dessus
destin desuet detail detenu detour deuzio devant devier devise devoir devolu devoue diable diacre
dictee dicter dicton dindon dingue direct dispos disque divers docile doigte domino donjon donner
dormir dosage douane double doucet douche doudou douter dragon drague draper drogue droite druide
dument duplex duquel durant durcir durete ebloui echine eclair eclore ecoper ecorce ecrire ecurie
ecuyer editer effort effroi egaler egarer egayer eglise ehonte elever elixir embout emeche emeute
emigre emotif empire emploi empote encens enclin enclos encore enduit enfant enfler enfuir enfume
enieme enigme enjoue ennemi ennuye enonce enorme entete entier entite entree entrer envers envier
epater epaule epeler epiler epique eponge epopee epoque epuise equipe equite erable eriger ermite
errant erreur errone ersatz erudit escale escroc espace espece espion espoir esprit essaim essieu
estime etable etabli etaler etalon etayer ethnie etirer etoffe etoile etrier etroit evader evasif
eveque eviter exalte examen exempt exiger exiler expert expier export expose expres exquis facade
facher facial facile faible faille faisan fameux famine farcir farine faucon fautif faveur favori
fendre fermer feroce ferrer festif festin fetard fetide feutre fiable fiacre fiance fiasco ficele
ficher fictif fidele fiente fierte fiesta fievre figure filmer filtre finale fiscal fiston flacon
flamme flaner flaque fleche flemme fletan fleuri fleuve flocon flopee floral flores flotte fluide
foirer follet foncer fonder fondre fondue forage forain forcat forcer forger format formel former
formol foudre fougue fouine foulee fouler fourbe fourmi fourre fracas fraise frange fraude frayer
frelon fremir frerot fretin friand frimer fripon friser froler fronde fruite fugace fuguer fuiter
fumant fumeur fumier fumoir fureur furtif fuseau fusion futile fuyant fuyard gacher gachis gagner
gaiete galant galeux garage garant garcon garder garrot gasoil gastro gateau gateux gauche gaufre
gazeux geisha genant gendre genese gentil gerant germer geyser ghetto gibier giclee gicler gifler
girafe gisant glacer glacon glaise glaive glande glaner global gloire gluant gluten gorgee gosier
goujat goulag goulot gourde gourou gouter goutte graine gramme grange granit grappe gratin gratis
gratos graver gravir gredin greffe griffe grille grippe grotte groupe guenon guerir guerre gueule
guider guidon guigne guinde guinee habile hacher hachis hamada hameau hammam hanche hangar hanter
hareng harpie harpon hasard hausse havane hebreu helice hernie hideux hindou hisser hocher hochet
homard hombre hoquet hormis hostie hourra housse hublot huitre humain humble humeur humide humour
hurler idylle iguane illico imiter impact impair impala impoli import impuni inapte indice indien
inedit inegal inerte infame infect infime infini ingrat initie injure instit intact intime intrus
ironie irreel isoler ivoire jaguar jaloux jamais jambon jardin jargon jarret jasmin jauger jeuner
jeunot joueur joujou jovial joyeux jubile jumeau jument junior jusque juteux kabuki karate kitsch
labeur lacher ladite lagune laiton laitue lancee lancer langer langue lapsus larbin larcin larynx
lascar lasser lavabo lavage laveur legion leguer legume lequel lesion lester lettre leurre levier
levure lezard liasse lierre liesse lievre lignee limace limier limite lingot litige livide livree
livrer livret loisir longer loquet lotion louche loulou louper loutre lucide lustre lutter lyceen
maboul macher machin madame madone madras magnat magner magnum maigre maille mairie maison maitre
majeur malade malgre malice manche mandat mander manege manger mangue manier manoir manuel maquis
marais marbre marche marier marine marque marrer marron martel martyr masque masser massif massue
mastic mature maudit maxime mecano mecene medina medium meduse mefait mefier membre memere menace
menage meneur mental menthe mentir menton mentor mepris merlan merlin messie mesure metier mettre
meuble mienne miette mignon mikado milice milieu millet mineur minier minime minois minuit minute
mioche mirage miroir misere mitard miteux mixage mixeur mobile modele modere module moelle moisir
moitie mollet moment montee monter montre moquer morale mordre mormon morose mortel motard moteur
motion mouche moudre mouise moulin mourir mouron mousse mouton muguet muscle museau museum mutile
mutuel myrrhe nageur naitre nankin narine narval nation nature nausee navire nectar neiger neutre
neveux nickel nigaud niveau noirci nomade nombre nommer normal notice notion notres nougat nounou
nourri nouvel novice noyade nuance nudite nulles numero nymphe obscur obsede occase odieux odorat
office offrir oignon oiseau opaque operer option oracle orange orbite organe orteil osseux ourlet
ourson ouvert ouvrir ovaire paella pagaie paille paitre palais paleur palier palper panade panier
panser pantin papaye papier paquet parano pardon pareil parent parfum parier parler parole partie
partir parure passer passif pastis patate patine patrie patron pature pauvre pavane payant paysan
pecher pecule peigne peiner pelage pelote pendre pensee penser pensif people pepere pepite percee
percer perche perdre perime permis perron persan persil pesant petale petant petard peteux petrin
peuple phenix phobie phoque phrase piaule picard pichet pieger pierre pieton pietre pigeon pignon
pilier piller pilori pilote pilule piment pinard pincee pincer pingre pinson pinter pioche pipeau
piquer piquet piqure pirate pister piston piteux pivert placer plaine plaire planer plante plaque
platre plombe plumer plutot podium poesie pognon poigne pointe pointu poison poisse poivre police
pollen pomper pompon poncho pondre ponton porche portee porter postal poster potage poteau potele
potion poudre poulet poulie poulpe poumon poupee poupon pourri poutre precis prefet prenom presse
presto preter pretre preuve prevot priere prieur prince prisme prison priver proces proche profil
profit projet prompt propos propre psaume pseudo psyche public pudeur pueril puiser purete purger
putois putsch pyjama pylone python quaker quartz quatre quelle quiche quille quinze quorum rabais
rabbin rachat racial racine raclee racler radeau radier radius rafale raffut rafiot rafler ragout
rainer raisin raison raleur rallye rameau ramper rancon rangee ranger rapace rapide raquer rarete
rasage rasoir rateau ration rauque ravage ravoir rayure reagir rebond rebord recent reclus recoin
recrue redire reduit reflet reflux refuge regain regard regate regent reggae regime region regler
regner regret rejoui relais relaxe releve relief relier relire remede remise remous remuer renard
rendre renier renvoi report requin reseau residu resine restau rester retard retine retors retour
reunir reveil revers reveur revoir revolu rictus rideau rigide rigolo rincer risque rituel rivage
rocher rocker rodeur romain rompre ronger rosbif roseau rosier rosser rotule rouage rougir rouler
roussi ruelle ruiner rumeur rustre rythme sabbat sachet safari safran saisie saisir saison salade
salete salive saluer samedi sangle santal saphir saquer satane satire satyre saumon sauter sauver
savane savant saveur savoir scelle schema sciure scribe seance secher second secret seigle seisme
sejour seller senile senior sentir serein sermon serrer servir severe sevrer siecle sieger sienne
sieste signal signer sillon simple singer siphon sirene situer social soiree soldat soleil solide
sombre sommet sonate sonder songer sonner sonnet sonore sorbet sortie sortir souche souder soufre
souler souper soupir souple source souris soyeux spasme sphere sphinx stable statue statut steppe
strass strict studio subtil succes suisse suivre sultan summum sureau surete surfer surgir surnom
sursis survet survie survol suture svelte syndic syrien tacher tacite taille talent tamise tampon
tanner tantot tapage taquet tarder tardif tasser tatoue taudis teigne teinte telles temoin temple
tenace tendon tendre teneur tenter ternir terrer tester tetard tetine thorax tienne tierce timbre
timide tinter tirade tirage tireur tiroir tisane tisser titane toison tomate tomber tondre tonton
toquer torche tordre torero tortue toubib touffe touffu toupet toupie tourte toutou tracas tracer
trafic trahir traire traite trajet transe transi trappe trauma trefle treize trempe trente trepas
tresor tresse treuil triade triage tribal tribun tribut tricot trimer triple tripot trique triste
triton trombe trotte trouee trouer troupe truand truffe truite truque tuerie tueuse tulipe tumeur
turban turbin tuteur tympan typhon typhus ulcere ultime unique urbain urgent uterus utopie vacant
vaccin vaincu valeur valide valise vallee vallon valoir valser vanite vanter vapeur varier vassal
vaudou veille veloce vendre venere venger ventre verbal vereux verger verite vernis verrat verrou
verrue verser verset versus vessie veston vexant viable viaduc viande vibrer videur vielle vigile
vilain vinyle violet violon vipere virage visage viseur vision visite visser visuel vivant voguer
voiler voisin volage volcan voleur volume vorace vortex votres voyage vrille whisky yankee yaourt
zenith zephyr zigzag zinzin
`,
    },
  ],
};
