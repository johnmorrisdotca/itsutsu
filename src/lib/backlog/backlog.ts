import {
  ASKED_BY_MAX,
  BACKLOG_KINDS,
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
import { VERSION } from "@/lib/version";
import type {
  BacklogDraft,
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

/** Whether an item at `from` may be moved to `to`. */
export function canMove(from: BacklogStatus, to: BacklogStatus): boolean {
  return STATUS_MOVES[from].includes(to);
}

/** The statuses an item may be moved to from where it stands. */
export function movesFrom(status: BacklogStatus): readonly BacklogStatus[] {
  return STATUS_MOVES[status];
}

/**
 * The release a move stamps on a row: the version running when somebody
 * marked it done, and nothing at all for a move anywhere else.
 *
 * A rule rather than a line in the store, because there are two doors into a
 * move — this module's `moveTo`, which says what a move produces, and the
 * store, which writes one — and a rule that lives inside one of them is a
 * rule the other quietly does not have. That is the same fault `editItem`
 * refuses by never writing a status.
 *
 * Cleared on the way out, not merely left alone. A row that has gone back to
 * open was not released in anything, and last time's version still sitting on
 * it would read exactly as though it had been.
 *
 * The stamp is the version RUNNING when the row was marked done, which is
 * usually the release before the one that carried the work — whoever lands a
 * commit bumps the version in it. Hence "marked done in" on the board rather
 * than "shipped in": a small imprecision said out loud beats a bigger one
 * implied. It is stamped rather than worked out afterwards because it cannot
 * be worked out — see the column's own comment in the schema.
 */
export function releaseStampFor(to: BacklogStatus, version: string = VERSION): string | null {
  return to === BACKLOG_STATUSES.done ? version : null;
}

/**
 * The item as it stands after a move, or null when the move is not allowed.
 * The item passed in is never touched: a board rendered from the old list and
 * one rendered from the new can be compared, and nothing further up can move
 * an item by writing to it.
 */
export function moveTo(
  item: BacklogItem,
  to: BacklogStatus,
  now: Date = new Date(),
  version: string = VERSION,
): BacklogItem | null {
  if (!canMove(item.status, to)) return null;
  return { ...item, status: to, movedAt: now.toISOString(), releasedIn: releaseStampFor(to, version) };
}

function matchesStatus(item: BacklogItem, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "unfinished") return isOpen(item.status);
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

/** How many items stand at each status. Every status is present, zero included. */
export function tally(items: readonly BacklogItem[]): BacklogTally {
  const counts = {
    open: 0,
    inProgress: 0,
    done: 0,
    dropped: 0,
  } satisfies BacklogTally;
  for (const item of items) counts[item.status] += 1;
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
