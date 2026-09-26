import { describe, expect, it, vi } from "vitest";

/*
 * Any query at all fails these tests: a table with nobody on it must be
 * answered without asking the database.
 */
const queryRaw = vi.fn(() => {
  throw new Error("asked the database about nobody");
});
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: queryRaw } }));

const { ipByGameOf, ipTotalsOf } = await import("./ipBoards");

describe("the IP of a table with nobody on it", () => {
  /*
   * An empty ladder is common: most games have nobody on one yet. The member
   * list used to be built before it was checked, and `Prisma.join` throws on an
   * empty list, so every empty table's page failed to render.
   */
  it("is an empty answer, and asks nothing", async () => {
    await expect(ipTotalsOf([])).resolves.toEqual(new Map());
    await expect(ipByGameOf([])).resolves.toEqual(new Map());
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
