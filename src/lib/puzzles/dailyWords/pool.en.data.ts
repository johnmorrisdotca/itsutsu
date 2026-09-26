/**
 * THE DAILY WORDS' POOLS FOR EN, one list of versions per length.
 *
 * WRITTEN BY `node scripts/daily-pools.ts`, NEVER BY HAND, and never rewritten: each
 * entry is a frozen copy of an answer list, and the days of every cycle it
 * serves were drawn from exactly these words. `dailyPools.test.ts` holds each
 * entry to its hash. A newer list is a new entry from a later cycle.
 *
 * From src/lib/puzzles/gomoji/words.en.data.ts, whose notice follows:
 *
 *   THE ENGLISH WORDS FOR GOMOJI. Written by `scripts/word-lists.mjs` from
 *   SCOWL 2020.12.07 (http://wordlist.aspell.net/), read 2026-09-25: answers from
 *   sizes 10–35 (easy: 10–20), guesses from sizes 10–70, English and American
 *   spellings. Never edited by hand; run the script again instead.
 *
 *   SCOWL's notice, which its licence asks to travel with the lists:
 *
 *   The collective work is Copyright 2000-2018 by Kevin Atkinson as well
 *   as any of the copyrights mentioned below:
 *
 *     Copyright 2000-2018 by Kevin Atkinson
 *
 *     Permission to use, copy, modify, distribute and sell these word
 *     lists, the associated scripts, the output created from the scripts,
 *     and its documentation for any purpose is hereby granted without fee,
 *     provided that the above copyright notice appears in all copies and
 *     that both that copyright notice and this permission notice appear in
 *     supporting documentation. Kevin Atkinson makes no representations
 *     about the suitability of this array for any purpose. It is provided
 *     "as is" without express or implied warranty.
 */
import type { PackedDailyPool } from "./dailyWords.types";

export const DAILY_POOL_EN: Record<number, readonly PackedDailyPool[]> = {
  4: [
    {
      fromCycle: 0,
      source: "the 4-letter answers (medium and hard) of words.en.data.ts, read 2026-09-26",
      words: `
abet able ably ache acid acne acre afar ahoy aide airy ajar akin alga ally alms also alto amen amid
amok anew anon apex arch area aria arid army atom aunt aura auto avid avow away awry axis axle babe
baby back bade bail bait bake bald bale balk ball balm band bang bani bank barb bard bare bark barn
base bash bask bass bath baud bawl bead beak beam bean bear beat beef been beer beet bell belt bend
bent best beta bias bide bike bile bill bind bird bite blab bled blew blip blob bloc blog blot blow
blue blur boar boat bode body boil bold bolt bomb bond bone bony book boom boon boor boot bore born
boss both bout bowl brag bran brat bray bred brew brim brow buck buff bulb bulk bull bump bung bunk
buoy burn burp burr bury bush busy buzz byte cage cake calf calk call calm came camp cane cant cape
card care carp cart case cash cask cast cave cede cell cent chap char chat chef chew chic chin chip
chop chow chug chum cite city clad clam clan clap claw clay clef clip clod clog clot club clue coal
coat coax cock code coil coin cold colt coma comb come cone cook cool coop cope copy cord core cork
corn cost coup cove cozy crab crag cram crew crib crop crow crux cube cuff cull cult cums curb curd
cure curl curt cute cyst czar daft dais dame damp dank dare dark darn dart dash data date daub dawn
daze dead deaf deal dean dear debt deck deem deep deer deft defy deli dent deny desk dial dice diet
dike dill dime dine dire dirt disc dish disk dive dock dodo doer dole doll dome done doom door dose
dote dour dove down doze drab drag draw drew drip drop drug drum dual duck duct dude duel duet duff
duke dull duly dumb dump dune dung dunk dupe dusk dust duty each earl earn ease east easy eave echo
eddy edge edgy edit else emir emit envy epic ergo etch even ever evil exam exit face fact fade fail
fair fake fall fame fang fare farm fast fate fawn faze fear feat feel feet fell felt fend fern feud
file fill film find fine fire firm fish fist five fizz flag flak flap flat flaw flea fled flee flew
flex flip flit flog flop flow flue flux foal foam fogy foil fold folk fond font food fool foot ford
fore fork form fort foul four fowl foxy fray free fret frog from fuel full fume fund furl fury fuse
fuss fuzz gain gait gala gale gall game gang gape garb gash gasp gate gave gawk gaze gear geld gene
gent germ gibe gift gild gill gilt girl gist give glad glee glen glib glow glue glum glut gnat gnaw
goad goal goat gold golf gone gong good goof goon gore gory gosh gout gown grab gram gray grew grid
grim grin grip grit grow grub gulf gull gulp guru gush gust hack hail hair hale half hall halo halt
hand hang hard hare hark harm harp hart hash hate haul have hawk haze hazy head heal heap hear heat
heel heir held helm help hemp herb herd here hero hick hide high hike hill hilt hind hint hire hiss
hive hoax hobo hock hold hole holy home hone honk hood hoof hook hoop hoot hope horn hose host hour
hove howl huff huge hulk hull hung hunk hunt hurl hurt hush husk hymn icon idea idle idly idol inch
info inky into iota iris iron isle itch item jack jade jail jamb jazz jeer jell jerk jest jibe jilt
jinx join joke jolt judo jump junk jury just jute keel keen keep kelp kept kick kill kiln kilo kilt
kind king kink kiss kite kiwi knee knew knit knob knot know lace lack lacy lade lady laid lain lair
lake lamb lame lamp land lane lard lark lash lass last late lath laud lava lawn lazy lead leaf leak
lean leap leek leer left lend lens lent less lest levy liar lice lick lieu life lift like lilt lily
limb lime limp line link lint lion lisp list live load loaf loam loan lobe lock loft logo loin loll
lone long look loom loon loop loot lope lord lore lose loss lost loud love luck lull lump lung lure
lurk lush lute lyre mace made maid mail maim main make male mall malt mama mane many mare mark mart
mash mask mass mast mate math maul maze meal mean meat meek meet melt memo mend menu meow mere mesh
mess mete mice mien mike mild mile milk mill mime mind mine mink mint mire miss mist mite mitt moan
moat mock mode mold mole molt monk mood moon moor moot mope more morn moss most moth move much muck
muff mule mull muse mush musk muss must mute mutt myth nail name nape navy near neat neck neon nest
newt next nice nick nigh nine node none nook noon norm nose nosy note noun nova null numb oath obey
oboe odor ogle ogre oily okay okra omen omit once only onto onus ooze opal open opus oral ouch oust
oval oven over ovum oxen pace pack pact page paid pail pain pair pale pall palm pane pang pant papa
pare park part pass past pate path pave pawn peak peal pear peat peck peek peel peep peer pelt peon
perk pert pest pick pier pike pile pill pine pink pint pipe pity plan play plea plod plop plot plow
ploy plug plum plus poem poet poke poky pole poll polo pomp pond pony pool poor pope pore pork port
pose post posy pour pout pram pray prey prim prod prom prop prow puck puff pull pulp puma pump punk
punt puny pure purr push putt pyre quay quip quit quiz race rack racy raft rage raid rail rain rake
ramp rang rank rant rapt rare rash rasp rate rave raze read real ream reap rear redo reef reek reel
rein rely rend rent rest rice rich ride rife rift rile rind ring rink riot ripe rise risk rite road
roam roar robe rock rode role roll romp roof rook room root rope rose rosy rote rout ruby rude ruff
ruin rule rump rune rung runt ruse rush rust sack safe saga sage said sail sake sale salt same sand
sane sang sank sari sash save scab scan scar seal seam sear seat sect seek seem seen seep seer self
sell send sent sewn sham shin ship shod shoe shoo shop shot show shun shut sick side sift sigh sign
silk sill silo silt sine sing sink sire site size skew skid skim skin skip skit slab slam slap slat
slay sled slew slid slim slip slit slob slog slop slot slow slug slum slur smog smug snag snap snip
snob snot snow snub snug soak soap soar sock soda sofa soft soil sold sole solo some song soon soot
sore sort soul soup sour sown span spar spat spay sped spew spin spit spot spry spud spun spur stab
stag star stay stem step stew stir stop stow stub stud stun such suck suit sulk sung sunk sure surf
swab swam swan swap swat sway swig swim swum tack taco tact tail take talc tale talk tall tame tang
tank tape tart task taut taxi teak team tear teat teem teen tell tend tent term test text than that
thaw thee them then they thin this thou thud thug thus tick tide tidy tier tiff tile till tilt time
ting tint tiny tire toad toga toil told toll tomb tome tone tong took tool toot tore torn toss tote
tour tout town trap tray tree trek trim trio trip trod trot true tuba tube tuck tuft tuna tune turf
turn tusk twee twig twin type ugly undo unit unto upon urge user vain vane vary vase vast veal veer
veil vein vend vent verb very vest veto vial vice view vile vine visa vise void volt vote wade waft
wage waif wail wait wake walk wall wand wane want ward warm warn warp wart wary wash wasp watt wave
wavy waxy weak wean wear week weep weer weld well welt went wept were west what when whet whew whim
whip whir whiz whoa whom wick wide wife wild will wilt wily wind wine wing wink wipe wire wiry wise
wish wisp wist with wive woke wolf womb wont wood woof wool word wore work worm worn wove wrap wren
writ yank yard yarn yawn year yell yelp yeti yoga yoke yolk your yowl yuck zany zeal zero zest zeta
zinc zone zoom
`,
    },
  ],
  5: [
    {
      fromCycle: 0,
      source: "the 5-letter answers (medium and hard) of words.en.data.ts, read 2026-09-26",
      words: `
aback abate abbey abbot abhor abide abler abode abort about above abuse abyss acing acorn acrid
actor acute adage adapt adept admit adobe adopt adore adorn adult affix afoot after again agent
agile aging aglow agony agree ahead aisle alarm album alert algae alias alibi alien align alike
alive allay alley allot allow alloy aloft alone along aloof aloud alpha altar alter amass amaze
amber amble amend amiss among ample amply amuse angel anger angle angry angst ankle annex annoy
annul antic anvil aorta apart aping apple apply apron apter aptly arbor ardor arena argue arise
armor aroma arose array arrow arson ashen aside askew aspen asset atlas atone attic audio audit
aural avail avert avoid await awake award aware awful awing awoke axing axiom azure bacon badge
badly bagel baggy baker balmy banal bandy banjo barer barge baron baser basic basil basin basis
baste batch bathe baton bawdy bayou beach beady beard beast beech beefy befit began begin begun
beige being belch belie belly below bench beret berry berth beset bible bigot bingo biped birch
birth bison black blade blame bland blank blare blast blaze bleak bleat bleed blend bless blimp
blind blink bliss blitz block blond blood bloom blown bluer bluff blunt blurb blurt blush board
boast bogus bonus boost booth borne bosom bossy botch bough bound bowel boxer brace braid brain
brake brand brash brass brave bravo brawl brawn bread break bribe brick bride brief brine bring
brink briny brisk broad broil broke brood brook broom broth brown brunt brush brute buddy budge
buggy bugle build built bulge bulky bully bumpy bunch bunny burly burnt burro burst bushy butte
buxom buyer byway cabin cable cacao cache cacti cadet cagey calve camel cameo canal candy canny
canoe canon caper carat cargo carol carry carve caste catch cater caulk cause cease cedar cello
chafe chaff chain chair chalk champ chant chaos charm chart chase chasm cheap cheat check cheek
cheep cheer chess chest chewy chick chide chief child chili chill chime chimp china chirp choir
choke chord chore chose chuck chunk churn chute cider cigar cinch circa civic civil clack claim
clamp clang clank clash clasp class clean clear cleat cleft clerk click cliff climb clime cling
clink cloak clock clone close cloth cloud clout clove clown cluck clump clung coach coast cobra
cocky cocoa colic colon color comet comic comma coral corny corps couch cough could count court
cover covet cower coyer craft cramp crane crank crash crass crate crave crawl craze crazy creak
cream creed creek creep crepe crept crest crime crisp croak crock crony crook croon cross crowd
crown crude cruel crumb crush crust crypt cubic cuing curio curly curry curse curve cuter cycle
cynic daddy daily dairy daisy dally dance dandy datum daunt dealt death debit debug debut decay
decoy decry defer deify deign deity delay delta delve demon denim dense depot depth deter devil
diary digit dimer dimly diner dingy direr dirge dirty disco ditch ditto ditty diver dizzy dodge
dogma doily doing dolly donor dopey doubt dough douse dowdy downy dowry dozen draft drain drama
drank drape drawl drawn dread dream dress drier drift drill drink drive droll drone drool droop
dross drove drown drunk dryer dryly dully dummy dumpy dunce dunno dusky dusty duvet dwarf dwell
dwelt dying eager eagle early earth easel eaten eater ebony edger edict eerie eight eject eking
elbow elder elect elegy elite elope elude elves email embed ember empty enact endow enema enemy
enjoy ensue enter entry envoy epoch equal equip erase erect erode error erupt essay ether ethic
ethos evade event every evict evoke exact exalt excel exert exile exist expel extol extra exude
exult fable facet fagot faint fairy faith false fancy farce fatal fatty fault fauna favor feast
feces feign feint felon fence ferry fetch feted fetid fetus fever fewer fiber fiche field fiend
fiery fifth fifty fight filch filet filly filmy filth final finch finer first fishy fiver fizzy
flail flair flake flaky flame flank flare flash flask fleck fleet flesh flick flier fling flint
flirt float flock flood floor flora floss flour flout flown fluff fluid fluke flung flunk flush
flute foamy focal focus foggy foist folly foray force forge forgo forte forth forty forum found
fount foyer frail frame franc frank fraud freak freer fresh friar frill frisk frock frond front
frost froth frown froze fruit fudge fully fungi funny furor furry fussy fuzzy gable gaily gamer
gamma gamut gaudy gauge gaunt gauze gavel gawky gayer geese genie genii genre ghost ghoul giant
giddy gimme girth given glade gland glare glass glaze gleam glean glide glint gloat globe gloom
glory gloss glove gnarl gnash gnome godly going goner gonna goody gooey goofy goose gorge gouge
gourd grace grade graft grain grand grant grape graph grasp grass grate grave gravy graze great
green greet grief grill grime grimy grind gripe groan groin groom grope gross group grove growl
grown gruel gruff grunt guard guess guest guide guild guile guilt guise gulch gully gummy guppy
gusty habit hairy haler halon halve handy happy hardy harem harry harsh haste hasty hatch haunt
haven havoc hazel heady heard heart heath heave heavy hedge hefty hello hence heron hiker hilly
hinge hippy hitch hoard hobby hoist holly homey honey honor horde horse hotel hotly hound house
hovel hover huffy huger human humid humor hunch hurry husky hutch hyena icier icing ideal idiom
idler igloo image impel imply inane incur index inept inert infer infix inlay inlet inner input
inter irate irony issue itchy ivory jaunt jelly jerky jetty jewel jiffy joint joker jolly judge
juice juicy jumbo jumpy junta juror karat kayak khaki kinda kiosk kitty knack knead kneel knelt
knife knock knoll known koala label labor laden ladle lager lamer lance lanky lapel lapse large
larva laser latch later latex lathe laugh laxer layer leach leafy leaky leapt learn lease leash
least leave ledge leech leery legal lemme lemon leper letup levee level lever libel light liken
liker lilac limbo limit linen liner lingo liter lithe liven liver livid llama loath lobby local
lodge lofty logic loony loose lorry loser lotus louse lousy lover lower lowly loyal lucid lucky
lumpy lunar lunch lunge lurch lurid lying lymph lyric macho madam madly magic maize major maker
mamma mange mango mangy mania manic manly manor maple march maria marry marsh mason match matte
mauve maxim maybe mayor mealy meant medal media melon mercy merge merit merry messy metal meter
metro midst might milky mimic mince miner minor minus mirth miser misty mixer modal model moist
molar moldy money month moody moose moral mossy motel motif motor motto mound mount mourn mouse
mousy mouth mover movie mower mucus muddy muggy mulch multi mummy munch mural murky mushy music
musty muter naive naked nappy nasal nasty natty naval navel needy neigh nerve never newer newly
newsy nicer niche niece nifty night ninny ninth nippy noble nobly noise noisy nomad north notch
novel nuder nudge nurse nutty nylon nymph oases oasis obese occur ocean octal odder oddly offer
often olden older olive omega onion onset opera opium optic orbit order organ other otter ought
ounce outdo outer ovary overt owing owner oxide ozone paddy pagan pager paint paler panda panel
panic pansy papal paper parch parka parse party pasta paste pasty patch patio patty pause payer
peace peach pearl pecan pedal peeve penal pence pends penny peony perch peril perky pesky petal
peter petty phase phone phony photo piano picky piece piety pilot pinch pious pique pitch pithy
pivot pixie pizza place plaid plain plane plank plant plate plaza plead pleat pluck plumb plume
plump plush poach point poise poker pokey polar polio polka polyp poppy porch pouch pound power
prank prawn preen press price pride prime primp print prior prism privy prize probe prone prong
proof prose proud prove prowl proxy prude prune psalm psych pudgy puffy pulse punch pupil puppy
puree purer purge purse pushy putty quack quail quake qualm quark quart quash queen quell query
quest queue quick quiet quill quilt quirk quite quota quote rabbi rabid racer radar radii radio
rainy raise rally ranch range rapid rarer ratio ratty ravel raven rawer rayon razor reach react
ready realm rebel rebut recap recur redid refer regal reign relax relay relic remit renew repay
repel reply reset resin retch retry reuse revel revue rhino rhyme rider ridge rifer rifle right
rigid rigor rinse ripen riper risen riser risky rival river rivet roach roast robin robot rocky
rodeo rogue roman roomy roost rotor rouge rough round rouse route rowdy royal ruddy ruder rugby
ruing ruler rummy rumor runny rural rusty saber sadly safer sager saint salad sally salon salty
salve sandy saner sassy satin sauce saucy sauna saver savor savvy scald scale scalp scaly scant
scare scarf scary scene scent scoff scold scoop scoot scope score scorn scour scout scowl scram
scrap screw scrub scuff sedan seedy seize sense serum serve seven sever sewer shack shade shady
shaft shake shaky shall shame shape share shark sharp shave shawl sheaf shear sheen sheep sheer
sheet shelf shell shift shine shiny shire shirk shirt shoal shock shone shook shoot shore short
shout shove shown showy shred shrew shrub shrug shuck shunt shyer sidle siege sieve sight sigma
silly since sinew singe sinus siren sissy sixth sixty sizer skate skein skill skimp skirt skulk
skull skunk slack slain slake slang slant slash slate slave sleek sleep sleet slept slice slick
slide slier slime slimy sling slink slope slosh sloth slump slung slunk slush slyly smack small
smart smash smear smell smelt smile smirk smite smith smock smoke smoky smote snack snail snake
snare snarl sneak sneer snide sniff snipe snoop snore snort snout snowy snuff soapy sober soggy
solar solid solve sonic sooty sorer sorry sorta sound south space spade spank spare spark spasm
spate spawn speak spear speck speed spell spend spent spice spicy spike spill spine spire spite
splat split spoil spoke spoof spook spool spoon spore sport spout spray spree sprig spurn spurt
squad squat squid stack staff stage staid stain stair stake stale stalk stall stamp stand stank
stare stark start state stave steak steal steam steel steep steer stern stick stiff still sting
stink stint stock stoke stole stomp stone stony stood stool stoop store stork storm story stout
stove strap straw stray strew strum strut stuck study stuff stump stung stunk stunt style suave
suede sugar suing suite sulky sunny sunup super surer surge surly swamp swarm swear sweat sweep
sweet swell swept swift swill swine swing swipe swirl swish swoon swoop sword swore sworn swung
syrup tabby table taboo tacit tacky taint taken taker tally talon tamer tango taper tardy tarry
taste tasty tatty taunt tawny teach tease teeth tempo tempt tenet tenor tense tenth tepee tepid
terse thank theft their theme there these theta thick thief thigh thing think third thorn those
three threw throb throw thumb thump thyme tiara tidal tiger tight tilde timer timid tinge tinny
tipsy title toast today token tonal tonic tonne tooth topaz topic torch torso total totem touch
tough towel tower toxic toxin trace track tract trade trail train trait trash trawl tread treat
trend trial tribe trick trill tripe trite troll troop trout truce truck truer truly trump trunk
trust truth tulip tummy tumor tuner tunic tutor twang tweak tweet twice twine twirl twist tying
udder ulcer ultra uncle uncut under undid undue unfit unify union unite unity unman unsay unset
untie until upend upper upset urban urine usage usher using usual usurp uteri utter vague valet
valid valor value valve vapor vault venom venue verge verse verve vicar video vigil vigor viler
villa vinyl viola viper viral virus visit visor vista vital vivid vocal vodka vogue voice voter
vouch vowel vying wafer wager wagon waist waive waken waltz wanna waste watch water waver weary
weave wedge weedy weest weigh weird whack whale wharf wheat wheel where which whiff while whine
whirl whisk white whole whoop whose widen wider widow width wield wince winch windy wiper wiser
wispy witch witty woken woman women woody wordy world worry worse worst worth would wound woven
wrath wreak wreck wrest wring wrist write wrong wrote wrung wryer yacht yearn yeast yield yodel
yokel young youth zebra
`,
    },
  ],
  6: [
    {
      fromCycle: 0,
      source: "the 6-letter answers (medium and hard) of words.en.data.ts, read 2026-09-26",
      words: `
abacus abduct abject ablaze ablest aboard abound abroad abrupt absent absorb absurd accede accent
accept access accord accost accrue accuse aching acquit across acting action active actual acumen
acuter addict adding adhere adjoin adjust admire adrift adroit advent adverb advert advice advise
aerial affair affect affirm afford afield aflame afloat afraid afresh agency agenda aghast aiding
ailing aiming airier airing albeit albino alcove alight alkali allege allude allure almond almost
always ambush amoeba amoral amount ampere ampler amulet analog anchor anemia anemic angler animal
annual anoint anorak answer anthem antler anyhow anyone anyway apathy apiece aplomb appall appeal
appear append aptest arable arcade arcane archer arcing ardent arisen arming armory armpit around
arouse arrest arrive artery artful artist ascend ascent ashcan ashing ashore asking asleep aspect
aspire assail assent assert assess assign assist assort assume assure asthma astray astute asylum
atomic attach attack attain attend attest attire auburn august author autumn avenge avenue averse
avowal awaken awhile awning awoken azalea babble babier baboon backer badder badger baffle bakery
baking balder baling ballad ballet ballot bamboo banana bandit banish banker banner banter barber
barely barest baring barley barman barrel barren barter basest basing basket batter battle baying
bazaar beacon beagle beaker bearer beaten beater beauty beaver became beckon become bedbug bedder
bedlam beeper beetle beeves befall befell before beggar behalf behave behead beheld behind behold
belfry belief bellow belong bemoan bemuse bender benign bereft beside bestow betcha betray better
bettor beware beyond bicker bidden biding bigamy bigger biking bikini billow binary binder bisect
bishop biting bitmap bitten bitter blamer blanch blazer bleach bleary blight blithe blonde bloody
blotch blouse bluest bluing bobbin bobcat bodice bodily boding boggle boiler bolder boldly bomber
bonier boning bonnet booing bootee border boring borrow botany bother bottle bottom bought bounce
bounty bovine bowing bowler boxcar boxing boyish brainy braise branch brandy brassy braver brawny
brazen breach breath breeze breezy bridal bridge bridle bright broach broken broker bronco bronze
brooch browse bruise brunch brutal bubble bubbly bucket buckle budget buffer buffet bugler bullet
bummer bumper bundle bungle bunion bunker burble burden bureau burger burgle burial burlap burner
burrow bursar bushel busier busily busing bustle butler butter button buying buzzer bygone bypass
cackle cactus caddie cagier caging cajole caking calico caller callow callus calmer calmly camera
camper campus canary cancel cancer candid candle candor canine caning canker cannon cannot canopy
canter canvas canyon captor carbon career caress caring carpet carrot cartel carton cashew casing
casino casket caster castle casual catchy catnap catnip cattle caucus caught causal caveat cavern
caviar caving cavity cavort cawing ceding celery cellar cement censor census center cereal chalet
chalky chance change chapel charge chaste chatty cheery cheese cherry cherub chicer chilly chintz
chisel choice choose choosy choppy choral chorus chosen chrome chubby chummy chunky church cinder
cinema cipher circle circus citing citric citrus clammy clamor claret classy clause cleave clench
clergy cleric clever client climax clinch clinic clique closer closet clothe cloudy cloven clover
cluing clumsy clutch coarse cobalt cobble cobweb cocoon coding coerce coffee coffer coffin cogent
cognac coking colder coldly collar collie colony column combat comedy comely coming commit common
compel comply concur condor confer consul convex convey convoy cooing cooker cookie cooler coolly
cooper copier coping copper cordon coring cornea corner cornet corpse corpus corral corset cortex
cosmic cosmos costly cotton cougar county couple coupon course cousin covert coward cowboy cowing
coyest coyote cozier cozily crabby cradle crafty craggy cranky crater crayon creaky creamy crease
create credit creepy cringe crises crisis crispy critic crocus crouch cruder cruise crummy crunch
crusty crutch crying cubing cuckoo cuddle cuddly cupful curdle curfew curing cursor curter curtsy
custom cutest cutlet cutter cyclic cymbal dabble daemon dagger dainty damage dampen damper damsel
dancer danger dangle danker dapper daring darken darker darkly dating dawdle dazing dazzle deacon
deaden deader deadly deafer dealer dearer dearly dearth deaves debase debate debris debtor debunk
decade deceit decent decide decode decree deduce deduct deepen deeper deeply deface defame defeat
defect defend defile define deform defter deftly degree deject delete delude deluge deluxe demand
demean demise demote demure denial denote denser dental depart depend depict deport depose deputy
derail deride derive desert design desire desist despot detach detail detain detect detest detour
device devise devoid devote devour devout dialog diaper dicing diesel differ digest diking dilate
dilute dimmer dimple dinghy dining dinner direct direst disarm discus dismal dismay disown dispel
disuse dither divert divest divide divine diving docile doctor doling dollar domain doming domino
donate donkey doodle dopier doping dorsal dosing doting double doubly dourer dozing drafty dragon
drawer dreamy dreary dredge drench dressy driest drivel driven driver drowse drowsy drudge drying
duding dugout duller duping duplex duress during dyeing dynamo earner earthy easier easily easing
eating ebbing eczema edgier edging edible editor eerier effect effigy effort egging egoism eighth
eighty either elapse eldest eleven elicit embalm embark emblem embody emboss embryo emerge empire
employ enable enamel encase encode encore endear ending endive endure energy engage engine engulf
enigma enlist enmity enough enrage enrich enroll ensign ensure entail entice entire entity entrap
enzyme equate equine equity eraser errand errant erring escape escort estate esteem ethnic eulogy
eureka evener evenly eviler evolve exceed except excess excise excite excuse exempt exhale exhort
exhume exodus exotic expand expect expend expert expire expiry export expose extant extend extent
extort eyeing eyelid fabric facade facial facile facing factor fading fairer fairly faking falcon
fallen falser falter family famine famous faring farmer fasten faster father fathom fating fatten
fatter faucet faulty fazing feeble feeder feeler feline feller fellow felony female fender ferret
fervor fester feting fetter feudal fewest fezzes fiasco fibber fickle fiddle fiddly fidget fierce
fiesta figure filing filler fillet filter filthy finale finely finest finger fining finish finite
firing firmer firmly fiscal fisher fitful fitter fixing fizzle flabby flashy flatly flaunt flavor
fleece fleecy fleshy fliest flight flimsy flinch floppy floral florid flower fluent fluffy flunky
flurry flying fodder foible folder folksy follow foment fonder fondle fondly forage forbid forego
forest forger forget forgot formal format former fossil foster fought fouler fourth foxier foxing
fracas freely freest freeze french frenzy friend frieze fright frigid frilly fringe frisky frizzy
frolic frosty frothy frozen frugal fruity frying fuller fumble fuming fungus funnel funner furrow
fusing fusion futile future gadget gaiety galaxy galley gallon gallop galore gambit gamble gamest
gaming gander gaping garage garble garden gargle garish garlic garnet garret garter gasket gather
gating gayest gazing geeing gender genera genial genius gentle gently gentry gerbil geyser ghetto
gibber gibing giggle ginger girder girdle giving gladly glance glassy glibly glider global gloomy
glossy glower gluing goalie goatee gobble goblet goblin goggle golden golfer gooier gopher gorier
goring gospel gossip gotten govern grader granny grassy grater gravel graven graver grayer grease
greasy greedy grieve grille grimly grisly gritty grocer groggy groove groovy grotto grouch ground
grouse grovel grower growth grubby grudge grumpy guffaw guilty guinea guitar gullet gunman gunmen
gunner gurgle gusher gutter guying guzzle gyrate hacker haggle hairdo halest haling halter hamlet
hammer hamper handle hangar hanger hanker happen harass harbor harden harder hardly haring harrow
hassle hasten hating hatred having haying hazard hazier hazing header healer health hearse hearth
hearty heater heaven heckle hectic heifer height helium helmet helper herald hereby herein heresy
hermit hernia heroic hewing heyday hiatus hiccup hidden hiding higher highly hijack hiking hinder
hipper hippie hiring hither hiving hoarse hobbit hobble hobnob hockey hoeing holder holdup holier
holing holler hollow homage homely homier homing honest honing hooray hooves hoping hopper hornet
horrid horror hosing hostel hotbed hotter hourly hubbub huddle hugely hugest humane humble humbly
humbug hunger hungry hunter hurdle hurrah hurtle hustle hybrid hymnal hyphen icicle iciest idiocy
idlest idling ignite ignore iguana immune impact impair impale impart impede impend impish import
impose impure inaner inborn inbred incite income indeed indent indict indigo indoor induce induct
infamy infant infect infest infirm influx inform infuse ingest inhale inject injure injury inkier
inking inlaid inland inmate innate inning insane insect insert inside insist instep insult insure
intact intake intend intent intern invade invent invert invest invite invoke inward iodine irking
ironic island italic itself jabber jackal jacket jading jaguar jailer jalopy jangle jargon jaunty
jawing jersey jester jibing jiggle jigsaw jingle jockey jogger joking jostle jovial joyful joying
joyous juggle jumble jumper jungle junior junket juster justly karate keener keenly keeper kennel
kernel kettle keying kidnap kidney killer kimono kinder kindle kindly kipper kiting kitten knight
knives knotty kosher kowtow lacier lacing ladder lading lagoon lambda lament lamest laming lander
larger larvae larynx lastly lately latent latest lather latter launch laurel lavish lawful lawyer
laxest laxity laying layman laymen layout lazier leaden leader league leaner ledger leeway lefter
legacy legend legion legume length lentil lesion lessen lesser lesson lethal letter levity liable
lichen likely likest liking limber liming limper linear linger lining linker liquid liquor listen
litany lither litter little lively livest living lizard loader loafer loathe loaves locale locate
locker locket locust lodger logger loiter lonely longer loonie loosen looser loping losing lotion
louder loudly lounge lovely loving lowest lowing lumber lunacy lupine luring lusher luster luxury
macing madame madcap madden madder madman madmen maggot magnet magnum magpie maiden mainly makeup
making malady malice malign mallet mammal manage manger mangle maniac manner mantel mantle manual
manure mapper marble margin marina marine marker market maroon marrow marshy martin martyr marvel
mascot master mating matrix matron matter mature maxima mayhem meadow meager meaner measly meddle
median medium medley meeker meekly mellow melody member memoir memory menace menial mental mentor
merely merest merger meteor method meting metric mettle mewing midday middle midway mighty miking
milder mildew mildly milker miller miming mingle mining minion minnow minuet minute mirage miring
mirror misery misfit mishap mislay misled misuse mitten mixing mobile modern modest modify module
mohair molten moment monies monkey mooing moping morale morass morbid morgue morose morsel mortal
mortar mosaic mosque mostly mother motion motive motley mousse moving mowing mucous muddle muffin
muffle mugger mumble murder murmur muscle museum musing musket mussel muster mutant mutate mutely
mutest muting mutiny mutter mutton mutual muzzle myopic myriad myself mystic naiver namely naming
napalm napkin narrow nation native nature naught nausea nearby nearer nearly neater neatly nebula
nectar needle negate nephew nestle nether nettle neural neuron neuter newbie newest newton nibble
nicely nicest nicety nickel nimble nimbly ninety nobler nobody noodle normal nosier nosing notice
notify noting notion nougat novice nozzle nuance nuclei nudest nugget number nutmeg nuzzle oaring
object oblige oblong obsess obtain obtuse occupy octave ocular oddest oddity odious offend office
offing offset ogling oilier oiling oldest omelet onrush onward oodles oozing opaque opener openly
oppose optima opting option oracle orange orator orchid ordain ordeal orient origin ornate orphan
ouster outcry outdid outfit outing outlaw outlay outlet output outran outrun outset outwit overdo
overly owning oxygen oyster pacify pacing packer packet paddle paging pagoda palace palate palest
paling pallid pallor paltry pamper pander pantry papacy papaya papyri parade parcel pardon parent
paring parish parity parlor parody parole parrot parsec parser parson partly passer pastel pastor
pastry patchy patent pathos patrol patron patter paunch pauper paving pawing paying payoff peanut
pebble pedant peddle pellet pelvic pelvis pencil pended people pepper period perish permit person
perter peruse pester petite petrol pewter phlegm phobia photon phrase physic pickax picket pickle
pickup picnic piddle pierce pigeon pigpen piking pilfer piling pillar pillow pimple pimply pining
pinion pinker piping piracy pirate pistol piston placid plague plaice planar planet plaque plasma
player please pledge plenty pliant plight plucky plunge plural plying pocket podium poetic poetry
poison pokier poking police policy poling polish polite pollen poncho ponder poodle poorer poorly
poplar poring porous portal porter portly posing possum postal poster potato potent potion potter
pounce powder powwow praise prance prayer preach prefab prefer prefix prepay presto pretty priest
primal primer primly prince prison profit prompt propel proper proton proven prying pseudo psyche
public pucker puddle pueblo puffer pulley pulpit pumice pummel pundit punier punish punker punter
puppet purely purest purify purity purple pursue pusher putrid putter puzzle python quaint quarry
quartz quaver queasy quench quiche quirky quiver quorum rabbit rabble rabies racial racier racing
racket radial radish radium radius raffle rafter raging raider raisin raking ramble ramrod rancid
rancor random ranger ranker rankle ransom rarely rarest raring rarity rascal rasher rashly raster
rather ratify rating ration rattle ravage ravine raving ravish rawest razing reader realer really
realty reaper reason rebate rebind reborn rebuff rebuke recall recant recede recent recess recipe
recite reckon recoil record recoup rector redden redder redeem redone redraw reduce refill refine
reflex reform refuel refuge refund refuse refute regain regale regard regent regime region regret
rehash reject rejoin relaid relate relent relief relish relive reload remade remain remake remark
remedy remind remiss remote remove rename render renege renown rental reopen repaid repair repeal
repeat repent replay report repose repute reread resale rescue resent reside resign resist resort
result resume retail retain retina retire retort return retype revamp reveal revere revert review
revile revise revive revoke revolt reward rewind rework rhythm ribbon richer richly ricing ridden
riddle riding rifest riling rioter ripest ripple rising ritual robber robing robust rocker rocket
rodent roller rookie rooter roping rosary rosier roster rotary rotate rotten rotund router rowing
rubber rubble rubier rubric ruckus rudder rudely rudest rueful ruffle ruling rumble rummer rumple
runner runway rustic rustle sacred sadden sadder saddle safari safely safest safety sagest sailor
salami salary saliva sallow salmon saloon salter salute sample sandal sanest sanity satire saucer
savage saving savior savory sawing saying scalar scanty scarce scenic scheme school scorch scorer
scotch scrape scrawl scream screen screwy scribe script scroll scruff scurry scythe seaman seamen
search season secede second secret sector secure sedate seeing seesaw seethe seldom select seller
selves senate sender senile senior sensor sentry sequel sequin serene serial series sermon server
setter settle severe sewage sewing shabby shadow shaggy shaken shanty shaven shaver sheath sheave
sheikh shelve sherry shield shifty shiver shoddy should shovel shower shrank shrewd shriek shrill
shrimp shrine shrink shroud shrunk shyest shying sicken sicker sickle sickly siding sierra siesta
signal signer silent silken silver simile simmer simple simply sinewy sinful singer single singly
sinner siphon siring sister siting sitter sizing sizzle skater sketch skewer skiing skimpy skinny
skying sleazy sleepy sleeve sleigh sliest slight sliver slogan sloppy slouch slower slowly sludge
sluice smelly smoker smooth smudge smugly snappy snatch sneaky sneeze snider sniper snitch snooty
snooze snugly soccer social socket sodden sodium soften softer softly solace solder solely solemn
soling somber sonata sonnet sooner soothe sordid sorely sorest sorrow sought source sourer sowing
sparer sparse speech speedy sphere sphinx spider spigot spinal spiral spirit splash spleen splice
splint spoken sponge spongy spooky spotty spouse sprain sprang sprawl spread sprier spring sprint
sprout spruce sprung spying squall square squash squawk squeak squeal squint squire squirm squirt
stable staler stance stanch stanza staple starch starry starve stater static statue status steady
steamy stench stereo sticky stifle stigma stingy stitch stocky stodgy stolen stolid stormy strain
strait strand strata streak stream street stress strewn strict stride strife strike string stripe
strive strode stroke stroll strong strove struck strung stubby studio stuffy stupor sturdy stylus
suaver subdue sublet submit subset subtle subtly suburb subway succor suckle sudden suffer suffix
sugary suitor sulfur sullen sultan sultry summer summit summon sundae sundry sunken sunlit sunset
suntan superb supper supple supply surely surest survey swampy swathe sweaty swerve switch swivel
symbol syntax system tablet tackle tactic tailor taking talent talker taller tallow tamely tamest
taming tamper tandem tangle tanker tanner taping target tariff tartan tartar tarter tassel tattle
tattoo taught tauter tavern tawdry taxing teacup teapot tedium teeing teeter teethe teller temper
temple tenant tender tendon tennis tenser tenure termly terror terser tester tether thatch theist
thence theory thesis thieve thinly thirst thirty thorny though thrash thread threat thresh thrice
thrift thrill thrive throat throne throng thrown thrust thwart ticket tickle tidbit tidier tiding
tiling timber timely timing tinder tingle tinier tinker tinkle tinsel tiptoe tirade tiring tissue
titter toddle toeing toffee toggle toilet tomato tomboy tomcat tongue toning tonsil topple torque
torrid toting totter toucan touchy toupee tousle toward towing toying trader tragic trance trashy
trauma travel treaty treble tremor trench trendy tribal tricky trifle triple tripod tripos triter
trivia trophy trough troupe trowel truant trudge truest truing truism trusty trying tryout tubing
tumble tumult tundra tuning tunnel turban tureen turgid turkey turner turnip turret turtle tussle
tuxedo twelve twenty twinge twitch tycoon typhus typify typing typist tyrant uglier umpire unable
unborn undone unduly uneasy uneven unfair unfold unfurl unhook unique unison unjust unkind unless
unlike unload unlock unmask unpack unpaid unpick unread unreal unrest unruly unsafe unsaid unseat
unseen unsung unsure untidy untold untrue unused unveil unwary unwell unwind unwise unwrap upbeat
update upheld uphill uphold upkeep uplift upload upping uproar uproot upshot upside uptake uptown
upturn upward urbane urchin urgent urging usable useful uterus utmost vacant vacate vacuum vagary
vaguer vainer valise valley vandal vanish vanity vaster vastly vector velour velvet vendor veneer
verbal verier verify vermin versus vessel vexing viable vicing victim victor viewer vilest vilify
violet violin virtue vising vision visual volley volume voodoo vortex voting vowing voyage vulgar
waddle wading waffle waging waiter waiver waking walker wallet wallop wallow walnut walrus wander
waning wanner wanton warble warden warier warmer warmly warmth warren washer watery wavier waving
waxier waxing waylay weaken weaker weakly wealth weapon weasel weaver wedder weeing weekly weight
welder welter wetter whaler wheeze whence whilst whinny whiten whiter wholly wicker wicket widely
widest wiggle wigwam wilder wildly wilier willow window wining winner winter wintry wiping wirier
wiring wisdom wisely wisest wither within wizard wobble wobbly wolves wombat wonder wooden wooing
woolen woolly worker worsen worthy wowing wreath wrench wretch wright writer writhe wryest yearly
yellow yogurt yoking yonder zanier zenith zigzag zipper zodiac zombie zoning
`,
    },
  ],
};
