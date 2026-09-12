import "server-only";

import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";

import { awardXp } from "./awardXp";
import { XP_EVENTS } from "./xp.constants";
import type { XpAward, XpEventType } from "./xp.types";

/**
 * The awards that are about other people: asking for a game, answering one,
 * playing it again, and keeping a buddy list.
 *
 * Every one of them rides a write that already happens, and none of them is
 * called from a page. What is here rather than at the call site is the DECIDING —
 * which kind of creation this was, whether a move is the one that answers a
 * challenge — so that a route handler gains a line and not a paragraph, and so
 * the rules can be tested without a request.
 */

/** What made a game, as far as XP is concerned. */
export const CREATED_GAME_KINDS = {
  challenge: "challenge",
  rematch: "rematch",
  fork: "fork",
} as const;

export type CreatedGameKind = (typeof CREATED_GAME_KINDS)[keyof typeof CREATED_GAME_KINDS];

/** What each kind of creation pays whoever asked for it. */
const CREATED_GAME_AWARDS: Record<CreatedGameKind, XpEventType> = {
  challenge: XP_EVENTS.challengeSent,
  rematch: XP_EVENTS.rematchPlayed,
  fork: XP_EVENTS.forkPlayed,
};

/**
 * Which of the three a creation request is, or null for the ones that are none.
 *
 * ORDER MATTERS AND IS THE DECISION. A fork against the same opponent fills in
 * `challenge` on its way through the route — that is how the other seat gets
 * bound — so a test that asked "is there a challenge" first would pay a fork as
 * a challenge, and asking both would pay one action twice. A fork is a fork, a
 * rematch is a rematch, and `challengeSent` is for the plain ask.
 *
 * Null for the lobby, a posted seat and a hot-seat board: nobody was asked for a
 * game, so nothing was sent. Read from what the CALLER actually sent rather than
 * from the merged settings, because that is the only thing that says what was
 * asked for.
 */
export function createdGameKind(asked: {
  rematch?: unknown;
  from?: unknown;
  challenge?: unknown;
  challengeId?: unknown;
}): CreatedGameKind | null {
  if (asked.rematch !== undefined) return CREATED_GAME_KINDS.rematch;
  if (asked.from !== undefined) return CREATED_GAME_KINDS.fork;
  if (asked.challenge !== undefined || asked.challengeId !== undefined) {
    return CREATED_GAME_KINDS.challenge;
  }
  return null;
}

/**
 * Pay whoever just made a game for making it.
 *
 * Keyed on the NEW game's id, so asking the same person again tomorrow pays
 * again — this is not a once-ever award, it is the thing that starts everything,
 * and it is capped at three a day instead.
 */
export async function awardCreatedGame({
  memberId,
  gameId,
  kind,
}: {
  memberId: string | null;
  gameId: string;
  kind: CreatedGameKind | null;
}): Promise<void> {
  if (kind === null) return;
  await awardXp({ memberId, awards: [{ type: CREATED_GAME_AWARDS[kind], subject: gameId }] });
}

/**
 * One stored move, as little of it as the question below needs.
 */
type PlacedMove = { stone: string };

/**
 * A game somebody was ASKED to play, as its row looks.
 *
 * Three tests, all of them on columns already in hand, and each rules out a game
 * nobody asked anybody for:
 *
 * - **Not one screen.** A hot-seat board is one token for both chairs; nobody
 *   was invited to it.
 * - **Two different members hold the two seats.** A game with a loose seat is
 *   one waiting for whoever turns up.
 * - **Never posted.** A seat on the noticeboard is answered by sitting down, not
 *   by being asked — and nothing paid `challengeSent` for it.
 */
function wasAsked(row: {
  blackToken: string;
  whiteToken: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
  openedAt: Date | null;
}): boolean {
  if (row.blackToken === row.whiteToken) return false;
  if (row.blackMemberId === null || row.whiteMemberId === null) return false;
  if (row.blackMemberId === row.whiteMemberId) return false;
  return row.openedAt === null;
}

/**
 * Whether this seat has played nothing yet, read off the moves already in hand.
 *
 * THE RECORD KEEPS THE COLOUR PLACED, NOT THE SEAT THAT PLACED IT, and in two
 * kinds of game those are different things: where the mover chooses each stone's
 * colour (`anyColour`), and where every stone is black whoever laid it
 * (`singleColour`). For those, the stored moves cannot say whose they were, so
 * this answers `null` — not known — and nothing is paid on it. One variant of
 * thirty-nine is in that position today.
 *
 * A rule that cannot measure must not fire. The alternative — counting moves and
 * assuming they alternate — is wrong in every game with a handicap, a pass, or
 * more than one stone a turn.
 */
export function seatHasNotMoved({
  variant,
  moves,
  stone,
}: {
  variant: string;
  moves: readonly PlacedMove[];
  stone: Stone;
}): boolean | null {
  const spec = VARIANT_SPECS[variant as RuleVariant];
  if (spec === undefined) return null;
  if (spec.anyColour || spec.singleColour) return null;
  return !moves.some((move) => move.stone === stone);
}

/**
 * Pay the challenged side for answering with a move, if that is what this is.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THERE IS NO `Challenge` MODEL, AND THE LEDGER IS WHAT REMEMBERS THE ASK
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A challenge here is a `Game` created with both seats bound, so there is no
 * accept route to ride and nothing on the row that says who asked whom.
 * XP_DESIGN.md left the choice of how to tell — or to drop the award — to
 * whoever wired it. It is told from the ledger: the creation already wrote a
 * `challengeSent`, `rematchPlayed` or `forkPlayed` row keyed on THIS game and on
 * the member who asked, so the side answering is the side that is not the one
 * holding that row.
 *
 * That is exact rather than approximate, and it has the property worth having:
 * the answer is only paid where an ask was actually recorded, so nothing pays
 * for answering a challenge nobody sent.
 *
 * **What it costs:** one indexed read, on the unique index the ledger already
 * has, and only for a move that passes every free test above it — a seat's FIRST
 * move in a game that two different members were bound to and nobody posted. At
 * most twice in a game's life.
 *
 * **Where it is silent, and why that is the right direction.** A challenger who
 * had already sent three challenges today has no row for this game, because
 * `challengeSent` is capped at three — so the answer to their fourth is not paid.
 * A false silence, rather than a false award: the alternative is inferring the
 * asker from the seats, which is wrong for a rematch (the colours swap) and for
 * any game whose opener was chosen.
 */
export async function awardAnsweredChallenge(
  row: {
    id: string;
    variant: string;
    blackToken: string;
    whiteToken: string;
    blackMemberId: string | null;
    whiteMemberId: string | null;
    openedAt: Date | null;
    moves: readonly PlacedMove[];
  },
  stone: Stone,
): Promise<void> {
  try {
    if (!wasAsked(row)) return;
    if (seatHasNotMoved({ variant: row.variant, moves: row.moves, stone }) !== true) return;
    const mover = stone === "black" ? row.blackMemberId : row.whiteMemberId;
    const other = stone === "black" ? row.whiteMemberId : row.blackMemberId;
    if (mover === null || other === null) return;

    const ask = await prisma.xpEvent.findFirst({
      where: {
        memberId: other,
        subject: row.id,
        type: {
          in: [XP_EVENTS.challengeSent, XP_EVENTS.rematchPlayed, XP_EVENTS.forkPlayed],
        },
      },
      select: { id: true },
    });
    if (ask === null) return;

    await awardXp({
      memberId: mover,
      awards: [{ type: XP_EVENTS.challengeAnswered, subject: row.id }],
    });
  } catch (problem) {
    /* A move that was played is a move that was played. The whole of this is
       bookkeeping on top of it. */
    console.error("Could not settle a challenge answered", row.id, problem);
  }
}

/**
 * Pay a member for keeping a buddy list, and for starting one.
 *
 * Two awards from one action, which is the shape the catalogue asks for: the
 * first buddy is once ever and is worth five times a later one, because a site
 * with one person on it is a demo. `buddyAdded` is keyed on the buddy, so adding
 * the same person again — the upsert makes that a no-op — pays nothing.
 */
export async function awardBuddyKept({
  memberId,
  buddyId,
}: {
  memberId: string | null;
  buddyId: string;
}): Promise<void> {
  const awards: XpAward[] = [
    { type: XP_EVENTS.firstBuddy },
    { type: XP_EVENTS.buddyAdded, subject: buddyId },
  ];
  await awardXp({ memberId, awards });
}

/** Pay the courtesy awards: time given, and applause left on a finished game. */
export async function awardCourtesy({
  memberId,
  gameId,
  type,
}: {
  memberId: string | null;
  gameId: string;
  type: typeof XP_EVENTS.timeGiven | typeof XP_EVENTS.applauseGiven;
}): Promise<void> {
  await awardXp({ memberId, awards: [{ type, subject: gameId }] });
}

/**
 * Pay somebody for taking their seat on a device that is not theirs.
 *
 * THE SIT-AS ROUTE, NOT THE SEAT-LINK ONE, and the two are different doors.
 * `POST /api/games/[id]/sit-as` is the four words: John is signed in on the
 * iPad, his daughter taps her words and the board becomes hers, as herself. That
 * is the thing the award names — "you took your seat on another device" — and the
 * feature nothing on the site celebrated.
 *
 * The seat-token route is somebody following a link they were sent, which is
 * ordinary and is not this. XP_DESIGN.md pointed at `bindSeat`/`markSeatTaken`
 * because that is where a seat becomes somebody's; the four-words door is the one
 * that matches the award's own words, and it is also the door a child on a
 * borrowed tablet actually comes through.
 *
 * Keyed on the game, so each board she sits at pays once however many times the
 * tablet changes hands over it.
 */
export async function awardSeatClaimedElsewhere({
  memberId,
  gameId,
}: {
  memberId: string | null;
  gameId: string;
}): Promise<void> {
  await awardXp({ memberId, awards: [{ type: XP_EVENTS.seatClaimedElsewhere, subject: gameId }] });
}
