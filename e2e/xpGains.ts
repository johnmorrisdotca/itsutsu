import { PrismaClient } from "@prisma/client";

import { xpDayKey } from "../src/lib/xp/xpDay";

/**
 * LEDGER ROWS FOR A SPEC'S OWN MEMBER, ON DAYS COUNTED FROM TODAY.
 *
 * For the XP board's Today and 7 days, which read the ledger rather than the
 * member row — so a member seeded with a total alone gained nothing, and a spec
 * about gains has to write the awards it will read back. The days are the
 * member's own, and `seedXpMember` gives no zone, so they are UTC days: the
 * same `xpDayKey(now, "")` the board reads with.
 *
 * `XpEvent.memberId` carries no relation, so deleting a member leaves its
 * awards behind; `removeLedgerFor` takes them first.
 */

let loaded = false;

function client(): PrismaClient {
  if (!loaded) {
    // The dev server reads .env itself; this process has to be told.
    process.loadEnvFile(".env");
    loaded = true;
  }
  return new PrismaClient();
}

/** The UTC day `days` before today, as a day key. */
export function dayKeyDaysAgo(days: number): string {
  const today = new Date(`${xpDayKey(new Date(), "")}T00:00:00Z`);
  today.setUTCDate(today.getUTCDate() - days);
  return today.toISOString().slice(0, 10);
}

export type SeededAward = { type: string; points: number; subject: string; daysAgo: number };

export async function seedLedgerFor(memberId: string, awards: readonly SeededAward[]): Promise<void> {
  const prisma = client();
  try {
    await prisma.xpEvent.createMany({
      data: awards.map((award) => ({
        memberId,
        type: award.type,
        points: award.points,
        subject: award.subject,
        dayKey: dayKeyDaysAgo(award.daysAgo),
        createdAt: new Date(Date.now() - award.daysAgo * 86_400_000),
      })),
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function removeLedgerFor(memberIds: readonly string[]): Promise<void> {
  if (memberIds.length === 0) return;
  const prisma = client();
  try {
    await prisma.xpEvent.deleteMany({ where: { memberId: { in: [...memberIds] } } });
  } finally {
    await prisma.$disconnect();
  }
}
