import type { Mark } from "./familyMark.types";

/**
 * One mark per family, drawn the way the About page draws its figures: a
 * little board with the family's defining shape on it. They are keyed by the
 * family's title so a new family gets the plain mark until it is given one —
 * and `familyMark.coverage.test.ts` fails the build while one is, because
 * PLAIN is the same picture for everybody and a row of identical icons is a
 * promise the row makes and does not keep.
 *
 * FIVE TITLES HERE BELONG TO NO FAMILY ANY MORE. Captures, Pieces and twists
 * and Connections were folded into Turn and take, Strange boards and Territory
 * on 2026-09-22 (see `FAMILY_ABSORBED`), and on 2026-09-24 Races and Territory
 * became Territory and races. Their marks are kept rather than
 * deleted: each is a drawing of a mechanism the merged family still contains,
 * and the next time one of these shelves is split or a mark is redrawn they
 * are the work already done. Nothing reads them, and the coverage test allows
 * a mark with no family but never a family with no mark. (The merges of
 * 2026-10-01, Tiles and Table cards, went the other way: each family's
 * drawing was folded into one mark, being a little of each, and not kept.)
 */
export const FAMILY_MARKS: Record<string, Mark> = {
  "Five in a row": {
    n: 5,
    stones: [0, 1, 2, 3, 4].map((i) => ({ r: 4 - i, c: i })),
  },
  Captures: {
    n: 5,
    stones: [
      { r: 2, c: 0 },
      { r: 2, c: 1, white: true, faded: true },
      { r: 2, c: 2, white: true, faded: true },
      { r: 2, c: 3 },
      { r: 0, c: 4, white: true },
    ],
  },
  Drops: {
    n: 5,
    cells: true,
    stones: [
      { r: 4, c: 2 },
      { r: 3, c: 2, white: true },
      { r: 4, c: 1, white: true },
      { r: 4, c: 3 },
      { r: 0, c: 2, faded: true },
    ],
  },
  "Pieces and twists": {
    n: 5,
    stones: [
      { r: 1, c: 1 },
      { r: 1, c: 2 },
      { r: 2, c: 1, white: true },
      { r: 2, c: 2, white: true },
    ],
    path: "M 3.6 0.6 A 1.6 1.6 0 0 1 4.4 2.2 M 4.4 2.2 l -0.5 -0.4 M 4.4 2.2 l 0.5 -0.4",
  },
  "Turn and take": {
    n: 4,
    cells: true,
    stones: [
      { r: 1, c: 1, white: true },
      { r: 1, c: 2 },
      { r: 2, c: 1 },
      { r: 2, c: 2, white: true },
      { r: 1, c: 3, faded: true },
    ],
  },
  "Small boards": {
    n: 3,
    stones: [
      { r: 0, c: 0 },
      { r: 1, c: 1 },
      { r: 2, c: 2 },
      { r: 0, c: 2, white: true },
      { r: 2, c: 0, white: true },
    ],
  },
  Races: {
    n: 5,
    cells: true,
    stones: [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 2, c: 2 },
      { r: 4, c: 4, white: true },
      { r: 4, c: 3, white: true },
      { r: 3, c: 4, white: true },
      { r: 3, c: 3, white: true, faded: true },
    ],
    // A black piece mid-jump over the white one in its path.
    path: "M 2.5 2.5 Q 3.5 1.6 4.5 2.5",
  },
  "Strange boards": {
    n: 5,
    stones: [
      { r: 2, c: 3 },
      { r: 2, c: 4 },
      { r: 2, c: 0, faded: true },
      { r: 1, c: 1, white: true },
    ],
    path: "M 4.5 2 C 5.2 2 5.2 2 4.9 2 M -0.5 2 C 0.2 2 0.2 2 -0.1 2",
  },
  /*
   * THE LAST THREE, and they were added because eleven marks in a row is
   * where the gap showed.
   *
   * Connections, Checkers and Territory had no mark of their own, so all
   * three fell through to PLAIN — one stone in the middle of a board. On
   * /games that is a mild shame: each sits beside its own title, several
   * screens apart, and nothing is confusable with anything. In the family
   * row on the set-up screen all eleven marks are side by side and three of
   * them were the same picture, which is a worse answer than no picture at
   * all: an icon that does not tell its family apart is a promise the row
   * makes and does not keep.
   *
   * Each is the family's defining move rather than a symbol for it, which is
   * the rule the other eight already follow.
   */
  Connections: {
    // A chain of one colour reaching the left edge and the right.
    n: 5,
    stones: [
      { r: 3, c: 0 },
      { r: 2, c: 1 },
      { r: 2, c: 2 },
      { r: 1, c: 3 },
      { r: 1, c: 4 },
      { r: 3, c: 3, white: true },
    ],
    path: "M -0.4 3 L 0 3 M 4 1 L 4.4 1",
  },
  Checkers: {
    // A piece mid-jump, and the one it takes going faint under it.
    n: 5,
    cells: true,
    stones: [
      { r: 4, c: 1 },
      { r: 3, c: 2, white: true, faded: true },
      { r: 4, c: 3, white: true },
      { r: 0, c: 4 },
    ],
    path: "M 1.5 4.5 Q 2.1 2.4 3.5 2.5",
  },
  Territory: {
    // A stone surrounded on all four sides, which is the whole game in one shape.
    n: 5,
    stones: [
      { r: 2, c: 2, white: true, faded: true },
      { r: 1, c: 2 },
      { r: 3, c: 2 },
      { r: 2, c: 1 },
      { r: 2, c: 3 },
    ],
  },
  /*
   * NUMBERS: a 2×2-boxed grid with three digits placed, which is the smallest
   * Number Place, and the one blank cell drawn faded — the answer waiting.
   * Digits rather than stones, because a stone in every other mark means a
   * move and here nothing moves; the mark is the one picture on the family
   * row with a number in it, which is the family's whole idea.
   */
  Numbers: {
    n: 4,
    cells: true,
    stones: [],
    digits: [
      { r: 0, c: 0, value: 1 },
      { r: 0, c: 3, value: 4 },
      { r: 1, c: 2, value: 2 },
      { r: 2, c: 1, value: 3 },
      { r: 3, c: 3, value: 1 },
      { r: 2, c: 3, faded: true },
    ],
    path: "M 2 0 L 2 4 M 0 2 L 4 2",
  },
  /*
   * LOGIC PUZZLES: the family's first puzzle in one picture — five islands,
   * each a ringed number, joined by single and double bridges so that every
   * number is met and all five are one. The islands are drawn as the Numbers
   * mark draws its digits, on the stones' white circles, and the bridges in
   * ink beneath them, so it is the one mark on the row made of lines between
   * numbers.
   */
  "Logic puzzles": {
    n: 5,
    cells: true,
    stones: [
      { r: 0, c: 0, white: true },
      { r: 0, c: 3, white: true },
      { r: 2, c: 0, white: true },
      { r: 2, c: 3, white: true },
      { r: 4, c: 3, white: true },
    ],
    digits: [
      { r: 0, c: 0, value: 2 },
      { r: 0, c: 3, value: 3 },
      { r: 2, c: 0, value: 3 },
      { r: 2, c: 3, value: 5 },
      { r: 4, c: 3, value: 1 },
    ],
    digitSize: 0.52,
    ink:
      "M 0.92 0.5 L 3.08 0.5 M 0.5 0.92 L 0.5 2.08 M 3.38 0.92 L 3.38 2.08 M 3.62 0.92 L 3.62 2.08" +
      " M 0.92 2.38 L 3.08 2.38 M 0.92 2.62 L 3.08 2.62 M 3.5 2.92 L 3.5 4.08",
  },
  /*
   * CARDS: a hand of three fanned on the green of a card table — a back with
   * the Itsutsu stones, a red King and, in front, the Ace of spades that
   * carries the five stones under its pip: the deck the family is played
   * with, drawn by the same code that draws it at the table.
   */
  Cards: {
    n: 5,
    cells: true,
    stones: [],
    cards: [
      { card: null, x: 1.45, y: 2.65, angle: -16 },
      { card: { suit: "hearts", rank: 13 }, x: 2.5, y: 2.35, angle: 0 },
      { card: { suit: "spades", rank: 1 }, x: 3.55, y: 2.65, angle: 16 },
    ],
  },
  /*
   * TABLE CARDS (2026-10-01), what Tricks and Colour cards were drawn as
   * apiece: a trick on the table, three French cards laid crosswise as three
   * players lay them, and Hitotsu's wild, the four colours quartered, played
   * to it from the foot — both decks the family is played with, at one table.
   */
  "Table cards": {
    n: 5,
    cells: true,
    stones: [],
    cards: [
      { card: { suit: "hearts", rank: 12 }, x: 2.5, y: 1.55, angle: 0 },
      { card: { suit: "diamonds", rank: 10 }, x: 1.45, y: 2.5, angle: -90 },
      { card: { suit: "clubs", rank: 13 }, x: 3.55, y: 2.5, angle: 90 },
    ],
    colourCards: [{ card: "WW0", x: 2.5, y: 3.45, angle: 0 }],
  },
  /*
   * OTHER: a row of letters, the word puzzle's, two tiles lit green for a
   * letter in its place and one gold for a letter elsewhere — the family's
   * first game in one line, and the one mark on the row made of letters.
   */
  /*
   * WORD GAMES (2026-10-01): WORDS in Gomoji's coloured tiles, a guess part
   * way to found. It was the game's own name, GOMOJI on a six-square board
   * (John, 2026-09-25), until the shelf took in Kumimoji, Koushi and Superghost.
   */
  "Word games": {
    n: 5,
    cells: true,
    stones: [],
    digits: [
      { r: 2, c: 0, letter: "W", tile: "hit" },
      { r: 2, c: 1, letter: "O", tile: "near" },
      { r: 2, c: 2, letter: "R" },
      { r: 2, c: 3, letter: "D", tile: "hit" },
      { r: 2, c: 4, letter: "S", tile: "hit" },
    ],
  },
  /*
   * PARTY GAMES: six players sat round one board, black and white by turns,
   * and the turn going round the table in the middle — the family's whole
   * idea, a game passed from hand to hand, and the one mark on the row with
   * nobody facing anybody.
   */
  /*
   * TABLES: the backgammon board in little — three points along the foot with
   * white checkers stacked on the first, three along the top with black on the
   * last, and a die between them: the family's whole idea, a race that two
   * sides run in opposite directions and the dice decide.
   */
  Tables: {
    n: 5,
    cells: true,
    stones: [
      { r: 4, c: 0, white: true },
      { r: 3, c: 0, white: true },
      { r: 2, c: 0, white: true },
      { r: 0, c: 4 },
      { r: 1, c: 4 },
      { r: 4, c: 2, white: true },
    ],
    ink: "M 1 4.95 L 1.5 3.4 L 2 4.95 M 2.3 4.95 L 2.8 3.4 L 3.3 4.95 M 3 0.05 L 3.5 1.6 L 4 0.05 M 1.7 0.05 L 2.2 1.6 L 2.7 0.05",
  },
  "Party games": {
    n: 5,
    stones: [
      { r: 0, c: 2 },
      { r: 1, c: 4, white: true },
      { r: 3, c: 4 },
      { r: 4, c: 2, white: true },
      { r: 3, c: 0 },
      { r: 1, c: 0, white: true },
    ],
    path: "M 2 1.1 A 0.9 0.9 0 1 1 1.22 1.55 l -0.32 0.15 M 1.22 1.55 l 0.03 0.35",
  },
  /*
   * TERRITORY AND RACES, one picture for the family that took the races in
   * on 2026-09-24: the surrounded stone of Territory on the left, and on the
   * right a black piece hopping over a white one towards the far end of the
   * board, which is the Races mark's own move. "Territory" and "Races" above
   * are kept, like the three retired before them.
   */
  "Territory and races": {
    n: 5,
    stones: [
      { r: 2, c: 1, white: true, faded: true },
      { r: 1, c: 1 },
      { r: 3, c: 1 },
      { r: 2, c: 0 },
      { r: 2, c: 2 },
      { r: 4, c: 4 },
      { r: 3, c: 4, white: true },
      { r: 2, c: 4, faded: true },
    ],
    path: "M 4 4 Q 4.9 3 4 2",
  },
};
