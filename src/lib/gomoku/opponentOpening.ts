import { isStone } from "./engine";
import { MOVE_KINDS, OPENING_RULES, VARIANT_SPECS } from "./gomoku.constants";
import { lineApplies } from "./expert/lineExpert";
import type { GameState, Point } from "./gomoku.types";
import type { BotTurn } from "./opponent.types";

/**
 * THE OPENING, played from a book rather than worked out the same way every
 * time (board ticket BOT-04).
 *
 * The chooser reads a position and takes the best move it sees, so every game
 * against it began the same way: the centre, the same reply to a centre stone,
 * the same third stone. Nothing about that is weak — the centre is the right
 * first stone — but it is the same game every time, and a person playing the
 * computer a second time should not be able to predict its first three moves.
 *
 * A player's book is a short list of good ways to start, and so is this:
 *
 * - **The first stone** stays in the centre. It is the strongest stone on the
 *   board and every opening a five-in-a-row player learns begins there.
 * - **The reply to a lone stone** is any of the eight points touching it — the
 *   direct openings and the diagonal ones, which is the whole of what a player
 *   answers the centre with. Chosen at random, all eight equally.
 * - **The third stone** is chosen at random from the few this player itself
 *   rates highest within two points of the first — the ground every one of the
 *   twenty-six named openings is played on.
 *
 * After that the game is the chooser's, as it always was. Only for games read
 * by their lines, on an open board with the free opening: the pro openings
 * decide these stones by rule, and a board with obstacles or holes is not the
 * board a book is written for.
 */

/** How many of the chooser's highest-rated third stones the book picks among. */
export const BOOK_THIRD_CHOICES = 5;

/** Whether this position is still inside the book: a line game, the free opening, fewer than three stones. */
export function inTheBook(state: GameState): boolean {
  const spec = VARIANT_SPECS[state.settings.variant];
  if (spec === undefined || !lineApplies(spec)) return false;
  if (state.settings.opening !== OPENING_RULES.free) return false;
  if (state.moves.length < 1 || state.moves.length > 2) return false;
  // An open board: nothing on it but stones. Obstacles and holes are another game's opening.
  return state.board.every((cell) => cell === null || isStone(cell));
}

/** The first stone on the board, which the book's stones are placed around. */
function firstStone(state: GameState): Point | null {
  const { size } = state.settings;
  const at = state.board.findIndex((cell) => isStone(cell));
  return at === -1 ? null : { row: Math.floor(at / size), col: at % size };
}

/** How far a placement is from a point, in king steps. */
function reach(turn: BotTurn, from: Point): number | null {
  if (turn.kind !== MOVE_KINDS.place) return null;
  return Math.max(Math.abs(turn.row - from.row), Math.abs(turn.col - from.col));
}

/**
 * The book's move here, or null to let the chooser decide.
 *
 * Takes the chooser's own scored placements — every legal one, already
 * checked by the engine — so the book can never offer a move the rules refuse,
 * and the third stone is picked among moves this player already rates.
 */
export function openingTurn(
  state: GameState,
  scored: readonly { turn: BotTurn; score: number }[],
  random: () => number,
): BotTurn | null {
  if (!inTheBook(state)) return null;
  const centre = firstStone(state);
  if (centre === null) return null;

  if (state.moves.length === 1) {
    const touching = scored.filter((entry) => reach(entry.turn, centre) === 1);
    if (touching.length === 0) return null;
    return touching[Math.min(touching.length - 1, Math.floor(random() * touching.length))].turn;
  }

  const near = scored
    .filter((entry) => {
      const distance = reach(entry.turn, centre);
      return distance !== null && distance <= 2;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, BOOK_THIRD_CHOICES);
  if (near.length === 0) return null;
  return near[Math.min(near.length - 1, Math.floor(random() * near.length))].turn;
}
