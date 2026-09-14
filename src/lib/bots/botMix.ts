import { RULE_VARIANT_LIST, SEED_RANGE, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { playsAsExpert } from "@/lib/gomoku/expert/experts";
import { BOT_ALL_TIERS, TIER_SPECS } from "@/lib/gomoku/opponent.constants";
import { seededRandom, seedFromRoll } from "@/lib/gomoku/rules/random";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { MixFacts, MixLeftOut, MixMatch, MixOptions, MixPlan, MixRecord } from "./botMix.types";

/**
 * A mixed batch of computer games: who plays what, decided by a seed.
 *
 * John, on seeing that 28 of the 39 games had never once been played here:
 * "we should get our general purpose bots to play all these games… it's OK to
 * play something a bot likes or was training for, but also some other bots
 * can play games they don't like. Just mix it up a bit. the undefeated bots
 * should try the other variants a few times… random is great."
 *
 * So the plan has two halves, and both are drawn at random:
 *
 *   UNPLAYED   every game nobody has finished gets one or two games, each
 *              between two different computer players drawn from all seven —
 *              so a specialist sometimes sits down at its own game and more
 *              often at somebody else's, as a grade would.
 *
 *   UNDEFEATED every computer player with rated games and no losses is sent to
 *              a few games AWAY from the ones it has been winning — its own
 *              specialty, and any game it already holds a record at — against
 *              an opponent drawn at random.
 *
 * PURE, AND THE SEED IS THE WHOLE OF IT. The runner reads the facts from the
 * database it reached and hands them in with a seed; this returns the list of
 * games and touches nothing. The same facts and the same seed give the same
 * plan, which is what lets the report-only run print a plan and the writing
 * run play exactly that plan — rather than a different roll of the same dice.
 *
 * WHAT IT WILL NOT PLAN is given to it, not worked out here: `leftOut` names
 * the games the computer players cannot be trusted to finish, and `sizeCaps`
 * the boards too slow to draw on one machine, each with its reason. A game
 * left out is reported as left out, never quietly dropped — a plan that played
 * thirty games and said nothing about the three it skipped would read as a
 * plan that covered everything.
 */

/** One of `items`, drawn evenly. */
function pick<T>(items: readonly T[], random: () => number): T {
  if (items.length === 0) throw new Error("Nothing to draw from.");
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

/** A copy of `items` in a random order (Fisher–Yates). */
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The seed a run uses: the one given, or a fresh one drawn from `roll`.
 *
 * A seed that is given but cannot be read is refused rather than replaced. A
 * typo quietly swapped for a random seed would play a plan nobody printed,
 * under a command that looked like it named one.
 */
export function mixSeedFrom(text: string | undefined, roll: number): number {
  if (text === undefined || text.trim() === "") return seedFromRoll(roll, SEED_RANGE);
  const seed = Number(text.trim());
  if (!Number.isInteger(seed) || seed < 0 || seed >= SEED_RANGE) {
    throw new Error(`BOT_GAMES_SEED must be a whole number from 0 to ${SEED_RANGE - 1}, not "${text}".`);
  }
  return seed;
}

/** The sizes a game may be drawn on: its own, less any capped for speed. */
export function drawableSizes(variant: RuleVariant, options: Pick<MixOptions, "sizeCaps">): number[] {
  const capped = new Set(
    options.sizeCaps.filter((cap) => cap.variant === variant).map((cap) => cap.size),
  );
  return boardSizesFor(variant).filter((size) => !capped.has(size));
}

/** The games the plan may send anybody to: every game not left out, with a size left to draw. */
export function playableVariants(options: Pick<MixOptions, "leftOut" | "sizeCaps">): RuleVariant[] {
  const out = new Set(options.leftOut.map((one) => one.variant));
  return RULE_VARIANT_LIST.filter((variant) => !out.has(variant) && drawableSizes(variant, options).length > 0);
}

/** Why a game cannot be planned, or null when it can. */
function leftOutBecause(variant: RuleVariant, options: Pick<MixOptions, "leftOut" | "sizeCaps">): string | null {
  const named = options.leftOut.find((one) => one.variant === variant);
  if (named !== undefined) return named.reason;
  if (drawableSizes(variant, options).length === 0) return "every size it is played on is capped as too slow.";
  return null;
}

/**
 * Whether a record is undefeated: at least one rated game, and no losses.
 *
 * Both halves, because "no losses" alone is true of a player who has never
 * played — and sending a player with no record away from its record is a
 * sentence with nothing in it.
 */
export function isUndefeated(record: MixRecord): boolean {
  return record.ratedGames > 0 && record.losses === 0;
}

/**
 * The games a player has been winning at, which it is sent away from: the
 * specialty it was built for, and every game it already holds a rated record
 * at. A grade has no specialty, so for a grade this is simply where its record
 * was made.
 */
export function homeGround(record: MixRecord): RuleVariant[] {
  const studied = TIER_SPECS[record.tier].expertise;
  const held = new Set(record.variants);
  return RULE_VARIANT_LIST.filter((variant) => held.has(variant) || playsAsExpert(studied, variant));
}

/** Two different players, in a random order — the first drawn takes black. */
function drawPair(players: readonly BotTier[], random: () => number): { black: BotTier; white: BotTier } {
  const black = pick(players, random);
  const white = pick(players.filter((one) => one !== black), random);
  return { black, white };
}

export const MIX_ALL_PLAYERS: readonly BotTier[] = BOT_ALL_TIERS;

export function planMix(facts: MixFacts, options: MixOptions): MixPlan {
  const players = [...new Set(options.players)];
  if (players.length < 2) throw new Error("A mixed plan needs at least two computer players to draw from.");
  const { fewest, most } = options.unplayedGames;
  if (!Number.isInteger(fewest) || !Number.isInteger(most) || fewest < 1 || most < fewest) {
    throw new Error(`Unplayed games per game must be whole numbers with 1 ≤ fewest ≤ most, not ${fewest}–${most}.`);
  }

  const random = seededRandom(options.seed);
  const matches: MixMatch[] = [];

  const unplayed = RULE_VARIANT_LIST.filter((variant) => (facts.finishedByVariant[variant] ?? 0) === 0);
  const unplayedLeftOut: MixLeftOut[] = [];
  for (const variant of unplayed) {
    const reason = leftOutBecause(variant, options);
    if (reason !== null) {
      unplayedLeftOut.push({ variant, reason });
      continue;
    }
    const sizes = drawableSizes(variant, options);
    const games = fewest + Math.min(most - fewest, Math.floor(random() * (most - fewest + 1)));
    for (let n = 0; n < games; n += 1) {
      const size = pick(sizes, random);
      matches.push({ variant, size, ...drawPair(players, random), why: { kind: "unplayed" } });
    }
  }

  const playable = playableVariants(options);
  const undefeated: MixPlan["undefeated"][number][] = [];
  // In the order the site lists its players, so the draws happen in a fixed order.
  const records = BOT_ALL_TIERS.flatMap((tier) => facts.records.filter((one) => one.tier === tier));
  for (const record of records) {
    if (!isUndefeated(record) || !players.includes(record.tier)) continue;
    const home = homeGround(record);
    const away = playable.filter((variant) => !home.includes(variant));
    // Different games, not the same one three times: the question is whether it wins elsewhere.
    const chosen = shuffled(away, random).slice(0, Math.max(0, options.undefeatedGames));
    for (const variant of chosen) {
      const opponent = pick(players.filter((one) => one !== record.tier), random);
      const asBlack = random() < 0.5;
      const size = pick(drawableSizes(variant, options), random);
      matches.push({
        variant,
        size,
        black: asBlack ? record.tier : opponent,
        white: asBlack ? opponent : record.tier,
        why: { kind: "undefeated", tier: record.tier },
      });
    }
    undefeated.push({ record, awayFrom: home, sentTo: chosen.length });
  }

  return { seed: options.seed, matches, unplayed, unplayedLeftOut, undefeated };
}
