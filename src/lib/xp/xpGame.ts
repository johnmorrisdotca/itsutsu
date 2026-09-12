import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { familyKeyOf } from "@/lib/gomoku/families";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { BOT_SPECIALIST_LIST, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { STREAK_KINDS, type Streak, type StreakOutcome } from "@/lib/rating/streak";

import { XP_EVENTS, XP_LONG_GAME_MOVES, winStreakMilestoneFor } from "./xp.constants";
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

/** Who was in the other seat, as far as this member's awards are concerned. */
export type Opponent = {
  /**
   * Their member id, or null.
   *
   * Null is an UNBOUND seat or this member playing themselves, and both mean the
   * same thing here: there is nobody this member can be said to have beaten. A
   * hot-seat game where two accounts hold the two chairs is two different ids and
   * is a real win over a real person, which is what the sit-as feature is for.
   */
  id: string | null;
  /** The grade a program in that seat plays at, or null for a person. */
  tier: string | null;
  /** On this member's buddy list. Null where it could not be read. */
  buddy: boolean | null;
  /**
   * Whether they had already beaten this member at this game. Null where it
   * could not be read.
   */
  beatenMeBefore: boolean | null;
};

/** One member's half of one finished game. */
export type PlayedSideFacts = {
  outcome: StreakOutcome;
  /**
   * The run this result made, over every finished game.
   *
   * Taken from the very columns `recordPlayed` is writing rather than counted
   * again here: two implementations of "one more result" would be two answers to
   * the question the streak column exists to answer once. Null is no run — which
   * is not the same as a run of nought, and pays nothing either way.
   */
  run: Streak | null;
  opponent: Opponent;
  /**
   * The ISO week, when this game finished at the weekend FOR THIS MEMBER, and
   * null when it did not.
   *
   * Decided by the caller because it depends on the member's own zone: a game
   * that ends on Sunday evening in Tokyo ended on Sunday morning in Vancouver
   * and on Saturday night in Tallinn, and only one of those readings is the
   * member's. The week rather than the day, so the award is once a WEEKEND
   * rather than once a game — a Saturday and the Sunday after it are one ISO
   * week, which is why the week is the subject and a made-up "weekend id" is
   * not.
   */
  weekendWeek: string | null;
};

/** Nobody in the other seat, and nothing known about them. For a caller's default. */
export const NO_OPPONENT: Opponent = { id: null, tier: null, buddy: null, beatenMeBefore: null };

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
  if (side.outcome !== STREAK_KINDS.win) return awards;
  return [...awards, ...winAwards(game, side, variant)];
}

/**
 * What a win adds, on top of everything finishing already paid.
 *
 * Its own function because "what finishing pays" and "what winning pays" are two
 * questions, and every judgement about the other seat lives in the second one —
 * a person, a buddy, a rivalry, a grade. Keeping them apart is what lets a draw
 * and a loss be read in one glance above.
 */
function winAwards(
  game: FinishedGame,
  side: PlayedSideFacts,
  variant: RuleVariant | null,
): XpAward[] {
  const awards: XpAward[] = [{ type: XP_EVENTS.gameWon, subject: game.id }];
  const { opponent } = side;
  /* A program in the other seat is a grade, not a person, and an unbound seat is
     neither. See `Opponent.id`. */
  const person = opponent.id !== null && opponent.tier === null;

  if (person) {
    awards.push({ type: XP_EVENTS.wonVsPerson, subject: game.id });
    /* True only. Null is "could not be read" and false is "not a buddy", and
       neither of them is a buddy beaten. */
    if (opponent.buddy === true) awards.push({ type: XP_EVENTS.wonVsBuddy, subject: game.id });
  }

  if (variant !== null) {
    /* Trying something new is paid once by `firstOfVariant`; understanding it is
       paid once more here. Keyed on the game's name, so it is a first win at
       Reversi rather than a first win. */
    awards.push({ type: XP_EVENTS.firstWinAtVariant, subject: variant });

    /* ── THE TURN-AROUND ───────────────────────────────────────────────────
       John's "winning after losing to a friend". Once per rivalry per game —
       `<opponentId>:<variant>` — so it is the turn-around that pays and not
       every win after it. Against a person only: a computer grade is beaten
       rather than avenged, and `gradeBeaten` is what pays for that. */
    if (person && opponent.beatenMeBefore === true) {
      awards.push({ type: XP_EVENTS.revengeWin, subject: `${opponent.id}:${variant}` });
    }
  }

  const milestone = streakMilestone(side.run);
  /* Keyed on the GAME that completed the run rather than on the run's length, so
     a second run of three later pays again — which is the whole point of a
     streak award. */
  if (milestone !== null) awards.push({ type: milestone, subject: game.id });

  awards.push(...gradeAwards(opponent));
  return awards;
}

/**
 * The milestone a run of wins has just reached, or null.
 *
 * Only a run of WINS, and only at exactly three, five or ten:
 * `winStreakMilestoneFor` answers null for four and for eleven, so an eleventh
 * win asks for nothing rather than asking for the tenth's award and leaning on
 * the unique index to refuse it.
 */
function streakMilestone(run: Streak | null) {
  if (run === null || run.kind !== STREAK_KINDS.win) return null;
  return winStreakMilestoneFor(run.count);
}

/**
 * A computer grade beaten, or one of the two specialists.
 *
 * Keyed on the tier, so each grade pays once however many times it is beaten —
 * which is what makes the five of them a ladder to climb rather than forty XP a
 * game. The specialists are deliberately not on that ladder: they play one game
 * each and have to be sought out, which is why they pay more than a grade.
 */
function gradeAwards(opponent: Opponent): XpAward[] {
  const tier = opponent.tier;
  if (tier === null) return [];
  if ((BOT_SPECIALIST_LIST as readonly string[]).includes(tier)) {
    return [{ type: XP_EVENTS.specialistBeaten, subject: tier }];
  }
  if ((BOT_TIER_LIST as readonly string[]).includes(tier)) {
    return [{ type: XP_EVENTS.gradeBeaten, subject: tier }];
  }
  /* A tier this deploy does not know — a grade retired, or a row written by a
     later version. Nothing, rather than an award keyed on a string that is not a
     grade and would sit in the ledger unable to explain itself. */
  return [];
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
