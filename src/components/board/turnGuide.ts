import { TURN_CHOICE_KINDS } from "@/lib/gomoku/gomoku.constants";
import { indexOf } from "@/lib/gomoku/engine";
import { pointName } from "@/lib/gomoku/notation";
import type { Cell, GameState, TurnChoices } from "@/lib/gomoku/gomoku.types";
import { FEW_LEGAL_MOVES, SQUARE_GUIDES, TURN_GUIDE_COPY } from "./Board.constants";
import type { SquareGuide, TurnGuide } from "./board.types";

/**
 * What the board shows a player about their own turn, or null when it shows
 * nothing.
 *
 * John, on a Checkers board with a capture on offer: "there's no indicator that
 * my leading black should jump… for a forced play, the others are
 * non-selectable and even greyed out/dimmer ever so slightly." And then, on
 * Othello: "when there's only 1 possible move, or two, we might as well
 * highlight the moves and dim the ones that aren't possible. It's not cheating
 * or helping the player. it's just making game play faster since that's all
 * they can do."
 *
 * So two cases, and both read the engine's own answer (`turnChoices`) — nothing
 * here decides what is legal:
 *
 * - A RULE NARROWED THE CHOICE: a capture is compulsory, or the longest one is.
 *   The pieces that may move are marked and the mover's other pieces are dimmed
 *   and not offered, however many moves there are, and the rule is said in
 *   words on screen.
 * - THERE IS ONLY A MOVE OR TWO (`FEW_LEGAL_MOVES`): the pieces or the points
 *   are marked, the mover's other pieces dimmed or the other empty points
 *   veiled. Nothing is said on screen, because nothing needs explaining; a
 *   screen reader is told the choices.
 *
 * A turn with more to choose from than that, narrowed by nothing, is left
 * exactly as it was: marking forty points is not a guide, it is noise.
 */
export function turnGuide(state: GameState, choices: TurnChoices | null): TurnGuide | null {
  if (choices === null || choices.count === 0) return null;
  const { size } = state.settings;

  if (choices.kind === TURN_CHOICE_KINDS.move) {
    if (choices.narrowedBy === null && choices.count > FEW_LEGAL_MOVES) return null;
    const marked = new Set(choices.pieces.map((point) => indexOf(size, point)));
    const unavailable = new Set<number>();
    state.board.forEach((cell, index) => {
      if (cell === state.toPlay && !marked.has(index)) unavailable.add(index);
    });
    return { marked, unavailable, veiled: false, reason: choices.narrowedBy, choices: choices.pieces };
  }

  if (choices.count > FEW_LEGAL_MOVES) return null;
  return {
    marked: new Set(choices.points.map((point) => indexOf(size, point))),
    unavailable: new Set<number>(),
    veiled: true,
    reason: null,
    choices: choices.points,
  };
}

/**
 * What one square is under the guide: a choice, a piece that may not move,
 * veiled, or nothing.
 *
 * Only an EMPTY square is ever veiled. The first version veiled every square
 * that was not a move, stones included, and on the paper board that turned
 * Reversi's black discs grey beside its white ones — a picture of the position
 * that was wrong about whose disc was whose. What is not on offer is the empty
 * points; a stone was never a move, and is drawn as it is.
 */
export function squareGuide(guide: TurnGuide | null, index: number, cell: Cell): SquareGuide | null {
  if (guide === null) return null;
  if (guide.marked.has(index)) return SQUARE_GUIDES.choice;
  if (guide.unavailable.has(index)) return SQUARE_GUIDES.unavailable;
  return guide.veiled && cell === null ? SQUARE_GUIDES.veiled : null;
}

/**
 * The guide in words: the rule, shown on screen, when a rule narrowed the
 * choice; and the choices by name, for a screen reader, always.
 */
export function turnGuideWords(guide: TurnGuide, size: number): { shown: string | null; spoken: string } {
  const names = guide.choices.map((point) => pointName(size, point));
  const listed = names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return {
    shown: guide.reason === null ? null : TURN_GUIDE_COPY[guide.reason],
    spoken: guide.veiled
      ? TURN_GUIDE_COPY.onlyMoves(names.length, listed)
      : TURN_GUIDE_COPY.piecesThatMayMove(names.length, listed),
  };
}
