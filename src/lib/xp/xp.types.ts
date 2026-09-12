/**
 * The vocabulary of the XP ledger.
 *
 * Kept apart from `xp.constants.ts` the way `gomoku.types.ts` is kept apart
 * from `gomoku.constants.ts`: the union is what the compiler checks a keyed
 * table against, and a table that declared its own keys could not be checked
 * for completeness.
 */

/**
 * Everything that earns XP here.
 *
 * A union and not a Prisma enum, deliberately. A Postgres enum member cannot be
 * renamed under rows that hold it, and this list is going to grow — the
 * `BacklogStatus` enum carries three legacy values for exactly that reason.
 * `XpEvent.type` is a plain string and this union is what keeps it honest at
 * every call site.
 *
 * Grouped by what they are about, in the order `docs/plans/xp/XP_DESIGN.md`
 * argues them.
 */
export type XpEventType =
  // Arriving, and coming back.
  | "joined"
  | "dailyVisit"
  | "dayStreak7"
  | "dayStreak30"
  | "dayStreak100"
  | "dayStreak365"
  | "weekendGame"
  | "backFromAway"
  // Playing.
  | "firstGameEver"
  | "gameFinished"
  | "gameWon"
  | "wonVsPerson"
  | "wonVsBuddy"
  | "revengeWin"
  | "longGame"
  | "comeback"
  | "winStreak3"
  | "winStreak5"
  | "winStreak10"
  // The tour: thirty-nine games and eleven families.
  | "firstOfVariant"
  | "firstWinAtVariant"
  | "firstOfFamily"
  | "everyFamilyPlayed"
  | "everyVariantPlayed"
  // The computer ladder.
  | "gradeBeaten"
  | "everyGradeBeaten"
  | "specialistBeaten"
  // People.
  | "firstBuddy"
  | "buddyAdded"
  | "challengeSent"
  | "challengeAnswered"
  | "rematchPlayed"
  | "forkPlayed"
  | "timeGiven"
  | "applauseGiven"
  // Who you are.
  | "nameSet"
  | "countrySet"
  | "bioSet"
  | "wordsSet"
  | "seatClaimedElsewhere";

/**
 * What one kind of award is worth, and how often it may happen.
 *
 * Shaped after `STATUS_DISPLAY` in `backlog.constants.ts` — `label`, `kanji`,
 * `blurb` — with the two behaviour fields the ledger needs beside them, because
 * separating "what it is called" from "what it does" would mean two tables to
 * keep in step for no reader's benefit.
 */
export type XpEventSpec = {
  points: number;
  /** What a member reads in a list or a table cell. */
  label: string;
  kanji: string;
  /** Why it exists, in a sentence, for the member reading their own history. */
  blurb: string;
  /**
   * What a toast says. Second person, present tense, no points in it — the
   * toast prints the number itself.
   */
  sentence: string;
  /**
   * Events of this type one member may earn in a day. Absent means no
   * allowance, which is right for anything that cannot be farmed: a first game
   * of a variant happens once however hard somebody tries.
   */
  cap?: number;
  /**
   * True where this award only fires if the same game's `gameFinished` was
   * actually paid.
   *
   * One rule in one place, so a game outside the day's allowance is silent as a
   * whole rather than paying for being won but not for being finished. It is
   * never set on a first-time or milestone award: beating Guoshou for the first
   * time on your seventh game of the day is not the thing worth rationing, and
   * telling somebody nothing happened is the failure the cap exists to prevent.
   */
  ridesAllowance?: true;
  /**
   * Set when a kind stops being awarded. **The row is never deleted.**
   *
   * Events already recorded still point at it, and an event that cannot explain
   * itself is worse than a stale row. UmaKuma keeps `XpType` rows for the same
   * reason; here it is a field rather than a table.
   */
  retired?: true;
};

/** One award to make: the type, and what it is about. */
export type XpAward = {
  type: XpEventType;
  /**
   * What this award is about, and therefore how often it may happen. See
   * `XP_DESIGN.md`: the day key for a daily award, the game id for a game, the
   * variant for a first play, `""` for an award about nobody but the member.
   *
   * Omitted means `""`. Never null — Postgres does not consider two nulls
   * equal, so a null here would quietly let a once-ever award be paid twice.
   */
  subject?: string;
};

/** What one award actually came to. */
export type XpAwarded = {
  type: XpEventType;
  /** Zero where the award was already earned, or the day's allowance was full. */
  points: number;
  /** Why it came to nothing, for a surface that has to explain a zero. */
  skipped?: XpSkipReason;
};

/**
 * Why an award paid nothing.
 *
 * A code rather than a sentence, because a caller writes it onto a row and a
 * page words it for whoever is reading. The distinction matters: "you already
 * had this" and "you have played enough games today" are different facts, and
 * UmaKuma shipped a day where both read as silence.
 */
export const XP_SKIP_REASONS = {
  /** The (member, type, subject) row already exists. Nothing owed. */
  alreadyEarned: "already-earned",
  /** The day's allowance for this type is full. */
  dailyAllowance: "daily-allowance",
  /** A computer player. They play, they do not climb. */
  notAPerson: "not-a-person",
  /** No member row answers to that id — the operator, or an unbound seat. */
  noSuchMember: "no-such-member",
} as const;

export type XpSkipReason = (typeof XP_SKIP_REASONS)[keyof typeof XP_SKIP_REASONS];

/** The whole result of one call to award, for a caller that has to report it. */
export type XpAwardResult = {
  /** One entry per award asked for, in the order they were asked for. */
  awards: XpAwarded[];
  /** What the lot came to. */
  points: number;
  /** The member's total afterwards. */
  xp: number;
  /** The level they arrived at, and the one they left, when an award moved it. */
  crossed: { from: number; to: number } | null;
};
