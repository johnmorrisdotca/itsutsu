import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, removeMember } from "./members";
import { ready, readyHere } from "./support";
import { gamesMade, namesPlayedUnder } from "./tidy";

/**
 * A turn lost on time, as the board shows it afterwards.
 *
 * A claimed timeout used to write the missed turn as a pass, and a gomoku
 * replay refuses a pass — so the board the claimant was looking at went on
 * showing one move with White still to play, while the server held two with
 * Black to move. The claimant was told it was not their turn, and the game
 * could not go on. `liveForfeit.test.ts` holds the rule at `claimTimeout`;
 * this holds the route a player takes: their seat link, an overdue opponent,
 * a click on Claim the turn, and the board it leaves them looking at.
 *
 * IT BRINGS ITS OWN WORLD: two members made for it, one game between them
 * under names made for it, all removed after. The first stone is played
 * through the move API because it is the setting; the claim is clicked. The
 * clock is the one thing a test cannot wait for, so White's deadline is
 * planted in the past, as `days-off.spec.ts` does.
 *
 * No reload anywhere: the position after the claim is the one the page itself
 * replayed, which is the whole of what was wrong.
 */
test.describe("a turn lost on time in a live game of gomoku", () => {
  const mine = gamesMade();
  const under = namesPlayedUnder();

  test("the claimant's board shows the lost turn and their move, and the move is accepted", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const kuro = { email: `forfeit-black-${stamp}@example.test`, name: under(`Kuro${stamp} Clock`) };
    const shiro = { email: `forfeit-white-${stamp}@example.test`, name: under(`Shiro${stamp} Clock`) };
    const blackContext = await memberContext(browser, baseURL!, kuro);
    const prisma = new PrismaClient();

    try {
      const black = await blackContext.newPage();
      const started = await black.request.post("/api/games/live", {
        data: {
          variant: "freestyle",
          size: 15,
          moveTimeMs: 86_400_000,
          timeoutPenalty: "turn",
          rated: false,
          blackName: kuro.name,
          whiteName: shiro.name,
        },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
      mine(game.id);

      const first = await black.request.post(`/api/games/${game.id}/moves`, {
        data: { token: game.blackToken, row: 7, col: 7 },
      });
      expect(first.status(), await first.text()).toBe(201);

      // White's day went by yesterday.
      const yesterday = new Date(Date.now() - 86_400_000);
      await prisma.game.update({
        where: { id: game.id },
        data: { lastMoveAt: new Date(yesterday.getTime() - 86_400_000), deadlineAt: yesterday },
      });

      await black.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
      await ready(black, "shared-game");
      const board = black.getByTestId("shared-game");
      await expect(board.getByTestId("turn-banner")).toContainText("Waiting for White");

      const claim = board.getByTestId("claim-timeout");
      await readyHere(claim);
      await claim.click();
      await board.getByTestId("claim-timeout-yes").click();

      // The lost turn is on the record as what it was, and the board has moved on past it.
      await expect(board.getByTestId("live-moves")).toContainText("timed out");
      await expect(board.getByTestId("turn-banner")).toContainText("Your move — you are Black.");
      await expect(board.getByTestId("live-moves")).not.toContainText("pass");

      const stored = await prisma.move.findMany({ where: { gameId: game.id }, orderBy: { number: "asc" } });
      expect(stored.map((move) => [move.number, move.stone, move.kind])).toEqual([
        [1, "black", "place"],
        [2, "white", "forfeit"],
      ]);

      // And the game goes on: black's next stone is move three, taken, not a conflict.
      const next = await black.request.post(`/api/games/${game.id}/moves`, {
        data: { token: game.blackToken, row: 7, col: 8 },
      });
      expect(next.status(), await next.text()).toBe(201);
      const detail = (await next.json()) as { moves: { number: number }[] };
      expect(detail.moves.map((move) => move.number)).toEqual([1, 2, 3]);
    } finally {
      await prisma.$disconnect();
      await blackContext.close();
      await removeMember(kuro.email);
      await removeMember(shiro.email);
    }
  });
});
