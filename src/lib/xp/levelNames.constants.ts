/**
 * The hundred level names.
 *
 * A ladder, not a list: level 1 is where a person starts, level 100 is the
 * coolest thing in gaming, and everything between climbs. Consoles appear in
 * release order, numbered series are spaced well apart, and the round numbers
 * are the ones somebody would screenshot. Every name is a real reference a
 * gamer would know; the `note` says why, in one line, for the rank's own page.
 *
 * The join to the economy is `xpLevelName(level)` in `levelNames.ts`, so this
 * file is data only: nothing reads it directly and nothing in it throws.
 * `levelNames.test.ts` holds it to exactly one hundred rows, unique names,
 * and no two entries of one numbered series within three levels of each other.
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
  { level: 10, name: "High Score", kanji: "高得点", note: "Three initials at the top of the table, for everyone who came after to chase." },
  // 11-20: 8-bit, the era that brought games home for good.
  { level: 11, name: "D-Pad", kanji: "十字キー", note: "Gunpei Yokoi's cross of four arrows, 1982, on every controller made since." },
  { level: 12, name: "Cartridge I", note: "The grey brick you blew into, sworn by a whole generation to work better afterwards." },
  { level: 13, name: "NES", note: "Nintendo Entertainment System, 1985: the box that brought games back from the dead." },
  { level: 14, name: "World 1-1", note: "Super Mario Bros., 1985: the level that taught the whole world to play without a word of instruction." },
  { level: 15, name: "Warp Zone", note: "The pipes under World 1-2, and the first secret everybody's cousin swore was real." },
  { level: 16, name: "The Legend of Zelda", note: "1986: a golden cartridge, a battery to save your game, and 'it's dangerous to go alone'." },
  { level: 17, name: "Metroid", note: "1986: run, jump, and learn at the end that the bounty hunter was a woman all along." },
  { level: 18, name: "Mega Man 2", note: "Capcom, 1988: eight robot masters in any order you liked, and the best soundtrack on the NES." },
  { level: 19, name: "Game Boy", note: "1989: four shades of green, thirty hours on two AAs, and Tetris in the box." },
  { level: 20, name: "Tetris", note: "Alexey Pajitnov, 1984: seven shapes, one rule, and the one game everybody on Earth has played." },
];
