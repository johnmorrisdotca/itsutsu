import { STONES } from "@/lib/gomoku/gomoku.constants";
import { MOVE_TIME_OPTIONS, TIMEOUT_PENALTIES, type TimeoutPenalty } from "./gameSettingsSchema";
import type { GameSummary } from "./gameHistory.types";

/**
 * Narrowing the noticeboard: which posted seats are worth a second look.
 *
 * The players page settled on the shape for this kind of question — a filter
 * is an address, never a script, so a narrowing can be bookmarked or sent to
 * somebody exactly as it stands. This is the same shape asked of a different
 * list: not who is a member, but who is asking for a game worth answering —
 * at a pace somebody can live with, against somebody whose rating means
 * something to them, and under a clock whose penalty they are willing to
 * risk.
 *
 * Pure, the way `directoryFilter.ts` is pure: everything here can be checked
 * without a page or a database. The one question this list cannot answer on
 * its own — what a poster's rating is — is handed in rather than looked up,
 * so the lookup itself lives exactly once, where the database actually is.
 */

/** The rating that splits the two bands: a new member's starting figure. */
export const RATING_SPLIT = 1600;

export const SEAT_RATING = {
  any: "any",
  under: "under",
  over: "over",
  unrated: "unrated",
} as const;

export type SeatRatingBand = (typeof SEAT_RATING)[keyof typeof SEAT_RATING];

export const SEAT_RATING_LIST: readonly SeatRatingBand[] = [
  SEAT_RATING.any,
  SEAT_RATING.under,
  SEAT_RATING.over,
  SEAT_RATING.unrated,
];

export type SeatPenaltyFilter = "any" | TimeoutPenalty;

export const SEAT_PENALTY_LIST: readonly SeatPenaltyFilter[] = ["any", ...TIMEOUT_PENALTIES];

export type OpenSeatFilter = {
  /** Milliseconds per move; `null` is "no clock"; `undefined` is "any pace". */
  pace: number | null | undefined;
  rating: SeatRatingBand;
  penalty: SeatPenaltyFilter;
};

export const NO_SEAT_FILTER: OpenSeatFilter = {
  pace: undefined,
  rating: SEAT_RATING.any,
  penalty: "any",
};

type Query = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * The pace an address asks for. `"none"` is the no-clock option — `null`
 * itself cannot travel through a query string — and anything else is read as
 * a number and kept only when it is one of the paces a game may actually be
 * played at, the same guard `readDirectoryFilter` puts on `who`: a mistyped
 * address narrows to nothing sooner than it shows a bare, honest list.
 */
function readPace(value: string | string[] | undefined): number | null | undefined {
  const asked = one(value);
  if (asked === "") return undefined;
  if (asked === "none") return null;
  const parsed = Number(asked);
  return (MOVE_TIME_OPTIONS as readonly (number | null)[]).includes(parsed) ? parsed : undefined;
}

function readRating(value: string | string[] | undefined): SeatRatingBand {
  const asked = one(value);
  return (SEAT_RATING_LIST as readonly string[]).includes(asked) ? (asked as SeatRatingBand) : SEAT_RATING.any;
}

function readPenalty(value: string | string[] | undefined): SeatPenaltyFilter {
  const asked = one(value);
  return (SEAT_PENALTY_LIST as readonly string[]).includes(asked) ? (asked as SeatPenaltyFilter) : "any";
}

/** The filter an address asks for. Unrecognised values fall back to "any", never to an empty board. */
export function readOpenSeatFilter(query: Query): OpenSeatFilter {
  return { pace: readPace(query.pace), rating: readRating(query.rating), penalty: readPenalty(query.penalty) };
}

function paceParam(pace: number | null | undefined): string | null {
  if (pace === undefined) return null;
  return pace === null ? "none" : String(pace);
}

/** The address a filter reads as, with the defaults left off it. */
export function openSeatQuery(filter: OpenSeatFilter): string {
  const params = new URLSearchParams();
  const pace = paceParam(filter.pace);
  if (pace !== null) params.set("pace", pace);
  if (filter.rating !== NO_SEAT_FILTER.rating) params.set("rating", filter.rating);
  if (filter.penalty !== NO_SEAT_FILTER.penalty) params.set("penalty", filter.penalty);
  return params.toString();
}

/**
 * Who a reader answering this seat would actually be sitting across from:
 * the side that is not the one posted open.
 */
export function posterOf(
  game: Pick<GameSummary, "openSeat" | "blackName" | "whiteName" | "blackMemberId" | "whiteMemberId">,
): { name: string; memberId: string | null } {
  return game.openSeat === STONES.black
    ? { name: game.whiteName, memberId: game.whiteMemberId }
    : { name: game.blackName, memberId: game.blackMemberId };
}

/**
 * Narrows a noticeboard's seats to the ones asked for.
 *
 * `ratingOf` is a lookup already built from the database — one query for
 * every name on the board, rather than one per seat — so this stays pure and
 * checkable without either a page or a database of its own.
 */
export function filterOpenSeats(
  seats: readonly GameSummary[],
  filter: OpenSeatFilter,
  ratingOf: (posterName: string) => number | null,
): GameSummary[] {
  return seats.filter((seat) => {
    if (filter.pace !== undefined && seat.moveTimeMs !== filter.pace) return false;
    if (filter.penalty !== "any" && seat.timeoutPenalty !== filter.penalty) return false;
    if (filter.rating === SEAT_RATING.any) return true;

    const rating = ratingOf(posterOf(seat).name);
    if (filter.rating === SEAT_RATING.unrated) return rating === null;
    if (rating === null) return false;
    return filter.rating === SEAT_RATING.under ? rating < RATING_SPLIT : rating >= RATING_SPLIT;
  });
}
