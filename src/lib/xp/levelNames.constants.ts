/**
 * The hundred level names.
 *
 * A ladder, not a list: level 1 is where a person starts, level 100 is the
 * coolest thing in gaming, and everything between climbs. Video games and
 * board games share the one ladder, about one rung in four from the board,
 * because this is a board-game site and that culture runs as deep as the
 * arcade's. Consoles appear in release order, numbered series are spaced well
 * apart, and the round numbers are the ones somebody would screenshot. Every
 * name is a real reference a player would know; the `note` says why, in one
 * line, for the rank's own page.
 *
 * The join to the economy is `xpLevelName(level)` in `levelNames.ts`, so this
 * file is data only: nothing reads it directly and nothing in it throws.
 * `levelNames.test.ts` holds it to exactly one hundred rows, unique names,
 * and no two entries of one numbered series within three levels of each other.
 *
 * Kyu, Dan and Meijin are the site's bots and are not used here.
 */

export type LevelName = {
  /** 1 to 100. */
  level: number;
  /** The canonical name, the one a member is shown. */
  name: string;
  /** A Japanese name where one reads well. Absent is normal. */
  kanji?: string;
  /** Why this reference is cool, in one line, for the rank's own page. */
  note: string;
};

/** Exactly one hundred, level 1 first, no gaps. */
export const LEVEL_NAMES: readonly LevelName[] = [
  // 1-10: the arcade, where everybody started.
  { level: 1, name: "Insert Coin", note: "The two words every arcade run began with, one quarter at a time." },
  { level: 2, name: "Press Start", note: "The first instruction any game ever gave you, and the first one you obeyed." },
  { level: 3, name: "Pong", note: "Atari, 1972: two paddles, one ball, and the whole industry that followed." },
  { level: 4, name: "Joystick", note: "Eight directions and a red ball on top, the way a generation held a game." },
  { level: 5, name: "Space Invaders", note: "Taito, 1978: the first game to save a high score, and the first to make a nation queue." },
  { level: 6, name: "Atari 2600", note: "The woodgrain box of 1977 that brought the arcade into the living room." },
  { level: 7, name: "Pac-Man", note: "Namco, 1980: a yellow circle, four ghosts, and the most recognised face in games." },
  { level: 8, name: "Donkey Kong", note: "Nintendo, 1981: Miyamoto's first game, and the carpenter who grew up to be Mario." },
  { level: 9, name: "1-Up", note: "One more life, and a sound every player can still hear in their head." },
  { level: 10, name: "Player One", note: "The first slot on every cabinet and every couch: the one the game was built for." },
  // 11-20: 8-bit, and the first games anyone learns.
  { level: 11, name: "Tic-Tac-Toe", kanji: "三目並べ", note: "Three in a row on nine squares: the first game anyone learns, and the first one anyone learns cannot be won." },
  { level: 12, name: "Cartridge I", note: "The grey brick you blew into, sworn by a whole generation to work better afterwards." },
  { level: 13, name: "NES", note: "Nintendo Entertainment System, 1985: the box that brought games back from the dead." },
  { level: 14, name: "World 1-1", note: "Super Mario Bros., 1985: the level that taught the whole world to play without a word of instruction." },
  { level: 15, name: "Connect Four", note: "Milton Bradley, 1974: four in a row with gravity doing the placing, solved in 1988 and played as if it never was." },
  { level: 16, name: "The Legend of Zelda", note: "1986: a golden cartridge, a battery to save your game, and 'it's dangerous to go alone'." },
  { level: 17, name: "Metroid", note: "1986: run, jump, and learn at the end that the bounty hunter was a woman all along." },
  { level: 18, name: "King Me", note: "Checkers: reach the far row, get a second piece stacked on top, and move backwards for the first time in your life." },
  { level: 19, name: "Game Boy", note: "1989: four shades of green, thirty hours on two AAs, and Tetris in the box." },
  { level: 20, name: "Tetris", note: "Alexey Pajitnov, 1984: seven shapes, one rule, and the one game everybody on Earth has played." },
  // 21-30: 16-bit, the console war, and the arcade at its loudest.
  { level: 21, name: "Sega Genesis", note: "1989: Sega's 16-bit answer to Nintendo, 'blast processing', and the first console war worth the name." },
  { level: 22, name: "Sonic the Hedgehog", note: "1991: a blue hedgehog with attitude, built to run faster than a plumber could ever jump." },
  { level: 23, name: "Gomoku", kanji: "五目並べ", note: "Five in a row on a Go board, played in Japan for centuries with stones borrowed from a harder game; this site is named for it." },
  { level: 24, name: "Cartridge II", note: "The 16-bit cart: twice the pins, a battery inside, and a quest that survived the night." },
  { level: 25, name: "Super Nintendo", note: "1991: Mode 7, a pad with four coloured buttons, and the library still argued to be the best there ever was." },
  { level: 26, name: "Hadouken", kanji: "波動拳", note: "Street Fighter II, 1991: quarter-circle forward and punch, the first special move every gamer learned to throw." },
  { level: 27, name: "Fatality", note: "Mortal Kombat, 1992: 'FINISH HIM', then a move so gory it gave America a ratings board." },
  { level: 28, name: "Othello", note: "Goro Hasegawa, 1973: a minute to learn, a lifetime to master, and a corner that decides everything." },
  { level: 29, name: "Super Metroid", note: "1994: the map, the mood, and the animals you could go back to save; for many, the best game on the system." },
  { level: 30, name: "Neo Geo", note: "SNK, 1990: the arcade board sold as a home console, at a price only the richest kid on the street could pay." },
  // 31-40: the leap into 3D, and the openings.
  { level: 31, name: "Chrono Trigger", note: "Square, 1995: the dream team, thirteen endings, and the RPG people still name when asked for the best." },
  { level: 32, name: "Doom", note: "id Software, 1993: shareware, a shotgun, and the first game your office network was secretly for." },
  { level: 33, name: "PlayStation", note: "Sony, 1994: a CD, a grey box, and the moment games moved out of the kids' bedroom." },
  { level: 34, name: "Gambit", note: "Chess: give up a pawn in the opening for something better than a pawn, and the word every plan since has borrowed." },
  { level: 35, name: "Nintendo 64", note: "1996: a three-pronged pad, four controller ports, and the analog stick every console since has copied." },
  { level: 36, name: "Super Mario 64", note: "1996: the first time a stick moved a man through a real, round, three-dimensional world." },
  { level: 37, name: "Joseki", kanji: "定石", note: "Go's settled corner sequences, learned by heart and then, the proverb says, forgotten." },
  { level: 38, name: "Cartridge III", note: "The N64 cart: no loading, no scratches, and the last of its kind for twenty years." },
  { level: 39, name: "GoldenEye 007", note: "Rare, 1997: four players, one screen, and a house rule about not picking Oddjob." },
  { level: 40, name: "Final Fantasy VII", note: "Square, 1997: three discs, a Buster Sword, and the death nobody was ready for." },
  // 41-50: the turn of the millennium.
  { level: 41, name: "Pokémon Red", note: "Game Freak, 1996: a hundred and fifty-one of them, a link cable, and the playground trade that started a world." },
  { level: 42, name: "Dreamcast", note: "Sega, 1999: 9/9/99, a modem in the box, and the last console Sega ever made, ahead of its time to the end." },
  { level: 43, name: "Metal Gear Solid", note: "Konami, 1998: a cardboard box, a codec call, and a boss who read your memory card." },
  { level: 44, name: "Half-Life", note: "Valve, 1998: a crowbar, a tram ride, and a story told without ever taking the controls away from you." },
  { level: 45, name: "LAN Party", note: "Ten PCs in a basement, a crate of cola, and Quake until sunrise: the golden age of the wired night." },
  { level: 46, name: "StarCraft", note: "Blizzard, 1998: three races, a balance nobody has matched since, and a game South Korea put on television." },
  { level: 47, name: "Elo Rating", note: "Arpad Elo, 1960: the number that says how good you are, invented for chess and now behind every ladder, this one included." },
  { level: 48, name: "Boss Fight", kanji: "ボス戦", note: "The music changes, the health bar fills the screen, and everything you learned is about to be tested." },
  { level: 49, name: "Pente", note: "Gary Gabrel, 1977: five in a row or five pairs captured, invented in a pizza parlour in Oklahoma and played here still." },
  { level: 50, name: "PlayStation 2", note: "Sony, 2000: a DVD player that happened to play games, and 155 million sold, more than any console before or since." },
  // 51-60: the sixth generation, and the middle game.
  { level: 51, name: "Fuseki", kanji: "布石", note: "Go's opening: stones laid out for a game decided a hundred moves later; the Japanese use the word for any groundwork." },
  { level: 52, name: "GameCube", note: "2001: a purple lunchbox with a handle, tiny discs, and a controller so good Smash players still refuse to give it up." },
  { level: 53, name: "En Passant", note: "Chess's strangest rule: a pawn captured on a square it never landed on, and the one every beginner swears was made up." },
  { level: 54, name: "Halo", note: "Bungie, 2001: Master Chief, a ring world, and the game that sold the first Xbox." },
  { level: 55, name: "Katamari Damacy", kanji: "塊魂", note: "Namco, 2004: roll up the cat, then the car, then the continent, while the King of All Cosmos judges you." },
  { level: 56, name: "World of Warcraft", note: "Blizzard, 2004: twelve million subscribers, a raid on Tuesday night, and Leeroy Jenkins." },
  { level: 57, name: "Nintendo DS", note: "2004: two screens, a stylus, and 154 million sold, a touchscreen three years before the iPhone." },
  { level: 58, name: "Shadow of the Colossus", note: "Team Ico, 2005: sixteen giants, an empty world, and the game people name when someone says games can't be art." },
  { level: 59, name: "Renju", kanji: "連珠", note: "Gomoku with black's hands tied: no double threes, no overlines. The tournament form of the game, Japan, 1899." },
  { level: 60, name: "Wii", note: "Nintendo, 2006: a remote instead of a pad, Wii Sports in the box, and grandparents bowling in the living room." },
  // 61-70: the HD era, and the fight.
  { level: 61, name: "Portal", note: "Valve, 2007: a gun that made two holes, a computer that made promises about cake, and a song over the credits." },
  { level: 62, name: "BioShock", note: "Irrational, 2007: a city under the sea, a plasmid in your hand, and 'would you kindly'." },
  { level: 63, name: "Ko", kanji: "劫", note: "Go's rule against repeating the board: the fight you can only win by threatening something bigger somewhere else." },
  { level: 64, name: "Minecraft", note: "Mojang, 2011: a block of dirt, a creeper at the door, and 300 million sold, the best-selling game there has ever been." },
  { level: 65, name: "Skyrim", note: "Bethesda, 2011: 'Fus Ro Dah', a dragon on the road, and an arrow to the knee." },
  { level: 66, name: "Dark Souls", note: "FromSoftware, 2011: 'YOU DIED', a bonfire, and the hardest game that was ever fair. Praise the sun." },
  { level: 67, name: "Tesuji", kanji: "手筋", note: "Go's word for the skilful move: the one that makes a position work, and the one a stronger player finds without looking." },
  { level: 68, name: "The Last of Us", note: "Naughty Dog, 2013: a giraffe, a lie at the end, and the story that made the whole medium grow up." },
  { level: 69, name: "Grand Theft Auto V", note: "Rockstar, 2013: Los Santos, three leads, and the second-best-selling game ever, still selling a decade on." },
  { level: 70, name: "The Witcher 3", note: "CD Projekt, 2015: Geralt, Gwent, and side quests better than most games' main ones." },
  // 71-80: the present day, and the first marks of mastery.
  { level: 71, name: "Nintendo Switch", note: "2017: a console you lift off the dock and carry out the door, and a Joy-Con click nobody tires of." },
  { level: 72, name: "New Game+", kanji: "強くてニューゲーム", note: "Chrono Trigger's own words: finish the game, keep everything, and start again stronger than the world expects." },
  { level: 73, name: "Speedrun", note: "Any%, glitchless or 100%: the same game, finished in a fraction of the time its makers thought it took." },
  { level: 74, name: "PlayStation 5", note: "Sony, 2020: a DualSense that pushes back on your fingers, and the console nobody could find in a shop for a year." },
  { level: 75, name: "Platinum Trophy", note: "Every trophy in the game, one platinum to show for it, and a reason to look at your own profile twice." },
  { level: 76, name: "Honinbo", kanji: "本因坊", note: "Go's oldest title, held first by Sansa in 1612 and fought for every year since: the longest-running championship in any game." },
  { level: 77, name: "Combo Breaker", note: "Killer Instinct, 1994: 'C-C-C-COMBO BREAKER', and the two words shouted at every interruption since." },
  { level: 78, name: "Ryuo", kanji: "竜王", note: "Dragon King: shogi's promoted rook, and the title one of its eight crowns is named for." },
  { level: 79, name: "S-Rank", note: "The grade above A, from Devil May Cry to Resident Evil: not just finished, finished with style." },
  { level: 80, name: "Breath of the Wild", note: "Nintendo, 2017: a plateau, a paraglider, and a whole kingdom that let you go anywhere you could see." },
  // 81-90: the legends.
  { level: 81, name: "Elden Ring", note: "FromSoftware, 2022: the Lands Between, a horse called Torrent, and the Souls formula set loose in an open world." },
  { level: 82, name: "Zugzwang", note: "Chess's word for a position where every move makes things worse, and the only winning move would be not to have to." },
  { level: 83, name: "No-Hit Run", note: "A whole game, boss to boss, without taking a single point of damage; one slip and it is back to the start." },
  { level: 84, name: "Deep Blue", note: "IBM, 1997: the first machine to beat a world chess champion in a match, and Kasparov's face when it did." },
  { level: 85, name: "Evo Moment 37", note: "2004: Daigo parries all fifteen hits of Chun-Li's super on one pixel of health, and a room stands up screaming." },
  { level: 86, name: "Kill Screen", note: "Pac-Man level 256: the board falls apart, because nobody at Namco believed anyone would ever get this far." },
  { level: 87, name: "Immortal Game", note: "Anderssen v Kieseritzky, London 1851: a queen, two rooks and a bishop given away, and a mate still on the wall." },
  { level: 88, name: "Grand Master", note: "Chess's highest title since 1950, and the grade Tetris: The Grand Master keeps for players who can place invisible blocks." },
  { level: 89, name: "Frame Perfect", note: "An input on the one frame in sixty that works: the difference between a good player and the best one alive." },
  { level: 90, name: "Ocarina of Time", note: "Nintendo, 1998: Z-targeting, the Temple of Time, and the highest score any critic has ever given a game." },
  // 91-100: the pantheon.
  { level: 91, name: "SSS", note: "Devil May Cry, 2001: the top of the style meter, three letters above S, held only by never being touched and never standing still." },
  { level: 92, name: "Checkmate", kanji: "詰み", note: "The king has nowhere to go, and there is nothing left to say: the oldest winning word there is." },
  { level: 93, name: "Konami Code", note: "Up, up, down, down, left, right, left, right, B, A: thirty lives in Contra, and the most famous secret ever typed." },
  { level: 94, name: "Tengen", kanji: "天元", note: "The origin of heaven: the centre point of the Go board, the boldest first move there is, and a title fought for since 1976." },
  { level: 95, name: "Final Boss", kanji: "大魔王", note: "The last one, the one every other fight was practice for; the name for whoever everyone else has to beat." },
  { level: 96, name: "Move 37", note: "AlphaGo v Lee Sedol, game two, 2016: a move no human would play, at one-in-ten-thousand odds, and the moment a machine was called creative." },
  { level: 97, name: "High Score", kanji: "高得点", note: "Three initials at the top of the cabinet, and everything the arcade was ever for." },
  { level: 98, name: "Master Sword", note: "The blade of evil's bane, asleep in its pedestal until someone worthy comes to pull it." },
  { level: 99, name: "Triforce", note: "Power, wisdom and courage, and a wish granted to whoever holds all three." },
  { level: 100, name: "Divine Move", kanji: "神の一手", note: "Kami no itte: the one perfect move Go players have chased for a thousand years, and the reason Sai stayed on Earth." },
];
