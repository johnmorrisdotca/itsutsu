import { VARIANT_SPECS } from "../gomoku.constants";
import { BOT_ALL_TIERS, BOT_TIER_LIST, TIER_SPECS } from "../opponent.constants";
import { FLIP_EXPERT } from "./flipExpert";
import { LINE_EXPERT } from "./lineExpert";
import { expertTurn } from "./expertSearch";
import type { GameState, RuleVariant, VariantSpec } from "../gomoku.types";
import type { BotTier, BotTurn, SearchBudget, TierSpec } from "../opponent.types";
import type { Expert, ExpertKind } from "./expert.types";

/**
 * Which specialist knows which board.
 *
 * The whole registry, and the only place the two readings are collected. A
 * player says what it has studied — a list of `ExpertKind` on its spec, which
 * is data like every other knob — and the game says what it is, through its
 * own spec. Where the two meet there is a specialist to consult, and where
 * they do not the player falls back to the shared reading and the graded
 * ladder, which is what a strong Reversi player does at a game of Halma.
 *
 * Nothing here asks the variant's name or the player's. A specialist that had
 * to be told "you are the Reversi one" would need telling again for every
 * flipping board added afterwards, and the one it was not told about is the
 * one it would play badly.
 */

/** Every specialist there is, in no particular order. */
export const EXPERTS: readonly Expert[] = [FLIP_EXPERT, LINE_EXPERT];

/**
 * The specialist a player with this training has for a game with this spec,
 * or null where it has none — which is the ordinary case, since the five
 * graded players have studied nothing in particular and a specialist has
 * studied one thing.
 */
export function expertFor(
  studied: readonly ExpertKind[],
  spec: VariantSpec,
): Expert | null {
  if (studied.length === 0) return null;
  return EXPERTS.find((expert) => studied.includes(expert.kind) && expert.applies(spec)) ?? null;
}

/** Whether this training is a specialty at this game — for offering the player at all. */
export function playsAsExpert(studied: readonly ExpertKind[], variant: RuleVariant): boolean {
  return expertFor(studied, VARIANT_SPECS[variant]) !== null;
}

/**
 * The computer players that will sit down to this game: the whole graded
 * ladder, which plays anything, and a specialist only at its own board.
 *
 * A specialist away from its game is 国手 under another name, and offering
 * one at Halma would be offering the same player twice under two names and a
 * different flag. So it is offered where it is a specialist and nowhere else
 * — which is also the honest reading of what it is for.
 */
export function tiersFor(variant: RuleVariant): readonly BotTier[] {
  const spec: VariantSpec | undefined = VARIANT_SPECS[variant];
  /*
   * A game whose spec cannot be read is a game nobody here has studied. The
   * variant arrives from a stored row in one caller, and a row naming
   * something this release has never heard of must not be answered with a
   * specialist chosen on a guess: the graded ladder plays anything, so it is
   * the safe answer as well as the true one.
   */
  if (spec === undefined) return BOT_TIER_LIST;
  return BOT_ALL_TIERS.filter((tier) => {
    const studied = TIER_SPECS[tier].expertise;
    return studied.length === 0 || expertFor(studied, spec) !== null;
  });
}

/**
 * The move a graded player's specialty finds here, or null when it has no
 * specialty in this game and the shared chooser should decide instead.
 *
 * The one door between the chooser and the specialists, so that `chooseTurn`
 * gains a single conditional on a piece of data rather than a branch per
 * player or per game.
 */
export function masteredTurn(
  state: GameState,
  tier: TierSpec,
  random: () => number,
  budget: SearchBudget = {},
): BotTurn | null {
  const spec: VariantSpec | undefined = VARIANT_SPECS[state.settings.variant];
  if (spec === undefined) return null;
  const expert = expertFor(tier.expertise, spec);
  if (expert === null) return null;
  return expertTurn(state, expert, random, budget);
}
