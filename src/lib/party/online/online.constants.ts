import type { OnlineSeatKind, OnlineStatus } from "./online.types";

/** How a table stands, compared through these rather than as strings. */
export const ONLINE_STATUS = { playing: "playing", finished: "finished", ended: "ended" } as const satisfies Record<OnlineStatus, OnlineStatus>;

/** Who sits in a seat, compared through these rather than as strings. */
export const ONLINE_SEAT_KINDS = { member: "member", open: "open", computer: "computer" } as const satisfies Record<OnlineSeatKind, OnlineSeatKind>;

/**
 * How many tables a member may have going at once, apart from the twenty
 * two-player games (`activeGames.ts`): the same number, for the same reason —
 * past it is a pile nobody keeps up with. Checked for the maker at Start and
 * for anybody at the moment they are seated.
 */
export const PARTY_TABLES_MOST = 20;

/**
 * How long a turn may wait before the others at the table may end it: SEVEN
 * DAYS, a week of a correspondence game's pace. Decided when the table is
 * read, never by a timer; ending gives nobody a win, because party tables are
 * never rated.
 */
export const PARTY_TURN_WAIT_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * How long a computer's turn waits for the browser that should work it out
 * (the one whose move handed it the turn) before any browser at the table may
 * — see `computerDriver`. Thirty seconds: a computer answers in well under
 * one, so a turn still waiting after thirty has lost the browser that owed it.
 */
export const COMPUTER_TAKEOVER_MS = 30_000;

/** What a computer's seat is called at the table. */
export const COMPUTER_SEAT_NAME = "Computer";

/** The longest a party table's move may be as JSON: Block Five's piece and five squares is well under it. */
export const ONLINE_MOVE_LONGEST = 400;
