/**
 * POP GOMOJI'S ANSWERS. Written by `scripts/word-lists-pop.mjs` from the
 * hand-kept `scripts/pop-corpus.txt`; never edited by hand. Each word is
 * written `word.n`, n being its category's place in `POP_CATEGORIES`: the
 * clue the puzzle shows.
 */
export const POP_CATEGORIES: readonly string[] = [
  "Super Mario",
  "Zelda",
  "Pokemon",
  "Minecraft",
  "Sonic the Hedgehog",
  "Street Fighter",
  "Final Fantasy",
  "Video game",
  "Arcade classic",
  "Gaming word",
  "Board game",
  "Chess word",
  "Chess legend",
  "Card game",
  "Greek deity",
  "Greek myth",
  "Greek myth creature",
  "Norse myth",
  "Egyptian myth",
  "Japanese folklore",
  "Arthurian legend",
  "Fantasy creature",
  "Japanese culture",
  "Japanese food",
  "Anime word",
  "Martial art",
  "Studio Ghibli",
  "Dragon Ball",
  "Naruto",
  "Sailor Moon",
  "Doraemon",
  "Anime and manga",
  "Planet or dwarf planet",
  "Moon",
  "Space",
  "Constellation",
  "Zodiac sign",
  "Element",
  "Prehistoric",
  "Scientist",
  "Star Wars",
  "Star Trek",
  "Doctor Who",
  "Dune",
  "Robot or AI",
  "Hitchhiker's Guide",
  "Marvel",
  "DC Comics",
  "Superhero word",
  "Harry Potter",
  "Lord of the Rings",
  "Narnia",
  "Wizard of Oz",
  "Music genre",
  "Musical instrument",
  "Music word",
  "Band",
  "Singer",
  "Composer",
  "Sport",
  "Sports word",
  "Sports legend",
  "Disney and Pixar",
  "Cartoon",
  "Film",
  "Kaiju",
  "Detective",
  "Author",
  "Book character",
  "Artist",
  "Landmark",
  "World city",
  "Country",
  "Canadian icon",
  "Food",
  "Drink",
  "Dog breed",
  "Cat breed",
  "Toy",
  "Brand",
  "Car maker",
  "Dance",
  "Fashion",
  "Festival",
  "Halloween",
  "Winter holiday",
  "Circus and magic",
  "Internet",
  "Programming language",
  "Tech word"
];

export const POP_ANSWERS: Record<number, string> = {
  3: `
abu.62 ace.60 ada.88 afk.87 ali.61 ami.29 amy.4 app.89 ara.35 ash.2 bao.74 bat.84 bit.89 bmx.59 boo.0 brb.87 bts.56 bug.89 buu.27 cho.49 css.88 dab.81 eid.83 elf.21 emo.53 ent.50 eos.14 eve.44 ftw.87 geb.18 gif.87 hal.44 han.40 hel.17 hud.9 imp.21 jig.81 joy.62 kay.20 ken.5 kia.80 koi.22 lag.9 leo.36 lex.47 lob.60 lol.87 lua.88 mew.2 mmo.9 mod.9 noh.22 npc.9 nue.19 nut.18 nyx.14 odo.41 oni.19 orc.21 pan.14 par.60 pho.74 php.88 pin.11 poe.67 pop.53 pug.76 rap.53 rei.29 rex.62 rey.40 rio.71 ron.49 roo.63 rpg.9 ryu.5 sam.50 sax.54 set.18 sia.57 sif.17 ska.53 sql.88 tal.12 tap.81 taz.63 tea.75 tee.60 tet.83 tin.37 tyr.17 ufo.34 uno.13 yen.22 zen.22 zod.47
`,
  4: `
abba.56 abra.2 ajax.15 alex.3 amun.18 ankh.18 anna.62 aqua.56 ares.14 argo.15 aria.55 audi.80 bach.58 baku.19 bane.47 bart.63 bert.63 blog.87 blur.56 boba.75 bohr.39 bolt.61 bono.57 borg.41 boss.9 buff.9 buzz.62 byte.89 cape.48 chad.72 chai.75 cher.57 chip.89 clan.9 clef.55 clue.10 coco.62 cola.75 crux.35 cuba.72 dahl.67 dali.69 dart.88 data.44 dido.57 dojo.22 dora.63 dory.62 drax.46 drum.54 duet.55 dune.64 dunk.60 echo.15 elmo.63 elsa.62 enya.57 erhu.54 eris.32 eros.14 euwe.12 ewok.40 fado.53 fiat.80 fife.54 fiji.72 file.11 finn.40 folk.53 fork.11 fuji.22 funk.53 gaia.14 gian.30 goal.60 goku.27 gold.37 golf.59 gong.54 gort.44 goya.69 gyro.74 haka.81 haku.26 harp.54 hebe.14 hera.14 hero.48 hiro.62 holi.83 hora.81 horn.54 hoth.40 howl.26 html.88 hugo.67 hula.81 hulk.46 hutt.40 iago.62 idun.17 ikea.79 impa.1 iris.14 iron.37 java.88 jawa.40 jaws.64 jazz.53 jedi.40 jiji.26 jive.81 jpop.53 judo.25 kana.22 kang.46 kiki.26 kilt.82 king.11 kirk.41
kiss.56 kite.78 kitt.44 kong.65 koto.54 kpop.53 lair.48 laos.72 lead.37 lego.78 leia.40 leto.43 lilo.62 lima.71 link.1 lisa.63 lisp.88 lofi.53 lois.47 loki.17 loot.9 luca.62 ludo.10 luge.59 luke.40 luna.49 lute.54 lyra.35 lyre.54 maat.18 mali.72 manx.77 mars.32 mask.48 mate.11 maui.62 maul.40 meme.87 mime.86 miro.69 miso.23 moby.57 muse.56 myst.7 naan.74 nala.62 nara.71 navi.1 nemo.62 neon.37 nerf.78 nike.14 noel.85 noob.87 nori.23 nova.34 oboe.54 obon.22 odie.63 odin.17 ogre.21 olaf.62 oman.72 onix.2 opus.55 oslo.71 pavo.35 pawn.11 pele.61 perl.88 peru.72 ping.9 pogo.78 polo.59 pong.8 pooh.63 porg.40 ptah.18 puck.60 punk.53 punt.60 putt.60 raid.9 rank.11 raya.62 reel.81 remy.62 rhea.14 riff.55 risk.10 rito.1 rock.53 rome.71 rook.11 rory.42 ruby.88 rumi.67 rush.56 rust.88 saab.80 sari.82 seel.2 sega.79 sith.40 skat.13 slam.60 snap.13 soba.23 soda.75 solo.55 sony.79 soul.53 spam.87 sulu.41 sumo.22 sven.62 taco.74 tars.44 thor.17 tifa.6
toad.0 tofu.23 toga.82 togo.72 tote.82 toto.52 trex.38 trio.55 troi.41 tron.64 troy.15 tuba.54 tutu.82 udon.23 vali.17 vega.5 vela.35 vivi.6 vlog.87 wand.86 warp.41 wasp.46 wham.56 wifi.87 wiki.87 worf.41 xbox.79 yeti.21 ymir.17 yoda.40 yoyo.78 yugi.31 yule.83 yuna.6 yuzu.23 zazu.62 zeus.14 zinc.37 zola.67 zora.1 zork.7 zuul.38
`,
  5: `
adele.57 akita.76 akuma.5 album.55 alice.68 anand.12 anime.24 annie.64 arbok.2 arepa.74 argon.37 ariel.62 aries.36 arwen.50 aslan.51 astro.31 atari.79 atlas.14 bagel.74 bambi.62 banff.73 banjo.54 basho.67 basic.88 beast.46 bebop.53 belle.62 benin.72 bento.23 beret.82 bilbo.50 biles.61 bingo.63 biome.3 birdo.0 bizet.58 bjork.57 blaze.3 blini.74 blitz.11 blues.53 bluey.63 bogey.60 bongo.54 boron.37 bosch.69 bowie.57 boxer.76 bragi.17 braid.7 brave.64 brock.2 broom.84 bruno.62 bugle.54 bulma.27 butoh.81 byron.67 cache.89 cairo.71 cajon.54 cammy.5 camus.67 candy.84 canoe.73 canon.79 carol.85 casio.79 catan.10 cello.54 ceres.32 cetus.35 chani.43 cheat.9 check.11 chess.10 chibi.24 chile.72 chili.74 china.72 chord.55 clara.42 cloud.6 clown.86 cobol.88 cocoa.75 combo.9 comet.34 conan.66 conga.54 corgi.76 crepe.74 curie.39 curry.74 daffy.63 daisy.0 dalek.42 dango.23 dante.67 darts.59 dashi.23 debug.89 degas.69 delhi.71 denim.82 deuce.60 diana.47 dione.33 dirac.39 disco.53 ditto.2 dobby.49 dolly.57 donna.42 donut.74 dooku.40 draco.49 droid.40 drone.89 dubai.71
dumbo.62 dwarf.21 eagle.60 earth.32 eevee.2 egypt.72 ekans.2 elgar.58 elton.57 elvis.57 email.87 emoji.22 emote.87 endor.40 entei.2 eowyn.50 epona.1 ernie.63 euler.39 fable.7 fairy.21 felix.63 fermi.39 fiona.63 flash.47 floss.81 flute.54 forte.55 freya.17 frigg.17 frodo.50 fugue.55 furby.78 futon.22 gaara.28 gabon.72 gamer.9 ganon.1 gauss.39 genie.62 ghana.72 ghast.3 ghost.84 gimli.50 ginny.49 gizmo.89 gnome.21 gohan.27 golem.2 gonzo.63 goofy.62 goron.1 grail.20 grieg.58 grime.53 grind.9 grogu.40 groot.46 guild.9 guile.5 gumbo.74 gyoza.23 hades.14 haiku.22 haiti.72 hanoi.71 harpy.16 harry.49 haydn.58 heidi.63 helen.15 holly.85 holst.58 homer.63 honda.80 hooke.39 horus.18 house.53 husky.76 hydra.16 ibsen.67 icing.60 ifrit.6 inbox.87 india.72 indie.53 italy.72 jabba.40 jadis.51 jafar.62 jango.40 japan.72 jason.15 jenga.10 joker.47 jotun.17 joust.8 juice.75 julia.88 kafka.67 kahlo.69 kaiba.31 kaiju.24 kamek.0 kanga.63 kanji.22 kappa.19 katsu.23 kazoo.54 keane.56 keats.67 kebab.74 kefka.6 kendo.25 kenya.72 kinks.56 kirby.7 kirin.19 klimt.69 kombu.23
koopa.0 korat.77 korea.72 kylie.57 kyoto.71 kyudo.25 lagos.71 laksa.74 lando.40 laser.89 lassi.75 latte.75 lepus.35 level.9 lexus.80 libra.36 limbo.81 lindy.81 liszt.58 lizzo.57 lorca.67 lorde.57 lotus.80 lugia.2 luigi.0 lunar.34 lupin.49 lupus.35 lyric.55 magic.86 malta.72 mambo.53 manet.69 manga.24 maple.73 marge.63 mario.0 mazda.80 mccoy.41 mecha.24 medal.60 merry.50 messi.61 metal.53 miami.71 midas.15 midna.1 milne.67 mimas.33 mimir.17 minmi.38 misty.2 moana.62 mocha.75 mochi.23 modem.87 monet.69 morse.66 mouse.89 mulan.62 mummy.18 munch.69 naboo.40 nadal.61 natto.23 nauru.72 nepal.72 nikon.79 nimue.20 ninja.22 njord.17 nobel.39 noddy.63 nokia.79 norma.35 oasis.56 ocaml.88 okami.7 okoye.46 onsen.22 opera.53 orbit.34 organ.54 orion.35 osaka.71 otaku.24 padme.40 palau.72 paris.71 parka.82 pasta.74 patch.89 peach.0 pente.10 peppa.63 percy.49 petra.70 piano.54 piggy.63 pingu.63 pippi.68 pixel.87 pixie.21 pizza.74 pluto.32 polka.53 ponyo.26 ponzu.23 porky.63 purim.83 qatar.72 qbert.8 quark.41 queen.11 quest.9 quinn.47 quito.71 radon.37 raiju.19 rally.60
ramen.23 ravel.58 raven.47 relay.59 remix.55 renju.10 riker.41 rinoa.6 riolu.2 robby.44 robin.47 robot.89 rocky.64 rodan.65 rogue.46 rohan.50 rouge.4 rover.34 rubik.78 rugby.59 rumba.81 rummy.13 sagan.39 sagat.5 salsa.53 samba.53 sambo.25 samoa.72 samus.7 santa.85 satay.74 satie.58 scala.88 scale.55 scone.74 senna.61 seoul.71 serve.60 seuss.67 sheik.1 shiba.76 shire.50 shiso.23 shogi.10 shoji.22 shojo.24 shrek.63 shuri.46 simba.62 siren.16 sisko.41 sitar.54 skoda.80 skype.79 smash.60 smaug.50 smurf.63 snape.49 snowy.63 sobek.18 solar.34 sonic.4 sorry.10 spain.72 spare.60 spawn.9 spice.43 spock.41 spore.7 spyro.7 stark.46 steve.3 sting.57 storm.46 suneo.30 surtr.17 sushi.23 swift.88 swing.53 synth.54 tabla.54 taiko.54 tails.4 tango.53 teddy.78 tempo.55 tengu.19 terra.6 tesla.39 thoth.18 tiana.62 tiara.82 tidus.6 timon.62 titan.33 tokyo.71 tonga.72 toque.73 torii.22 troll.21 tunic.7 tuvok.41 twain.67 tweet.87 twist.81 tyche.14 uhura.41 uluru.70 unagi.23 usagi.29 vader.40 vault.59 velma.63 venom.46 venus.32 verdi.58 verne.67 verse.55 vidar.17 vinyl.55
viola.54 viral.87 virgo.36 vogon.45 vogue.81 volvo.80 wagyu.23 wales.72 walle.44 waltz.81 wanda.46 wario.0 whist.13 wilde.67 witch.84 wonka.64 woody.62 worms.7 wushu.25 xenon.37 xwing.40 yahoo.79 yavin.40 yeats.67 yokai.19 yoshi.0 yukon.73 zelda.1 zorro.64 zubat.2 zumba.81
`,
  6: `
aerith.6 ahsoka.40 aikido.25 alfred.47 anakin.40 anorak.82 anthem.55 anubis.18 apollo.14 aquila.35 arcade.89 asgard.17 asimov.67 athena.14 athens.71 atwood.67 auriga.35 aurora.34 austen.67 avalon.20 avatar.64 baldur.17 ballad.55 ballet.81 balrog.50 banksy.69 barbie.78 barium.37 barney.63 barret.6 basset.76 bastet.18 batman.47 baymax.44 beagle.76 beanie.82 beaver.73 bengal.77 berlin.71 bhutan.72 bieber.57 binary.89 birdie.60 birman.77 bishop.11 blanka.5 blazer.82 boggle.10 bolero.81 bonsai.22 bootes.35 boston.71 bowser.0 bowtie.82 boxing.25 brahms.58 brazil.72 bridge.13 bronte.67 bunker.60 burger.74 caddie.60 canada.72 carbon.37 carina.35 carrom.10 casper.63 castle.11 catbus.26 cedric.49 celebi.2 cesium.37 charon.33 chewie.40 chopin.58 chorus.55 chunli.5 churro.74 circus.86 cobalt.37 cobweb.84 coding.89 collie.76 cookie.74 copper.37 corvus.35 cosmos.34 crater.34 crayon.78 crusoe.68 cruyff.61 cubone.2 cursor.87 cyborg.47 cygnus.35 cymbal.54 cyprus.72 dallas.71 daphne.63 daruma.22 darwin.39 davros.42 deimos.33 denver.71 dimsum.74 discus.59 diving.59 diwali.83 djembe.54 domino.10 donald.62 dragon.21 dublin.71 dvorak.58 eagles.56 easter.83 eclair.74 edison.39 edmund.51 eeyore.63
eggman.4 eggnog.85 eiffel.70 elixir.88 elrond.50 elytra.3 encore.55 erlang.88 espeon.2 euchre.13 europa.33 falcon.46 fawkes.49 fedora.82 fenrir.17 fiddle.54 filter.87 follow.87 fondue.74 fossil.38 fozzie.63 france.72 fremen.43 frieza.27 frosty.85 frozen.64 fumble.60 gadget.89 galaga.8 galaxy.34 gambit.11 gamera.65 gamora.46 gandhi.64 gaston.62 gatsby.68 gawain.20 gelato.74 gemini.36 gengar.2 geordi.41 giotto.69 glados.44 glinda.52 glitch.89 goblin.21 goethe.67 gojira.65 gollum.50 gomoku.10 gondor.50 google.79 goomba.0 gospel.53 gotham.47 greece.72 grinch.85 gromit.63 grover.63 grunge.53 guitar.54 gundam.31 hacker.87 hagrid.49 hanami.22 handel.58 hathor.18 hatter.68 haumea.32 havana.71 healer.9 hearts.13 hecate.14 hector.15 hedwig.49 helios.14 helium.37 hermes.14 hestia.14 hinata.28 hiphop.53 hobbit.50 hockey.59 holmes.66 hoodie.82 hopper.39 hotdog.74 hubble.34 huddle.60 hummus.74 hyrule.1 icarus.15 iceman.46 ichiro.61 indium.37 iodine.37 isekai.24 isolde.20 itachi.28 jagger.57 jaguar.80 jarvis.44 jekyll.68 jessie.62 jigsaw.78 jordan.61 joypad.9 kabuki.22 kabuto.2 kakuro.22 karate.25 karpov.12 karuta.13 katana.22 kathak.81 kawaii.24 kelpie.21 kepler.39 kermit.63 khepri.18
kimchi.74 kimono.22 knight.11 kodama.19 kotlin.88 kraken.21 kronos.14 kungfu.25 kyogre.2 lakitu.0 lapras.2 laptop.89 lasker.12 latvia.72 lebron.61 legato.55 lennon.57 lisbon.71 loafer.82 london.71 loonie.73 louvre.70 lurker.87 machop.2 madrid.71 maggie.63 mahler.58 makoto.29 manila.71 marble.78 mariah.57 marlin.62 marple.66 marvin.44 matcha.23 medusa.16 melody.55 mendel.39 meowth.2 merida.62 merlin.20 meteor.34 mewtwo.2 mexico.72 mickey.62 miguel.62 milton.67 minako.29 minnie.62 monaco.72 moogle.6 moomin.68 mordor.50 morphy.12 mothra.65 motown.53 mousse.74 mozart.58 mudkip.2 mufasa.62 muffin.74 muggle.49 mumbai.71 nagini.49 narnia.51 naruto.28 nebula.34 neelix.41 neruda.67 nether.3 newton.39 nickel.37 nimbus.49 nissan.80 nobita.30 norway.72 nowruz.83 obelix.63 oberon.33 obiwan.40 octave.55 oddish.2 ohtani.61 omelet.74 online.87 origin.48 orwell.67 osiris.18 osmium.37 ottawa.71 oxygen.37 pacman.7 paella.74 panama.72 pascal.88 phaser.41 phelps.61 phobos.33 picard.41 piglet.63 piglin.3 pikmin.7 piplup.2 pippin.50 piquet.13 pisces.36 pixies.56 planck.39 podium.60 poirot.66 poland.72 polgar.12 poncho.82 poodle.76 popeye.63 portal.7 prague.71 prolog.88 proust.67 psyche.15
pulsar.34 pumbaa.62 puzzle.78 python.88 quasar.34 quebec.71 quiche.74 radium.37 rafiki.62 raikou.2 ramune.23 rancor.40 raptor.38 rayman.7 reboot.87 reggae.53 regina.71 renoir.69 rhydon.2 rhythm.55 roblox.7 rocket.34 rothko.69 router.89 rowing.59 ryokan.22 sakura.22 saluki.76 samosa.74 sandal.82 sanrio.79 sasuke.28 saturn.32 sauron.50 scooby.63 scotty.41 selene.14 selfie.87 senpai.24 sensei.22 sensor.89 sequin.82 serena.61 server.87 setter.76 shadow.4 shaggy.63 shazam.47 sheeta.26 shelob.50 shogun.22 shonen.24 shyguy.0 silver.37 sirius.49 skewer.11 skiing.59 slalom.59 sleigh.85 slinky.78 snitch.49 snoopy.63 soccer.59 sodium.37 sonata.55 sorbet.74 soseki.67 spades.13 sphinx.16 sphynx.77 spider.84 spooky.84 sprint.59 sprite.21 squall.6 squash.59 staryu.2 stitch.62 stream.87 strike.60 subaru.80 sudoku.22 sulfur.37 sulley.62 sundae.74 sweden.72 sydney.71 tablet.89 tackle.60 tagore.67 tamale.74 tanuki.19 tardis.42 tartan.82 tarzan.64 tatami.22 tauros.2 taurus.36 techno.53 tennis.59 tethys.33 tetris.8 tigger.63 tingle.1 tinman.52 tinsel.85 tintin.63 titian.69 togepi.2 toonie.73 totoro.26 toyota.80 trance.53 travis.56 treble.55 triton.33 trophy.60 trunks.27 tumnus.51 turing.39
turner.69 tuvalu.72 tuxedo.82 tweety.63 ultron.44 umpire.60 update.87 ursula.62 vegeta.27 vienna.71 violin.54 vision.44 vizsla.76 volley.60 vulcan.41 vulpix.2 waffle.74 wagner.58 warhol.69 wasabi.23 watson.66 weezer.56 wicked.64 wicket.60 widget.89 willow.64 wither.3 wonton.74 wreath.85 wyvern.21 xavier.46 yamaha.79 yubaba.26 zapdos.2 zaphod.45 zenith.34 zidane.6 zither.54 zombie.84 zydeco.53
`,
  7: `
acrobat.86 aladdin.62 ambient.53 angelou.67 apophis.18 aquaman.47 aragorn.50 archery.59 ariadne.15 arrakis.43 artemis.14 asterix.63 atlanta.71 austria.72 axolotl.3 bagpipe.54 bahamut.6 baklava.74 bannock.74 banshee.21 baroque.53 bassoon.54 batgirl.47 battery.89 beatles.56 beckham.61 beegees.56 beijing.71 belgium.72 bentley.80 berlioz.58 beyonce.57 bhangra.81 bifrost.17 biryani.74 bismuth.37 blondie.56 bobsled.59 bolivia.72 boromir.50 borscht.74 bowling.59 brioche.74 brownie.74 browser.87 bulgogi.74 bunraku.22 burmese.77 burrito.74 cactuar.6 calcium.37 calgary.71 calypso.53 camelot.20 canasta.13 capsule.34 captcha.87 caribou.73 carlsen.12 carroll.67 caspian.51 celesta.54 centaur.16 cezanne.69 chansey.2 chaucer.67 chekhov.67 chicago.71 chihiro.26 chimera.16 chocobo.6 circuit.89 clojure.88 columbo.66 console.89 copland.58 cosplay.24 costume.84 country.53 creeper.3 cricket.59 cruella.62 cupcake.74 cuphead.7 curling.59 cycling.59 cyclops.16 dagobah.40 debussy.58 demeter.14 denmark.72 dewgong.2 dhalsim.5 dickens.67 donburi.23 dorothy.52 dracula.68 dratini.2 dubstep.53 dungeon.9 dursley.49 eclipse.34 edamame.23 encanto.64 endgame.11 esports.59 estonia.72 everest.70 falafel.74 faraday.39 faramir.50 federer.61 fencing.25 ferengi.41 ferrari.80 finland.72 fischer.12 flareon.2 fortran.88 foxtrot.81
frisbee.78 frogger.8 galahad.20 galileo.39 gallium.37 gandalf.50 genesis.56 geodude.2 gnocchi.74 goonies.64 goulash.74 gretzky.61 griffin.21 groudon.2 gungnir.17 halifax.71 hapkido.25 hashtag.87 haskell.88 hawkeye.46 hawking.39 hawkman.47 hendrix.57 hokusai.69 houdini.86 hurdles.59 hurling.59 iceland.72 ikebana.22 innings.60 inuksuk.73 ireland.72 iridium.37 jamaica.72 janeway.41 jasmine.62 javelin.59 jiraiya.28 jolteon.2 journey.56 juggler.86 jujitsu.25 jupiter.32 kabaddi.59 kadabra.2 kakashi.28 karaoke.22 karting.59 kendama.22 kitsune.19 klingon.41 kokeshi.22 kotatsu.22 kramnik.12 kremlin.70 krillin.27 krypton.37 kwanzaa.83 lantern.47 lasagna.74 legolas.50 lithium.37 lucario.2 lumiere.62 madness.56 madonna.57 magneto.46 mahjong.10 maigret.66 maltese.76 mammoth.38 mancala.10 maracas.54 marimba.54 marowak.2 mastiff.76 materia.6 matilda.64 matisse.69 megaman.7 melange.43 mercury.32 mermaid.21 metroid.7 midgard.17 mirabel.62 miranda.33 mithril.50 mixtape.55 mjolnir.17 moltres.2 monkees.56 mordred.20 morocco.72 mountie.73 nairobi.71 nemesis.14 neptune.32 netball.59 netflix.79 neville.49 niagara.70 nirvana.56 noether.39 nunavut.73 offline.87 offside.60 olympus.15 onigiri.23 opening.11 optimus.44 origami.22 orpheus.15 paisley.82 pancake.74 pandora.15 parkour.59 pasteur.39 pegasus.16 penalty.60
penguin.47 perseus.15 persian.77 pharaoh.18 phoenix.21 picasso.69 piccolo.54 pickaxe.3 pierogi.74 pikachu.2 playdoh.78 podcast.87 pointer.76 pollock.69 popcorn.74 porsche.80 poutine.74 powerup.9 present.85 pretzel.74 profile.87 psyduck.2 puccini.58 pumpkin.84 purcell.58 quixote.68 ragdoll.77 ramones.56 raphael.69 ravioli.74 referee.60 respawn.9 reversi.10 riddler.47 rihanna.57 risotto.74 romulan.41 ronaldo.61 rosalia.57 rossini.58 rowling.67 rudolph.85 sailing.59 samoyed.76 samurai.22 sarlacc.40 saruman.50 sashimi.23 scooter.78 scorpio.36 scrooge.85 seattle.71 sekhmet.18 shakira.57 sheeran.57 shelley.67 shenron.27 shiatsu.22 shihtzu.76 shizuka.30 shotput.59 shuffle.81 shuttle.34 siamese.77 skating.59 sneaker.82 snooker.59 snorlax.2 snowman.85 spaniel.76 spassky.12 sputnik.34 stardew.7 starmie.2 sticker.87 stilgar.43 strauss.58 suicune.2 surfing.59 taiyaki.23 tchalla.46 tempest.8 tempura.23 terrier.76 theseus.15 timpani.54 titanic.64 tolkien.67 tolstoy.67 torchic.2 toronto.71 trapeze.86 treecko.2 tribble.41 tristan.20 trouble.10 trumpet.54 tsunade.28 tunisia.72 twister.10 uematsu.58 ukulele.54 umbreon.2 unicorn.21 uranium.37 uruguay.72 vampire.84 vermeer.69 vietnam.72 villain.48 vivaldi.58 voyager.34 wakanda.46 wallace.63 waluigi.0 whippet.76 whitney.57 wookiee.40 xiangqi.10 yahtzee.10
zangief.5 zatanna.47
`,
};
