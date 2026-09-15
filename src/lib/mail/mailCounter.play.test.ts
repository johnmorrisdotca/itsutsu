import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import type { MailLimit } from "./mail.types";
import { prismaMailCounter } from "./mailCounter";

/**
 * THE REAL COUNTER, ON A REAL POSTGRES — the part a fake cannot prove.
 *
 * `sendMail.test.ts` proves the module sends only after a place is taken. What
 * it cannot prove is that the SQL takes a place atomically: that two sends at
 * the last place, on two connections, cannot both get it. That needs a
 * database, which `pnpm test:unit` does not have, so this runs only when asked:
 *
 *   MAIL_COUNTER_DB=1 pnpm exec vitest run src/lib/mail/mailCounter.play.test.ts
 *
 * against a database of your own. It refuses anything that is not on this
 * machine, writes only keys under its own prefix, and deletes them after.
 */
const RUN = process.env.MAIL_COUNTER_DB === "1";
const PREFIX = `test:mail-counter:${Date.now()}:`;

function limit(name: string, cap: number): MailLimit {
  return { key: `${PREFIX}${name}`, cap, refusal: "site-day-cap" };
}

async function countOf(key: string): Promise<number | undefined> {
  return (await prisma.emailSendCount.findUnique({ where: { key } }))?.count;
}

describe.runIf(RUN)("the send counter on a real database", () => {
  beforeAll(() => {
    const host = new URL(process.env.DATABASE_URL ?? "postgresql://missing").hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      throw new Error(`Refusing to run against ${host}: this writes rows, and belongs on a database of your own.`);
    }
  });

  afterAll(async () => {
    await prisma.emailSendCount.deleteMany({ where: { key: { startsWith: PREFIX } } });
    await prisma.$disconnect();
  });

  it("lets exactly one of two simultaneous sends take the last place", async () => {
    const last = limit("last-place", 2);
    expect(await prismaMailCounter.reserve([last])).toBeNull();
    expect(await countOf(last.key)).toBe(1);

    const answers = await Promise.all([prismaMailCounter.reserve([last]), prismaMailCounter.reserve([last])]);

    expect(answers.filter((answer) => answer === null)).toHaveLength(1);
    expect(answers.filter((answer) => answer === "site-day-cap")).toHaveLength(1);
    expect(await countOf(last.key)).toBe(2);
  });

  it("lets exactly the cap through when many arrive at once", async () => {
    const crowd = limit("crowd", 10);
    const answers = await Promise.all(Array.from({ length: 25 }, () => prismaMailCounter.reserve([crowd])));
    expect(answers.filter((answer) => answer === null)).toHaveLength(10);
    expect(await countOf(crowd.key)).toBe(10);
  });

  it("moves no counter when a later one is full", async () => {
    const member: MailLimit = { ...limit("member", 5), refusal: "member-day-cap" };
    const month: MailLimit = { ...limit("month", 1), refusal: "site-month-cap" };
    expect(await prismaMailCounter.reserve([month])).toBeNull();

    expect(await prismaMailCounter.reserve([member, month])).toBe("site-month-cap");
    expect(await countOf(member.key)).toBeUndefined();
    expect(await countOf(month.key)).toBe(1);
  });

  it("refuses a cap below one without writing", async () => {
    const shut = limit("shut", 0);
    expect(await prismaMailCounter.reserve([shut])).toBe("site-day-cap");
    expect(await countOf(shut.key)).toBeUndefined();
  });
});
