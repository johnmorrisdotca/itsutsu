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
  /** Who has picked it up, as free text; empty when nobody has. */
  assignedTo: string;
  /** ISO 8601. Dates cross to the client as strings, so they are strings all the way up. */
  createdAt: string;
  movedAt: string;
  /**
   * The version that was running when this row was marked done, or null —
   * which is every row finished before the column existed, and every row that
   * is not done. Not derivable after the fact: see the schema for why.
   */
  releasedIn: string | null;
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
 */
export type StatusFilter = BacklogStatus | "all" | "unfinished";

/** How the board is ordered. */
export type BacklogSort = "moved" | "newest" | "oldest" | "status" | "quickWins";

/** How many items sit at each status, for the counts beside the filters. */
export type BacklogTally = Record<BacklogStatus, number>;

/**
 * The fields of a row somebody may change directly. Status is deliberately
 * absent: it moves through `canMove` or it does not move.
 */
export type BacklogEdit = {
  assignedTo?: string;
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
