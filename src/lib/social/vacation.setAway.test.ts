import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * WHICH ROW `setAway` WRITES.
 *
 * The profile form sends its away dates on every save, cleared or not, so this
 * runs on every profile save anybody makes. It was re-keyed to take a member id —
 * a member who came in with an invite code has no address — and it READ the row by
 * id but still WROTE it `where: { email }`, with the id in the address's place. The
 * write matched nobody, Prisma threw, and every profile save on the site answered
 * 500: country, days off, how long finished games are kept, the zone. Nothing here
 * was checking which key the write used, which is the whole of this file.
 */

const { updates, row } = vi.hoisted(() => ({
  updates: [] as { where: unknown; data: Record<string, unknown> }[],
  row: {
    awayFrom: null as Date | null,
    awayUntil: null as Date | null,
    awayDaysUsed: 0,
    awayYear: new Date().getUTCFullYear(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findUnique: vi.fn(async () => ({ ...row })),
      update: vi.fn(async (args: { where: unknown; data: Record<string, unknown> }) => {
        updates.push(args);
        return {};
      }),
    },
  },
}));

import { setAway } from "./vacation";

describe("setAway writes the member it was handed", () => {
  beforeEach(() => {
    updates.length = 0;
  });

  it("clears an away range by member id", async () => {
    const outcome = await setAway("member-1", null, null);
    expect(outcome.ok).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0].where).toEqual({ id: "member-1" });
  });

  it("sets an away range by member id", async () => {
    const from = new Date("2026-10-01T00:00:00.000Z");
    const until = new Date("2026-10-03T00:00:00.000Z");
    const outcome = await setAway("member-1", from, until);
    expect(outcome.ok).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0].where).toEqual({ id: "member-1" });
  });
});
