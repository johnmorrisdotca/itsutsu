import type { BacklogEffort, BacklogItem, BacklogKind, BacklogPriority, BacklogStatus } from "../backlog/backlog.types.ts";

/**
 * A ticket as Sumilabu's board hands it back: `BoardTicketView` in
 * sumilabu-dashboard's `src/lib/board/server.ts` at 5e53add.
 */
export type BoardTicketView = {
  id: string;
  projectKey: string;
  key: string | null;
  title: string;
  detail: string | null;
  area: string | null;
  kind: string;
  status: string;
  priority: string | null;
  effort: string | null;
  askedBy: string | null;
  claimedBy: string | null;
  claimedAt: string | null;
  heldNow: boolean;
  releasedIn: string | null;
  releasedEntry: string | null;
  releasedAt: string | null;
  editedBy?: string | null;
  editedAt?: string | null;
  createdAt: string;
  movedAt: string;
  parentId?: string | null;
  parent?: string | null;
  children?: string[];
  related?: string[];
};

/** A new request in Itsutsu's words, with the key it will be cited by. */
export type BoardDraft = {
  key: string;
  title: string;
  detail: string;
  kind: BacklogKind;
  askedBy: string;
};

/** A status a move may name. `done` is never one: the release tool ships. */
export type BoardMoveTarget = Exclude<BacklogStatus, "done">;

/** What one PATCH may carry. Kind and who asked are set when a row is filed and not revised. */
export type BoardChange = {
  status?: BoardMoveTarget;
  title?: string;
  detail?: string;
  priority?: BacklogPriority | null;
  effort?: BacklogEffort | null;
  parentId?: string | null;
};

/** Why a write was refused, in the board's own terms. `refused` is a cap or a payload the board would not take. */
export type BoardRefusal = "missing" | "illegal" | "held" | "done" | "refused";

export type BoardOutcome =
  | { ok: true; item: BacklogItem }
  | { ok: false; reason: BoardRefusal; problems: string[]; heldBy: string | null };

/** Why `stampTicket` was refused. Never `held`: a `done` row's `claimedBy` is already null. */
export type StampRefusal = "missing" | "notDone" | "alreadyStamped" | "refused";

export type StampOutcome = { ok: true; item: BacklogItem } | { ok: false; reason: StampRefusal; problems: string[] };

/** What one import batch came to: how many rows the service took, or its problems by row. */
export type BoardImportOutcome = { ok: true; imported: number } | { ok: false; status: number; problems: string[] };

/** A note on a ticket: appended, never changed. */
export type BoardNote = { id: string; ticketId: string; body: string; by: string; createdAt: string };

/** One revision of a ticket's title or detail, with the words it replaced. */
export type BoardEdit = { id: string; field: string; oldValue: string | null; newValue: string | null; editedBy: string | null; editedAt: string };

/** What a note, a link or an unlink came to: the board's answer, or its problems in words. */
export type BoardNoteOutcome = { ok: true; note: BoardNote } | { ok: false; reason: "missing" | "refused"; problems: string[] };

export type BoardLinkOutcome = { ok: true; changed: boolean; related: string[] } | { ok: false; reason: "missing" | "refused"; problems: string[] };
