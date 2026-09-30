import { CardBack } from "@/components/cards/CardBack";
import { CardFace } from "@/components/cards/CardFace";
import type { Card } from "@/lib/cards/cards.types";

import type { PictureSize } from "./games.types";
import { CUBES_MARK, MarkCube, type MarkCubeProps } from "./MarkCube";
import { pictureBox } from "./picture";
import { centredBaseline } from "@/lib/ui/svgText";

/** A stone in a family's mark: grid row and column, colour, and whether it is faded (a stone being taken, or a ghost). */
type MarkStone = { r: number; c: number; white?: boolean; faded?: boolean };

/**
 * A digit in a family's mark: the Numbers family, where nothing is a stone. A faded one is a cell still to fill.
 * Or a letter, on a tile of the word puzzle's colours (`tile`), for a family whose game is words.
 */
type MarkDigit = { r: number; c: number; value?: number; faded?: boolean; letter?: string; tile?: "hit" | "near" };

/** A letter tile's colours, as the word puzzle paints them: in its place, and in the word elsewhere. */
const TILE_FILL: Record<"hit" | "near", string> = { hit: "var(--moss)", near: "var(--ochre)" };

type Mark = {
  /** Lines per side of the little board. */
  n: number;
  /** Cells rather than lines: Othello and the drop games. */
  cells?: boolean;
  stones: MarkStone[];
  /** Digits in cells, for a family of number puzzles. */
  digits?: MarkDigit[];
  /** An extra stroke drawn over the board, in the same 0..n coordinate space. */
  path?: string;
  /** Strokes in ink, drawn under the stones: the bridges between Logic puzzles' islands. */
  ink?: string;
  /** The digits' size, in cells, where they sit inside a stone rather than on a cell; 0.75 otherwise. */
  digitSize?: number;
  /**
   * Playing cards laid on the board, the site's own (`PlayingCard`'s face and
   * back): each at its centre, in cells, turned by `angle` degrees; a card of
   * null is its back. The Cards family's fan.
   */
  cards?: { card: Card | null; x: number; y: number; angle: number }[];
  /** Mahjong tiles standing on the board, far ones first: top-left corner, and the character on the face, red where `red`. */
  tiles?: { x: number; y: number; glyph: string; red?: boolean }[];
  /** Dominoes lying across, each its top-left corner (one cell high, two long) and its two ends' pips: the Dominoes family's train. */
  dominoes?: { x: number; y: number; ends: readonly [number, number] }[];
  /** A cube seen from above one corner (`MarkCube`): the Cubes family's. */
  cube?: MarkCubeProps;
};

/** Where a domino end's pips sit in its square, for nought to six, in that square's 0..1. */
const MARK_PIPS: Record<number, [number, number][]> = {
  0: [],
  1: [[0.5, 0.5]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]],
};

/** A card's width in a mark, in cells: two cells and a little, so a fan of three fills the little board. */
const MARK_CARD_WIDTH = 2.3;

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
 * a mark with no family but never a family with no mark.
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
   * OTHER: a row of letters, the word puzzle's, two tiles lit green for a
   * letter in its place and one gold for a letter elsewhere — the family's
   * first game in one line, and the one mark on the row made of letters.
   */
  /*
   * The game's own name in its tiles: GOMOJI, 五文字, "five characters".
   * John, 2026-09-25: "replace word drop logo/image with one that says
   * Gomoji… so we should be using the larger boards" — six letters want a
   * six-square board, so this mark is drawn on one.
   */
  Other: {
    n: 6,
    cells: true,
    stones: [],
    digits: [
      { r: 2, c: 0, letter: "G", tile: "hit" },
      { r: 2, c: 1, letter: "O" },
      { r: 2, c: 2, letter: "M", tile: "near" },
      { r: 2, c: 3, letter: "O", tile: "hit" },
      { r: 2, c: 4, letter: "J" },
      { r: 2, c: 5, letter: "I", tile: "hit" },
    ],
  },
  // CUBES: a cube part way to solved (`MarkCube`).
  Cubes: { n: 5, cells: true, stones: [], cube: CUBES_MARK },
  /*
   * MAHJONG: a little stack of tiles, three on the table, two on them and
   * one on top, and the two red dragons 中 that are free — the top tile and
   * the end of the bottom row — the pair the game is about finding.
   */
  Mahjong: {
    n: 5,
    cells: true,
    stones: [],
    tiles: [
      { x: 0.25, y: 2.7, glyph: "中", red: true },
      { x: 1.85, y: 2.7, glyph: "東" },
      { x: 3.45, y: 2.7, glyph: "萬" },
      { x: 1.15, y: 1.4, glyph: "發" },
      { x: 2.75, y: 1.4, glyph: "南" },
      { x: 1.95, y: 0.1, glyph: "中", red: true },
    ],
  },
  /*
   * PARTY GAMES: six players sat round one board, black and white by turns,
   * and the turn going round the table in the middle — the family's whole
   * idea, a game passed from hand to hand, and the one mark on the row with
   * nobody facing anybody.
   */
  /*
   * DOMINOES: a train of three dominoes out of a double in the hub, each tile's
   * near end matching the one before it — the six against the double six,
   * then a four, then a two — the game's one rule in a picture.
   */
  Dominoes: {
    n: 5,
    cells: true,
    stones: [],
    dominoes: [
      { x: 0.15, y: 0.4, ends: [6, 6] },
      { x: 2.4, y: 0.4, ends: [6, 4] },
      { x: 0.15, y: 2.0, ends: [4, 2] },
      { x: 2.4, y: 2.0, ends: [2, 5] },
      { x: 1.3, y: 3.6, ends: [5, 1] },
    ],
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

const PLAIN: Mark = { n: 5, stones: [{ r: 2, c: 2 }] };

/**
 * The family's mark as an inline SVG, at one of the site's three picture sizes.
 *
 * It was sized by whatever class a page handed it, so four pages drew four
 * sizes — 20px in a chip on /games/new, 40 on a game's page, 48 on /games, 64
 * on the family's own. That became one family size, 56px, and then John asked
 * for every picture to be one regular size, the board tile's. So the caller
 * says "small", "regular" or "large" and nothing else (`PICTURE_PX`), and
 * `gamePictures.coverage.test.ts` refuses a size class at any call site.
 * `className` is left for placement only.
 */
export function FamilyMark({ family, size, className = "" }: { family: string; size: PictureSize; className?: string }) {
  const mark = FAMILY_MARKS[family] ?? PLAIN;
  const { n } = mark;
  const cells = mark.cells === true;
  const at = (i: number) => (cells ? i + 0.5 : i);
  const extent = cells ? n : n - 1;
  const pad = 0.6;
  const lines = Array.from({ length: cells ? n + 1 : n }, (_, i) => i);

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${extent + pad * 2} ${extent + pad * 2}`}
      className={`shrink-0 ${className}`.trim()}
      style={pictureBox(size)}
      aria-hidden="true"
      data-testid="family-mark"
      data-family={family}
      data-picture={size}
    >
      <rect
        x={-pad}
        y={-pad}
        width={extent + pad * 2}
        height={extent + pad * 2}
        rx={0.5}
        fill={cells ? "var(--moss-soft)" : "var(--ivory)"}
        stroke="var(--rule-strong)"
        strokeWidth={0.08}
      />
      {lines.map((i) => (
        <g key={i} stroke="var(--rule-strong)" strokeWidth={0.06}>
          <line x1={0} x2={extent} y1={i} y2={i} />
          <line y1={0} y2={extent} x1={i} x2={i} />
        </g>
      ))}
      {(mark.cards ?? []).map(({ card, x, y, angle }, at) => (
        <g key={at} transform={`rotate(${angle} ${x} ${y + MARK_CARD_WIDTH})`}>
          <svg x={x - MARK_CARD_WIDTH / 2} y={y - MARK_CARD_WIDTH * 0.7} width={MARK_CARD_WIDTH} height={MARK_CARD_WIDTH * 1.4} viewBox="0 0 100 140">
            {card === null ? <CardBack /> : <CardFace card={card} />}
          </svg>
        </g>
      ))}
      {mark.ink !== undefined ? <path d={mark.ink} fill="none" stroke="var(--ink)" strokeWidth={0.1} strokeLinecap="round" /> : null}
      {mark.stones.map((stone) => (
        <circle
          key={`${stone.r}-${stone.c}`}
          cx={at(stone.c)}
          cy={at(stone.r)}
          r={0.42}
          fill={stone.white ? "var(--ivory)" : "var(--ink)"}
          stroke="var(--ink)"
          strokeWidth={0.08}
          strokeDasharray={stone.faded ? "0.2 0.15" : undefined}
          opacity={stone.faded ? 0.5 : 1}
        />
      ))}
      {(mark.tiles ?? []).map((tile) => (
        <g key={`${tile.x}-${tile.y}`}>
          <rect x={tile.x - 0.1} y={tile.y + 0.1} width={1.3} height={1.7} rx={0.14} fill="#d9c59b" stroke="#a8926a" strokeWidth={0.05} />
          <rect x={tile.x} y={tile.y} width={1.3} height={1.7} rx={0.14} fill="#fffdf6" stroke="#b9ad96" strokeWidth={0.05} />
          <text x={tile.x + 0.65} y={centredBaseline(tile.y + 0.85, 0.95)} textAnchor="middle" fontSize={0.95} fontWeight={700} fill={tile.red === true ? "#b2302f" : "#22231f"}>
            {tile.glyph}
          </text>
        </g>
      ))}
      {mark.cube === undefined ? null : <MarkCube {...mark.cube} />}
      {(mark.dominoes ?? []).map((domino) => (
        <g key={`${domino.x}-${domino.y}`}>
          <rect x={domino.x} y={domino.y} width={2.3} height={1.15} rx={0.14} fill="#fffdf6" stroke="var(--ink)" strokeWidth={0.06} />
          <line x1={domino.x + 1.15} x2={domino.x + 1.15} y1={domino.y + 0.12} y2={domino.y + 1.03} stroke="var(--ink)" strokeWidth={0.05} />
          {domino.ends.flatMap((end, half) =>
            (MARK_PIPS[end] ?? []).map(([px, py], at) => (
              <circle key={`${half}-${at}`} cx={domino.x + half * 1.15 + 0.1 + px * 0.95} cy={domino.y + 0.1 + py * 0.95} r={0.09} fill="#22231f" />
            )),
          )}
        </g>
      ))}
      {mark.path !== undefined ? (
        <path d={mark.path} fill="none" stroke="var(--shu)" strokeWidth={0.14} strokeLinecap="round" />
      ) : null}
      {(mark.digits ?? []).map((digit) =>
        digit.tile === undefined ? null : (
          <rect key={`t${digit.r}-${digit.c}`} x={digit.c + 0.06} y={digit.r + 0.06} width={0.88} height={0.88} fill={TILE_FILL[digit.tile]} />
        ),
      )}
      {(mark.digits ?? []).map((digit) => (
        <text
          key={`d${digit.r}-${digit.c}`}
          x={at(digit.c)}
          y={centredBaseline(at(digit.r), mark.digitSize ?? 0.75)}
          textAnchor="middle"
          fontSize={mark.digitSize ?? 0.75}
          fontWeight={600}
          fill={digit.tile === undefined ? "var(--ink)" : "var(--ivory)"}
          opacity={digit.faded ? 0.35 : 1}
        >
          {digit.faded ? "?" : (digit.letter ?? digit.value)}
        </text>
      ))}
    </svg>
  );
}
