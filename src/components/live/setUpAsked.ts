import { NO_PACE, SET_UP_PARAMS } from "@/lib/gomoku/slugs";
import { MOVE_TIME_OPTIONS } from "@/lib/history/gameSettingsSchema";

/** The most moves an address may name, matching the creation route's own ceiling. */
const MOVE_CEILING = 4096;

/** The paces the clock row offers, widened so an arbitrary number can be looked up in it. */
const PACES_OFFERED: readonly (number | null)[] = MOVE_TIME_OPTIONS;

/** As long an id as the creation route will accept for a game or a member. */
const ID_LIMIT = 64;

/**
 * WHAT AN ADDRESS ASKED THE SETUP SCREEN TO START FROM.
 *
 * Pure, and separate from the reading of any row, for the reason every parse on
 * this site is: a query string is somebody's typing. Every field here can be
 * edited in a browser bar, so each is checked against what the site actually
 * offers rather than trusted — a pace that is not one of the paces, a board that
 * is not a number, a move number past any game ever played. None of those is an
 * error worth a page: the screen simply has not been told that thing.
 *
 * A field that cannot be read comes back as "nothing was said", never as a
 * plausible value. That distinction is the whole of this module's care, and it
 * is why the pace is wrapped rather than nullable: `null` alone would have to
 * mean both "play with no clock" and "nobody mentioned the clock", and the
 * screen does opposite things with those two — keep it, or fall back to what
 * this member usually plays at.
 */
export type SetUpAsked = {
  /** A member id, for the opponent. */
  against: string | null;
  /** A finished game to play again. */
  rematch: string | null;
  /** A game and a position to carry out of it. */
  from: { id: string; move: number } | null;
  /** A board size somebody has already chosen. */
  board: number | null;
  /** Wrapped, because "no clock" and "nobody said" are different answers. */
  pace: { ms: number | null } | null;
};

/** One value from a query, or null where it is absent or repeated into an array. */
function one(asked: Record<string, string | string[] | undefined>, key: string): string | null {
  const value = asked[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" || trimmed.length > ID_LIMIT ? null : trimmed;
}

/** A whole number in a query, or null for anything that is not one. */
function whole(asked: Record<string, string | string[] | undefined>, key: string): number | null {
  const raw = one(asked, key);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

export function readSetUpAsked(
  asked: Record<string, string | string[] | undefined>,
): SetUpAsked {
  const from = one(asked, SET_UP_PARAMS.from);
  const move = whole(asked, SET_UP_PARAMS.move);
  const board = whole(asked, SET_UP_PARAMS.board);
  const pace = one(asked, SET_UP_PARAMS.pace);
  const paceMs = pace === null ? null : Number(pace);

  return {
    against: one(asked, SET_UP_PARAMS.against),
    rematch: one(asked, SET_UP_PARAMS.rematch),
    /*
     * A fork with no readable move is not a fork from move nought — that is a
     * different game, and one somebody would notice. It is a fork this screen
     * was not told enough about, so it is no fork at all.
     */
    from:
      from === null || move === null || move < 0 || move > MOVE_CEILING
        ? null
        : { id: from, move },
    board: board !== null && board > 0 ? board : null,
    /*
     * Only a pace the site offers. `MOVE_TIME_OPTIONS` is the list the clock
     * row is built from, so anything else would put the select on a value it
     * is not offering — which shows as the first option and means the address
     * was ignored without saying so.
     */
    pace:
      pace === NO_PACE
        ? { ms: null }
        : pace !== null && Number.isInteger(paceMs) && PACES_OFFERED.includes(paceMs)
          ? { ms: paceMs }
          : null,
  };
}
