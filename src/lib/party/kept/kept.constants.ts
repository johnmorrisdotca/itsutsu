// Relative, like the rest of lib/party: the stores that import this are drawn by pages the browser specs import from.
import type { KeptSeatKind, KeptStatus } from "./kept.types";

/**
 * HOW A GAME PLAYED ON ONE DEVICE STANDS IN ITS RECORD, compared through these
 * rather than as strings. A table on several devices is `playing`, `finished`
 * or `ended` (`ONLINE_STATUS`); a game kept in one browser is filed on the same
 * `PartyTable` rows under words of its own, so nothing that plays, polls, seats
 * or caps a table on several devices ever reads one of these as its own.
 *
 * - `keptPlaying`: started on this device and not over yet.
 * - `keptFinished`: its rules ended it.
 * - `keptLeft`: put away before it was over — a new game started over it, or
 *   New game pressed half way.
 */
export const KEPT_STATUS = {
  playing: "keptPlaying",
  finished: "keptFinished",
  left: "keptLeft",
} as const satisfies Record<string, KeptStatus>;

/** Every status a game kept on one device can have. */
export const KEPT_STATUS_LIST: readonly KeptStatus[] = Object.values(KEPT_STATUS);

/** Whether a table row is a game kept on one device, not a table on several. */
export function isKeptStatus(status: string): status is KeptStatus {
  return (KEPT_STATUS_LIST as readonly string[]).includes(status);
}

/**
 * Who sat in a seat of a game on one device: the member whose device it was,
 * a computer, or somebody else at the same screen, known only by the name typed
 * for them. The first seat that is not a computer is the device's holder, as
 * every set-up on one device already says ("the first seat is whoever holds
 * the device").
 */
export const KEPT_SEAT_KINDS = { member: "member", computer: "computer", guest: "guest" } as const satisfies Record<KeptSeatKind, KeptSeatKind>;

/** The most seats any game on one device offers: Superghost's eight. */
export const KEPT_SEATS_MOST = 8;

/** The longest name kept for a seat; the set-ups take far less. */
export const KEPT_NAME_LONGEST = 40;

/**
 * The longest game text kept. A card game written out whole is a few
 * kilobytes; sixty thousand characters is under what `sendBeacon` will carry,
 * so the write made as a page closes is never the one refused for its size.
 */
export const KEPT_STATE_LONGEST = 60_000;

/**
 * A record's id, made by the BROWSER when the game starts, so a game played
 * with no connection has its name before the site has heard of it, and sending
 * it twice — once from a page closing, again when the device is back online —
 * writes one row rather than two. Three blocks of four from the game ids'
 * alphabet: never the shape of a table's eight, so the two cannot be confused.
 */
export const KEPT_ID_PATTERN = /^[2-9a-hjkmnp-z]{4}-[2-9a-hjkmnp-z]{4}-[2-9a-hjkmnp-z]{4}$/;

const KEPT_ID_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/** A new record id, from the random numbers given (the browser's own `crypto` in use, a fixed list in a test). */
export function makeKeptId(random: (count: number) => readonly number[]): string {
  const draws = random(12);
  const letters = draws.map((value) => KEPT_ID_ALPHABET[value % KEPT_ID_ALPHABET.length]).join("");
  return `${letters.slice(0, 4)}-${letters.slice(4, 8)}-${letters.slice(8, 12)}`;
}
