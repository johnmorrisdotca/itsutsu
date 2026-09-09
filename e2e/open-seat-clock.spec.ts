import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * A seat nobody is sitting in cannot be late.
 *
 * A game posted for anyone to take was showing "White must move by … ·
 * overdue" beside "Waiting for White", with a live button to claim the turn
 * — against a White who did not exist yet. The nonsense on screen was the
 * half John saw; the half worth testing is that the claim could actually
 * succeed and file a result against an empty chair.
 */
test.describe("a game still waiting for somebody to sit down", () => {
  test("refuses a timeout claim against the empty seat", async ({ request }) => {
    const started = await request.post("/api/games/live", {
      data: {
        blackName: "Poster",
        whiteName: "",
        size: 9,
        moveTimeMs: 86_400_000,
        open: true,
      },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };

    // Black plays, so the board is waiting on White — the seat nobody has
    // taken. Without a move it is Black's own turn and the claim is refused
    // for a different reason entirely, which would prove nothing.
    const moved = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(moved.status()).toBe(201);

    const prisma = new PrismaClient();
    try {
      const posted = await prisma.game.findUnique({
        where: { id: game.id },
        select: { openSeat: true },
      });
      expect(posted?.openSeat, "the white seat should be posted").toBe("white");

      // A deadline long gone. Nobody has taken the seat it would run against.
      const gone = new Date(Date.now() - 3_600_000);
      await prisma.game.update({
        where: { id: game.id },
        data: { lastMoveAt: new Date(gone.getTime() - 86_400_000), deadlineAt: gone },
      });

      const claim = await request.post(`/api/games/${game.id}/timeout`, {
        data: { token: game.blackToken },
      });
      expect(claim.status(), "an empty seat cannot run out of time").not.toBe(200);

      // And the game is untouched: no result filed against nobody.
      const after = await prisma.game.findUnique({
        where: { id: game.id },
        select: { status: true, winner: true, result: true },
      });
      expect(after?.status).toBe("active");
      expect(after?.winner).toBeNull();
    } finally {
      await prisma.$disconnect();
    }
  });
});
