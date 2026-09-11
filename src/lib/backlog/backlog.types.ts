/**
 * The board's vocabulary.
 *
 * These mirror the Prisma enums, spelled out here so the pure module and the
 * components can be read, and tested, without pulling in a database client.
 */

export type BacklogStatus = "open" | "inProgress" | "done" | "dropped";

export type BacklogKind = "feature" | "fix" | "chore";

/**
 * How much a thing matters, and how much work it is. Two axes rather than
 * one, because they are independent: a valuable hard thing and a trivial easy
 * thing score the same on a single number, and telling those apart is the
 * whole reason for grading a board at all.
 *
 * Both are null until somebody grades them. That is deliberate — a default of
 * "normal" would put a judgement nobody made onto every row, and it would be
 * indistinguishable from one somebody did make.
 */
export type BacklogPriority = "high" | "normal" | "low";

/** How much work, and how much can go wrong: risk lives here rather than in a third axis. */
export type BacklogEffort = "small" | "medium" | "large";

/** One row of the board, as everything above the database sees it. */
export type BacklogItem = {
  id: string;
  key: string;
  title: string;
  detail: string;
  kind: BacklogKind;
  status: BacklogStatus;
  /** How much it matters and how much work it is, or null where nobody has said. */
  priority: BacklogPriority | null;
  effort: BacklogEffort | null;
  askedBy: string;
  /**
   * Who holds this, as free text, and when the hold was written. In progress
   * is not a status on its own, it is this pair inside the lease — see
   * `heldNow` and `LEASE_MS`. Both null together means nobody has it; a mover
   * always writes them together, never one without the other.
   */
  claimedBy: string | null;
  /** ISO 8601, or null exactly when claimedBy is null. */
  claimedAt: string | null;
  /** ISO 8601. Dates cross to the client as strings, so they are strings all the way up. */
  createdAt: string;
  movedAt: string;
  /**
   * The version that was running when this row was marked done, or null —
   * which is every row finished before the column existed, and every row that
   * is not done. Not derivable after the fact: see the schema for why.
   */
  releasedIn: string | null;
  /**
   * The instant of the release that carried this, or null for every row
   * finished before this column existed and every row that is not done.
   * Written by the release tool only (board-convergence ITS-04); until then
   * nothing sets it.
   */
  releasedAt: string | null;
};

/** What someone types to add an item. The key is derived, never asked for. */
export type BacklogDraft = {
  title: string;
  detail: string;
  kind: BacklogKind;
  askedBy: string;
};

/** What the board is filtered to: one status, everything, or everything unfinished. */
/**
 * What the board is showing. The statuses themselves, plus two that are not
 * statuses: everything, and everything still wanting something.
 *
 * That last one used to be called "open", which stopped working the day one
 * of the statuses became Open — a chip meaning "not finished" and a chip
 * meaning "nobody is on it" cannot both be the same word on the same row of
 * buttons. `unfinished` says the thing the umbrella actually means.
 *
 * `stale` is not a status either — a stale row is still, honestly,
 * `inProgress` in the status column. It is a claim nobody has renewed inside
 * the lease, so it is filtered apart from the rows somebody is actually
 * holding right now.
 */
export type StatusFilter = BacklogStatus | "all" | "unfinished" | "stale";

/** How the board is ordered. */
export type BacklogSort = "moved" | "newest" | "oldest" | "status" | "quickWins";

/**
 * How many items sit at each status, for the counts beside the filters.
 *
 * `inProgress` counts only rows `heldNow` — a lapsed claim is not somebody
 * working. `stale` is the rest of what the status column alone would have
 * called in progress: a row nobody has renewed inside the lease. The two
 * never overlap and together account for every `inProgress` row.
 */
export type BacklogTally = Record<BacklogStatus, number> & { stale: number };

/**
 * The fields of a row somebody may change directly. Status is deliberately
 * absent: it moves through `canMove` or it does not move. Who holds a row is
 * absent for the same reason — it moves through a claim, written by the store
 * from the actor making the move, never sent as a field to set directly.
 */
export type BacklogEdit = {
  priority?: BacklogPriority | null;
  effort?: BacklogEffort | null;
};

/**
 * Everything a row may be changed to in one request: a move, a revision of
 * its text, a grade, a name. One shape rather than three, so that a caller
 * carrying a legal grade and an illegal move is refused whole, before either
 * half is written. Every field is optional; the store decides which rule each
 * one answers to.
 */
export type BacklogChange = BacklogEdit &
  Partial<BacklogDraft> & {
    status?: BacklogStatus;
  };
