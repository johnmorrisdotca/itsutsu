import { describe, expect, it } from "vitest";

/**
 * Which codes an operator must be able to see.
 *
 * The listing used to be the newest fifty of everything, so an operator who
 * had issued fifty-one could neither see nor revoke the first. Revoking is
 * the only way to shut a code that never expires and has unlimited uses, so a
 * list that hides one is the difference between being able to close the site
 * and not.
 *
 * The rule is tested here as a rule, on plain rows, because the query that
 * implements it needs a database and this does not — and the thing worth
 * holding is which codes still admit somebody, not how they were fetched.
 */

type Row = {
  code: string;
  revoked: boolean;
  expiresAt: Date | null;
  maxUses: number;
  uses: number;
};

/** Exactly the condition `listInviteCodes` refuses to truncate. */
function canStillAdmit(row: Row, now = new Date()): boolean {
  if (row.revoked) return false;
  if (row.expiresAt !== null && row.expiresAt.getTime() <= now.getTime()) return false;
  return row.maxUses === 0 || row.uses < row.maxUses;
}

const base: Row = { code: "a", revoked: false, expiresAt: null, maxUses: 0, uses: 0 };

describe("a code that can still let somebody in", () => {
  it("counts one that never expires and has unlimited uses", () => {
    // The dangerous one, and the one the old listing could hide.
    expect(canStillAdmit(base)).toBe(true);
  });

  it("counts one with uses left", () => {
    expect(canStillAdmit({ ...base, maxUses: 5, uses: 4 })).toBe(true);
  });

  it("does not count one that is used up", () => {
    expect(canStillAdmit({ ...base, maxUses: 5, uses: 5 })).toBe(false);
    expect(canStillAdmit({ ...base, maxUses: 1, uses: 3 })).toBe(false);
  });

  it("does not count one that is revoked, whatever else is true of it", () => {
    // Revoking beats every other field; that is what the column is for.
    expect(canStillAdmit({ ...base, revoked: true })).toBe(false);
  });

  it("does not count one that has expired, and does count one that has not", () => {
    const hour = 3_600_000;
    const now = new Date();
    expect(canStillAdmit({ ...base, expiresAt: new Date(now.getTime() - hour) }, now)).toBe(false);
    expect(canStillAdmit({ ...base, expiresAt: new Date(now.getTime() + hour) }, now)).toBe(true);
  });

  it("treats the moment of expiry as expired", () => {
    const now = new Date();
    expect(canStillAdmit({ ...base, expiresAt: now }, now)).toBe(false);
  });
});
