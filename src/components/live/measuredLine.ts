import { botName } from "@/lib/bots/bots";
import { builtLadderFingerprint } from "@/lib/gomoku/ladderFingerprint.built";
import { ladderNeighbours, readsAsLevel } from "@/lib/gomoku/ladderNeighbours";
import { measuredLadder } from "@/lib/gomoku/ladderStrength";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * ONE LINE ABOUT HOW THIS PROGRAM ACTUALLY DOES AT THIS GAME, or nothing.
 *
 * The written strength beside a program's name ("reads three moves ahead") is
 * a description of what it tries to do. This is the other thing, and the one a
 * person choosing an opponent is actually asking: at THIS game, does the next
 * rung up really beat this one? A grade's name is one claim about forty-odd
 * games, and the name cannot tell them apart.
 *
 * The rung ABOVE only, because this is one line under a tile rather than a
 * table — and because the useful question while choosing is "is the harder one
 * actually harder", not "is the easier one easier". The player's own page has
 * both sides.
 *
 * Null wherever there is nothing honest to say: not a graded rung, no
 * measurement for this game, or a measurement taken against code that is no
 * longer running. Silence, never a guess — this table is stale the moment
 * anybody touches how a grade chooses a move, and a confidently wrong strength
 * is worse than none.
 */
export function measuredLine(tier: BotTier | null, variant: string): string | null {
  if (tier === null) return null;
  /*
   * The chooser holds the game as a string — it comes from an address — and
   * the table is keyed by variant. A string that is not one of them simply has
   * no row, which is the same nothing as a game nobody has measured, so it is
   * narrowed here rather than guarded against twice.
   */
  const measurement = measuredLadder(variant as RuleVariant, builtLadderFingerprint());
  if (measurement === null) return null;

  const above = ladderNeighbours(measurement, tier).above;
  if (above === null) return null;

  const them = botName(above.tier);
  const me = botName(tier);
  if (readsAsLevel(above)) return `Measured here: level with ${them} at this game.`;
  return above.wins > above.losses
    ? `Measured here: ${me} beats ${them} at this game.`
    : `Measured here: ${them} beats ${me} at this game.`;
}
