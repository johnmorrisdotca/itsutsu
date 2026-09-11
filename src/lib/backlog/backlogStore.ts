import "server-only";

import { prisma } from "@/lib/prisma";

import {
  draftProblems,
  editProblems,
  moveProblems,
  normalizeDraft,
  releaseStampFor,
  revisedDraft,
  statusFrom,
} from "./backlog";
import { BACKLOG_SEED } from "./backlog.seed.data";
import type {
  BacklogChange,
  BacklogDraft,
  BacklogEdit,
  BacklogItem,
  BacklogKind,
  BacklogStatus,
} from "./backlog.types";

/**
 * The board, in the database.
 *
 * Everything that decides anything — whether a move is allowed, whether a
 * draft is a real request — lives in backlog.ts and is pure. This file only
 * reads and writes, so the rules cannot end up stated twice with the two
 * statements disagreeing.
 *
 * AND EVERY WRITE ASKS THE RULES FIRST. The route used to be the only place
 * the caps and the move table were consulted, so anything reaching the store
 * from inside the process — a script, a runner, a test — could write a row
 * the board's own form would have refused. Rows over the detail cap were
 * written exactly that way, and a row past the cap is a row nothing above the
 * database can bring back under it. Now `changeItem` is the one door for
 * changing a row and `addItem` the one door for adding one, and each refuses
 * before it writes. A cap that has to hold against something that is not
 * this process at all is the database's to keep, not this file's.
 */

type Row = {
  id: string;
  key: string;
  title: string;
  detail: string;
  kind: string;
  status: string;
  priority: string | null;
  effort: string | null;
  askedBy: string;
  assignedTo: string;
  createdAt: Date;
  movedAt: Date;
  releasedIn: string | null;
};

/** A row as everything above the database sees it: dates as ISO strings. */
function toItem(row: Row): BacklogItem {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    detail: row.detail,
    kind: row.kind as BacklogKind,
    status: statusFrom(row.status),
    priority: row.priority as BacklogItem["priority"],
    effort: row.effort as BacklogItem["effort"],
    askedBy: row.askedBy,
    assignedTo: row.assignedTo,
    createdAt: row.createdAt.toISOString(),
    movedAt: row.movedAt.toISOString(),
    releasedIn: row.releasedIn,
  };
}

const SELECT = {
  id: true,
  key: true,
  title: true,
  detail: true,
  kind: true,
  status: true,
  priority: true,
  effort: true,
  askedBy: true,
  assignedTo: true,
  createdAt: true,
  movedAt: true,
  releasedIn: true,
} as const;

/**
 * Writes the starter set, but only into an empty board.
 *
 * Seeding on emptiness rather than per row is deliberate. The seed is a
 * snapshot of what had been asked for before the board existed; once the board
 * is in use it is the source of truth, and an item somebody dropped must not
 * come back the next time a page is rendered. `skipDuplicates` covers the one
 * remaining race, two first visitors at once.
 */
export async function ensureSeeded(): Promise<number> {
  const existing = await prisma.backlogItem.count();
  if (existing > 0) return 0;
  const written = await prisma.backlogItem.createMany({
    data: BACKLOG_SEED.map((item) => ({
      key: item.key,
      title: item.title,
      detail: item.detail,
      kind: item.kind,
      status: item.status,
      askedBy: item.askedBy,
    })),
    skipDuplicates: true,
  });
  return written.count;
}

/** The whole board, most recently moved first. It is a list of dozens, not thousands. */
export async function fetchBoard(): Promise<BacklogItem[]> {
  await ensureSeeded();
  const rows = await prisma.backlogItem.findMany({ orderBy: { movedAt: "desc" }, select: SELECT });
  return rows.map(toItem);
}

export type AddOutcome =
  | { ok: true; item: BacklogItem }
  | { ok: false; problems: string[] };

/**
 * Adds a request, refusing anything the board's own rules call unusable.
 *
 * Keys are derived from the title and have to stay unique, and two people can
 * ask for the same thing on the same day, so a taken key gets a numbered
 * neighbour rather than an error a person would have to understand.
 */
export async function addItem(draft: BacklogDraft, addedBy: string | null): Promise<AddOutcome> {
  const problems = draftProblems(draft);
  if (problems.length > 0) return { ok: false, problems };

  const clean = normalizeDraft(draft);
  let key = clean.key;
  for (let attempt = 2; attempt < 100; attempt += 1) {
    const taken = await prisma.backlogItem.findUnique({ where: { key }, select: { id: true } });
    if (taken === null) break;
    key = `${clean.key}-${attempt}`;
  }

  const row = await prisma.backlogItem.create({
    data: {
      key,
      title: clean.title,
      detail: clean.detail,
      kind: clean.kind,
      askedBy: clean.askedBy,
      addedBy,
    },
    select: SELECT,
  });
  return { ok: true, item: toItem(row) };
}

export type MoveOutcome =
  | { ok: true; item: BacklogItem }
  | { ok: false; reason: "missing" }
  /** Refused by the board's rules, with the reasons in words a person can act on. */
  | { ok: false; reason: "illegal"; problems: string[] };

/**
 * Changes one row — a move, a revision of its text, a grade, a name — in a
 * single write, after every rule the change touches has been asked.
 *
 * Refused whole or written whole. A request carrying a legal grade and an
 * illegal move used to be applied in two halves, and the half that could be
 * written was; now nothing is written until all of it may be. The rules are
 * asked in the same module the form and the route ask them in:
 *
 *  - a status, against the table of moves (`moveProblems`);
 *  - a title, a detail, a kind or a name, against what makes a usable request
 *    (`draftProblems`, over the row as it would stand afterwards);
 *  - an assignee or a grade, against `editProblems`.
 *
 * `movedAt` and the release stamp move only with the status — an edit to a
 * title is not movement, and "what has moved this week" is read from it. The
 * key never changes: it was derived once and may already be cited somewhere.
 */
export async function changeItem(id: string, change: BacklogChange): Promise<MoveOutcome> {
  const current = await prisma.backlogItem.findUnique({ where: { id }, select: SELECT });
  if (current === null) return { ok: false, reason: "missing" };
  const item = toItem(current);

  const { status, title, detail, kind, askedBy, ...edit } = change;
  const text: Partial<BacklogDraft> = { title, detail, kind, askedBy };
  const revising = Object.values(text).some((value) => value !== undefined);
  const revised = revising ? normalizeDraft(revisedDraft(item, text)) : null;

  const problems = [
    ...(status === undefined ? [] : moveProblems(item.status, status)),
    ...(revised === null ? [] : draftProblems(revised)),
    ...editProblems(edit),
  ];
  if (problems.length > 0) return { ok: false, reason: "illegal", problems };

  const row = await prisma.backlogItem.update({
    where: { id },
    data: {
      ...(status === undefined ? {} : { status, movedAt: new Date(), releasedIn: releaseStampFor(status) }),
      ...(revised === null
        ? {}
        : { title: revised.title, detail: revised.detail, kind: revised.kind, askedBy: revised.askedBy }),
      ...(edit.assignedTo === undefined ? {} : { assignedTo: edit.assignedTo.trim() }),
      ...(edit.priority === undefined ? {} : { priority: edit.priority }),
      ...(edit.effort === undefined ? {} : { effort: edit.effort }),
    },
    select: SELECT,
  });
  return { ok: true, item: toItem(row) };
}

/** Moves an item to another status, if the board's table of moves allows it. */
export async function moveItem(id: string, to: BacklogStatus): Promise<MoveOutcome> {
  return changeItem(id, { status: to });
}

/**
 * Says who has picked an item up, or nobody. Free text, trimmed, and short:
 * it is a name to recognise, not a record to join on — and one too long to be
 * that is refused rather than cut, the same answer the route gives.
 */
export async function assignItem(id: string, to: string): Promise<MoveOutcome> {
  return changeItem(id, { assignedTo: to });
}

/**
 * Writes the fields of a row that are somebody's opinion rather than the
 * board's rules: who has it, how much it matters, how much work it is.
 *
 * A status is not one of them and never passes through here; it is a move,
 * and a move is `changeItem` with a status on it.
 */
export async function editItem(id: string, fields: BacklogEdit): Promise<MoveOutcome> {
  return changeItem(id, fields);
}
