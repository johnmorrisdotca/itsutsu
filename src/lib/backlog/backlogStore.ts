import "server-only";

import { prisma } from "@/lib/prisma";

import {
  LEASE_MS,
  draftProblems,
  editProblems,
  moveData,
  moveProblems,
  moveWhere,
  normalizeDraft,
  revisedDraft,
  statusFrom,
} from "./backlog";
import { BACKLOG_STATUSES } from "./backlog.constants";
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
  claimedBy: string | null;
  claimedAt: Date | null;
  createdAt: Date;
  movedAt: Date;
  releasedIn: string | null;
  releasedAt: Date | null;
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
    claimedBy: row.claimedBy,
    claimedAt: row.claimedAt === null ? null : row.claimedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    movedAt: row.movedAt.toISOString(),
    releasedIn: row.releasedIn,
    releasedAt: row.releasedAt === null ? null : row.releasedAt.toISOString(),
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
  claimedBy: true,
  claimedAt: true,
  createdAt: true,
  movedAt: true,
  releasedIn: true,
  releasedAt: true,
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
  | { ok: false; reason: "illegal"; problems: string[] }
  /** Refused because somebody else's claim is still inside its lease. */
  | { ok: false; reason: "held"; heldBy: string };

/**
 * Changes one row — a move, a revision of its text, a grade — in a single
 * write, after every rule the change touches has been asked.
 *
 * Refused whole or written whole, exactly as before ITS-01: nothing is
 * written until every field the request carries has passed its own rule. The
 * rules are asked in the same module the form and the route ask them in:
 *
 *  - a status, against the table of moves (`moveProblems`);
 *  - a title, a detail, a kind or an asker, against what makes a usable
 *    request (`draftProblems`, over the row as it would stand afterwards);
 *  - a grade, against `editProblems`.
 *
 * What changed is how the write happens once validation has passed and a
 * status is part of the request. A status is not this process's alone to
 * grant — another session, or another tab, may be moving the same row right
 * now — so it is never written on the strength of what `findUnique` returned
 * a moment ago. The write is conditional (BOARD_RULES.md invariant 4): the
 * database is asked to change the row only if it still stands where this
 * read it and is not held by a live claim that is not this actor's. A grade
 * or a text revision carrying no status touches neither the status column
 * nor the claim, so it is written plainly — the condition exists to protect
 * exactly those two columns, nothing else needs it.
 *
 * `movedAt` and the claim move only with the status — an edit to a title is
 * not movement, and does not touch who holds the row. The key never changes:
 * it was derived once and may already be cited somewhere.
 */
export async function changeItem(
  id: string,
  change: BacklogChange,
  actor: string,
  now: Date = new Date(),
): Promise<MoveOutcome> {
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

  const textData = revised === null ? {} : { title: revised.title, detail: revised.detail, kind: revised.kind, askedBy: revised.askedBy };
  const gradeData = {
    ...(edit.priority === undefined ? {} : { priority: edit.priority }),
    ...(edit.effort === undefined ? {} : { effort: edit.effort }),
  };

  if (status === undefined) {
    // Neither the status nor the claim is touched, so this needs none of the
    // conditional dance a move does.
    const row = await prisma.backlogItem.update({ where: { id }, data: { ...textData, ...gradeData }, select: SELECT });
    return { ok: true, item: toItem(row) };
  }

  const staleBefore = new Date(now.getTime() - LEASE_MS);
  const moved = await prisma.backlogItem.updateMany({
    /*
     * THE STORED STATUS, NOT THE READ ONE. `toItem` folds the board's older
     * vocabulary as it reads — `proposed` becomes `open`, `building` becomes
     * `inProgress` — so `item.status` is what the row MEANS and
     * `current.status` is what the row SAYS. This `where` is matched by the
     * database against the column, so it has to be the latter.
     *
     * Getting that wrong made every legacy row unmovable: 14 rows on
     * production, including 6 the release sweep needed, refused every move
     * with `status = 'open'` matching a column holding `'proposed'`. It only
     * showed against production, because the development database had been
     * migrated to the new words and had no legacy row left to catch it.
     */
    where: moveWhere(id, current.status as BacklogStatus, actor, staleBefore),
    data: { ...moveData(status, actor, now), ...textData, ...gradeData },
  });

  if (moved.count === 0) {
    /*
     * Nothing matched. Re-read to say WHICH of the two reasons it was, rather
     * than reporting the commoner one and being wrong the rest of the time:
     * a live claim somebody else holds, or the row having moved out from
     * under this change since it was read.
     *
     * "held by somebody" was the single answer here, and it is a guess
     * wearing a fact — the fault above surfaced as fourteen rows claiming to
     * be held when not one of them was claimed at all, which is what sent the
     * first diagnosis to the lease instead of the `where`.
     */
    const fresh = await prisma.backlogItem.findUnique({ where: { id }, select: { claimedBy: true, status: true } });
    if (fresh === null) return { ok: false, reason: "missing" };
    if (fresh.claimedBy !== null && fresh.claimedBy !== "") {
      return { ok: false, reason: "held", heldBy: fresh.claimedBy };
    }
    return {
      ok: false,
      reason: "illegal",
      problems: [`This row is "${fresh.status}" now, not "${current.status}" — read it again and try the move from there.`],
    };
  }

  const row = await prisma.backlogItem.findUniqueOrThrow({ where: { id }, select: SELECT });
  return { ok: true, item: toItem(row) };
}

/**
 * Moves an item to another status, if the board's table of moves allows it
 * and nobody else's live claim is in the way. `actor` is who is making the
 * move — written into `claimedBy` when the destination is In progress,
 * cleared everywhere else — and there is no anonymous move (BOARD_RULES.md
 * invariant 5).
 */
export async function moveItem(id: string, to: BacklogStatus, actor: string, now: Date = new Date()): Promise<MoveOutcome> {
  return changeItem(id, { status: to }, actor, now);
}

/**
 * Writes the fields of a row that are somebody's opinion rather than the
 * board's rules: how much it matters, how much work it is.
 *
 * A status is not one of them and never passes through here; it is a move,
 * and a move is `changeItem` with a status on it. `actor` is accepted for the
 * same signature every store write carries, though a grade touches neither
 * the status column nor the claim, so nothing here writes it anywhere.
 */
export async function editItem(id: string, fields: BacklogEdit, actor: string, now: Date = new Date()): Promise<MoveOutcome> {
  return changeItem(id, fields, actor, now);
}

/**
 * Marks a row done, with the release that carried it. The only door: `done`
 * is not in `STATUS_MOVES` as a destination (board convergence ITS-04), so
 * `changeItem`/`moveItem` refuse it as illegal before this function is ever
 * reached, from the page, from `pnpm task`, from anywhere but the route's
 * own release-tool branch. That is deliberate — see BOARD_RULES.md
 * invariant 9 and STATUS_MOVES's own comment on `done`.
 *
 * Legal from `inProgress` only, and conditional the same way a move is
 * (BOARD_RULES.md invariant 4): a live claim somebody else holds, or a row
 * that has moved out from under this call since it was read, is refused
 * rather than overwritten. `moveWhere` is asked with the row's STORED
 * status — `current.status`, not the folded `item.status` — for the same
 * reason `changeItem` does: the database matches the `where` against the
 * column, and a legacy row can say `building` while meaning `inProgress`.
 *
 * `claimedBy`/`claimedAt` clear the way any move away from `inProgress`
 * does: a finished row is nobody's to hold. `movedAt` moves with it, the
 * same as every other status change.
 */
export async function finishItem(
  id: string,
  release: { version: string; at: Date },
  actor: string,
  now: Date = new Date(),
): Promise<MoveOutcome> {
  const current = await prisma.backlogItem.findUnique({ where: { id }, select: SELECT });
  if (current === null) return { ok: false, reason: "missing" };
  const item = toItem(current);

  if (item.status !== BACKLOG_STATUSES.inProgress) {
    return {
      ok: false,
      reason: "illegal",
      problems: [`Only a row in progress may be marked done; this one is "${item.status}".`],
    };
  }

  const staleBefore = new Date(now.getTime() - LEASE_MS);
  const moved = await prisma.backlogItem.updateMany({
    where: moveWhere(id, current.status as BacklogStatus, actor, staleBefore),
    data: {
      status: BACKLOG_STATUSES.done,
      releasedIn: release.version,
      releasedAt: release.at,
      claimedBy: null,
      claimedAt: null,
      movedAt: now,
    },
  });

  if (moved.count === 0) {
    const fresh = await prisma.backlogItem.findUnique({ where: { id }, select: { claimedBy: true, status: true } });
    if (fresh === null) return { ok: false, reason: "missing" };
    if (fresh.claimedBy !== null && fresh.claimedBy !== "") {
      return { ok: false, reason: "held", heldBy: fresh.claimedBy };
    }
    return {
      ok: false,
      reason: "illegal",
      problems: [`This row is "${fresh.status}" now, not "${current.status}" — read it again and try the move from there.`],
    };
  }

  const row = await prisma.backlogItem.findUniqueOrThrow({ where: { id }, select: SELECT });
  return { ok: true, item: toItem(row) };
}
