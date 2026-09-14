/**
 * Reconciles every drifted Everywhere total, then pays every kept record's
 * imported experience, once — asked once to look, twice to write, the
 * backfill's shape.
 *
 *   XP_IMPORTED=1 pnpm exec vitest run src/lib/xp/importedXpPay.play.test.ts --disable-console-intercept
 *   XP_IMPORTED=1 XP_IMPORTED_RUN=1 pnpm exec vitest run src/lib/xp/importedXpPay.play.test.ts --disable-console-intercept
 *   node scripts/xp-imported-prod.mjs          (production, report only)
 *   XP_IMPORTED_RUN=1 node scripts/xp-imported-prod.mjs   (production — John's word first, and a Neon branch)
 *
 * It prints the host and the row counts before it plans anything, because
 * production and a development database are not close in size and one line
 * settles which one it reached.
 *
 * THREE STEPS, IN THIS ORDER, AND ONE AUTHORISED RUN COVERS ALL THREE.
 *
 * 1. THE LEDGER CHECK. `xp` equals the Itsutsu rows and `xpImported` equals the
 *    imported rows. A database that disagrees here is refused outright: the
 *    ledger is the record, and nothing written on top of an unexplained total
 *    could be checked afterwards.
 * 2. RECONCILE. Every member whose `xpEverywhere` is not `xp + xpImported` is
 *    listed with both figures. The deploy applies the migration minutes before
 *    the code that keeps that column in step goes live, and the old `awardXp`
 *    moves `xp` alone in between — see `everywhereDrift`. Report only by
 *    default; with RUN the drifted rows are set back from their own current
 *    values, the drift is read again, and nothing is paid while any remains.
 * 3. PAY, and check all three totals again after.
 *
 * It is a `.test.ts` for the backfill's reason: `@/` aliases resolve only under
 * vitest, and `--disable-console-intercept` keeps the report visible.
 */
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";

import { IMPORTED_XP_SETTING, IMPORTED_XP_TYPES } from "./importedXp.constants";
import { payImportedXpForEveryone, readEverywhereDrift, reconcileEverywhere } from "./importedXpPay";
import { ledgerTotalsDisagreements, totalsDisagreements, type TotalsRow } from "./importedRecipients";
import { xpLevelName } from "./levelNames";
import { xpLevelFor } from "./xpCurve";

const ASKED = process.env.XP_IMPORTED === "1";
const RUN = process.env.XP_IMPORTED_RUN === "1";

const say = (line: string): void => {
  console.log(line);
};
const n = (value: number): string => value.toLocaleString("en-GB");

function server(): string {
  try {
    const parsed = new URL(process.env.DATABASE_URL ?? "");
    return `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
  } catch {
    return "an address this runner could not read";
  }
}

/** The members and both ledger sums, for either check. */
async function totals(): Promise<{ members: TotalsRow[]; itsutsu: Map<string, number>; imported: Map<string, number> }> {
  const types = [...IMPORTED_XP_TYPES];
  const [members, itsutsuRows, importedRows] = await Promise.all([
    prisma.member.findMany({ select: { id: true, name: true, xp: true, xpImported: true, xpEverywhere: true } }),
    prisma.xpEvent.groupBy({ by: ["memberId"], where: { type: { notIn: types } }, _sum: { points: true } }),
    prisma.xpEvent.groupBy({ by: ["memberId"], where: { type: { in: types } }, _sum: { points: true } }),
  ]);
  const sums = (rows: typeof itsutsuRows) => new Map(rows.map((row) => [row.memberId, row._sum.points ?? 0]));
  return { members, itsutsu: sums(itsutsuRows), imported: sums(importedRows) };
}

async function board(): Promise<void> {
  for (const [label, column] of [["Everywhere", "xpEverywhere"], ["Itsutsu only", "xp"]] as const) {
    const rows = await prisma.member.findMany({
      where: { [column]: { gt: 0 } },
      orderBy: [{ [column]: "desc" }, { id: "asc" }],
      take: 5,
      select: { name: true, xp: true, xpImported: true, xpEverywhere: true },
    });
    say(`  ${label}:`);
    rows.forEach((row, index) => {
      const total = row[column];
      say(`    ${index + 1}. ${row.name.padEnd(16)} ${n(total).padStart(10)}  Lv ${xpLevelFor(total)} · ${xpLevelName(xpLevelFor(total))}${column === "xpEverywhere" && row.xpImported > 0 ? `  (includes ${n(row.xpImported)} imported)` : ""}`);
    });
  }
}

describe("reconciling and paying imported experience", () => {
  it.runIf(ASKED)("repairs drifted Everywhere totals, then pays every kept record what the approved setting says, once", async () => {
    const [members, kept, rows] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { unclaimableBecause: "kept-record" } }),
      prisma.xpEvent.count({ where: { type: { in: [...IMPORTED_XP_TYPES] } } }),
    ]);
    say(`\nDatabase: ${server()}`);
    say(`  ${members} members, ${kept} of them kept-record rows; ${rows} imported rows already on the ledger`);
    say(`  Setting: ${IMPORTED_XP_SETTING}`);

    /* ── 1. THE LEDGER CHECK ─────────────────────────────────────────────── */
    const before = await totals();
    const ledger = ledgerTotalsDisagreements(before.members, before.itsutsu, before.imported);
    say(ledger.length === 0 ? "  xp and xpImported agree with the ledger." : `  ! ${ledger.length} ledger disagreement(s):`);
    for (const line of ledger.slice(0, 20)) say(`    ! ${line}`);
    expect(ledger, "a total disagrees with its own ledger — nothing reconciled, nothing paid").toEqual([]);

    /* ── 2. RECONCILE ─────────────────────────────────────────────────────── */
    const drift = await readEverywhereDrift();
    say(`\nReconcile: ${drift.length} member(s) whose xpEverywhere is not xp + xpImported.`);
    for (const one of drift.slice(0, 40)) say(`  ${one.name.padEnd(24)} xpEverywhere ${n(one.xpEverywhere)}, should be ${n(one.should)}`);
    if (drift.length > 40) say(`  … and ${drift.length - 40} more`);
    if (drift.length > 0 && !RUN) say("  Report only: nothing repaired. With XP_IMPORTED_RUN=1 these are set back first.");
    if (drift.length > 0 && RUN) {
      const { repaired, remaining } = await reconcileEverywhere();
      say(`  Repaired ${repaired} row(s); ${remaining.length} still disagree.`);
      for (const one of remaining.slice(0, 20)) say(`    ! ${one.name}: xpEverywhere ${n(one.xpEverywhere)}, should be ${n(one.should)}`);
      expect(remaining, "Everywhere totals still disagree after reconciling — nothing paid").toEqual([]);
    }

    /* ── 3. PAY ───────────────────────────────────────────────────────────── */
    const run = await payImportedXpForEveryone({ write: RUN });
    if (run.refusedForDrift) say("  ! Paying refused: an Everywhere total drifted again between reconciling and paying.");

    for (const refusal of run.refused) say(`  REFUSED ${refusal.legacy} (${refusal.memberIds.join(", ")}): ${refusal.why}`);
    for (const payment of run.payments) {
      const recipient = run.recipients.find((one) => one.memberId === payment.memberId);
      say(
        `\n  ${recipient?.name ?? payment.memberId}: record comes to ${n(payment.reckoning.total)};` +
          ` ${RUN ? "paid" : "would pay"} ${n(RUN ? payment.paid : payment.plan.points)} in ${payment.plan.paying.length} rows;` +
          ` ${payment.plan.skipped.length} claims already settled`,
      );
      for (const unknown of payment.reckoning.unknownClasses) say(`    ! ${unknown.site} class ${unknown.className} priced as nothing`);
      for (const skip of payment.plan.skipped.filter((one) => one.reason !== "already-paid")) {
        say(`    ! ${skip.type} at ${skip.stake}: paid ${n(skip.paid)}, now comes to ${n(skip.target)} — ${skip.reason}`);
      }
    }

    if (!RUN) {
      say("\nReport only. Nothing was written. Set XP_IMPORTED_RUN=1 to reconcile and pay.");
      return;
    }

    expect(run.refusedForDrift, "paying was refused for drift").toBe(false);
    const after = await totals();
    const problems = totalsDisagreements(after.members, after.itsutsu, after.imported);
    say(problems.length === 0 ? "\n  All three totals agree with the ledger after." : `\n  ! ${problems.length} disagreement(s) after:`);
    for (const line of problems.slice(0, 20)) say(`    ! ${line}`);
    say("\nThe board now:");
    await board();
    say("\nRun it again: nothing to reconcile and every record should have nothing to pay.");
    expect(problems, "the run left a total disagreeing with its ledger").toEqual([]);
    for (const payment of run.payments) expect(payment.paid).toBe(payment.plan.points);
  }, 600_000);

  it("never writes unless asked to look as well", () => {
    expect(ASKED || !RUN).toBe(true);
  });
});
