import { STONES, WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";

/**
 * WHAT A FINISHED GAME PAYS IN IP, ITSUTSU POINTS: the most one game of it can be
 * worth, and a share of that for each way a game ends. John, 2026-09-25: "a
 * table of maximum weights per game… and then we work back what someone scores
 * for a victory or a loss or a complex result" — and, of games having scored
 * nothing until now, "it's something we should've done from the beginning".
 *
 * THE MAXIMUM is 100 times the game's weight: Gomoku on 15×15 is 1.0, and the
 * weight says how much a game asks, how long it runs and how deep it goes,
 * from tic-tac-toe's 0.1 to Go on 19×19's 2.0. A game with several boards is
 * weighed by the board it was played on. `docs/plans/points/PTS-02-game-points.md`
 * has the reasoning; this table is the one place the numbers live, a Record so
 * a new game cannot ship without one.
 *
 * Pure, and read from facts the result already records, so the same function
 * prices a game as it ends and every game already finished.
 *
 * WHAT IS NOT PRICED AT ALL: a practice board, which lives in one browser and
 * whose result nothing checks, and a game at one screen (pass and play), where
 * nobody can tell who played which side. Only a recorded game between two seats
 * pays, a program's seat included — the same line the puzzles draw, which pay
 * only once the server has checked the grid.
 */
type Weight = { weight: number; bySize?: Readonly<Record<number, number>> };

/** The five-in-a-row boards, 9 to 19, around Gomoku's 15. */
const FIVE: Weight = { weight: 1, bySize: { 9: 0.7, 13: 0.9, 15: 1, 19: 1.2 } };
/** The same boards a step up, for the games that ask a little more of the same board. */
const FIVE_PLUS = (step: number): Weight => ({
  weight: 1 + step,
  bySize: Object.fromEntries(Object.entries(FIVE.bySize!).map(([size, weight]) => [size, Math.round((weight + step) * 100) / 100])),
});
const HEX_LATTICE: Weight = { weight: 1, bySize: { 7: 0.6, 9: 0.8, 11: 1, 13: 1.2 } };
const DROP: Weight = { weight: 0.6, bySize: { 7: 0.5, 9: 0.6, 10: 0.7 } };

export const GAME_POINTS_WEIGHT: Record<RuleVariant, Weight> = {
  freestyle: FIVE,
  standard: FIVE,
  renju: FIVE_PLUS(0.1),
  omok: FIVE,
  caro: FIVE,
  connect6: FIVE_PLUS(0.2),
  misereFive: FIVE,
  hexFive: HEX_LATTICE,
  dropFour: DROP,
  ringDrop: DROP,
  holeDrop: DROP,
  hotDrop: DROP,
  clearDrop: DROP,
  giveawayDrop: DROP,
  edgeDrop: DROP,
  wormDrop: DROP,
  reversi: { weight: 1 },
  classicReversi: { weight: 1 },
  antiReversi: { weight: 1 },
  miniReversi: { weight: 0.5, bySize: { 4: 0.25, 6: 0.5, 8: 1 } },
  grandReversi: { weight: 1.3 },
  honeycomb: HEX_LATTICE,
  ninuki: FIVE_PLUS(0.1),
  sannuki: FIVE_PLUS(0.1),
  toroidalFive: FIVE,
  obstacleFive: FIVE,
  dominoFive: { weight: 1.1, bySize: { 13: 1, 15: 1.1, 19: 1.3 } },
  blockFive: { weight: 1.1, bySize: { 13: 1, 15: 1.1, 19: 1.3 } },
  twistFive: { weight: 0.7 },
  twistFour: { weight: 0.4 },
  checkers: { weight: 1 },
  internationalDraughts: { weight: 1.4 },
  brazilianDraughts: { weight: 1 },
  canadianCheckers: { weight: 1.6 },
  russianDraughts: { weight: 1 },
  poolCheckers: { weight: 1 },
  go: { weight: 2, bySize: { 9: 0.8, 13: 1.2, 19: 2 } },
  hex: { weight: 1, bySize: { 11: 1, 13: 1.2, 19: 1.6 } },
  halma: { weight: 1.6, bySize: { 8: 0.6, 10: 0.9, 16: 1.6 } },
  chineseCheckers: { weight: 1.4 },
  tictactoe: { weight: 0.1 },
  wildTicTacToe: { weight: 0.1 },
  notakto: { weight: 0.15 },
  trapThree: { weight: 0.3 },
  squareFour: { weight: 0.3 },
  makerBreaker: { weight: 0.4 },
};

/** The most one game of this can pay: 100 times its weight on the board it was played on. */
export function gameMax(variant: RuleVariant, size: number): number {
  const row = GAME_POINTS_WEIGHT[variant];
  return Math.round(100 * (row.bySize?.[size] ?? row.weight));
}

/**
 * EACH RESULT AS A SHARE OF THE MAXIMUM, winner and loser. IP is ability and
 * nothing else — John, 2026-09-25: "XP is site wide experience and maturity,
 * like in D&D… and IP aka Points is only about games. Pure ability" — so a loss
 * pays nothing for having taken part (that is XP's), and only a close score
 * earns the loser anything. A game given up early, or won on the clock, pays
 * the winner less; a head start or a handicap in the winner's favour takes a
 * quarter off the win; and a game nobody finished pays nobody.
 */
export const RESULT_SHARES = {
  /** Won on the board: a line, captures, territory, discs, the camp, a blocked side. */
  won: { winner: 1, loser: 0 },
  /** What a close score earns the loser: up to 20% of the most, at a dead heat. */
  closeLoss: 0.2,
  /** The other side resigned from the tenth move on. */
  resigned: { winner: 1, loser: 0 },
  /** The other side resigned before the tenth move: hardly a game. */
  resignedEarly: { winner: 0.5, loser: 0 },
  /** Won on the clock. */
  time: { winner: 0.8, loser: 0 },
  /** Drawn, for any reason. */
  drawn: 0.5,
  /** The winner had the head start, or the handicap was the loser's. */
  favoured: 0.75,
  /** Moves before a resignation counts as a game. */
  resignFromMove: 10,
  /**
   * THE OPPONENT'S STRENGTH, in a rated game: the win is worth up to half as
   * much again for beating somebody the ratings expected to win, and down to
   * half for beating somebody they expected to lose. Read from the winner's
   * expected score before the game (Elo's own), 1 + 0.5 × (1 − 2E): an even
   * game pays the win as it is. A program is rated in its own pool, so the same
   * rule prices beating the easiest program low and the strongest high.
   */
  upset: 0.5,
  /**
   * THE SAME TWO PLAYERS AGAIN THE SAME DAY: the first game pays in full, the
   * second half, every one after that a quarter, so the board rewards playing
   * many people rather than one person many times.
   */
  again: [1, 0.5, 0.25],
} as const;

/** How a finished game ended, as its result records it. */
export type PricedResult = {
  variant: RuleVariant;
  size: number;
  /** The colour that won; null for a draw or a game nobody finished. */
  winner: Stone | null;
  /** True for a draw; false for a win or a game abandoned or cancelled. */
  drawn: boolean;
  /** Why it was won (`WIN_REASONS`), where it was. */
  reason: string | null;
  /** The score where the rules keep one: pairs captured, discs, area. */
  score: { black: number; white: number } | null;
  moveCount: number;
  /** The colour given free turns, if any (`HeadStart.stone`). */
  headStartFor: Stone | null;
  /** The colour carrying extra rules, if any (`Handicap.stone`). */
  handicapOn: Stone | null;
  /**
   * The winner's expected score before the game, from the two ratings of a
   * rated game (0 to 1); null for an unrated one, which is paid as it stands.
   */
  winnerExpected: number | null;
  /** How many games the same two seats finished earlier the same day (0 for the first). */
  earlierToday: number;
  /** A game at one screen (pass and play): nobody can say who played which side, so it pays nothing. */
  oneScreen: boolean;
};

/** The two ratings at this game before it moved them, as `recordResult` read them; null for a game it did not rate. */
export type RatingsBefore = { black: number; white: number };

/** Elo's expected score for a player rated `mine` against one rated `theirs`. */
export function expectedScore(mine: number, theirs: number): number {
  return 1 / (1 + 10 ** ((theirs - mine) / 400));
}

/** What each seat is paid for a finished game, in site points. Nothing for a game nobody finished. */
export function gamePoints(result: PricedResult): { black: number; white: number } {
  if (result.oneScreen) return { black: 0, white: 0 };
  const max = gameMax(result.variant, result.size);
  if (result.drawn) {
    const again = RESULT_SHARES.again[Math.min(result.earlierToday, RESULT_SHARES.again.length - 1)] ?? 0;
    const each = Math.round(max * RESULT_SHARES.drawn * again);
    return { black: each, white: each };
  }
  if (result.winner === null) return { black: 0, white: 0 };
  const loser = result.winner === STONES.black ? STONES.white : STONES.black;

  const shares =
    result.reason === WIN_REASONS.resign
      ? result.moveCount < RESULT_SHARES.resignFromMove
        ? RESULT_SHARES.resignedEarly
        : RESULT_SHARES.resigned
      : result.reason === WIN_REASONS.time
        ? RESULT_SHARES.time
        : RESULT_SHARES.won;

  // A loss on the board by a close score is worth more: the loser's score over the winner's, up to 20% more.
  const onTheBoard = shares === RESULT_SHARES.won;
  const theirs = result.score?.[loser] ?? 0;
  const ours = result.score?.[result.winner] ?? 0;
  const close = onTheBoard && result.score !== null && ours > 0 ? Math.min(1, Math.max(0, theirs / ours)) * RESULT_SHARES.closeLoss : 0;

  const favoured = result.headStartFor === result.winner || result.handicapOn === loser;
  const upset = result.winnerExpected === null ? 1 : 1 + RESULT_SHARES.upset * (1 - 2 * Math.min(1, Math.max(0, result.winnerExpected)));
  const winnerShare = shares.winner * (favoured ? RESULT_SHARES.favoured : 1) * upset;
  const again = RESULT_SHARES.again[Math.min(result.earlierToday, RESULT_SHARES.again.length - 1)] ?? 0;
  const paid = { winner: Math.round(max * winnerShare * again), loser: Math.round(max * (shares.loser + close) * again) };
  return result.winner === STONES.black ? { black: paid.winner, white: paid.loser } : { black: paid.loser, white: paid.winner };
}
