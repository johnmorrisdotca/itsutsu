import "server-only";

/**
 * Taking a seat as somebody else on a device where somebody else is signed in.
 *
 * THE KITCHEN TABLE, which is the whole reason this feature exists. One iPad,
 * John signed in on it, and his twelve-year-old taking the other seat AS
 * HERSELF — so the game is rated, is in her record, and moves her standing on
 * the ladder. She proves it is her with four words; this is what happens after
 * the words are right.
 *
 * WHAT IT IS NOT, and the distinction is the point rather than a nicety. Hot
 * seat — two people at one screen — shares a single token between both seats
 * and is NEVER rated: `liveGame.ts` skips `recordResult` for it, on purpose,
 * because a person playing themselves must not move a ladder. That is
 * deliberately consequence-free, and it is the thing John does not want. So
 * this leaves the two tokens exactly as they are and changes only whose seat
 * the free one is. The game stays a real game between two accounts.
 *
 * PURELY ADDITIVE TO BOTH PEOPLE. No member row is written here at all: the
 * only thing that changes is one seat on one game, and only a seat that was
 * still waiting for somebody.
 */
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { activeLimitRefusal, memberOverActiveLimit } from "@/lib/history/activeGames";
import { prisma } from "@/lib/prisma";

export type StandInRefusal =
  | "no-game"
  | "no-free-seat"
  | "already-seated"
  | "which-seat"
  | "over-limit"
  | "no-name";

export type StandInOutcome =
  | { ok: true; seat: Stone; token: string; variant: string }
  | { ok: false; reason: StandInRefusal; said?: string };

const SEAT_ROW = {
  variant: true,
  openSeat: true,
  offeredAt: true,
  moveCount: true,
  blackToken: true,
  whiteToken: true,
  blackMemberId: true,
  whiteMemberId: true,
  blackName: true,
  whiteName: true,
  blackClaimedAt: true,
  whiteClaimedAt: true,
} as const;

type SeatRow = {
  variant: string;
  openSeat: string | null;
  offeredAt: Date | null;
  moveCount: number;
  blackToken: string;
  whiteToken: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
  blackName: string;
  whiteName: string;
  blackClaimedAt: Date | null;
  whiteClaimedAt: Date | null;
};

/**
 * Whether a seat is still waiting for somebody.
 *
 * The same question `seatIsFree` answers, asked over the columns this module
 * reads: a stone on the board settles both seats however they are stamped, and
 * an unstamped seat with a member on it belongs to that member.
 */
function isFree(row: SeatRow, seat: Stone): boolean {
  if (row.moveCount > 0) return false;
  /*
   * AND NEITHER SEAT OF AN OFFER IS FREE. Four words prove WHO somebody is,
   * and an offer is addressed to one person by member id — so without this,
   * anybody in the room with their own words set could sit down in a seat
   * offered to somebody else, accepting a game on their behalf through a door
   * that never looks at `offeredToMemberId`. The offeree accepts through
   * `POST /api/games/[id]/offer/accept` and nowhere else.
   */
  if (row.offeredAt !== null) return false;
  const claimed = seat === STONES.black ? row.blackClaimedAt : row.whiteClaimedAt;
  const held = seat === STONES.black ? row.blackMemberId : row.whiteMemberId;
  return claimed === null && held === null;
}

/**
 * Seats a member in a free seat at this board, having already proved who they
 * are.
 *
 * NOTHING HERE CHECKS THE PHRASE. The words are verified by the route, against
 * a rate limit, before this is called — a library function has no address to
 * count attempts against, and a guessing limit that could be reached by calling
 * a different function would not be a limit. This takes a member id as a fact.
 */
export async function seatStandIn(
  id: string,
  memberId: string,
  name: string,
  wanted?: Stone,
): Promise<StandInOutcome> {
  const shown = name.trim();
  // A seat carries the name the rating is filed under. Blank is not a name.
  if (shown === "") return { ok: false, reason: "no-name" };

  const row = (await prisma.game.findUnique({ where: { id }, select: SEAT_ROW })) as SeatRow | null;
  if (row === null) return { ok: false, reason: "no-game" };

  /*
   * Somebody who already has a chair at this board is not a stand-in for
   * anything. Asked before the free-seat question, so the refusal says the
   * useful thing — "you are already playing this one" rather than "no seat".
   */
  if (row.blackMemberId === memberId || row.whiteMemberId === memberId) {
    return { ok: false, reason: "already-seated" };
  }

  const seat = chooseSeat(row, wanted);
  if (seat === null) return { ok: false, reason: "no-free-seat" };
  if (seat === "which") return { ok: false, reason: "which-seat" };

  /*
   * Twenty boards is the limit however the twenty-first arrives, and this is a
   * new door — which is exactly the shape AGENTS.md says keeps getting it left
   * out. Asked BEFORE the seat is bound: afterwards there is nothing left to
   * refuse, and the refusal would be delivered to somebody already sitting down.
   */
  const atTheLimit = await memberOverActiveLimit([memberId]);
  if (atTheLimit !== null) {
    return { ok: false, reason: "over-limit", said: activeLimitRefusal(atTheLimit) };
  }

  /*
   * The member id AND the name, in one write.
   *
   * The name is set unconditionally, which is the one way this differs from
   * `bindSeat` — that leaves a seat's existing name alone, correctly, because a
   * scanned link must not rename somebody. Here the seat was free a line ago, so
   * whatever is on it is a placeholder the host typed while setting the game up.
   * It matters because the rating is filed against the seat's NAME:
   * `recordResult` reads `blackName`/`whiteName`, so a seat still called
   * "Player 2" would file her win under nobody and her ladder would not move —
   * which is the entire thing this feature is for.
   */
  await prisma.game.update({
    where: { id },
    /*
     * AND THE SEAT IS NO LONGER OPEN. Binding the member and stamping the name
     * is not taking the seat: `openSeat` is what the board reads to decide
     * whether the game has started, and while it still names a waiting colour
     * the page draws a board nobody can play on — "Posted and waiting for
     * somebody", no players, no turn, no move. That is exactly what John met
     * at the kitchen table on 2026-09-12: Hanachan started Wild Tic-tac-toe,
     * he sat in with his four words, and "we can't even play a piece." The
     * seat-link claim clears it (openGames.ts); this path forgot to. Same
     * write, or it is not a claim.
     */
    data: { [`${seat}MemberId`]: memberId, [`${seat}Name`]: shown, openSeat: null },
  });

  /*
   * Somebody is sitting here now, so the seat's link stops being shown. The
   * token plays this seat on its own, so a link still on screen after the seat
   * is taken is her credential on display to whoever else is looking.
   *
   * Only if it is not already stamped, the same rule `markSeatTaken` keeps:
   * "when was this seat taken" must not drift into "when was it last opened".
   */
  const stamp = seat === STONES.black ? "blackClaimedAt" : "whiteClaimedAt";
  await prisma.game.updateMany({ where: { id, [stamp]: null }, data: { [stamp]: new Date() } });

  return {
    ok: true,
    seat,
    token: seat === STONES.black ? row.blackToken : row.whiteToken,
    variant: row.variant,
  };
}

/**
 * Which seat to take: the one named, the one posted, or the only free one.
 *
 * "which" rather than a guess when both are free and none was named. A seat is
 * which colour somebody plays for the whole game, and choosing on their behalf
 * because there were two answers is exactly the plausible-looking value that
 * should have been a refusal.
 */
function chooseSeat(row: SeatRow, wanted?: Stone): Stone | "which" | null {
  if (wanted !== undefined) return isFree(row, wanted) ? wanted : null;

  const posted = row.openSeat === STONES.black || row.openSeat === STONES.white ? row.openSeat : null;
  if (posted !== null && isFree(row, posted)) return posted;

  const free = [STONES.black, STONES.white].filter((seat) => isFree(row, seat));
  if (free.length === 0) return null;
  if (free.length > 1) return "which";
  return free[0];
}
