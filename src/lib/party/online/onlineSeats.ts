// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { COMPUTER_TAKEOVER_MS, ONLINE_SEAT_KINDS, ONLINE_STATUS, PARTY_TURN_WAIT_MS } from "./online.constants";
import type { OnlineRules, OnlineSeatAsk, OnlineSeatKind, OnlineStatus } from "./online.types";

/**
 * WHO MAY DO WHAT AT A TABLE ON SEVERAL DEVICES, as pure questions: the route
 * that writes asks them, the page that offers asks them, and the unit tests
 * hold them — never a component alone.
 */

/** A seat as these questions need it. */
type Seat = { seat: number; kind: OnlineSeatKind; memberId: string | null };

/** A table as these questions need it. */
type Table = {
  status: OnlineStatus;
  toPlay: number | null;
  moveCount: number;
  movedAt: Date;
  seats: readonly Seat[];
};

/** The reader's own seat at a table, or null when they sit at none of it. */
export function seatOfMember(seats: readonly Seat[], memberId: string | null): number | null {
  if (memberId === null) return null;
  return seats.find((one) => one.kind === ONLINE_SEAT_KINDS.member && one.memberId === memberId)?.seat ?? null;
}

/**
 * WHY A MOVE FOR THIS SEAT, FROM THIS READER, IS REFUSED — or null when it may
 * be made. The seat must be the one to play at a table being played, and it
 * must be the reader's own; or a computer's, sent by a member seated at the
 * table (whose browser worked the move out, `computerDriver`). An open seat's
 * turn waits for somebody to take it.
 */
export function moveRefusal(table: Table, readerId: string, seat: number): "over" | "notYourTurn" | "notSeated" | null {
  if (table.status !== ONLINE_STATUS.playing || table.toPlay === null) return "over";
  if (seatOfMember(table.seats, readerId) === null) return "notSeated";
  if (seat !== table.toPlay) return "notYourTurn";
  const toPlay = table.seats.find((one) => one.seat === seat);
  if (toPlay === undefined) return "notYourTurn";
  if (toPlay.kind === ONLINE_SEAT_KINDS.computer) return null;
  return toPlay.kind === ONLINE_SEAT_KINDS.member && toPlay.memberId === readerId ? null : "notYourTurn";
}

/**
 * Whether the reader may end the table, for everybody, now: at a table being
 * played, before its first move — nothing is lost — or once the turn has
 * waited `PARTY_TURN_WAIT_MS` on somebody who is not the reader. Nobody may end
 * a table by leaving their own turn to go stale.
 */
export function mayEnd(table: Table, readerSeat: number | null, now: Date): boolean {
  if (table.status !== ONLINE_STATUS.playing || readerSeat === null) return false;
  if (table.moveCount === 0) return true;
  return table.toPlay !== readerSeat && now.getTime() - table.movedAt.getTime() >= PARTY_TURN_WAIT_MS;
}

/**
 * WHETHER THIS BROWSER SHOULD WORK OUT THE COMPUTER'S MOVE NOW — the one rule
 * that makes exactly one browser do it in the ordinary case.
 *
 * The member whose move handed the turn to the computer does: their page has
 * just been handed the new table and is certainly open. If that page went away
 * before sending the answer, any member seated at the table may once the turn
 * has waited `COMPUTER_TAKEOVER_MS`. The server takes the first answer for the
 * table's version and refuses any other (409), so two browsers can never both
 * move for it.
 */
export function computerDriver(
  table: Table & { lastMoverId: string | null },
  readerId: string,
  now: Date,
): boolean {
  if (table.status !== ONLINE_STATUS.playing || table.toPlay === null) return false;
  if (seatOfMember(table.seats, readerId) === null) return false;
  const toPlay = table.seats.find((one) => one.seat === table.toPlay);
  if (toPlay?.kind !== ONLINE_SEAT_KINDS.computer) return false;
  if (table.lastMoverId === readerId) return true;
  return now.getTime() - table.movedAt.getTime() >= COMPUTER_TAKEOVER_MS;
}

/** How a game stands once its rules have been asked, as the table row keeps it. */
export function standingOf<S, M>(rules: OnlineRules<S, M>, game: S): { status: OnlineStatus; toPlay: number | null; winners: number[]; moveCount: number } {
  const toPlay = rules.toPlay(game);
  return {
    status: toPlay === null ? ONLINE_STATUS.finished : ONLINE_STATUS.playing,
    toPlay,
    winners: toPlay === null ? [...rules.winners(game)] : [],
    moveCount: rules.moveCount(game),
  };
}

/**
 * THE SEATS THE SET-UP ASKED FOR, checked for their shape: seat 1 is the
 * maker's, every other a buddy, a link or a computer — a computer only one
 * the game has, a link only where the maker may hand one out (not a member
 * under 13), each buddy once and never the maker — and as many as the game
 * seats. The reason, or null. Whether each buddy may be reached is the
 * server's, from the database.
 */
export function seatAsksRefusal(
  asks: readonly OnlineSeatAsk[],
  { counts, levels, links, makerId }: { counts: readonly number[]; levels: readonly string[]; links: boolean; makerId: string },
): string | null {
  if (!counts.includes(asks.length)) return "That game is not played by that many.";
  if (asks[0]?.kind !== "me") return "Seat 1 is yours.";
  const buddies = new Set<string>();
  for (const ask of asks.slice(1)) {
    if (ask.kind === "me") return "You can sit in one seat.";
    if (ask.kind === "computer" && !levels.includes(ask.level)) return "That game has no such computer player.";
    if (ask.kind === "link" && !links) return "A member under 13 invites buddies by name rather than by a link anybody could open.";
    if (ask.kind === "buddy") {
      if (ask.memberId === makerId) return "You can sit in one seat.";
      if (buddies.has(ask.memberId)) return "Each buddy can sit in one seat.";
      buddies.add(ask.memberId);
    }
  }
  return null;
}

/** A seat ask as a browser sent it, checked for its shape, or null. */
export function readSeatAsk(sent: unknown): OnlineSeatAsk | null {
  if (typeof sent !== "object" || sent === null) return null;
  const { kind, memberId, level } = sent as { kind?: unknown; memberId?: unknown; level?: unknown };
  if (kind === "me" || kind === "link") return { kind };
  if (kind === "computer" && typeof level === "string" && level.length > 0 && level.length <= 64) return { kind, level };
  if (kind === "buddy" && typeof memberId === "string" && memberId.length > 0 && memberId.length <= 64) return { kind, memberId };
  return null;
}

/**
 * WHETHER A TABLE'S PAGE ASKS, AND HOW FAST — the table's answer to the two
 * questions the live board's cadence (`pollInterval`) takes.
 *
 * It asks while the table is being played, and not once it is over. On the
 * reader's own turn it asks at the ordinary cadence, as the live board does:
 * nobody else can move, but the same member may from another device, and a
 * seat taken or left shows. It hurries only while it waits on somebody else
 * who is a member on the site (`toPlayHere`, which the server never says of a
 * computer, an open seat or a child).
 */
export function tableWaits(view: { status: OnlineStatus; toPlay: number | null; mySeat: number; toPlayHere: boolean }): { polling: boolean; otherHere: boolean } {
  const polling = view.status === ONLINE_STATUS.playing && view.toPlay !== null;
  return { polling, otherHere: polling && view.toPlay !== view.mySeat && view.toPlayHere };
}
