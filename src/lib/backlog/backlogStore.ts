import "server-only";

import { prisma } from "@/lib/prisma";

import { canMove, draftProblems, normalizeDraft, statusFrom } from "./backlog";
import { ASSIGNED_TO_MAX } from "./backlog.constants";
import { BACKLOG_SEED } from "./backlog.seed.data";
import type { BacklogDraft, BacklogEdit, BacklogItem, BacklogKind, BacklogStatus } from "./backlog.types";

/**
 * The board, in the database.
 *
 * Everything that decides anything — whether a move is allowed, whether a
 * draft is a real request — lives in backlog.ts and is pure. This file only
 * reads and writes, so the rules cannot end up stated twice with the two
 * statements disagreeing.
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
  | { ok: false; reason: "missing" | "illegal" };

/**
 * Moves an item to another status, if the board's table of moves allows it.
 * `movedAt` is set here and nowhere else — it is what "what has moved this
 * week" is read from, so an edit to a title must not disturb it.
 */
export async function moveItem(id: string, to: BacklogStatus): Promise<MoveOutcome> {
  const current = await prisma.backlogItem.findUnique({ where: { id }, select: SELECT });
  if (current === null) return { ok: false, reason: "missing" };
  if (!canMove(statusFrom(current.status), to)) return { ok: false, reason: "illegal" };

  const row = await prisma.backlogItem.update({
    where: { id },
    data: { status: to, movedAt: new Date() },
    select: SELECT,
  });
  return { ok: true, item: toItem(row) };
}

/**
 * Says who has picked an item up, or nobody. Free text, trimmed, and short:
 * it is a name to recognise, not a record to join on.
 */
export async function assignItem(id: string, to: string): Promise<MoveOutcome> {
  return editItem(id, { assignedTo: to.trim().slice(0, ASSIGNED_TO_MAX) });
}

/**
 * Writes the fields of a row that are somebody's opinion rather than the
 * board's rules: who has it, how much it matters, how much work it is.
 *
 * A status is not one of them and never passes through here. Moving a row is
 * checked against the board's table by `moveItem`, and a second door that
 * wrote a status without asking would be the rule holding in one place and
 * not the other.
 */
export async function editItem(id: string, fields: BacklogEdit): Promise<MoveOutcome> {
  const current = await prisma.backlogItem.findUnique({ where: { id }, select: { id: true } });
  if (current === null) return { ok: false, reason: "missing" };
  const item = await prisma.backlogItem.update({ where: { id }, data: fields, select: SELECT });
  return { ok: true, item: toItem(item) };
}
