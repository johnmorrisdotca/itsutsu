import type { Streak, StreakOutcome } from "@/lib/rating/streak";

import type { RatingsAsTheyStood } from "./xpUpset";

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
  /**
   * Whether the ladder counts this game: rated, and not refused by the ladder's
   * own rule (`countsOnLadder` in `playedRun.ts`). Only then may an upset bonus
   * be paid — a friendly costs its loser nothing, so a gap no rated game tested
   * is not one anybody overturned. NULL where it is not known, which is the
   * replay, and null pays no upset.
   */
  ladderCounts: boolean | null;
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
  /**
   * Both players' standing on the ladder of people as they went INTO the game,
   * for the upset bonus. Null where nothing was read — a loss, a program, a
   * failed read, or a replay, which cannot know them — and null pays nothing.
   * See `xpUpset.ts`.
   */
  ratings: RatingsAsTheyStood | null;
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
  /**
   * How many games at THIS game this member has now finished with THIS outcome,
   * this one included — what a milestone at one game is counted against.
   *
   * Null where it was not read, or could not be: a variant this deploy cannot
   * name, a failed count. Null pays no milestone, which is the safe answer; a
   * missed one is paid by the replay.
   */
  sameResultsAtGame: number | null;
};
