import { COLUMN_LETTERS } from "@/lib/gomoku/board.constants";
import { SGF_POINT_LETTERS } from "./sgf.constants";
import type { Point } from "@/lib/gomoku/gomoku.types";

/**
 * A MOVES LIST SOMEBODY PASTED IN, READ BACK INTO POINTS.
 *
 * John, 2026-09-21: "you can paste a moves list to view that game and browse
 * around. accept several published formats on that game. be flexible for badly
 * formatted moves."
 *
 * The lists people actually have came out of forum posts, emails and the
 * export buttons of five different sites, and none of them agree. So this is
 * three readers and one tidier, and which readers are offered is the game's
 * question rather than this module's — see `formatsFor`.
 *
 * IT SAYS WHAT IT COULD NOT READ, AND WHERE. A reader that drops what it does
 * not understand turns a misprint into a different game, silently, and the
 * person pasting has no way to tell. So a list that goes wrong halfway comes
 * back as the moves up to that point AND the word it stopped on — the board
 * shows what could be read and the screen says why it stopped, which is the
 * ticket's own requirement and the house rule about answering what you cannot.
 *
 * NOTHING HERE DECIDES WHETHER A MOVE IS LEGAL. This turns text into points on
 * a board of a given size; the engine is asked whether they can be played, by
 * the caller, one at a time. A reader that judged legality would be a second
 * copy of the rules, and a wrong one.
 */

/** The formats a list may be written in. */
export const MOVE_FORMATS = {
  /** `H8 K10`, `h8k10`, `8,8` — a column and a row, in this site's own notation. */
  coordinates: "coordinates",
  /** `f5d6c3` — two letters a square, run together, as Othello is published. */
  squares: "squares",
  /** `;B[pd];W[dp]` — SGF, which `sgf.ts` already writes. */
  sgf: "sgf",
  /**
   * ItsYourTurn's move list, `1. f6 g7  2. g6 h6`: lowercase squares whose
   * columns run a, b, c… WITH i, and whose rows count from the BOTTOM.
   */
  itsYourTurn: "itsYourTurn",
  /**
   * GoldToken's Past Moves table, `1 H8 I9`: capital squares whose columns run
   * A, B, C… WITH I, and whose rows count from the TOP — its board is numbered
   * 1 along the top edge.
   */
  goldToken: "goldToken",
} as const;

export type MoveFormat = (typeof MOVE_FORMATS)[keyof typeof MOVE_FORMATS];

export type MovesRead = {
  /** Every point that could be read, in order. */
  points: Point[];
  /** The format it turned out to be, or null when nothing could be read at all. */
  format: MoveFormat | null;
  /**
   * What stopped it, in words, or null when the whole list was read. The moves
   * before it are still in `points`: a half-read list is more use than none,
   * as long as the reader is told it is half.
   */
  problem: string | null;
};

/**
 * WHAT IS DECORATION AND WHAT IS A MOVE.
 *
 * Every one of these was in a real list. Full-width digits and letters come
 * off a Japanese keyboard and look identical to a reader; the letter O for a
 * zero is a typist's habit; `1.` and `23.` are move numbers a forum post puts
 * in front; `1-0`, `0-1`, `1/2-1/2`, `resigns` and `resign` are the result
 * somebody pasted along with the game.
 */
function tidy(text: string): string {
  return (
    text
      /*
       * Full-width to ASCII first, before anything else looks at a character.
       * Ｈ８ and H8 are the same move and only one of them is readable, and a
       * reader that tried the ASCII rules on the wide forms would report a
       * misprint on a list that was never wrong.
       */
      .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace(/　/g, " ")
      // A result at the end is not a move. Anchored to the end, so a game
      // between players called Resign and 1-0 is still read (they exist).
      .replace(/\s*(1\s*-\s*0|0\s*-\s*1|1\/2\s*-\s*1\/2|½-½|resigns?|resigned|draw|drawn|\*)\s*$/i, "")
      // Move numbers in front of a move: "1." "23)" "45:" — never a bare digit,
      // which in "8,8" is the move itself.
      .replace(/(^|[\s,;])\d{1,3}\s*[.):]\s*/g, "$1")
      // Every kind of whitespace is one space.
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** A zero somebody typed as a letter, inside a run of digits. */
function digitsFixed(text: string): string {
  return text.replace(/(?<=\d)[Oo](?=\d|\b)/g, "0");
}

/** Which formats are worth offering for this game, in the order they are tried. */
export function formatsFor(variant: string, spec: { flips?: boolean; go?: boolean }): MoveFormat[] {
  /*
   * ORDERED BY WHAT THIS GAME IS ACTUALLY PUBLISHED IN, because the order is
   * what decides an ambiguous list. "f5d6c3" is three Othello squares and also
   * reads as the coordinates F5, D6, C3 — the same three points, as it happens,
   * which is why the two agree wherever they overlap. Where they do not, the
   * game's own convention is the better guess.
   */
  if (spec.flips) return [MOVE_FORMATS.squares, MOVE_FORMATS.coordinates, MOVE_FORMATS.sgf];
  if (spec.go) return [MOVE_FORMATS.sgf, MOVE_FORMATS.coordinates];
  return [MOVE_FORMATS.coordinates, MOVE_FORMATS.sgf];
}

/** The column a letter names, with I skipped as on a go board, or -1. */
function columnOf(letter: string): number {
  return COLUMN_LETTERS.indexOf(letter.toUpperCase());
}

/** `H8` on a board of `size`, as a point, or null when it is off the board. */
function pointOfCoordinate(column: number, row: number, size: number): Point | null {
  if (column < 0 || column >= size) return null;
  // Rows are counted from the bottom edge, so row 1 is the last array row.
  const arrayRow = size - row;
  if (arrayRow < 0 || arrayRow >= size) return null;
  return { row: arrayRow, col: column };
}

/**
 * `H8 K10`, `h8k10`, `8,8`. A column letter and a row number, or two numbers
 * separated by anything that is not a digit.
 */
function readCoordinates(text: string, size: number): MovesRead {
  const points: Point[] = [];
  const words = digitsFixed(text).match(/[A-Za-z]\s?\d{1,2}|\d{1,2}\s*[,.\-x]\s*\d{1,2}/g) ?? [];
  // Whatever is left once the moves are taken out: if it is not punctuation, it is a word nobody read.
  const rest = digitsFixed(text).replace(/[A-Za-z]\s?\d{1,2}|\d{1,2}\s*[,.\-x]\s*\d{1,2}/g, " ").replace(/[\s,;.]+/g, "");
  for (const word of words) {
    const letter = /^([A-Za-z])\s?(\d{1,2})$/.exec(word);
    const pair = /^(\d{1,2})\s*[,.\-x]\s*(\d{1,2})$/.exec(word);
    const point = letter
      ? pointOfCoordinate(columnOf(letter[1]!), Number(letter[2]), size)
      : pair
        ? // A pair is column then row, both counted from one, which is how a
          // person writing "8,8" means the centre of a fifteen board.
          pointOfCoordinate(Number(pair[1]) - 1, Number(pair[2]), size)
        : null;
    if (point === null) return { points, format: MOVE_FORMATS.coordinates, problem: offBoard(word, size) };
    points.push(point);
  }
  if (points.length === 0) return { points, format: null, problem: null };
  return {
    points,
    format: MOVE_FORMATS.coordinates,
    problem: rest === "" ? null : `Could not read "${rest.slice(0, 12)}".`,
  };
}

/** `f5d6c3` — two characters a square, run together, as Othello is published. */
function readSquares(text: string, size: number): MovesRead {
  const bare = digitsFixed(text).replace(/[\s,;.]/g, "");
  if (!/^(?:[A-Za-z]\d){2,}$/.test(bare)) return { points: [], format: null, problem: null };
  const points: Point[] = [];
  for (const square of bare.match(/[A-Za-z]\d/g) ?? []) {
    const point = pointOfCoordinate(columnOf(square[0]!), Number(square[1]), size);
    if (point === null) return { points, format: MOVE_FORMATS.squares, problem: offBoard(square, size) };
    points.push(point);
  }
  return { points, format: MOVE_FORMATS.squares, problem: null };
}

/**
 * `;B[pd];W[dp]` — SGF, the format `sgf.ts` writes.
 *
 * SGF counts from the TOP LEFT, unlike everything else here: `aa` is the
 * corner the board is drawn from rather than the one a player would call A1.
 * An empty pair — `B[]` — is a pass, which this reader refuses rather than
 * guesses at, because a pass is a turn and this returns points.
 */
function readSgf(text: string, size: number): MovesRead {
  const nodes = text.match(/;\s*[BW]\s*\[[^\]]*\]/gi) ?? [];
  if (nodes.length === 0) return { points: [], format: null, problem: null };
  const points: Point[] = [];
  for (const node of nodes) {
    const inside = /\[([^\]]*)\]/.exec(node)?.[1]?.trim() ?? "";
    if (inside === "" || inside === "tt") {
      return { points, format: MOVE_FORMATS.sgf, problem: "That list has a pass in it, which this board cannot take yet." };
    }
    const col = SGF_POINT_LETTERS.indexOf(inside[0] ?? "");
    const row = SGF_POINT_LETTERS.indexOf(inside[1] ?? "");
    if (col < 0 || row < 0 || col >= size || row >= size) {
      return { points, format: MOVE_FORMATS.sgf, problem: offBoard(inside, size) };
    }
    points.push({ row, col });
  }
  return { points, format: MOVE_FORMATS.sgf, problem: null };
}

/**
 * ANOTHER SITE'S LIST, READ BY THAT SITE'S OWN RULES. John, 2026-09-23, with a
 * game open on each: bring a game over from ItsYourTurn or GoldToken to look
 * at here. The site cannot fetch them — ItsYourTurn's games need its login and
 * GoldToken's robots.txt closes its game pages — so the player copies the move
 * list from their own screen and pastes it.
 *
 * Each site letters its columns straight through the alphabet, I included,
 * where this site skips I as a Go board does; and GoldToken counts its rows
 * from the top. Reading either with this site's own rules puts every stone
 * past H one column over, and every GoldToken stone upside down — a different
 * game, and a legal-looking one. So each has a reader of its own.
 *
 * Only the squares are read: everything round them in a copied page — the
 * move numbers, "Prev" and "Next", a table's heading and the players' names —
 * is left alone, because the reader was told which site it is and the squares
 * are the only thing in the paste written in that site's case.
 */
function readSite(text: string, size: number, format: MoveFormat, square: RegExp, fromTop: boolean): MovesRead {
  const points: Point[] = [];
  for (const [word, letter, digits] of text.matchAll(square)) {
    const col = letter!.toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
    const row = Number(digits);
    const arrayRow = fromTop ? row - 1 : size - row;
    if (col >= size || row < 1 || row > size) return { points, format, problem: offBoard(word, size) };
    points.push({ row: arrayRow, col });
  }
  return { points, format: points.length === 0 ? null : format, problem: null };
}

/**
 * Which of the other sites a pasted list came from, when it says so plainly,
 * or null.
 *
 * Only on a sign this site's own lists never carry, because a wrong guess here
 * is a different game: "1. h8 k10" is this site's notation typed in lowercase
 * as well as ItsYourTurn's, and read as ItsYourTurn every stone past H moves a
 * column. So a list is taken for one of them only when it has that site's own
 * heading, or a square in column I — a letter this site never writes. Anything
 * else is read the usual ways, and the reader can say where it came from.
 */
export function siteOf(text: string): MoveFormat | null {
  const numberedLower = /^\s*\d+\.\s*[a-z]\d{1,2}(\s+[a-z]\d{1,2})?\s*$/m.test(text);
  if (numberedLower && (/Past Moves/i.test(text) || /\bi\d{1,2}\b/.test(text))) return MOVE_FORMATS.itsYourTurn;
  const turnRows = /^\s*\d+\s+[A-Z]\d{1,2}(\s+[A-Z]\d{1,2})?\s*$/m.test(text);
  if (turnRows && (/\(Player [12]\)/.test(text) || /\bI\d{1,2}\b/.test(text))) return MOVE_FORMATS.goldToken;
  return null;
}

/** The same sentence wherever a move lands outside the board, so one wording is read twice. */
function offBoard(word: string, size: number): string {
  return `"${word}" is not a point on a ${size}×${size} board.`;
}

const READERS: Record<MoveFormat, (text: string, size: number) => MovesRead> = {
  [MOVE_FORMATS.coordinates]: readCoordinates,
  [MOVE_FORMATS.squares]: readSquares,
  [MOVE_FORMATS.sgf]: readSgf,
  [MOVE_FORMATS.itsYourTurn]: (text, size) => readSite(text, size, MOVE_FORMATS.itsYourTurn, /\b([a-z])(\d{1,2})\b/g, false),
  [MOVE_FORMATS.goldToken]: (text, size) => readSite(text, size, MOVE_FORMATS.goldToken, /\b([A-Z])(\d{1,2})\b/g, true),
};

/**
 * The moves in a pasted list, tried in the order this game is published in.
 *
 * THE FIRST READER THAT FINDS ANYTHING WINS, and a reader that finds nothing
 * says nothing — `format: null` — rather than reporting a misprint about a
 * format the list was never in. Only when every reader has come up empty is
 * the list reported as unreadable, once, in one sentence.
 */
export function readMoves(text: string, size: number, formats: readonly MoveFormat[]): MovesRead {
  const tidied = tidy(text);
  if (tidied === "") return { points: [], format: null, problem: null };
  for (const format of formats) {
    // Another site's reader takes only its own squares, so it is given the paste as it came.
    const site = format === MOVE_FORMATS.itsYourTurn || format === MOVE_FORMATS.goldToken;
    const read = READERS[format](site ? text : tidied, size);
    if (read.format !== null) return read;
  }
  return {
    points: [],
    format: null,
    problem: "Could not read any moves in that. Try a list like H8 K10 J9, or an SGF game.",
  };
}
