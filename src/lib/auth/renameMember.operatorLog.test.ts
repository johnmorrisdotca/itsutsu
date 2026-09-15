import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * AN OPERATOR RENAMING A MEMBER IS KEPT, AND THE NAME IS NOT.
 *
 * The operator taking a name off — or setting one — goes into the operator log
 * in the same transaction as the rename, with a line saying which it was and
 * never either name. A member renaming themselves writes no row at all, and a
 * rename that is refused records nothing, because nothing happened.
 */

const OPERATOR = { memberId: "op1dxxxxxxxxxxxx", email: "operator@example.test" };
const HANAKO = "h4n4k0jdxxxxxxxx";

let created: Record<string, unknown>[] = [];
let transactions: unknown[][] = [];
let clash: { id: string } | null = null;
let updates = 0;

vi.mock("@/lib/prisma", () => {
  const prisma = {
    member: {
      findFirst: async () => clash,
      findUnique: async () => ({ name: "Hanako Morris" }),
      update: ({ data }: { data: { name: string } }) => {
        updates += 1;
        return Promise.resolve({ id: HANAKO, name: data.name, picture: "" });
      },
    },
    player: {
      findUnique: async () => null,
      updateMany: async () => ({ count: 0 }),
    },
    playerVariantRating: { updateMany: async () => ({ count: 0 }) },
    operatorAction: {
      create: ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return Promise.resolve(data);
      },
    },
    $transaction: async (writes: Promise<unknown>[]) => {
      transactions.push(writes);
      return Promise.all(writes);
    },
  };
  return { prisma };
});

const { renameMember } = await import("./members");

beforeEach(() => {
  created = [];
  transactions = [];
  clash = null;
  updates = 0;
});

describe("the operator renaming somebody", () => {
  it("writes the rename and its row in one transaction, saying a name was set and never which", async () => {
    const renamed = await renameMember(HANAKO, "Hanako M.", OPERATOR);
    expect(renamed).toEqual({ id: HANAKO, name: "Hanako M.", picture: "" });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toHaveLength(2);
    expect(created).toEqual([
      {
        actorMemberId: OPERATOR.memberId,
        actorEmail: OPERATOR.email,
        action: "rename",
        subjectId: HANAKO,
        detail: "name set",
      },
    ]);
    const row = JSON.stringify(created[0]);
    expect(row, "the new name reached the log").not.toContain("Hanako M.");
    expect(row, "the old name reached the log").not.toContain("Morris");
  });

  it("says a name was taken off when the operator clears it", async () => {
    await renameMember(HANAKO, "", OPERATOR);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ action: "rename", detail: "name taken off" });
  });
});

describe("a rename that is not the operator's, or not made", () => {
  it("writes no row when a member renames themselves", async () => {
    expect(await renameMember(HANAKO, "Hanako M.")).not.toBeNull();
    expect(updates).toBe(1);
    expect(transactions).toHaveLength(0);
    expect(created).toHaveLength(0);
  });

  it("records nothing when the name is refused", async () => {
    clash = { id: "somebodyelsexxxx" };
    expect(await renameMember(HANAKO, "Taken Name", OPERATOR)).toBeNull();
    expect(updates).toBe(0);
    expect(created).toHaveLength(0);
  });
});
