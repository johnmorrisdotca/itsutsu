import "server-only";

import { prisma } from "@/lib/prisma";

import { XP_EVENT_SPECS, xpPointsFor } from "./xp.constants";
import { XP_SKIP_REASONS, type XpAward } from "./xp.types";
import type { Decided, Recipient } from "./awardXp.types";

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
export async function withinAllowance({
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
