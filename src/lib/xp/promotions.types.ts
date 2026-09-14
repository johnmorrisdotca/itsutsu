/**
 * The shapes of a promotion, from the ledger row that reveals one to the line a
 * page draws. See `promotions.ts` for how one is derived and `promotionsRead.ts`
 * for the query.
 */

/**
 * One award batch that carried a member's total over at least one rung, as the
 * query returns it — the running totals either side of it, and the member.
 *
 * A BATCH, not a row. One `awardXp` call writes its rows in one transaction, and
 * every row in it shares that transaction's `createdAt`, so a finished game that
 * pays a finish, a win and a first-of-variant is one step of the total and one
 * promotion at most — not three steps of which the middle one happens to cross.
 */
export type PromotionBatch = {
  memberId: string;
  /** When the batch was written: the moment the total actually moved. */
  at: Date;
  /** The day the batch was filed under, which a replay sets to the day of the play it paid. */
  dayKey: string;
  /** The member's total before this batch. */
  before: number;
  /** The member's total after it. */
  after: number;
  name: string;
  /** A program's grade, or null for a person. */
  botTier: string | null;
  /** The member's zone as it is now; empty is UTC. */
  timeZone: string;
};

/** One line of the recent promotions page. */
export type Promotion = {
  memberId: string;
  name: string;
  /** A computer player, which the Computers filter keeps and People takes off. */
  computer: boolean;
  /** The level they stood on before the award. */
  from: number;
  /** The level the award carried them to — more than one above `from` when it crossed several. */
  to: number;
  /** When the total crossed. */
  at: Date;
  /**
   * The day of the play a backfill paid for, where this promotion came from one —
   * or null for a promotion earned when it was written.
   *
   * Null is the ordinary case and the only one that may be shown as "earned that
   * day"; a day here means the total crossed on `at` for play that happened on
   * this earlier day, and the page says so rather than dating it by the replay.
   */
  paidLater: string | null;
};

/** One page of promotions, newest first, and the way to the page after it. */
export type PromotionsPage = {
  items: Promotion[];
  /** The cursor for the next, older page, or null where this is the last one. */
  next: string | null;
};

/** Where a page of promotions starts: strictly older than this batch. */
export type PromotionsCursor = {
  at: Date;
  memberId: string;
};
