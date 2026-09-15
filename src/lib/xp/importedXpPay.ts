import "server-only";

import type { LegacyPlayer } from "@/lib/legacy/legacyPlayers.types";
import { prisma } from "@/lib/prisma";

import { IMPORTED_XP_RULES, IMPORTED_XP_TYPES } from "./importedXp.constants";
import { importedXpFor, planImportedPay } from "./importedXp";
import type { ImportedPlan, ImportedXpReckoning, ImportedXpRules } from "./importedXp.types";
import {
  everywhereDrift,
  recipientsOf,
  type EverywhereDrift,
  type ImportedRecipient,
  type ImportedRefusal,
} from "./importedRecipients";
import { xpDayKey } from "./xpDay";

/**
 * PAYING A KEPT RECORD'S EXPERIENCE: ONCE, AND ONLY THE DIFFERENCE AFTER THAT.
 *
 * The one writer of `Member.xpImported`, as `awardXp` is the one writer of
 * `Member.xp` — and it never writes `xp`, so Itsutsu only never counts a point
 * of it. `xpEverywhere` moves by exactly what landed, in the same update.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * "ON IMPORT WE WILL CALCULATE AND ASSIGN XP"
 * ─────────────────────────────────────────────────────────────────────────
 *
 * John's words, and this is where they are kept. A kept record is imported by a
 * commit to `legacyPlayers.data.ts` (and, for a person with no account, a
 * migration making their kept-record row). There is no import at run time to
 * hook, so the import's last step is running this — `payImportedXpForEveryone`,
 * through `importedXpPay.play.test.ts` — which is safe to run after every such
 * commit: a record already paid pays nothing, a record whose figures grew pays
 * the growth, and a record that now comes to less is reported, never clawed
 * back. A future import that does run inside the site calls `payImportedXp` for
 * the one member it touched.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT DOES NOT WRITE, AND WHY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Not `xpLastAt`.** "Last earned" on the board is when somebody last earned
 * something HERE; a record from 2013 paid today would make a man who died years
 * ago look like the most active member on the site.
 *
 * **Not `xpFlash`.** A toast is for somebody who has just done something. Nobody
 * has, and the backfill clears its flashes for the same reason.
 *
 * `dayKey` is the day the payment is made, in the member's zone — it has to be
 * something, and none of these types is capped, so no allowance ever reads it.
 */

/** One member's reckoning, plan and payment. */
export type ImportedPayment = {
  memberId: string;
  reckoning: ImportedXpReckoning;
  plan: ImportedPlan;
  /** What actually landed. Zero on a dry run. */
  paid: number;
};

/**
 * Pay (or, without `write`, plan) one member's imported experience from their
 * kept records.
 *
 * The unique index on `(memberId, type, subject)` has the last word: a payment
 * the planner thought was owed and the index refuses lands nothing, and only
 * what landed moves the totals.
 */
export async function payImportedXp({
  memberId,
  legacies,
  rules = IMPORTED_XP_RULES,
  write,
  now = new Date(),
}: {
  memberId: string;
  legacies: readonly LegacyPlayer[];
  rules?: ImportedXpRules;
  write: boolean;
  now?: Date;
}): Promise<ImportedPayment> {
  const held = await prisma.xpEvent.findMany({
    where: { memberId, type: { in: [...IMPORTED_XP_TYPES] } },
    select: { type: true, subject: true, points: true },
  });
  const reckoning = importedXpFor(legacies, rules);
  const plan = planImportedPay(reckoning.claims, held);
  if (!write || plan.paying.length === 0) return { memberId, reckoning, plan, paid: 0 };

  const member = await prisma.member.findUnique({ where: { id: memberId }, select: { timeZone: true } });
  if (member === null) return { memberId, reckoning, plan, paid: 0 };
  const dayKey = xpDayKey(now, member.timeZone);

  const paid = await prisma.$transaction(async (tx) => {
    let landed = 0;
    /* One row per insert, for `awardXp`'s reason: a batch reports how many rows
       it wrote and not which, and `count === 1` is a fact. */
    for (const payment of plan.paying) {
      const inserted = await tx.xpEvent.createMany({
        data: [{ memberId, type: payment.type, points: payment.points, subject: payment.subject, dayKey }],
        skipDuplicates: true,
      });
      if (inserted.count === 1) landed += payment.points;
    }
    if (landed > 0) {
      await tx.member.update({
        where: { id: memberId },
        data: { xpImported: { increment: landed }, xpEverywhere: { increment: landed } },
      });
    }
    return landed;
    /* One insert per award over the production pooler is ~70 ms each, and a
       kept record runs to over a hundred awards: Prisma's default 5 s
       interactive-transaction timeout closed the first production pay run
       (2026-09-14) mid-way, and it rolled back whole. Give it room. */
  }, { maxWait: 15_000, timeout: 120_000 });

  return { memberId, reckoning, plan, paid };
}

/** Every member whose `xpEverywhere` is not `xp + xpImported`. One read of three columns a row. */
export async function readEverywhereDrift(): Promise<EverywhereDrift[]> {
  const members = await prisma.member.findMany({
    select: { id: true, name: true, xp: true, xpImported: true, xpEverywhere: true },
  });
  return everywhereDrift(members);
}

/**
 * RECONCILE: PUT EVERY DRIFTED EVERYWHERE TOTAL BACK TO `xp + xpImported`.
 *
 * The deploy applies the migration minutes before the code that keeps the
 * column in step goes live, and the old `awardXp` moves `xp` alone in between —
 * see `everywhereDrift`. So the payer's run repairs that before it pays.
 *
 * ONE STATEMENT, EXACTLY THOSE ROWS, FROM THEIR CURRENT VALUES. Postgres reads
 * `xp` and `xpImported` from the row as it locks it, so an award landing at the
 * same moment is either before the statement (and counted) or after it (and
 * moves both columns itself); nothing read earlier is written back over it.
 * Rows that already agree are not touched. It then reads the drift again and
 * hands back whatever is left, which the caller must see empty before it pays.
 */
export async function reconcileEverywhere(): Promise<{ repaired: number; remaining: EverywhereDrift[] }> {
  const repaired = await prisma.$executeRaw`UPDATE "Member" SET "xpEverywhere" = "xp" + "xpImported" WHERE "xpEverywhere" <> "xp" + "xpImported"`;
  return { repaired, remaining: await readEverywhereDrift() };
}

/**
 * The whole run: every member a kept record belongs to, and every record refused.
 *
 * REFUSES TO PAY WHILE ANY EVERYWHERE TOTAL HAS DRIFTED. Paying moves
 * `xpEverywhere` by increment, so a row already short would stay short by the
 * same amount after a perfectly good payment — and a total the runner cannot
 * check afterwards is the one thing it exists not to leave. With drift present
 * a writing run pays nothing and says why; the plans are still worked out, so
 * the report shows what would be paid once the drift is reconciled.
 */
export async function payImportedXpForEveryone({
  write,
  rules = IMPORTED_XP_RULES,
  now = new Date(),
}: {
  write: boolean;
  rules?: ImportedXpRules;
  now?: Date;
}): Promise<{
  recipients: ImportedRecipient[];
  refused: ImportedRefusal[];
  payments: ImportedPayment[];
  /** Every drifted Everywhere total found before paying. */
  drift: EverywhereDrift[];
  /** True when a writing run paid nothing because `drift` was not empty. */
  refusedForDrift: boolean;
}> {
  const drift = await readEverywhereDrift();
  const refusedForDrift = write && drift.length > 0;
  const members = await prisma.member.findMany({
    where: { botTier: null },
    select: { id: true, name: true, botTier: true, unclaimableBecause: true },
  });
  const { recipients, refused } = recipientsOf(members);
  const payments: ImportedPayment[] = [];
  /* One member at a time: two batches racing for one row would each have read
     the ledger the other was about to change. */
  for (const recipient of recipients) {
    payments.push(
      await payImportedXp({ memberId: recipient.memberId, legacies: recipient.legacies, rules, write: write && !refusedForDrift, now }),
    );
  }
  return { recipients, refused, payments, drift, refusedForDrift };
}
