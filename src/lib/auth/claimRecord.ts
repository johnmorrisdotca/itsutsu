import "server-only";

import type { Prisma } from "@prisma/client";

import { NOT_A_REFUSED_OFFER } from "@/lib/history/offers";
import { prisma } from "@/lib/prisma";
import { playedFromGames, playedRecountWrite } from "@/lib/rating/playedRun";
import { playerKey } from "@/lib/rating/playerKey";
import { isReservedKey } from "@/lib/rating/reservedKeys";

import { claimDetail } from "./claimRecord.constants";
import type { ClaimFacts, ClaimOutcome, ClaimPlan, ClaimRefusal } from "./claimRecord.types";
import { canBeClaimed } from "./memberId";
import { operatorActionData } from "./operatorLog";
import { OPERATOR_ACTIONS } from "./operatorLog.constants";
import type { OperatorActor } from "./operatorLog.types";

/**
 * CLAIMING A KEPT HISTORY: A RECORD UNDER A NAME NOBODY HAD AN ACCOUNT FOR,
 * ATTACHED TO A MEMBER BY THE OPERATOR'S HAND.
 *
 * WHAT A "RECORD" IS HERE, because it is not a member row. A game stores the
 * names as they were played, and a rating is anchored to a member only where
 * `memberIdForName` found one at the moment the result was recorded. So a name
 * typed at one screen, or played under before accounts existed, left a history
 * with nobody behind it: a `Player` row and `PlayerVariantRating` rows keyed by
 * the folded name with a null `memberId`, and finished games whose seat carries
 * the name and no member id. The migration that anchored ratings to members
 * said so at the time: such a name "belongs to nobody in particular until
 * somebody claims it". The site draws those as the one dash left in the XP
 * column — "a name nobody has claimed".
 *
 * WHAT IT IS NOT. The two kept records from other sites — Chibi and Kyokosan —
 * are member rows marked `unclaimableBecause: "kept-record"`, and John's rule
 * (2026-09-09) is that such a row can never be claimed, by anybody, by any
 * route. Their names are reserved, so nothing is ever recorded under them.
 * A guest who came in with an invite code is already a member (0.203.0), and
 * keeps that same id when they add an address or four words; joining two
 * member accounts is a merge, which this does not do.
 *
 * THE RULE JOHN DECIDED, AND WHERE IT IS KEPT:
 *
 * - **Knowing an id is never enough.** A claim is made by the operator, whose
 *   session the route checks; nothing a member can send reaches this.
 * - **A row marked unclaimable is never claimed.** `claimDecision` refuses a
 *   name that belongs to a kept record, a seed or a program, and a member row
 *   marked that way is never the one a record is attached to either: a row meant
 *   to stand as it is takes nothing on.
 * - **One function says yes.** `claimDecision` is the only thing that decides,
 *   and `claimRecord` the only thing that writes — reading the facts inside its
 *   own transaction and asking `claimDecision` of them there, so what was decided
 *   is what is written.
 *
 * WHAT MOVES, and nothing else: the rating row and the per-game standings under
 * the name, which become the member's and are shown under the member's name (as
 * `renameMember` shows them); the seats under that name that carry nobody's id,
 * which carry the member's; and the member's four played figures and run,
 * counted again over the games they now hold. The games keep the names they
 * were played under, which is what happened. No XP moves — a name with nobody
 * behind it earned none — and none is paid here. One `OperatorAction` row says
 * what moved, in counts.
 */

/** A reader both the plain client and a transaction satisfy. */
type Db = Prisma.TransactionClient;

/** Finished games as `/history` lists them: over, and not an offer somebody refused. */
const LISTED: Prisma.GameWhereInput = { status: "finished", ...NOT_A_REFUSED_OFFER };

/** A seat under the name, matched as a player's own record matches it. */
function seatUnder(seat: "black" | "white", key: string): Prisma.GameWhereInput {
  return seat === "black"
    ? { blackName: { equals: key, mode: "insensitive" } }
    : { whiteName: { equals: key, mode: "insensitive" } };
}

/** A seat under the name that carries a member id, and not this member's. */
function seatHeldByOther(seat: "black" | "white", key: string, memberId: string): Prisma.GameWhereInput {
  const held =
    seat === "black"
      ? [{ blackMemberId: { not: null } }, { blackMemberId: { not: memberId } }]
      : [{ whiteMemberId: { not: null } }, { whiteMemberId: { not: memberId } }];
  return { AND: [seatUnder(seat, key), ...held] };
}

/** A seat under the name that carries nobody's id. */
function seatOpen(seat: "black" | "white", key: string): Prisma.GameWhereInput {
  return { AND: [seatUnder(seat, key), seat === "black" ? { blackMemberId: null } : { whiteMemberId: null }] };
}

/**
 * Everything the decision needs, in one read.
 *
 * The namesakes are found by the rule `memberIdForName` uses to decide whose a
 * result is — the name folded by `playerKey` — narrowed first by the name's
 * opening word, which every name folding to the key contains.
 */
export async function readClaimFacts(db: Db, name: string, memberId: string): Promise<ClaimFacts> {
  const key = playerKey(name);
  const none: ClaimFacts = {
    key,
    reserved: false,
    member: null,
    namesakes: [],
    rating: null,
    standings: [],
    games: 0,
    seatsHeldByOthers: 0,
    openBlack: 0,
    openWhite: 0,
    memberHasRating: false,
    memberVariants: [],
  };
  if (key === "") return none;
  const [member, candidates, rating, standings, games, seatsHeldByOthers, openBlack, openWhite, owned, ownedStandings] =
    await Promise.all([
      db.member.findUnique({
        where: { id: memberId },
        select: { id: true, name: true, botTier: true, unclaimableBecause: true },
      }),
      db.member.findMany({
        where: { name: { contains: key.split(" ")[0], mode: "insensitive" } },
        select: { id: true, name: true, botTier: true, unclaimableBecause: true },
      }),
      db.player.findUnique({ where: { key }, select: { memberId: true } }),
      db.playerVariantRating.findMany({ where: { key }, select: { variant: true, memberId: true } }),
      db.game.count({ where: { AND: [LISTED, { OR: [seatUnder("black", key), seatUnder("white", key)] }] } }),
      db.game.count({
        where: { AND: [LISTED, { OR: [seatHeldByOther("black", key, memberId), seatHeldByOther("white", key, memberId)] }] },
      }),
      db.game.count({ where: { AND: [LISTED, seatOpen("black", key)] } }),
      db.game.count({ where: { AND: [LISTED, seatOpen("white", key)] } }),
      db.player.count({ where: { memberId } }),
      db.playerVariantRating.findMany({ where: { memberId }, select: { variant: true } }),
    ]);
  return {
    ...none,
    reserved: isReservedKey(key),
    member,
    namesakes: candidates
      .filter((one) => playerKey(one.name) === key)
      .map(({ id, botTier, unclaimableBecause }) => ({ id, botTier, unclaimableBecause })),
    rating,
    standings,
    games,
    seatsHeldByOthers,
    openBlack,
    openWhite,
    memberHasRating: owned > 0,
    memberVariants: ownedStandings.map((one) => one.variant),
  };
}

/** What a claim over these facts would move. Rows already the member's move nothing. */
function planOf(facts: ClaimFacts): ClaimPlan {
  return {
    games: facts.games,
    seats: facts.openBlack + facts.openWhite,
    rating: facts.rating !== null && facts.rating.memberId === null,
    standings: facts.standings.filter((one) => one.memberId === null).length,
  };
}

/** Why these facts make no claim, most fundamental first, or null when nothing stands in the way. */
function claimRefusal(facts: ClaimFacts): ClaimRefusal | null {
  if (facts.key === "") return "no-name";
  const member = facts.member;
  if (member === null) return "no-member";
  if (member.botTier !== null || !canBeClaimed(member.unclaimableBecause)) return "member-unclaimable";
  if (playerKey(member.name) === "") return "member-nameless";
  const marked = facts.namesakes.some((one) => one.botTier !== null || !canBeClaimed(one.unclaimableBecause));
  if (facts.reserved || marked) return "record-unclaimable";
  if (facts.namesakes.some((one) => one.id !== member.id)) return "name-held";
  const others = (owner: string | null) => owner !== null && owner !== member.id;
  if (others(facts.rating?.memberId ?? null) || facts.standings.some((one) => others(one.memberId)) || facts.seatsHeldByOthers > 0) {
    return "already-claimed";
  }
  const plan = planOf(facts);
  if (!plan.rating && plan.standings === 0 && plan.seats === 0) return "nothing-to-claim";
  const twice = facts.standings.some((one) => one.memberId === null && facts.memberVariants.includes(one.variant));
  if ((plan.rating && facts.memberHasRating) || twice) return "has-standing";
  return null;
}

/**
 * THE ONE ANSWER. Every refusal, or yes with what would move — pure, so every
 * refusal is pinned by a test without a database, and the preview and the claim
 * cannot disagree about a single case.
 */
export function claimDecision(facts: ClaimFacts): ClaimOutcome {
  const refused = claimRefusal(facts);
  if (refused !== null || facts.member === null) return { ok: false, reason: refused ?? "no-member" };
  return { ok: true, member: { id: facts.member.id, name: facts.member.name }, plan: planOf(facts) };
}

/** What a claim would move, or why it would not — read, and never written. */
export async function previewClaim(name: string, memberId: string): Promise<ClaimOutcome> {
  return claimDecision(await readClaimFacts(prisma, name, memberId));
}

/** Somebody else's write landed between the read and this one; nothing of this claim is kept. */
class ClaimOvertaken extends Error {}

/**
 * Attaches the record under `name` to the member, in one transaction, and keeps
 * the act in the operator log — or changes nothing and says why.
 *
 * Every write is conditional on the row still carrying nobody's id, and counted
 * against what was decided. A count that differs means a concurrent write took
 * part of the record first; the transaction is rolled back and the answer is
 * the refusal a fresh look would give.
 */
export async function claimRecord(input: { name: string; memberId: string; by: OperatorActor }): Promise<ClaimOutcome> {
  try {
    return await prisma.$transaction(async (tx) => {
      const facts = await readClaimFacts(tx, input.name, input.memberId);
      const decided = claimDecision(facts);
      if (!decided.ok) return decided;
      const { member, plan } = decided;
      const key = facts.key;
      const shown = { memberId: member.id, name: member.name };

      const rating = await tx.player.updateMany({ where: { key, memberId: null }, data: shown });
      const standings = await tx.playerVariantRating.updateMany({ where: { key, memberId: null }, data: shown });
      const black = await tx.game.updateMany({ where: { AND: [LISTED, seatOpen("black", key)] }, data: { blackMemberId: member.id } });
      const white = await tx.game.updateMany({ where: { AND: [LISTED, seatOpen("white", key)] }, data: { whiteMemberId: member.id } });
      const asDecided =
        rating.count === (plan.rating ? 1 : 0) &&
        standings.count === plan.standings &&
        black.count === facts.openBlack &&
        white.count === facts.openWhite;
      if (!asDecided) throw new ClaimOvertaken();

      const held = await tx.game.findMany({
        where: { status: "finished", result: { not: "abandoned" }, OR: [{ blackMemberId: member.id }, { whiteMemberId: member.id }] },
        select: { id: true, blackMemberId: true, whiteMemberId: true, winner: true, lastMoveAt: true, playedAt: true },
      });
      await tx.member.update({ where: { id: member.id }, data: playedRecountWrite(playedFromGames(member.id, held)) });
      await tx.operatorAction.create({
        data: operatorActionData({
          actor: input.by,
          action: OPERATOR_ACTIONS.recordClaimed,
          subjectId: member.id,
          detail: claimDetail(plan),
        }),
      });
      return decided;
    });
  } catch (error) {
    if (error instanceof ClaimOvertaken) return { ok: false, reason: "already-claimed" };
    throw error;
  }
}
