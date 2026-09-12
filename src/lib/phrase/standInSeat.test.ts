import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The kitchen table: one iPad, John signed in, and his daughter taking the
 * other seat as HERSELF so the game counts in her record and on her ladder.
 *
 * The thing being tested is that claiming a seat this way is an ordinary seat
 * claim — the seat gets her member id and her name, the game stays a real game
 * between two accounts, and nothing about either person's row moves. What must
 * NOT happen is anything resembling hot seat: a hot-seat game shares one token
 * and is never rated, which is the exact opposite of the point.
 */

type Game = {
  id: string;
  variant: string;
  openSeat: string | null;
  moveCount: number;
  blackToken: string;
  whiteToken: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
  blackName: string;
  whiteName: string;
  blackClaimedAt: Date | null;
  whiteClaimedAt: Date | null;
};

let game: Game | null = null;
let updates: Record<string, unknown>[] = [];

const overLimit = vi.fn<() => Promise<{ memberId: string; count: number; limit: number } | null>>(
  async () => null,
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findUnique: async () => game,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        if (game !== null) Object.assign(game, data);
        return game;
      },
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        if (game !== null) Object.assign(game, data);
        return { count: 1 };
      },
    },
  },
}));

vi.mock("@/lib/history/activeGames", () => ({
  memberOverActiveLimit: () => overLimit(),
  activeLimitRefusal: (over: { count: number; limit: number }) =>
    `You have ${over.count} games on the go, and ${over.limit} at once is the limit here.`,
}));

const { seatStandIn } = await import("./standInSeat");

const JOHN = "j0hnjdxxxxxxxxxx";
const HANAKO = "h4n4k0jdxxxxxxxx";

/** John has black and white is still waiting for somebody. */
function boardWithFreeWhite(overrides: Partial<Game> = {}): Game {
  return {
    id: "k3m9-p2qx",
    variant: "freestyle",
    openSeat: null,
    moveCount: 0,
    blackToken: "black-token",
    whiteToken: "white-token",
    blackMemberId: JOHN,
    whiteMemberId: null,
    blackName: "John",
    whiteName: "",
    blackClaimedAt: new Date(),
    whiteClaimedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  game = boardWithFreeWhite();
  updates = [];
  overLimit.mockClear();
  overLimit.mockResolvedValue(null);
});

describe("seatStandIn", () => {
  it("seats her in the free seat and hands back that seat's own token", async () => {
    const outcome = await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(outcome).toEqual({
      ok: true,
      seat: "white",
      token: "white-token",
      variant: "freestyle",
    });
  });

  it("binds the seat to HER member id", async () => {
    await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(game?.whiteMemberId).toBe(HANAKO);
  });

  it("TAKES the seat — a posted seat stops being posted, or the game never starts", async () => {
    /*
     * The kitchen-table bug of 2026-09-12. The claim bound the member and
     * stamped the name and left `openSeat` reading "white", so the board went
     * on drawing "Posted and waiting for somebody": no players, no turn, no
     * move accepted, with both seats bound to the right two people. The
     * seat-link claim clears the column; this one had not. A claim that
     * leaves the seat open is not a claim.
     */
    if (game !== null) game.openSeat = "white";
    await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(game?.openSeat, "the seat was bound but still reads as open").toBeNull();
    expect(updates.some((update) => "openSeat" in update && update.openSeat === null), "openSeat was not part of the claim's own write").toBe(true);
  });

  it("leaves the other seat, and the whole of the other player, alone", async () => {
    await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(game?.blackMemberId).toBe(JOHN);
    expect(game?.blackName).toBe("John");
    for (const update of updates) {
      expect(Object.keys(update)).not.toContain("blackMemberId");
      expect(Object.keys(update)).not.toContain("blackName");
    }
  });

  /*
   * The name is written even though the seat already had a placeholder on it,
   * and that is the difference between this and an ordinary `bindSeat`. The
   * rating is filed against the seat's NAME — `recordResult` reads it — so a
   * seat left called "Player 2" would file her win under nobody. The seat is
   * free when this runs, so the name being overwritten is a placeholder and
   * never a person.
   */
  it("puts her name on the seat even when a placeholder was there", async () => {
    game = boardWithFreeWhite({ whiteName: "Player 2" });
    await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(game?.whiteName).toBe("Hanako M.");
  });

  it("stamps the seat as taken, so its link stops being shown", async () => {
    await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(game?.whiteClaimedAt).toBeInstanceOf(Date);
  });

  it("keeps the two tokens different — a shared token is hot seat and is never rated", async () => {
    await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(game?.blackToken).not.toBe(game?.whiteToken);
    for (const update of updates) {
      expect(Object.keys(update)).not.toContain("blackToken");
      expect(Object.keys(update)).not.toContain("whiteToken");
    }
  });

  it("never touches whether the game counts", async () => {
    await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    for (const update of updates) expect(Object.keys(update)).not.toContain("rated");
  });

  it("takes the posted seat when one is posted", async () => {
    game = boardWithFreeWhite({ openSeat: "white" });
    const outcome = await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(outcome.ok && outcome.seat).toBe("white");
  });

  it("refuses a game that is not there", async () => {
    game = null;
    expect(await seatStandIn("nope", HANAKO, "Hanako M.")).toEqual({ ok: false, reason: "no-game" });
  });

  it("refuses when both seats are already somebody's", async () => {
    game = boardWithFreeWhite({ whiteMemberId: "somebodyelsexxxx", whiteClaimedAt: new Date() });
    expect(await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.")).toEqual({
      ok: false,
      reason: "no-free-seat",
    });
  });

  it("refuses once a stone is down — a seat is not taken over mid-game", async () => {
    game = boardWithFreeWhite({ moveCount: 3 });
    expect(await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.")).toEqual({
      ok: false,
      reason: "no-free-seat",
    });
  });

  it("refuses when she already holds a seat at this board", async () => {
    game = boardWithFreeWhite({ blackMemberId: HANAKO });
    expect(await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.")).toEqual({
      ok: false,
      reason: "already-seated",
    });
  });

  it("asks which seat when both are free, rather than choosing for her", async () => {
    game = boardWithFreeWhite({ blackMemberId: null, blackClaimedAt: null });
    expect(await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.")).toEqual({
      ok: false,
      reason: "which-seat",
    });
  });

  it("takes the seat she names when both are free", async () => {
    game = boardWithFreeWhite({ blackMemberId: null, blackClaimedAt: null });
    const outcome = await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.", "black");
    expect(outcome.ok && outcome.seat).toBe("black");
    expect(game?.blackMemberId).toBe(HANAKO);
  });

  it("refuses a named seat that is not free, rather than quietly taking the other", async () => {
    const outcome = await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.", "black");
    expect(outcome).toEqual({ ok: false, reason: "no-free-seat" });
    expect(game?.whiteMemberId).toBeNull();
  });

  /*
   * Twenty boards is the limit however the twenty-first arrives, and AGENTS.md
   * is explicit that this is the check that gets left out of each new door. It
   * is asked BEFORE anything is written, because after the seat is bound there
   * is nothing left to refuse.
   */
  it("refuses a stand-in who is already at the active-game limit, and writes nothing", async () => {
    overLimit.mockResolvedValue({ memberId: HANAKO, count: 20, limit: 20 });
    const outcome = await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(outcome.ok).toBe(false);
    expect(outcome.ok === false && outcome.reason).toBe("over-limit");
    expect(updates).toEqual([]);
    expect(game?.whiteMemberId).toBeNull();
  });

  it("says how many games, so the refusal is not a bare no", async () => {
    overLimit.mockResolvedValue({ memberId: HANAKO, count: 20, limit: 20 });
    const outcome = await seatStandIn("k3m9-p2qx", HANAKO, "Hanako M.");
    expect(outcome.ok === false && outcome.said).toMatch(/20/);
  });

  it("refuses a blank name rather than seating somebody called nothing", async () => {
    expect(await seatStandIn("k3m9-p2qx", HANAKO, "   ")).toEqual({ ok: false, reason: "no-name" });
    expect(updates).toEqual([]);
  });
});
