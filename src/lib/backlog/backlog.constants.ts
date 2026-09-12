import type { BacklogChange, BacklogEffort, BacklogKind, BacklogPriority, BacklogSort, BacklogStatus } from "./backlog.types";

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
 * Every status but `done` can be left and every status but `done` can be
 * reached through this table, which the gate checks: a status nothing leads
 * to is a hole a row falls into. `done` is the one exception on both counts,
 * and deliberately so — see below.
 */
export const STATUS_MOVES: Record<BacklogStatus, readonly BacklogStatus[]> = {
  // On the board and nobody on it: pick it up, or say no.
  open: [BACKLOG_STATUSES.inProgress, BACKLOG_STATUSES.dropped],
  // Somebody has it: put it back down, or abandon it. Not "finish it" — see below.
  inProgress: [BACKLOG_STATUSES.open, BACKLOG_STATUSES.dropped],
  /*
   * DONE IS TERMINAL, AND THIS TABLE IS NOT HOW IT IS REACHED (board
   * convergence ITS-04). Reaching it needs the version that carried the
   * work, which is only knowable at the moment `pnpm release:take` takes
   * that number — not from this table, which the page and `pnpm task` both
   * read, and neither may ever offer Done. `finishItem` in backlogStore.ts
   * writes it directly, conditionally, from `inProgress` only, alongside
   * `releasedIn` and `releasedAt`. And it does not leave: a done row's
   * release stamp is a fact about a release that went out, and reopening it
   * would rewrite that fact. A regression is a new row citing this one, not
   * this one coming back.
   */
  done: [],
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
  quickWins: "Quick wins",
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
/** A name written into `claimedBy`. Longer than ASKED_BY_MAX on purpose: a
 *  claim can carry something like "Claude (session 21d00c32)". */
export const CLAIMED_BY_MAX = 80;
export const KEY_MAX = 80;

/**
 * The fields of a row a change may actually write, by name.
 *
 * Written as a record of every key of `BacklogChange` rather than a hand-kept
 * array, so a field added to the type does not compile until it is named here.
 * The refusal for a change carrying none of them names this list, and a list
 * of what is accepted that can go stale beside the type it describes is worse
 * than no list: it would name a field the board no longer writes, or omit one
 * it does.
 *
 * `releasedIn`/`releasedAt` are deliberately absent. They are not fields of a
 * change at all — `finishItem` writes them, from the version `pnpm
 * release:take` is taking at that moment (board convergence ITS-04) — so a
 * body carrying one of those and nothing else is a body this board can write
 * nothing from, which is exactly what this list exists to say.
 */
const CHANGE_FIELD_SET = {
  status: true,
  title: true,
  detail: true,
  kind: true,
  askedBy: true,
  priority: true,
  effort: true,
} as const satisfies Record<keyof BacklogChange, true>;

/** The same list, in the order a refusal reads them out. */
export const CHANGE_FIELDS = Object.keys(CHANGE_FIELD_SET) as readonly (keyof BacklogChange)[];

export const BACKLOG_PRIORITIES = {
  high: "high",
  normal: "normal",
  low: "low",
} as const satisfies Record<BacklogPriority, BacklogPriority>;

export const BACKLOG_EFFORTS = {
  small: "small",
  medium: "medium",
  large: "large",
} as const satisfies Record<BacklogEffort, BacklogEffort>;

/** Most pressing first, so a sort can read straight down it. */
export const PRIORITY_ORDER: readonly BacklogPriority[] = [
  BACKLOG_PRIORITIES.high,
  BACKLOG_PRIORITIES.normal,
  BACKLOG_PRIORITIES.low,
];

/** Least work first, which is the order somebody looking for a quick win reads in. */
export const EFFORT_ORDER: readonly BacklogEffort[] = [
  BACKLOG_EFFORTS.small,
  BACKLOG_EFFORTS.medium,
  BACKLOG_EFFORTS.large,
];

export const PRIORITY_DISPLAY: Record<
  BacklogPriority,
  { label: string; kanji: string; blurb: string; pill: string }
> = {
  high: {
    label: "High",
    kanji: "優先",
    blurb: "Worth doing before the rest of the board.",
    pill: "border-ochre/60 bg-ochre-soft text-ink",
  },
  normal: {
    label: "Normal",
    kanji: "通常",
    blurb: "Wanted, in its turn.",
    pill: "border-rule-strong/70 bg-ivory/80 text-ink-soft",
  },
  low: {
    label: "Low",
    kanji: "後回し",
    blurb: "Worth doing, but nothing waits on it.",
    pill: "border-rule-strong bg-shade text-muted",
  },
};

export const EFFORT_DISPLAY: Record<
  BacklogEffort,
  { label: string; kanji: string; blurb: string; pill: string }
> = {
  small: {
    label: "Small",
    kanji: "小",
    blurb: "Contained, and nothing else has to be decided first.",
    pill: "border-moss/40 bg-moss-soft text-ink",
  },
  medium: {
    label: "Medium",
    kanji: "中",
    blurb: "A real piece of work, but the shape of it is known.",
    pill: "border-rule-strong/70 bg-ivory/80 text-ink-soft",
  },
  large: {
    label: "Large",
    kanji: "大",
    blurb: "Touches several things, or needs a decision before it can start.",
    pill: "border-rule-strong bg-shade text-muted",
  },
};
