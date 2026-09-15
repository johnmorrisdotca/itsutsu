import "server-only";

import { prisma } from "@/lib/prisma";

import { earnableByProgram } from "./xp.constants";
import { xpDayKey } from "./xpDay";
import { levelCrossed } from "./xpCurve";
import { xpForBadge } from "./xpScope";
import { XP_SKIP_REASONS, type XpAward, type XpAwardResult, type XpAwarded } from "./xp.types";
import type { Decided, Recipient } from "./awardXp.types";
import { withinAllowance } from "./xpAllowance";
import { levelNote } from "./xpLevelNote";

/**
 * Paying XP, once, and never being able to fail the thing that earned it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * EVERY AWARD COMES THROUGH HERE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * So `Member.xp` has one writer, which is the same reasoning `recordPlayed`
 * gives for the streak columns: a materialised number with several writers
 * eventually disagrees with what it was derived from. And so the two rules
 * nothing else may restate — who is eligible, and how often — are in one place:
 * eligibility here, and the day's allowance in `xpAllowance.ts`, which only
 * this calls.
 *
 * **Called from the writers, never from a page.** A page that renders twice
 * pays twice; a page that is prefetched pays for a visit nobody made. The
 * writers this rides are listed in `XP_DESIGN.md`, and they all already do
 * exactly one write per thing that happened.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IDEMPOTENCY IS THE DATABASE'S JOB
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `XpEvent` is unique on `(memberId, type, subject)` and the subject is chosen
 * so the award happens as often as it should: the day key for a daily one, the
 * game id for a game, the variant for a first play, `""` for a once-ever. So a
 * second attempt is refused by the index rather than by a rule in here that a
 * caller could forget — `createMany` with `skipDuplicates` is what does it, and
 * the row count it returns is how this knows whether anything was owed.
 *
 * That matters more than it reads. Three of the four endings that finish a game
 * can fire for the same game (a move that wins, and then a timeout claimed on
 * the already-finished row), bots replay endings, and a retried serverless
 * invocation is ordinary. Every one of those is a duplicate award that nothing
 * would have reported.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT NEVER THROWS AT THE CALLER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A move that ends a game is a finished game whether or not its bookkeeping
 * landed. `awardXp` swallows and logs, and hands back what was actually paid,
 * rather than handing the caller something to check — which is UmaKuma's
 * `awardXpQuietly` made the default instead of the careful option, because the
 * careful option is the one somebody forgets in the one path that matters.
 */

/**
 * Pay a member for one or more things at once.
 *
 * A list rather than one call per award, because a single finished game pays for
 * several things and a member who is told "+65 XP" learns less than one told
 * what each part was for. The order is kept: the caller listed them in the order
 * they should be read, and the toasts come out that way.
 *
 * @param memberId The member's opaque id. Null and unknown ids are answered with
 *   nothing paid rather than an error: `currentMemberId()` returns null for the
 *   operator, `touchMember` returns early for them, and a decided game in
 *   production carries seats with null ids. A caller should not have to know
 *   which of those it is holding.
 */
export async function awardXp({
  memberId,
  awards,
  now = new Date(),
  about,
}: {
  memberId: string | null | undefined;
  awards: readonly XpAward[];
  now?: Date;
  /**
   * The game this batch was paid for, when it was paid for one — kept on the
   * flash, so the result card over that game can say this batch's XP in place
   * of the toasts that would otherwise stack over the board it covers.
   */
  about?: string;
}): Promise<XpAwardResult> {
  const nothing: XpAwardResult = { awards: [], points: 0, xp: 0, crossed: null };
  if (!memberId || awards.length === 0) return nothing;

  try {
    return await payAwards({ memberId, awards, now, about });
  } catch (problem) {
    /* Logged and swallowed. See the header: the thing that earned this has
       already happened and must not be failed by a ledger write. */
    console.error("Could not award XP", memberId, awards.map((award) => award.type), problem);
    return nothing;
  }
}

async function payAwards({
  memberId,
  awards,
  now,
  about,
}: {
  memberId: string;
  awards: readonly XpAward[];
  now: Date;
  about?: string;
}): Promise<XpAwardResult> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, botTier: true, timeZone: true, xp: true, xpEverywhere: true },
  });

  /* No row answers to that id. The operator has no Member row, and a game can
     carry a seat bound to an id whose member was removed. Silence rather than
     an upsert inventing a member — `recordPlayed` makes the same choice for the
     same reason. */
  if (member === null) return refused(awards, XP_SKIP_REASONS.noSuchMember, 0);

  /* ── THE COMPUTER PLAYERS CLIMB LIKE ANYONE, FROM THEIR GAMES ───────────
     This used to refuse a member with a `botTier` outright. John, looking at
     the live site: "i still don't see Levels for all equally and bots don't
     have XP". So a program is paid under the same rules as a person, from the
     same game-end writes — and held back from exactly the awards that are for
     acts a program never performs, which John put the other way round:
     "people will have to earn XP through other means which the Robots don't
     do." That list is XP_PEOPLE_ONLY, stated in the catalogue; a people-only
     award asked for a program is refused here with its reason, so nothing can
     reach one through a path that forgot to ask. */
  const held = member.botTier === null ? [] : awards.filter((award) => !earnableByProgram(award.type));
  const earnable = awards.filter((award) => !held.includes(award));
  const paid = await payEarnable({ member, awards: earnable, now, about });
  return {
    ...paid,
    awards: [...held.map((award) => ({ type: award.type, points: 0, skipped: XP_SKIP_REASONS.peopleOnly })), ...paid.awards],
  };
}

/** The awards a member may earn, paid: the allowance asked, the ledger written, the total moved. */
async function payEarnable({
  member,
  awards,
  now,
  about,
}: {
  member: Recipient;
  awards: readonly XpAward[];
  now: Date;
  about?: string;
}): Promise<XpAwardResult> {
  if (awards.length === 0) return { awards: [], points: 0, xp: member.xp, crossed: null };

  const dayKey = xpDayKey(now, member.timeZone);
  const allowed = await withinAllowance({ member, awards, dayKey });
  const payable = allowed.filter((award) => award.points > 0);

  if (payable.length === 0) {
    return { awards: allowed.map((award) => reported(award, false)), points: 0, xp: member.xp, crossed: null };
  }

  /* ── ONE TRANSACTION, AND THE INSERT IS THE ARBITER ─────────────────────
     One `createMany` of a single row per award, rather than one of all of them,
     and the reason is exactness. A batch insert reports HOW MANY rows it wrote
     and not WHICH, so a batch that partly duplicated would leave this guessing
     which awards to credit — and any guess based on reading the rows back is a
     guess about timing, which is how a total comes to disagree with its own
     ledger. One row at a time, and `count === 1` is a fact.

     `skipDuplicates` rather than catching the unique violation, because a
     raised error inside a Postgres transaction aborts it: every statement after
     the first duplicate would fail with "current transaction is aborted", and
     the awards listed after a repeat would silently stop being paid. This makes
     a duplicate a zero rather than an exception. */
  const written = await prisma.$transaction(async (tx) => {
    const paid: Decided[] = [];
    for (const award of payable) {
      const inserted = await tx.xpEvent.createMany({
        data: [{
          memberId: member.id,
          type: award.type,
          points: award.points,
          subject: award.subject,
          dayKey,
        }],
        skipDuplicates: true,
      });
      if (inserted.count === 1) paid.push(award);
    }

    const points = paid.reduce((total, award) => total + award.points, 0);
    /* Nothing was owed: every row already existed. */
    if (points === 0) return null;

    /* The level a toast names is the level the badge beside the member's name
       shows — `xpForBadge`, the one place that decides which total that is — so
       "Level up" and the badge a page draws a moment later cannot disagree. */
    const badgeBefore = xpForBadge(member);
    const updated = await tx.member.update({
      where: { id: member.id },
      data: {
        xp: { increment: points },
        /* The Everywhere total moves with every point earned here, in the same
           update, so it is always `xp + xpImported`. See `Member.xpEverywhere`. */
        xpEverywhere: { increment: points },
        /* The leaderboard's other sort column, written here for nothing rather
           than answered by `max(createdAt) group by memberId` — which as a SORT
           is a full scan of the ledger on every click. */
        xpLastAt: now,
        /* The flash is written here rather than in a second call, so it costs
           nothing and cannot disagree with the total. It replaces rather than
           appends: a member who has not looked at the site since the last award
           gets the newest batch, and the ledger has the rest. */
        xpFlash: {
          at: now.toISOString(),
          /* The game this batch was for, when the caller said. Left off otherwise,
             so a batch about nothing in particular reads exactly as it always did. */
          ...(about !== undefined ? { about } : {}),
          awards: paid.map(({ type, points: p }) => ({ type, points: p })),
          /* The level the toast may mention, decided here because here is where
             both totals are in hand. See `levelNote`. */
          ...(levelNote(badgeBefore, badgeBefore + points) ?? {}),
        },
      },
      select: { xp: true, xpEverywhere: true },
    });

    return { paid, points, xp: updated.xp, badgeBefore, badgeAfter: xpForBadge(updated) };
  });

  if (written === null) {
    /* Nothing landed. Read the total back rather than reporting the one this
       started with: another request may have paid something in between, and a
       stale total is what a caller would print beside the zero. */
    const current = await prisma.member.findUnique({ where: { id: member.id }, select: { xp: true } });
    return {
      awards: allowed.map((award) => reported(award, false)),
      points: 0,
      xp: current?.xp ?? member.xp,
      crossed: null,
    };
  }

  const paidKeys = new Set(written.paid.map(keyOf));
  return {
    awards: allowed.map((award) => reported(award, paidKeys.has(keyOf(award)))),
    points: written.points,
    xp: written.xp,
    crossed: levelCrossed(written.badgeBefore, written.badgeAfter),
  };
}

/**
 * Every award refused for the same reason, paid nothing.
 *
 * `xp` is the member's real total where there is one, and 0 only where there is
 * genuinely no member. A refusal reporting 0 for a member holding 4,000 would be
 * a perfectly plausible number that also means "nobody here" — the shape
 * AGENTS.md names as a guard returning a plausible value for "I do not know".
 */
function refused(
  awards: readonly XpAward[],
  skipped: XpAwarded["skipped"],
  xp: number,
): XpAwardResult {
  return {
    awards: awards.map((award) => ({ type: award.type, points: 0, skipped })),
    points: 0,
    xp,
    crossed: null,
  };
}

/** A decision as the caller sees it: no subject, and a reason for every zero. */
function reported(award: Decided, paid: boolean): XpAwarded {
  if (award.points === 0) return { type: award.type, points: 0, skipped: award.skipped };
  if (paid) return { type: award.type, points: award.points };
  /* Decided payable and then not written: the index refused it, so it had been
     earned already. That is a different fact from the allowance being full, and
     a surface explaining a zero needs to be able to tell them apart. */
  return { type: award.type, points: 0, skipped: XP_SKIP_REASONS.alreadyEarned };
}

/** What the unique index is keyed on, for matching a decision back to its row. */
function keyOf(award: Decided): string {
  return `${award.type}\0${award.subject}`;
}
