import type { BacklogKind, BacklogSort, BacklogStatus } from "./backlog.types";

/**
 * The board's fixed vocabulary: its statuses, what may follow what, and the
 * words each one is shown in. Everything above compares against these rather
 * than against string literals, the way the games compare against STONES.
 */

export const BACKLOG_STATUSES = {
  proposed: "proposed",
  planned: "planned",
  building: "building",
  done: "done",
  dropped: "dropped",
} as const satisfies Record<BacklogStatus, BacklogStatus>;

export const BACKLOG_KINDS = {
  feature: "feature",
  fix: "fix",
  chore: "chore",
} as const satisfies Record<BacklogKind, BacklogKind>;

/** Every status, in the order the board reads them: what is moving, then what is settled. */
export const STATUS_ORDER: readonly BacklogStatus[] = [
  BACKLOG_STATUSES.building,
  BACKLOG_STATUSES.planned,
  BACKLOG_STATUSES.proposed,
  BACKLOG_STATUSES.done,
  BACKLOG_STATUSES.dropped,
];

/** The statuses that still want something from somebody. */
export const OPEN_STATUSES: readonly BacklogStatus[] = [
  BACKLOG_STATUSES.proposed,
  BACKLOG_STATUSES.planned,
  BACKLOG_STATUSES.building,
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
  // Asked for, not yet agreed: agree it, start it, or say no.
  proposed: [BACKLOG_STATUSES.planned, BACKLOG_STATUSES.building, BACKLOG_STATUSES.dropped],
  // Agreed: start it, put it back to merely asked-for, or say no after all.
  planned: [BACKLOG_STATUSES.building, BACKLOG_STATUSES.proposed, BACKLOG_STATUSES.dropped],
  // Being built: finish it, put it down again, or abandon it.
  building: [BACKLOG_STATUSES.done, BACKLOG_STATUSES.planned, BACKLOG_STATUSES.dropped],
  // Shipped. It can only be reopened — done is not a way out of the board.
  done: [BACKLOG_STATUSES.building],
  // Said no. Somebody may ask again, and then it is a proposal like any other.
  dropped: [BACKLOG_STATUSES.proposed],
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
  proposed: {
    label: "Proposed",
    kanji: "提案",
    blurb: "Asked for. Nobody has said yes or no yet.",
    pill: "border-rule-strong/70 bg-ivory/80 text-ink-soft",
  },
  planned: {
    label: "Planned",
    kanji: "予定",
    blurb: "Agreed, and waiting its turn.",
    pill: "border-moss/40 bg-moss-soft text-ink",
  },
  building: {
    label: "Building",
    kanji: "作業中",
    blurb: "Somebody is on it now.",
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
export const KEY_MAX = 80;
