import {
  ASKED_BY_MAX,
  BACKLOG_KINDS,
  CHANGE_FIELDS,
  BACKLOG_EFFORTS,
  BACKLOG_PRIORITIES,
  EFFORT_ORDER,
  PRIORITY_ORDER,
  BACKLOG_STATUSES,
  DETAIL_MAX,
  KEY_MAX,
  LEGACY_STATUSES,
  OPEN_STATUSES,
  STATUS_MOVES,
  STATUS_ORDER,
  TITLE_MAX,
  TITLE_MIN,
} from "./backlog.constants";
import type {
  BacklogChange,
  BacklogDraft,
  BacklogEdit,
  BacklogEffort,
  BacklogItem,
  BacklogKind,
  BacklogPriority,
  BacklogSort,
  BacklogStatus,
  BacklogTally,
  StatusFilter,
} from "./backlog.types";

/**
 * The board's rules, kept away from the database the way the game engine is
 * kept away from the browser: what may follow what, what counts as a real
 * request, and how a list of them is ordered. Everything here is pure — an
 * item goes in, a new item comes out, and nothing is written in place — so the
 * page, the API route and the tests all get the same answers.
 */

const KEBAB = /[^a-z0-9]+/g;

/**
 * A stable kebab-case key for a title.
 *
 * Titles are typed by people and get edited afterwards; the key is what the
 * seed, a commit message and a duplicate check all hold on to, so it is
 * derived once at the moment an item is added and never again. A title with no
 * Latin letters at all — a request typed in Japanese — still needs a key, so
 * one is made from the moment it arrived rather than refusing the request.
 */
export function keyFromTitle(title: string, now: Date = new Date()): string {
  const slug = title.toLowerCase().replace(KEBAB, "-").replace(/^-+|-+$/g, "").slice(0, KEY_MAX);
  const trimmed = slug.replace(/-+$/g, "");
  return trimmed === "" ? `item-${now.getTime().toString(36)}` : trimmed;
}

export function isBacklogStatus(value: unknown): value is BacklogStatus {
  return typeof value === "string" && value in BACKLOG_STATUSES;
}

export function isBacklogKind(value: unknown): value is BacklogKind {
  return typeof value === "string" && value in BACKLOG_KINDS;
}

export function isBacklogPriority(value: unknown): value is BacklogPriority {
  return typeof value === "string" && value in BACKLOG_PRIORITIES;
}

export function isBacklogEffort(value: unknown): value is BacklogEffort {
  return typeof value === "string" && value in BACKLOG_EFFORTS;
}

/** True while an item still wants something from somebody. */
/**
 * The status a stored row actually has.
 *
 * Rows written before the board's vocabulary changed still say `proposed`,
 * `planned` or `building`, and a bare cast would carry those straight through
 * to a page that has no column for them. Reading them here means the site is
 * right before the rows are migrated rather than because they were, and stays
 * right if one turns up afterwards. Anything unrecognisable is open: a row
 * nobody can account for is a row somebody should look at, not one to hide.
 */
export function statusFrom(stored: string): BacklogStatus {
  if (isBacklogStatus(stored)) return stored;
  return LEGACY_STATUSES[stored] ?? BACKLOG_STATUSES.open;
}

export function isOpen(status: BacklogStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

/**
 * What is wrong with a draft, in words a person can act on; an empty list
 * means it may be added.
 *
 * This is the board's own gate. A features board is only worth making a rule
 * out of if every line on it says something — an item with no title, or with
 * "todo" for a title, is exactly the lost request the board exists to prevent.
 * The form shows these and the API route refuses on them, so neither can be
 * the only guard.
 */
export function draftProblems(draft: BacklogDraft): string[] {
  const problems: string[] = [];
  const title = draft.title.trim();
  if (title.length < TITLE_MIN) problems.push(`Say what is wanted in at least ${TITLE_MIN} characters.`);
  if (title.length > TITLE_MAX) problems.push(`A title is at most ${TITLE_MAX} characters; the rest belongs in the detail.`);
  if (draft.detail.length > DETAIL_MAX) problems.push(`The detail is at most ${DETAIL_MAX} characters.`);
  if (draft.askedBy.trim().length > ASKED_BY_MAX) problems.push(`A name is at most ${ASKED_BY_MAX} characters.`);
  if (!isBacklogKind(draft.kind)) problems.push("Say whether it is a feature, a fix or a chore.");
  return problems;
}

/** The draft as it will be stored: trimmed, with a key of its own. */
export function normalizeDraft(draft: BacklogDraft, now: Date = new Date()): BacklogDraft & { key: string } {
  const title = draft.title.trim().replace(/\s+/g, " ");
  return {
    title,
    detail: draft.detail.trim(),
    kind: draft.kind,
    askedBy: draft.askedBy.trim(),
    key: keyFromTitle(title, now),
  };
}

/**
 * The draft an item would be once its text is revised: what the request said
 * where the revision is silent, and the revision where it speaks.
 *
 * Judged by `draftProblems` exactly as a new request is, so a row can no more
 * be edited past the caps than it could have been added past them. The key is
 * not part of this on purpose — it was derived once, when the row was added,
 * and a commit message or a seed may already be holding it.
 */
export function revisedDraft(
  item: Pick<BacklogItem, "title" | "detail" | "kind" | "askedBy">,
  changes: Partial<BacklogDraft>,
): BacklogDraft {
  return {
    title: changes.title ?? item.title,
    detail: changes.detail ?? item.detail,
    kind: changes.kind ?? item.kind,
    askedBy: changes.askedBy ?? item.askedBy,
  };
}

/**
 * What is wrong with an edit to the fields that are somebody's opinion rather
 * than the board's rules — how much it matters, how much work it is. Empty
 * means it may be written.
 *
 * Who has it is deliberately not here: a claim is not an opinion typed into a
 * field, it is what a move to In progress writes, from the actor making the
 * move. See `moveData`.
 *
 * The same gate the route's schema keeps, stated where the other rules are,
 * so an in-process caller that never met the route is refused the same way.
 */
export function editProblems(edit: BacklogEdit): string[] {
  const problems: string[] = [];
  if (edit.priority !== undefined && edit.priority !== null && !isBacklogPriority(edit.priority)) {
    problems.push("Grade how much it matters as high, normal or low.");
  }
  if (edit.effort !== undefined && edit.effort !== null && !isBacklogEffort(edit.effort)) {
    problems.push("Grade the work as small, medium or large.");
  }
  return problems;
}

/**
 * The fields of a row this change would actually write.
 *
 * Read off `CHANGE_FIELDS` rather than off the change's own keys, so a body
 * carrying something the board does not write — `releasedIn` outside a
 * release, a field somebody invented — cannot count itself as a change. A
 * field present with `null` in it does count: null is a real value for a
 * grade, and taking a judgement back is a change.
 */
export function changedFields(change: BacklogChange): readonly (keyof BacklogChange)[] {
  return CHANGE_FIELDS.filter((field) => change[field] !== undefined);
}

/**
 * What is wrong with a change that names nothing this board can write, in
 * words that say what it does accept; empty means there is something to write.
 *
 * The rule behind a fault worth naming: `PATCH /api/backlog/:id` answered 200
 * to a body it had written nothing from. A body of only `releasedIn` passed
 * the route's schema — the field is there for the release tool's own branch —
 * reached `changeItem`, matched none of the three rules that had an opinion,
 * composed `data = {}`, and came back as a change that had happened. The
 * caller was told its edit had landed and the row was untouched: a plausible
 * answer standing in for "there was nothing here I could do", which is the
 * shape Nothing Answers What It Cannot Answer is about.
 *
 * So the answer is a refusal, and it reads the list out rather than hinting at
 * it — a caller that sent the wrong field needs to know which the right ones
 * are. Asked in the two places `draftProblems` is asked: the route, so nothing
 * reaches the database, and the store, so nothing reaches the database from
 * inside the process either.
 */
export function changeProblems(change: BacklogChange): string[] {
  if (changedFields(change).length > 0) return [];
  return [`Nothing there to change. A change names at least one of: ${CHANGE_FIELDS.join(", ")}.`];
}

/** Whether an item at `from` may be moved to `to`. */
export function canMove(from: BacklogStatus, to: BacklogStatus): boolean {
  return STATUS_MOVES[from].includes(to);
}

/** `canMove`, in words a person can act on: empty when the move is allowed. */
export function moveProblems(from: BacklogStatus, to: BacklogStatus): string[] {
  return canMove(from, to) ? [] : ["An item cannot go straight there from where it stands."];
}

/** The statuses an item may be moved to from where it stands. */
export function movesFrom(status: BacklogStatus): readonly BacklogStatus[] {
  return STATUS_MOVES[status];
}

/**
 * In progress is not a status on its own; it is a claim, and a claim can go
 * stale. These three are copied verbatim from BOARD_RULES.md's reference
 * shapes — UmaKuma's `src/lib/ticketClaims.ts` keeps the originals, this
 * board copies them — so both boards agree on what "held" means down to the
 * millisecond.
 */

/** How long a hold lasts without being renewed. See BOARD_RULES.md invariant 3. */
export const LEASE_MS = 6 * 60 * 60 * 1000;

/** Whether a hold has gone stale and the row is free again. */
export function leaseExpired(claimedAt: Date | string | null | undefined, nowMs: number = Date.now()): boolean {
  if (!claimedAt) return true;
  const held = claimedAt instanceof Date ? claimedAt.getTime() : Date.parse(claimedAt);
  return !Number.isFinite(held) || nowMs - held > LEASE_MS;
}

/**
 * Whether somebody is actually holding this row right now, the lease
 * honoured. Every count of "in progress" and every "held by" label reads
 * this, never the status column alone — a lapsed hold is stale, not waiting.
 */
export function heldNow(
  row: { claimedBy: string | null; claimedAt?: Date | string | null },
  nowMs: number = Date.now(),
): boolean {
  return typeof row.claimedBy === "string" && row.claimedBy.trim().length > 0 && !leaseExpired(row.claimedAt ?? null, nowMs);
}

/**
 * The columns a move writes, and it is never the status alone.
 *
 * In progress is not a status; it is a claim. `claimedBy` and `claimedAt` are
 * the one place work-in-progress is recorded, so a status written on its own
 * is two fields that can disagree — a row `inProgress` with nobody holding
 * it, or a holder left on a row the page calls waiting. Same shape the store
 * writes and `moveTo` previews, so the two doors into a move agree.
 *
 * `releasedIn`/`releasedAt` are deliberately not here (board convergence
 * ITS-04): `done` is not a destination this function's caller, `changeItem`,
 * can ever reach — `STATUS_MOVES` lists nothing that leads to it — so nothing
 * this function writes is ever a release. `finishItem` in backlogStore.ts
 * writes those two columns directly, with the version `pnpm release:take`
 * is taking at that moment, which is the only place that version is knowable.
 */
export function moveData(
  to: BacklogStatus,
  actor: string,
  now: Date,
): { status: BacklogStatus; claimedBy: string | null; claimedAt: Date | null; movedAt: Date } {
  const claim = to === BACKLOG_STATUSES.inProgress ? { claimedBy: actor, claimedAt: now } : { claimedBy: null, claimedAt: null };
  return { status: to, ...claim, movedAt: now };
}

/**
 * The condition a move is written under, so the database decides who wins
 * rather than whoever read the row first.
 *
 * The status has to still be the one the move was planned from — two
 * sessions do not both get to move a row only one of them read. And a live
 * hold belongs to whoever has it: a mover may take a row nobody holds, one
 * they hold themselves, or one whose hold has lapsed, and is otherwise
 * refused with the holder's name. `staleBefore` is the lease boundary,
 * passed in so the rule is testable without a clock. See BOARD_RULES.md
 * invariant 4 — this is the `where` every moving write carries.
 */
export function moveWhere(
  id: string,
  from: BacklogStatus,
  actor: string,
  staleBefore: Date,
): { id: string; status: BacklogStatus; OR: Array<{ claimedBy: null } | { claimedBy: string } | { claimedAt: { lt: Date } }> } {
  return {
    id,
    status: from,
    OR: [{ claimedBy: null }, { claimedBy: actor }, { claimedAt: { lt: staleBefore } }],
  };
}

/**
 * The item as it stands after a move, or null when the move is not allowed.
 * The item passed in is never touched: a board rendered from the old list and
 * one rendered from the new can be compared, and nothing further up can move
 * an item by writing to it.
 *
 * Returns the same claim fields `moveData` writes, so a preview shown before
 * the request goes to the server cannot say something the store would not.
 * `done` is never a `to` this function reaches — `canMove` refuses it before
 * anything else runs, since `STATUS_MOVES` names nothing that leads there.
 */
export function moveTo(item: BacklogItem, to: BacklogStatus, actor: string, now: Date = new Date()): BacklogItem | null {
  if (!canMove(item.status, to)) return null;
  const claim =
    to === BACKLOG_STATUSES.inProgress
      ? { claimedBy: actor, claimedAt: now.toISOString() }
      : { claimedBy: null, claimedAt: null };
  return { ...item, status: to, movedAt: now.toISOString(), ...claim };
}

function matchesStatus(item: BacklogItem, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "unfinished") return isOpen(item.status);
  if (filter === "stale") return item.status === BACKLOG_STATUSES.inProgress && !heldNow(item);
  return item.status === filter;
}

function matchesText(item: BacklogItem, text: string): boolean {
  const needle = text.trim().toLowerCase();
  if (needle === "") return true;
  return (
    item.title.toLowerCase().includes(needle) ||
    item.detail.toLowerCase().includes(needle) ||
    item.askedBy.toLowerCase().includes(needle)
  );
}

/** The board narrowed to one status, one kind, and anything matching some words. */
export function filterItems(
  items: readonly BacklogItem[],
  filter: { status: StatusFilter; kind: BacklogKind | "all"; text: string },
): BacklogItem[] {
  return items.filter(
    (item) =>
      matchesStatus(item, filter.status) &&
      (filter.kind === "all" || item.kind === filter.kind) &&
      matchesText(item, filter.text),
  );
}

const BY_MOVED = (a: BacklogItem, b: BacklogItem) => b.movedAt.localeCompare(a.movedAt);

/**
 * The board in one of its four orders, as a new array — `sort` in place would
 * reorder the caller's list, and the page passes the same list to two views.
 * "By status" reads down STATUS_ORDER, so what is being built now is at the
 * top and what was dropped is at the bottom, each group newest-moved first.
 */
/**
 * Worth doing, and doable: down by how much it matters, then up by how much
 * work it is. The question John is actually asking the board — what could I
 * pick up now — is the top of this list.
 *
 * An ungraded row sorts last on both counts rather than in the middle. It has
 * not been judged, and putting it among the judged ones would be pretending
 * otherwise; a row nobody has looked at is not the same as a row somebody
 * called ordinary.
 */
const BY_QUICK_WIN = (a: BacklogItem, b: BacklogItem): number => {
  const rank = (item: BacklogItem) => ({
    priority: item.priority === null ? PRIORITY_ORDER.length : PRIORITY_ORDER.indexOf(item.priority),
    effort: item.effort === null ? EFFORT_ORDER.length : EFFORT_ORDER.indexOf(item.effort),
  });
  const left = rank(a);
  const right = rank(b);
  if (left.priority !== right.priority) return left.priority - right.priority;
  if (left.effort !== right.effort) return left.effort - right.effort;
  return BY_MOVED(a, b);
};

export function sortItems(items: readonly BacklogItem[], sort: BacklogSort): BacklogItem[] {
  const copy = [...items];
  if (sort === "newest") return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === "oldest") return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (sort === "moved") return copy.sort(BY_MOVED);
  if (sort === "quickWins") return copy.sort(BY_QUICK_WIN);
  return copy.sort((a, b) => {
    const rank = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    return rank !== 0 ? rank : BY_MOVED(a, b);
  });
}

/**
 * How many items stand at each status. Every status is present, zero
 * included.
 *
 * `inProgress` here means `heldNow`, not merely "the status column says so":
 * a row whose claim has lapsed is not somebody working on it, and counting it
 * as in progress is the same lie `heldNow` exists to stop UmaKuma's board
 * telling. It is counted into `stale` instead — still open, still on the
 * board, but not held by anybody right now.
 */
export function tally(items: readonly BacklogItem[], nowMs: number = Date.now()): BacklogTally {
  const counts = {
    open: 0,
    inProgress: 0,
    done: 0,
    dropped: 0,
    stale: 0,
  } satisfies BacklogTally;
  for (const item of items) {
    if (item.status === BACKLOG_STATUSES.inProgress) {
      if (heldNow(item, nowMs)) counts.inProgress += 1;
      else counts.stale += 1;
    } else {
      counts[item.status] += 1;
    }
  }
  return counts;
}

/** How many items still want something. The number the board is really about. */
export function openCount(items: readonly BacklogItem[]): number {
  return items.filter((item) => isOpen(item.status)).length;
}

export const BACKLOG_STATUS_VALUES: readonly BacklogStatus[] = Object.values(BACKLOG_STATUSES);
export const BACKLOG_PRIORITY_VALUES: readonly BacklogPriority[] = Object.values(BACKLOG_PRIORITIES);
export const BACKLOG_EFFORT_VALUES: readonly BacklogEffort[] = Object.values(BACKLOG_EFFORTS);
export const BACKLOG_KIND_VALUES: readonly BacklogKind[] = Object.values(BACKLOG_KINDS);
