import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext } from "./members";

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

  /**
   * Suppressing the clock while the seat is posted is only half of it. The
   * deadline stamped when the game was created stays on the row, so a post
   * left up for three days used to hand whoever answered it a deadline that
   * had expired on the first day — and the poster could take the game off
   * them before they had a second to move.
   */
  test("starts the clock when somebody finally sits down, not when the seat was posted", async ({
    request,
    browser,
    baseURL,
  }) => {
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

    const moved = await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });
    expect(moved.status()).toBe(201);

    const prisma = new PrismaClient();
    try {
      // A post nobody answered for three days. The deadline written when the
      // game was created ran out two days ago.
      const posted = new Date(Date.now() - 3 * 86_400_000);
      await prisma.game.update({
        where: { id: game.id },
        data: { lastMoveAt: posted, deadlineAt: new Date(posted.getTime() + 86_400_000) },
      });

      /*
       * Somebody else, because a seat posted for anyone is not one its poster
       * may answer — and "somebody finally sits down" means somebody, not the
       * person who put it up.
       */
      const newcomer = await memberContext(browser, baseURL ?? "http://localhost:6600", {
        email: "seat-clock-newcomer@example.test",
        name: "Seat Clock Newcomer",
      });
      const sat = await newcomer.request.post(`/api/games/${game.id}/sit`);
      expect(sat.status(), "the posted seat should still be free").toBe(200);
      await newcomer.close();

      const after = await prisma.game.findUnique({
        where: { id: game.id },
        select: { openSeat: true, deadlineAt: true },
      });
      expect(after?.openSeat, "the seat is taken").toBeNull();
      expect(
        after?.deadlineAt?.getTime() ?? 0,
        "the newcomer's deadline should be ahead of them, not two days behind",
      ).toBeGreaterThan(Date.now());

      // So the poster cannot take the game off somebody who has only just sat
      // down. Refused for being early — not for want of a clock, and not for
      // its being the poster's own turn, either of which would prove nothing.
      const claim = await request.post(`/api/games/${game.id}/timeout`, {
        data: { token: game.blackToken },
      });
      expect(claim.status()).toBe(409);
      expect((await claim.json()).reason).toBe("not-due");
    } finally {
      await prisma.$disconnect();
    }
  });
});
