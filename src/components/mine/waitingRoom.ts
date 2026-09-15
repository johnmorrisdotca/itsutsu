import { draftFromGame } from "@/components/live/rulesDraft";
import { beginLink } from "@/components/live/setUpAddress";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { GameSummary } from "@/lib/history/gameHistory.types";

import type { WaitingRoomSays } from "./waitingRoom.types";

/**
 * THE WAITING ROOM: every seat somebody has posted, across every game, as one
 * table — the thing John pointed at on ItsYourTurn: "We don't have a specific
 * waiting room do we?" A waiting room is "let me choose my opponent", so each
 * row is a real person with their rating, level and country, the game with its
 * rules one press away, and a way to sit down at exactly that seat.
 *
 * The pure half, so each decision has a test beside it: the order the rows come
 * in, where Sit down leads, and what the table says when it has no rows.
 */

/** A game's name as the table prints it, for sorting by. */
function gameName(variant: string): string {
  return RULE_VARIANT_DISPLAY[variant as RuleVariant]?.label ?? variant;
}

/**
 * SORTED BY GAME NAME, as ItsYourTurn's room is, so the seats for one game sit
 * together. Stable: within a game the order the seats arrived in is kept, and
 * that order is newest first — so several people waiting at one game are read
 * from the most recent. The page hands this the newest seats it shows, so the
 * board's cap still keeps the freshest seats and this only arranges them.
 */
export function byGameName(seats: readonly GameSummary[]): GameSummary[] {
  return seats
    .map((seat, at) => ({ seat, at }))
    .sort((one, two) => gameName(one.seat.variant).localeCompare(gameName(two.seat.variant), "en") || one.at - two.at)
    .map(({ seat }) => seat);
}

/**
 * WHERE "SIT DOWN" LEADS: the doorstep for that one seat, never straight onto
 * the board.
 *
 * The page before any game states what is about to be played, and sitting at a
 * stranger's seat is agreeing to rules somebody else settled — so it is stated
 * first. The address carries the seat's OWN rules and its id, which is what the
 * doorstep checks the row against before anybody is sat down (`sittingAt`, the
 * 0.186.3 seat-match rule): the rules a seat was posted under, read back from
 * its own summary, are the rules its row holds.
 */
export function sitDownHref(
  seat: Pick<
    GameSummary,
    "id" | "variant" | "size" | "obstacles" | "opening" | "handicap" | "headStart" | "moveTimeMs" | "clockMode" | "timeoutPenalty" | "allowResign" | "rated" | "openSeat"
  >,
): string {
  return beginLink(draftFromGame(seat), { sit: seat.id });
}

/** What the table says under its headings, from how many seats are posted and how many the filter kept. */
export function waitingRoomSays({ total, shown }: { total: number; shown: number }): WaitingRoomSays {
  if (total === 0) return "nobody-waiting";
  if (shown === 0) return "nothing-matches";
  return "seats";
}
