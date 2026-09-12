/**
 * Pays the XP nobody was paid, once, by replaying history through `awardXp`.
 *
 * Production holds about 116 finished games and four real people, and every one
 * of them stood at nought until 0.162.0 started paying. `XP_DESIGN.md` deferred
 * the backfill rather than refusing it — "the idempotent subject makes the
 * replay safe and repeatable whenever somebody wants it, so this is a deferral
 * rather than a refusal" — and this is the run it was deferring.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT IS A REPLAY, NOT A SUM
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `firstOfVariant`, `firstOfFamily`, `revengeWin` and the win streaks are
 * ORDERED facts: they depend on what had already happened when each game ended.
 * A hundred and sixteen games times a finish and a win is an afternoon and is
 * the wrong number. So every decided game is walked oldest first, both bound
 * seats, and each one's awards are decided from the history UP TO THAT GAME —
 * `backfillXp.ts` is that walk, and every rule in it is the wiring's own.
 *
 * Nothing here prices anything, and nothing here decides what a game is worth.
 * This file reads four tables, hands them over, prints what came back, and —
 * only when asked twice — pays it through `awardXp`, the same function every
 * live award goes through.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ONE CHECK THE DESIGN NAMED
 * ─────────────────────────────────────────────────────────────────────────
 *
 * "A backfill, when it happens, needs one thing this design does not yet have:
 * a check that `Member.xp` equals `sum(XpEvent.points)` for every member. That
 * is one query, it belongs in the backfill script, and it is the only way to
 * know a replay landed."
 *
 * It is asked TWICE. Before anything is written, where a disagreement means the
 * run does not happen at all: a database whose totals already disagree with
 * their own ledger is one where nothing this writes can be checked afterwards,
 * and a backfill on top of an unexplained number produces a second unexplained
 * number. And after, where a disagreement is a fault this run caused.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ASKED ONCE TO LOOK, TWICE TO WRITE
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   pnpm xp:backfill                     report only, writes nothing
 *   XP_BACKFILL_RUN=1 pnpm xp:backfill   your database
 *   XP_BACKFILL_RUN=1 pnpm xp:backfill:prod   the live site
 *
 * Two commands rather than one and a flag, for the reason AGENTS.md gives about
 * `bots:play`: the name is the warning, and forgetting something can only ever
 * leave you on your own database. It prints the host and the row counts it
 * reached before it plans anything — production and a development database are
 * not close in size, so one line settles what no amount of re-reading a command
 * line can.
 *
 * It is a `.test.ts` and runs under vitest because `@/` aliases do not resolve
 * in a plain node script, and `--disable-console-intercept` is in the pnpm
 * script because without it vitest swallows every line of the report.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SAFE TO RUN TWICE, AND THE PLAN SAYS SO BEFORE THE WRITE DOES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `XpEvent` is unique on `(memberId, type, subject)`, so a second run is
 * refused by the index. But a runner that leaned on that alone would still make
 * one query per award to be told nothing was owed, and a dry run could not tell
 * anybody whether a second run would pay. So the plan is seeded with every row
 * already in the ledger and drops a batch with nothing to pay: after a
 * successful run, the next report plans nought batches and says so.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TWO THINGS IT PUTS BACK, BECAUSE `awardXp` WRITES FOR A LIVE READER
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **`xpFlash`.** Every paid batch writes the toast the member's next page will
 * show. A replay of a few hundred batches would leave whoever it last touched
 * with a stack of toasts about games from weeks ago, and would do it to
 * everybody at once. So the flash is cleared for every member this run touched,
 * at the end, in one small update each.
 *
 * **`xpLastAt`.** `awardXp` stamps it with the `now` it was given, which here is
 * a historical moment — so a member who earned XP live this morning would be
 * left looking less recently active than they are, and the leaderboard's second
 * sort would be wrong. It is put back to the LATER of what it was and what the
 * replay left: never claiming recency a member did not have, never taking away
 * recency they did.
 *
 * What it cannot put back is `XpEvent.createdAt`, which is the column's default
 * and so says "inserted by this run". The award's own `dayKey` IS historical —
 * that is what the day's allowance and the history page group by — and
 * backdating `createdAt` would mean changing `awardXp` for a one-off, which is
 * the wrong trade. Said here because a reader of a member's history will see
 * every backfilled row arrive in one moment.
 *
 * WHAT IT COSTS. Four reads — members, decided games, the ledger, the buddy
 * list — then one `awardXp` per batch with something to pay, each of which is a
 * small read and a transaction of one insert per award. Production's 116 games
 * is a few hundred kilobytes and a few hundred small writes, the cheapest work
 * Neon does. The development database's three thousand games is the same pass,
 * slower.
 */
import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { foldEmail } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";

import { awardXp } from "./awardXp";
import { ledgerDisagreements } from "./backfillPay";
import { XP_BACKFILL_COVERAGE } from "./backfillXp.constants";
import { buddyLinkFor, planBackfill } from "./backfillXp";
import type { BackfillBuddy, LedgerDisagreement } from "./backfillXp.types";
import { XP_EVENT_SPECS } from "./xp.constants";
import type { XpEventType } from "./xp.types";

const ASKED = process.env.XP_BACKFILL === "1";
const RUN = process.env.XP_BACKFILL_RUN === "1";

/** How many members' lines a report prints before it starts summarising. */
const SHOW = 40;

const say = (line: string): void => {
  console.log(line);
};

/** The host and database, with the credentials left out. */
function server(): string {
  const url = process.env.DATABASE_URL ?? "";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "an address this runner could not read";
  }
}

/** `sum(XpEvent.points)` per member — the right-hand side of the one check. */
async function ledgerSums(): Promise<Map<string, number>> {
  const rows = await prisma.xpEvent.groupBy({ by: ["memberId"], _sum: { points: true } });
  return new Map(rows.map((row) => [row.memberId, row._sum.points ?? 0]));
}

function reportDisagreements(where: string, disagreements: readonly LedgerDisagreement[]): void {
  if (disagreements.length === 0) {
    say(`  Member.xp equals sum(XpEvent.points) for every member ${where}.`);
    return;
  }
  say(`  ! ${disagreements.length} member(s) whose total does not equal their ledger ${where}:`);
  for (const one of disagreements.slice(0, 20)) {
    say(`    ! ${one.name || one.memberId}: Member.xp ${one.xp}, ledger ${one.ledger}`);
  }
}

/** One line per award type: how many, and what they came to. */
function reportTypes(byType: ReadonlyMap<XpEventType, { events: number; points: number }>): void {
  const rows = [...byType.entries()].sort((one, two) => two[1].points - one[1].points);
  for (const [type, sum] of rows) {
    say(`    ${XP_EVENT_SPECS[type].label.padEnd(22)} ${String(sum.events).padStart(6)} × → ${sum.points} XP`);
  }
}

describe("backfilling the XP ledger", () => {
  it.runIf(ASKED)(
    "replays every decided game through awardXp, in order, and pays what history owed",
    async () => {
      const [members, games, held, buddyRows, sums] = await Promise.all([
        prisma.member.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            botTier: true,
            timeZone: true,
            createdAt: true,
            xp: true,
            xpLastAt: true,
          },
        }),
        prisma.game.findMany({
          /* Exactly the set `recordPlayed` is called for — decided, and not a
             row filed as abandoned. NOT `rated`: XP is about playing, not about
             rating, so an unrated hot-seat game pays and a rating-ineligible
             name does not stop it. The same `where` as the streak backfill. */
          where: { status: "finished", result: { not: "abandoned" } },
          /* OLDEST FIRST. See `backfillXp.ts` on `playedAt`: it is the game's
             own moment, it is what `/history` sorts by, and it is the only one
             of the row's three dates that cannot move after the fact. */
          orderBy: { playedAt: "asc" },
          select: {
            id: true,
            variant: true,
            moveCount: true,
            blackMemberId: true,
            whiteMemberId: true,
            winner: true,
            playedAt: true,
          },
        }),
        prisma.xpEvent.findMany({ select: { memberId: true, type: true, subject: true, dayKey: true } }),
        prisma.buddy.findMany({ select: { owner: true, buddy: true, createdAt: true } }),
        ledgerSums(),
      ]);

      say(`\nDatabase: ${server()}`);
      say(`  ${members.length} members (${members.filter((one) => one.botTier === null).length} of them people)`);
      say(`  ${games.length} decided games`);
      say(`  ${held.length} XP events already in the ledger, ${[...sums.values()].reduce((a, b) => a + b, 0)} XP paid`);
      say(`  ${buddyRows.length} buddy links`);

      /* ── THE CHECK, BEFORE ANYTHING ─────────────────────────────────────
         A database whose totals already disagree with their own ledger is one
         where nothing this writes can be checked afterwards. */
      const before = ledgerDisagreements(members, sums);
      reportDisagreements("before", before);

      /* The buddy list is keyed by two folded ADDRESSES and the replay is keyed
         by member id, so the folding happens here — once, from the same
         `foldEmail` the live path uses — rather than inside a pure planner. */
      const idFor = new Map<string, string>();
      for (const member of members) {
        if (member.email !== null) idFor.set(foldEmail(member.email), member.id);
      }
      const buddies = buddyRows.flatMap((row): BackfillBuddy[] => {
        const link = buddyLinkFor(row, idFor);
        return link === null ? [] : [link];
      });

      const plan = planBackfill({ members, games, buddies, held });

      say(`\nWhat the replay covers, per award:`);
      const covered = (Object.keys(XP_BACKFILL_COVERAGE) as XpEventType[]).filter(
        (type) => XP_BACKFILL_COVERAGE[type].replayed,
      );
      say(`  REPLAYED (${covered.length}): ${covered.join(", ")}`);
      for (const type of Object.keys(XP_BACKFILL_COVERAGE) as XpEventType[]) {
        const row = XP_BACKFILL_COVERAGE[type];
        if (row.replayed) continue;
        /* The two refusals are different promises and are printed as such: one
           is "the fact was never written down", the other is "it was, in a
           table this runner does not read". */
        say(`  NOT REPLAYED — ${type} (${row.recorded ? "recorded elsewhere" : "never recorded"}): ${row.why}`);
      }

      say(`\nThe plan: ${plan.batches.length} batches, ${plan.events} awards, ${plan.points} XP`);
      reportTypes(plan.byType);

      const holdsNow = new Map(members.map((one) => [one.id, one.xp]));
      const lines = [...plan.perMember.values()].sort(
        (one, two) =>
          (holdsNow.get(two.member.id) ?? 0) - (holdsNow.get(one.member.id) ?? 0) ||
          two.points - one.points,
      );
      say(`\nPer member (${lines.length} would be paid something), holders first:`);
      for (const one of lines.slice(0, SHOW)) {
        const now = holdsNow.get(one.member.id) ?? 0;
        say(
          `  ${(one.member.name || one.member.id).padEnd(24)} holds ${String(now).padStart(6)}` +
            ` + ${String(one.points).padStart(6)} (${one.events} awards) = ${now + one.points}`,
        );
      }
      if (lines.length > SHOW) {
        const rest = lines.slice(SHOW);
        say(`  … and ${rest.length} more, ${rest.reduce((sum, one) => sum + one.points, 0)} XP between them`);
      }

      if (!RUN) {
        say(`\nReport only. Nothing was written. Set XP_BACKFILL_RUN=1 to pay it.`);
        /*
         * A dry run still ASSERTS, rather than reporting green having looked at
         * nothing — and what it asserts is the half that can be wrong.
         *
         * THE LEDGER MUST ALREADY BALANCE. This is the refusal, made in the
         * report so it cannot be discovered halfway through a write.
         */
        expect(before).toEqual([]);
        /* A database with nothing in it proves nothing about this code, and a
           green run over one would be exactly the "I could not get far enough
           to look" AGENTS.md refuses to accept as a statement. */
        expect(members.length).toBeGreaterThan(0);
        expect(games.length).toBeGreaterThan(0);
        /* The plan's arithmetic, which nothing else checks: the whole is the sum
           of the members, and every award is priced at the catalogue's price. */
        expect([...plan.perMember.values()].reduce((sum, one) => sum + one.points, 0)).toBe(plan.points);
        for (const batch of plan.batches) {
          expect(batch.paying.length).toBeGreaterThan(0);
          for (const award of batch.paying) expect(award.points).toBe(XP_EVENT_SPECS[award.type].points);
        }
        return;
      }

      /* Refusing, not warning. Nothing is written onto a ledger that cannot be
         reconciled afterwards. */
      expect(before, "Member.xp already disagrees with the ledger — nothing written").toEqual([]);

      const wasLastAt = new Map(members.map((one) => [one.id, one.xpLastAt]));
      const paid = new Map<string, number>();
      let paidPoints = 0;
      let paidEvents = 0;

      for (const batch of plan.batches) {
        /*
         * THE FULL LIST OF AWARDS, AND THE HISTORICAL MOMENT.
         *
         * Everything history asked for is asked for, so the unique index and
         * the day's allowance stay the arbiters they are on the live site —
         * `backfillPay.ts` only predicted their verdict, and the comparison
         * below is what says whether the prediction was right.
         */
        const result = await awardXp({ memberId: batch.memberId, awards: batch.awards, now: batch.at });
        paid.set(batch.memberId, (paid.get(batch.memberId) ?? 0) + result.points);
        paidPoints += result.points;
        paidEvents += result.awards.filter((award) => award.points > 0).length;
      }

      say(`\nPaid ${paidPoints} XP in ${paidEvents} awards through awardXp.`);

      /*
       * PLANNED AGAINST PAID, per member. The plan restates two rules that live
       * inside `awardXp` — the day's allowance and the unique index — and this
       * is what keeps that a reconciliation rather than a second authority. A
       * disagreement is a real finding about the restatement, so it fails here
       * rather than appearing in a report somebody skims.
       */
      const off = [...plan.perMember.values()].flatMap((one) => {
        const actually = paid.get(one.member.id) ?? 0;
        return actually === one.points
          ? []
          : [`${one.member.name || one.member.id}: planned ${one.points}, paid ${actually}`];
      });
      for (const line of off) say(`  ! ${line}`);

      /* ── WHAT IS PUT BACK ───────────────────────────────────────────────
         The flash, because a replay would otherwise toast everybody about games
         from weeks ago; and `xpLastAt`, to the LATER of what it was and what the
         replay left, because a historical `now` would make a member who earned
         this morning look stale on the leaderboard. */
      const touched = [...paid.entries()].filter(([, points]) => points > 0).map(([id]) => id);
      const after = await prisma.member.findMany({
        where: { id: { in: touched } },
        select: { id: true, xpLastAt: true },
      });
      for (const row of after) {
        const was = wasLastAt.get(row.id) ?? null;
        const keep =
          was !== null && (row.xpLastAt === null || was.getTime() > row.xpLastAt.getTime()) ? was : row.xpLastAt;
        /* `Prisma.DbNull` and not `null`: the column is `Json?`, where a bare
           null is ambiguous between the JSON value and the database's own —
           which is why `clearXpFlashFor` reaches for raw SQL. This wants the
           column empty, which is `DbNull`. */
        await prisma.member.update({
          where: { id: row.id },
          data: { xpFlash: Prisma.DbNull, xpLastAt: keep },
        });
      }
      say(`  Cleared xpFlash and put xpLastAt back for ${touched.length} members.`);

      /* ── THE CHECK, AFTER ───────────────────────────────────────────────── */
      const [nowMembers, nowSums] = await Promise.all([
        prisma.member.findMany({ select: { id: true, name: true, xp: true } }),
        ledgerSums(),
      ]);
      const afterCheck = ledgerDisagreements(nowMembers, nowSums);
      reportDisagreements("after", afterCheck);

      say(`\nBefore and after, per member:`);
      const nowXp = new Map(nowMembers.map((one) => [one.id, one.xp]));
      for (const id of touched.slice(0, SHOW)) {
        const member = members.find((one) => one.id === id);
        say(
          `  ${(member?.name || id).padEnd(24)} ${String(holdsNow.get(id) ?? 0).padStart(6)}` +
            ` → ${String(nowXp.get(id) ?? 0).padStart(6)}`,
        );
      }
      if (touched.length > SHOW) say(`  … and ${touched.length - SHOW} more`);
      say(`\nRun it again: the report should plan 0 batches.`);

      expect(afterCheck, "the replay left a total disagreeing with its own ledger").toEqual([]);
      expect(off, "the plan and awardXp disagree about what was owed").toEqual([]);
      expect(paidPoints).toBe(plan.points);
    },
    3_600_000,
  );

  it("does nothing unless it is asked for by name", () => {
    /* The runner above is skipped on an ordinary `pnpm test:unit`, so this case
       is what keeps the file from reporting green having run nothing at all —
       see A Tolerant Assertion Enumerates What It TOLERATES. An ungated suite
       must never be able to write: asking to RUN without asking to look is the
       one combination that would, and it cannot happen. */
    expect(ASKED || !RUN).toBe(true);
  });
});
