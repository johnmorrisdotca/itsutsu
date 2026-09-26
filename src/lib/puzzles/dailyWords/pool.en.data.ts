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
};
