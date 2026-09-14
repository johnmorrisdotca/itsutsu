import "server-only";

import { adminEmails } from "@/lib/auth/admin";
import { isBotId } from "@/lib/bots/bots";
import { prisma } from "@/lib/prisma";
import { seatedLive } from "./myFinished";

/**
 * How many games in progress is too many for one member to be holding at
 * once.
 *
 * Not a setting anybody tunes: this is a backstop against a board nobody could
 * actually be keeping up with. Twenty boards is already more than a person
 * plays in a week on a site where a game can take days between moves — a
 * twenty-first is not the one that was waiting on them.
 *
 * TWENTY FOR EVERY MEMBER, IN EVERY ENVIRONMENT. It was relieved for the
 * end-to-end suite by `RATE_LIMIT_RELIEF`, the same variable as the rate
 * limits — one knob rather than two — because the suite drives the whole site
 * as one member and starts a game in most of four hundred tests, so it reached
 * twenty within a few files. That made the cap four hundred on every server
 * the suite drives, which meant no browser test could ever reach it, and one
 * written anyway would have passed over nothing.
 *
 * So the knob is split, and not into a second knob. What the suite needs is
 * room for ONE member — its operator, who plays every one of those games — and
 * the deployment already says who that is: `ADMIN_EMAILS`, which the suite
 * cannot start without. Outside production an operator's address is let past
 * the cap (see `operatorsLetPast`); everybody else meets the real twenty, which
 * is what lets `e2e/active-game-cap.spec.ts` reach it with a member of its own.
 * In production nobody is let past, however the variable is set.
 *
 * The computer players are left out of it. They exist to always have a seat
 * open, the directory says so, and a batch of games started against one on
 * purpose is not the runaway pile this limit is for — see `isBotId` below.
 */
export const ACTIVE_GAME_LIMIT = 20;

/**
 * The members among these whose address is an operator's, where that lets them
 * past the cap: outside production, and nowhere else.
 *
 * WHY AN OPERATOR, and not a multiplier: a multiplier moves the cap for
 * everybody on the server, so the one test that matters — somebody meeting the
 * real twenty — could never be written. Letting one named account past it
 * leaves the number true for every other member on the same server.
 *
 * Production asks nothing at all, so the check a real member meets costs
 * exactly what it did. Outside production it is one read, of at most the two
 * seats a door binds, and none when no operator is configured.
 */
async function operatorsLetPast(memberIds: readonly string[]): Promise<Set<string>> {
  if (process.env.NODE_ENV === "production") return new Set();
  const operators = adminEmails();
  if (operators.length === 0 || memberIds.length === 0) return new Set();
  const rows = await prisma.member.findMany({
    where: { id: { in: [...memberIds] }, email: { in: operators } },
    select: { id: true },
  });
  return new Set(rows.map((row) => row.id));
}

/**
 * How many games this member is seated in that are still being played.
 *
 * The where is `seatedLive`, shared with `/play?all=seated`, so a count quoted
 * anywhere can link to exactly the games it counted.
 */
export async function activeGameCount(memberId: string): Promise<number> {
  return prisma.game.count({ where: seatedLive(memberId) });
}

/**
 * A member who cannot take another board, and the numbers to say back to them.
 *
 * The count travels with the answer because the refusal has to quote it and
 * the check has just done the counting. Fetching it a second time where the
 * message is written would be the same question asked twice, and the two
 * could disagree — a game can finish between them.
 */
export type OverTheLimit = {
  memberId: string;
  /** How many they are actually holding, as counted at the moment of the check. */
  count: number;
  /** The limit the check applied, carried so the sentence quotes the number that was used. */
  limit: number;
};

/**
 * The first of the seats a game would bind that is already carrying twenty
 * games, or null when none of them are.
 *
 * Takes every seat an acquisition could bind rather than only the person
 * asking: a game against a program fills both seats, and a creation that binds
 * two members binds two boards. Anonymous seats and computer players never trip
 * it — an anonymous seat belongs to no member to be over the limit, and a
 * computer player is exempt by design (see `ACTIVE_GAME_LIMIT`) — and outside
 * production neither does an operator (see `operatorsLetPast`).
 *
 * This is the ONLY place the question is decided, and every door a member can
 * acquire a board through calls it: creating a game, posting an open seat,
 * sitting at somebody else's, a challenge, and a fork. It was called from the
 * creation route alone once, which made the cap a property of one button
 * rather than of the site — a member at the limit could answer other people's
 * posted seats all day, and posted seats are precisely the pile that grows.
 *
 * ON THE RACE, WHICH IS REAL AND IS LEFT ALONE.
 *
 * The count and the binding that follows it are two statements, not one. Two
 * requests at two doors can both read nineteen and both bind, and the member
 * ends on twenty-one. That is not hypothetical and nothing below prevents it.
 *
 * It is left because of what this limit IS. It is a backstop against a pile
 * nobody could keep up with, not an invariant anything downstream trusts —
 * no query, no ladder and no bill depends on a member holding at most twenty.
 * The overshoot is bounded by how many requests are genuinely in flight (a
 * double-click, realistically one or two), and it is self-correcting: the
 * next door counts twenty-one, sees it is over, and refuses. It cannot
 * compound, because nothing caches the count.
 *
 * Both ways of making it exact cost more than the fault. A denormalised
 * counter on the member could be tested and incremented in one conditional
 * write — genuinely atomic — but it would then have to be kept in step with
 * every finish, resign, timeout, sweep and bot batch, and a counter that has
 * drifted upward locks somebody out of the site with nothing on screen to
 * explain why. That trade is a worse bug than the one it fixes, and it is the
 * shape AGENTS.md warns about twice: a second record of something, kept by
 * hand, drifting from the first. The alternative, a serialisable transaction
 * spanning the count and the bind, would have to wrap writes in three routes
 * — including the seat claim, whose single conditional update currently
 * cannot fail and would gain an abort-and-retry path for this alone.
 *
 * The contrast worth keeping in view is `sitAtOpenSeat`, which DOES serialise,
 * and should: two people in one seat is a corrupt game and unrecoverable.
 * Twenty-one boards is a soft limit briefly exceeded and then enforced.
 *
 * So this is a judgement rather than an oversight. If it ever has to be exact,
 * the shape to reach for is the one the seat claim already uses — a single
 * conditional write that tests the thing it is changing — which would mean
 * the cap living on a column, not on a count read a moment beforehand.
 */
export async function memberOverActiveLimit(
  memberIds: readonly (string | null | undefined)[],
): Promise<OverTheLimit | null> {
  const candidates = [...new Set(memberIds.filter((id): id is string => !!id && !isBotId(id)))];
  const letPast = await operatorsLetPast(candidates);
  for (const memberId of candidates) {
    if (letPast.has(memberId)) continue;
    const count = await activeGameCount(memberId);
    if (count >= ACTIVE_GAME_LIMIT) return { memberId, count, limit: ACTIVE_GAME_LIMIT };
  }
  return null;
}

/**
 * What to tell them, in one wording for every door.
 *
 * It says their own number because a bare refusal reads as a fault: "twenty
 * games at once is the limit" leaves somebody to wonder whether the site has
 * miscounted, and they cannot check without going and counting boards. Their
 * own total answers that in the sentence that refuses them.
 *
 * Both numbers are quoted from the answer rather than written into the words,
 * so the sentence says the limit the check actually applied — the one place a
 * number and a rule could otherwise drift apart.
 */
export function activeLimitRefusal(over: OverTheLimit): string {
  return (
    `You have ${over.count} games on the go, and ${over.limit} at once is the limit here — ` +
    `finish or resign one before taking on another.`
  );
}
