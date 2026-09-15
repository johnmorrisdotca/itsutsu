import "server-only";

import { prisma } from "@/lib/prisma";
import type { CapRefusal, MailCounter, MailLimit } from "./mail.types";

/** Thrown inside the transaction to roll back every counter it already moved. */
class CounterFull extends Error {
  refusal: CapRefusal;

  constructor(refusal: CapRefusal) {
    super(refusal);
    this.refusal = refusal;
  }
}

/**
 * Moves one counter up by one, but only while it is under its cap, in ONE
 * statement. Answers whether it moved.
 *
 * Never a read followed by a write: two sends that both read 49 of 50 would
 * both write 50. Here the second one waits on the row the first has locked,
 * re-checks `count < cap` against what the first committed, and moves nothing.
 * A first send of the period inserts the row at one.
 */
async function moveUnderCap(
  tx: Pick<typeof prisma, "$queryRaw">,
  limit: MailLimit,
): Promise<boolean> {
  const moved = await tx.$queryRaw<{ count: number }[]>`
    INSERT INTO "EmailSendCount" ("key", "count", "updatedAt")
    VALUES (${limit.key}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO UPDATE
      SET "count" = "EmailSendCount"."count" + 1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "EmailSendCount"."count" < ${limit.cap}
    RETURNING "count"`;
  return moved.length > 0;
}

/**
 * The counter every real send goes through: all of the limits move, or none.
 *
 * One transaction, so a send refused by the month does not leave the day and
 * the member counted for an email that never went.
 */
export const prismaMailCounter: MailCounter = {
  async reserve(limits: readonly MailLimit[]): Promise<CapRefusal | null> {
    // A cap below one would let the INSERT branch count a first send it should refuse.
    const closed = limits.find((limit) => !(limit.cap >= 1));
    if (closed !== undefined) return closed.refusal;

    try {
      await prisma.$transaction(async (tx) => {
        for (const limit of limits) {
          if (!(await moveUnderCap(tx, limit))) throw new CounterFull(limit.refusal);
        }
      });
      return null;
    } catch (error) {
      if (error instanceof CounterFull) return error.refusal;
      throw error;
    }
  },
};
