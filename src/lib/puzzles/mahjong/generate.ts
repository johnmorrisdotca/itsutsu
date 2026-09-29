import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { freshSeed, seededRandom, shuffled, type Random } from "../random";
import { freePairs, geometryOf, takePair, tilesLeft } from "./board";
import { hashText, layPairs, type Laid } from "./deal";
import { layoutFor } from "./layouts";
import type { MahjongBonusRule, MahjongGeometry } from "./mahjong.types";
import { encodeMoves } from "./moves";
import { setPairs } from "./tiles";

/**
 * MAKING A DEAL, in the browser, from a seed.
 *
 * The seed decides everything: which pairs of the set a smaller layout uses,
 * where each lands, and — through the block it is drawn from — how the flowers
 * and seasons match (`bonusRuleOfSeed`). Every deal is laid in reverse
 * (`deal.ts`), so every deal can be cleared.
 *
 * THE LEVEL IS HOW FORGIVING THE DEAL IS. Every deal can be finished, but some
 * forgive a careless pair and some punish it, and that is what a player feels
 * as hard. So five deals are laid from the seed and each is played out
 * `PLAYOUTS` times by a player who takes any free pair at random; easy is the
 * deal that player clears most often, hard the one it clears least, medium the
 * one between. A ranking rather than a threshold, so every layout at every
 * level is made in the same few milliseconds, whatever its numbers are.
 */
const CANDIDATES = 5;
const PLAYOUTS = 16;

/**
 * THE SEEDS OF THE IDENTICAL RULE, a block no other seed of this puzzle uses:
 * a kept run is found by its seed, so the seed is what can say which rule a
 * deal was made under without a column of its own (as a Futago's does). A
 * fresh seed of the usual rule is drawn outside it; today's seed (20260929)
 * lies far below it.
 */
export const MAHJONG_SAME_BLOCK = { from: 1_500_000_000, size: 100_000_000 } as const;

export function bonusRuleOfSeed(seed: number): MahjongBonusRule {
  return seed >= MAHJONG_SAME_BLOCK.from && seed < MAHJONG_SAME_BLOCK.from + MAHJONG_SAME_BLOCK.size ? "same" : "group";
}

/** A new seed for a deal under this rule. */
export function freshMahjongSeed(rule: MahjongBonusRule, random: Random = Math.random): number {
  if (rule === "same") return MAHJONG_SAME_BLOCK.from + Math.floor(random() * MAHJONG_SAME_BLOCK.size);
  for (;;) {
    const seed = freshSeed();
    if (bonusRuleOfSeed(seed) === "group") return seed;
  }
}

/** How often a player taking any free pair at random clears this deal, out of `times`. */
export function clearRate(geometry: MahjongGeometry, cells: string, rule: MahjongBonusRule, random: Random, times: number): number {
  let cleared = 0;
  for (let game = 0; game < times; game += 1) {
    let tiles = cells;
    for (;;) {
      const pairs = freePairs(geometry, tiles, rule);
      if (pairs.length === 0) break;
      const [a, b] = pairs[Math.floor(random() * pairs.length)]!;
      tiles = takePair(tiles, a, b);
    }
    if (tilesLeft(tiles) === 0) cleared += 1;
  }
  return cleared / times;
}

/** One deal of a layout from its own stream: which pairs of the set, and where each lies. */
function dealFrom(geometry: MahjongGeometry, rule: MahjongBonusRule, random: Random): Laid | null {
  const count = geometry.layout.slots.length;
  const pairs = shuffled(setPairs(rule, random), random).slice(0, count / 2);
  return layPairs(geometry, geometry.layout.slots.map(() => true), pairs, random);
}

/** A deal of this layout at this level, made from this seed. */
export function generateMahjong(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const layout = layoutFor(size);
  if (layout === null) throw new Error(`no Mahjong layout ${size} across`);
  const geometry = geometryOf(layout);
  const rule = bonusRuleOfSeed(seed);
  const deals: { laid: Laid; rate: number; order: number }[] = [];
  for (let order = 0; order < CANDIDATES; order += 1) {
    const laid = dealFrom(geometry, rule, seededRandom(hashText(`mahjong:${seed}:${order}`) || 1));
    if (laid === null) continue;
    deals.push({ laid, rate: clearRate(geometry, laid.cells, rule, seededRandom(hashText(`playout:${seed}:${order}`) || 1), PLAYOUTS), order });
  }
  if (deals.length === 0) throw new Error(`no deal of the ${layout.key} from seed ${seed}`);
  deals.sort((a, b) => b.rate - a.rate || a.order - b.order);
  const chosen = level === "easy" ? deals[0]! : level === "hard" ? deals[deals.length - 1]! : deals[Math.floor(deals.length / 2)]!;
  return {
    kind: "mahjong",
    size,
    level,
    seed,
    givens: chosen.laid.cells,
    solution: encodeMoves(chosen.laid.order.map((pair) => ({ pair }))),
  };
}
