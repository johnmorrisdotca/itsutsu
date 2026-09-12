import "server-only";

import { prisma } from "@/lib/prisma";

import { XP_EVENT_SPECS, XP_ONE_MORE_GAME, xpPointsFor } from "./xp.constants";
import { xpDayKey } from "./xpDay";
import { levelCrossed, xpLevelFor, xpStanding } from "./xpCurve";
import { XP_SKIP_REASONS, type XpAward, type XpAwardResult, type XpAwarded } from "./xp.types";

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
 * nothing else may restate — who is eligible, and how often — are in one place.
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

/** What is read about a member before anything is paid. Four columns, one row. */
type Recipient = { id: string; botTier: string | null; timeZone: string; xp: number };

/**
 * One award after the allowance has been applied, with its subject still on it.
 *
 * The subject travels with the decision rather than being looked up by type
 * afterwards, because a batch may legitimately hold two awards of one type with
 * different subjects — a first game of two variants, a buddy added twice — and a
 * lookup by type would give both the first one's. Two rows with one key is a
 * duplicate the index refuses, so the second award would vanish and nothing
 * would say which.
 */
type Decided = XpAwarded & { subject: string };

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
}: {
  memberId: string | null | undefined;
  awards: readonly XpAward[];
  now?: Date;
}): Promise<XpAwardResult> {
  const nothing: XpAwardResult = { awards: [], points: 0, xp: 0, crossed: null };
  if (!memberId || awards.length === 0) return nothing;

  try {
    return await payAwards({ memberId, awards, now });
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
}: {
  memberId: string;
  awards: readonly XpAward[];
  now: Date;
}): Promise<XpAwardResult> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, botTier: true, timeZone: true, xp: true },
  });

  /* No row answers to that id. The operator has no Member row, and a game can
     carry a seat bound to an id whose member was removed. Silence rather than
     an upsert inventing a member — `recordPlayed` makes the same choice for the
     same reason. */
  if (member === null) return refused(awards, XP_SKIP_REASONS.noSuchMember, 0);

  /* ── THE COMPUTER PLAYERS DO NOT CLIMB ──────────────────────────────────
     The bots are real Member rows with real ratings and real streak columns,
     and `recordPlayed` carries their played run forward today. So the one thing
     standing between Meijin and the top of the XP leaderboard is this line. It
     is checked again in the leaderboard's own query — twice, because here is
     where it would be TRUE and there is where it would be VISIBLE. */
  if (member.botTier !== null) return refused(awards, XP_SKIP_REASONS.notAPerson, member.xp);

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

    const updated = await tx.member.update({
      where: { id: member.id },
      data: {
        xp: { increment: points },
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
          awards: paid.map(({ type, points: p }) => ({ type, points: p })),
          /* The level the toast may mention, decided here because here is where
             both totals are in hand. See `levelNote`. */
          ...(levelNote(member.xp, member.xp + points) ?? {}),
        },
      },
      select: { xp: true },
    });

    return { paid, points, xp: updated.xp };
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
    crossed: levelCrossed(written.xp - written.points, written.xp),
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
  return `${award.type} ${award.subject}`;
}

/**
 * What each award is worth after the day's allowance, and why any of them is
 * worth nothing.
 *
 * Two rules, and both are in `XP_EVENT_SPECS` rather than here:
 *
 * **A `cap` is how many events of that type a member may earn in a day.** In
 * events rather than points, because the number a reader is shown is "six games
 * a day" and not "sixty XP of games". Absent means uncapped, which is right for
 * anything that cannot be farmed — a first game of a variant happens once
 * however hard somebody tries.
 *
 * **`ridesAllowance` means the award only fires if the same game's finish was
 * paid.** One rule in one place, so a game outside the day's allowance is
 * silent as a whole rather than paying for being won but not for being
 * finished. It is never set on a first-time or a milestone award: beating
 * Guoshou for the first time on your seventh game of the day is not the thing
 * worth rationing, and telling somebody nothing happened is the failure a cap
 * exists to prevent, not to cause.
 *
 * One grouped count for the whole batch, on the `(memberId, dayKey)` index.
 */
async function withinAllowance({
  member,
  awards,
  dayKey,
}: {
  member: Recipient;
  awards: readonly XpAward[];
  dayKey: string;
}): Promise<Decided[]> {
  const capped = awards.filter((award) => XP_EVENT_SPECS[award.type].cap !== undefined);
  const earnedToday = new Map<string, number>();

  if (capped.length > 0) {
    const rows = await prisma.xpEvent.groupBy({
      by: ["type"],
      where: { memberId: member.id, dayKey, type: { in: capped.map((award) => award.type) } },
      _count: { _all: true },
    });
    for (const row of rows) earnedToday.set(row.type, row._count._all);
  }

  const decided: Decided[] = [];
  /* Whether this batch's finish was paid, for the awards that ride it. Read off
     the decisions already made rather than asked again, so the two can never
     disagree. */
  let finishPaid: boolean | null = null;

  for (const award of awards) {
    const spec = XP_EVENT_SPECS[award.type];

    if (spec.cap !== undefined && (earnedToday.get(award.type) ?? 0) >= spec.cap) {
      decided.push({ type: award.type, subject: award.subject ?? "", points: 0, skipped: XP_SKIP_REASONS.dailyAllowance });
      if (award.type === "gameFinished") finishPaid = false;
      continue;
    }

    if (spec.ridesAllowance && finishPaid === false) {
      decided.push({ type: award.type, subject: award.subject ?? "", points: 0, skipped: XP_SKIP_REASONS.dailyAllowance });
      continue;
    }

    decided.push({ type: award.type, subject: award.subject ?? "", points: xpPointsFor(award.type) });
    if (award.type === "gameFinished") finishPaid = true;
    /* Counted as this batch's own, so asking for two of a capped kind in one
       call cannot slip past a cap of one. */
    earnedToday.set(award.type, (earnedToday.get(award.type) ?? 0) + 1);
  }

  return decided;
}

/**
 * A member's total and the level it has earned, for a surface that holds neither.
 *
 * Almost nothing should need this: every list that shows a level already has the
 * `Member` row, and `xpLevelFor` turns the column into the level for free. It is
 * here for the one honest case — a writer that has just paid and wants to say
 * where somebody now stands — and deliberately not exported as a page helper.
 */
export async function xpStandingFor(memberId: string): Promise<{ xp: number; level: number }> {
  const row = await prisma.member.findUnique({ where: { id: memberId }, select: { xp: true } });
  const xp = row?.xp ?? 0;
  return { xp, level: xpLevelFor(xp) };
}

/**
 * The level a toast may mention, or nothing.
 *
 * Two cases and no third:
 *
 * - **A level was crossed.** `reached: true`, and the toast says so outright.
 * - **The award left them within one game of the next one.** `reached: false`,
 *   and the toast adds a quiet "Next level" line.
 *
 * **Not on every award**, which is the other thing the toast's interface allows.
 * A daily-visit toast carrying a progress line every single day turns a courtesy
 * that goes away on its own into a status panel following a reader round the
 * site. The nudge earns its place by being rare — and by being true:
 * `XP_ONE_MORE_GAME` is what one finished win pays, so "one more game" is
 * something a reader can go and do, where a percentage of a level's span is a
 * number nobody can act on.
 *
 * Null at the top of the ladder, where there is no next level. Not level 100
 * with `reached: false`, which would read as a level somebody is approaching
 * while already standing on it.
 */
function levelNote(before: number, after: number): { level: { level: number; reached: boolean } } | null {
  const crossed = levelCrossed(before, after);
  if (crossed !== null) return { level: { level: crossed.to, reached: true } };

  const standing = xpStanding(after);
  if (standing.span === 0) return null;
  if (standing.toNext > XP_ONE_MORE_GAME) return null;
  return { level: { level: standing.level + 1, reached: false } };
}
