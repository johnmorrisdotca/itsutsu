import { freePairs, geometryOf, takePair } from "./board";
import { layoutFor } from "./layouts";
import type { MahjongBonusRule, MahjongGeometry } from "./mahjong.types";
import { readTable } from "./table";
import type { MahjongTable, MahjongTableState } from "./table.types";
import { bonusRuleOf, pairGoesAgain, pairPoints } from "./tiles";

/**
 * A COMPUTER AT THE TABLE, in the browser. It looks one turn ahead: every pair
 * it could take is worth its points, less what the best pair it would leave
 * for the next player is worth — or, for a flower or season pair that gives it
 * another turn, plus most of what its own next pair would be. So it takes a
 * dragon when it can, but not a plain pair that uncovers a dragon for the
 * player after it, and it keeps a bonus pair for when it has something to
 * follow with. Where two pairs are worth the same it takes the one lower in
 * the layout's order, so the same table always gets the same move.
 *
 * A pair that would leave no pair at all makes the tiles shuffle, which could
 * give the next player anything: counted as `SHUFFLE_GUESS`, about the worth
 * of a pair picked at random.
 */
const SHUFFLE_GUESS = 1.5;
const NEXT_WEIGHT = 0.9;
const AGAIN_WEIGHT = 0.8;

function bestAfter(geometry: MahjongGeometry, cells: string, rule: MahjongBonusRule): number {
  const pairs = freePairs(geometry, cells, rule);
  if (pairs.length === 0) return SHUFFLE_GUESS;
  let best = 0;
  for (const [a] of pairs) best = Math.max(best, pairPoints(cells[a]!));
  return best;
}

/** The pair a computer in the seat to move takes, or null when there is nothing to take. */
export function computerPair(table: MahjongTable, state: MahjongTableState | null = readTable(table)): [number, number] | null {
  const layout = layoutFor(table.size);
  if (layout === null || state === null || state.over) return null;
  const geometry = geometryOf(layout);
  const rule = bonusRuleOf(table.givens);
  let chosen: [number, number] | null = null;
  let chosenWorth = -Infinity;
  for (const [a, b] of freePairs(geometry, state.cells, rule)) {
    const code = state.cells[a]!;
    const after = takePair(state.cells, a, b);
    const next = bestAfter(geometry, after, rule);
    const worth = pairPoints(code) + (pairGoesAgain(code) ? AGAIN_WEIGHT * next : -NEXT_WEIGHT * next);
    if (worth > chosenWorth) {
      chosen = [a, b];
      chosenWorth = worth;
    }
  }
  return chosen;
}
