import { jumpAt, type Game, type Jump } from "@johnmorrisdotca/tobiishi";

/**
 * A RUN OF JUMPS, AS THE SITE KEEPS IT: four characters a jump, the column and
 * the row of the hole the peg left and then of the hole it landed in, each in
 * base 36. A hole is named by where it sits on the board and never by its place
 * in the package's list of holes, so a run is read the same on the same board
 * even if the package were to order its holes another way. The most any level
 * has is nine jumps, so a whole answer is 36 characters, and a run kept half way
 * is a prefix of one that is finished.
 *
 * Both a finished answer and a kept run are written so, and a reader replays
 * them from the level's own starting position: a jump that is not legal where
 * the run has got to reads as null, and nothing is guessed.
 */
const FOUR = /^(?:[0-9a-z]{4})*$/;

/** The most jumps any level has: its hardest length. */
export const TOBIISHI_MOST_JUMPS = 9;

/** The jumps a game has made, from its start. */
export function encodeJumps(game: Game): string {
  let out = "";
  for (const jump of game.history) {
    const from = game.board.cells[jump.from]!;
    const to = game.board.cells[jump.to]!;
    out += `${from.x.toString(36)}${from.y.toString(36)}${to.x.toString(36)}${to.y.toString(36)}`;
  }
  return out;
}

/** The jumps a code names, as the holes they leave and land in; null for text that is not a run of four-character jumps. */
export function readJumps(code: string): { fx: number; fy: number; tx: number; ty: number }[] | null {
  if (!FOUR.test(code)) return null;
  const out: { fx: number; fy: number; tx: number; ty: number }[] = [];
  for (let at = 0; at < code.length; at += 4) {
    out.push({ fx: parseInt(code[at]!, 36), fy: parseInt(code[at + 1]!, 36), tx: parseInt(code[at + 2]!, 36), ty: parseInt(code[at + 3]!, 36) });
  }
  return out;
}

/** The index of the hole at a column and a row, or -1 for no hole there. */
function holeAt(game: Game, x: number, y: number): number {
  return game.board.cells.findIndex((cell) => cell.x === x && cell.y === y);
}

/** A starting game with a run played on it, or null if any jump of it is not legal where the run has got to. */
export function replayJumps(start: Game, code: string): Game | null {
  const jumps = readJumps(code);
  if (jumps === null || jumps.length > TOBIISHI_MOST_JUMPS) return null;
  let game = start;
  for (const { fx, fy, tx, ty } of jumps) {
    const from = holeAt(game, fx, fy);
    const to = holeAt(game, tx, ty);
    if (from < 0 || to < 0) return null;
    const next = jumpAt(game, from, to);
    // A jump that is not legal hands the same game back.
    if (next === game) return null;
    game = next;
  }
  return game;
}

/** The run of a package's own jumps (a challenge's answer), written as the site keeps one: played on the start to read the holes. */
export function encodeAnswer(start: Game, answer: readonly Jump[]): string | null {
  let game = start;
  for (const jump of answer) {
    const next = jumpAt(game, jump.from, jump.to);
    if (next === game) return null;
    game = next;
  }
  return encodeJumps(game);
}

/** Whether text could be a run: its alphabet and its length, which is all it can be read against without its board (`replayJumps` reads the rest when it is opened). */
export function jumpsFit(code: string): boolean {
  return FOUR.test(code) && code.length <= TOBIISHI_MOST_JUMPS * 4;
}
