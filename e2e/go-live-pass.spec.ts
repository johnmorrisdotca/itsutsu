import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { gamesMade, namesPlayedUnder } from "./tidy";
import { ready } from "./support";

/**
 * Two people end a live game of Go by passing, each from their own browser.
 *
 * A pass in Go is a choice, not something the position forces, and the server
 * used to accept only the forced kind — so the Pass button on a live Go board
 * was a control that always failed, and a game between people could never end
 * by two passes. `livePass.test.ts` holds the rule at `appendMove`; this holds
 * the route a player actually takes: a seat link, the board it lands on, and a
 * click on Pass.
 *
 * IT BRINGS ITS OWN WORLD: two members nobody else has met, one game between
 * them, and names that go with it. The stones before the passes are played
 * through the move API with each seat's own token, because they are the
 * setting and not the subject; both passes are clicked.
 */
test.describe("passing in a live game of Go", () => {
  const mine = gamesMade();
  const under = namesPlayedUnder();

  test("each player clicks Pass, and the second pass ends the game and files it", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const kuro = { email: `go-pass-black-${stamp}@example.test`, name: under(`Kuro${stamp} Pass`) };
    const shiro = { email: `go-pass-white-${stamp}@example.test`, name: under(`Shiro${stamp} Pass`) };
    const blackContext = await memberContext(browser, baseURL!, kuro);
    const whiteContext = await memberContext(browser, baseURL!, shiro);

    try {
      const black = await blackContext.newPage();
      const white = await whiteContext.newPage();

      const started = await black.request.post("/api/games/live", {
        data: { variant: "go", size: 9, moveTimeMs: null, rated: false, blackName: kuro.name, whiteName: shiro.name },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
      mine(game.id);
      expect(game.whiteToken, "a private game hands back the link to send").toBeTruthy();

      // Two stones each, far apart: an ordinary position with black to move.
      const opening: ["black" | "white", number, number][] = [
        ["black", 2, 2],
        ["white", 6, 6],
        ["black", 2, 6],
        ["white", 6, 2],
      ];
      for (const [seat, row, col] of opening) {
        const request = seat === "black" ? black.request : white.request;
        const token = seat === "black" ? game.blackToken : game.whiteToken;
        const played = await request.post(`/api/games/${game.id}/moves`, { data: { token, row, col } });
        expect(played.status(), await played.text()).toBe(201);
      }

      // Black follows their own seat link to the board and passes.
      await black.goto(`/games/go/match/${game.id}/seat/${game.blackToken}`);
      await ready(black, "shared-game");
      const blackBoard = black.getByTestId("shared-game");
      // White's second stone, (6, 2), named as the board names it: rows count from the top.
      await expect(blackBoard.getByTestId("live-moves")).toContainText("C3");
      const blackPass = blackBoard.getByRole("button", { name: "Pass", exact: true });
      await expect(blackPass).toBeEnabled();
      await blackPass.click();
      await expect(blackBoard.getByTestId("live-moves")).toContainText("pass");
      await expect(blackBoard.getByTestId("turn-banner")).not.toContainText("wins");
      // The pass handed the turn over rather than being refused: nothing to press now.
      await expect(blackPass).toBeDisabled();

      // White follows theirs, and passes back. Two in a row end it by count.
      await white.goto(`/games/go/match/${game.id}/seat/${game.whiteToken}`);
      await ready(white, "shared-game");
      const whiteBoard = white.getByTestId("shared-game");
      await expect(whiteBoard.getByTestId("live-moves")).toContainText("pass");
      const whitePass = whiteBoard.getByRole("button", { name: "Pass", exact: true });
      await expect(whitePass).toBeEnabled();
      await whitePass.click();
      await expect(whiteBoard.getByTestId("turn-banner")).toContainText("wins");

      // Filed: the row says finished, with a winner, and the record ends on two passes.
      const filed = await white.request.get(`/api/games/${game.id}`);
      expect(filed.status()).toBe(200);
      const detail = (await filed.json()) as { status: string; winner: string | null; moves: { kind: string }[] };
      expect(detail.status).toBe("finished");
      expect(["black", "white"]).toContain(detail.winner);
      expect(detail.moves.slice(-2).map((move) => move.kind)).toEqual(["pass", "pass"]);

      // And black, still on the board they passed from, is told without reloading.
      await expect(blackBoard.getByTestId("turn-banner")).toContainText("wins", { timeout: 30_000 });
    } finally {
      await blackContext.close();
      await whiteContext.close();
      await removeMember(kuro.email);
      await removeMember(shiro.email);
    }
  });
});
