import type { BacklogKind, BacklogSort, BacklogStatus } from "./backlog.types";

/**
 * The board's fixed vocabulary: its statuses, what may follow what, and the
 * words each one is shown in. Everything above compares against these rather
 * than against string literals, the way the games compare against STONES.
 */

export const BACKLOG_STATUSES = {
  open: "open",
  inProgress: "inProgress",
  done: "done",
  dropped: "dropped",
} as const satisfies Record<BacklogStatus, BacklogStatus>;

/**
 * What the board used to say, and what each of those means now.
 *
 * It had five statuses and two of them were the same thing. `proposed` meant
 * asked for and `planned` meant agreed but not started — a distinction that
 * needs a gap between deciding and starting to live in, and there is no such
 * gap here: work is taken off the board and begun in the same motion. So
 * `planned` was empty every day it existed, and the one column somebody
 * looking at the board actually wanted — who is on something right now — was
 * called `building` and read as neither.
 *
 * `inProgress` is a new word rather than `planned` reused. Reusing it would
 * have made every row already on the board ambiguous: `planned` would mean
 * "agreed, not started" before the change and "somebody has it" after, with
 * nothing in the row to say which was meant.
 *
 * Kept, and read on the way in, so the site is correct before the rows are
 * migrated rather than because they were.
 */
export const LEGACY_STATUSES: Record<string, BacklogStatus> = {
  proposed: "open",
  planned: "open",
  building: "inProgress",
};

export const BACKLOG_KINDS = {
  feature: "feature",
  fix: "fix",
  chore: "chore",
} as const satisfies Record<BacklogKind, BacklogKind>;

/** Every status, in the order the board reads them: what is moving, then what is settled. */
export const STATUS_ORDER: readonly BacklogStatus[] = [
  BACKLOG_STATUSES.inProgress,
  BACKLOG_STATUSES.open,
  BACKLOG_STATUSES.done,
  BACKLOG_STATUSES.dropped,
];

/** The statuses that still want something from somebody. */
export const OPEN_STATUSES: readonly BacklogStatus[] = [
  BACKLOG_STATUSES.open,
  BACKLOG_STATUSES.inProgress,
];

/**
 * Which status may follow which.
 *
 * A board with five statuses and no rules is five columns anything can be
 * dropped into, and it drifts: items reach "done" without ever having been
 * built, and a dropped item quietly comes back as if it had been agreed. The
 * table says the moves out loud, and `canMove` is the only thing allowed to
 * answer the question — the API and the page both ask it.
 *
 * Every status can be left and every status can be reached, which the gate
 * checks: a status nothing leads to is a hole a row falls into.
 */
export const STATUS_MOVES: Record<BacklogStatus, readonly BacklogStatus[]> = {
  // On the board and nobody on it: pick it up, or say no.
  open: [BACKLOG_STATUSES.inProgress, BACKLOG_STATUSES.dropped],
  // Somebody has it: finish it, put it back down, or abandon it.
  inProgress: [BACKLOG_STATUSES.done, BACKLOG_STATUSES.open, BACKLOG_STATUSES.dropped],
  // Shipped. It can only be reopened — done is not a way out of the board.
  done: [BACKLOG_STATUSES.inProgress],
  // Said no. Somebody may ask again, and then it is open like anything else.
  dropped: [BACKLOG_STATUSES.open],
};

/**
 * How each status is shown. `pill` uses the Itsutsu tokens only — moss for
 * agreed and finished, ochre for work under way, the plain rule for a request
 * nobody has ruled on yet.
 */
export const STATUS_DISPLAY: Record<
  BacklogStatus,
  { label: string; kanji: string; blurb: string; pill: string }
> = {
  open: {
    label: "Open",
    kanji: "未着手",
    blurb: "On the board, and nobody is on it yet.",
    pill: "border-rule-strong/70 bg-ivory/80 text-ink-soft",
  },
  inProgress: {
    label: "In progress",
    kanji: "作業中",
    blurb: "Somebody is on it right now.",
    pill: "border-ochre/60 bg-ochre-soft text-ink",
  },
  done: {
    label: "Done",
    kanji: "完了",
    blurb: "In, and on the site.",
    pill: "border-moss bg-moss-soft text-moss",
  },
  dropped: {
    label: "Dropped",
    kanji: "見送り",
    blurb: "Considered and passed over. Kept, so the answer need not be given twice.",
    pill: "border-rule-strong bg-shade text-muted",
  },
};

export const KIND_DISPLAY: Record<BacklogKind, { label: string; kanji: string }> = {
  feature: { label: "Feature", kanji: "機能" },
  fix: { label: "Fix", kanji: "修正" },
  chore: { label: "Chore", kanji: "手入れ" },
};

export const SORT_DISPLAY: Record<BacklogSort, string> = {
  moved: "Last moved",
  newest: "Newest",
  oldest: "Oldest",
  status: "By status",
};

/**
 * What a usable item looks like, in numbers.
 *
 * A title short enough to be a label is not a request — "Go", "fix it" — and a
 * title long enough to be the description is a description. Both ends are
 * refused, by the same function the form and the API call.
 */
export const TITLE_MIN = 8;
export const TITLE_MAX = 120;
export const DETAIL_MAX = 4000;
export const ASKED_BY_MAX = 60;
export const ASSIGNED_TO_MAX = 60;
export const KEY_MAX = 80;
