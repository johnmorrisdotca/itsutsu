import { expect, test, type Page } from "@playwright/test";

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

      /*
       * HELD, BECAUSE THE RESULT BANNER LIVES FOR A MOMENT — on both boards.
       *
       * A board that sees its game end hands itself back to the server at once
       * (`useLiveGame`), and what comes back is the filed record, which has no
       * turn banner. So "wins" is on each board only between the answer that
       * settles it and that hand-back landing: about half a second in CI's
       * traces, shorter than Playwright's one-second retry step.
       *
       * This spec used to wait for black's banner with nothing held, and it was
       * read as waiting out a thirty-second background poll. It was not: black's
       * page read `visible` and asked every two and a half seconds. It failed
       * both attempts at 0.184.0 and 5 of 5 on a dev server because black's page
       * had already BECOME the record — the banner came and went between two
       * retries, and the rest of the wait was spent on a page with no banner.
       *
       * The same hold as `shared.spec.ts`, on a wider address: a board that has
       * had a move land since it loaded hands back from /match/<id>/<n>, not
       * /match/<id>. Released once the settled board has been read.
       */
      const handBack = new RegExp(`/match/${game.id}(/\\d+)?\\?_rsc=`);
      const holdHandBack = async (page: Page) => {
        let letGo = () => {};
        const read = new Promise<void>((resolve) => (letGo = resolve));
        await page.route(handBack, async (route) => {
          await read;
          await route.continue();
        });
        return async () => {
          const landed = page.waitForResponse(handBack);
          letGo();
          await landed;
          await page.unroute(handBack);
        };
      };
      const releaseWhite = await holdHandBack(white);
      const releaseBlack = await holdHandBack(black);

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

      // Then both hand-backs are let through, and each board becomes the record of
      // the game at the address of its last position. Whether that happens without
      // a reload is `settled-in-place.spec.ts`'s question.
      await releaseWhite();
      await releaseBlack();
      for (const page of [white, black]) {
        await expect(page.getByRole("link", { name: /Play again as/ })).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`/games/go/match/${game.id}/6$`));
      }
    } finally {
      await blackContext.close();
      await whiteContext.close();
      await removeMember(kuro.email);
      await removeMember(shiro.email);
    }
  });
});
