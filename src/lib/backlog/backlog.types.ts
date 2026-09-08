/**
 * The board's vocabulary.
 *
 * These mirror the Prisma enums, spelled out here so the pure module and the
 * components can be read, and tested, without pulling in a database client.
 */

export type BacklogStatus = "proposed" | "planned" | "building" | "done" | "dropped";

export type BacklogKind = "feature" | "fix" | "chore";

/** One row of the board, as everything above the database sees it. */
export type BacklogItem = {
  id: string;
  key: string;
  title: string;
  detail: string;
  kind: BacklogKind;
  status: BacklogStatus;
  askedBy: string;
  /** Who has picked it up, as free text; empty when nobody has. */
  assignedTo: string;
  /** ISO 8601. Dates cross to the client as strings, so they are strings all the way up. */
  createdAt: string;
  movedAt: string;
};

/** What someone types to add an item. The key is derived, never asked for. */
export type BacklogDraft = {
  title: string;
  detail: string;
  kind: BacklogKind;
  askedBy: string;
};

/** What the board is filtered to: one status, everything, or everything unfinished. */
export type StatusFilter = BacklogStatus | "all" | "open";

/** How the board is ordered. */
export type BacklogSort = "moved" | "newest" | "oldest" | "status";

/** How many items sit at each status, for the counts beside the filters. */
export type BacklogTally = Record<BacklogStatus, number>;
