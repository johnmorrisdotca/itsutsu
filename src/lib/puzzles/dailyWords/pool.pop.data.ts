/**
 * THE DAILY WORDS' POOLS FOR POP, one list of versions per length.
 *
 * WRITTEN BY `node scripts/daily-pools.ts`, NEVER BY HAND, and never rewritten: each
 * entry is a frozen copy of an answer list, and the days of every cycle it
 * serves were drawn from exactly these words. `dailyPools.test.ts` holds each
 * entry to its hash. A newer list is a new entry from a later cycle.
 *
 * From src/lib/puzzles/gomoji/words.pop.data.ts, whose notice follows:
 *
 *   POP GOMOJI'S ANSWERS. Written by `scripts/word-lists-pop.mjs` from the
 *   hand-kept `scripts/pop-corpus.txt`; never edited by hand. Each word is
 *   written `word.n`, n being its category's place in `POP_CATEGORIES`: the
 *   clue the puzzle shows.
 */
import type { PackedDailyPool } from "./dailyWords.types";

export const DAILY_POOL_POP: Record<number, readonly PackedDailyPool[]> = {
  3: [
    {
      fromCycle: 0,
      source: "the 3-letter answers of words.pop.data.ts, read 2026-09-26",
      words: `
abu ace ada afk ali ami amy app ara ash bao bat bit bmx boo brb bts bug buu cho css dab eid elf emo
ent eos eve ftw geb gif hal han hel hud imp jig joy kay ken kia koi lag leo lex lob lol lua mew mmo
mod noh npc nue nut nyx odo oni orc pan par pho php pin poe pop pug rap rei rex rey rio ron roo rpg
ryu sam sax set sia sif ska sql tal tap taz tea tee tet tin tyr ufo uno yen zen zod
`,
    },
  ],
  4: [
    {
      fromCycle: 0,
      source: "the 4-letter answers of words.pop.data.ts, read 2026-09-26",
      words: `
abba abra ajax alex amun ankh anna aqua ares argo aria audi bach baku bane bart bert blog blur boba
bohr bolt bono borg boss buff buzz byte cape chad chai cher chip clan clef clue coco cola crux cuba
dahl dali dart data dido dojo dora dory drax drum duet dune dunk echo elmo elsa enya erhu eris eros
euwe ewok fado fiat fife fiji file finn folk fork fuji funk gaia gian goal goku gold golf gong gort
goya gyro haka haku harp hebe hera hero hiro holi hora horn hoth howl html hugo hula hulk hutt iago
idun ikea impa iris iron java jawa jaws jazz jedi jiji jive jpop judo kana kang kiki kilt king kirk
kiss kite kitt kong koto kpop lair laos lead lego leia leto lilo lima link lisa lisp lofi lois loki
loot luca ludo luge luke luna lute lyra lyre maat mali manx mars mask mate maui maul meme mime miro
miso moby muse myst naan nala nara navi nemo neon nerf nike noel noob nori nova oboe obon odie odin
ogre olaf oman onix opus oslo pavo pawn pele perl peru ping pogo polo pong pooh porg ptah puck punk
punt putt raid rank raya reel remy rhea riff risk rito rock rome rook rory ruby rumi rush rust saab
sari seel sega sith skat slam snap soba soda solo sony soul spam sulu sumo sven taco tars thor tifa
toad tofu toga togo tote toto trex trio troi tron troy tuba tutu udon vali vega vela vivi vlog wand
warp wasp wham wifi wiki worf xbox yeti ymir yoda yoyo yugi yule yuna yuzu zazu zeus zinc zola zora
zork zuul
`,
    },
  ],
  5: [
    {
      fromCycle: 0,
      source: "the 5-letter answers of words.pop.data.ts, read 2026-09-26",
      words: `
adele akita akuma album alice anand anime annie arbok arepa argon ariel aries arwen aslan astro
atari atlas bagel bambi banff banjo basho basic beast bebop belle benin bento beret bilbo biles
bingo biome birdo bizet bjork blaze blini blitz blues bluey bogey bongo boron bosch bowie boxer
bragi braid brave brock broom bruno bugle bulma butoh byron cache cairo cajon cammy camus candy
canoe canon carol casio catan cello ceres cetus chani cheat check chess chibi chile chili china
chord clara cloud clown cobol cocoa combo comet conan conga corgi crepe curie curry daffy daisy
dalek dango dante darts dashi debug degas delhi denim deuce diana dione dirac disco ditto dobby
dolly donna donut dooku draco droid drone dubai dumbo dwarf eagle earth eevee egypt ekans elgar
elton elvis email emoji emote endor entei eowyn epona ernie euler fable fairy felix fermi fiona
flash floss flute forte freya frigg frodo fugue furby futon gaara gabon gamer ganon gauss genie
ghana ghast ghost gimli ginny gizmo gnome gohan golem gonzo goofy goron grail grieg grime grind
grogu groot guild guile gumbo gyoza hades haiku haiti hanoi harpy harry haydn heidi helen holly
holst homer honda hooke horus house husky hydra ibsen icing ifrit inbox india indie italy jabba
jadis jafar jango japan jason jenga joker jotun joust juice julia kafka kahlo kaiba kaiju kamek
kanga kanji kappa katsu kazoo keane keats kebab kefka kendo kenya kinks kirby kirin klimt kombu
koopa korat korea kylie kyoto kyudo lagos laksa lando laser lassi latte lepus level lexus libra
limbo lindy liszt lizzo lorca lorde lotus lugia luigi lunar lupin lupus lyric magic malta mambo
manet manga maple marge mario mazda mccoy mecha medal merry messi metal miami midas midna milne
mimas mimir minmi misty moana mocha mochi modem monet morse mouse mulan mummy munch naboo nadal
natto nauru nepal nikon nimue ninja njord nobel noddy nokia norma oasis ocaml okami okoye onsen
opera orbit organ orion osaka otaku padme palau paris parka pasta patch peach pente peppa percy
petra piano piggy pingu pippi pixel pixie pizza pluto polka ponyo ponzu porky purim qatar qbert
quark queen quest quinn quito radon raiju rally ramen ravel raven relay remix renju riker rinoa
riolu robby robin robot rocky rodan rogue rohan rouge rover rubik rugby rumba rummy sagan sagat
salsa samba sambo samoa samus santa satay satie scala scale scone senna seoul serve seuss sheik
shiba shire shiso shogi shoji shojo shrek shuri simba siren sisko sitar skoda skype smash smaug
smurf snape snowy sobek solar sonic sorry spain spare spawn spice spock spore spyro stark steve
sting storm suneo surtr sushi swift swing synth tabla taiko tails tango teddy tempo tengu terra
tesla thoth tiana tiara tidus timon titan tokyo tonga toque torii troll tunic tuvok twain tweet
twist tyche uhura uluru unagi usagi vader vault velma venom venus verdi verne verse vidar vinyl
viola viral virgo vogon vogue volvo wagyu wales walle waltz wanda wario whist wilde witch wonka
woody worms wushu xenon xwing yahoo yavin yeats yokai yoshi yukon zelda zorro zubat zumba
`,
    },
  ],
  6: [
    {
      fromCycle: 0,
      source: "the 6-letter answers of words.pop.data.ts, read 2026-09-26",
      words: `
aerith ahsoka aikido alfred anakin anorak anthem anubis apollo aquila arcade asgard asimov athena
athens atwood auriga aurora austen avalon avatar baldur ballad ballet balrog banksy barbie barium
barney barret basset bastet batman baymax beagle beanie beaver bengal berlin bhutan bieber binary
birdie birman bishop blanka blazer boggle bolero bonsai bootes boston bowser bowtie boxing brahms
brazil bridge bronte bunker burger caddie canada carbon carina carrom casper castle catbus cedric
celebi cesium charon chewie chopin chorus chunli churro circus cobalt cobweb coding collie cookie
copper corvus cosmos crater crayon crusoe cruyff cubone cursor cyborg cygnus cymbal cyprus dallas
daphne daruma darwin davros deimos denver dimsum discus diving diwali djembe domino donald dragon
dublin dvorak eagles easter eclair edison edmund eeyore eggman eggnog eiffel elixir elrond elytra
encore erlang espeon euchre europa falcon fawkes fedora fenrir fiddle filter follow fondue fossil
fozzie france fremen frieza frosty frozen fumble gadget galaga galaxy gambit gamera gamora gandhi
gaston gatsby gawain gelato gemini gengar geordi giotto glados glinda glitch goblin goethe gojira
gollum gomoku gondor google goomba gospel gotham greece grinch gromit grover grunge guitar gundam
hacker hagrid hanami handel hathor hatter haumea havana healer hearts hecate hector hedwig helios
helium hermes hestia hinata hiphop hobbit hockey holmes hoodie hopper hotdog hubble huddle hummus
hyrule icarus iceman ichiro indium iodine isekai isolde itachi jagger jaguar jarvis jekyll jessie
jigsaw jordan joypad kabuki kabuto kakuro karate karpov karuta katana kathak kawaii kelpie kepler
kermit khepri kimchi kimono knight kodama kotlin kraken kronos kungfu kyogre lakitu lapras laptop
lasker latvia lebron legato lennon lisbon loafer london loonie louvre lurker machop madrid maggie
mahler makoto manila marble mariah marlin marple marvin matcha medusa melody mendel meowth merida
merlin meteor mewtwo mexico mickey miguel milton minako minnie monaco moogle moomin mordor morphy
mothra motown mousse mozart mudkip mufasa muffin muggle mumbai nagini narnia naruto nebula neelix
neruda nether newton nickel nimbus nissan nobita norway nowruz obelix oberon obiwan octave oddish
ohtani omelet online origin orwell osiris osmium ottawa oxygen pacman paella panama pascal phaser
phelps phobos picard piglet piglin pikmin piplup pippin piquet pisces pixies planck podium poirot
poland polgar poncho poodle popeye portal prague prolog proust psyche pulsar pumbaa puzzle python
quasar quebec quiche radium rafiki raikou ramune rancor raptor rayman reboot reggae regina renoir
rhydon rhythm roblox rocket rothko router rowing ryokan sakura saluki samosa sandal sanrio sasuke
saturn sauron scooby scotty selene selfie senpai sensei sensor sequin serena server setter shadow
shaggy shazam sheeta shelob shogun shonen shyguy silver sirius skewer skiing slalom sleigh slinky
snitch snoopy soccer sodium sonata sorbet soseki spades sphinx sphynx spider spooky sprint sprite
squall squash staryu stitch stream strike subaru sudoku sulfur sulley sundae sweden sydney tablet
tackle tagore tamale tanuki tardis tartan tarzan tatami tauros taurus techno tennis tethys tetris
tigger tingle tinman tinsel tintin titian togepi toonie totoro toyota trance travis treble triton
trophy trunks tumnus turing turner tuvalu tuxedo tweety ultron umpire update ursula vegeta vienna
violin vision vizsla volley vulcan vulpix waffle wagner warhol wasabi watson weezer wicked wicket
widget willow wither wonton wreath wyvern xavier yamaha yubaba zapdos zaphod zenith zidane zither
zombie zydeco
`,
    },
  ],
  7: [
    {
      fromCycle: 0,
      source: "the 7-letter answers of words.pop.data.ts, read 2026-09-26",
      words: `
acrobat aladdin ambient angelou apophis aquaman aragorn archery ariadne arrakis artemis asterix
atlanta austria axolotl bagpipe bahamut baklava bannock banshee baroque bassoon batgirl battery
beatles beckham beegees beijing belgium bentley berlioz beyonce bhangra bifrost biryani bismuth
blondie bobsled bolivia boromir borscht bowling brioche brownie browser bulgogi bunraku burmese
burrito cactuar calcium calgary calypso camelot canasta capsule captcha caribou carlsen carroll
caspian celesta centaur cezanne chansey chaucer chekhov chicago chihiro chimera chocobo circuit
clojure columbo console copland cosplay costume country creeper cricket cruella cupcake cuphead
curling cycling cyclops dagobah debussy demeter denmark dewgong dhalsim dickens donburi dorothy
dracula dratini dubstep dungeon dursley eclipse edamame encanto endgame esports estonia everest
falafel faraday faramir federer fencing ferengi ferrari finland fischer flareon fortran foxtrot
frisbee frogger galahad galileo gallium gandalf genesis geodude gnocchi goonies goulash gretzky
griffin groudon gungnir halifax hapkido hashtag haskell hawkeye hawking hawkman hendrix hokusai
houdini hurdles hurling iceland ikebana innings inuksuk ireland iridium jamaica janeway jasmine
javelin jiraiya jolteon journey juggler jujitsu jupiter kabaddi kadabra kakashi karaoke karting
kendama kitsune klingon kokeshi kotatsu kramnik kremlin krillin krypton kwanzaa lantern lasagna
legolas lithium lucario lumiere madness madonna magneto mahjong maigret maltese mammoth mancala
maracas marimba marowak mastiff materia matilda matisse megaman melange mercury mermaid metroid
midgard mirabel miranda mithril mixtape mjolnir moltres monkees mordred morocco mountie nairobi
nemesis neptune netball netflix neville niagara nirvana noether nunavut offline offside olympus
onigiri opening optimus origami orpheus paisley pancake pandora parkour pasteur pegasus penalty
penguin perseus persian pharaoh phoenix picasso piccolo pickaxe pierogi pikachu playdoh podcast
pointer pollock popcorn porsche poutine powerup present pretzel profile psyduck puccini pumpkin
purcell quixote ragdoll ramones raphael ravioli referee respawn reversi riddler rihanna risotto
romulan ronaldo rosalia rossini rowling rudolph sailing samoyed samurai sarlacc saruman sashimi
scooter scorpio scrooge seattle sekhmet shakira sheeran shelley shenron shiatsu shihtzu shizuka
shotput shuffle shuttle siamese skating sneaker snooker snorlax snowman spaniel spassky sputnik
stardew starmie sticker stilgar strauss suicune surfing taiyaki tchalla tempest tempura terrier
theseus timpani titanic tolkien tolstoy torchic toronto trapeze treecko tribble tristan trouble
trumpet tsunade tunisia twister uematsu ukulele umbreon unicorn uranium uruguay vampire vermeer
vietnam villain vivaldi voyager wakanda wallace waluigi whippet whitney wookiee xiangqi yahtzee
zangief zatanna
`,
    },
  ],
};
