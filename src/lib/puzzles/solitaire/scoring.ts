import { isColumnPile, isFoundationPile } from "@johnmorrisdotca/toranpu/klondike";
import type { KlondikeMove, KlondikeTable } from "@johnmorrisdotca/toranpu/klondike";

/**
 * THE SCORE BESIDE THE CLOCK, if the player wants one: none, the standard
 * points, or Vegas points — played for points, never for money. A way of
 * keeping score, not part of the game: it changes no rule, is worked out from
 * the moves in the browser, and the fastest tables go on time as every puzzle's do.
 */
export type SolitaireScoring = "none" | "standard" | "vegas";

export const SOLITAIRE_SCORING_LIST: readonly SolitaireScoring[] = ["none", "standard", "vegas"];

/**
 * STANDARD, the long-familiar desktop count: five for a card from the waste to
 * a column, ten for any card home, five for each card turned over on a column,
 * fifteen off for a card brought down from home, and for turning the waste
 * back a hundred off when turning one card at a time, twenty when three. Never
 * below nought. Won, a bonus for speed: 700,000 over the seconds taken, from
 * thirty seconds on.
 *
 * VEGAS, for points: fifty-two down to start — the price of the deck — and
 * five for every card home, five back off for one brought down.
 */
export const SCORE_RULES = {
  wasteToColumn: 5,
  home: 10,
  turnedOver: 5,
  fromHome: -15,
  recycleDrawOne: -100,
  recycleDrawThree: -20,
  bonusOver: 700_000,
  bonusFromSeconds: 30,
  vegasStake: -52,
  vegasHome: 5,
} as const;

function faceDown(table: KlondikeTable): number {
  return table.tableau.reduce((total, column) => total + column.down, 0);
}

/** What one move scores under a way of scoring: the tables before and after it. */
function scoreOf(scoring: SolitaireScoring, move: KlondikeMove, before: KlondikeTable, after: KlondikeTable): number {
  if (scoring === "vegas") {
    if (move.kind !== "carry") return 0;
    if (isFoundationPile(move.to)) return SCORE_RULES.vegasHome;
    return isFoundationPile(move.from) ? -SCORE_RULES.vegasHome : 0;
  }
  if (move.kind === "draw") return 0;
  if (move.kind === "recycle") return before.rules.draw === 1 ? SCORE_RULES.recycleDrawOne : SCORE_RULES.recycleDrawThree;
  let points = (faceDown(before) - faceDown(after)) * SCORE_RULES.turnedOver;
  if (isFoundationPile(move.to)) points += SCORE_RULES.home;
  else if (move.from === "w" && isColumnPile(move.to)) points += SCORE_RULES.wasteToColumn;
  else if (isFoundationPile(move.from)) points += SCORE_RULES.fromHome;
  return points;
}

/**
 * The score of a game so far: its tables (the deal first, one after each move)
 * and its moves. `wonInMs`, once it is won, adds the standard count's bonus for
 * speed. Null for no scoring.
 */
export function solitaireScore(scoring: SolitaireScoring, tables: readonly KlondikeTable[], moves: readonly KlondikeMove[], wonInMs: number | null = null): number | null {
  if (scoring === "none") return null;
  let score = scoring === "vegas" ? SCORE_RULES.vegasStake : 0;
  moves.forEach((move, at) => {
    score += scoreOf(scoring, move, tables[at], tables[at + 1]);
    if (scoring === "standard") score = Math.max(0, score);
  });
  if (scoring === "standard" && wonInMs !== null) {
    const seconds = Math.round(wonInMs / 1000);
    if (seconds >= SCORE_RULES.bonusFromSeconds) score += Math.round(SCORE_RULES.bonusOver / seconds);
  }
  return score;
}
