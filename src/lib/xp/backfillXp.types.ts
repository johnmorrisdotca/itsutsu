import type { DecidedSeats } from "@/lib/rating/playedRun";

import type { XpAward, XpEventType } from "./xp.types";

/**
 * The vocabulary of a replay: what it is handed, and what it produces.
 *
 * Kept apart from `backfillXp.ts` the way `xp.types.ts` is kept apart from
 * `xp.constants.ts`, and for a second reason here — **every one of these types
 * is a promise about what the runner must READ**. A field on `BackfillMember`
 * is a column somebody has to select, and a field the planner does not declare
 * is a fact it cannot use. Reading them in one place is how the runner's query
 * and the planner's rules are checked against each other by the compiler
 * rather than by a dry run.
 */

/**
 * A member, as much of one as a replay needs.
 *
 * `botTier` and not `botTierFor(id)`, because these are two different questions
 * and `awardXp` asks this one: the COLUMN is what refuses a computer player its
 * climb. `botTierFor` answers the other — what grade is in the other seat —
 * and the planner uses that one for the opponent, exactly as `xpGameServer`
 * does.
 */
export type BackfillMember = {
  id: string;
  /** For a report a person reads. Never a key. */
  name: string;
  botTier: string | null;
  /**
   * Their own zone. The day key an award is filed under, and whether a game
   * fell at the weekend, are questions about the member's days and not the
   * server's — a game that ended on Sunday evening in Tokyo ended on Saturday
   * night in Tallinn.
   */
  timeZone: string | null;
  /**
   * Their address, or null. Carried only because the buddy list is keyed by
   * address: null means `wonVsBuddy` cannot be asked, which is reported as
   * "not known" rather than as "not a buddy".
   */
  email: string | null;
  /** When `joined` was earned. */
  createdAt: Date;
};

/**
 * One decided game, in the order it was played.
 *
 * `DecidedSeats` and not a restatement of it: `playedSides` is the whole
 * definition of whose run a game moves and which way, and the planner calls it
 * rather than deciding again.
 */
export type BackfillGame = DecidedSeats & {
  id: string;
  variant: string;
  moveCount: number;
  /**
   * THE MOMENT THE REPLAY STAMPS, and the column it orders by. See the note on
   * `playedAt` in `backfillXp.ts`: it is the game's own moment, which is not
   * quite its finish, and it is the only one of the row's dates that cannot
   * move after the fact.
   */
  playedAt: Date;
};

/** One buddy link, by member id, with the moment it was made. */
export type BackfillBuddy = { owner: string; buddy: string; since: Date };

/**
 * One row already in the ledger.
 *
 * The replay is seeded with every one of these, for two reasons that are easy
 * to conflate. The obvious one is IDEMPOTENCY — an award already paid must not
 * be counted again in what a dry run says it would pay. The second is that
 * three of the awards are COUNTS of ledger rows (`everyVariantPlayed`,
 * `everyFamilyPlayed`, `everyGradeBeaten`), so a member who has met eleven
 * games since 0.162.0 and meets the other twenty-eight in the replay must
 * arrive at thirty-nine. A replay that only counted its own would never
 * complete a set.
 */
export type HeldEvent = { memberId: string; type: string; subject: string; dayKey: string };

/** Everything a plan is made from. */
export type BackfillInput = {
  members: readonly BackfillMember[];
  /** Decided games, OLDEST FIRST. The planner does not sort them. */
  games: readonly BackfillGame[];
  buddies: readonly BackfillBuddy[];
  held: readonly HeldEvent[];
};

/** One award the plan expects to be paid, with what it comes to. */
export type PlannedAward = { type: XpEventType; subject: string; points: number };

/** Why a batch exists, for a report a person reads. */
export type BackfillReason =
  | { kind: "joined" }
  | { kind: "game"; gameId: string; variant: string }
  /** A set completed by the game named. The tour's two, and the ladder's. */
  | { kind: "collected"; gameId: string };

/**
 * One call to `awardXp`, as the replay will make it.
 *
 * `awards` is what to ASK for and `paying` is what the plan expects that to
 * come to, and the two are deliberately separate. The runner asks for the full
 * list — every award `gameAwards` returned — so that the unique index and the
 * day's allowance stay the arbiters they are on the live site. `paying` is the
 * planner's prediction of their verdict, which is what lets a dry run say what
 * a write would pay; the runner then compares the two and reports any
 * disagreement rather than trusting either.
 */
export type PlannedBatch = {
  memberId: string;
  at: Date;
  /** The day this lands under, in the member's zone. */
  dayKey: string;
  reason: BackfillReason;
  awards: XpAward[];
  paying: PlannedAward[];
  points: number;
};

/** What the plan comes to for one member. */
export type MemberPlan = {
  member: BackfillMember;
  points: number;
  events: number;
  /** Per award type, so a total can be read back against the coverage table. */
  byType: Map<XpEventType, { events: number; points: number }>;
};

/** The whole replay, ready to be printed or paid. */
export type BackfillPlan = {
  /** Every batch with something to pay, in chronological order. */
  batches: PlannedBatch[];
  perMember: Map<string, MemberPlan>;
  points: number;
  events: number;
  byType: Map<XpEventType, { events: number; points: number }>;
};

/**
 * A member whose total does not equal their own ledger.
 *
 * The one check `XP_DESIGN.md` names as the only way to know a replay landed,
 * and the runner's reason to refuse: a database where the two already disagree
 * is one where nothing this writes can be checked afterwards.
 */
export type LedgerDisagreement = {
  memberId: string;
  name: string;
  /** `Member.xp`. */
  xp: number;
  /** `sum(XpEvent.points)`, which is what it should be. */
  ledger: number;
};
