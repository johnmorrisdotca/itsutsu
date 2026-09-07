import {
  createGame,
  forbiddenAt,
  isLegalMove,
  playMove,
} from "./engine";
import {
  GAME_STATUS,
  OPENING_RULES,
  RULE_VARIANT_LIST,
  VARIANT_SPECS,
  WIN_REASONS,
} from "./gomoku.constants";
import type {
  ForbiddenPattern,
  GameState,
  RuleVariant,
  Stone,
} from "./gomoku.types";

/**
 * What a game would have looked like under the other rule sets.
 *
 * `forbiddenElsewhere`: a stone that variant would not have allowed.
 * `wouldNotWin`: the winning line would not have counted there.
 * `earlierWin`: that variant would have ended the game sooner, on this move.
 * `captureElsewhere`: this stone would have taken a pair there.
 */
export type ReviewNoteKind =
  | "forbiddenElsewhere"
  | "wouldNotWin"
  | "earlierWin"
  | "captureElsewhere";

export type ReviewNote = {
  kind: ReviewNoteKind;
  variant: RuleVariant;
  /** 1-based, as the record numbers them. */
  moveNumber: number;
  stone: Stone;
  /** Set for `forbiddenElsewhere`: the shape that variant forbids. */
  pattern: ForbiddenPattern | null;
};

/**
 * Replays a finished (or unfinished) game under every other variant with the
 * same shape of turn and line, and reports where the two would have parted
 * ways. Each variant contributes at most one note, at the first divergence,
 * because after it the two boards no longer describe the same game.
 *
 * Pure, and advisory only: nothing here changes what happened.
 */
export function reviewAcrossVariants(state: GameState): ReviewNote[] {
  const { settings, moves } = state;
  if (moves.length === 0) return [];
  const own = VARIANT_SPECS[settings.variant];
  const notes: ReviewNote[] = [];

  for (const variant of RULE_VARIANT_LIST) {
    if (variant === settings.variant) continue;
    const spec = VARIANT_SPECS[variant];
    // A different rhythm of turns or length of line is a different game entirely.
    if (spec.stonesPerTurn !== own.stonesPerTurn) continue;
    if ((spec.winLength ?? settings.winLength) !== settings.winLength) continue;

    const note = firstDivergence(state, variant);
    if (note !== null) notes.push(note);
  }
  return notes;
}

function firstDivergence(state: GameState, variant: RuleVariant): ReviewNote | null {
  const { settings, moves } = state;
  let alt = createGame({
    ...settings,
    variant,
    opening: OPENING_RULES.free,
    firstPlayer: state.opener,
    allowSkip: true,
  });

  for (let index = 0; index < moves.length; index += 1) {
    const move = moves[index];
    const moveNumber = index + 1;
    const last = index === moves.length - 1;

    if (alt.toPlay !== move.stone) return null;
    if (!isLegalMove(alt, move)) {
      const pattern = forbiddenAt(alt.board, alt.settings, move.stone, move);
      // Anything but a forbidden shape means the boards had already parted.
      if (pattern === null) return null;
      return { kind: "forbiddenElsewhere", variant, moveNumber, stone: move.stone, pattern };
    }

    alt = playMove(alt, move, move.kind);
    const played = alt.moves[alt.moves.length - 1];
    if (played?.captured !== undefined) {
      return { kind: "captureElsewhere", variant, moveNumber, stone: move.stone, pattern: null };
    }

    const altWon = alt.status === GAME_STATUS.won;
    if (altWon && !(last && state.status === GAME_STATUS.won)) {
      return { kind: "earlierWin", variant, moveNumber, stone: move.stone, pattern: null };
    }
    if (
      last &&
      state.status === GAME_STATUS.won &&
      state.winBy === WIN_REASONS.line &&
      !altWon
    ) {
      return { kind: "wouldNotWin", variant, moveNumber, stone: move.stone, pattern: null };
    }
  }
  return null;
}
