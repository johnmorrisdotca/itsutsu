/**
 * Pays every kept record's imported experience, once — asked once to look,
 * twice to write, the backfill's shape.
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
 * THE CHECK, BEFORE AND AFTER. `xp` equals the Itsutsu rows, `xpImported`
 * equals the imported rows, and `xpEverywhere` equals the two. Before: a
 * database already disagreeing is refused, since nothing written on top of it
 * could be checked. After: a disagreement is a fault this run made.
 *
 * It is a `.test.ts` for the backfill's reason: `@/` aliases resolve only under
 * vitest, and `--disable-console-intercept` keeps the report visible.
 */
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";

import { IMPORTED_XP_SETTING, IMPORTED_XP_TYPES } from "./importedXp.constants";
import { payImportedXpForEveryone } from "./importedXpPay";
import { totalsDisagreements } from "./importedRecipients";
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

async function checks(): Promise<string[]> {
  const imported = [...IMPORTED_XP_TYPES];
  const [members, itsutsuRows, importedRows] = await Promise.all([
    prisma.member.findMany({ select: { id: true, name: true, xp: true, xpImported: true, xpEverywhere: true } }),
    prisma.xpEvent.groupBy({ by: ["memberId"], where: { type: { notIn: imported } }, _sum: { points: true } }),
    prisma.xpEvent.groupBy({ by: ["memberId"], where: { type: { in: imported } }, _sum: { points: true } }),
  ]);
  const sums = (rows: typeof itsutsuRows) => new Map(rows.map((row) => [row.memberId, row._sum.points ?? 0]));
  return totalsDisagreements(members, sums(itsutsuRows), sums(importedRows));
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

describe("paying imported experience", () => {
  it.runIf(ASKED)("pays every kept record what the approved setting says, once", async () => {
    const [members, kept, rows] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { unclaimableBecause: "kept-record" } }),
      prisma.xpEvent.count({ where: { type: { in: [...IMPORTED_XP_TYPES] } } }),
    ]);
    say(`\nDatabase: ${server()}`);
    say(`  ${members} members, ${kept} of them kept-record rows; ${rows} imported rows already on the ledger`);
    say(`  Setting: ${IMPORTED_XP_SETTING}`);

    const before = await checks();
    say(before.length === 0 ? "  Totals agree with the ledger before." : `  ! ${before.length} disagreement(s) before:`);
    for (const line of before.slice(0, 20)) say(`    ! ${line}`);
    expect(before, "the totals already disagree with the ledger — nothing written").toEqual([]);

    const run = await payImportedXpForEveryone({ write: RUN });

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
      say("\nReport only. Nothing was written. Set XP_IMPORTED_RUN=1 to pay it.");
      return;
    }

    const after = await checks();
    say(after.length === 0 ? "\n  Totals agree with the ledger after." : `\n  ! ${after.length} disagreement(s) after:`);
    for (const line of after.slice(0, 20)) say(`    ! ${line}`);
    say("\nThe board now:");
    await board();
    say("\nRun it again: every record should have nothing to pay.");
    expect(after, "the run left a total disagreeing with its ledger").toEqual([]);
    for (const payment of run.payments) expect(payment.paid).toBe(payment.plan.points);
  }, 600_000);

  it("never writes unless asked to look as well", () => {
    expect(ASKED || !RUN).toBe(true);
  });
});
