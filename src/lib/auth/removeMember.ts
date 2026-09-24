import "server-only";

import { cancelGame, resignGame } from "@/lib/history/liveGameEndings";
import { declineOffer, withdrawOffer } from "@/lib/history/offerAnswer";
import { NOT_A_REFUSED_OFFER, isOffered, isOfferedTo } from "@/lib/history/offers";
import { prisma } from "@/lib/prisma";

import { operatorActionWrite } from "./operatorLog";
import { OPERATOR_ACTIONS } from "./operatorLog.constants";
import type { OperatorActor } from "./operatorLog.types";

/**
 * REMOVING AN ACCOUNT: the member's row and everything that is theirs alone,
 * while every game they played stays for the person they played it with.
 *
 * The privacy page promised removal on request and said it was done by hand,
 * because nothing here could do it: no `prisma.member.delete` anywhere. A
 * promise kept by hand is kept by whoever is awake, so this is the door, for
 * the operator (Admin) and for the member themselves (/me, Profile). The plan
 * is docs/plans/privacy/PRIV-04-remove-and-ask.md.
 *
 * WHAT GOES, and why each one:
 * - the Member row, and with it by cascade their buddies and ignores (both
 *   ways), their inbox and messages (both ways), their applause and a
 *   parent's consent — all theirs, or theirs with somebody who can no longer
 *   answer;
 * - their XP events: a ledger of their own acts;
 * - their puzzle solves, and the races they sat in — a race is two clocks on
 *   one grid, not a game the other racer keeps a record of, so the other
 *   racer's solve stays as an ordinary solve with its race link cleared;
 * - any old-style social row set aside with their id on it.
 *
 * WHAT STAYS, and why: every Game and every Move. A finished game belongs to
 * both people who played it, and the privacy page says so. Their seats are
 * detached (`blackMemberId` / `whiteMemberId` null), so nothing leads to a
 * page that is not there, and — only when they ask — the name on those seats
 * is taken off too (`blankSeats`). A name on a ladder follows the same
 * choice: detached from the account, or with `blankSeats` removed with the
 * ladder rows it heads. A line in somebody else's inbox that says it came
 * from them keeps its words and loses the link.
 *
 * WHAT NEVER HAPPENS: a Game or Move deleted, or anything written to the
 * other seat. A kept record from another site is not a member row and is
 * removed by a commit to `legacyPlayers.data.ts`, not here.
 */

/** What removal did to the games, for the operator's log line and the member's last page. */
export type LeftGames = {
  /** Games in progress they resigned, through the same function as the Resign button. */
  resigned: number;
  /** Games with no stone on the board yet, called off: nothing played, nothing owed. */
  calledOff: number;
  /** Offers they had made, taken back, and offers made to them, declined. */
  offersEnded: number;
  /**
   * Games that could not be ended: set up so nobody may resign, and already
   * begun. They stay in play with the seat detached, and are counted so the
   * log says so rather than claiming they were settled.
   */
  leftInPlay: number;
};

export type Removal = LeftGames & {
  /** Finished and unfinished games that keep their record with this seat detached. */
  gamesKept: number;
  blankSeats: boolean;
};

const ACTIVE_ROW = {
  id: true,
  status: true,
  blackMemberId: true,
  whiteMemberId: true,
  blackToken: true,
  whiteToken: true,
  offeredToMemberId: true,
  offeredAt: true,
  declinedAt: true,
  withdrawnAt: true,
} as const;

/**
 * Every game still going with them in it, ended the way they could have ended
 * it themselves, so the other player is told, the ladder is settled and
 * nothing is left waiting for a move that will never come.
 */
export async function leaveEveryGame(memberId: string): Promise<LeftGames> {
  const left: LeftGames = { resigned: 0, calledOff: 0, offersEnded: 0, leftInPlay: 0 };
  const games = await prisma.game.findMany({
    where: {
      status: "active",
      OR: [{ blackMemberId: memberId }, { whiteMemberId: memberId }, { offeredToMemberId: memberId }],
    },
    select: ACTIVE_ROW,
  });
  for (const game of games) {
    if (isOffered(game)) {
      const ended = isOfferedTo(game, memberId) ? await declineOffer(game.id, memberId) : await withdrawOffer(game.id, memberId);
      if (ended.ok) left.offersEnded += 1;
      else left.leftInPlay += 1;
      continue;
    }
    const token = game.blackMemberId === memberId ? game.blackToken : game.whiteToken;
    const resigned = await resignGame(game.id, token);
    if (resigned.ok) {
      left.resigned += 1;
      continue;
    }
    if (resigned.reason === "finished") continue;
    // Resigning was refused; calling off is allowed before the first stone, even where resigning is not.
    const calledOff = await cancelGame(game.id, token);
    if (calledOff.ok) left.calledOff += 1;
    else left.leftInPlay += 1;
  }
  return left;
}

/**
 * The removal itself: games left first, then one transaction for everything
 * else, with the operator's log row in it when the operator is the one
 * removing. Returns null when there is no such member, having done nothing.
 */
export async function removeMember(
  memberId: string,
  { blankSeats, by, reason }: { blankSeats: boolean; by?: OperatorActor; reason?: string },
): Promise<Removal | null> {
  const exists = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } });
  if (exists === null) return null;

  const left = await leaveEveryGame(memberId);
  // Games, not offers: a declined or withdrawn offer has the seat too, and was never a game (offers.coverage).
  const gamesKept = await prisma.game.count({
    where: { ...NOT_A_REFUSED_OFFER, OR: [{ blackMemberId: memberId }, { whiteMemberId: memberId }] },
  });
  const races = await prisma.puzzleRace.findMany({
    where: { OR: [{ hostMemberId: memberId }, { guestMemberId: memberId }] },
    select: { id: true },
  });
  const raceIds = races.map((race) => race.id);
  const removal: Removal = { ...left, gamesKept, blankSeats };

  await prisma.$transaction([
    // The seats: detached, and the name taken off only when asked.
    prisma.game.updateMany({
      where: { blackMemberId: memberId },
      data: blankSeats ? { blackMemberId: null, blackName: "" } : { blackMemberId: null },
    }),
    prisma.game.updateMany({
      where: { whiteMemberId: memberId },
      data: blankSeats ? { whiteMemberId: null, whiteName: "" } : { whiteMemberId: null },
    }),
    prisma.game.updateMany({ where: { offeredToMemberId: memberId }, data: { offeredToMemberId: null } }),
    // The ladders: the name without the account, or with the name taken off, gone from them.
    ...(blankSeats
      ? [
          prisma.playerVariantRating.deleteMany({ where: { memberId } }),
          prisma.player.deleteMany({ where: { memberId } }),
        ]
      : [
          prisma.playerVariantRating.updateMany({ where: { memberId }, data: { memberId: null } }),
          prisma.player.updateMany({ where: { memberId }, data: { memberId: null } }),
        ]),
    // Lines in other people's inboxes that came from them keep their words and lose the link.
    prisma.inboxItem.updateMany({
      where: { fromMemberId: memberId },
      data: blankSeats ? { fromMemberId: null, fromName: "" } : { fromMemberId: null },
    }),
    prisma.xpEvent.deleteMany({ where: { memberId } }),
    prisma.puzzleSolve.deleteMany({ where: { memberId } }),
    prisma.puzzleSolve.updateMany({ where: { raceId: { in: raceIds } }, data: { raceId: null } }),
    prisma.puzzleRace.deleteMany({ where: { id: { in: raceIds } } }),
    prisma.autoMatchRequest.deleteMany({ where: { member: memberId } }),
    prisma.socialRowWithoutMember.deleteMany({ where: { OR: [{ owner: memberId }, { target: memberId }] } }),
    // An operator's own past acts keep their line in the log, without a link to an account that is gone.
    prisma.operatorAction.updateMany({ where: { actorMemberId: memberId }, data: { actorMemberId: null } }),
    // Last: the row, and by cascade their social rows, messages, inbox, applause and a parent's consent.
    prisma.member.delete({ where: { id: memberId } }),
    ...(by === undefined
      ? []
      : [
          operatorActionWrite({
            actor: by,
            action: OPERATOR_ACTIONS.remove,
            subjectId: memberId,
            detail: removalDetail(removal, reason),
          }),
        ]),
  ]);
  return removal;
}

/** The log line: counts and the choice about names, never a name. */
export function removalDetail(removal: Removal, reason?: string): string {
  const parts = [
    `${removal.gamesKept} games kept`,
    removal.blankSeats ? "names taken off" : "names left on",
    `${removal.resigned} resigned`,
    `${removal.calledOff} called off`,
    `${removal.offersEnded} offers ended`,
  ];
  if (removal.leftInPlay > 0) parts.push(`${removal.leftInPlay} left in play`);
  const why = (reason ?? "").trim();
  return why === "" ? parts.join(", ") : `${parts.join(", ")}: ${why}`;
}
