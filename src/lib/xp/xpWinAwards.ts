import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { BOT_SPECIALIST_LIST, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { STREAK_KINDS, type Streak } from "@/lib/rating/streak";

import { XP_EVENTS, winStreakMilestoneFor } from "./xp.constants";
import type { XpAward } from "./xp.types";
import type { FinishedGame, Opponent, PlayedSideFacts } from "./xpGame.types";
import { upsetAwardFor } from "./xpUpset";

/**
 * What a win adds, on top of everything finishing already paid.
 *
 * Its own function because "what finishing pays" and "what winning pays" are two
 * questions, and every judgement about the other seat lives in the second one —
 * a person, a buddy, a rivalry, a grade. Keeping them apart is what lets a draw
 * and a loss be read in one glance above.
 */
export function winAwards(
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

    /* ── BEATING SOMEBODY BETTER THAN YOU ───────────────────────────────
       John's rule. One band or none, from both ratings as they stood; keyed
       on the game, so one game pays one band. It is only ever ADDED: a win
       over somebody weaker pays every award above and nothing less. After
       the finish, because it rides the day's allowance like the rest. */
    /* Only on a game the ladder counts, and true only: null is "not known". */
    const upset = game.ladderCounts === true ? upsetAwardFor(opponent.ratings) : null;
    if (upset !== null) awards.push({ type: upset, subject: game.id });
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
