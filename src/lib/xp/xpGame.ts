import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { GAME_FAMILIES, familyKeyOf } from "@/lib/gomoku/families";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { STREAK_KINDS } from "@/lib/rating/streak";

import { XP_EVENTS, XP_LONG_GAME_MOVES, resultMilestoneFor } from "./xp.constants";
import type { XpAward } from "./xp.types";
import { winAwards } from "./xpWinAwards";

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
 * `xpGameServer.ts` is the half that gathers the facts and pays. What a win
 * adds on top of a finish is `xpWinAwards.ts`.
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
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A FACT NOBODY COULD ESTABLISH IS NULL, AND A NULL PAYS NOTHING
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `buddy` and `beatenMeBefore` are `boolean | null`, and null means the question
 * could not be answered rather than "no". Nothing here reads a null as false and
 * pays, because that is AGENTS.md's guard returning a plausible value for "I do
 * not know" — `revengeWin` over an unreadable history would pay 30 XP for a
 * turn-around that never happened, on every win, and no gate would ever report
 * it. Silence is the safe answer.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * `comeback` IS IN THE CATALOGUE AND IS DELIBERATELY NOT PAID HERE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * XP_DESIGN.md prices it at 30 for "won from a position the engine had you
 * losing", and makes it conditional on there being an honest measure. There is
 * not one, on three counts, and the honest thing is to say so rather than to
 * approximate it:
 *
 * - **Nothing reads a position as losing for this site's games.** The measure it
 *   would need is a win chance per position, and `VARIANT_SPECS` sets
 *   `analysis: false` on the flips, the twists, the races and more — so for
 *   those variants the answer is not "close" or "unknown", it does not exist.
 * - **Deriving it at the end would cost a search per move.** A finished game is
 *   sixty-odd positions; evaluating them inside the request that ended the game
 *   is work bounded per call and run on every finished game, which is the cost
 *   shape this project already paid for once.
 * - **And it cannot be stored as it goes without a column**, which is a
 *   migration on a shared database for a bonus nobody has asked for yet.
 *
 * A comeback bonus that treated "no reading" as "was losing" would pay
 * everybody for every win. So the type stays priced, stays listed in
 * `XP_UNWIRED` — which is what tells a page it is not yet paid — and nothing
 * fires. If it is ever wanted, the honest shape is a win chance written onto the
 * game row as the game is played, and a stated list of the variants that can
 * earn it.
 */

/*
 * The shapes of the facts are `xpGame.types.ts` and re-exported here, because
 * the writer (`xpGameServer.ts`) and the replay (`backfillXp.ts`) import them
 * from this module beside the function they feed. One door, the same way
 * `RecordTable.tsx` hands out its row type.
 */
export type { FinishedGame, Opponent, PlayedSideFacts } from "./xpGame.types";
import type { FinishedGame, Opponent, PlayedSideFacts } from "./xpGame.types";

/** Nobody in the other seat, and nothing known about them. For a caller's default. */
export const NO_OPPONENT: Opponent = { id: null, tier: null, buddy: null, beatenMeBefore: null, ratings: null };

/** The variant keys, as a set, so an unknown string can be refused in one step. */
const VARIANTS: ReadonlySet<string> = new Set<string>(RULE_VARIANT_LIST);

/** Every game on the site: what `everyVariantPlayed` is counted against. */
export const XP_VARIANTS_TO_PLAY = RULE_VARIANT_LIST.length;

/**
 * The fewest games a family must hold for winning all of them to be a family won.
 *
 * Two, because a family of one game is not a completion: its only win is already
 * paid by `firstWinAtVariant`, and its first game by `firstOfFamily`, so 300 more
 * would make one win at Hex or Go worth about 510 XP. See
 * `everyVariantWonInFamily` in `xp.constants.ts`.
 */
export const XP_FAMILY_WON_MIN_GAMES = 2;

/**
 * The family a win at this variant could complete, or null.
 *
 * Null for a variant in no family, one this deploy cannot name, and a family of
 * fewer than `XP_FAMILY_WON_MIN_GAMES` games. One answer for the live award
 * (`xpTour.ts`) and the replay (`backfillXp.ts`) alike, so the two cannot
 * disagree about which families can be won.
 */
export function familyToWin(variant: string): (typeof GAME_FAMILIES)[number] | null {
  const family = GAME_FAMILIES.find((one) => (one.games as readonly string[]).includes(variant));
  if (family === undefined || family.games.length < XP_FAMILY_WON_MIN_GAMES) return null;
  return family;
}

/** The variant a stored row names, or null when it names nothing this deploy has. */
export function variantOf(game: Pick<FinishedGame, "variant">): RuleVariant | null {
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

  /* John asked for the weekend. Once a weekend and not once a game, which is
     what the ISO week as the subject says — otherwise it would be a second
     `gameFinished` with a calendar in front of it.

     A week is a non-empty string or it is nothing: an empty subject here would
     mean "once ever", so a caller that had nothing to say must not be read as
     having said the weekend. */
  if (typeof side.weekendWeek === "string" && side.weekendWeek !== "") {
    awards.push({ type: XP_EVENTS.weekendGame, subject: side.weekendWeek });
  }

  /* Winning, which is twice a finish: better, and not four times better, or the
     site would only reward the strong. It comes after the finish rather than
     beside it because a toast should read "a game seen through" before "a game
     won", and because every award that RIDES the allowance has to sit after the
     finish that decides it. */
  /* A milestone at this game — ten wins, fifty losses, ten draws — LAST, after
     everything the game itself paid, so a toast reads "a game won" before "ten
     wins at this game". Not capped and not riding the allowance: it happens once
     per game per member however many games are played. */
  const milestone = resultMilestone(variant, side);
  if (side.outcome !== STREAK_KINDS.win) return [...awards, ...milestone];
  return [...awards, ...winAwards(game, side, variant), ...milestone];
}

/**
 * The milestone this result reaches at this game, keyed on the game.
 *
 * Nothing for a game this deploy cannot name, and nothing where the count was
 * not read: `sameResultsAtGame` null is the rule declining to measure.
 */
function resultMilestone(variant: RuleVariant | null, side: PlayedSideFacts): XpAward[] {
  if (variant === null || side.sameResultsAtGame === null) return [];
  const type = resultMilestoneFor(side.outcome, side.sameResultsAtGame);
  return type === null ? [] : [{ type, subject: variant }];
}

/** The five graded grades: what `everyGradeBeaten` is counted against. */
export const XP_GRADES_TO_BEAT = BOT_TIER_LIST.length;

/**
 * The other seat, for one member, or null where there is nobody to have beaten.
 *
 * NOT `rematch.ts`'s `opponentOf`, which answers a different question — "who
 * would a rematch be against" — and answers the asker's own id for a game
 * somebody played against themselves. John has played himself; that game is a
 * win over nobody, and the against-a-person awards must stay out of it.
 */
export function otherSeat(
  game: { blackMemberId: string | null; whiteMemberId: string | null },
  memberId: string,
): string | null {
  const other =
    game.blackMemberId === memberId
      ? game.whiteMemberId
      : game.whiteMemberId === memberId
        ? game.blackMemberId
        : null;
  return other === memberId ? null : other;
}
