import type { VariantCopy } from "../gomoku/variants.constants";

import { LONGEST_WORD, MOST_GUESSES } from "./gomoji/layout";
import { JAPANESE_TILE_MIX, KUMIMOJI_BAG, KUMIMOJI_GRID_MOST, KUMIMOJI_HANDS, KUMIMOJI_WILDS, kumimojiTileCount } from "./kumimoji/tiles.constants";
import { KOUSHI_ANSWER_MOST } from "./koushi/lattice";
import { FREECELL_MOVES_MOST } from "./freecell/check";
import { SOLITAIRE_MOVES_MOST } from "./solitaire/check";
import { CUBE_MOVES_MOST } from "./cube/check";
import { SCRAMBLE_LENGTHS } from "./cube/generate";
import { SPIDER_MOVES_MOST } from "./spider/check";
import { layoutFor } from "@johnmorrisdotca/jarajara";
import { SUIDO_CODE_MOST, SUIDO_LEVEL_SIZES } from "./suido/sizes";
import { thousands } from "../ui/thousands";
import { MEIKYUU_COLOSSAL_LEVELS_A_SIZE, MEIKYUU_COLOSSAL_LEVELS_TOTAL, MEIKYUU_LEVELS_A_SIZE, MEIKYUU_SOLID_LEVELS_A_SIZE, MEIKYUU_SOLID_LEVELS_TOTAL, MEIKYUU_SQUARE_LEVELS_TOTAL, MEIKYUU_TALL_LEVELS_TOTAL } from "./meikyuu/levelCounts";
import { MEIKYUU_EVERY_SIZE, MEIKYUU_SIZES, MEIKYUU_TALL_SHAPES, meikyuuSizeLabel } from "./meikyuu/sizes";
import { TOBIISHI_LEVELS_A_SIZE } from "./tobiishi/levelCounts";
import { TOBIISHI_SIZES, tobiishiSizeLabel } from "./tobiishi/sizes";
import { JIRAI_DISPLAY, JIRAI_LEVEL_BLURBS, JIRAI_SIZE_NAMES, JIRAI_SPEC } from "./jirai/jirai.constants";
import { PENCIL_DISPLAY, PENCIL_KIND_LIST, PENCIL_SIZE_NAMES, PENCIL_SPECS } from "./pencil/pencil.constants";
import type { OrdinaryLevel, PuzzleClock, PuzzleKind, PuzzleLevel, PuzzleSpec } from "./puzzles.types";

/**
 * The puzzles: what each is, how big it comes, and what a reader is told.
 *
 * The copy is in the same shape as a game's (`VariantCopy`) so the rules
 * page, the catalogue's cards and the family page draw a puzzle with the
 * template they already have — one template, read once, is the reason the
 * shape was kept rather than a puzzle getting a page of its own.
 *
 * NAMES A PLAYER ALREADY KNOWS. John, 2026-09-24, of "Number Place", "More or
 * Less" and the rest: "those names need work… wth is number place? sudoku?",
 * and then "do best guesses for names. I can change later." So a puzzle goes
 * by the English name people search for — Sudoku, Killer Sudoku, Futoshiki,
 * Skyscrapers — where that name is in common use. The kanji stays ours:
 * 数独 is Nikoli's trademark in Japan, so the Japanese name is ナンプレ, the
 * word Japanese publishers use. A puzzle whose name belongs to somebody
 * (Queens is LinkedIn's; Takuzu and Binairo are trademarks in the EU) keeps a
 * name of our own. Each still says what it is our version of (`inspiredBy`),
 * because the puzzle is made here by our own code. See `RULES_ATTRIBUTION`.
 * The addresses did not follow the rename (`PUZZLE_SLUGS`): links already
 * sent, a race's included, keep working.
 */
export const PUZZLE_KINDS = {
  numberPlace: "numberPlace",
  hiddenStones: "hiddenStones",
  moreOrLess: "moreOrLess",
  jigsaw: "jigsaw",
  diagonal: "diagonal",
  sumCages: "sumCages",
  towers: "towers",
  blackAndWhite: "blackAndWhite",
  gomoji: "gomoji",
  gomojiKana: "gomojiKana",
  gomojiMot: "gomojiMot",
  gomojiWort: "gomojiWort",
  gomojiPop: "gomojiPop",
  tsunagi: "tsunagi",
  kumimoji: "kumimoji",
  koushi: "koushi",
  bridges: "bridges",
  pictureLogic: "pictureLogic",
  solitaire: "solitaire",
  freecell: "freecell",
  spider: "spider",
  mahjong: "mahjong",
  cube: "cube",
  suido: "suido",
  meikyuu: "meikyuu",
  tobiishi: "tobiishi",
  shikaku: "shikaku",
  akari: "akari",
  loop: "loop",
  hitori: "hitori",
  crossSums: "crossSums",
  regions: "regions",
  jirai: "jirai",
} as const satisfies Record<PuzzleKind, PuzzleKind>;

/** How many tiles a Mahjong layout holds, read from the layout rather than typed into its copy. */
function mahjongTiles(size: number): number {
  return layoutFor(size)?.slots.length ?? 0;
}

/** How many levels Meikyuu has in all, read from its sizes rather than typed into its copy: the four sizes, the tall ones, the colossal ones and the solids'. */
const MEIKYUU_LEVELS_TOTAL = MEIKYUU_SQUARE_LEVELS_TOTAL + MEIKYUU_TALL_LEVELS_TOTAL + MEIKYUU_COLOSSAL_LEVELS_TOTAL + MEIKYUU_SOLID_LEVELS_TOTAL;
/** The tall sizes as a person reads them, "6×9, 8×12 and so on to 20×30". */
const MEIKYUU_TALL_RANGE = `${MEIKYUU_TALL_SHAPES[0]![0]}×${MEIKYUU_TALL_SHAPES[0]![1]} to ${MEIKYUU_TALL_SHAPES.at(-1)![0]}×${MEIKYUU_TALL_SHAPES.at(-1)![1]}`;

/** How many levels Tobiishi has in all, read from its lengths rather than typed into its copy. */
const TOBIISHI_LEVELS_TOTAL = TOBIISHI_LEVELS_A_SIZE * TOBIISHI_SIZES.length;

/** Every puzzle, in the order the family shows them. Read by the coverage gate, the tour and the catalogue. */
export const PUZZLE_KIND_LIST: readonly PuzzleKind[] = [
  PUZZLE_KINDS.numberPlace,
  PUZZLE_KINDS.jigsaw,
  PUZZLE_KINDS.diagonal,
  PUZZLE_KINDS.sumCages,
  PUZZLE_KINDS.moreOrLess,
  PUZZLE_KINDS.towers,
  PUZZLE_KINDS.hiddenStones,
  PUZZLE_KINDS.blackAndWhite,
  PUZZLE_KINDS.gomoji,
  PUZZLE_KINDS.gomojiKana,
  PUZZLE_KINDS.gomojiMot,
  PUZZLE_KINDS.gomojiWort,
  PUZZLE_KINDS.gomojiPop,
  PUZZLE_KINDS.tsunagi,
  PUZZLE_KINDS.kumimoji,
  PUZZLE_KINDS.koushi,
  PUZZLE_KINDS.bridges,
  PUZZLE_KINDS.pictureLogic,
  PUZZLE_KINDS.solitaire,
  PUZZLE_KINDS.freecell,
  PUZZLE_KINDS.spider,
  PUZZLE_KINDS.mahjong,
  PUZZLE_KINDS.cube,
  PUZZLE_KINDS.suido,
  PUZZLE_KINDS.meikyuu,
  PUZZLE_KINDS.tobiishi,
  // The pencil puzzles (`pencil/`), in their family's order.
  ...PENCIL_KIND_LIST,
  PUZZLE_KINDS.jirai,
];

export const PUZZLE_LEVELS = { easy: "easy", medium: "medium", hard: "hard", "extra-hard": "extra-hard" } as const satisfies Record<PuzzleLevel, PuzzleLevel>;

/**
 * The three levels almost every puzzle offers, easiest first: what a spec that has levels lists, and what the
 * tests that make every level of every puzzle loop over. A puzzle's own levels are its spec's `levels`.
 */
export const PUZZLE_LEVEL_LIST: readonly OrdinaryLevel[] = ["easy", "medium", "hard"];

/** Every level a puzzle can be asked for at, the fourth first offered by the Pencil puzzles and Jirai (2026-10-05): what a request or an address may name. */
export const PUZZLE_LEVEL_EVERY: readonly PuzzleLevel[] = ["easy", "medium", "hard", "extra-hard"];


export const PUZZLE_LEVEL_DISPLAY: Record<PuzzleLevel, { label: string; kanji: string; blurb: string }> = {
  easy: { label: "Easy", kanji: "初級", blurb: "Every step can be found by looking; nothing has to be tried." },
  medium: { label: "Medium", kanji: "中級", blurb: "Looking gets you most of the way; somewhere you have to try one thing and see." },
  hard: { label: "Hard", kanji: "上級", blurb: "More than one place where you have to try something and see." },
  "extra-hard": { label: "Extra hard", kanji: "超級", blurb: "The most places where you have to try something and see." },
};

/**
 * HOW MANY TIMES CHECK MAY BE PRESSED: no limit, three, or one. John,
 * 2026-09-24: "We should have difficulty or game ending rules where, should
 * they choose this level, they only get 3 CHECKS, or 1 CHECK... or unlimited
 * CHECKS. That should be an option."
 *
 * Running out takes the help away and does NOT end the puzzle. Sudoku.com
 * ends a game at three mistakes, but there every wrong entry is marked the
 * moment it is made; here Check only says how many cells are wrong, never
 * which, so a solver who never presses it has made no mistake anybody saw,
 * and ending their puzzle for pressing it would punish the asking rather
 * than the error. `null` is no limit, which every solve kept before this
 * existed truly had.
 */
export const PUZZLE_CHECK_ALLOWANCES: readonly (number | null)[] = [null, 3, 1];

export function checkAllowanceWords(allowed: number | null): { label: string; kanji: string; blurb: string } {
  if (allowed === null) return { label: "No limit", kanji: "無制限", blurb: "Check and Show as often as you like: Check says how many cells are wrong, Show marks which." };
  if (allowed === 1) return { label: "One", kanji: "一回", blurb: "One Check or Show, so spend it well. Running out takes them away; the puzzle goes on." };
  if (allowed === 3) return { label: "Three", kanji: "三回", blurb: "Three Checks or Shows between them. Running out takes them away; the puzzle goes on." };
  return { label: String(allowed), kanji: `${allowed}回`, blurb: `${allowed} Checks or Shows between them. Running out takes them away; the puzzle goes on.` };
}

/** Whether a number is one of the allowances offered, so an address or a request can name no other. */
export function isCheckAllowance(value: unknown): value is number | null {
  return PUZZLE_CHECK_ALLOWANCES.includes(value as number | null);
}

/**
 * THE COUNTDOWNS, slowest first, as the set-up offers them. John, 2026-09-26,
 * reading about Speed Wordle: "we could have a TURTLE mode, RABBIT mode and
 * some other animal in between... fast one being like 1 minute counter.
 * turtle being 5 minutes". Called Tortoise here, as the fable has it. `ms` is
 * null for none: the clock counts up and nothing runs out.
 */
export const PUZZLE_CLOCKS = { none: "none", tortoise: "tortoise", fox: "fox", rabbit: "rabbit" } as const satisfies Record<PuzzleClock, PuzzleClock>;

export const PUZZLE_CLOCK_LIST: readonly PuzzleClock[] = ["none", "tortoise", "fox", "rabbit"];

/** `time` is the allowance as a clock shows it, written out so a page naming a clock prints no time taken. */
export const PUZZLE_CLOCK_DISPLAY: Record<PuzzleClock, { label: string; kanji: string; ms: number | null; time: string; blurb: string }> = {
  none: { label: "No clock", kanji: "無", ms: null, time: "", blurb: "The clock counts up and never runs out: take as long as it takes." },
  tortoise: { label: "Tortoise", kanji: "亀", ms: 5 * 60 * 1000, time: "5:00", blurb: "Five minutes, counting down. Out of time ends it unsolved, and it is kept as it stood." },
  fox: { label: "Fox", kanji: "狐", ms: 3 * 60 * 1000, time: "3:00", blurb: "Three minutes, counting down. Out of time ends it unsolved, and it is kept as it stood." },
  rabbit: { label: "Rabbit", kanji: "兎", ms: 60 * 1000, time: "1:00", blurb: "One minute, counting down. Out of time ends it unsolved, and it is kept as it stood." },
};

/** Whether a puzzle offers a countdown (`PuzzleSpec.clock`). */
export function offersClock(kind: PuzzleKind): boolean {
  return PUZZLE_SPECS[kind].clock !== false;
}

/**
 * Hidden Stones is made at eight sides and offered at four — Beginner, Standard,
 * Long and Longest — because the set-up screen keeps room for four boards and
 * no more (see `offered`). John, 2026-09-26: "is it possible to add a 12x12
 * game? and a beginner 4x4 game?" The two new ones took the ends, and 9×9
 * stayed between the everyday 7×7 and the 12×12 as the step up; 5×5, 6×6,
 * 8×8 and 10×10 stay in `sizes` for anything already made at them. A 4×4 is
 * made easy only (`levelsAt`): it has two possible answers, and looking
 * always tells them apart.
 */
/** The longest answer a word puzzle can hand in: every guess its most generous level gives, of its longest word. */
const WORD_ANSWER_MOST = MOST_GUESSES * LONGEST_WORD;

/**
 * A Kumimoji grid fits within 60×60. Each tile is one character and each gap
 * takes no more characters than the empty squares it represents; row separators
 * add fewer than 60 more.
 */
const TILE_GAME_MOST = KUMIMOJI_GRID_MOST * (KUMIMOJI_GRID_MOST + 1);

export const PUZZLE_SPECS: Record<PuzzleKind, PuzzleSpec> = {
  // 625: a 25×25's cells, one character each, 1–9 then A–P. Five sizes and room for four tiles, so they are a shelf (`shelves`): 4 to 16, then 6 to 25.
  // The 25×25 is zoomed and panned on a phone (`TsunagiViewport`), where a cell of the whole board fitted to 390 pixels is about fourteen wide.
  numberPlace: { sizes: [4, 6, 9, 16, 25], offered: [4, 6, 9, 16], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 625, shelves: true },
  hiddenStones: {
    sizes: [4, 5, 6, 7, 8, 9, 10, 12],
    offered: [4, 7, 9, 12],
    defaultSize: 7,
    levels: ["easy", "hard"],
    levelsAt: { 4: ["easy"] },
    defaultLevel: "easy",
    mostCells: 144,
    stones: true,
  },
  // 133: the 49 cells of a 7×7 and the 84 edges between them, which its code writes after the cells.
  moreOrLess: { sizes: [4, 5, 6, 7], offered: [4, 5, 6, 7], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 133 },
  // 162: a 9×9's 81 cells and then its 81 region letters, which its code writes after the cells.
  jigsaw: { sizes: [5, 6, 7, 9], offered: [5, 6, 7, 9], defaultSize: 7, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 162 },
  diagonal: { sizes: [6, 9], offered: [6, 9], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 81 },
  // 286: a 9×9's 81 cells, its 81 cage letters and two characters for each of up to 62 cages' sums.
  sumCages: { sizes: [6, 9], offered: [6, 9], defaultSize: 9, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 286 },
  // 77: a 7×7's 49 cells and then the 28 places around its edge where a clue can stand.
  towers: { sizes: [4, 5, 6, 7], offered: [4, 5, 6, 7], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 77 },
  // Even sides only: a line holds as many black stones as white.
  blackAndWhite: { sizes: [6, 8, 10, 12], offered: [6, 8, 10, 12], defaultSize: 8, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: 144, stones: true },
  /*
   * A size is the word's length, and an answer is every guess made, one
   * character a letter or a kana: the most guesses any level gives
   * (`MOST_GUESSES`) of the longest word. It was 30, six guesses of five, and
   * when medium grew a seventh row and easy the whole board (2026-09-25) every
   * solve past the sixth guess was refused as "Not a grid of that size" —
   * solved, and never kept or paid. `puzzleCodeLength.test.ts` holds it now.
   */
  gomoji: { sizes: [4, 5, 6], offered: [4, 5, 6], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: WORD_ANSWER_MOST, helps: false, strict: true, wordGrid: "gomoji" },
  /* The longest answer the same way, in kana; the givens are the word and its grey word. */
  gomojiKana: { sizes: [3, 4, 5], offered: [3, 4, 5], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "easy", mostCells: WORD_ANSWER_MOST, helps: false, strict: true, wordGrid: "gomojiKana" },
  // Gomoji in French, from the Lexique dictionary: the same shape as English's, accents folded away.
  gomojiMot: { sizes: [4, 5, 6], offered: [4, 5, 6], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: WORD_ANSWER_MOST, helps: false, strict: true, wordGrid: "gomoji" },
  // Gomoji in German: the same shape again, its alphabet carrying Ä, Ö and Ü as letters of their own.
  gomojiWort: { sizes: [4, 5, 6], offered: [4, 5, 6], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: WORD_ANSWER_MOST, helps: false, strict: true, wordGrid: "gomoji" },
  /*
   * Pop Gomoji: three to seven letters, the answers a person's pop-culture list
   * with each word's category shown as its clue (`popWords.ts`). Five lengths
   * and room for four tiles, so they are a shelf (`shelves`): 3 to 6, then 4
   * to 7, on its own set-up page.
   */
  gomojiPop: { sizes: [3, 4, 5, 6, 7], offered: [3, 4, 5, 6], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: WORD_ANSWER_MOST, helps: false, strict: true, wordGrid: "gomoji", shelves: true },
  /*
   * Twelve sizes of fixed levels, 4×4 to 15×15 (256 at most of them, 192 at 4×4,
   * 128 at 10×10 and from 12×12 up, 64 at 11×11), and room for four size tiles:
   * they show four at a time, 4 to 7, 8 to 11 or 12 to 15 (`useSizeShelves`). A
   * level's band (the first third easy, the last hard) is its level here. No
   * Check or Hint in the puzzle sense: Tsunagi's own Check only names the pairs
   * not joined yet, and the board already shows which.
   */
  // A layout is a cell a character and then its walls and `wrap` (`tsunagi/code.ts`): 81 cells and a wall list came to 109 characters
  // at 9×9, past the 81 the route once allowed, and every solve of those levels was refused. `levels.test.ts` holds every level to this.
  tsunagi: { sizes: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], offered: [4, 5, 6, 7], defaultSize: 4, levels: PUZZLE_LEVEL_LIST, defaultLevel: "easy", mostCells: 240, helps: false, onBoard: true, fixedLevels: true, shelves: true, clock: false },
  /*
  * A size is the hand a game opens with (`KUMIMOJI_HANDS`); length and
  * inventory settings decide how many tiles it uses. The hand of three is
  * the browser tests' own, made and checked like any other and never offered.
   */
  kumimoji: {
    sizes: [KUMIMOJI_HANDS.tiny, KUMIMOJI_HANDS.quick, KUMIMOJI_HANDS.classic],
    offered: [KUMIMOJI_HANDS.quick, KUMIMOJI_HANDS.classic],
    defaultSize: KUMIMOJI_HANDS.classic,
    levels: ["easy", "medium", "hard"],
    defaultLevel: "medium",
    mostCells: TILE_GAME_MOST,
    helps: false,
    tiles: true,
    clock: false,
  },
  // One lattice of 21 letters; an answer is the grid and every swap made, two characters each (`lattice.ts`).
  koushi: { sizes: [5], offered: [5], defaultSize: 5, levels: PUZZLE_LEVEL_LIST, defaultLevel: "medium", mostCells: KOUSHI_ANSWER_MOST, helps: false, lattice: true },
  /*
   * Islands and bridges on a square of water, a character a cell for the
   * givens and for the drawing (`bridges/code.ts`): 169 at 13×13, 625 at
   * 25×25. Every size and level is made in well under a second
   * (`bridges/generate.ts` has the measurements). Seven sizes and room for four
   * tiles, so they are a shelf (`shelves`): 7 to 13, then 13 to 25. 13×13 and
   * bigger are zoomed on a phone (`TsunagiViewport`), where a cell of the whole
   * board fitted to 390 pixels is about twenty-seven wide at 13×13 and fourteen
   * at 25×25.
   */
  bridges: {
    sizes: [7, 9, 11, 13, 17, 21, 25],
    offered: [7, 9, 11, 13],
    defaultSize: 9,
    levels: PUZZLE_LEVEL_LIST,
    defaultLevel: "medium",
    mostCells: 625,
    shelves: true,
  },
  /*
   * A picture to uncover from its row and column clues (`pictureLogic/`). The
   * givens are the two panels of clues, `2 × size × ⌈size/2⌉` characters (400
   * at 20×20, 2,500 at 50×50), and the answer and a kept run a character a
   * cell. Every size and level is made in well under a second
   * (`pictureLogic/generate.ts` has the measurements). Six sizes and room for
   * four tiles, so they are a shelf (`shelves`): 5 to 20, then 15 to 50. The
   * two biggest, 40×40 and 50×50, come at easy and medium only (`levelsAt`):
   * both are solved by reading lines, never a trial, which at that size would
   * be the slowest thing a browser did. 15×15 and bigger are zoomed on a
   * phone (`TsunagiViewport`), where a cell of the whole board fitted to 390
   * pixels is about fourteen wide at 15×15 and five at 50×50.
   */
  pictureLogic: {
    sizes: [5, 10, 15, 20, 40, 50],
    offered: [5, 10, 15, 20],
    defaultSize: 10,
    levels: PUZZLE_LEVEL_LIST,
    levelsAt: { 40: ["easy", "medium"], 50: ["easy", "medium"] },
    defaultLevel: "medium",
    mostCells: 2500,
    shelves: true,
  },
  /*
   * KLONDIKE, a deal of cards rather than a grid (`solitaire/`): its "size" is
   * how many cards the stock turns, one or three, and its level how many times
   * through the stock — easy as often as you like, medium three, hard one
   * (`SOLITAIRE_PASSES`). Turning three with one pass is left off: the solver
   * finds a win in about one deal in sixty, and a winnable deal would take the
   * browser seconds to find. The givens are the deal, fifty-two letters; the
   * answer is the moves (`solitaire/code.ts`), checked by replaying them.
   * No Check or Hint, since a card game answers every move as it is made, and
   * no countdown: the clock and the move count are its measure.
   */
  solitaire: {
    sizes: [1, 3],
    offered: [1, 3],
    defaultSize: 1,
    levels: PUZZLE_LEVEL_LIST,
    levelsAt: { 3: ["easy", "medium"] },
    defaultLevel: "easy",
    mostCells: SOLITAIRE_MOVES_MOST,
    helps: false,
    clock: false,
    cards: true,
  },
  /*
   * FREECELL, a deal of cards (`freecell/`): its "size" is how many free cells
   * the table has, four as the game is known or three or two for a harder one.
   * One level, since every card is face up from the start and the cells are
   * what make a deal hard. Every deal is one the solver has won with those
   * cells. The givens are the deal, fifty-two letters; the answer the moves,
   * checked by replaying them. No Check, Hint or countdown, as Solitaire.
   */
  freecell: {
    sizes: [2, 3, 4],
    offered: [2, 3, 4],
    defaultSize: 4,
    levels: ["medium"],
    defaultLevel: "medium",
    mostCells: FREECELL_MOVES_MOST,
    helps: false,
    clock: false,
    cards: true,
  },
  /*
   * SPIDER, two decks of cards (`spider/`): its "size" is how many suits the
   * decks are made of, one, two or four, which is what makes it hard; so it has
   * one level. Every deal is one the solver has won. The givens are the deal, a
   * hundred and four letters; the answer the moves, checked by replaying them.
   */
  spider: {
    sizes: [1, 2, 4],
    offered: [1, 2, 4],
    defaultSize: 1,
    levels: ["medium"],
    defaultLevel: "medium",
    mostCells: SPIDER_MOVES_MOST,
    helps: false,
    clock: false,
    cards: true,
  },
  /*
   * A size is a layout, named by its width in tiles (`mahjong/layouts.ts`):
   * Torii 8, Fuji 9, Castle 10 and the Turtle's 15. The square of eight, 4
   * across, is the browser tests' own, made and checked like any other and
   * never offered. An answer is its moves, four characters a pair and one a
   * shuffle: the Turtle's 72 pairs and a shuffle each at the very most is 360.
   */
  mahjong: {
    sizes: [4, 8, 9, 10, 15],
    offered: [8, 9, 10, 15],
    defaultSize: 9,
    levels: PUZZLE_LEVEL_LIST,
    defaultLevel: "medium",
    mostCells: 360,
    layouts: true,
    checks: false,
  },
  /*
   * THE CUBE, turned in three dimensions (`cube/`): its size is its side, 2×2
   * to 5×5, and its level how far it is scrambled (`SCRAMBLE_LENGTHS`). The
   * givens are the scrambled stickers, six faces of size × size; the answer
   * is the turns (`encodeCubeMoves`), checked by turning them. No Check or
   * Hint, since every sticker is in plain sight, and no countdown: the clock,
   * started by the first turn after a look at the scramble, is its measure.
   */
  cube: {
    sizes: [2, 3, 4, 5],
    offered: [2, 3, 4, 5],
    defaultSize: 3,
    levels: PUZZLE_LEVEL_LIST,
    defaultLevel: "easy",
    mostCells: CUBE_MOVES_MOST,
    helps: false,
    clock: false,
    cube: true,
  },
  /*
   * SUIDO, the pipe puzzle (`suido/`, the package `@johnmorrisdotca/suido`):
   * a grid of pieces that can only be turned. It is played two ways: its
   * FIXED LEVELS, 256 at each of thirteen sizes and sixty-four at each of the three
   * huge ones (20×20, 28×28 and 20×50), the same board for everybody
   * (`suido/levels.ts`, and a level's seed names it: `suido/seed.ts`), and a
   * board made from a seed, "Make a board", at any of the sixteen sizes, four
   * tiles at a time (`shelves`). A size is a square's side, or for the four
   * long boards its width and then its height in two digits each (507 is 5×7,
   * 2050 is 20×50, `suido/sizes.ts`), so `sizes` is every size there is and
   * `offered` the four the first shelf of a screen without shelves would show.
   * The givens are the board as it is dealt and the answer the same board
   * solved, both in the package's own code, "5x5d:" and a character a cell
   * (356 at 14×14 with its locked pieces and walls, which `levels.test.ts`
   * holds every level to; 400 is room). No Check: the water is drawn as the
   * pieces face, so every leak is in plain sight, and there is nothing a
   * Check could tell that the board does not. Hint is offered on a board made,
   * and on no level, where a time is one anybody can be raced on.
   */
  suido: {
    sizes: SUIDO_LEVEL_SIZES,
    offered: [5, 7, 9, 12],
    defaultSize: 7,
    levels: PUZZLE_LEVEL_LIST,
    defaultLevel: "medium",
    mostCells: SUIDO_CODE_MOST,
    checks: false,
    shelves: true,
  },
  /*
   * MEIKYUU, the maze (`meikyuu/`, the package `@johnmorrisdotca/meikyuu`):
   * 1,024 fixed levels (256 to a size), the same for everybody, in four sizes that are the
   * package's own words for how many cells a maze has (small, medium, large,
   * huge: `meikyuu/sizes.ts`), numbered 1 to 4 here, and 1,536 TALL levels in six
   * sizes of 256 for a phone held upright, kept as their width and height in two
   * digits each (609 is 6×9), as Suido's long boards are. A maze has no side, so the
   * number is only the size's place; the level's number in its size is the
   * seed, as Tsunagi's is (`fixedLevels`). The givens are the level's recipe,
   * a short word such as `square:12x9:wilson:to-goal:48213` (45 characters at
   * the longest); the answer is the line drawn from the start to the goal, one
   * character a step (`meikyuu/way.ts`), 5,009 at the longest (a colossal maze), so
   * 6,000 is room for it and for a kept run's stones after it (`meikyuu/progress.ts`). No Check or Hint (the line is in plain sight, and a level's time is
   * one anybody can be raced on) and no countdown, as a Suido level has none.
   */
  meikyuu: {
    // The four sizes, the six tall ones, the colossal ones and the solids' twelve (`meikyuu/sizes.ts`: 609 is 6×9, 7002 the medium cube). The set-up offers the four as tiles and turns to the others on a choice of shape of its own (`MeikyuuSetUp`).
    sizes: MEIKYUU_EVERY_SIZE,
    offered: MEIKYUU_SIZES,
    defaultSize: 1,
    levels: PUZZLE_LEVEL_LIST,
    defaultLevel: "easy",
    mostCells: 6000,
    helps: false,
    fixedLevels: true,
    clock: false,
  },
  /*
   * TOBIISHI 飛び石, peg solitaire (`tobiishi/`, the package `@johnmorrisdotca/tobiishi`):
   * 81 named challenges, the same for everybody: nine boards (the English cross, a
   * triangle, the European board, a diamond, a heart, a star, a hexagon and a wide and a
   * tall rectangle), three goal holes on each, at three lengths. A size is the length of
   * the shortest way in jumps, 3, 6 or 9, so the big number on a tile is the number of
   * jumps and a size has exactly one band (`levelsAt`); the level's number in its size
   * (1 to 27: a board's three goals in turn, the boards in the package's order) is the
   * seed, as Meikyuu's is. The givens are the level's code, `english:centre:3` (25
   * characters at the longest); the position is made again from it by the package. The
   * answer is the run of jumps, four characters a jump (`tobiishi/way.ts`), 36 at the
   * longest, so 40 is room. Any legal run that leaves one peg in the goal solves it, not
   * only the package's own. No Check or Hint (the board is in plain sight, and a level's
   * time is one anybody can be raced on) and no countdown.
   */
  tobiishi: {
    sizes: TOBIISHI_SIZES,
    offered: TOBIISHI_SIZES,
    defaultSize: 3,
    levels: PUZZLE_LEVEL_LIST,
    levelsAt: { 3: ["easy"], 6: ["medium"], 9: ["hard"] },
    defaultLevel: "easy",
    mostCells: 40,
    helps: false,
    fixedLevels: true,
    clock: false,
  },
  ...PENCIL_SPECS,
  jirai: JIRAI_SPEC,
};

/** Whether a puzzle is drawn on the board itself in the player's board colour, rather than on white paper. */
/**
 * EVERY BOARD A PUZZLE'S SET-UP OFFERS: its tiles, or, for a puzzle whose
 * tiles are a shelf, every size the shelves turn to. John, 2026-09-26: Tsunagi's
 * front door said "4×4, 5×5, 6×6, 7×7" while its set-up offered 8×8 and 9×9
 * behind "Bigger boards". The front door, the rules page and the set-up read
 * this one list, and `sizesOffered.test.ts` holds them to it.
 */
export function sizesOffered(kind: PuzzleKind): readonly number[] {
  const spec = PUZZLE_SPECS[kind];
  return spec.shelves === true ? spec.sizes : spec.offered;
}

export function drawnOnBoard(kind: PuzzleKind): boolean {
  const spec = PUZZLE_SPECS[kind];
  return spec.wordGrid !== undefined || spec.onBoard === true || spec.lattice === true;
}

/**
 * THE LONGEST CODE ANY PUZZLE HAS — a 9×9 Jigsaw's cells and regions, 162
 * characters — which is what a route may accept before it asks the kind's own
 * `mostCells`. The solved route used to cap a code at 100, and every 9×9
 * Jigsaw and 7×7 More or Less handed in was refused as a bad request, kept
 * nowhere and paid nothing. Read from the specs, so a longer kind raises it.
 */
export const PUZZLE_CODE_LONGEST = Math.max(...Object.values(PUZZLE_SPECS).map((spec) => spec.mostCells));

/**
 * Whether a request may name this level for this kind: extra hard only where the kind offers it, since a puzzle made
 * at a level it has no table for would be priced and kept as a level it never had. The three ordinary ones are not
 * refused here, as they never were: a kept solve has always named whichever of them its browser played.
 */
export function levelAskable(kind: PuzzleKind, level: PuzzleLevel): boolean {
  return level !== "extra-hard" || PUZZLE_SPECS[kind].levels.includes("extra-hard");
}

/**
 * THE LONGEST CODE OF A PUZZLE THAT KEEPS A STEP LOG (`stepLog.ts`): every kind but Meikyuu. A maze's line is kept whole
 * and carries no log (it has no scrubber), and its codes are the longest there are (a colossal maze's way is 5,009 steps),
 * so the step log's ceiling is read from the others and does not grow with the maze.
 */
export const PUZZLE_LOGGED_CODE_LONGEST = Math.max(...Object.entries(PUZZLE_SPECS).filter(([kind]) => kind !== "meikyuu").map(([, spec]) => spec.mostCells));

/** The levels a puzzle can be made at, at this size: the kind's levels, less any this size cannot have (`levelsAt`). */
export function levelsFor(kind: PuzzleKind, size: number): readonly PuzzleLevel[] {
  const spec = PUZZLE_SPECS[kind];
  return spec.levelsAt?.[size] ?? spec.levels;
}


/**
 * WHAT EACH SIZE IS FOR, under its picture on the size tiles — the board
 * games' tiles, drawn by `BoardPicker`, whose own names ("Mini" for 9×9) are
 * a board game's and would call the classic Sudoku grid the small one. The big
 * number in the picture already says the size, so the name says what the size
 * is for: the quick one, the usual one, the long one.
 */
export const PUZZLE_SIZE_NAMES: Record<PuzzleKind, Record<number, { label: string; kanji: string }>> = {
  numberPlace: {
    4: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    9: { label: "Classic", kanji: "定番" },
    16: { label: "Giant", kanji: "特大" },
    25: { label: "Colossus", kanji: "巨大" },
  },
  hiddenStones: {
    4: { label: "Beginner", kanji: "入門" },
    5: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    7: { label: "Standard", kanji: "定番" },
    8: { label: "Longer", kanji: "長め" },
    9: { label: "Long", kanji: "長" },
    10: { label: "Evening", kanji: "夜長" },
    12: { label: "Longest", kanji: "最長" },
  },
  moreOrLess: {
    4: { label: "Quick", kanji: "速" },
    5: { label: "Standard", kanji: "定番" },
    6: { label: "Longer", kanji: "長め" },
    7: { label: "Long", kanji: "長" },
  },
  jigsaw: {
    5: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    7: { label: "Standard", kanji: "定番" },
    9: { label: "Classic", kanji: "本格" },
  },
  diagonal: {
    6: { label: "Short", kanji: "短" },
    9: { label: "Classic", kanji: "定番" },
  },
  sumCages: {
    6: { label: "Short", kanji: "短" },
    9: { label: "Classic", kanji: "定番" },
  },
  towers: {
    4: { label: "Quick", kanji: "速" },
    5: { label: "Standard", kanji: "定番" },
    6: { label: "Longer", kanji: "長め" },
    7: { label: "Long", kanji: "長" },
  },
  blackAndWhite: {
    6: { label: "Quick", kanji: "速" },
    8: { label: "Standard", kanji: "定番" },
    10: { label: "Long", kanji: "長" },
    12: { label: "Longest", kanji: "最長" },
  },
  gomoji: {
    4: { label: "Four letters", kanji: "四文字" },
    5: { label: "Five letters", kanji: "五文字" },
    6: { label: "Six letters", kanji: "六文字" },
  },
  gomojiKana: {
    3: { label: "Three kana", kanji: "三文字" },
    4: { label: "Four kana", kanji: "四文字" },
    5: { label: "Five kana", kanji: "五文字" },
  },
  gomojiMot: {
    4: { label: "Four letters", kanji: "四文字" },
    5: { label: "Five letters", kanji: "五文字" },
    6: { label: "Six letters", kanji: "六文字" },
  },
  gomojiWort: {
    4: { label: "Four letters", kanji: "四文字" },
    5: { label: "Five letters", kanji: "五文字" },
    6: { label: "Six letters", kanji: "六文字" },
  },
  gomojiPop: {
    3: { label: "Three letters", kanji: "三文字" },
    4: { label: "Four letters", kanji: "四文字" },
    5: { label: "Five letters", kanji: "五文字" },
    6: { label: "Six letters", kanji: "六文字" },
    7: { label: "Seven letters", kanji: "七文字" },
  },
  tsunagi: {
    4: { label: "First", kanji: "初" },
    5: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    7: { label: "Standard", kanji: "定番" },
    8: { label: "Long", kanji: "長" },
    9: { label: "Longer", kanji: "長大" },
    10: { label: "Big", kanji: "大" },
    11: { label: "Bigger", kanji: "特大" },
    12: { label: "Huge", kanji: "巨大" },
    13: { label: "Giant", kanji: "巨" },
    14: { label: "Vast", kanji: "広大" },
    15: { label: "Biggest", kanji: "超大" },
  },
  kumimoji: {
    [KUMIMOJI_HANDS.tiny]: { label: "Tiny", kanji: "極小" },
    [KUMIMOJI_HANDS.quick]: { label: "Quick", kanji: "速" },
    [KUMIMOJI_HANDS.classic]: { label: "Classic", kanji: "定番" },
  },
  koushi: {
    5: { label: "Six words", kanji: "六語" },
  },
  bridges: {
    7: { label: "Quick", kanji: "速" },
    9: { label: "Standard", kanji: "定番" },
    11: { label: "Long", kanji: "長" },
    13: { label: "Longer", kanji: "長大" },
    17: { label: "Huge", kanji: "巨大" },
    21: { label: "Giant", kanji: "巨" },
    25: { label: "Biggest", kanji: "超大" },
  },
  pictureLogic: {
    5: { label: "Quick", kanji: "速" },
    10: { label: "Standard", kanji: "定番" },
    15: { label: "Long", kanji: "長" },
    20: { label: "Longer", kanji: "長大" },
    40: { label: "Huge", kanji: "巨大" },
    50: { label: "Giant", kanji: "巨" },
  },
  // How many cards the stock turns at a time: the big number on the tile is the count.
  solitaire: {
    1: { label: "Draw 1", kanji: "一枚" },
    3: { label: "Draw 3", kanji: "三枚" },
  },
  // How many free cells the table has: the big number on the tile is the count. 枠, a place to put something.
  freecell: {
    2: { label: "2 cells", kanji: "二枠" },
    3: { label: "3 cells", kanji: "三枠" },
    4: { label: "4 cells", kanji: "四枠" },
  },
  // How many suits the two decks are made of: the big number on the tile is the count.
  spider: {
    1: { label: "1 suit", kanji: "一種" },
    2: { label: "2 suits", kanji: "二種" },
    4: { label: "4 suits", kanji: "四種" },
  },
  // A Mahjong layout by its own name, the width in tiles being the big number in its picture.
  mahjong: {
    4: { label: "Tiny", kanji: "極小" },
    8: { label: "Torii", kanji: "鳥居" },
    9: { label: "Fuji", kanji: "富士" },
    10: { label: "Castle", kanji: "城" },
    15: { label: "Turtle", kanji: "亀" },
  },
  // A Suido board by its side, the big number on the tile: how long the pipes take to follow. The three long boards are 507, 610 and 814 (`suido/sizes.ts`), drawn at their own shape.
  suido: {
    5: { label: "Quick", kanji: "速" },
    6: { label: "Short", kanji: "短" },
    7: { label: "Standard", kanji: "定番" },
    8: { label: "Long", kanji: "長" },
    9: { label: "Longer", kanji: "長大" },
    10: { label: "Big", kanji: "大" },
    11: { label: "Bigger", kanji: "特大" },
    12: { label: "Huge", kanji: "巨大" },
    13: { label: "Giant", kanji: "巨" },
    14: { label: "Biggest", kanji: "超大" },
    507: { label: "Short pipe", kanji: "短管" },
    610: { label: "Pipe", kanji: "管" },
    814: { label: "Long pipe", kanji: "長管" },
    20: { label: "Vast", kanji: "広大" },
    28: { label: "Vaster", kanji: "極大" },
    2050: { label: "Longest pipe", kanji: "極長管" },
  },
  // A maze by how many cells it has, the size's place (1 to 4) being the big number on the tile (`meikyuu/sizes.ts`): the names are the package's own words for it.
  meikyuu: {
    1: { label: "Small", kanji: "小" },
    2: { label: "Medium", kanji: "中" },
    3: { label: "Large", kanji: "大" },
    4: { label: "Huge", kanji: "巨大" },
    // The two colossal mazes (`meikyuu/sizes.ts`): the square one is size 5, the big number on its tile, and the tall one is 64×96, which its picture says.
    5: { label: "Colossal", kanji: "超巨大" },
    6496: { label: "Colossal tall", kanji: "超巨大縦" },
    // The tall mazes, by width and height (`meikyuu/sizes.ts`): the tile's picture says "6×9", so its name is a word for how much maze there is.
    609: { label: "Tiny", kanji: "極小" },
    812: { label: "Little", kanji: "小型" },
    1015: { label: "Middle", kanji: "中型" },
    1218: { label: "Big", kanji: "大型" },
    1624: { label: "Bigger", kanji: "特大" },
    2030: { label: "Biggest", kanji: "超大" },
    // The solids (`meikyuu/sizes.ts`): a tile is a solid, and its three steps (small, medium, large) are chosen under the tiles, so a solid has the one name at every step.
    7001: { label: "Cube", kanji: "立方体" },
    7002: { label: "Cube", kanji: "立方体" },
    7003: { label: "Cube", kanji: "立方体" },
    7011: { label: "Sphere", kanji: "球" },
    7012: { label: "Sphere", kanji: "球" },
    7013: { label: "Sphere", kanji: "球" },
    7021: { label: "Octahedron", kanji: "八面体" },
    7022: { label: "Octahedron", kanji: "八面体" },
    7023: { label: "Octahedron", kanji: "八面体" },
    7031: { label: "Icosahedron", kanji: "二十面体" },
    7032: { label: "Icosahedron", kanji: "二十面体" },
    7033: { label: "Icosahedron", kanji: "二十面体" },
  },
  // A Tobiishi level by the length of its shortest way, the number of jumps being the big number on the tile (`tobiishi/sizes.ts`).
  tobiishi: {
    3: { label: "Short", kanji: "短" },
    6: { label: "Medium", kanji: "中" },
    9: { label: "Long", kanji: "長" },
  },
  // A cube by its side, the big number on the tile; the names are ours, never a maker's.
  cube: {
    2: { label: "Mini", kanji: "小" },
    3: { label: "Standard", kanji: "定番" },
    4: { label: "Big", kanji: "大" },
    5: { label: "Bigger", kanji: "特大" },
  },
  ...PENCIL_SIZE_NAMES,
  jirai: JIRAI_SIZE_NAMES,
};

/**
 * WHAT A LEVEL MEANS, where it means something else than how much has to be
 * tried: a Gomoji's level is how many guesses it gives (`layout.ts`) and how
 * common its word is. Every other puzzle reads `PUZZLE_LEVEL_DISPLAY`.
 */
const WORD_LEVEL_BLURBS: Record<PuzzleLevel, string> = {
  easy: "One of the commonest words, and eight guesses to find it in.",
  medium: "A wider list of words, and seven guesses.",
  hard: "A wider list of words, and six guesses, the classic count.",
  "extra-hard": "A wider list of words, and six guesses, the classic count.",
};
/** Kana: the free grey word is one of the level's rows (`layout.ts`), so easy and medium are a guess shorter than their rows. */
const KANA_LEVEL_BLURBS: Record<PuzzleLevel, string> = {
  easy: "One of the commonest words, a free grey word and seven guesses: eight rows.",
  medium: "A wider list of words, a free grey word and six guesses: seven rows.",
  hard: "A wider list of words, six guesses and no free word.",
  "extra-hard": "A wider list of words, six guesses and no free word.",
};
export const PUZZLE_LEVEL_BLURBS: Partial<Record<PuzzleKind, Partial<Record<PuzzleLevel, string>>>> = {
  gomoji: WORD_LEVEL_BLURBS,
  // French and German are Gomoji in another language (`gameSettings.ts`): their levels mean what English's do, never a number puzzle's "looking" and "trying".
  gomojiMot: WORD_LEVEL_BLURBS,
  gomojiWort: WORD_LEVEL_BLURBS,
  gomojiKana: KANA_LEVEL_BLURBS,
  gomojiPop: {
    easy: "A word from the pop list with its category shown, and eight guesses to find it in.",
    medium: "The same list and clue, and seven guesses.",
    hard: "The same list and clue, and six guesses, the classic count.",
  },
  tsunagi: {
    easy: "The first third of a size's levels: every line can be found by looking.",
    medium: "The middle third: longer lines, and somewhere one has to be tried.",
    hard: "The last third: winding lines, and more than one place to try something and see.",
  },
  // A Kumimoji's level is how many of its tiles are wild (`KUMIMOJI_WILDS`), counted here for a Short Classic game.
  kumimoji: {
    easy: `The most wild tiles: ${KUMIMOJI_WILDS[KUMIMOJI_HANDS.classic]!.easy} in a Short game from the Classic hand.`,
    medium: `Half as many wild tiles: ${KUMIMOJI_WILDS[KUMIMOJI_HANDS.classic]!.medium} in a Short game from the Classic hand.`,
    hard: "No wild tiles: every tile is the letter or kana printed on it.",
  },
  // A Bridges level is what it takes to finish (`bridges/solve.ts`, `levelOf`): counting, joining, or a trial.
  // A cube's level is how far it is scrambled (`SCRAMBLE_LENGTHS`), counted here for the 3×3.
  cube: {
    easy: `A few turns from solved: ${SCRAMBLE_LENGTHS.easy[3]} on the 3×3, enough to take back by looking.`,
    medium: `${SCRAMBLE_LENGTHS.medium[3]} turns on the 3×3: too many to take back by looking, so it has to be solved.`,
    hard: `A full scramble, as long as a competition's: ${SCRAMBLE_LENGTHS.hard[3]} turns on the 3×3.`,
  },
  // A Meikyuu level's band is the third of its size's list it sits in: the package orders every list so that no level is easier than the one before.
  meikyuu: {
    easy: "The first third of a size's levels: short ways through, but every one has wrong turns to avoid, and they end quickly.",
    medium: "The middle third: longer ways, and branches that lead a long way before they stop.",
    hard: "The last third: the longest ways and the most forks, and in the biggest mazes much more to look at.",
  },
  // A Tobiishi level's band is its length: the jumps in its shortest way (`tobiishi/sizes.ts`), which is what the package's three difficulties are.
  tobiishi: {
    easy: "Three jumps to the goal: four pegs, and one way in the right order, among a few wrong ones.",
    medium: "Six jumps to the goal: seven pegs, with more ways to get stuck before the last one.",
    hard: "Nine jumps to the goal: ten pegs, and the right order has to be found before you start taking pegs.",
  },
  // A Suido level is a target for the package's own rank among boards of the same size (`SUIDO_DIFFICULTY`).
  suido: {
    easy: "Among the plainer boards of its size: most pieces can be settled by looking at what is beside them.",
    medium: "A middling board of its size: some places can only be settled by working out what the pieces around them need.",
    hard: "Among the harder boards of its size: much stays open until you work it through, and somewhere you may have to try a turn and see.",
  },
  // A Solitaire level is how many times through the stock (`SOLITAIRE_PASSES`).
  solitaire: {
    easy: "Through the stock as many times as you like.",
    medium: "Three times through the stock, and no more.",
    hard: "Once through the stock: every card turned is seen once.",
  },
  // FreeCell's and Spider's one level: what makes a deal hard is the size tile, the cells or the suits.
  freecell: {
    medium: "Every card is face up from the start: fewer free cells make the deal harder.",
  },
  spider: {
    medium: "More suits make the game harder: a run moves as a whole only while it is all one suit.",
  },
  bridges: {
    easy: "Counting alone: every island against what the islands in line with it can still give.",
    medium: "Counting, and the joining rule: no group of islands may close itself off from the rest.",
    hard: "Somewhere counting and joining both run out, and a bridge has to be tried and seen.",
  },
  // A Picture logic level is what it takes to finish (`pictureLogic/solve.ts`, `solveClues`): the ends, the whole line, or a trial.
  pictureLogic: {
    easy: "The ends alone: slide each line's runs to one side and the other, and shade where they overlap.",
    medium: "Somewhere the ends run out, and a whole line has to be read against what its crossing lines have settled.",
    hard: "Somewhere even whole lines run out, and a square has to be tried and followed until a clue breaks.",
  },
  // A Mahjong level is how forgiving its deal is, ranked among five (`mahjong/generate.ts`).
  mahjong: {
    easy: "The most forgiving of five deals: a pair taken carelessly seldom leaves you stuck.",
    medium: "A middling deal: now and then a pair taken too soon closes off another.",
    hard: "The least forgiving of five deals: take the wrong pair early and you will need Undo or Shuffle.",
  },
  koushi: {
    easy: "Solvable in 8 swaps, with 13 to do it in, and the commonest words.",
    medium: "Solvable in 10 swaps, with 15 to do it in, and the commonest words.",
    hard: "Solvable in 12 swaps, with 17 to do it in, and a wider list of words.",
  },
  jirai: JIRAI_LEVEL_BLURBS,
};

/**
 * WHAT A CARD GAME'S SIZE IS (`PuzzleSpec.cards`): the cards Solitaire's stock
 * turns, FreeCell's free cells, or the suits Spider's decks are made of. The
 * heading over the size tiles, the word for one size, and the rules page's
 * heading for the list of them.
 */
export const CARD_SIZE_WORDS: Partial<Record<PuzzleKind, { legend: string; heading: string; word: (size: number) => string }>> = {
  // A peg puzzle's size is how long its shortest way is, Short, Medium or Long, the jumps in it being the big number on the tile (`tobiishi/sizes.ts`).
  tobiishi: { legend: "Length", heading: "Lengths", word: (size) => tobiishiSizeLabel(size) },
  // A maze's size is how many cells it has, in the package's four words (`meikyuu/sizes.ts`).
  meikyuu: { legend: "Size", heading: "Sizes", word: (size) => meikyuuSizeLabel(size) },
  solitaire: { legend: "Draw", heading: "Draws", word: (size) => `draw ${size}` },
  freecell: { legend: "Free cells", heading: "Free cells", word: (size) => `${size} ${size === 1 ? "cell" : "cells"}` },
  spider: { legend: "Suits", heading: "Suits", word: (size) => `${size} ${size === 1 ? "suit" : "suits"}` },
};

/** The line under the level chips on the set-up screen, for this puzzle. */
export function levelBlurb(kind: PuzzleKind, level: PuzzleLevel): string {
  return PUZZLE_LEVEL_BLURBS[kind]?.[level] ?? PUZZLE_LEVEL_DISPLAY[level].blurb;
}

/** A lettered Gomoji's Head start, in its rules (`headStart.ts`); the kana one says it in kana. */
const HEAD_START_RULE =
  "Head start, a choice at easy, greys as many keys as the word has letters before the first guess, none of them in the word: a free guess that takes no row, at a cost of 50 points.";

export const PUZZLE_DISPLAY: Record<PuzzleKind, VariantCopy> = {
  numberPlace: {
    label: "Sudoku",
    kanji: "ナンプレ",
    tagline: "Fill the grid so every row, column and box holds each number once. One person, one answer.",
    inspiredBy: "Sudoku",
    origin:
      "Howard Garns's Number Place, printed by Dell in 1979; Nikoli took it to Japan in 1984 and named it Sudoku, and from there it went round the world.",
    alsoKnownAs: ["Number Place", "Nanpure"],
    country: "US",
    wikipedia: "Sudoku",
    rules: [
      "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each box holds every number exactly once.",
      "The numbers already printed are the givens. They stay where they are, and every puzzle here has exactly one answer that fits them.",
      "The 16×16 Giant has sixteen symbols: 1 to 9, then A to G for 10 to 16. The 25×25 Colossus has twenty-five: A to P for 10 to 25. Type the letter, or press its key.",
      "There is no guessing at the easy level: every cell can be found by reasoning from what is already there. Medium and hard ask you to try something and see.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board:
      "9×9 with 3×3 boxes is the puzzle everybody knows. 4×4 with 2×2 boxes is over in a minute and is the one to give a child; 6×6 with boxes two rows tall and three wide sits between. 16×16, the Giant, has boxes four by four and the letters A to G after 9; it is best on a tablet or a computer, where its cells are big enough to tap. 25×25, the Colossus, has boxes five by five and runs on to the letter P; on a phone you zoom in and move about it, and an easy one is still found by looking alone.",
  },
  hiddenStones: {
    label: "Hidden Stones",
    kanji: "隠し石",
    tagline: "One black stone hides in every row, every column and every region, and no two touch.",
    inspiredBy: "Star Battle (one star)",
    origin: "The one-star form of Hans Eendebak's Star Battle (2003), which a daily version made a habit in 2024.",
    alsoKnownAs: ["Queens"],
    country: "NL",
    rules: [
      "Place a black stone in every row, every column and every region, one each.",
      "No two stones may touch, not even at a corner.",
      "Every puzzle has exactly one answer. Tap a cell once for a stone, again for a cross to mark a cell you have ruled out, and again to clear it; the puzzle is done when every row's stone is right.",
      "Easy puzzles yield to looking alone; hard ones ask you to try a stone somewhere and see.",
    ],
    board: "7×7 is the everyday size. 4×4 is a first puzzle, easy only; 12×12 is an evening.",
  },
  moreOrLess: {
    label: "Futoshiki",
    kanji: "不等式",
    tagline: "Fill the square so every row and column holds each number once, and every more-than mark is true.",
    inspiredBy: "Futoshiki",
    origin: "Our version of Futoshiki 不等式, Tamaki Seimiya's puzzle of 2001, which Nikoli published.",
    alsoKnownAs: ["Unequal", "Greater Than Sudoku"],
    country: "JP",
    wikipedia: "Futoshiki",
    rules: [
      "Fill every cell with a number from 1 up to the side of the square, so that each row and each column holds every number exactly once.",
      "A mark between two cells says which is the bigger: the open end faces the larger number, the point the smaller.",
      "Every puzzle has exactly one answer, and every mark and given is needed to reach it.",
    ],
    board: "5×5 is the usual size. 4×4 is quick; 7×7 is the long one.",
  },
  jigsaw: {
    label: "Jigsaw Sudoku",
    kanji: "変形ナンプレ",
    tagline: "Sudoku with the boxes cut into irregular regions: every row, column and region holds each number once.",
    inspiredBy: "Jigsaw Sudoku",
    origin:
      "Sudoku with its boxes traded for irregular shapes, printed under names such as Nonomino and Jigsaw Sudoku. Without boxes it is not tied to sides that divide evenly, so it comes at five and seven as well.",
    alsoKnownAs: ["Nonomino", "Irregular Sudoku"],
    wikipedia: "Sudoku",
    rules: [
      "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each outlined region holds every number exactly once.",
      "The regions are drawn in heavier lines, and each has as many cells as the grid is wide, in a shape of its own.",
      "Every puzzle has exactly one answer. Easy yields to reasoning alone; medium and hard ask you to try something and see.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "7×7 is the usual size. 5×5 is quick; 9×9 is the classic grid with the boxes cut up.",
  },
  diagonal: {
    label: "Diagonal Sudoku",
    kanji: "対角ナンプレ",
    tagline: "Sudoku where the two long diagonals must hold each number once too.",
    inspiredBy: "Sudoku X",
    origin:
      "The most common extra rule laid on Sudoku: the two diagonals count as groups as well. Newspapers print it as Sudoku X, The Daily Mail at six by six.",
    alsoKnownAs: ["Sudoku X", "X-Sudoku"],
    wikipedia: "Sudoku",
    rules: [
      "Fill every empty cell with a number from 1 up to the side of the grid, so that each row, each column and each box holds every number exactly once.",
      "The two long diagonals, shaded corner to corner, must each hold every number exactly once as well.",
      "Every puzzle has exactly one answer, and the diagonals are part of reaching it: fewer numbers are printed than a plain grid would need.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "9×9 is the usual size; 6×6, with boxes two rows tall and three wide, is the short one.",
  },
  sumCages: {
    label: "Killer Sudoku",
    kanji: "サムナンプレ",
    tagline: "Sudoku with no numbers printed: dashed cages each give the sum of the numbers inside them.",
    inspiredBy: "Killer Sudoku",
    origin:
      "Played in Japan in the 1990s as sum number place, and made famous as Killer Sudoku by The Times in 2005, which printed it daily beside the plain grid.",
    alsoKnownAs: ["Sumdoku", "Sum Number Place"],
    wikipedia: "Killer_sudoku",
    rules: [
      "Fill every cell with a number from 1 up to the side of the grid, so that each row, each column and each box holds every number exactly once.",
      "The dashed outlines are cages. The small number in a cage's corner is the sum of the numbers inside it, and no number appears twice in one cage.",
      "Almost nothing is printed: the sums are the clues. Every puzzle has exactly one answer, and the harder levels have fewer, bigger cages.",
      "The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "9×9 is the usual size; 6×6, with boxes two rows tall and three wide, is the short one.",
  },
  towers: {
    label: "Skyscrapers",
    kanji: "摩天楼",
    tagline: "Every number is a tower's height. The clues around the edge say how many towers you can see from there.",
    inspiredBy: "Skyscrapers",
    origin:
      "A Japanese logic puzzle known in English as Skyscrapers, set at the first World Puzzle Championship in 1992; Simon Tatham's puzzle collection calls it Towers.",
    alsoKnownAs: ["Towers", "Building Heights"],
    country: "JP",
    rules: [
      "Fill every cell with a tower from 1 up to the side of the square, so that each row and each column holds every height exactly once.",
      "A number outside the square says how many towers can be seen looking in from there. A taller tower hides every shorter one behind it.",
      "So a 1 means the tallest tower stands right beside the clue, and a clue as big as the square means the towers climb one step at a time.",
      "Every puzzle has exactly one answer. The clock starts on your first entry and stops when the last cell is right. Check tells you how many cells are wrong, never which.",
    ],
    board: "5×5 is the usual size. 4×4 is quick; 7×7 is the long one.",
  },
  blackAndWhite: {
    label: "Black and White",
    kanji: "白黒",
    tagline: "Fill the grid with black and white stones: half of each in every row and column, and never three alike in a line.",
    inspiredBy: "Takuzu",
    origin:
      "The binary puzzle made around 2009 by Adolfo Zanellati and, separately, by Peter De Schepper and Frank Coussement, printed as Takuzu and Binairo. LinkedIn plays a form of it daily as Tango, with suns and moons.",
    alsoKnownAs: ["Takuzu", "Binairo", "Binary puzzle"],
    wikipedia: "Takuzu",
    rules: [
      "Fill every empty cell with a black stone or a white one.",
      "Every row and every column holds as many black stones as white ones.",
      "Never three stones of one colour side by side in a line, across or down. Here three in a row is the one thing you may not make.",
      "No two rows are the same, and no two columns are the same.",
      "Tap a cell once for black, again for white, again to clear it. The printed stones stay where they are, and every puzzle has exactly one answer.",
    ],
    board: "8×8 is the usual size. 6×6 is quick; 12×12 is an evening.",
  },
  gomoji: {
    label: "Gomoji",
    kanji: "五文字",
    tagline: "Find the hidden word. Each guess shows which of its letters are in the word, and which are in the right place.",
    inspiredBy: "Wordle",
    origin:
      "Guessing a word from what each guess gives away is an old parlour game: Jotto (1955) counted the letters two words share, and the television game Lingo (1987) coloured each letter in its place or not. Josh Wardle's Wordle (2021) made the five-letter form a daily habit.",
    rules: [
      "A word is hidden: five letters, four in the short form, or six in the long one. Type a word of that length and press Enter to guess it.",
      "Each letter of the guess turns green if it is in the word in that place, gold if it is in the word somewhere else, and grey if it is not in the word at all.",
      "A letter appears in the colours as often as it is in the word: guess two E's against a word with one, and one E lights up while the other goes grey.",
      "Easy gives eight guesses, medium seven and hard six, at every length: a short word is no easier to find, since it gives away fewer letters a guess and many four-letter words differ by one letter. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      "Strict, a choice at any level, keeps you honest: every letter already found must be used again, a green one in its place.",
      HEAD_START_RULE,
    ],
    board:
      "Four, five or six letters, on a board eight rows tall at every length and level: eight squares across for four or six letters, nine for five, so the word sits in the middle. The words come from SCOWL, the spelling lists by Kevin Atkinson: easy hides one of the commonest words, medium and hard one of a wider list, and any word in the lists may be guessed.",
  },
  gomojiKana: {
    label: "Gomoji Kana",
    kanji: "五文字かな",
    tagline: "Find the hidden word in kana. Each guess shows which kana are right, which are in the word, and which column the right one is in.",
    inspiredBy: "Wordle",
    origin:
      "Gomoji in Japanese: the same hunt for a hidden word, played in hiragana, where a kana can be nearly right in ways a letter cannot. The rules for size, marks and columns are our own.",
    rules: [
      "A word is hidden, three, four or five kana long, in hiragana. Easy gives eight rows, medium seven and hard six, at every length: on easy and medium the first is the free grey word, so easy is seven guesses and medium six, and hard six with no free word. Every guess must be a real word.",
      "Green is the right kana in the right place. Orange is a kana that is in the word somewhere else. Yellow means the word's kana in this place is in the same column of the kana table (か き く け こ are one column). Grey is none of those.",
      "An arrow means right kana, not quite: down for the wrong size (つ for っ), up for the wrong mark (は for ば or ぱ). The word is found only when every place is plain green.",
      "On easy and medium the puzzle opens with a free word already played that is grey everywhere, so its kana are out before you start.",
      "Type with the kana keys, or in romaji on your own keyboard (ka, kya, tsu; a double consonant for っ, nn for ん, - for ー). Strict, a choice at any level, keeps you honest: every kana found must be used again, a green one in its place.",
      "Head start, a choice at easy, greys as many kana keys as the word is long before the first guess, none of them in the word nor in the free grey word: a free guess that takes no row, at a cost of 50 points.",
    ],
    board:
      "Three kana is the gentlest, five the hardest. The words come from JMdict, the Japanese dictionary of the Electronic Dictionary Research and Development Group, used under its licence and refreshed every month. The answers are the commonest words by a fixed rule — textbook-common words first, then by how often newspapers use them: easy hides one of the 900 commonest at its length, medium and hard one of the 2,000 commonest, and any word in the dictionary may be guessed.",
  },
  gomojiMot: {
    label: "Gomoji Mot",
    kanji: "五文字・仏",
    tagline: "Find the hidden French word. Each guess shows which of its letters are in the word, and which are in the right place.",
    inspiredBy: "Wordle",
    origin:
      "Gomoji in French: the same hunt for a hidden word Josh Wardle's Wordle (2021) made a daily habit, played on the AZERTY keyboard. Accents fold to their plain letter, as French Wordle clones play it — É guesses the same as E.",
    country: "FR",
    rules: [
      "A word is hidden: five letters, four in the short form, or six in the long one. Type a word of that length and press Enter to guess it.",
      "Each letter of the guess turns green if it is in the word in that place, gold if it is in the word somewhere else, and grey if it is not in the word at all.",
      "A letter appears in the colours as often as it is in the word: guess two E's against a word with one, and one E lights up while the other goes grey.",
      "Eight guesses at easy, seven at medium and six at hard, at every length. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      "Hard keeps you honest: every letter already found must be used again, a green one in its place.",
      HEAD_START_RULE,
    ],
    board:
      "Four, five or six letters, with eight guesses at easy, seven at medium and six at hard. Any word in Lexique, a dictionary of about 140,000 French words, may be guessed. The hidden word is one Wiktionary has too, read in French books and in its dictionary form: never a name, a plural, a conjugated verb or a word borrowed from English. Easy hides one of the commoner words, as Lexique counts them among those French film dialogue uses most (hermitdave's FrequencyWords), and medium and hard one of the wider list. Accents are folded away, and words spelled with œ or æ are left out.",
  },
  gomojiWort: {
    label: "Gomoji Wort",
    kanji: "五文字・独",
    tagline: "Find the hidden German word. Each guess shows which of its letters are in the word, and which are in the right place.",
    inspiredBy: "Wordle",
    origin:
      "Gomoji in German: the same hunt for a hidden word Josh Wardle's Wordle (2021) made a daily habit, played on the QWERTZ keyboard with Ä, Ö and Ü as letters of their own.",
    country: "DE",
    rules: [
      "A word is hidden: five letters, four in the short form, or six in the long one. Type a word of that length and press Enter to guess it.",
      "Each letter of the guess turns green if it is in the word in that place, gold if it is in the word somewhere else, and grey if it is not in the word at all.",
      "Ä, Ö and Ü are letters of their own, not vowels with a fold: a guess for ä only matches ä.",
      "Eight guesses at easy, seven at medium and six at hard, at every length. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      "Hard keeps you honest: every letter already found must be used again, a green one in its place.",
      HEAD_START_RULE,
    ],
    board:
      "Four, five or six letters, with eight guesses at easy, seven at medium and six at hard. Any form in LanguageTool's German dictionary may be guessed, never a name or an abbreviation. The hidden word is one Wiktionary has too, in its dictionary form: never a plural, an inflection or a word borrowed from English. How often German film dialogue says it (hermitdave's FrequencyWords) decides how common it is: easy hides one of the commoner words, medium and hard one of the wider list. Words spelled with ß are left out, the way French leaves out œ and æ.",
  },  gomojiPop: {
    label: "Pop Gomoji",
    kanji: "五文字・流行",
    tagline: "Find the hidden pop-culture word from its category. Each guess shows which of its letters are in the word, and which are in the right place.",
    inspiredBy: "Wordle",
    origin:
      "Gomoji with a quiz inside it: the hunt for a hidden word Josh Wardle's Wordle (2021) made a daily habit, over a list of the games, films, myths, music, sport and Japanese culture people know by name, each word shown with the category it comes from.",
    rules: [
      "A word is hidden, three to seven letters long, and its category is shown above the board: a Pokemon, a Greek deity, a musical instrument. Type a word of that length and press Enter to guess it.",
      "Each letter of the guess turns green if it is in the word in that place, gold if it is in the word somewhere else, and grey if it is not in the word at all.",
      "Any English word of the length may be guessed, and any word of the pop list, names included: MARIO and ZELDA are words here.",
      "Easy gives eight guesses, medium seven and hard six, at every length. A word the list does not know is refused and costs nothing.",
      "Strict, a choice at any level, keeps you honest: every letter already found must be used again, a green one in its place.",
      HEAD_START_RULE,
    ],
    board:
      "Three to six letters on the set-up screen's first shelf, and four to seven on its second. The answers are one list kept by hand, each word checked to belong to its category and to be fit for every member of the site; names are written as plain words, with no marks or logos. Guesses come from that list and from SCOWL, the spelling lists by Kevin Atkinson.",
  },

  tsunagi: {
    label: "Tsunagi",
    kanji: "繋ぎ",
    tagline: "Join each pair of marbles with a line, and fill the board.",
    inspiredBy: "Numberlink",
    origin:
      "Our version of Numberlink, the joining puzzle Nikoli made famous in Japan in the 1980s and printed as Arukone. Tsunagi 繋ぎ is Japanese for a joining: the line between two things that belong together. The levels, the marbles and the name are our own.",
    alsoKnownAs: ["Numberlink", "Arukone"],
    country: "JP",
    wikipedia: "Numberlink",
    rules: [
      "Every marble has a partner of the same colour and number. Join each pair with one line, drawn from cell to cell across and down, never on a slant.",
      "Lines may not cross, and no two lines may share a cell.",
      "The level is solved when every pair is joined and every cell of the board has a line through it. Every level has exactly one way to do that.",
      "Press on a marble, or on the end of a line, and drag. Drag back over your own line to shorten it; drag into another line to cut it back. Tap a marble to clear its line.",
      "Every size has its own levels, the same for everybody and ordered easiest first: 256 at each of 5×5 to 9×9, 192 at 4×4, 128 at 10×10 and at each of 12×12 to 15×15, and 64 at 11×11. They come in blocks of 16: solve a whole block and the next one opens.",
      "The last two levels of a block bring a twist: the 15th shows it gently, the 16th is the block's test. BRIDGES first: a bridge is crossed by two lines, one straight across and a different one straight down, and neither may turn on it. Then WALLS: no line may cross a wall, or go into a blocked cell. Then WAYPOINTS: a ring on a cell that its colour's line must pass through, and no other. Then WRAP: the edges join, so a line leaving one side comes back in on the other. Then EXPLOSIONS: every few strokes a drawn line is broken, cut back to half or wiped with a line beside it cut too; the count under the board warns a stroke before, and the stroke that solves the level sets nothing off. And at the odd sizes, HEXAGONS: a honeycomb where every cell has six neighbours, so a line may also run along both slants. Two are harder with no new rule at all: a STROKE LIMIT, where every lift of your finger that changed the board spends a stroke and Undo gives none back, and SPARSE boards of a few long lines. At 14×14 and 15×15 the wrap block is an ordinary one, and so is the last.",
    ],
    board:
      "4×4 is where to start, and 7×7 is the everyday size. 12×12 to 15×15 are long evenings, with up to sixteen pairs; on a phone a board of 10×10 or more zooms, with Fit and the arrows under the board. Play by colours or by numbers, whichever you read faster: the marbles and the level are the same either way.",
  },
  /*
   * OUR OWN GAME, UNDER OUR OWN NAME. The anagram-grid race games are sold
   * under trademarks this site does not use, in its copy, its pictures or its
   * rules: the idea of building a crossword of your own from drawn tiles is
   * nobody's, and the letter mix is a fact about English (`TILE_MIX`).
   */
  kumimoji: {
    label: "Kumimoji",
    kanji: "組文字",
    tagline: "Build one crossword of your own from a hand of letter tiles, draw more as you go, and use the whole bag against the clock.",
    inspiredBy: "the anagram-grid race games",
    origin:
      "Our own solo take on the anagram-grid race games, where every player builds a crossword of their own from drawn tiles at the same time. Kumimoji plays it alone, against the clock, from a bag drawn from the classic mix of 144 letters. Its name, 組文字, means “assembled letters”: a sibling of Gomoji 五文字.",
    rules: [
      `You start with a hand of tiles, ${KUMIMOJI_HANDS.classic} in a Classic game or ${KUMIMOJI_HANDS.quick} in a Quick one. Lay them out to build one crossword: every tile joined to the rest, and every line of two or more letters, across or down, a word.`,
      `A game is Short, Medium or Full: ${kumimojiTileCount(KUMIMOJI_HANDS.classic, "short")} tiles from a Classic hand (${kumimojiTileCount(KUMIMOJI_HANDS.quick, "short")} from a Quick one), half the set (${kumimojiTileCount(KUMIMOJI_HANDS.classic, "medium")}), or all ${kumimojiTileCount(KUMIMOJI_HANDS.classic, "full")}. In English the Double set plays two sets as one, ${kumimojiTileCount(KUMIMOJI_HANDS.classic, "full", undefined, true)} tiles at Full.`,
      "Tap a tile and then a square to put it there, or drag it; on a keyboard, choose a square and type. Tiles can be moved, swapped or sent back to your hand at any time: tap a tile on the table twice and it goes straight back. Sort, or the / key, puts your hand in order. A line that is not a word is marked in red until it is.",
      "Choose Help on the set-up screen and a Help press arranges your hand to spell a word, a different one each time; you still have to find it a place. Each press costs a hint's worth of points, and Help is never offered in a race.",
      "Choose Diagonals on the set-up screen and the crossword is read corner to corner as well: every line of three or more tiles running diagonally, read from the top down, must be a word too, and a diagonal word joins its tiles to the crossword as a word across does. Two tiles touching at a corner are still free. A race, a kept game and a pass-and-play game are each played by the rule they were set up with.",
      "The charcoal tiles marked 五 are wild: tap one and choose the letter it stands for, and change it whenever you like. Easy games have the most of them, Medium half as many, and Hard none.",
      "In Japanese every tile is a hiragana and plays as all of its forms, shown small in its corner: は is also ば and ぱ, つ is also っ and づ, や is also ゃ, and お is also を. A line is a word when it spells one read that way, as in a Japanese crossword: 学校, がっこう, is laid か つ こ う.",
      "The table grows as you build and fits itself to the crossword. Pinch or use the wheel to zoom, drag the table to move it, or press Arrows for buttons that do both. Turn turns the table a quarter at a time, to see the grid from another side, and every tile stays upright.",
      "When your hand is empty and the grid is sound, press Draw for the next tile from the bag, and fit it in. Rebuild as much as you like: only the whole has to be right.",
      "Stuck with a Q or an X, or a hand that spells no word? Trade a tile: it goes to the bottom of the bag and you take the next three. Every tile still has to be used, the traded one included.",
      "The game ends when the bag is empty and every tile is on a sound grid. Your time is your score. Every bag has been laid out once before you see it, so it can always be finished.",
      "Pass and play: choose two to eight players on the set-up screen and hand one device round. Everyone's crossword and hand are face up, as they would be on a table; press Done to pass, and All tables shows every crossword at once. When your hand is used and your grid is sound, Draw gives every player a tile. A player may trade once a turn, then lay what they can or press Done; the next trade waits for their next turn, so nobody can trade the bag away from everybody else. When somebody goes out, everybody else has one last turn, and anyone who goes out on it shares the win. Once the bag cannot give a trade, a player who is stuck may resign; the last one standing wins by laying a tile.",
      "Every crossword a member finishes is kept on their record, and its Wallpaper button draws them all as one picture, for a desk or a phone.",
      "Between turns, from the pass screen, a player may leave: every tile in their hand and on their table goes back into the bag, and play goes on without them. Somebody new may join, up to eight, with a hand dealt from the bag, until the last round begins. Any seat can be a computer, marked BOT, which plays its own turn where everybody can watch: it builds its crossword a word at a time, draws, trades and goes out by the same rules. With one player left, they are the last one standing.",
    ],
    board: `There is no board: the tiles lie on a table that grows as the crossword does, and zooms to fit it. The chosen length and set determine how many tiles must be played, drawn from the 144-letter mix: thirteen A's, eighteen E's, and two each of J, K, Q, X and Z. Any word from two letters to fifteen in SCOWL, Kevin Atkinson's English and American spelling lists, counts. The Japanese set is 144 hiragana in 45 kinds, shared by how often each is used: ${JAPANESE_TILE_MIX["う"]} う, ${JAPANESE_TILE_MIX["ん"]} ん, and one each of the hard ones, ぬ, へ, ね, ろ and れ. Its words are every hiragana reading in JMdict, the Electronic Dictionary Research and Development Group's dictionary, used under its licence.`,
  },
  koushi: {
    label: "Koushi",
    kanji: "格子",
    tagline: "Six words woven into a lattice, their letters scrambled. Swap two letters at a time until every word is right.",
    inspiredBy: "the swap-the-letters word grid",
    origin:
      "Our own take on the swap-the-letters word grid: six words crossing in a lattice, found by moving letters rather than guessing them. 格子 is the lattice of a shoji screen, paper panes held in a grid of wood, and the words here are held the same way.",
    rules: [
      "Six five-letter words are hidden in the lattice: three across, on the first, third and fifth rows, and three down, on the first, third and fifth columns. Where two words cross they share a letter, so 21 letters make all six.",
      "The letters start scrambled. Tap a letter and then another, or drag one onto the other, and they change places. A green letter is right and stays where it is.",
      "Green is the right letter in the right place. Gold means one of the letter's words needs it somewhere else. Plain means neither of its words needs it anywhere that is not already green.",
      "A letter where two words cross turns gold if either word needs it, and the colour does not say which. A word lights a letter only as often as it still needs it: a word wanting one E turns the first E it comes to gold, reading left to right or top to bottom, and not the second.",
      "Every puzzle can be solved in exactly its level's number of swaps, 8 at easy, 10 at medium and 12 at hard, and you have five more than that. Run out, and the puzzle ends unsolved and shows its words.",
      "Every swap left at the end is a mark, five at best. The leaderboard counts the fewest swaps first, then the time.",
    ],
    board:
      "One lattice, five letters each way, its four holes showing the board beneath. The words come from SCOWL, the spelling lists by Kevin Atkinson, as Gomoji's do: easy and medium use the commonest words, hard a wider list.",
  },
  /*
   * OUR OWN NAME FOR IT. The island-and-bridge puzzle is Nikoli's, first
   * printed in 1990, and the name it is printed under there is a name this
   * site does not use, in its copy, its pictures or its code. Bridges is the
   * plain English for what it is, and 橋 the plain Japanese.
   */
  bridges: {
    label: "Bridges",
    kanji: "橋",
    tagline: "Join the islands with straight bridges, one or two at a time, until every island has its number and all of them are one.",
    inspiredBy: "the island-and-bridge puzzle Nikoli first printed in 1990",
    origin:
      "A Japanese pencil puzzle of islands and the bridges between them, first printed by Nikoli in 1990 and found since in puzzle books everywhere under many names. 橋 is simply Japanese for a bridge. The puzzles here are made by our own code, each with exactly one answer.",
    country: "JP",
    rules: [
      "Every circle is an island, and its number is how many bridges it must have.",
      "A bridge runs straight across or straight down between two islands in line with each other, over water only: never through another island, and never across another bridge.",
      "Two islands may be joined by one bridge or by two, never more.",
      "The puzzle is solved when every island has exactly its number and every island can be reached from every other along the bridges. Every puzzle has exactly one answer.",
      "Tap an island and then another in line with it to lay a bridge; do it again for a second, and a third time to take them both away. Or drag from one island to the other. An island that has its number turns solid, with a tick under it.",
      "Easy yields to counting alone. Medium needs the joining rule as well: no group of islands may be closed off from the rest, so two 1s are never joined to each other. Hard asks you, somewhere, to try a bridge and see.",
    ],
    board:
      "9×9 is the usual size. 7×7 is quick; 11×11 and 13×13 are long evenings, and 17×17, 21×21 and 25×25 are for the patient. On a phone the bigger boards zoom, with Fit and the arrows under the board.",
  },
  /*
   * OUR OWN NAME FOR IT. The grid picture puzzle has many names, and some of
   * them are trademarks — the best known is a games company's — so none is
   * used here, in copy, pictures or code. Picture logic says what it is; 絵解き
   * (etoki), "reading a picture out", is the plain Japanese.
   *
   * The history, as far as it could be checked (Wikipedia's "Nonogram", read
   * 2026-09-29): Non Ishida's winning grid pictures in Tokyo in 1987, Tetsuya
   * Nishio's independent invention of the same puzzle, Ishida's three "Window
   * Art Puzzles" of 1988, James Dalgety's name "nonogram", and The Sunday
   * Telegraph's weekly puzzle from 1990.
   */
  pictureLogic: {
    label: "Picture logic",
    kanji: "絵解き",
    tagline: "Shade the squares the numbers ask for, row by row and column by column, and a picture appears.",
    inspiredBy: "the grid picture puzzle known in English as the nonogram, devised in Japan in 1987",
    origin:
      "A Japanese puzzle of hidden pictures. In 1987 Non Ishida, a graphics editor, won a competition in Tokyo with pictures drawn in the lit windows of a grid, and the puzzle maker Tetsuya Nishio came to the same idea on his own; Ishida published three as Window Art Puzzles in 1988. In Britain James Dalgety named them nonograms, after her, and The Sunday Telegraph printed one every week from 1990. 絵解き means reading a picture out. The pictures here are drawn by our own code, and each puzzle has exactly one answer.",
    country: "JP",
    rules: [
      "Every row has a clue beside it and every column a clue above it: the lengths of its runs of shaded squares, in order. A 0 means none.",
      "Between two runs in a line there is at least one empty square; before the first and after the last there may be any number.",
      "The puzzle is solved when every row and every column has exactly its runs, and the picture they draw appears. Every puzzle has exactly one answer.",
      "Tap a square to shade it, again to mark it ✕ (sure to be empty), and again to clear it; with the ✕ pen, a tap marks first. Drag along a row or column to do the same to every square like the first. A clue that is met turns pale and is struck through.",
    ],
    board:
      "10×10 is the usual size. 5×5 is quick; 15×15 and 20×20 are long evenings, and 40×40 and 50×50 are for the patient, in easy and medium only: every line can still be worked out without a guess. Past 10×10 the board zooms on a phone, with Fit and the arrows under it, and the clues stay put as you move.",
  },
  /*
   * KLONDIKE, by the name most people know it by. "Solitaire" is the family of
   * one-player card games and the everyday name of this one; the desktop
   * versions that made it famous carry their makers' names, which this site
   * does not use. ソリティア is what Japanese players call it.
   */
  solitaire: {
    label: "Solitaire",
    kanji: "ソリティア",
    tagline: "Klondike, the Solitaire everybody knows: build the four suits up from their Aces, taking the cards out of seven columns and the stock.",
    inspiredBy: "Klondike, the traditional patience game",
    alsoKnownAs: ["Klondike", "Patience"],
    origin:
      "A patience game — a card game for one — from the late nineteenth century, named, most accounts say, after the Klondike Gold Rush in Canada's Yukon in the 1890s. It became the most played card game in the world when it came free with desktop computers. The deals here are shuffled and the cards drawn by our own code.",
    rules: [
      "Seven columns are dealt, one card in the first to seven in the last, each with its top card face up. The other twenty-four are the stock.",
      "Build each suit's foundation up from its Ace to its King. The game is won when all fifty-two cards are home.",
      "On the columns, build down in alternating colours: a red 6 on a black 7. Any face-up run may move as a whole onto a card one higher of the other colour, and only a King, or a run headed by one, may go into an empty column.",
      "When a column's face-up cards are all moved away, the card under them turns over by itself.",
      "Turn the stock one card at a time or three, onto the waste; the waste's top card may be played. Once the stock is empty the waste turns back over, as many times as the game allows: as often as you like, three times through, or once.",
      "A card on a foundation may come back down onto a column.",
      "Drag any face-up card, and the cards on it go with it; or tap a card and then where it should go. Tap a card twice to send it home. Undo takes back a move, and once every card is face up the game finishes itself.",
    ],
    board:
      "Draw 1 turns one card at a time from the stock, and is the gentler game; Draw 3 turns three and only the top one can be played. Winnable deals are dealt from deals our solver has already won, so every one can be won; choose any deal for the shuffle as it falls, which sometimes cannot be.",
  },
  /*
   * FREECELL, by the name it has had since Paul Alfille's program of 1978,
   * which gave the old game its free cells. フリーセル is the Japanese name.
   */
  freecell: {
    label: "FreeCell",
    kanji: "フリーセル",
    tagline: "Every card face up from the start: bring the four suits home through four free cells, and nearly every deal can be won.",
    inspiredBy: "FreeCell, the patience game Paul Alfille made in 1978",
    alsoKnownAs: ["Free Cell"],
    origin:
      "A patience game of the older family where the whole deck is dealt face up. Paul Alfille wrote it as FreeCell on the PLATO system in 1978, and it became famous when it came free with desktop computers. Almost every deal can be won, so it is a game of thinking ahead more than of luck. The deals here are shuffled and the cards drawn by our own code.",
    wikipedia: "FreeCell",
    rules: [
      "The whole deck is dealt face up into eight columns: seven cards in each of the first four and six in the rest.",
      "Build each suit's foundation up from its Ace to its King. The game is won when all fifty-two cards are home.",
      "On the columns, build down in alternating colours: a red 6 on a black 7. Any card may go into an empty column.",
      "A free cell holds any one card. Only the top card of a column or a cell's card can move.",
      "A run in order may move as a whole when there is room to move it a card at a time: one more card than the empty cells, doubled for every empty column it is not going into.",
      "Drag a card, and the run on it goes with it; or tap a card and then where it should go. Tap a card twice to send it home. Undo takes back a move, and once every card left can go home in turn the game finishes itself.",
    ],
    board:
      "4 cells is FreeCell as it is usually played; 3 cells and 2 cells leave less room to work in, and are harder. Every deal is one our solver has already won with those cells, so every one can be won.",
  },
  /*
   * SPIDER, by its own name, which it has had since the nineteenth century
   * for its eight foundations, a spider's legs. スパイダー is the Japanese name.
   */
  spider: {
    label: "Spider",
    kanji: "スパイダー",
    tagline: "Two decks, ten columns: build full runs of one suit from King down to Ace, and clear all eight off the table.",
    inspiredBy: "Spider, the traditional two-deck patience game",
    alsoKnownAs: ["Spider Solitaire"],
    origin:
      "A two-deck patience game played since at least the nineteenth century and named, it is said, for its eight foundations, as many as a spider's legs. It became one of the most played card games of all when it came free with desktop computers. Played with one suit it is gentle; with all four it is one of the hardest patience games there is. The deals here are shuffled and the cards drawn by our own code.",
    wikipedia: "Spider (solitaire)",
    rules: [
      "Two decks are dealt into ten columns: six cards in each of the first four and five in the rest, only the top card of each face up. The other fifty are the stock.",
      "A card may go onto any card one higher, of any suit, or into an empty column. A run moves as a whole only if it is all one suit, in order.",
      "A full run of one suit, from King down to Ace, is taken off the table by itself. Clear all eight to win.",
      "When a column's face-up cards are all moved away, the card under them turns over by itself.",
      "Tap the stock to deal one card onto every column at once, five times in all. It cannot deal while a column is empty.",
      "Drag a card, and the run on it goes with it; or tap a card and then the column it should go on. Tap a card twice to move its run to the best column that takes it. Undo takes back a move, and once every card is dealt and face up the game finishes itself where it can.",
    ],
    board:
      "1 suit plays both decks as eight sets of spades, and is the gentle game; 2 suits is spades and hearts; 4 suits is the full two decks, and hard. Every deal is one our solver has already won, so every one can be won.",
  },
  /*
   * MAHJONG SOLITAIRE, the tile-matching patience game (John, 2026-09-29:
   * "MahJong game where you match up piles of those CHIPS things"). The name
   * is the generic one it is searched for by; the names it is sold under
   * belong to their owners and are not used here. The set is the Japanese
   * one, drawn for this site (`MahjongTileFace`). 牌合わせ, "matching tiles".
   */
  mahjong: {
    label: "Mahjong Solitaire",
    kanji: "牌合わせ",
    tagline: "Clear a stack of mahjong tiles two at a time: take matching pairs of free tiles until the table is empty.",
    inspiredBy: "mahjong solitaire, first made by Brodie Lockard as Mah-Jongg in 1981",
    alsoKnownAs: ["Mah-Jongg", "The Turtle"],
    origin:
      "The patience game played with a mahjong set: the tiles are stacked into a shape and taken off two at a time. Brodie Lockard first made it as a computer game on the PLATO system in 1981, and it has been played on every kind of screen since. The tiles here are a full set of 144 in the Japanese style, drawn for this site; the deals and the layouts are our own.",
    wikipedia: "Mahjong solitaire",
    rules: [
      "The tiles are stacked in a layout of up to five layers. Take them off two at a time, in matching pairs, until none are left.",
      "Only a free tile can be taken: nothing lying on it, not even half a tile, and its left side or its right side open. A tile covered, or held on both sides, waits until the tiles around it are gone.",
      "Two tiles match when they are the same: the same number of the same suit, the same wind or the same dragon. Any flower matches any flower and any season any season, or, with Identical chosen on the set-up screen, only the same one.",
      "Tap a free tile and then its match, or drag one onto the other. Double-tap a free tile to take it with its match, when it has one free. A blocked tile shakes and stays where it is.",
      "Stuck, with no free pair? Shuffle lays the tiles left in the places they fill, so play can go on, and lays them so they can be finished whenever the places allow. Undo takes back the last move, as often as you like.",
      "Choose Hints on the set-up screen and Hint lights a free pair, at a hint's cost in points. Free tiles lit, the usual choice, dims every blocked tile so the free ones stand out; turn it off for the classic look.",
      "Every deal can be cleared: it is laid out pair by pair in reverse before you see it. Your time is your score.",
      "For a table: choose two, three or four players on the set-up screen and pass one device round. Each turn takes one pair, scored to whoever took it: a plain suit tile 1, a one or a nine 2, a wind 3, a dragon 4, and a flower or season 2 and another turn. With no pair to take, the tiles are shuffled and the same player goes on. When the table is clear, or no shuffle can free what is left, the most points wins, and a tie shares it. Any seat can be a computer. Nothing is secret, so nobody hides the screen.",
    ],
    board:
      `Four layouts. Torii 鳥居 (${mahjongTiles(8)} tiles, eight across) and Fuji 富士 (${mahjongTiles(9)}, nine across) are quick and fit a phone; Castle 城 (${mahjongTiles(10)}, ten across) is longer; the Turtle 亀 is the classic ${mahjongTiles(15)}, fifteen across, and on a phone it zooms, with Fit and the arrows under the board. A smaller layout uses pairs drawn from the full set of 144.`,
  },  /*
   * THE CUBE, by the plain word: the puzzle Ernő Rubik made is sold under his
   * name, which belongs to its owners and is not used here. 立方体, "a cube",
   * is the everyday Japanese word for the shape, which is all this is called.
   */
  cube: {
    label: "Cube",
    kanji: "立方体",
    tagline: "The turning cube: scramble it, then turn its layers until every face is one colour again. From the 2×2 to the 5×5, in 3D.",
    inspiredBy: "the Rubik's Cube, invented by Ernő Rubik in 1974",
    alsoKnownAs: ["Rubik's Cube", "Magic Cube", "Speedcube"],
    origin:
      "Ernő Rubik, a Hungarian teacher of architecture, made the first one in 1974 to show his students how parts can move without the whole falling apart, and took a month to solve it himself. It went on sale in 1980 and became the best-selling puzzle ever made. People now race to solve it, in competitions timed to the hundredth of a second. The cube here is drawn and turned by our own code.",
    wikipedia: "Rubik's Cube",
    rules: [
      "Each face of a solved cube is one colour. The cube starts scrambled; turn its layers until every face is one colour again.",
      "Any layer can be turned a quarter or a half turn: a face, or on a bigger cube a layer inside it. Turning the whole cube to look at another side is free, and is not counted as a move.",
      "Drag a sticker across the cube to turn the layer it sits in that way. Drag the space around the cube to turn the whole cube and look at it from anywhere.",
      "With a mouse, the wheel over the cube turns the layer under the pointer, and Ctrl with the wheel turns the layer across it; over the space around the cube, the wheel turns the whole cube. Keys work too, in the notation cubers write: R, L, U, D, F and B turn a face clockwise, with Shift anticlockwise; M, E and S turn a middle layer, and x, y and z the whole cube. A number first, 2 to 5, turns a layer that far in from the face.",
      "You get fifteen seconds to look at the scramble, as a competition gives. The clock starts with your first turn, or when the look runs out, and stops the moment the cube is solved.",
      "Undo takes back a turn, as often as you like. Your time is your score, and your moves are kept, so a solve can be seen again.",
    ],
    board:
      "The 3×3 is the classic cube. The 2×2 has no centres to show which colour a face should be, so it is a quick one to learn on; the 4×4 and 5×5 have layers inside, and are long evenings. Easy is a few turns from solved; hard is a full scramble.",
  },  /*
   * OUR OWN NAME FOR IT. The pipe-turning puzzle goes by Net and by NetWalk
   * where it is a puzzle of turning pieces until they join; the names of the
   * falling-pipes video games are other games and are not used here, in
   * copy, pictures or code. 水道 (suidō), "waterworks", is the everyday
   * Japanese word for the pipes and channels that carry water to a town,
   * which is all this is about. Read 2026-10-01 against the package's own
   * README (`@johnmorrisdotca/suido`).
   */
  suido: {
    label: "Suido",
    kanji: "水道",
    tagline: "Turn the pipes until the water from the pump reaches every drain and nothing leaks. Play 256 levels at every size up to 14×14 and sixty-four on the huge boards, or a new board each time.",
    inspiredBy: "the pipe-turning puzzle known as Net or NetWalk",
    alsoKnownAs: ["Net", "NetWalk"],
    origin:
      "A puzzle of turning fixed pieces until they join into one network, found in puzzle collections for many years under names such as Net and NetWalk. 水道 (suidō) is Japanese for waterworks: 水 is water and 道 a way, so literally a water way. The boards here are made by our own code, each with exactly one answer, and the water is drawn flowing. 3,520 of them are fixed levels, made once and proved to have exactly one answer.",
    rules: [
      "Every square holds a piece of pipe. A piece is never moved or changed, only turned, and the pump is where the water comes from.",
      "Tap a piece to turn it a quarter clockwise. Choose Anticlockwise under the board to turn the other way, or Shift-click or right-click with a mouse. With the keyboard, the arrow keys move, Enter turns a piece and Shift with Enter turns it back.",
      "The water goes from one piece into the next wherever their openings meet. It runs out of any opening that meets nothing: the edge of the board, bare ground, or a piece that does not open back. A drip shows where.",
      "Drains, the usual kind: the water must reach every drain, and nothing wet may run out. Pieces the water does not need are spares, left facing any way, and bare ground has nothing on it.",
      "Network, the other kind: every piece must be wet, so there are no spares and nothing may run out.",
      "Big pieces, chosen in Make a board and always a network: some pieces fill four squares and have up to eight openings, two on each side. Tap any part of one to turn the whole piece a quarter, where it stands. A plate under it and a ring at its middle mark it.",
      "Block turns, also chosen in Make a board and always a network: some squares of four pieces are ringed by a dashed line, with a turning mark at their middle. A tap on any of the four turns all four together a quarter: each piece moves round to the next place as it turns. Those four cannot be turned on their own, and a Hint turns the block.",
      "Levels: every size has fixed levels, 256 of them up to 14×14 and sixty-four on the huge boards (20×20, 28×28 and the long 20×50), easy to hard and the same for everybody, so a time on one can be compared with anybody's. They come in blocks of 16, and a block opens when every level of the block before it is solved. A level can have a twist, named in a chip under the board: Pumps, more than one, each feeding its own pipes. Locked pieces, which wear a padlock, cannot be turned and already face the right way, so build from them. Walls, which water cannot cross. Edges join, drawn with a dashed rim: water leaving one side comes in at the opposite one. Inlet to outlet, one path with no branch from the top left to the bottom right, the other pieces being decoys that stay dry. The 15th level of a block shows its twist and the 16th tests it.",
      "It is solved the moment the water reaches what its kind asks and nothing runs out. Every level and every board has exactly one answer, and the clock starts on your first turn.",
      "Make a board, beside the levels, makes a new one at a size and a level you choose, and Hint, if chosen there, turns one piece to face the way the answer has it, starting nearest the pump, and costs a hint. A level has no hint and no clock.",
    ],
    board:
      "7×7 is the usual size. 5×5 is quick, 9×9 is longer, and 12×12 is an evening; on a phone a board of 10×10 or more zooms, with Fit and the arrows under the board, and the huge 20×20, 28×28 and 20×50 zoom and move by a pinch, a drag and three buttons. There are 16 sizes, 5×5 to 14×14, the huge 20×20 and 28×28, and four long boards taller than they are wide, 5×7, 6×10, 8×14 and 20×50. Drains leaves spare pieces to see past; network uses every piece, so it has no spares to ignore. Big pieces fill four squares, and block turns ring four pieces that turn together; both make a network.",
  },
  /*
   * OUR OWN NAME FOR IT, and a plain one. A maze to draw a line through is as old as paper and belongs to nobody,
   * so there is no maker to credit or to avoid. 迷宮 (meikyuu), "labyrinth", is written with 迷, to get lost, and
   * 宮, a palace; the everyday word for a maze on a page is 迷路 (meiro), and 迷宮 is the one for a labyrinth you
   * can be lost in. Read 2026-10-01 against the package's own README (`@johnmorrisdotca/meikyuu`), which cites
   * its sources.
   */
  meikyuu: {
    label: "Meikyuu",
    kanji: "迷宮",
    tagline: `Draw a line through a maze from the start to the goal, with your finger or the mouse. ${thousands(MEIKYUU_LEVELS_TOTAL)} levels, in squares, hexagons, triangles, circles and shapes cut out of them, tall ones for a phone held upright, colossal ones of about ten thousand cells, and mazes over a cube, a sphere and other solids that you turn to follow your line.`,
    inspiredBy: "the maze drawn through with a pencil, from its start to its goal",
    alsoKnownAs: ["Maze", "Labyrinth", "迷路"],
    origin:
      "A maze to draw a way through is among the oldest puzzles on paper. 迷宮 (meikyū) is Japanese for labyrinth: 迷 is to get lost and 宮 a palace, so a bewildering palace, and it is the word Japanese games use for the place a player goes down into. The mazes here are made by seven well-known methods, the ones described in Jamis Buck's writing on maze algorithms and Walter Pullen's Think Labyrinth, from a few cells to thousands, and each level is a short recipe that makes the same maze for everybody.",
    rules: [
      "Draw a line from the start to the goal. Every maze has exactly one way through, so there is exactly one answer.",
      "Press the start, or the end of your line, and drag. The line follows the corridors, cannot pass a wall, and drawing back shortens it. Tap a spot further along a corridor and the line runs to it, stopping at the next fork, never choosing a fork for you.",
      "A level is played one of four ways: in at one door in the outer wall and out at another; from a cell inside to a dot hidden deep in the maze; from the middle of the shape out through a door; or from inside, picking up every key on the way to a door. A key is at the end of a branch, off the way, so each one costs a detour, and stays picked up when you draw back.",
      "A big maze is looked at through the board. Zoom with the wheel, a pinch, or the + and − buttons, and move the view with two fingers or by dragging anywhere but the line. Fit brings the whole maze back, and near the edge a line you are drawing moves the view with it.",
      "Undo takes back your last stroke and Restart clears the line. The keyboard works too: the arrow keys step the line, and Backspace undoes.",
      "Over a solid, the maze is on the whole surface of a cube, a sphere, an octahedron or an icosahedron, and you see one side of it at a time. Draw as you would, and turn the solid by dragging anywhere that is not the end of your line, with two fingers, with the arrow buttons, or with Face me, which brings the end of your line round to face you. When your line reaches the edge of the side you can see, the solid turns by itself, so the line can cross from one face to the next without letting go. Turn only makes every drag turn the solid.",
      "Stone: when a passage is a dead end, you can shut it with a stone. Press Stone and tap a cell beside your line, or hold a finger on it, or hold Shift and press an arrow key at the end of your line. A stone goes at most two cells along the passages from your line, only so many at once, and the line cannot enter it. Tap a stone to take it up. A stone is only a help for you and is never part of your answer.",
      `Fixed levels: ${thousands(MEIKYUU_LEVELS_TOTAL)} of them, the same for everybody: ${MEIKYUU_LEVELS_A_SIZE} in each of four sizes, ${MEIKYUU_LEVELS_A_SIZE} in each of six tall ones, and ${MEIKYUU_COLOSSAL_LEVELS_A_SIZE} in each of two colossal ones, and ${MEIKYUU_SOLID_LEVELS_A_SIZE} in each of three sizes of four solids, each size ordered from easy to hard so that no level is easier than the one before. A level has no hint and no clock, so a time on it is one anybody can be compared with.`,
      "The clock starts with your first stroke, and the level is solved the moment the line reaches the goal, with every key picked up.",
    ],
    board:
      `Small mazes have under 150 cells and are the quick ones; medium ones under 800; large under 4,000; and huge ones run to thousands of cells and are meant to be zoomed. Within a size the levels run from easy to hard, and every shape turns up: squares, hexagons, triangles and circles, and a heart, a leaf, a star, a ring, a diamond, a cross and a moon. The tall ones are for a phone held upright, two columns to three rows, in six sizes from ${MEIKYUU_TALL_RANGE} cells, and turn on their side by themselves on a wide screen. The colossal ones are the biggest there are, about ten thousand cells, in a square box and a tall one: they take a while, and want zooming and a few stones. The solids are the cube, the sphere, the octahedron and the icosahedron, each in a small size of about a hundred cells, a medium one of about three hundred and a large one of about six hundred and fifty.`,
  },
  /*
   * OUR OWN NAME FOR IT, and a plain one. Peg solitaire is a traditional game that belongs to nobody (the
   * package, `@johnmorrisdotca/tobiishi`, names no maker and copies no level collection), so there is no maker
   * to credit or to avoid. 飛び石 (tobiishi), "stepping stones", is the package's own project name for it and not
   * a claim about what the game was ever called in Japan; it is the word for the stones laid across a garden
   * stream, which is how a peg moves: over one to the next. Read 2026-10-05 against the package's README.
   */
  tobiishi: {
    label: "Tobiishi",
    kanji: "飛び石",
    tagline: `Jump pegs over each other into empty holes, taking each one you jump, until one peg is left in the goal. ${TOBIISHI_LEVELS_TOTAL} named levels on nine boards.`,
    inspiredBy: "peg solitaire",
    alsoKnownAs: ["Peg solitaire", "Solitaire"],
    origin:
      "Peg solitaire is a puzzle for one that has been played for centuries: a portrait of a French princess from the late 1600s shows the board beside her, and the English cross of 33 holes and the French board of 37 are still the ones most often sold. 飛び石 (tobiishi) is Japanese for stepping stones, the stones laid across a garden stream, and a name of our own for it: a peg crosses the board the same way, over one to the next. The levels here are short ones from a package of ours, each made backward from its goal so that it always has a way through.",
    wikipedia: "Peg solitaire",
    rules: [
      "Jump a peg over the peg next to it, into the empty hole straight beyond, and take the peg you jumped off the board. Every jump takes exactly one peg.",
      "Leave one peg, in the goal: the hole drawn with a dashed ring. One peg anywhere else is not it.",
      "Tap a peg, then the hole it should jump to; the holes it can reach are ringed. Or drag the peg across, and let go over the hole. With the keyboard, Tab to the board, move with the arrow keys, press Enter or Space on a peg and then on the hole, and Escape to change your mind.",
      "Pegs jump along the rows and columns of a square board. On the triangle and the hexagon a peg also jumps along the slanted lines, six ways in all. A peg never jumps over an empty hole, and never over two pegs at once.",
      `Levels: ${TOBIISHI_LEVELS_TOTAL} of them, the same for everybody. Each of the nine boards has three goal holes to finish in, at three lengths: the shortest way to the goal is 3 jumps, 6 or 9. Any run of legal jumps that leaves one peg in the goal solves it, not only the way the level was made.`,
      "Undo takes back your last jump, as many as you like, and Restart sets the pegs out again. There is no hint and no clock to run out, so a time on a level is one anybody can be compared with. The clock starts with your first jump.",
      "If no jump is left and there is more than one peg, you are stuck: Undo and try another order.",
    ],
    board:
      "The boards are the English cross, a triangle, the European board, a diamond, a heart, a star, a hexagon, and a wide and a tall rectangle. A short level (3 jumps) has four pegs on a board of up to 49 holes, and is quick; a long one (9 jumps) has ten, and the right order has to be found. Every level has at least one answer, because it was made by working backward from the goal.",
  },
  ...PENCIL_DISPLAY,
  jirai: JIRAI_DISPLAY,
};
