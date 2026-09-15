import type { BacklogEffort, BacklogKind, BacklogPriority, BacklogStatus } from "../backlog/backlog.types.ts";

/** A `BacklogItem` row as Prisma returns it: the stored words, legacy statuses included. */
export type StoredBacklogRow = {
  id: string;
  key: string;
  title: string;
  detail: string;
  kind: string;
  status: string;
  priority: string | null;
  effort: string | null;
  askedBy: string;
  addedBy: string | null;
  claimedBy: string | null;
  claimedAt: Date | null;
  releasedIn: string | null;
  releasedAt: Date | null;
  createdAt: Date;
  movedAt: Date;
};

/** One row as Sumilabu's `POST tickets/import` takes it, in the contract's words. */
export type SumilabuImportRow = {
  id: string;
  /** Left off entirely while the target does not take keys (`targetTakesKeys`). */
  key?: string;
  title: string;
  detail: string | null;
  area: null;
  kind: BacklogKind;
  status: BacklogStatus;
  priority: BacklogPriority | null;
  effort: BacklogEffort | null;
  askedBy: string | null;
  claimedBy: string | null;
  claimedAt: string | null;
  releasedIn: string | null;
  releasedEntry: null;
  releasedAt: string | null;
  createdAt: string;
  movedAt: string;
};

/** A ticket as the target project hands it back: the fields a diff compares. */
export type SumilabuTicketView = {
  id: string;
  key?: string | null;
  title: string;
  detail: string | null;
  kind: string;
  status: string;
  priority: string | null;
  effort: string | null;
  askedBy: string | null;
  claimedBy: string | null;
  claimedAt: string | null;
  releasedIn: string | null;
  releasedAt: string | null;
  createdAt: string;
  movedAt: string;
};

/** One field brought inside a cap (or, for a title under the minimum, lengthened), with both lengths. */
export type ReshapedField = { field: "title" | "detail" | "askedBy"; before: number; after: number };

export type ReshapedRow = { id: string; key: string; fields: ReshapedField[] };

/** Something said about one row: why it cannot go, or what goes across as it stands. */
export type RowFinding = { id: string; key: string; says: string };

export type ExportPlan = {
  /** Every row that can go, reshaped to fit, keys still on. */
  rows: SumilabuImportRow[];
  /** Counts by the status each row STORES, legacy words included. */
  storedStatuses: Record<string, number>;
  /** Counts by the contract's status each sendable row goes as. */
  statuses: Record<string, number>;
  reshaped: ReshapedRow[];
  /** Values the contract has no word for, or past a cap nothing may trim. These stop `--run`. */
  unmappable: RowFinding[];
  /** Keys that are not Sumilabu slugs. These stop `--run` once the target takes keys. */
  keyProblems: RowFinding[];
  /** Shapes the contract would not write, sent as they stand and said out loud. */
  notes: RowFinding[];
  /** Done rows with no release stamp: every row finished before the column existed. */
  doneWithoutRelease: number;
  /** Rows carrying `addedBy`, which Sumilabu has no column for; the archive keeps it. */
  addedByNotCarried: number;
};

export type TicketDiff = {
  toAdd: string[];
  same: string[];
  changed: { id: string; fields: string[] }[];
  onlyOnTarget: string[];
};
