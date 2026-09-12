import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { familyKeyOf } from "@/lib/gomoku/families";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { STREAK_KINDS, type StreakOutcome } from "@/lib/rating/streak";

import { XP_EVENTS, XP_LONG_GAME_MOVES } from "./xp.constants";
import type { XpAward } from "./xp.types";

/**
 * What one finished game pays one member, decided without a database.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * PURE, BECAUSE THIS IS WHERE THE RULES ARE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Every fact this needs is handed to it: the game, how it went for this member,
 * the run it made, and who was in the other seat. So the economy can be checked
 * against a table of cases rather than against a database — which is the same
 * reason `src/lib/gomoku/engine.ts` takes a position and returns one.
 *
 * `xpGameServer.ts` is the half that gathers the facts and pays.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ORDER IS THE ORDER A MEMBER READS THEM IN
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The list comes back in the order the toasts should stack, and
 * **`gameFinished` is first for a second reason that is not presentation**:
 * `withinAllowance` walks the batch in order and an award marked
 * `ridesAllowance` fires only if the finish ahead of it was paid. An award that
 * rides the allowance and is listed BEFORE the finish would be decided against
 * a question nobody had answered yet.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NOTHING HERE ASKS WHETHER AN AWARD HAS BEEN EARNED ALREADY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * "First game of this variant" is not a question this function answers, and
 * that is the ledger's one idea rather than an omission: the award is keyed on
 * the variant, so the second game of Reversi writes the row that is already
 * there and is refused by the unique index. A version of this that read the
 * ledger first would be a second implementation of idempotency — one that can
 * disagree with the index, and that costs a query per finished game to do it.
 */

/** The finished game, as much of it as an award needs. */
export type FinishedGame = {
  id: string;
  /**
   * `Game.variant` is a plain string column, so it is taken as one and checked
   * here rather than asserted by the caller — the same shape `winnerOf` uses for
   * `Game.winner` in `playedRun.ts`, and for the same reason: a row holding
   * something this deploy has never heard of must pay nothing rather than pay
   * against a key that is not a game.
   */
  variant: string;
  /** How many moves the finished game holds. See `longGame`. */
  moveCount: number;
};

/** One member's half of one finished game. */
export type PlayedSideFacts = {
  outcome: StreakOutcome;
};

/** The variant keys, as a set, so an unknown string can be refused in one step. */
const VARIANTS: ReadonlySet<string> = new Set<string>(RULE_VARIANT_LIST);

/** Every game on the site: what `everyVariantPlayed` is counted against. */
export const XP_VARIANTS_TO_PLAY = RULE_VARIANT_LIST.length;

/** The variant a stored row names, or null when it names nothing this deploy has. */
export function variantOf(game: FinishedGame): RuleVariant | null {
  return VARIANTS.has(game.variant) ? (game.variant as RuleVariant) : null;
}

/**
 * What this finished game pays this member, in the order it should be read.
 *
 * Every subject is chosen so the award happens exactly as often as it should,
 * and the unique index then does the rest. A first game of a variant is keyed on
 * the variant, a finish on the game. See `XP_SUBJECTS`.
 */
export function gameAwards(game: FinishedGame, side: PlayedSideFacts): XpAward[] {
  const awards: XpAward[] = [{ type: XP_EVENTS.gameFinished, subject: game.id }];

  /* Once ever, whatever the game was. The first line in a member's history
     after `joined`, and twice the biggest single-game award: the first game is
     the whole of the conversion. */
  awards.push({ type: XP_EVENTS.firstGameEver });

  /* ── THE TOUR ─────────────────────────────────────────────────────────────
     Thirty-nine games and eleven families, most of them barely played. Keyed on
     the variant and on the family rather than on the game, which is what makes
     the second game of Reversi pay nothing extra and a first game of Hex pay 75
     on top of the finish. */
  const variant = variantOf(game);
  if (variant !== null) {
    awards.push({ type: XP_EVENTS.firstOfVariant, subject: variant });
    const family = familyKeyOf(variant);
    /* Null is a game in no family — nothing on the site today, and kept that way
       by `variants.coverage.test.ts`. It pays nothing rather than paying under a
       made-up key. */
    if (family !== null) awards.push({ type: XP_EVENTS.firstOfFamily, subject: family });
  }

  /* Past sixty moves. A game that went the distance, and the one award here
     that is about the game rather than about who played it. */
  if (game.moveCount >= XP_LONG_GAME_MOVES) {
    awards.push({ type: XP_EVENTS.longGame, subject: game.id });
  }

  /* Winning, which is twice a finish: better, and not four times better, or the
     site would only reward the strong. It is last in the batch rather than
     beside the finish because a toast should read "a game seen through" before
     "a game won", and because every award that RIDES the allowance has to sit
     after the finish that decides it. */
  if (side.outcome === STREAK_KINDS.win) {
    awards.push({ type: XP_EVENTS.gameWon, subject: game.id });
  }

  return awards;
}
